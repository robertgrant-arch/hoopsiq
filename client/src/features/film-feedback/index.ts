/**
 * features/film-feedback/index.ts
 *
 * Public entry point for the Film Feedback → Rep Plan slice.
 * Other slices and pages import only from here.
 */

export type {
  FilmRepPlan,
  RepPlanStatus,
  FilmActionType,
  FilmContext,
  DrillPrescription,
} from "./types";

export {
  PLAYER_STATUS_TRANSITIONS,
  mapServerStatus,
  parseDrillFromNote,
  formatTimestampMs,
} from "./types";

export { useFilmRepPlans, useUpdateRepPlanStatus } from "./hooks";
export { MOCK_FILM_REP_PLANS, normalizeCoachingAction, isCoveredActionType } from "./mock";
