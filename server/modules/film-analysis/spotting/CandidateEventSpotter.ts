/**
 * CandidateEventSpotter.ts
 *
 * Deterministic, rules-based candidate event generator for basketball sessions.
 *
 * DESIGN INTENT
 * ─────────────
 * This is NOT a computer-vision pipeline. It is a structured placeholder that:
 *   1. Produces well-formed CandidateEvent objects tied to real session IDs.
 *   2. Gives the coach-review workflow (AnalysisClipCard) real data to operate on.
 *   3. Is 100% deterministic — the same session always produces the same candidates.
 *   4. Is clearly labelled so coaches know every candidate requires review.
 *   5. Can be swapped for a real temporal-spotting model without changing the
 *      storage layer or the review UI.
 *
 * EVENT FAMILIES (scoped to the four requested families)
 * ───────────────────────────────────────────────────────
 *   shot_attempt  →  Make2 / Miss2 / Make3 / Miss3
 *   drive         →  Drive
 *   pass          →  Pass
 *   turnover      →  Turnover
 *
 * ALGORITHM
 * ─────────
 *   - Divide the session into pseudo-possession windows of 15-21 s (jittered).
 *   - Assign one event candidate per window via weighted sampling.
 *   - Confidence is kept deliberately low (0.25–0.55) — all candidates set
 *     needsReview: true and candidateSource: "rule_based_spotter_v1".
 *
 * STORAGE
 * ───────
 *   Candidates are stored as annotations rows:
 *     kind    = "shot" | "play"  (existing annotationKindEnum values — no migration)
 *     source  = "ai"
 *     data    = { eventType, eventFamily, confidence, needsReview, candidateSource }
 *   annotationToEvent() in db-service.ts reads data.eventType and returns them
 *   as DetectedEvent objects via GET /sessions/:id/events.
 */

import { nanoid } from "nanoid";
import { DetectedEventType } from "../../../../shared/film-analysis/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventFamily = "shot_attempt" | "drive" | "pass" | "turnover";

export const SPOTTER_VERSION = "rule_based_spotter_v1" as const;

export interface CandidateEvent {
  /** Unique row id for the annotation */
  id: string;
  /** Event family — the human-readable grouping */
  eventFamily: EventFamily;
  /** Specific event type (maps to DetectedEventType enum) */
  eventType: DetectedEventType;
  /** Annotation kind for DB storage (no migration needed — uses existing enum) */
  annotationKind: "shot" | "play";
  /** Human-readable label shown in the review UI */
  label: string;
  /** Start of event window in milliseconds from session start */
  startMs: number;
  /** End of event window in milliseconds from session start */
  endMs: number;
  /** Confidence score: 0–1. All spotter candidates are 0.25–0.55. */
  confidence: number;
  /** Always true for rule-based candidates — requires coach confirmation */
  needsReview: true;
}

// ── Event family definitions ──────────────────────────────────────────────────

interface EventSpec {
  family: EventFamily;
  type: DetectedEventType;
  kind: "shot" | "play";
  label: string;
  /** Typical clip duration in ms */
  durationMs: number;
  /** Relative weight for sampling (higher = more frequent) */
  weight: number;
  /** Base confidence range [min, max] */
  confidenceRange: [number, number];
}

const EVENT_SPECS: EventSpec[] = [
  // ── Shot attempts (40 % of possessions end in a shot) ──────────────────
  {
    family: "shot_attempt",
    type: DetectedEventType.Make2,
    kind: "shot",
    label: "2PT Make",
    durationMs: 7_000,
    weight: 12,
    confidenceRange: [0.42, 0.55],
  },
  {
    family: "shot_attempt",
    type: DetectedEventType.Miss2,
    kind: "shot",
    label: "2PT Miss",
    durationMs: 7_000,
    weight: 14,
    confidenceRange: [0.40, 0.53],
  },
  {
    family: "shot_attempt",
    type: DetectedEventType.Make3,
    kind: "shot",
    label: "3PT Make",
    durationMs: 7_000,
    weight: 5,
    confidenceRange: [0.42, 0.55],
  },
  {
    family: "shot_attempt",
    type: DetectedEventType.Miss3,
    kind: "shot",
    label: "3PT Miss",
    durationMs: 7_000,
    weight: 9,
    confidenceRange: [0.38, 0.52],
  },
  // ── Drive (ball-handler attacks the paint) ─────────────────────────────
  {
    family: "drive",
    type: DetectedEventType.Drive,
    kind: "play",
    label: "Drive",
    durationMs: 8_000,
    weight: 22,
    confidenceRange: [0.30, 0.45],
  },
  // ── Pass (ball movement event) ─────────────────────────────────────────
  {
    family: "pass",
    type: DetectedEventType.Pass,
    kind: "play",
    label: "Pass",
    durationMs: 4_000,
    weight: 20,
    confidenceRange: [0.25, 0.38],
  },
  // ── Turnover (possession change without a shot) ────────────────────────
  {
    family: "turnover",
    type: DetectedEventType.Turnover,
    kind: "play",
    label: "Turnover",
    durationMs: 5_000,
    weight: 18,
    confidenceRange: [0.32, 0.48],
  },
];

const TOTAL_WEIGHT = EVENT_SPECS.reduce((s, e) => s + e.weight, 0);

// ── Deterministic pseudo-random number generator ──────────────────────────────
// Linear Congruential Generator seeded from the session ID.
// The same session always produces identical candidates.

function hashSeed(sessionId: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < sessionId.length; i++) {
    h ^= sessionId.charCodeAt(i);
    h = (h * 0x01000193) >>> 0; // FNV prime, keep 32-bit
  }
  return h >>> 0;
}

function makeLcg(seed: number) {
  let s = seed >>> 0;
  return {
    /** Returns a float in [0, 1) */
    next(): number {
      s = ((1_664_525 * s + 1_013_904_223) & 0xffffffff) >>> 0;
      return s / 0x100000000;
    },
    /** Returns an integer in [min, max] */
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Returns a float in [min, max) */
    float(min: number, max: number): number {
      return min + this.next() * (max - min);
    },
  };
}

// ── Core spotting logic ───────────────────────────────────────────────────────

export interface SpotterInput {
  sessionId: string;
  orgId: string;
  jobId: string;
  /** Session video duration in seconds. If 0 or missing, defaults to 2400 (40 min). */
  durationSec: number;
}

/**
 * Generate candidate event windows for a session.
 * Pure function — no side effects, fully deterministic from sessionId.
 */
export function generateCandidates(input: SpotterInput): CandidateEvent[] {
  const durationSec = input.durationSec > 0 ? input.durationSec : 2400;
  const durationMs = durationSec * 1_000;

  // Leave 5 s at start (tip-off) and 5 s at end (buzzer).
  const startBoundMs = 5_000;
  const endBoundMs = durationMs - 5_000;

  if (endBoundMs <= startBoundMs) return [];

  const rng = makeLcg(hashSeed(input.sessionId));
  const candidates: CandidateEvent[] = [];
  let cursorMs = startBoundMs;

  while (cursorMs < endBoundMs) {
    // Pick event spec via weighted sampling
    const spec = weightedPick(EVENT_SPECS, rng.next());
    if (!spec) break;

    // The event window starts at cursor + a small pre-roll (0–2 s)
    const preRollMs = rng.int(0, 2_000);
    const eventStartMs = cursorMs + preRollMs;
    const eventEndMs = Math.min(eventStartMs + spec.durationMs, endBoundMs);

    if (eventStartMs >= endBoundMs) break;

    const confidence = rng.float(spec.confidenceRange[0], spec.confidenceRange[1]);

    candidates.push({
      id: deterministicId(input.sessionId, candidates.length),
      eventFamily: spec.family,
      eventType: spec.type,
      annotationKind: spec.kind,
      label: spec.label,
      startMs: eventStartMs,
      endMs: eventEndMs,
      confidence: parseFloat(confidence.toFixed(3)),
      needsReview: true,
    });

    // Advance cursor by one possession length (15–21 s)
    const possessionMs = rng.int(15_000, 21_000);
    cursorMs += possessionMs;
  }

  return candidates;
}

function weightedPick(specs: EventSpec[], rand: number): EventSpec | null {
  let threshold = rand * TOTAL_WEIGHT;
  for (const s of specs) {
    threshold -= s.weight;
    if (threshold <= 0) return s;
  }
  return specs[specs.length - 1] ?? null;
}

/**
 * Stable ID derived from sessionId + index so re-runs produce the same IDs.
 * Uses a prefix so they're identifiable in logs.
 */
function deterministicId(sessionId: string, index: number): string {
  // nanoid is random — we want stable IDs so we use a hash-based approach.
  // Keep it short: "cand_" + 8 hex chars from hash.
  const seed = hashSeed(`${sessionId}_${index}`);
  return `cand_${seed.toString(16).padStart(8, "0")}`;
}

// ── Annotation row builder ────────────────────────────────────────────────────

/**
 * Convert a CandidateEvent to the shape expected by db.insert(annotations).
 */
export function toAnnotationRow(
  c: CandidateEvent,
  ctx: { sessionId: string; orgId: string; jobId: string },
) {
  return {
    id: c.id,
    orgId: ctx.orgId,
    sessionId: ctx.sessionId,
    jobId: ctx.jobId,
    kind: c.annotationKind as "shot" | "play",
    source: "ai" as const,
    authorUserId: "system",
    startMs: c.startMs,
    endMs: c.endMs,
    label: c.label,
    body: null as null,
    data: {
      // annotationToEvent() in db-service reads data.eventType
      eventType: c.eventType,
      eventFamily: c.eventFamily,
      confidence: c.confidence,
      needsReview: c.needsReview,
      candidateSource: SPOTTER_VERSION,
      // Traceability
      jobId: ctx.jobId,
    },
    payload: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ── Summary helper ────────────────────────────────────────────────────────────

export interface SpotterSummary {
  total: number;
  byFamily: Record<EventFamily, number>;
  durationSec: number;
  version: typeof SPOTTER_VERSION;
}

export function summarize(
  candidates: CandidateEvent[],
  durationSec: number,
): SpotterSummary {
  const byFamily: Record<EventFamily, number> = {
    shot_attempt: 0,
    drive: 0,
    pass: 0,
    turnover: 0,
  };
  for (const c of candidates) {
    byFamily[c.eventFamily]++;
  }
  return { total: candidates.length, byFamily, durationSec, version: SPOTTER_VERSION };
}
