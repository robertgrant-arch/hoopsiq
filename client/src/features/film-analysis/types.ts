/**
 * features/film-analysis/types.ts
 *
 * Structured, bounded types for trustworthy basketball film analysis.
 *
 * DESIGN PRINCIPLES
 * ─────────────────
 * 1. Separate OBSERVATION (what was detected) from INFERENCE (what it means).
 * 2. Attach confidence to INFERENCES, not observations.
 * 3. Every inference must list its evidence explicitly.
 * 4. BoundedEventType is a constrained enum — no free-text classifications.
 * 5. Coach review is a first-class workflow, not an afterthought.
 * 6. suggestedCoachNote is short and templated — never hallucinated prose.
 *
 * WHAT WE INTENTIONALLY DO NOT INCLUDE
 * ──────────────────────────────────────
 * - Complex off-ball reads or weak-side scheme decisions (CV can't reliably detect these)
 * - Multi-possession pattern claims ("4 of 6 transition possessions...") — those require
 *   aggregate analysis built on top of individual AnalysisClips
 * - Specific performance percentages generated without real statistical grounding
 */

// ── Court zones ────────────────────────────────────────────────────────────────
//
// Geographic classification of court position. Kept intentionally coarse —
// fine-grained zone inference is unreliable from a single camera angle.

export type CourtZone =
  | "paint_left"      | "paint_right"      | "paint_center"
  | "midrange_left"   | "midrange_right"   | "midrange_center"
  | "arc_left"        | "arc_right"        | "arc_center"
  | "short_corner_left" | "short_corner_right"
  | "backcourt"       | "transition"       | "half_court"
  | "unknown";

export const COURT_ZONE_LABELS: Record<CourtZone, string> = {
  paint_left:           "Paint (L)",
  paint_right:          "Paint (R)",
  paint_center:         "Paint (C)",
  midrange_left:        "Mid-range (L)",
  midrange_right:       "Mid-range (R)",
  midrange_center:      "Mid-range (C)",
  arc_left:             "3PT Arc (L)",
  arc_right:            "3PT Arc (R)",
  arc_center:           "3PT Arc (C)",
  short_corner_left:    "Short Corner (L)",
  short_corner_right:   "Short Corner (R)",
  backcourt:            "Backcourt",
  transition:           "Transition",
  half_court:           "Half Court",
  unknown:              "Unknown",
};

// ── Bounded event types ────────────────────────────────────────────────────────
//
// Constrained classification vocabulary. Adding a new type here is a deliberate
// product decision, not an ad-hoc label. This prevents drift into unmeasured
// "great basketball IQ" style classifications.
//
// Organized by CV reliability tier:
//   Tier 1 (HIGH reliability): ball trajectory + rim contact detectable
//   Tier 2 (MEDIUM reliability): player movement patterns + direction
//   Tier 3 (LOWER reliability): coordination between multiple players

// Tier 1 — Shot events
export type ShotEventType =
  | "shot_made_2"    | "shot_missed_2"
  | "shot_made_3"    | "shot_missed_3"
  | "free_throw_made"| "free_throw_missed"
  | "and_one_attempt";

// Tier 1 — Ball possession changes
export type PossessionEventType =
  | "turnover_live_ball"
  | "turnover_out_of_bounds"
  | "turnover_shot_clock"
  | "steal"
  | "block";

// Tier 2 — Individual offensive actions
export type OffensiveActionType =
  | "drive_left"          | "drive_right"
  | "shot_off_dribble"    | "catch_and_shoot"
  | "post_up"             | "cut_basket"
  | "screen_set"          | "pass_completed"
  | "pass_lob";

// Tier 2 — Individual defensive actions
export type DefensiveActionType =
  | "closeout"
  | "on_ball_defense"
  | "help_rotation"
  | "contest_shot"
  | "box_out";

// Tier 2 — Transition
export type TransitionEventType =
  | "transition_offense"
  | "transition_defense"
  | "fast_break_attempt";

export type BoundedEventType =
  | ShotEventType
  | PossessionEventType
  | OffensiveActionType
  | DefensiveActionType
  | TransitionEventType;

export const EVENT_LABELS: Record<BoundedEventType, string> = {
  shot_made_2:          "2PT Make",
  shot_missed_2:        "2PT Miss",
  shot_made_3:          "3PT Make",
  shot_missed_3:        "3PT Miss",
  free_throw_made:      "FT Made",
  free_throw_missed:    "FT Missed",
  and_one_attempt:      "And-One Attempt",
  turnover_live_ball:   "Live Ball Turnover",
  turnover_out_of_bounds: "Out-of-Bounds TO",
  turnover_shot_clock:  "Shot Clock Violation",
  steal:                "Steal",
  block:                "Block",
  drive_left:           "Drive Left",
  drive_right:          "Drive Right",
  shot_off_dribble:     "Pull-Up",
  catch_and_shoot:      "Catch & Shoot",
  post_up:              "Post-Up",
  cut_basket:           "Basket Cut",
  screen_set:           "Screen Set",
  pass_completed:       "Pass",
  pass_lob:             "Lob",
  closeout:             "Closeout",
  on_ball_defense:      "On-Ball Defense",
  help_rotation:        "Help Rotation",
  contest_shot:         "Shot Contest",
  box_out:              "Box-Out",
  transition_offense:   "Transition (Off)",
  transition_defense:   "Transition (Def)",
  fast_break_attempt:   "Fast Break",
};

// ── Observation ────────────────────────────────────────────────────────────────
//
// What the vision system DIRECTLY DETECTED. Objective, low-inference.
// Descriptions use plain language about what is visually happening, not
// what it "means" in basketball terms.

export type ObservationType =
  | "player_movement"       // specific directional movement of a player
  | "ball_position"         // where the ball is at a given frame
  | "ball_trajectory"       // arc / direction of ball through air
  | "rim_contact"           // ball hitting rim or net
  | "player_proximity"      // two players within a threshold distance
  | "player_velocity"       // speed of player movement
  | "possession_change"     // ball changes hands between teams
  | "shot_attempt"          // player raises ball overhead toward basket
  | "player_down"           // player on the floor
  | "formation_detected";   // broad formation snapshot (low confidence)

export type Observation = {
  type:         ObservationType;
  description:  string;       // Plain English. What was seen. No interpretation.
  startMs:      number;
  endMs:        number;
  frameMs?:     number;       // specific frame of peak detection, if applicable
  courtZone?:   CourtZone;
  playerTrackId?: string;     // links to TrackedPlayer entity
  detectionConfidence: number; // 0–1, CV detection confidence only
};

// ── Evidence item ──────────────────────────────────────────────────────────────
//
// A specific piece of evidence that supports an inference.
// "What makes us think this is a drive_left and not a post_up?"

export type EvidenceStrength = "strong" | "moderate" | "weak";

export type EvidenceItem = {
  type:       "frame_observation" | "trajectory_analysis" | "player_velocity" | "proximity_check" | "possession_state" | "zone_entry";
  description: string;        // Specific, bounded description of this evidence
  frameMs?:   number;         // Frame where this evidence is strongest
  strength:   EvidenceStrength;
};

// ── Inference ─────────────────────────────────────────────────────────────────
//
// The system's interpretation of the observations. This is where uncertainty lives.
// A claim is only an inference if it has:
//   - a bounded event type (from the constrained vocabulary above)
//   - a confidence score
//   - at least one piece of evidence

export type ConfidenceTier = "high" | "medium" | "low";

export function confidenceTier(score: number): ConfidenceTier {
  if (score >= 0.85) return "high";
  if (score >= 0.60) return "medium";
  return "low";
}

export type Inference = {
  eventType:          BoundedEventType;
  subLabel?:          string;            // Optional specificity: "contact layup" for shot_missed_2
  confidence:         number;            // 0–1
  tier:               ConfidenceTier;
  evidenceItems:      EvidenceItem[];
  alternatives?:      { eventType: BoundedEventType; confidence: number }[];
  // If alternatives[0].confidence is within 15% of primary, the model is
  // uncertain and the coach MUST review.
  requiresReview:     boolean;
};

// ── Coach review ───────────────────────────────────────────────────────────────

export type CoachReviewStatus =
  | "pending"               // Not yet reviewed
  | "confirmed"             // Coach verified the inference is correct
  | "edited"                // Coach corrected the event type
  | "rejected"              // Coach flagged as incorrect / not relevant
  | "flagged_for_teaching"  // Will become a teaching point / player assignment
  | "uncertain";            // Coach reviewed but is unsure — still needs attention

// Structured teaching annotation — only set when status === "flagged_for_teaching".
// Free-form prose is not the source of truth; skill + instruction are separate fields.
export type TeachingPoint = {
  skill:       string;                          // e.g. "Left-hand finishing under contact"
  instruction: string;                          // e.g. "Stay vertical through contact, trust left hand"
  clipUsage:   "example" | "counter_example";  // positive rep or cautionary example
};

// ── Generated teaching point ──────────────────────────────────────────────────
//
// A richer object derived from a flagged_for_teaching clip.
// Only generated from coach-reviewed analysis — never from raw spotter output.

/** Whether this teaching point is ready to send to an athlete */
export type FeedbackStatus = "ready" | "needs_player" | "draft" | "dispatched";

export type GeneratedTeachingPoint = {
  id:        string;   // = clip annotation ID
  clipId:    string;   // explicit alias for downstream consumers
  sessionId: string;
  timestamp: string;   // formatted "2:14" — links back to video position
  startMs:   number;
  endMs:     number;

  // Coach-entered (from flagged_for_teaching review form)
  skill:       string;   // skill or concept this clip illustrates
  instruction: string;   // coach-facing technical language
  clipUsage:   "example" | "counter_example";

  // Derived — inferred from the clip's classification and skill text
  category:         string;    // IDP vocabulary: "Finishing" | "Shooting" | "Defense" | …
  tags:             string[];  // secondary descriptors (≤4), includes category

  // Simplified for athlete audience — short, templated, never hallucinated prose
  playerFacingText: string;

  // Feedback workflow state
  feedbackStatus: FeedbackStatus; // "ready" | "needs_player" | "dispatched" | "draft"

  // Dispatch traceability — set when POST /teaching-points/:id/dispatch succeeds
  dispatched:        boolean;
  coachingActionId?: string;   // coaching_actions.id — links to player-dev record
  dispatchedAt?:     string;   // ISO timestamp

  // Context
  inferredEventType: string;   // effective event type (coach edit wins)
  coachNote?:        string;   // from coachDecision.note if set
  reviewedBy:        string;
  reviewedAt:        string;   // ISO timestamp
};

export type CoachDecision = {
  status:            CoachReviewStatus;
  editedEventType?:  BoundedEventType;  // Set when status === "edited"
  note?:             string;
  teachingPoint?:    TeachingPoint;     // Set when status === "flagged_for_teaching"
  reviewedAt:        string;            // ISO timestamp
  reviewedBy:        string;            // userId
  // Dispatch traceability — written when POST /teaching-points/:id/dispatch succeeds
  dispatchedAt?:      string;           // ISO timestamp
  coachingActionId?:  string;           // coaching_actions.id
};

// ── Suggested coaching note templates ─────────────────────────────────────────
//
// Short, structured, templated. Not hallucinated prose.
// Built from: player name + event type + court zone + timestamp.

export type SuggestedNoteTemplate = {
  eventType:   BoundedEventType;
  template:    string; // {player}, {timestamp}, {zone} are interpolation slots
};

export const COACHING_NOTE_TEMPLATES: SuggestedNoteTemplate[] = [
  { eventType: "shot_missed_2",         template: "Review finish at {timestamp} — {player} in {zone}" },
  { eventType: "shot_missed_3",         template: "Shot selection at {timestamp} — {player} from {zone}" },
  { eventType: "turnover_live_ball",    template: "Live ball turnover at {timestamp} — {player} in {zone}" },
  { eventType: "turnover_out_of_bounds",template: "Ball out at {timestamp} — {player} in {zone}" },
  { eventType: "drive_left",            template: "Left-hand drive at {timestamp} — watch {player} body control" },
  { eventType: "drive_right",           template: "Right-hand drive at {timestamp} — review contact decision" },
  { eventType: "closeout",              template: "Closeout mechanics at {timestamp} — {player} from {zone}" },
  { eventType: "help_rotation",         template: "Help rotation at {timestamp} — check {player} positioning" },
  { eventType: "on_ball_defense",       template: "On-ball defense at {timestamp} — {player} stance and feet" },
  { eventType: "steal",                 template: "Positive play at {timestamp} — {player} reads the ball" },
  { eventType: "shot_made_2",           template: "Good finish at {timestamp} — {player} in {zone}" },
  { eventType: "block",                 template: "Block at {timestamp} — review {player} timing" },
];

export function buildSuggestedNote(
  eventType: BoundedEventType,
  player: string | null,
  zone: CourtZone | null,
  timestamp: string,
): string {
  const tmpl = COACHING_NOTE_TEMPLATES.find((t) => t.eventType === eventType);
  if (!tmpl) return `Review play at ${timestamp}`;
  return tmpl.template
    .replace("{player}", player ?? "player")
    .replace("{timestamp}", timestamp)
    .replace("{zone}", zone ? COURT_ZONE_LABELS[zone] : "this zone");
}

// ── Analysis pipeline status ───────────────────────────────────────────────────
//
// Tracks WHERE IN THE PIPELINE a clip is — distinct from CoachReviewStatus,
// which tracks what the coach has done. A clip can be `inferred` (pipeline done)
// but still `pending` from the coach's perspective.
//
// Lifecycle:
//   pending → observed → inferred → needs_review? → (approved | corrected | rejected)
//
//   pending:      clip ingested, analysis not yet started
//   observed:     observation layer complete — detections recorded, no inference yet
//   inferred:     inference complete — event type + evidence attached
//   needs_review: requiresReview=true OR coach manually flagged
//   approved:     coach confirmed the inference (coachDecision.status=confirmed)
//   corrected:    coach edited the label (coachDecision.status=edited)
//   rejected:     coach rejected as irrelevant/wrong (coachDecision.status=rejected)

export type AnalysisStatus =
  | "pending"
  | "observed"
  | "inferred"
  | "needs_review"
  | "approved"
  | "corrected"
  | "rejected";

export const ANALYSIS_STATUS_LABELS: Record<AnalysisStatus, string> = {
  pending:      "Pending",
  observed:     "Observed",
  inferred:     "Inferred — awaiting review",
  needs_review: "Needs review",
  approved:     "Approved",
  corrected:    "Coach corrected",
  rejected:     "Rejected",
};

/** Derive AnalysisStatus from the pipeline state + coach decision. */
export function deriveAnalysisStatus(
  hasObservations: boolean,
  hasInference: boolean,
  requiresReview: boolean,
  coachStatus: CoachReviewStatus | null,
): AnalysisStatus {
  if (coachStatus === "confirmed")             return "approved";
  if (coachStatus === "edited")                return "corrected";
  if (coachStatus === "rejected")              return "rejected";
  if (!hasObservations)                        return "pending";
  if (!hasInference)                           return "observed";
  if (requiresReview || coachStatus === null)  return "needs_review";
  return "inferred";
}

// ── AnalysisClip ───────────────────────────────────────────────────────────────
//
// The primary unit of structured analysis. One timestamped event, fully
// decomposed into observations + inference + coach review.

export type AnalysisClip = {
  id:            string;
  sessionId:     string;

  // Pipeline lifecycle — derived from observation + inference + coachDecision
  analysisStatus: AnalysisStatus;

  // Time range
  startMs:       number;
  endMs:         number;
  timestamp:     string;       // formatted display: "2:14"

  // Player attribution — may be null if roster mapping hasn't confirmed it
  primaryPlayerId:    string | null;
  primaryPlayerName:  string | null;
  primaryPlayerJersey: string | null;
  teamSide:           "home" | "away" | "unknown";

  // Decomposed analysis
  observations:  Observation[];
  inference:     Inference;

  // Original AI classification snapshot — preserved separately from coach override.
  // null = clip has not been classified yet (still at spotter confidence level).
  // When coachDecision.editedEventType differs from originalInference.eventType,
  // both are shown in the UI so the coach's correction is explicit.
  originalInference: {
    eventType:   BoundedEventType;
    confidence:  number;
    tier:        ConfidenceTier;
    source:      string;         // "coach_confirmed_v1" | "coach_edited_v1" etc.
  } | null;

  // Suggested output (short, templated — not prose)
  suggestedCoachNote: string | null;
  linkedSkillCategory: string | null; // maps to assessment categories

  // Coach review state
  coachDecision: CoachDecision | null; // null = pending

  // UI helpers
  clipHref?: string; // link to clip player
};

// ── Session analysis summary ───────────────────────────────────────────────────
//
// Aggregate counts derived from AnalysisClips — no prose summary generation.

export type SessionAnalysisSummary = {
  sessionId:        string;
  totalClips:       number;
  pendingReview:    number;
  confirmed:        number;
  requiresAttention: number;   // low confidence OR coach flagged
  byEventType:      Partial<Record<BoundedEventType, number>>;
  byPlayer:         Record<string, number>;  // playerId → clip count
  analysisVersion:  string;
  processedAt:      string;
};
