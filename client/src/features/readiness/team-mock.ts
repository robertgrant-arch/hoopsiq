/**
 * Readiness / daily check-in mock data.
 *
 * Players submit a 30-second check-in: soreness, sleep, energy.
 * The system computes a readiness score and a traffic-light flag.
 * Coaches see the team dashboard before practice; players see their own history.
 *
 * Used by: PlayerCheckinPage, TeamReadinessPage (extended), CoachDashboard.
 */

export type ReadinessFlag = "green" | "yellow" | "red" | "restricted";

export type ReadinessEntry = {
  id: string;
  playerId: string;
  playerName: string;
  date: string; // ISO date yyyy-mm-dd
  /** 1 = no soreness, 5 = very sore */
  soreness: 1 | 2 | 3 | 4 | 5;
  /** 1 = terrible, 5 = great */
  sleep: 1 | 2 | 3 | 4 | 5;
  /** 1 = exhausted, 5 = fully energized */
  energy: 1 | 2 | 3 | 4 | 5;
  /** Optional free-text note from the player. */
  note?: string;
  /** 0–100 composite score: (sleep×3 + energy×3 + (6-soreness)×2) / 4 × 12.5 */
  readinessScore: number;
  flag: ReadinessFlag;
  /** True if the coach has already reviewed this entry. */
  coachReviewed: boolean;
  /** Optional override note from the coach. */
  coachNote?: string;
};

/** Compute the composite score and flag from raw inputs. */
export function computeReadiness(
  soreness: number,
  sleep: number,
  energy: number
): { score: number; flag: ReadinessFlag } {
  // Invert soreness so higher = better
  const invSoreness = 6 - soreness;
  const raw = (sleep * 3 + energy * 3 + invSoreness * 2) / 8; // 1–5 scale
  const score = Math.round(((raw - 1) / 4) * 100);
  const flag: ReadinessFlag =
    score >= 70 ? "green" : score >= 45 ? "yellow" : "red";
  return { score, flag };
}

export type TeamReadinessSummary = {
  date: string;
  totalPlayers: number;
  submitted: number;
  green: number;
  yellow: number;
  red: number;
  restricted: number;
  avgScore: number;
  entries: ReadinessEntry[];
};

// ── Today's team check-in snapshot ───────────────────────────────────────────

export const todayTeamReadiness: TeamReadinessSummary = {
  date: "2026-05-15",
  totalPlayers: 14,
  submitted: 11,
  green: 7,
  yellow: 2,
  red: 1,
  restricted: 1,
  avgScore: 74,
  entries: [
    {
      id: "ri_001", playerId: "p10", playerName: "Malik Henderson",
      date: "2026-05-15", soreness: 2, sleep: 4, energy: 4,
      readinessScore: 81, flag: "green", coachReviewed: false,
    },
    {
      id: "ri_002", playerId: "p6", playerName: "Jaylen Scott",
      date: "2026-05-15", soreness: 1, sleep: 5, energy: 5,
      readinessScore: 100, flag: "green", coachReviewed: true,
    },
    {
      id: "ri_003", playerId: "p7", playerName: "Cam Porter",
      date: "2026-05-15", soreness: 4, sleep: 3, energy: 2,
      note: "Knee still tight from Tuesday. Not bad, just stiff.",
      readinessScore: 44, flag: "yellow", coachReviewed: true,
      coachNote: "Monitor — full practice but no jumping drills until warm.",
    },
    {
      id: "ri_004", playerId: "p3", playerName: "Tyler Brooks",
      date: "2026-05-15", soreness: 5, sleep: 2, energy: 1,
      note: "Couldn't sleep, everything hurts. Think I'm getting sick.",
      readinessScore: 19, flag: "red", coachReviewed: true,
      coachNote: "RESTRICTED — no practice. Rest and report Saturday AM.",
    },
    {
      id: "ri_005", playerId: "p8", playerName: "Noah Rivera",
      date: "2026-05-15", soreness: 1, sleep: 5, energy: 5,
      readinessScore: 100, flag: "green", coachReviewed: false,
    },
    {
      id: "ri_006", playerId: "p12", playerName: "Brandon Lee",
      date: "2026-05-15", soreness: 2, sleep: 4, energy: 4,
      readinessScore: 81, flag: "green", coachReviewed: false,
    },
    {
      id: "ri_007", playerId: "p4", playerName: "Marcus Webb",
      date: "2026-05-15", soreness: 3, sleep: 3, energy: 3,
      readinessScore: 62, flag: "yellow", coachReviewed: false,
    },
    {
      id: "ri_008", playerId: "p5", playerName: "Isaiah Grant",
      date: "2026-05-15", soreness: 1, sleep: 5, energy: 4,
      readinessScore: 94, flag: "green", coachReviewed: false,
    },
    {
      id: "ri_009", playerId: "p9", playerName: "DeShawn Morris",
      date: "2026-05-15", soreness: 1, sleep: 4, energy: 5,
      readinessScore: 94, flag: "green", coachReviewed: false,
    },
    {
      id: "ri_010", playerId: "p11", playerName: "Jalen King",
      date: "2026-05-15", soreness: 2, sleep: 5, energy: 5,
      readinessScore: 88, flag: "green", coachReviewed: false,
    },
    {
      id: "ri_011", playerId: "p2", playerName: "Andre Miles",
      date: "2026-05-15", soreness: 1, sleep: 3, energy: 4,
      readinessScore: 81, flag: "green", coachReviewed: false,
    },
  ],
};

// ── Player personal history (last 14 days) ───────────────────────────────────

export const myReadinessHistory: ReadinessEntry[] = [
  { id: "ph_1",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-15", soreness: 2, sleep: 4, energy: 4, readinessScore: 81,  flag: "green",  coachReviewed: false },
  { id: "ph_2",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-14", soreness: 1, sleep: 5, energy: 5, readinessScore: 100, flag: "green",  coachReviewed: true  },
  { id: "ph_3",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-13", soreness: 3, sleep: 3, energy: 3, readinessScore: 62,  flag: "yellow", coachReviewed: true, coachNote: "Watch the soreness — make sure you stretch post-WOD." },
  { id: "ph_4",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-12", soreness: 1, sleep: 4, energy: 4, readinessScore: 81,  flag: "green",  coachReviewed: false },
  { id: "ph_5",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-11", soreness: 2, sleep: 4, energy: 5, readinessScore: 88,  flag: "green",  coachReviewed: false },
  { id: "ph_6",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-10", soreness: 4, sleep: 2, energy: 2, readinessScore: 31,  flag: "red",    coachReviewed: true, coachNote: "Rest day approved. Don't train through fatigue." },
  { id: "ph_7",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-09", soreness: 2, sleep: 5, energy: 5, readinessScore: 94,  flag: "green",  coachReviewed: false },
  { id: "ph_8",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-08", soreness: 1, sleep: 5, energy: 5, readinessScore: 100, flag: "green",  coachReviewed: false },
  { id: "ph_9",  playerId: "p_me", playerName: "Andrew G.", date: "2026-05-07", soreness: 2, sleep: 4, energy: 4, readinessScore: 81,  flag: "green",  coachReviewed: false },
  { id: "ph_10", playerId: "p_me", playerName: "Andrew G.", date: "2026-05-06", soreness: 3, sleep: 3, energy: 3, readinessScore: 62,  flag: "yellow", coachReviewed: false },
  { id: "ph_11", playerId: "p_me", playerName: "Andrew G.", date: "2026-05-05", soreness: 1, sleep: 4, energy: 5, readinessScore: 94,  flag: "green",  coachReviewed: false },
  { id: "ph_12", playerId: "p_me", playerName: "Andrew G.", date: "2026-05-04", soreness: 2, sleep: 5, energy: 4, readinessScore: 88,  flag: "green",  coachReviewed: false },
  { id: "ph_13", playerId: "p_me", playerName: "Andrew G.", date: "2026-05-03", soreness: 1, sleep: 5, energy: 5, readinessScore: 100, flag: "green",  coachReviewed: false },
  { id: "ph_14", playerId: "p_me", playerName: "Andrew G.", date: "2026-05-02", soreness: 2, sleep: 4, energy: 4, readinessScore: 81,  flag: "green",  coachReviewed: false },
];

export const todayCheckinSubmitted = true; // set false to show the check-in form
