/**
 * Film Room v2 — client types. Mirrors server/modules/clips/routes.ts payloads
 * and shared/db/schema/film_room.ts. Spec: docs/film-room-schema-api.md.
 */

export type FilmStatus = "uploading" | "processing" | "ready" | "failed" | "archived";
export type FilmKind = "game" | "practice" | "skill_rep" | "highlight";
export type ClipStatus = "suggested" | "draft" | "approved" | "assigned" | "archived";
export type AssignmentStatus =
  | "draft" | "assigned" | "opened" | "watched" | "responded" | "completed" | "archived";
export type Priority = "low" | "normal" | "high";
export type FollowupKind =
  | "reply" | "nudge" | "due_change" | "complete" | "reopen" | "reassign" | "escalate" | "archive";

export interface FilmSummary {
  id: string;
  title: string;
  kind: FilmKind;
  status: FilmStatus;
  opponent: string | null;
  playedAt: string | null;
  durationSeconds: number | null;
  /** Mux playback id when available; null in demo/processing */
  playbackId: string | null;
  clipCount: number;
  sentCount: number;
  unwatchedCount: number;
  overdueCount: number;
}

export interface Clip {
  id: string;
  sessionId: string;
  source: "coach" | "ai_accepted";
  status: ClipStatus;
  startMs: number;
  endMs: number;
  title: string;
  note: string;
  noteSource: "coach" | "ai_draft_accepted" | "ai_draft_edited";
  categories: string[];
  priority: Priority;
  lockedAt: string | null;
  playerIds: string[];
  createdAt: string;
}

export interface AttentionCounts {
  readyToClip: number;
  readyToSend: number;
  awaitingPlayers: number;
  overdue: number;
}

export interface QueueRow {
  id: string; // assignment_player id
  status: AssignmentStatus;
  overdue: boolean;
  player: { id: string; name: string; position: string | null };
  clip: {
    id: string; title: string; startMs: number; endMs: number;
    categories: string[]; priority: Priority; sessionId: string;
  };
  sessionTitle: string;
  assignedBy: string;
  dueAt: string | null;
  requireResponse: boolean;
  responsePrompt: string | null;
  sentAt: string | null;
  openedAt: string | null;
  watchedAt: string | null;
  watchPct: number;
  respondedAt: string | null;
  completedAt: string | null;
  reviewRequested: boolean;
  nudgeCount: number;
}

export interface QueueSummary {
  active: number;
  watched: number;
  responded: number;
  overdue: number;
}

export interface PlayerReviewEntry {
  id: string;
  kind: "text" | "choice" | "confidence" | "flag_review_request";
  textBody: string | null;
  confidence: number | null;
  createdAt: string;
}

export interface FollowupEntry {
  id: string;
  kind: FollowupKind;
  body: string | null;
  meta: Record<string, unknown>;
  authorUserId: string;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  actorKind: string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface AssignmentDetail extends Omit<QueueRow, "clip" | "sessionTitle"> {
  clip: Clip;
  session: { id: string; title: string; kind: FilmKind };
  reviews: PlayerReviewEntry[];
  followups: FollowupEntry[];
  events: AuditEntry[];
}

export interface RosterPlayer {
  id: string;
  name: string;
  position: string | null;
  jersey?: string;
}

export function msToClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function clipDuration(c: { startMs: number; endMs: number }): string {
  return msToClock(c.endMs - c.startMs);
}

export function isActionable(status: AssignmentStatus): boolean {
  return status === "assigned" || status === "opened" || status === "watched";
}
