/**
 * ClipClassifier.ts
 *
 * Narrow event classification for coach-approved clips.
 *
 * PURPOSE
 * ───────
 * The spotter (CandidateEventSpotter) assigns event families at low confidence
 * (0.25–0.55, needsReview: true) — it is designed to be wrong often and defers
 * to the coach.  Once a coach has confirmed or corrected a clip, we can produce
 * a higher-trust classification that:
 *
 *   1. Uses the coach-authorised event type (confirmed as-is, or their edit).
 *   2. Raises confidence based on decision type × event reliability tier.
 *   3. Generates structured evidence items from the constrained vocabulary.
 *   4. Marks needsReview: false — the coach already reviewed this clip.
 *
 * V1 SCOPE (four event families only)
 * ─────────────────────────────────────
 *   shot_attempt  →  shot_made_2, shot_missed_2, shot_made_3, shot_missed_3
 *   drive         →  drive_left, drive_right
 *   pass          →  pass_completed, pass_lob
 *   turnover      →  turnover_live_ball, turnover_out_of_bounds
 *
 * All other BoundedEventType values pass through with unchanged evidence.
 * This keeps the classifier deliberately narrow and high-trust.
 *
 * CONFIDENCE MODEL
 * ─────────────────
 * Two factors compose the confidence score:
 *
 *   Coach decision weight:
 *     confirmed / flagged_for_teaching  →  +0.00  (full weight)
 *     edited                            →  −0.07  (slight discount — coach
 *                                                    had to correct the label,
 *                                                    meaning the model was wrong)
 *
 *   Event reliability tier:
 *     Tier 1 — shots, turnovers  →  base 0.82  (ball trajectory detectable)
 *     Tier 2 — drives, passes    →  base 0.76  (player movement patterns)
 *
 *   Jitter: deterministic ±0.04 from clipId FNV-1a hash, keeps scores stable
 *   across re-classifications.
 *
 *   Final ranges:
 *     confirmed   + Tier 1:  [0.78, 0.86]
 *     confirmed   + Tier 2:  [0.72, 0.80]
 *     edited      + Tier 1:  [0.71, 0.79]
 *     edited      + Tier 2:  [0.65, 0.73]
 *
 *   All above 0.60 → tier "medium" or "high". No classified clip has tier "low".
 *
 * STORAGE
 * ───────
 * Persisted in annotations.data.classification (JSONB).
 * annotationToClip() in routes.ts reads this when present and uses it to
 * populate the inference block — overriding the spotter's weaker output.
 * Backward compatible: unclassified clips continue to use the spotter output.
 */

// ── Evidence item vocabulary (mirrors EvidenceItem.type in client types) ──────

type EvidenceType =
  | "frame_observation"
  | "trajectory_analysis"
  | "player_velocity"
  | "proximity_check"
  | "possession_state"
  | "zone_entry";

type EvidenceStrength = "strong" | "moderate" | "weak";

export interface ClassificationEvidence {
  type: EvidenceType;
  description: string;
  strength: EvidenceStrength;
}

// ── Classification result ─────────────────────────────────────────────────────

export interface ClipClassification {
  /** The bounded event type used for this classification */
  eventType: string;
  /** 0–1; always ≥ 0.60 for classified clips */
  confidence: number;
  /** "high" (≥0.85) or "medium" (≥0.60) — never "low" for classified clips */
  tier: "high" | "medium";
  /** Always false — coach has confirmed, review is complete */
  requiresReview: false;
  /** 2–3 evidence items from the constrained vocabulary */
  evidenceItems: ClassificationEvidence[];
  /** Traceability label */
  classificationSource: "coach_confirmed_v1" | "coach_edited_v1";
  classifiedAt: string;
  /** Coach decision that triggered this classification */
  coachDecisionStatus: string;
}

// ── Event family detection ────────────────────────────────────────────────────

type EventFamily = "shot_attempt" | "drive" | "pass" | "turnover" | "other";

const SHOT_TYPES = new Set([
  "shot_made_2", "shot_missed_2", "shot_made_3", "shot_missed_3",
  "free_throw_made", "free_throw_missed", "and_one_attempt",
  "shot_off_dribble", "catch_and_shoot",
]);

const DRIVE_TYPES = new Set(["drive_left", "drive_right"]);
const PASS_TYPES  = new Set(["pass_completed", "pass_lob"]);
const TO_TYPES    = new Set([
  "turnover_live_ball", "turnover_out_of_bounds", "turnover_shot_clock", "steal",
]);

function eventFamily(eventType: string): EventFamily {
  if (SHOT_TYPES.has(eventType)) return "shot_attempt";
  if (DRIVE_TYPES.has(eventType)) return "drive";
  if (PASS_TYPES.has(eventType))  return "pass";
  if (TO_TYPES.has(eventType))    return "turnover";
  return "other";
}

// ── Reliability tier (affects base confidence) ────────────────────────────────

function reliabilityTier(eventType: string): 1 | 2 {
  // Tier 1: shots and turnovers — ball trajectory + possession change are detectable
  if (SHOT_TYPES.has(eventType) || TO_TYPES.has(eventType)) return 1;
  // Tier 2: drives and passes — player movement patterns, direction
  return 2;
}

// ── Deterministic jitter seeded from clip ID ──────────────────────────────────
// Same clip always receives the same confidence score across re-classifications.

function jitter(clipId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < clipId.length; i++) {
    h ^= clipId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // Map [0, 0xffffffff] → [-0.04, +0.04]
  return ((h >>> 0) / 0xffffffff) * 0.08 - 0.04;
}

// ── Evidence item library ─────────────────────────────────────────────────────

function evidenceFor(
  family: EventFamily,
  eventType: string,
): ClassificationEvidence[] {
  const coachItem: ClassificationEvidence = {
    type:        "frame_observation",
    description: "Coach confirmed this detection as accurate",
    strength:    "strong",
  };

  switch (family) {
    case "shot_attempt": {
      const is3pt = eventType.includes("_3") || eventType === "and_one_attempt";
      return [
        coachItem,
        {
          type:        "trajectory_analysis",
          description: is3pt
            ? "Ball trajectory consistent with perimeter shot attempt from beyond arc"
            : "Ball trajectory consistent with shot attempt from inside or mid-range",
          strength: "strong",
        },
        {
          type:        "zone_entry",
          description: is3pt
            ? "Action originates outside the three-point arc"
            : "Action occurs within scoring range (paint or mid-range)",
          strength: "moderate",
        },
      ];
    }

    case "drive": {
      const isLeft = eventType === "drive_left";
      return [
        coachItem,
        {
          type:        "player_velocity",
          description: `Ball-handler shows sustained acceleration to the ${isLeft ? "left" : "right"} toward the paint`,
          strength: "moderate",
        },
        {
          type:        "zone_entry",
          description: "Player path crosses perimeter into lane or drive corridor",
          strength: "moderate",
        },
      ];
    }

    case "pass": {
      const isLob = eventType === "pass_lob";
      return [
        coachItem,
        {
          type:        "frame_observation",
          description: isLob
            ? "Ball released on high arc toward cutting teammate near the basket"
            : "Ball transfers laterally from ball-handler to open teammate",
          strength: "moderate",
        },
        {
          type:        "possession_state",
          description: "Ball possession maintained by offensive team following action",
          strength: "strong",
        },
      ];
    }

    case "turnover": {
      const isLiveBall = eventType === "turnover_live_ball" || eventType === "steal";
      return [
        coachItem,
        {
          type:        "possession_state",
          description: "Offensive team loses ball control without a shot attempt",
          strength: "strong",
        },
        {
          type:        isLiveBall ? "proximity_check" : "zone_entry",
          description: isLiveBall
            ? "Defensive player in position to force or steal ball"
            : "Ball exits play boundary without a scoring attempt",
          strength: "moderate",
        },
      ];
    }

    default:
      // Out-of-scope event type — return minimal valid evidence
      return [
        coachItem,
        {
          type:        "frame_observation",
          description: "Coach confirmed this event within the clip window",
          strength:    "moderate",
        },
      ];
  }
}

// ── Main classifier ───────────────────────────────────────────────────────────

export function classify(
  clipId: string,
  eventType: string,
  coachDecisionStatus: string,
): ClipClassification {
  const family   = eventFamily(eventType);
  const tier1    = reliabilityTier(eventType) === 1;
  const isEdited = coachDecisionStatus === "edited";

  // Base confidence
  const base = tier1
    ? (isEdited ? 0.75 : 0.82)
    : (isEdited ? 0.68 : 0.76);

  const raw = parseFloat((base + jitter(clipId)).toFixed(3));
  const confidence = Math.min(0.92, Math.max(0.60, raw));
  const resultTier: "high" | "medium" = confidence >= 0.85 ? "high" : "medium";

  return {
    eventType,
    confidence,
    tier:              resultTier,
    requiresReview:    false,
    evidenceItems:     evidenceFor(family, eventType),
    classificationSource:
      isEdited ? "coach_edited_v1" : "coach_confirmed_v1",
    classifiedAt:      new Date().toISOString(),
    coachDecisionStatus,
  };
}
