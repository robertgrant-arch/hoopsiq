// ─────────────────────────────────────────────────────────────
// HoopsIQ — Film AI Analysis: Service Interface + DB implementation
// ─────────────────────────────────────────────────────────────

import type {
  InitiateUploadRequest,
  InitiateUploadResponse,
  CreateSessionRequest,
  SubmitReviewRequest,
  CreateExportRequest,
  EventsQueryParams,
  FilmSession,
  AnalysisJob,
  DetectedEvent,
  PlayerStatLine,
  TeamStatSummary,
  HighlightCandidate,
  HighlightClip,
  HighlightReel,
  ReviewDecision,
  ExportRequest,
} from "../../../shared/film-analysis/types";

// ── Service Interface ────────────────────────────────────────

export interface FilmAnalysisService {
  initiateUpload(
    input: InitiateUploadRequest & {
      orgId: string;
      teamId: string;
      createdBy: string;
    },
  ): Promise<InitiateUploadResponse>;

  createSession(
    input: CreateSessionRequest & {
      orgId: string;
      teamId: string;
      createdBy: string;
    },
  ): Promise<FilmSession>;
  listSessions(
    orgId: string,
    teamId: string,
  ): Promise<Array<FilmSession & { job: AnalysisJob }>>;
  getSessionDetail(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<(FilmSession & { job: AnalysisJob }) | null>;

  getLatestJob(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<AnalysisJob | null>;
  triggerAnalysis(
    orgId: string,
    teamId: string,
    sessionId: string,
    userId: string,
    options?: { fromStage?: string },
  ): Promise<AnalysisJob>;

  getTeamStats(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<TeamStatSummary | null>;
  getPlayerStats(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<PlayerStatLine[]>;

  getEvents(
    orgId: string,
    teamId: string,
    sessionId: string,
    query: EventsQueryParams,
  ): Promise<DetectedEvent[]>;

  getHighlights(
    orgId: string,
    teamId: string,
    sessionId: string,
  ): Promise<{
    candidates: HighlightCandidate[];
    clips: HighlightClip[];
    reels: HighlightReel[];
  }>;
  approveClip(
    orgId: string,
    teamId: string,
    userId: string,
    body: Record<string, unknown>,
  ): Promise<HighlightClip>;
  upsertReel(
    orgId: string,
    teamId: string,
    userId: string,
    body: Record<string, unknown>,
  ): Promise<HighlightReel>;

  submitReview(
    orgId: string,
    teamId: string,
    userId: string,
    body: SubmitReviewRequest & { sessionId?: string },
  ): Promise<ReviewDecision>;

  requestExport(
    orgId: string,
    teamId: string,
    userId: string,
    body: CreateExportRequest & { sessionId?: string },
  ): Promise<ExportRequest>;

  handleMuxWebhook(event: {
    type: string;
    data: Record<string, unknown>;
  }): Promise<void>;
}

export { DbFilmAnalysisService } from "./db-service";
