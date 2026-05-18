/**
 * Film-to-Action mock data.
 *
 * Models the full pipeline from raw upload → AI analysis → clips →
 * coach review actions → player assignments → IDP evidence.
 *
 * Key relationships:
 *  - FilmEntry     → has many ExtractedClip
 *  - ExtractedClip → may have a ClipActionState (assign, goal, plan, scout, response)
 *  - ClipAssignment → tracks per-player completion for assigned clips
 *  - ExtractedClip.evidenceId → links into DevelopmentEvidence on player IDP
 *
 * Acceptance criteria baked into mock state:
 *  ✓ Low-confidence entries are sorted first in queue (aiConfidence < 0.70)
 *  ✓ One clip is attached to a development goal (linkedGoalId set)
 *  ✓ One clip is assigned to a player with response required
 */

import type { DevelopmentEvidence } from "@/lib/mock/player-development";

/* ─── Enums / union types ────────────────────────────────────────────────── */

export type FilmType = "game" | "practice" | "drill_session" | "scrimmage";

export type ProcessingStatus =
  | "uploading"
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "low_confidence";

export type ClipCategory =
  | "Finishing"
  | "Defense"
  | "Transition"
  | "Ball Handling"
  | "Shooting"
  | "Playmaking"
  | "Footwork"
  | "Screen Execution"
  | "Off-Ball"
  | "Communication";

export type AssignmentState =
  | "assigned"
  | "watched"
  | "response_submitted"
  | "coach_reviewed";

/* ─── Film entry ─────────────────────────────────────────────────────────── */

export interface FilmEntry {
  id: string;
  title: string;
  type: FilmType;
  /** Opponent name for game/scrimmage */
  opponent?: string;
  /** Concept/focus tags — ["pick-and-roll", "zone-offense", "full-game"] */
  tags: string[];
  date: string; // ISO yyyy-mm-dd
  /** Display duration e.g. "1:42:30" */
  duration?: string;
  processingStatus: ProcessingStatus;
  /** 0–100 while uploading or processing */
  processingProgress?: number;
  /** 0–1 after analysis completes */
  aiConfidence?: number;
  totalClips: number;
  reviewedClips: number;
  uploadedAt: string; // ISO
  uploadedBy: string;
  fileSizeMb?: number;
  /** Human-readable error shown on failed entries */
  errorMessage?: string;
  /** True = needs coach attention before clips are actioned */
  requiresLowConfidenceReview?: boolean;
}

/* ─── Extracted clip ─────────────────────────────────────────────────────── */

export interface ClipActionState {
  /** Assigned to a specific player */
  assignedToPlayerId?: string;
  assignedToPlayerName?: string;
  assignedToPlayerInitials?: string;
  /** Attached to a player IDP goal */
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  linkedGoalPlayerId?: string;
  /** Added to the next practice plan */
  addedToPracticePlan?: boolean;
  practicePlanNote?: string;
  /** Added to the active scout report */
  addedToScoutReport?: boolean;
  scoutReportNote?: string;
  /** Coach requested a video response from player */
  responseRequested?: boolean;
  /** IDP DevelopmentEvidence id created when clip was attached to a goal */
  evidenceId?: string;
  /** Coach has reviewed / actioned this clip */
  isReviewed: boolean;
  /** ISO timestamp when reviewed */
  reviewedAt?: string;
}

export interface ExtractedClip {
  id: string;
  filmId: string;
  title: string;
  /** Start timecode in the parent video */
  startTime: string; // "1:23"
  endTime: string;   // "1:47"
  category: ClipCategory;
  severity: "minor" | "major";
  aiMessage: string;
  /** 0–1 */
  aiConfidence: number;
  /** Roster IDs detected in the clip */
  detectedPlayerIds: string[];
  detectedPlayerNames: string[];
  tags: string[];
  /**
   * Low-confidence clips require a coach to either confirm the AI label or
   * override it before any downstream action is taken.
   */
  needsConfirmation: boolean;
  /** If coach overrode AI label, this is set */
  coachConfirmedCategory?: ClipCategory;
  coachConfirmedMessage?: string;
  actionState: ClipActionState;
}

/* ─── Player clip assignment ─────────────────────────────────────────────── */

export interface ClipAssignment {
  id: string;
  clipId: string;
  filmId: string;
  clipTitle: string;
  clipCategory: ClipCategory;
  playerId: string;
  playerName: string;
  playerInitials: string;
  assignedAt: string;
  /** ISO yyyy-mm-dd */
  dueDate: string;
  responseRequired: boolean;
  completionState: AssignmentState;
  watchPercent: number;
  playerNote?: string;
  coachFeedback?: string;
}

/* ─── Film library ───────────────────────────────────────────────────────── */

export const FILM_LIBRARY: FilmEntry[] = [
  // ── Game film (ready, normal confidence)
  {
    id: "film_1",
    title: "vs. Westbury Eagles — Full Game",
    type: "game",
    opponent: "Westbury Eagles",
    tags: ["full-game", "pick-and-roll", "zone-defense"],
    date: "2026-05-10",
    duration: "1:38:22",
    processingStatus: "ready",
    aiConfidence: 0.91,
    totalClips: 8,
    reviewedClips: 5,
    uploadedAt: "2026-05-10T22:15:00Z",
    uploadedBy: "Coach Grant",
    fileSizeMb: 2340,
  },
  // ── Practice film (ready, normal confidence)
  {
    id: "film_2",
    title: "Shooting Mechanics — May 14 Practice",
    type: "practice",
    tags: ["shooting", "form", "individual"],
    date: "2026-05-14",
    duration: "0:52:10",
    processingStatus: "ready",
    aiConfidence: 0.88,
    totalClips: 5,
    reviewedClips: 3,
    uploadedAt: "2026-05-14T19:05:00Z",
    uploadedBy: "Coach Grant",
    fileSizeMb: 1180,
  },
  // ── LOW CONFIDENCE — requires review before action
  {
    id: "film_3",
    title: "Defensive Slides — Speed Drill Series",
    type: "drill_session",
    tags: ["defense", "footwork", "conditioning"],
    date: "2026-05-15",
    duration: "0:28:44",
    processingStatus: "low_confidence",
    aiConfidence: 0.54,
    totalClips: 4,
    reviewedClips: 0,
    uploadedAt: "2026-05-15T17:20:00Z",
    uploadedBy: "Coach Grant",
    fileSizeMb: 640,
    requiresLowConfidenceReview: true,
  },
  // ── Currently processing
  {
    id: "film_4",
    title: "vs. Neptune Trojans — Scrimmage",
    type: "scrimmage",
    opponent: "Neptune Trojans",
    tags: ["scrimmage", "half-court", "game-prep"],
    date: "2026-05-17",
    processingStatus: "processing",
    processingProgress: 62,
    totalClips: 0,
    reviewedClips: 0,
    uploadedAt: "2026-05-17T20:00:00Z",
    uploadedBy: "Coach Grant",
    fileSizeMb: 1870,
  },
  // ── Queued (waiting for processing slot)
  {
    id: "film_5",
    title: "Individual Workouts — May 18",
    type: "drill_session",
    tags: ["individual", "ball-handling", "finishing"],
    date: "2026-05-18",
    processingStatus: "queued",
    totalClips: 0,
    reviewedClips: 0,
    uploadedAt: "2026-05-18T09:30:00Z",
    uploadedBy: "Coach Grant",
    fileSizeMb: 920,
  },
  // ── Upload in progress
  {
    id: "film_6",
    title: "South Texas Showcase — Game 1",
    type: "game",
    opponent: "Oak Hill Academy",
    tags: ["tournament", "full-game"],
    date: "2026-05-30",
    processingStatus: "uploading",
    processingProgress: 38,
    totalClips: 0,
    reviewedClips: 0,
    uploadedAt: "2026-05-18T10:15:00Z",
    uploadedBy: "Coach Grant",
    fileSizeMb: 3100,
  },
  // ── Failed processing
  {
    id: "film_7",
    title: "Film Session — Apr 28 Practice",
    type: "practice",
    tags: ["defense", "closeouts"],
    date: "2026-04-28",
    processingStatus: "failed",
    totalClips: 0,
    reviewedClips: 0,
    uploadedAt: "2026-04-28T18:00:00Z",
    uploadedBy: "Coach Grant",
    fileSizeMb: 1450,
    errorMessage: "AI processing timeout. Video may be corrupted. Re-upload or contact support.",
  },
];

/* ─── Extracted clips ────────────────────────────────────────────────────── */

export const EXTRACTED_CLIPS: ExtractedClip[] = [
  // ── From film_1 (Westbury game)
  {
    id: "clip_w1",
    filmId: "film_1",
    title: "Carter closeout — late rotation",
    startTime: "0:14",
    endTime: "0:31",
    category: "Defense",
    severity: "major",
    aiMessage: "Closeout arrives late — shooter gets uncontested look. Body angle opens too early.",
    aiConfidence: 0.92,
    detectedPlayerIds: ["a_1"],
    detectedPlayerNames: ["Jalen Carter"],
    tags: ["closeout", "defense", "individual"],
    needsConfirmation: false,
    actionState: {
      assignedToPlayerId: "a_1",
      assignedToPlayerName: "Jalen Carter",
      assignedToPlayerInitials: "JC",
      responseRequested: true,
      evidenceId: "ev-clip-w1",
      isReviewed: true,
      reviewedAt: "2026-05-11T10:00:00Z",
    },
  },
  {
    id: "clip_w2",
    filmId: "film_1",
    title: "Pick-and-roll hedge — Williams overcommits",
    startTime: "1:02",
    endTime: "1:18",
    category: "Defense",
    severity: "major",
    aiMessage: "Hard hedge by Williams opens a lane to the roller. Drop or switch would be better in this set.",
    aiConfidence: 0.87,
    detectedPlayerIds: ["a_2"],
    detectedPlayerNames: ["Marcus Williams"],
    tags: ["pick-and-roll", "defense", "team"],
    needsConfirmation: false,
    actionState: {
      addedToPracticePlan: true,
      practicePlanNote: "Ice coverage drill — add to Wednesday plan",
      isReviewed: true,
      reviewedAt: "2026-05-11T10:05:00Z",
    },
  },
  {
    id: "clip_w3",
    filmId: "film_1",
    title: "Transition breakdown — 3v2 allowed",
    startTime: "2:44",
    endTime: "3:02",
    category: "Transition",
    severity: "major",
    aiMessage: "Two players stopped at half on turnover. Back-tip coverage not set. Resulted in layup.",
    aiConfidence: 0.85,
    detectedPlayerIds: ["a_4", "a_6"],
    detectedPlayerNames: ["Tyrese Brooks", "Khalil Jenkins"],
    tags: ["transition", "defense", "effort"],
    needsConfirmation: false,
    actionState: {
      addedToScoutReport: true,
      scoutReportNote: "Opponent targets transition — flag for South Texas prep",
      isReviewed: false,
    },
  },
  {
    id: "clip_w4",
    filmId: "film_1",
    title: "Carter pull-up — balance breakdown",
    startTime: "4:17",
    endTime: "4:29",
    category: "Shooting",
    severity: "minor",
    aiMessage: "Forward lean at release point. Base drifts on gather step.",
    aiConfidence: 0.90,
    detectedPlayerIds: ["a_1"],
    detectedPlayerNames: ["Jalen Carter"],
    tags: ["shooting", "individual", "form"],
    needsConfirmation: false,
    // KEY: This clip is attached to Jalen Carter's shooting IDP goal
    actionState: {
      linkedGoalId: "goal_jc_shooting",
      linkedGoalTitle: "Shooting Goal — Pull-Up Consistency",
      linkedGoalPlayerId: "a_1",
      evidenceId: "ev-clip-w4",
      isReviewed: true,
      reviewedAt: "2026-05-11T10:12:00Z",
    },
  },
  {
    id: "clip_w5",
    filmId: "film_1",
    title: "Thompson off-ball — no baseline cut",
    startTime: "6:10",
    endTime: "6:24",
    category: "Off-Ball",
    severity: "minor",
    aiMessage: "Thompson stands in corner for 4.2s without movement. Baseline cut available.",
    aiConfidence: 0.78,
    detectedPlayerIds: ["a_7"],
    detectedPlayerNames: ["Miles Thompson"],
    tags: ["off-ball", "spacing", "individual"],
    needsConfirmation: false,
    actionState: {
      isReviewed: false,
    },
  },
  // ── From film_2 (May 14 Practice)
  {
    id: "clip_p1",
    filmId: "film_2",
    title: "DeAndre Johnson — hip turn on catch-and-shoot",
    startTime: "0:22",
    endTime: "0:38",
    category: "Shooting",
    severity: "minor",
    aiMessage: "Hips square before catching — body opens space for defender. Stay loaded until catch.",
    aiConfidence: 0.86,
    detectedPlayerIds: ["a_3"],
    detectedPlayerNames: ["DeAndre Johnson"],
    tags: ["shooting", "footwork", "individual"],
    needsConfirmation: false,
    actionState: {
      isReviewed: true,
      reviewedAt: "2026-05-15T09:00:00Z",
    },
  },
  {
    id: "clip_p2",
    filmId: "film_2",
    title: "Carter — consistent release point",
    startTime: "1:08",
    endTime: "1:22",
    category: "Shooting",
    severity: "minor",
    aiMessage: "Positive: 4 consecutive reps with consistent release height. Improvement from last session.",
    aiConfidence: 0.91,
    detectedPlayerIds: ["a_1"],
    detectedPlayerNames: ["Jalen Carter"],
    tags: ["shooting", "positive", "individual"],
    needsConfirmation: false,
    actionState: {
      linkedGoalId: "goal_jc_shooting",
      linkedGoalTitle: "Shooting Goal — Pull-Up Consistency",
      linkedGoalPlayerId: "a_1",
      evidenceId: "ev-clip-p2",
      isReviewed: true,
      reviewedAt: "2026-05-15T09:10:00Z",
    },
  },
  // ── From film_3 (LOW CONFIDENCE — defensive slides)
  {
    id: "clip_d1",
    filmId: "film_3",
    title: "Footwork pattern — possibly off-balance",
    startTime: "0:12",
    endTime: "0:28",
    category: "Footwork",
    severity: "minor",
    aiMessage: "Possible balance issue on lateral slide. Confidence low — lighting conditions may affect reading.",
    aiConfidence: 0.48,
    detectedPlayerIds: ["a_5"],
    detectedPlayerNames: ["Isaiah Moore"],
    tags: ["footwork", "defense", "low-confidence"],
    needsConfirmation: true, // requires coach review before action
    actionState: { isReviewed: false },
  },
  {
    id: "clip_d2",
    filmId: "film_3",
    title: "Close-out technique — unidentified player",
    startTime: "0:55",
    endTime: "1:08",
    category: "Defense",
    severity: "major",
    aiMessage: "Hard closeout — possible hand position issue. Could not reliably identify player from angle.",
    aiConfidence: 0.51,
    detectedPlayerIds: [],
    detectedPlayerNames: [],
    tags: ["defense", "closeout", "low-confidence"],
    needsConfirmation: true,
    actionState: { isReviewed: false },
  },
  {
    id: "clip_d3",
    filmId: "film_3",
    title: "Communication — defensive call timing",
    startTime: "1:44",
    endTime: "2:01",
    category: "Communication",
    severity: "minor",
    aiMessage: "Verbal call appears late vs. screen. Low confidence: audio analysis inconclusive.",
    aiConfidence: 0.55,
    detectedPlayerIds: ["a_6"],
    detectedPlayerNames: ["Khalil Jenkins"],
    tags: ["communication", "defense", "low-confidence"],
    needsConfirmation: true,
    actionState: { isReviewed: false },
  },
  {
    id: "clip_d4",
    filmId: "film_3",
    title: "Stance — hand height inconsistency",
    startTime: "2:22",
    endTime: "2:38",
    category: "Defense",
    severity: "minor",
    aiMessage: "Hands appear low in defensive stance. Video angle makes confirmation difficult.",
    aiConfidence: 0.59,
    detectedPlayerIds: ["a_11"],
    detectedPlayerNames: ["Devin Hayes"],
    tags: ["defense", "stance", "low-confidence"],
    needsConfirmation: true,
    actionState: { isReviewed: false },
  },
];

/* ─── Player clip assignments ────────────────────────────────────────────── */

export const CLIP_ASSIGNMENTS: ClipAssignment[] = [
  // Jalen Carter — closeout clip, response required (AC: assigned + response)
  {
    id: "ca_1",
    clipId: "clip_w1",
    filmId: "film_1",
    clipTitle: "Carter closeout — late rotation",
    clipCategory: "Defense",
    playerId: "a_1",
    playerName: "Jalen Carter",
    playerInitials: "JC",
    assignedAt: "2026-05-11T10:00:00Z",
    dueDate: "2026-05-15",
    responseRequired: true,
    completionState: "response_submitted",
    watchPercent: 100,
    playerNote: "I see it now — I was already opening my hips before the catch. I'll work on staying square in closeout drill tonight.",
    coachFeedback: "Good self-analysis. Drill work is exactly right. Add mirror session before next game.",
  },
  // Miles Thompson — unreviewed assignment
  {
    id: "ca_2",
    clipId: "clip_w5",
    filmId: "film_1",
    clipTitle: "Thompson off-ball — no baseline cut",
    clipCategory: "Off-Ball",
    playerId: "a_7",
    playerName: "Miles Thompson",
    playerInitials: "MT",
    assignedAt: "2026-05-12T08:00:00Z",
    dueDate: "2026-05-18",
    responseRequired: false,
    completionState: "assigned",
    watchPercent: 0,
  },
  // Marcus Williams — watched but no response needed
  {
    id: "ca_3",
    clipId: "clip_w2",
    filmId: "film_1",
    clipTitle: "Pick-and-roll hedge — Williams overcommits",
    clipCategory: "Defense",
    playerId: "a_2",
    playerName: "Marcus Williams",
    playerInitials: "MW",
    assignedAt: "2026-05-11T10:05:00Z",
    dueDate: "2026-05-14",
    responseRequired: false,
    completionState: "watched",
    watchPercent: 87,
  },
];

/* ─── IDP evidence records produced by clip actions ─────────────────────── */

/**
 * These records are what appear on the player's IDP when a coach attaches
 * a clip to a development goal. They satisfy the acceptance criterion:
 * "Given a coach attaches a clip to a development goal, when the player
 * IDP opens, then the clip appears as evidence."
 */
export const FILM_EVIDENCE: DevelopmentEvidence[] = [
  {
    id: "ev-clip-w4",
    playerId: "a_1",
    goalId: "goal_jc_shooting",
    type: "film_clip",
    date: "2026-05-11",
    title: "Film: Pull-up balance breakdown vs. Westbury",
    summary: "Forward lean at release — coach flagged for drill correction",
    filmClipId: "clip_w4",
    sentiment: "concern",
    aiConfidence: 0.90,
  },
  {
    id: "ev-clip-p2",
    playerId: "a_1",
    goalId: "goal_jc_shooting",
    type: "film_clip",
    date: "2026-05-15",
    title: "Film: Consistent release point — 4 reps",
    summary: "Positive: consistent release height over 4 consecutive reps in practice",
    filmClipId: "clip_p2",
    sentiment: "positive",
    aiConfidence: 0.91,
  },
  {
    id: "ev-clip-w1",
    playerId: "a_1",
    goalId: undefined,
    type: "film_clip",
    date: "2026-05-11",
    title: "Film: Closeout rotation — late arrival",
    summary: "Defensive closeout late by ~0.4s. Player reviewed and submitted self-analysis.",
    filmClipId: "clip_w1",
    sentiment: "neutral",
    aiConfidence: 0.92,
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

export function getClipsForFilm(filmId: string): ExtractedClip[] {
  return EXTRACTED_CLIPS.filter((c) => c.filmId === filmId);
}

export function getClipById(clipId: string): ExtractedClip | undefined {
  return EXTRACTED_CLIPS.find((c) => c.id === clipId);
}

export function getAssignmentsForPlayer(playerId: string): ClipAssignment[] {
  return CLIP_ASSIGNMENTS.filter((a) => a.playerId === playerId);
}

export function getAssignmentsForClip(clipId: string): ClipAssignment[] {
  return CLIP_ASSIGNMENTS.filter((a) => a.clipId === clipId);
}

export function getFilmById(filmId: string): FilmEntry | undefined {
  return FILM_LIBRARY.find((f) => f.id === filmId);
}

/** Sort queue: low-confidence first, then by unreviewed clip count desc */
export function getSortedQueue(): FilmEntry[] {
  const active = FILM_LIBRARY.filter(
    (f) => f.processingStatus === "ready" || f.processingStatus === "low_confidence"
  );
  return [...active].sort((a, b) => {
    // Low confidence always first
    if (a.processingStatus === "low_confidence" && b.processingStatus !== "low_confidence") return -1;
    if (b.processingStatus === "low_confidence" && a.processingStatus !== "low_confidence") return 1;
    // Then sort by unreviewed ratio descending
    const aUnreviewed = a.totalClips - a.reviewedClips;
    const bUnreviewed = b.totalClips - b.reviewedClips;
    return bUnreviewed - aUnreviewed;
  });
}

export const CLIP_CATEGORY_COLORS: Record<ClipCategory, string> = {
  Finishing: "oklch(0.72 0.18 290)",
  Defense: "oklch(0.68 0.22 25)",
  Transition: "oklch(0.78 0.16 75)",
  "Ball Handling": "oklch(0.75 0.12 140)",
  Shooting: "oklch(0.65 0.15 230)",
  Playmaking: "oklch(0.72 0.18 290)",
  Footwork: "oklch(0.78 0.16 75)",
  "Screen Execution": "oklch(0.68 0.22 25)",
  "Off-Ball": "oklch(0.55 0.02 260)",
  Communication: "oklch(0.75 0.12 140)",
};

export const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; color: string; bg: string }
> = {
  uploading: {
    label: "Uploading",
    color: "oklch(0.65 0.15 230)",
    bg: "oklch(0.65 0.15 230 / 0.10)",
  },
  queued: {
    label: "Queued",
    color: "oklch(0.55 0.02 260)",
    bg: "oklch(0.55 0.02 260 / 0.10)",
  },
  processing: {
    label: "Processing",
    color: "oklch(0.78 0.16 75)",
    bg: "oklch(0.78 0.16 75 / 0.10)",
  },
  ready: {
    label: "Ready",
    color: "oklch(0.75 0.12 140)",
    bg: "oklch(0.75 0.12 140 / 0.10)",
  },
  failed: {
    label: "Failed",
    color: "oklch(0.68 0.22 25)",
    bg: "oklch(0.68 0.22 25 / 0.10)",
  },
  low_confidence: {
    label: "Review Needed",
    color: "oklch(0.78 0.16 75)",
    bg: "oklch(0.78 0.16 75 / 0.10)",
  },
};
