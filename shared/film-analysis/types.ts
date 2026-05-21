// ─────────────────────────────────────────────────────────────
// HoopsOS — Film AI Analysis: Shared Types & Interfaces
// ─────────────────────────────────────────────────────────────

// ── Enums ────────────────────────────────────────────────────

export enum UploadStatus {
  Pending = 'pending',
  Uploading = 'uploading',
  Ready = 'ready',
  Failed = 'failed',
}

export enum FilmSessionKind {
  Game = 'game',
  Practice = 'practice',
  Scrimmage = 'scrimmage',
}

export enum HomeAway {
  Home = 'home',
  Away = 'away',
  Neutral = 'neutral',
}

export enum AnalysisJobStatus {
  Queued = 'queued',
  Running = 'running',
  Partial = 'partial',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export enum AnalysisStage {
  Ingest = 'ingest',
  Calibrate = 'calibrate',
  Detect = 'detect',
  Track = 'track',
  PossessionSegment = 'possession_segment',
  EventClassify = 'event_classify',
  StatValidate = 'stat_validate',
  ClipBoundary = 'clip_boundary',
  ConfidenceScore = 'confidence_score',
  Complete = 'complete',
}

export enum TeamSide {
  Home = 'home',
  Away = 'away',
  Unknown = 'unknown',
}

export enum RosterLinkSource {
  Auto = 'auto',
  Coach = 'coach',
  Staff = 'staff',
}

export enum DetectedEventType {
  Make2 = 'make_2',
  Make3 = 'make_3',
  Miss2 = 'miss_2',
  Miss3 = 'miss_3',
  FtMake = 'ft_make',
  FtMiss = 'ft_miss',
  ReboundOff = 'rebound_off',
  ReboundDef = 'rebound_def',
  Assist = 'assist',
  Steal = 'steal',
  Block = 'block',
  Turnover = 'turnover',
  Foul = 'foul',
  Sub = 'sub',
  Timeout = 'timeout',
  JumpBall = 'jumpball',
  PossessionChange = 'possession_change',
}

export enum HighlightCandidateStatus {
  Proposed = 'proposed',
  Approved = 'approved',
  Rejected = 'rejected',
}

export enum ReelVisibility {
  Private = 'private',
  Team = 'team',
  Player = 'player',
  Org = 'org',
  ExternalLink = 'external_link',
}

export enum ReviewTargetType {
  Event = 'event',
  Attribution = 'attribution',
  RosterLink = 'rosterlink',
  Candidate = 'candidate',
}

export enum IssueSeverity {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

export enum ExportTargetType {
  Clip = 'clip',
  Reel = 'reel',
  Stats = 'stats',
}

export enum ExportFormat {
  Mp4 = 'mp4',
  Csv = 'csv',
  Pdf = 'pdf',
  Link = 'link',
}

export enum ExportStatus {
  Pending = 'pending',
  Processing = 'processing',
  Ready = 'ready',
  Failed = 'failed',
}

export enum ConfidenceLevel {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

// ── Base Fields ──────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  orgId: string;
  teamId: string;
  createdAt: string; // ISO-8601
  updatedAt: string;
  createdBy: string;
  version: number;
  deletedAt?: string | null;
}

// ── Domain Entities ──────────────────────────────────────────

export interface FilmAsset extends BaseEntity {
  sourceUri: string;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
  checksum: string;
  uploadStatus: UploadStatus;
  thumbnailUri?: string | null;
  filename: string;
}

export interface FilmSession extends BaseEntity {
  assetId: string;
  kind: FilmSessionKind;
  opponentTeamId?: string | null;
  opponentName?: string | null;
  playedAt: string; // ISO-8601
  homeAway: HomeAway;
  rosterSnapshotId?: string | null;
  notes?: string | null;
  title: string;
  /** DB-level session status, e.g. "draft" | "uploading" | "queued" | "processing" | "ready" | "failed" */
  status: string;
  /** Duration of the primary video asset in seconds, null until Mux transcodes it */
  durationSec: number | null;
}

export interface AnalysisJob extends BaseEntity {
  sessionId: string;
  providerId: string;
  modelVersion: string;
  status: AnalysisJobStatus;
  stage: AnalysisStage;
  progressPct: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  parentJobId?: string | null; // for reruns
}

export interface AnalysisSegment extends BaseEntity {
  jobId: string;
  startMs: number;
  endMs: number;
  periodLabel: string; // Q1, Q2, OT1, etc.
  possessionTeamId?: string | null;
}

export interface TrackedPlayer extends BaseEntity {
  jobId: string;
  trackId: string;
  jerseyNumber?: string | null;
  teamSide: TeamSide;
  confidence: number; // 0-1
}

export interface RosterLink extends BaseEntity {
  trackedPlayerId: string;
  playerId: string;
  playerName?: string;
  confidence: number; // 0-1
  source: RosterLinkSource;
  lockedBy?: string | null;
}

export interface DetectedEvent extends BaseEntity {
  sessionId: string;
  segmentId: string;
  tMs: number; // timestamp in ms from start
  endMs?: number | null;
  type: DetectedEventType;
  primaryPlayerId?: string | null;
  primaryPlayerName?: string | null;
  assistPlayerId?: string | null;
  assistPlayerName?: string | null;
  confidence: number; // 0-1
  needsReview: boolean;
  providerEventId?: string | null;
}

export interface StatAttribution extends BaseEntity {
  eventId: string;
  playerId: string;
  statKey: string;
  delta: number;
  confidence: number;
}

export interface PlayerStatLine extends BaseEntity {
  sessionId: string;
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  pts: number;
  ast: number;
  reb: number;
  oreb: number;
  dreb: number;
  stl: number;
  blk: number;
  to: number;
  fls: number;
  fg: number;
  fga: number;
  tp: number;
  tpa: number;
  ft: number;
  fta: number;
  min: number;
  derivedAt: string;
}

export interface TeamStatSummary extends BaseEntity {
  sessionId: string;
  teamName: string;
  pts: number;
  ast: number;
  reb: number;
  oreb: number;
  dreb: number;
  stl: number;
  blk: number;
  to: number;
  fls: number;
  fg: number;
  fga: number;
  tp: number;
  tpa: number;
  ft: number;
  fta: number;
  pace?: number | null;
  offRtg?: number | null;
  defRtg?: number | null;
  derivedAt: string;
}

export interface HighlightCandidate extends BaseEntity {
  sessionId: string;
  playerId?: string | null;
  playerName?: string | null;
  eventIds: string[];
  startMs: number;
  endMs: number;
  score: number; // highlight quality 0-1
  reason: string;
  status: HighlightCandidateStatus;
  thumbnailUri?: string | null;
}

export interface HighlightClip extends BaseEntity {
  candidateId: string;
  mediaRef: MediaRef;
  coachNotes?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  title?: string;
}

export interface MediaRef {
  assetId: string;
  startMs: number;
  endMs: number;
}

export interface HighlightReel extends BaseEntity {
  playerId?: string | null;
  playerName?: string | null;
  clipIds: string[];
  title: string;
  visibility: ReelVisibility;
  publishedAt?: string | null;
}

export interface ReviewDecision extends BaseEntity {
  targetType: ReviewTargetType;
  targetId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  decidedBy: string;
  decidedAt: string;
  reason?: string | null;
}

export interface ProcessingIssue extends BaseEntity {
  jobId: string;
  stage: AnalysisStage;
  severity: IssueSeverity;
  code: string;
  message: string;
  context?: Record<string, unknown> | null;
}

export interface ExportRequest extends BaseEntity {
  targetType: ExportTargetType;
  targetId: string;
  format: ExportFormat;
  status: ExportStatus;
  resultUri?: string | null;
  requestedBy: string;
}

// ── Confidence helpers ───────────────────────────────────────

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return ConfidenceLevel.High;
  if (score >= 0.6) return ConfidenceLevel.Medium;
  return ConfidenceLevel.Low;
}

// ── CV Provider Adapter (shared contract) ────────────────────

export interface ProviderJobHandle {
  providerId: string;
  externalJobId: string;
}

export interface ProviderJobStatus {
  stage: string;
  progressPct: number;
  done: boolean;
  error?: string;
}

export interface RawAnalysisPayload {
  providerId: string;
  modelVersion: string;
  events: unknown[];
  tracks: unknown[];
  metadata: Record<string, unknown>;
}

export interface CVProviderAdapter {
  id: string;
  submit(job: { sessionId: string; assetUri: string; config?: Record<string, unknown> }): Promise<ProviderJobHandle>;
  poll(handle: ProviderJobHandle): Promise<ProviderJobStatus>;
  fetchResults(handle: ProviderJobHandle): Promise<RawAnalysisPayload>;
  cancel(handle: ProviderJobHandle): Promise<void>;
}

// ── Video pipeline adapter (server/modules/film-analysis/pipeline) ─

export type PipelineStage =
  | "METADATA_EXTRACTION"
  | "CALIBRATION"
  | "PLAYER_DETECTION"
  | "IDENTITY_TRACKING"
  | "ROSTER_MAPPING"
  | "POSSESSION_SEGMENTATION"
  | "EVENT_CLASSIFICATION"
  | "STAT_VALIDATION"
  | "CLIP_BOUNDARY_GEN"
  | "CONFIDENCE_SCORING";

export type SegmentStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";

export type PipelineJobStatusToken =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETE"
  | "CANCELLED"
  | "FAILED";

export interface PipelineJobInput {
  filmSessionId: string;
  analysisJobId: string;
  orgId: string;
  teamId: string;
  assetUri: string;
}

export interface PipelineStatusResponse {
  externalJobId: string;
  status: PipelineJobStatusToken;
  progressPct: number;
  currentStage: PipelineStage | null;
  stageStatuses: Partial<Record<PipelineStage, SegmentStatus>>;
  estimatedCompletionMs: number | null;
}

export interface PipelineResults {
  trackedPlayers: Array<{
    filmSessionId: string;
    analysisJobId: string;
    trackingId: string;
    jerseyNumber: string;
    teamSide: "HOME" | "AWAY";
    detectionConfidence: number;
    appearanceFrames: number;
    thumbnailPath: string | null;
  }>;
  rosterLinks: unknown[];
  detectedEvents: unknown[];
  issues: Array<{
    analysisJobId: string;
    entityType: string | null;
    entityId: string | null;
    issueCode: string;
    severity: "INFO" | "WARN" | "ERROR";
    message: string;
  }>;
}

// ── API request/response shapes ──────────────────────────────

export interface InitiateUploadRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** coaching_actions.id — when set, the new session is auto-linked as follow-up evidence */
  resolvesActionId?: string;
}

export interface InitiateUploadResponse {
  /** The film_session row id — use this to poll GET /sessions/:sessionId */
  sessionId: string;
  /** The film_asset row id */
  assetId: string;
  uploadUrl: string; // presigned
  expiresAt: string;
}

export interface CreateSessionRequest {
  assetId: string;
  kind: FilmSessionKind;
  title: string;
  playedAt: string;
  homeAway: HomeAway;
  opponentName?: string;
  notes?: string;
}

export interface SubmitReviewRequest {
  targetType: ReviewTargetType;
  targetId: string;
  after: Record<string, unknown>;
  reason?: string;
}

export interface CreateExportRequest {
  targetType: ExportTargetType;
  targetId: string;
  format: ExportFormat;
}

export interface EventsQueryParams {
  playerId?: string;
  period?: string;
  eventType?: DetectedEventType;
  minConfidence?: number;
  needsReview?: boolean;
  page?: number;
  limit?: number;
}
