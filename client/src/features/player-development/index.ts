/**
 * features/player-development/index.ts
 *
 * Public entry point for the Player Development slice.
 * Other slices may only import from this file — never from internal files.
 */

// ── Types (exported for cross-slice use) ──────────────────────────────────
export type {
  PlayerHubData,
  FocusArea,
  FocusAreaStatus,
  CoachFeedback,
  FeedbackType,
  SeasonStats,
  CoachAction,
  CoachActionType,
  CoachActionStatus,
  LinkedClip,
} from "./types";

// ── Hooks ─────────────────────────────────────────────────────────────────
export {
  usePlayerHub,
  usePlayerCoachingActions,
  useMarkDrillDone,
  useCheckedInToday,
} from "./hooks";

// ── Mock (only for demo mode / testing consumers outside this slice) ───────
// Components within this slice import mock directly; external slices should
// use the hooks which handle fallback internally.
export { MOCK_HUB_DATA } from "./mock";
