/**
 * features/growth-story/mock.ts
 *
 * Realistic mock data for the Growth Story / development momentum slice.
 *
 * These wins and momentum records are derived from the same assessment
 * categories as features/assessments/ and are structured so they can
 * be replaced by a real GET /api/player/growth-story endpoint later.
 */

import type { GrowthStoryData, SkillWin, WeeklyMomentum, WorkingOnItem } from "./types";

export const MOCK_WINS: SkillWin[] = [
  {
    id:          "win-001",
    category:    "ball_handling",
    skillLabel:  "Ball Handling",
    emoji:       "✋",
    beforeScore: 5.8,
    afterScore:  7.2,
    delta:       1.4,
    periodLabel: "Last 30 Days",
    coachNote:
      "Marcus went from a hesitation dribbler to someone who can create space against any defender in half-court. The left-hand work is paying off — he's no longer predictable.",
    coachName:    "Coach Williams",
    filmEvidence: { clipCount: 4, label: "4 clips tagged by coach" },
    verifiedAt:  "2026-05-12T10:00:00Z",
  },
  {
    id:          "win-002",
    category:    "defensive_habits",
    skillLabel:  "Defensive IQ",
    emoji:       "🛡️",
    beforeScore: 5.4,
    afterScore:  6.8,
    delta:       1.4,
    periodLabel: "Last 30 Days",
    coachNote:
      "Defensive positioning took a real leap this month. Starting to anticipate screens instead of reacting to them. Help-side awareness has crossed a real threshold.",
    coachName:    "Coach Williams",
    filmEvidence: { clipCount: 2, label: "2 clips tagged" },
    verifiedAt:  "2026-05-10T10:00:00Z",
  },
  {
    id:          "win-003",
    category:    "finishing",
    skillLabel:  "Contact Finishing",
    emoji:       "🏀",
    beforeScore: 4.4,
    afterScore:  5.0,
    delta:       0.6,
    periodLabel: "Last 14 Days",
    coachNote:
      "Still developing — but the Mikan drill work is showing up. Body control through contact is visibly better. Right-hand finishes in traffic are becoming reliable.",
    coachName:    "Coach Williams",
    filmEvidence: { clipCount: 1, label: "1 clip tagged" },
    verifiedAt:  "2026-05-15T10:00:00Z",
  },
];

export const MOCK_WORKING_ON: WorkingOnItem[] = [
  {
    category:     "footwork",
    skillLabel:   "Footwork",
    currentScore: 4,
    targetScore:  6,
    context:      "3 coaching actions open · Mikan + pivot drills assigned",
  },
  {
    category:     "shooting",
    skillLabel:   "Off-Dribble Shooting",
    currentScore: 6,
    targetScore:  8,
    context:      "DHO pull-up drill in WOD · 50 reps each side",
  },
];

export const MOCK_WEEKLY_MOMENTUM: WeeklyMomentum[] = [
  {
    weekLabel:         "May 12–18",
    drillsCompleted:   11,
    drillsAssigned:    12,
    checkInsSubmitted: 5,
    topWin:            "Ball Handling +0.4",
    coachHighlight:    "Best week of the season so far. The work is showing.",
  },
  {
    weekLabel:         "May 5–11",
    drillsCompleted:   9,
    drillsAssigned:    12,
    checkInsSubmitted: 4,
    topWin:            "Defensive IQ +0.3",
    coachHighlight:    null,
  },
  {
    weekLabel:         "Apr 28 – May 4",
    drillsCompleted:   10,
    drillsAssigned:    12,
    checkInsSubmitted: 5,
    topWin:            "Ball Handling +0.3",
    coachHighlight:    "Back-to-back strong weeks. Trajectory is real.",
  },
  {
    weekLabel:         "Apr 21–27",
    drillsCompleted:   7,
    drillsAssigned:    12,
    checkInsSubmitted: 3,
    topWin:            "Consistency building",
    coachHighlight:    null,
  },
];

export const MOCK_GROWTH_STORY: GrowthStoryData = {
  playerFirstName:     "Marcus",
  periodLabel:         "Last 30 Days",
  wins:                MOCK_WINS,
  workingOn:           MOCK_WORKING_ON,
  weeklyMomentum:      MOCK_WEEKLY_MOMENTUM,
  totalDrillsLogged:   47,
  checkInStreak:       14,
  drillCompletionRate: 0.83,
};
