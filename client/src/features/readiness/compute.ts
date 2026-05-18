/**
 * Client-side readiness computation.
 *
 * computePlayerReadiness() — scores a player given fetched API signals.
 *   Used by PlayerProfilePage and similar coach views that receive
 *   structured data from the server.
 *
 * computeCheckinScore() — lightweight UI scorer for the self-checkin form.
 *   Takes raw wellness inputs and returns a score + flag for guardrail toasts.
 *   This is intentionally simpler than the server algorithm; the server
 *   authoritative score runs after submission.
 */
import type {
  ReadinessStatus,
  ReadinessConfidence,
  ReadinessReasonCode,
} from "./types";
import { REASON_LABELS } from "./types";

// ── Coach/API variant ──────────────────────────────────────────────────────

export interface WellnessCheckin {
  fatigue:  number;   // 1-10
  sleep:    number;   // hours
  soreness: number;   // 1-10
  flagged?: boolean;
}

export interface PlayerReadinessSignals {
  latestCheckin?:        WellnessCheckin | null;
  hasActiveInjury?:      boolean;
  hasMonitoringInjury?:  boolean;
  playerStatus?:         string | null;
}

export function computePlayerReadiness(signals: PlayerReadinessSignals): {
  status:     ReadinessStatus;
  confidence: ReadinessConfidence;
  reasons:    ReadinessReasonCode[];
  summary:    string;
} {
  const reasons: ReadinessReasonCode[] = [];

  if (signals.hasActiveInjury) reasons.push("injury_active");
  if (signals.playerStatus === "injured" || signals.playerStatus === "suspended") {
    reasons.push("player_suspended");
  }
  if (reasons.length > 0) {
    return { status: "RESTRICTED", confidence: "high", reasons, summary: REASON_LABELS[reasons[0]] };
  }

  const { latestCheckin } = signals;
  if (!latestCheckin) {
    return { status: "UNKNOWN", confidence: "none", reasons: ["no_data"], summary: "No recent check-in data" };
  }

  if (latestCheckin.fatigue  >= 7) reasons.push("fatigue_high");
  if (latestCheckin.sleep    <= 5) reasons.push("sleep_low");
  if (latestCheckin.soreness >= 7) reasons.push("soreness_high");

  if (signals.hasMonitoringInjury) reasons.push("injury_monitoring");

  const status: ReadinessStatus = reasons.length > 0 ? "FLAGGED" : "READY";
  const summary =
    reasons.length === 0 ? "Ready to practice" :
    reasons.length === 1 ? REASON_LABELS[reasons[0]] :
    reasons.slice(0, 2).map((r) => REASON_LABELS[r]).join("; ");

  return { status, confidence: "medium", reasons, summary };
}

// ── Self-checkin form variant ──────────────────────────────────────────────

/**
 * Lightweight scorer for the player self-checkin form UI.
 * Returns a 0-100 score and a boolean flag for guardrail toasts.
 * The server runs the authoritative score after submission.
 */
export function computeCheckinScore(
  soreness: number,
  sleep: number,
  energy: number,
): { score: number; flag: boolean } {
  const sorenessScore = Math.max(0, 100 - (soreness - 1) * 12.5);
  const sleepScore    = Math.min(100, (sleep / 9) * 100);
  const energyScore   = energy * 10;
  const score = Math.round((sorenessScore + sleepScore + energyScore) / 3);
  const flag  = soreness >= 7 || sleep <= 5 || energy <= 3;
  return { score, flag };
}
