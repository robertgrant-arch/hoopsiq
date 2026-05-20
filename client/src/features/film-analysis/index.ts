/**
 * features/film-analysis/index.ts
 * Public entry point for the structured film analysis slice.
 */

export type {
  AnalysisClip,
  Observation,
  ObservationType,
  Inference,
  EvidenceItem,
  EvidenceStrength,
  CourtZone,
  BoundedEventType,
  CoachReviewStatus,
  CoachDecision,
  ConfidenceTier,
  SessionAnalysisSummary,
  SuggestedNoteTemplate,
} from "./types";

export {
  COURT_ZONE_LABELS,
  EVENT_LABELS,
  COACHING_NOTE_TEMPLATES,
  buildSuggestedNote,
  confidenceTier,
} from "./types";

export {
  useAnalysisClips,
  useSessionAnalysisSummary,
  useCoachReviewClip,
} from "./hooks";

export { MOCK_ANALYSIS_CLIPS, MOCK_SESSION_SUMMARY } from "./mock";
