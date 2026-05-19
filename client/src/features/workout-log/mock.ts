/**
 * features/workout-log/mock.ts
 *
 * Mock data and pure computation functions for the Workout, Habits,
 * and Progression Tracking slice.
 *
 * Computation is pure and testable — no React dependencies.
 * Replace the mock arrays with real API responses and all computations
 * still work correctly.
 */

import type {
  DayRecord,
  DayStatus,
  StreakData,
  SelfLogEntry,
  WodSummary,
  CheckInSummary,
} from "./types";

// ── 30-day mock history for Marcus Davis ──────────────────────────────────
//
// Realistic pattern: weekdays mostly completed, some skips, weekends = rest.
// Readiness scores vary. Recent week has one skip (injury).

function d(offset: number): string {
  const dt = new Date("2026-05-19");
  dt.setDate(dt.getDate() - offset);
  return dt.toISOString().slice(0, 10);
}

function wod(
  title:           string,
  status:          DayStatus,
  drillsCompleted: number,
  drillsTotal:     number,
  opts:            Partial<WodSummary> = {},
): WodSummary {
  return {
    title,
    status,
    drillsCompleted,
    drillsTotal,
    isAssigned: true,
    ...opts,
  };
}

function checkin(score: number, flag: CheckInSummary["flag"] = "green"): CheckInSummary {
  return {
    readinessScore: score,
    flag,
    availability: flag === "red" ? "limited" : "full",
    submittedAt: new Date().toISOString(),
  };
}

export const MOCK_30_DAY_HISTORY: DayRecord[] = [
  // --- Most recent week (May 13–19) ---
  { date: d(0),  status: "no_data",   checkIn: null,                     wod: null, selfLogs: [] },  // today — nothing yet
  { date: d(1),  status: "completed", checkIn: checkin(81),               wod: wod("Shooting Mechanics + Ball Handling", "completed", 5, 5, { elapsedMinutes: 31, xpAwarded: 240 }), selfLogs: [] },
  { date: d(2),  status: "partial",   checkIn: checkin(62, "yellow"),     wod: wod("1v1 Finishing Package", "partial", 3, 6, { elapsedMinutes: 22, xpAwarded: 150 }), selfLogs: [] },
  { date: d(3),  status: "skipped",   checkIn: checkin(45, "red"),        wod: wod("Active Recovery + Mobility", "skipped", 0, 4), selfLogs: [] },  // knee soreness
  { date: d(4),  status: "completed", checkIn: checkin(78),               wod: wod("Footwork + Pivots", "completed", 4, 4, { elapsedMinutes: 26, xpAwarded: 210 }), selfLogs: [] },
  { date: d(5),  status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },  // Saturday
  { date: d(6),  status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },  // Sunday

  // --- Week 2 (May 6–12) ---
  { date: d(7),  status: "completed", checkIn: checkin(85),               wod: wod("Ball Handling Gauntlet", "completed", 5, 5, { elapsedMinutes: 33, xpAwarded: 250 }), selfLogs: [] },
  { date: d(8),  status: "completed", checkIn: checkin(79),               wod: wod("Off-Ball Movement + Screens", "completed", 5, 5, { elapsedMinutes: 29, xpAwarded: 240 }), selfLogs: [] },
  { date: d(9),  status: "completed", checkIn: checkin(72, "yellow"),     wod: wod("Defensive Rotations", "completed", 4, 5, { elapsedMinutes: 27, xpAwarded: 195 }), selfLogs: [] },
  { date: d(10), status: "completed", checkIn: checkin(88),               wod: wod("Pull-Up Shooter — Intermediate", "completed", 5, 5, { elapsedMinutes: 28, xpAwarded: 240 }), selfLogs: [] },
  { date: d(11), status: "completed", checkIn: checkin(82),               wod: wod("Mikan + Contact Layups", "completed", 5, 5, { elapsedMinutes: 30, xpAwarded: 235 }), selfLogs: [] },
  { date: d(12), status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },
  { date: d(13), status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },

  // --- Week 3 (Apr 29 – May 5) ---
  { date: d(14), status: "completed", checkIn: checkin(75),               wod: wod("Court Vision Drill Series", "completed", 5, 5, { elapsedMinutes: 34, xpAwarded: 245 }), selfLogs: [] },
  { date: d(15), status: "skipped",   checkIn: checkin(38, "red"),        wod: wod("Conditioning Circuit", "skipped", 0, 6), selfLogs: [] },  // illness
  { date: d(16), status: "completed", checkIn: checkin(67, "yellow"),     wod: wod("Active Recovery", "completed", 3, 3, { elapsedMinutes: 18, xpAwarded: 120 }), selfLogs: [] },
  { date: d(17), status: "completed", checkIn: checkin(80),               wod: wod("Shooting Mechanics + Ball Handling", "completed", 5, 5, { elapsedMinutes: 31, xpAwarded: 240 }), selfLogs: [] },
  { date: d(18), status: "completed", checkIn: checkin(84),               wod: wod("1v1 Finishing Package", "completed", 5, 5, { elapsedMinutes: 29, xpAwarded: 230 }), selfLogs: [] },
  { date: d(19), status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },
  { date: d(20), status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },

  // --- Week 4 (Apr 22–28) ---
  { date: d(21), status: "completed", checkIn: checkin(86),               wod: wod("Defensive Rotations", "completed", 5, 5, { elapsedMinutes: 30, xpAwarded: 240 }), selfLogs: [] },
  { date: d(22), status: "completed", checkIn: checkin(80),               wod: wod("Footwork + Pivots", "completed", 4, 4, { elapsedMinutes: 26, xpAwarded: 210 }), selfLogs: [] },
  { date: d(23), status: "completed", checkIn: checkin(77),               wod: wod("Ball Handling Gauntlet", "completed", 5, 5, { elapsedMinutes: 31, xpAwarded: 240 }), selfLogs: [] },
  { date: d(24), status: "completed", checkIn: checkin(90),               wod: wod("Pull-Up Shooter — Advanced", "completed", 5, 5, { elapsedMinutes: 28, xpAwarded: 250 }), selfLogs: [] },
  { date: d(25), status: "completed", checkIn: checkin(83),               wod: wod("Mikan + Contact Layups", "completed", 5, 5, { elapsedMinutes: 30, xpAwarded: 235 }), selfLogs: [] },
  { date: d(26), status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },
  { date: d(27), status: "rest",      checkIn: null,                     wod: null, selfLogs: [] },

  // --- Week 5 (Apr 15–21) ---
  { date: d(28), status: "completed", checkIn: checkin(79),               wod: wod("Off-Ball Movement + Screens", "completed", 5, 5, { elapsedMinutes: 32, xpAwarded: 240 }), selfLogs: [] },
  { date: d(29), status: "completed", checkIn: checkin(74),               wod: wod("Conditioning Circuit", "completed", 6, 6, { elapsedMinutes: 38, xpAwarded: 290 }), selfLogs: [] },
  { date: d(30), status: "completed", checkIn: checkin(81),               wod: wod("Shooting Mechanics + Ball Handling", "completed", 5, 5, { elapsedMinutes: 29, xpAwarded: 240 }), selfLogs: [] },
];

// ── Self-log entries ───────────────────────────────────────────────────────

export const MOCK_SELF_LOGS: SelfLogEntry[] = [
  {
    id:              "sl-001",
    title:           "Extra shooting — 200 makes, corner 3s",
    category:        "shooting",
    durationMinutes: 35,
    loggedAt:        new Date(d(1) + "T18:30:00Z").toISOString(),
    date:            d(1),
  },
  {
    id:              "sl-002",
    title:           "Left-hand dribble work at home",
    category:        "ball_handling",
    durationMinutes: 20,
    loggedAt:        new Date(d(4) + "T19:00:00Z").toISOString(),
    date:            d(4),
  },
  {
    id:              "sl-003",
    title:           "Gym — squats and vertical jumps",
    category:        "physical_readiness",
    durationMinutes: 45,
    loggedAt:        new Date(d(8) + "T16:00:00Z").toISOString(),
    date:            d(8),
  },
];

// ── Pure computation functions ─────────────────────────────────────────────

/** Whether a date string falls on a weekend (Sat/Sun). */
function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + "T12:00:00Z").getUTCDay();
  return day === 0 || day === 6;
}

/** Classify a DayRecord into the DayStatus used by the streak/strip. */
export function classifyDay(record: DayRecord): DayStatus {
  if (record.status !== "no_data") return record.status;
  if (isWeekend(record.date)) return "rest";
  return "no_data";
}

/**
 * Compute streak and compliance data from a sorted (date desc) history array.
 * Pure — no side effects, no React.
 */
export function computeStreakData(history: DayRecord[]): StreakData {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  // Current streak: consecutive active (non-rest, non-no_data) days with "completed" or "partial"
  let currentStreak = 0;
  for (const day of sorted) {
    const s = classifyDay(day);
    if (s === "rest") continue;          // rest days don't break the streak
    if (s === "no_data") continue;       // today may have no data yet
    if (s === "completed" || s === "partial") {
      currentStreak++;
    } else {
      break;                             // skipped breaks the streak
    }
  }

  // 30-day compliance: completed / (completed + skipped + partial) on active days
  const activeDays = sorted.filter(
    (d) => classifyDay(d) !== "rest" && classifyDay(d) !== "no_data",
  );
  const completedDays = activeDays.filter(
    (d) => classifyDay(d) === "completed",
  );
  const thirtyDayCompletionRate =
    activeDays.length > 0 ? completedDays.length / activeDays.length : 0;

  // 7-day compliance
  const last7Active = sorted
    .slice(0, 9)                          // look at ~9 days to skip weekends
    .filter((d) => classifyDay(d) !== "rest" && classifyDay(d) !== "no_data");
  const last7Completed = last7Active.filter((d) => classifyDay(d) === "completed");
  const sevenDayCompletionRate =
    last7Active.length > 0 ? last7Completed.length / last7Active.length : 0;

  // Last 14 calendar days for the consistency strip (oldest → newest)
  const last14 = sorted
    .slice(0, 14)
    .map((record) => ({ date: record.date, status: classifyDay(record) }))
    .reverse();

  return {
    currentStreak,
    longestStreak:           21,        // TODO: compute from full history
    thirtyDayCompletionRate,
    sevenDayCompletionRate,
    last14Days: last14,
  };
}

/**
 * Total XP earned across all completed WODs in a history array.
 */
export function totalXP(history: DayRecord[]): number {
  return history.reduce((sum, d) => sum + (d.wod?.xpAwarded ?? 0), 0);
}

/**
 * Recent check-in scores for the readiness sparkline (last N days, oldest first).
 */
export function recentReadinessScores(history: DayRecord[], n = 7): number[] {
  return history
    .filter((d) => d.checkIn !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-n)
    .map((d) => d.checkIn!.readinessScore);
}
