/**
 * features/assessments/mock.ts
 *
 * Realistic mock data and pure computation functions for the
 * Assessments → IDP slice.
 *
 * Used by hooks.ts while real API endpoints are wired up.
 */

import type {
  AssessmentScore,
  AssessmentGap,
  AssessmentCategory,
  GapPriority,
  IDPFocusArea,
  IDPMilestone,
  AssessmentSliceData,
  SelfAssessmentInput,
} from "./types";
import { ALL_CATEGORIES, CATEGORY_META } from "./types";

// ── Coach scores for Marcus Davis (PG, Barnegat Varsity 2026) ────────────────
// Sourced from the most recent assessment session — May 2026.

const COACH_SCORES: Record<AssessmentCategory, number> = {
  shooting:           6,
  finishing:          5,
  ball_handling:      7,
  decision_making:    6,
  footwork:           4,   // ← biggest development gap
  defensive_habits:   7,
  physical_readiness: 8,
  discipline:         7,
};

const LAST_ASSESSED = "2026-05-01";

// ── Player self-assessment (Marcus rated himself) ─────────────────────────────

export const MOCK_SELF_SCORES: SelfAssessmentInput = {
  shooting:           7,   // +1 vs coach → slight overestimate
  finishing:          6,   // +1 vs coach → slight overestimate
  ball_handling:      8,   // +1 vs coach → overestimate
  decision_making:    7,   // +1 vs coach → slight overestimate
  footwork:           6,   // +2 vs coach → BLIND SPOT (critical gap)
  defensive_habits:   6,   // -1 vs coach → underestimate (coach sees him better)
  physical_readiness: 8,   // aligned
  discipline:         8,   // +1 vs coach → slight overestimate
};

// ── Seed data ─────────────────────────────────────────────────────────────────

export const MOCK_ASSESSMENT_DATA: AssessmentSliceData = {
  selfAssessmentSubmittedAt: "2026-05-15T10:00:00Z",

  scores: ALL_CATEGORIES.map((cat) => ({
    category:            cat,
    coachScore:          COACH_SCORES[cat],
    selfScore:           MOCK_SELF_SCORES[cat],
    lastCoachAssessedAt: LAST_ASSESSED,
  })),

  idpFocusAreas: [
    {
      id:           "fa-footwork",
      category:     "footwork",
      priority:     1,
      currentScore: 4,
      targetScore:  6,
      progressPct:  28,
      status:       "active",
      deadline:     "Jun 15",
      coachNote:    "Your footwork breaks down under pressure. Fix the base and everything else gets easier.",
      linkedDrill:  "Chair drill pivot sequence · 15 min daily",
      milestones:   [
        { id: "m1", title: "Triple-threat footwork — 100 clean reps",        completedAt: null },
        { id: "m2", title: "Box-out footwork in 3 consecutive practices",    completedAt: null },
        { id: "m3", title: "Drop step — score on coach in 3/5 attempts",     completedAt: null },
      ],
    },
    {
      id:           "fa-finishing",
      category:     "finishing",
      priority:     2,
      currentScore: 5,
      targetScore:  7,
      progressPct:  40,
      status:       "active",
      deadline:     "Jul 1",
      coachNote:    "You're making progress — keep attacking the rim in live reps. The Mikan drill is showing up.",
      linkedDrill:  "Mikan drill · 5 sets of 10",
      milestones:   [
        { id: "m4", title: "Score 6/10 on contact layup eval",               completedAt: null },
        { id: "m5", title: "5 consecutive days of Mikan drill",              completedAt: "2026-05-12T00:00:00Z" },
      ],
    },
    {
      id:           "fa-shooting",
      category:     "shooting",
      priority:     3,
      currentScore: 6,
      targetScore:  8,
      progressPct:  15,
      status:       "active",
      deadline:     "Jul 15",
      coachNote:    "Your DHO reads are getting sharper. Focus on the 1-2 step rhythm this week.",
      linkedDrill:  "Pull-up off DHO · 50 reps each side",
      milestones:   [
        { id: "m6", title: "60% on pull-up shooting chart",                  completedAt: null },
        { id: "m7", title: "10-shot pull-up workout — 3x per week for 4wks", completedAt: null },
      ],
    },
  ],
};

// ── Version with no self-assessment submitted (used for empty state demo) ─────

export const MOCK_ASSESSMENT_DATA_NO_SELF: AssessmentSliceData = {
  ...MOCK_ASSESSMENT_DATA,
  selfAssessmentSubmittedAt: null,
  scores: MOCK_ASSESSMENT_DATA.scores.map((s) => ({ ...s, selfScore: null })),
};

// ── Pure computation functions ────────────────────────────────────────────────

/** Classify a priority based on the coach's score alone. */
function scoreToPriority(coachScore: number): GapPriority {
  if (coachScore <= 3) return "critical";
  if (coachScore <= 5) return "high";
  if (coachScore <= 7) return "moderate";
  return "low";
}

/** Human-readable gap interpretation. */
function gapMessage(gap: number, coachScore: number): string {
  if (gap > 2)  return "You're rating yourself significantly higher than your coach — focus area.";
  if (gap > 0)  return "Slight overestimate — your coach sees room for growth here.";
  if (gap === 0) return "Aligned — you and your coach agree on this skill.";
  if (gap > -2) return "Your coach rates you higher than you rate yourself — back yourself.";
  return "You're being tough on yourself — your coach sees real strength here.";
}

/**
 * Compute gap analysis from a score array that has both coach and self scores.
 * Returns only categories where both scores exist, sorted by priority.
 */
export function computeGaps(scores: AssessmentScore[]): AssessmentGap[] {
  const gaps: AssessmentGap[] = [];

  for (const s of scores) {
    if (s.coachScore === null || s.selfScore === null) continue;

    const gap    = s.selfScore - s.coachScore;  // positive = player overestimates
    const absGap = Math.abs(gap);

    gaps.push({
      category:   s.category,
      coachScore: s.coachScore,
      selfScore:  s.selfScore,
      gap,
      absGap,
      priority:   scoreToPriority(s.coachScore),
      message:    gapMessage(gap, s.coachScore),
    });
  }

  // Sort: critical first, then by lowest coach score within priority tier
  const ORDER: GapPriority[] = ["critical", "high", "moderate", "low"];
  return gaps.sort((a, b) => {
    const po = ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority);
    if (po !== 0) return po;
    return a.coachScore - b.coachScore;
  });
}

/**
 * From a sorted gap list, pick the top N categories to recommend as IDP focus areas.
 * Used when auto-generating an IDP from assessment results.
 */
export function recommendFocusAreas(
  gaps: AssessmentGap[],
  limit = 3,
): AssessmentGap[] {
  // Prefer gaps where coach score is low (most growth potential)
  return gaps
    .filter((g) => g.priority === "critical" || g.priority === "high")
    .slice(0, limit);
}

/**
 * Merge a submitted self-assessment into an existing score array.
 * Creates a new array (immutable) with selfScore populated.
 */
export function applySelfAssessment(
  scores: AssessmentScore[],
  input: SelfAssessmentInput,
): AssessmentScore[] {
  return scores.map((s) => ({
    ...s,
    selfScore: input[s.category] ?? s.selfScore,
  }));
}
