/**
 * features/growth-story/types.ts
 *
 * Types for the Growth Story / development momentum slice.
 *
 * A SkillWin is a coach-verified skill improvement — before/after scores,
 * a coach quote, and optional film evidence. These are the emotional core
 * of the development product: proof you got better.
 */

import type { AssessmentCategory } from "@/features/assessments/types";

// ── Verified skill win ─────────────────────────────────────────────────────

export type SkillWin = {
  id:           string;
  category:     AssessmentCategory;
  skillLabel:   string;           // "Ball Handling", "Contact Finishing"
  emoji:        string;
  beforeScore:  number;           // 1-10 at start of period
  afterScore:   number;           // 1-10 at end of period
  delta:        number;           // afterScore - beforeScore
  periodLabel:  string;           // "Last 30 Days", "This Season"
  coachNote:    string;           // coach's qualitative summary of the win
  coachName:    string;
  filmEvidence: { clipCount: number; label: string } | null;
  verifiedAt:   string;           // ISO
};

// ── Still in progress ─────────────────────────────────────────────────────

export type WorkingOnItem = {
  category:     AssessmentCategory;
  skillLabel:   string;
  currentScore: number;
  targetScore:  number;
  context:      string;           // "3 coaching actions open, 2 drills assigned"
};

// ── Weekly momentum ───────────────────────────────────────────────────────

export type WeeklyMomentum = {
  weekLabel:            string;   // "May 12–18"
  drillsCompleted:      number;
  drillsAssigned:       number;
  checkInsSubmitted:    number;
  topWin:               string;   // e.g. "Ball Handling +0.4"
  coachHighlight:       string | null;
};

// ── Full growth story payload ─────────────────────────────────────────────

export type GrowthStoryData = {
  playerFirstName:     string;
  periodLabel:         string;    // "Last 30 Days"
  wins:                SkillWin[];
  workingOn:           WorkingOnItem[];
  weeklyMomentum:      WeeklyMomentum[];
  totalDrillsLogged:   number;
  checkInStreak:       number;
  drillCompletionRate: number;   // 0-1
};
