/**
 * features/workout-log/types.ts
 *
 * Types for the Workout, Habits, and Progression Tracking slice.
 *
 * Core concept: a DayRecord is a unified view of everything that happened
 * on a given date — check-in, assigned WOD, and any self-logged work.
 * Aggregating DayRecords gives us streak, compliance, and consistency data.
 */

// ── Day classification ─────────────────────────────────────────────────────

export type DayStatus =
  | "completed"     // WOD finished (all or most drills done)
  | "partial"       // WOD started but not finished
  | "skipped"       // WOD explicitly skipped
  | "rest"          // scheduled rest (weekend / coach rest day)
  | "no_data";      // no record for this day

// ── Check-in snapshot (per day) ────────────────────────────────────────────

export type CheckInSummary = {
  readinessScore: number;                                  // 0–100
  flag:           "green" | "yellow" | "red" | "restricted";
  availability:   "full" | "limited" | "unavailable";
  submittedAt:    string;                                  // ISO
};

// ── WOD summary (per day) ──────────────────────────────────────────────────

export type WodSummary = {
  title:            string;
  status:           DayStatus;
  drillsCompleted:  number;
  drillsTotal:      number;
  elapsedMinutes?:  number;
  xpAwarded?:       number;
  isAssigned:       boolean;   // true = coach-assigned; false = self-logged
};

// ── Self-log entry ─────────────────────────────────────────────────────────
//
// Player-recorded workout outside the assigned WOD.
// No server endpoint yet — stored optimistically in local state.

export type SelfLogCategory =
  | "shooting"
  | "finishing"
  | "ball_handling"
  | "decision_making"
  | "footwork"
  | "defensive_habits"
  | "physical_readiness"
  | "discipline";

export type SelfLogEntry = {
  id:              string;
  title:           string;           // "200 makes — corner 3s"
  category:        SelfLogCategory;
  durationMinutes: number;
  notes?:          string;
  loggedAt:        string;           // ISO
  date:            string;           // YYYY-MM-DD
};

export type SelfLogInput = {
  title:           string;
  category:        SelfLogCategory;
  durationMinutes: number;
  notes?:          string;
};

export const SELF_LOG_CATEGORY_META: Record<
  SelfLogCategory,
  { label: string; emoji: string }
> = {
  shooting:           { label: "Shooting",          emoji: "🎯" },
  finishing:          { label: "Finishing",          emoji: "🏀" },
  ball_handling:      { label: "Ball Handling",      emoji: "✋" },
  decision_making:    { label: "Decision Making",    emoji: "🧠" },
  footwork:           { label: "Footwork",           emoji: "👟" },
  defensive_habits:   { label: "Defensive Habits",   emoji: "🛡️" },
  physical_readiness: { label: "Physical Readiness", emoji: "⚡" },
  discipline:         { label: "Consistency",        emoji: "🔄" },
};

// ── Unified day record ─────────────────────────────────────────────────────

export type DayRecord = {
  date:     string;                // YYYY-MM-DD
  status:   DayStatus;
  checkIn:  CheckInSummary | null;
  wod:      WodSummary | null;
  selfLogs: SelfLogEntry[];
};

// ── Streak and compliance data ─────────────────────────────────────────────

export type StreakData = {
  currentStreak:            number;   // consecutive active days with completion
  longestStreak:            number;   // all-time best streak
  thirtyDayCompletionRate:  number;   // 0.0–1.0
  sevenDayCompletionRate:   number;   // 0.0–1.0
  last14Days:               { date: string; status: DayStatus }[];
};

// ── Server check-in payload ────────────────────────────────────────────────
//
// What POST /api/readiness expects (1–10 scale).
// The form collects 1–5 scale; mapping happens in useSubmitCheckin.

export type ServerCheckinPayload = {
  fatigue:   number;   // 1–10  (inverse of energy: energy=5 → fatigue=2)
  sleep:     number;   // 1–10
  soreness:  number;   // 1–10
  mood?:     number;   // 1–10 (inverse of stress)
  note?:     string;
};
