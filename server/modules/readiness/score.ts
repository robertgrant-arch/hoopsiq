/**
 * Explainable 3-tier readiness scoring.
 *
 * Status: RESTRICTED → FLAGGED → READY → UNKNOWN
 * Confidence: high (3+ fresh signals) | medium (2) | low (1) | none (0)
 *
 * Design constraints:
 *  - No fake numeric precision. Status + reason codes only.
 *  - Show UNKNOWN when data is too sparse, not a false "READY".
 *  - Every status includes the flag reasons so the UI can explain it.
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

export interface ReadinessSignals {
  /** Latest check-in (within last 24 h). null = not submitted today. */
  checkin?: { fatigue: number; sleep: number; soreness: number } | null;
  /** Latest wearable metrics (within last 48 h). */
  wearable?: { recoveryScore?: number | null; sleepScore?: number | null } | null;
  /** Number of consecutive unexcused absences (most recent first). */
  consecutiveUnexcusedAbsences?: number;
  /** Rolling 7-day workload points. MAX=4, HIGH=3, MODERATE=2, RECOVERY=1 per session. */
  workloadPoints7d?: number;
  /** Overdue assignment count. */
  overdueAssignments?: number;
  /** Active injury record exists. */
  hasActiveInjury?: boolean;
  /** Monitoring-status injury exists. */
  hasMonitoringInjury?: boolean;
  /** Player account status (from players table). */
  playerStatus?: string | null;
  /** Active coach override (if present, wins over everything). */
  override?: { status: ReadinessStatus; note: string; expiresAt: string } | null;
}

export interface ReadinessResult {
  status: ReadinessStatus;
  confidence: ReadinessConfidence;
  reasons: ReadinessReasonCode[];
  /** Short human-readable summary for tooltip / inline display. */
  summary: string;
}

// Thresholds ────────────────────────────────────────────────────────────────
const T = {
  fatigue_flag: 7,
  sleep_flag: 5,       // hours
  soreness_flag: 7,
  wearable_recovery_flag: 35,
  wearable_sleep_flag: 40,
  attendance_miss_flag: 2,   // consecutive unexcused
  workload_flag: 15,         // rolling 7-day points (≈ 5 HIGH sessions)
  overdue_assignments_flag: 2,
} as const;

export function computeReadiness(signals: ReadinessSignals): ReadinessResult {
  const reasons: ReadinessReasonCode[] = [];

  // ── Coach override wins ────────────────────────────────────────────────────
  if (signals.override && new Date(signals.override.expiresAt) > new Date()) {
    return {
      status: signals.override.status,
      confidence: "high",
      reasons: [],
      summary: `Coach override: ${signals.override.note}`,
    };
  }

  // ── RESTRICTED ────────────────────────────────────────────────────────────
  if (signals.hasActiveInjury) reasons.push("injury_active");
  if (signals.playerStatus === "injured" || signals.playerStatus === "suspended") {
    reasons.push("player_suspended");
  }
  if (reasons.length > 0) {
    return {
      status: "RESTRICTED",
      confidence: "high",
      reasons,
      summary: buildSummary("RESTRICTED", reasons),
    };
  }

  // ── Count fresh signals for confidence ────────────────────────────────────
  let freshSignalCount = 0;

  // ── Wellness check-in ─────────────────────────────────────────────────────
  if (signals.checkin != null) {
    freshSignalCount++;
    if (signals.checkin.fatigue >= T.fatigue_flag)  reasons.push("fatigue_high");
    if (signals.checkin.sleep   <= T.sleep_flag)    reasons.push("sleep_low");
    if (signals.checkin.soreness >= T.soreness_flag) reasons.push("soreness_high");
  }

  // ── Wearable ──────────────────────────────────────────────────────────────
  if (signals.wearable != null) {
    freshSignalCount++;
    if (signals.wearable.recoveryScore != null && signals.wearable.recoveryScore <= T.wearable_recovery_flag) {
      reasons.push("wearable_recovery_low");
    }
    if (signals.wearable.sleepScore != null && signals.wearable.sleepScore <= T.wearable_sleep_flag) {
      reasons.push("wearable_sleep_low");
    }
  }

  // ── Attendance ────────────────────────────────────────────────────────────
  if (signals.consecutiveUnexcusedAbsences != null) {
    freshSignalCount++;
    if (signals.consecutiveUnexcusedAbsences >= T.attendance_miss_flag) {
      reasons.push("attendance_streak_missed");
    }
  }

  // ── Workload ──────────────────────────────────────────────────────────────
  if (signals.workloadPoints7d != null) {
    freshSignalCount++;
    if (signals.workloadPoints7d >= T.workload_flag) {
      reasons.push("workload_overload");
    }
  }

  // ── Engagement (assignments) ──────────────────────────────────────────────
  if (signals.overdueAssignments != null) {
    freshSignalCount++;
    if (signals.overdueAssignments >= T.overdue_assignments_flag) {
      reasons.push("assignments_overdue");
    }
  }

  // ── Monitoring injury (flag, not restrict) ───────────────────────────────
  if (signals.hasMonitoringInjury) {
    reasons.push("injury_monitoring");
    freshSignalCount = Math.max(freshSignalCount, 1);
  }

  // ── No data at all ────────────────────────────────────────────────────────
  if (freshSignalCount === 0) {
    return {
      status: "UNKNOWN",
      confidence: "none",
      reasons: ["no_data"],
      summary: "No recent data — readiness unknown",
    };
  }

  const confidence: ReadinessConfidence =
    freshSignalCount >= 3 ? "high" : freshSignalCount === 2 ? "medium" : "low";

  const status: ReadinessStatus = reasons.length > 0 ? "FLAGGED" : "READY";

  return {
    status,
    confidence,
    reasons,
    summary: buildSummary(status, reasons, confidence),
  };
}

// ── Human-readable summary ─────────────────────────────────────────────────

const REASON_LABELS: Record<ReadinessReasonCode, string> = {
  injury_active:          "Active injury on file",
  injury_monitoring:      "Injury under monitoring",
  player_suspended:       "Player suspended/injured",
  fatigue_high:           "High fatigue reported",
  sleep_low:              "Low sleep reported",
  soreness_high:          "High soreness reported",
  wearable_recovery_low:  "Low wearable recovery score",
  wearable_sleep_low:     "Low wearable sleep score",
  attendance_streak_missed: "Consecutive unexcused absences",
  workload_overload:      "High 7-day workload accumulation",
  assignments_overdue:    "Multiple overdue assignments",
  no_data:                "No recent signals",
};

function buildSummary(
  status: ReadinessStatus,
  reasons: ReadinessReasonCode[],
  confidence?: ReadinessConfidence,
): string {
  if (status === "READY") {
    const conf = confidence === "low" ? " (limited data)" : "";
    return `Ready to practice${conf}`;
  }
  if (status === "UNKNOWN") return "No recent data — readiness unknown";
  if (reasons.length === 0) return status;
  if (reasons.length === 1) return REASON_LABELS[reasons[0]];
  return reasons.slice(0, 2).map((r) => REASON_LABELS[r]).join("; ");
}
