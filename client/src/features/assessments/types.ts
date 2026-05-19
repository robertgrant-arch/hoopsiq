/**
 * features/assessments/types.ts
 *
 * Canonical types for the Assessments → IDP slice.
 * Covers: skill categories, coach/self scores, gap analysis, IDP focus areas.
 */

// ── Skill categories ─────────────────────────────────────────────────────────

export type AssessmentCategory =
  | "shooting"
  | "finishing"
  | "ball_handling"
  | "decision_making"
  | "footwork"
  | "defensive_habits"
  | "physical_readiness"
  | "discipline";

export const CATEGORY_META: Record<
  AssessmentCategory,
  { label: string; emoji: string; description: string }
> = {
  shooting:           { label: "Shooting",           emoji: "🎯", description: "Catch & shoot, off-dribble, free throws" },
  finishing:          { label: "Finishing",           emoji: "🏀", description: "Contact layups, floaters, drop steps" },
  ball_handling:      { label: "Ball Handling",       emoji: "✋", description: "Tight space, weak hand, pressure dribble" },
  decision_making:    { label: "Decision Making",     emoji: "🧠", description: "Reads, pace, turnovers, shot selection" },
  footwork:           { label: "Footwork",            emoji: "👟", description: "Pivots, triple threat, box-out, drop step" },
  defensive_habits:   { label: "Defensive Habits",   emoji: "🛡️", description: "Stance, positioning, help-side, closeouts" },
  physical_readiness: { label: "Physical Readiness",  emoji: "⚡", description: "Strength, conditioning, sleep, nutrition" },
  discipline:         { label: "Consistency",         emoji: "🔄", description: "Practice attendance, coachability, focus" },
};

export const ALL_CATEGORIES: AssessmentCategory[] = [
  "shooting", "finishing", "ball_handling", "decision_making",
  "footwork", "defensive_habits", "physical_readiness", "discipline",
];

// ── Score ─────────────────────────────────────────────────────────────────────

/** One category's scores — coach-assigned and player self-rated. */
export type AssessmentScore = {
  category:   AssessmentCategory;
  coachScore: number | null;   // 1-10, null = not yet assessed by coach
  selfScore:  number | null;   // 1-10, null = self-assessment not submitted
  lastCoachAssessedAt: string | null;
};

// ── Gap ───────────────────────────────────────────────────────────────────────

export type GapPriority = "critical" | "high" | "moderate" | "low";

/**
 * Computed gap between coach score and self score for one category.
 * gap > 0  → player overestimates (coach rates lower) → priority focus area
 * gap < 0  → player underestimates (coach rates higher) → confidence builder
 * gap ≈ 0  → aligned
 */
export type AssessmentGap = {
  category:   AssessmentCategory;
  coachScore: number;
  selfScore:  number;
  gap:        number;      // selfScore - coachScore (positive = player overestimates)
  absGap:     number;
  priority:   GapPriority;
  message:    string;      // human-readable summary
};

// ── Self-assessment ───────────────────────────────────────────────────────────

export type SelfAssessmentInput = Record<AssessmentCategory, number>;  // 1-10 per category

// ── IDP focus area ────────────────────────────────────────────────────────────

export type FocusAreaStatus = "active" | "completed" | "paused";

export type IDPMilestone = {
  id:          string;
  title:       string;
  completedAt: string | null;
};

export type IDPFocusArea = {
  id:           string;
  category:     AssessmentCategory;
  priority:     number;            // 1 = top
  currentScore: number;            // 1-10
  targetScore:  number;            // 1-10
  progressPct:  number;            // 0-100
  status:       FocusAreaStatus;
  coachNote:    string | null;
  linkedDrill:  string | null;     // drill description
  deadline:     string | null;     // "Jun 15"
  milestones:   IDPMilestone[];
};

// ── Slice payload ─────────────────────────────────────────────────────────────

export type AssessmentSliceData = {
  scores:                      AssessmentScore[];
  selfAssessmentSubmittedAt:   string | null;   // null = not yet submitted
  idpFocusAreas:               IDPFocusArea[];
};
