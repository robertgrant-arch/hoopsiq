/**
 * Readiness domain types — shared between compute, display, and mock layers.
 * These mirror the server-side types in server/modules/readiness/score.ts.
 */

export type ReadinessStatus = "RESTRICTED" | "FLAGGED" | "READY" | "UNKNOWN";
export type ReadinessConfidence = "high" | "medium" | "low" | "none";

export type ReadinessReasonCode =
  | "injury_active"
  | "injury_monitoring"
  | "player_suspended"
  | "fatigue_high"
  | "sleep_low"
  | "soreness_high"
  | "wearable_recovery_low"
  | "wearable_sleep_low"
  | "attendance_streak_missed"
  | "workload_overload"
  | "assignments_overdue"
  | "no_data";

export interface PlayerReadiness {
  playerId:         string;
  playerName:       string;
  position?:        string;
  jerseyNumber?:    string;
  avatarUrl?:       string;
  checkinSubmitted: boolean;
  status:           ReadinessStatus;
  confidence:       ReadinessConfidence;
  reasons:          ReadinessReasonCode[];
  summary:          string;
}

export const REASON_LABELS: Record<ReadinessReasonCode, string> = {
  injury_active:            "Active injury on file",
  injury_monitoring:        "Injury under monitoring",
  player_suspended:         "Player suspended/injured",
  fatigue_high:             "High fatigue reported",
  sleep_low:                "Low sleep reported",
  soreness_high:            "High soreness reported",
  wearable_recovery_low:    "Low wearable recovery score",
  wearable_sleep_low:       "Low wearable sleep score",
  attendance_streak_missed: "Consecutive unexcused absences",
  workload_overload:        "High 7-day workload load",
  assignments_overdue:      "Multiple overdue assignments",
  no_data:                  "No recent signals",
};

// ── Display helpers ────────────────────────────────────────────────────────

export function statusColor(s: ReadinessStatus) {
  switch (s) {
    case "RESTRICTED": return { text: "oklch(0.68 0.22 25)",   bg: "oklch(0.68 0.22 25 / 0.1)",  border: "oklch(0.68 0.22 25 / 0.3)"  };
    case "FLAGGED":    return { text: "oklch(0.72 0.17 75)",   bg: "oklch(0.72 0.17 75 / 0.1)",   border: "oklch(0.72 0.17 75 / 0.3)"  };
    case "READY":      return { text: "oklch(0.60 0.15 145)",  bg: "oklch(0.75 0.18 150 / 0.08)", border: "oklch(0.75 0.18 150 / 0.25)" };
    case "UNKNOWN":    return { text: "oklch(0.55 0.04 240)",  bg: "oklch(0.55 0.04 240 / 0.08)", border: "oklch(0.55 0.04 240 / 0.2)"  };
  }
}

export function statusLabel(s: ReadinessStatus) {
  switch (s) {
    case "RESTRICTED": return "Restricted";
    case "FLAGGED":    return "Flagged";
    case "READY":      return "Ready";
    case "UNKNOWN":    return "Unknown";
  }
}
