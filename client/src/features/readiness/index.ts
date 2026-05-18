/**
 * Readiness feature — public entry point.
 *
 * All readiness types, computation, display components, and mock data
 * are owned here. Import from "@/features/readiness" in pages and
 * components, not from the individual sub-files.
 */

// Types and display helpers
export type {
  ReadinessStatus,
  ReadinessConfidence,
  ReadinessReasonCode,
  PlayerReadiness,
} from "./types";
export { REASON_LABELS, statusColor, statusLabel } from "./types";

// Client-side scoring
export { computePlayerReadiness, computeCheckinScore } from "./compute";
export type { WellnessCheckin, PlayerReadinessSignals } from "./compute";

// Display component
export { ReadinessStatusBadge } from "./ReadinessStatusBadge";

// Mock / seed data (dev and demo mode only)
export { MOCK_TEAM_READINESS } from "./mock";
