/**
 * @deprecated Import from "@/features/readiness" instead.
 * This shim maintains backward compatibility while consumers migrate.
 */
export type { ReadinessStatus, ReadinessConfidence, ReadinessReasonCode, PlayerReadiness, WellnessCheckin, PlayerReadinessSignals } from "@/features/readiness";
export { REASON_LABELS, statusColor, statusLabel, computePlayerReadiness, computeCheckinScore, MOCK_TEAM_READINESS } from "@/features/readiness";
