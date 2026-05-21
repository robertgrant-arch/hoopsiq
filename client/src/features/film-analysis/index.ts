/**
 * features/film-analysis/index.ts
 * Public entry point for the structured film analysis slice.
 */

export type {
  AnalysisClip,
  AnalysisStatus,
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
  ANALYSIS_STATUS_LABELS,
  buildSuggestedNote,
  confidenceTier,
  deriveAnalysisStatus,
} from "./types";

export {
  useAnalysisClips,
  useApprovedClips,
  useSessionAnalysisSummary,
  useCoachReviewClip,
} from "./hooks";

export { MOCK_ANALYSIS_CLIPS, MOCK_SESSION_SUMMARY } from "./mock";
