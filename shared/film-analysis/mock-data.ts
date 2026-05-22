// ─────────────────────────────────────────────────────────────
// HoopsIQ — Film AI Analysis: Mock Data for UI Development
// ─────────────────────────────────────────────────────────────

import type {
  FilmAsset, FilmSession, AnalysisJob, AnalysisSegment,
  DetectedEvent, PlayerStatLine, TeamStatSummary,
  HighlightCandidate, HighlightClip, HighlightReel, ReviewDecision,
} from './types';

import {
  UploadStatus, FilmSessionKind, HomeAway,
  AnalysisJobStatus, AnalysisStage, TeamSide,
  DetectedEventType, HighlightCandidateStatus, ReelVisibility,
  ReviewTargetType,
} from './types';

// ── Shared IDs ───────────────────────────────────────────────

const ORG = 'org_demo_001';
const TEAM = 'team_varsity_001';
const COACH = 'user_coach_001';
const NOW = '2026-05-03T14:00:00Z';

const base = {
  orgId: ORG,
  teamId: TEAM,
  createdBy: COACH,
  createdAt: NOW,
  updatedAt: NOW,
  version: 1,
  deletedAt: null,
};

// ── FilmAsset ────────────────────────────────────────────────

export const mockFilmAsset: FilmAsset = {
  ...base,
  id: 'asset_001',
  sourceUri: 's3://hoopsos-film/org_demo_001/game_20260502.mp4',
  mimeType: 'video/mp4',
  durationMs: 5_400_000, // 90 min
  sizeBytes: 2_400_000_000,
  checksum: 'sha256:abc123def456',
  uploadStatus: UploadStatus.Ready,
  thumbnailUri: '/thumbnails/asset_001.jpg',
  filename: 'game_vs_westbury_20260502.mp4',
};

// ── FilmSession ──────────────────────────────────────────────

export const mockFilmSession: FilmSession = {
  ...base,
  id: 'session_001',
  assetId: 'asset_001',
  kind: FilmSessionKind.Game,
  opponentTeamId: 'team_westbury_001',
  opponentName: 'Westbury Eagles',
  playedAt: '2026-05-02T19:00:00Z',
  homeAway: HomeAway.Home,
  rosterSnapshotId: 'roster_snap_001',
  notes: 'Regional semifinal. Good intensity.',
  title: 'vs. Westbury Eagles — Regional Semi',
  status: 'ready',
  durationSec: 5400,
};

// ── AnalysisJob ──────────────────────────────────────────────

export const mockAnalysisJob: AnalysisJob = {
  ...base,
  id: 'job_001',
  sessionId: 'session_001',
  providerId: 'mock-cv-provider',
  modelVersion: 'v2.1.0',
  status: AnalysisJobStatus.Succeeded,
  stage: AnalysisStage.Complete,
  progressPct: 100,
  startedAt: '2026-05-03T02:00:00Z',
  finishedAt: '2026-05-03T02:47:00Z',
  errorCode: null,
  errorMessage: null,
  parentJobId: null,
};

export const mockAnalysisJobRunning: AnalysisJob = {
  ...base,
  id: 'job_002',
  sessionId: 'session_002',
  providerId: 'mock-cv-provider',
  modelVersion: 'v2.1.0',
  status: AnalysisJobStatus.Running,
  stage: AnalysisStage.EventClassify,
  progressPct: 62,
  startedAt: '2026-05-03T13:30:00Z',
  finishedAt: null,
  errorCode: null,
  errorMessage: null,
  parentJobId: null,
};

// ── Segments ─────────────────────────────────────────────────

export const mockSegments: AnalysisSegment[] = [
  { ...base, id: 'seg_q1', jobId: 'job_001', startMs: 0, endMs: 480_000, periodLabel: 'Q1', possessionTeamId: null },
  { ...base, id: 'seg_q2', jobId: 'job_001', startMs: 480_000, endMs: 960_000, periodLabel: 'Q2', possessionTeamId: null },
  { ...base, id: 'seg_q3', jobId: 'job_001', startMs: 960_000, endMs: 1_440_000, periodLabel: 'Q3', possessionTeamId: null },
  { ...base, id: 'seg_q4', jobId: 'job_001', startMs: 1_440_000, endMs: 1_920_000, periodLabel: 'Q4', possessionTeamId: null },
];

// ── Detected Events ──────────────────────────────────────────

export const mockEvents: DetectedEvent[] = [
  { ...base, id: 'evt_001', sessionId: 'session_001', segmentId: 'seg_q1', tMs: 45_200, endMs: null, type: DetectedEventType.Make3, primaryPlayerId: 'player_001', primaryPlayerName: 'Jalen Carter', assistPlayerId: 'player_003', assistPlayerName: 'Marcus Williams', confidence: 0.94, needsReview: false, providerEventId: 'prov_e1' },
  { ...base, id: 'evt_002', sessionId: 'session_001', segmentId: 'seg_q1', tMs: 112_800, endMs: null, type: DetectedEventType.Steal, primaryPlayerId: 'player_002', primaryPlayerName: 'DeShawn Mitchell', assistPlayerId: null, assistPlayerName: null, confidence: 0.87, needsReview: false, providerEventId: 'prov_e2' },
  { ...base, id: 'evt_003', sessionId: 'session_001', segmentId: 'seg_q1', tMs: 118_400, endMs: null, type: DetectedEventType.Make2, primaryPlayerId: 'player_002', primaryPlayerName: 'DeShawn Mitchell', assistPlayerId: null, assistPlayerName: null, confidence: 0.91, needsReview: false, providerEventId: 'prov_e3' },
  { ...base, id: 'evt_004', sessionId: 'session_001', segmentId: 'seg_q2', tMs: 520_000, endMs: null, type: DetectedEventType.Block, primaryPlayerId: 'player_004', primaryPlayerName: 'Terrence Okafor', assistPlayerId: null, assistPlayerName: null, confidence: 0.72, needsReview: true, providerEventId: 'prov_e4' },
  { ...base, id: 'evt_005', sessionId: 'session_001', segmentId: 'seg_q2', tMs: 680_000, endMs: null, type: DetectedEventType.Assist, primaryPlayerId: 'player_003', primaryPlayerName: 'Marcus Williams', assistPlayerId: null, assistPlayerName: null, confidence: 0.55, needsReview: true, providerEventId: 'prov_e5' },
  { ...base, id: 'evt_006', sessionId: 'session_001', segmentId: 'seg_q3', tMs: 1_020_000, endMs: null, type: DetectedEventType.Make3, primaryPlayerId: 'player_001', primaryPlayerName: 'Jalen Carter', assistPlayerId: 'player_005', assistPlayerName: 'Kofi Mensah', confidence: 0.96, needsReview: false, providerEventId: 'prov_e6' },
  { ...base, id: 'evt_007', sessionId: 'session_001', segmentId: 'seg_q3', tMs: 1_180_000, endMs: null, type: DetectedEventType.Turnover, primaryPlayerId: 'player_003', primaryPlayerName: 'Marcus Williams', assistPlayerId: null, assistPlayerName: null, confidence: 0.48, needsReview: true, providerEventId: 'prov_e7' },
  { ...base, id: 'evt_008', sessionId: 'session_001', segmentId: 'seg_q4', tMs: 1_650_000, endMs: null, type: DetectedEventType.ReboundDef, primaryPlayerId: 'player_004', primaryPlayerName: 'Terrence Okafor', assistPlayerId: null, assistPlayerName: null, confidence: 0.89, needsReview: false, providerEventId: 'prov_e8' },
];

// ── Player Stat Lines ────────────────────────────────────────

export const mockPlayerStats: PlayerStatLine[] = [
  { ...base, id: 'psl_001', sessionId: 'session_001', playerId: 'player_001', playerName: 'Jalen Carter', jerseyNumber: '3', pts: 22, ast: 4, reb: 5, oreb: 1, dreb: 4, stl: 1, blk: 0, to: 2, fls: 2, fg: 7, fga: 14, tp: 4, tpa: 8, ft: 4, fta: 5, min: 32, derivedAt: NOW },
  { ...base, id: 'psl_002', sessionId: 'session_001', playerId: 'player_002', playerName: 'DeShawn Mitchell', jerseyNumber: '11', pts: 18, ast: 6, reb: 3, oreb: 0, dreb: 3, stl: 3, blk: 0, to: 3, fls: 3, fg: 7, fga: 13, tp: 2, tpa: 5, ft: 2, fta: 2, min: 34, derivedAt: NOW },
  { ...base, id: 'psl_003', sessionId: 'session_001', playerId: 'player_003', playerName: 'Marcus Williams', jerseyNumber: '5', pts: 12, ast: 8, reb: 4, oreb: 1, dreb: 3, stl: 1, blk: 0, to: 4, fls: 1, fg: 5, fga: 10, tp: 1, tpa: 3, ft: 1, fta: 2, min: 30, derivedAt: NOW },
  { ...base, id: 'psl_004', sessionId: 'session_001', playerId: 'player_004', playerName: 'Terrence Okafor', jerseyNumber: '24', pts: 14, ast: 1, reb: 11, oreb: 4, dreb: 7, stl: 0, blk: 3, to: 1, fls: 4, fg: 6, fga: 9, tp: 0, tpa: 0, ft: 2, fta: 4, min: 28, derivedAt: NOW },
  { ...base, id: 'psl_005', sessionId: 'session_001', playerId: 'player_005', playerName: 'Kofi Mensah', jerseyNumber: '1', pts: 8, ast: 3, reb: 2, oreb: 0, dreb: 2, stl: 2, blk: 1, to: 1, fls: 2, fg: 3, fga: 7, tp: 1, tpa: 3, ft: 1, fta: 1, min: 26, derivedAt: NOW },
];

// ── Team Stat Summary ────────────────────────────────────────

export const mockTeamStats: TeamStatSummary = {
  ...base,
  id: 'tss_001',
  sessionId: 'session_001',
  teamName: 'HoopsIQ Varsity',
  pts: 74,
  ast: 22,
  reb: 35,
  oreb: 8,
  dreb: 27,
  stl: 7,
  blk: 4,
  to: 11,
  fls: 16,
  fg: 28,
  fga: 58,
  tp: 8,
  tpa: 22,
  ft: 10,
  fta: 14,
  pace: 72.4,
  offRtg: 108.2,
  defRtg: 98.6,
  derivedAt: NOW,
};

// ── Highlight Candidates ─────────────────────────────────────

export const mockHighlightCandidates: HighlightCandidate[] = [
  { ...base, id: 'hc_001', sessionId: 'session_001', playerId: 'player_001', playerName: 'Jalen Carter', eventIds: ['evt_001'], startMs: 42_000, endMs: 48_000, score: 0.92, reason: 'Catch-and-shoot three from deep', status: HighlightCandidateStatus.Approved, thumbnailUri: '/thumbs/hc_001.jpg' },
  { ...base, id: 'hc_002', sessionId: 'session_001', playerId: 'player_002', playerName: 'DeShawn Mitchell', eventIds: ['evt_002', 'evt_003'], startMs: 110_000, endMs: 121_000, score: 0.88, reason: 'Steal + coast-to-coast layup', status: HighlightCandidateStatus.Approved, thumbnailUri: '/thumbs/hc_002.jpg' },
  { ...base, id: 'hc_003', sessionId: 'session_001', playerId: 'player_004', playerName: 'Terrence Okafor', eventIds: ['evt_004'], startMs: 517_000, endMs: 523_000, score: 0.71, reason: 'Weakside block', status: HighlightCandidateStatus.Proposed, thumbnailUri: '/thumbs/hc_003.jpg' },
  { ...base, id: 'hc_004', sessionId: 'session_001', playerId: 'player_001', playerName: 'Jalen Carter', eventIds: ['evt_006'], startMs: 1_017_000, endMs: 1_023_000, score: 0.95, reason: 'Stepback three off screen', status: HighlightCandidateStatus.Approved, thumbnailUri: '/thumbs/hc_004.jpg' },
];

// ── Highlight Clips ──────────────────────────────────────────

export const mockHighlightClips: HighlightClip[] = [
  { ...base, id: 'clip_001', candidateId: 'hc_001', mediaRef: { assetId: 'asset_001', startMs: 42_000, endMs: 48_000 }, coachNotes: 'Great release. Use for shooting reel.', approvedBy: COACH, approvedAt: NOW, title: 'Deep 3 — Q1' },
  { ...base, id: 'clip_002', candidateId: 'hc_002', mediaRef: { assetId: 'asset_001', startMs: 110_000, endMs: 121_000 }, coachNotes: null, approvedBy: COACH, approvedAt: NOW, title: 'Steal + Layup — Q1' },
  { ...base, id: 'clip_003', candidateId: 'hc_004', mediaRef: { assetId: 'asset_001', startMs: 1_017_000, endMs: 1_023_000 }, coachNotes: 'Textbook use of the screen.', approvedBy: COACH, approvedAt: NOW, title: 'Stepback 3 — Q3' },
];

// ── Highlight Reel ───────────────────────────────────────────

export const mockHighlightReel: HighlightReel = {
  ...base,
  id: 'reel_001',
  playerId: 'player_001',
  playerName: 'Jalen Carter',
  clipIds: ['clip_001', 'clip_003'],
  title: 'Jalen Carter — Regional Semi Highlights',
  visibility: ReelVisibility.Team,
  publishedAt: null,
};

// ── Review Decisions ─────────────────────────────────────────

export const mockReviewDecisions: ReviewDecision[] = [
  { ...base, id: 'rd_001', targetType: ReviewTargetType.Event, targetId: 'evt_005', before: { type: 'assist', primaryPlayerId: 'player_003' }, after: { type: 'assist', primaryPlayerId: 'player_002' }, decidedBy: COACH, decidedAt: NOW, reason: 'Assist was from Mitchell, not Williams. AI misidentified jersey.' },
];

// ── Sessions list (for index page) ───────────────────────────

export const mockSessionsList: Array<FilmSession & { job: AnalysisJob }> = [
  { ...mockFilmSession, job: mockAnalysisJob },
  {
    ...base,
    id: 'session_002',
    assetId: 'asset_002',
    kind: FilmSessionKind.Practice,
    opponentTeamId: null,
    opponentName: null,
    playedAt: '2026-05-01T16:00:00Z',
    homeAway: HomeAway.Home,
    rosterSnapshotId: 'roster_snap_001',
    notes: 'Half-court sets focus',
    title: 'Practice — Half Court Sets',
    status: 'ready',
    durationSec: 3600,
    job: mockAnalysisJobRunning,
  },
];
