/**
 * useFilmAnalysis.ts
 *
 * React Query–backed hook for the Coach Film Room and related pages.
 * Fetches real sessions from GET /api/film-analysis/sessions and maps
 * the API shape to the UI shape expected by FilmRoomPage / FilmSessionPage.
 *
 * Falls back to an empty list (not mock data) so coaches see the actual
 * state of the database.  The mock layer is preserved only for
 * getPlayerHighlights(), which belongs to a separate slice.
 */

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import { mockPlayerHighlights } from "@shared/film-analysis/mock";
import type {
  PlayerHighlight,
  FilmSession,
  FilmSessionStatus,
  TeamGameStats,
  CreateSessionInput,
} from "@shared/film-analysis/mock";

// ── API types (from shared/film-analysis/types.ts) ───────────────────────────

interface ApiJob {
  status: string;
  progressPct: number;
}

interface ApiSession {
  id: string;
  title: string;
  opponentName?: string | null;
  playedAt: string;
  status: string;
  durationSec?: number | null;
  createdAt: string;
  job?: ApiJob;
}

// ── Status mapping ────────────────────────────────────────────────────────────

function deriveUiStatus(
  sessionStatus: string,
  jobStatus?: string,
): FilmSessionStatus {
  if (sessionStatus === "ready") return "ready";
  if (sessionStatus === "failed") return "failed";
  // uploading / processing from the session or job side → show processing bar
  if (
    sessionStatus === "uploading" ||
    sessionStatus === "processing" ||
    jobStatus === "processing"
  )
    return "processing";
  if (sessionStatus === "queued" || jobStatus === "queued") return "queued";
  // "draft" or anything else that has a video present → "uploaded"
  return "uploaded";
}

const EMPTY_STATS: TeamGameStats = {
  points: 0,
  fgPct: 0,
  threePct: 0,
  rebounds: 0,
  assists: 0,
  turnovers: 0,
  pace: 0,
};

function mapApiToUi(s: ApiSession): FilmSession {
  const status = deriveUiStatus(s.status, s.job?.status);
  return {
    id: s.id,
    title: s.title,
    opponent: s.opponentName ?? "",
    gameDate: s.playedAt,
    status,
    progressPct: s.job?.progressPct ?? (status === "ready" ? 100 : 0),
    durationSec: s.durationSec ?? 0,
    // Stats/timeline populated by separate analysis endpoints (later slices)
    teamStats: { ...EMPTY_STATS },
    timeline: [],
    playerStats: [],
    createdAt: s.createdAt,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseFilmAnalysisResult {
  sessions: FilmSession[];
  isLoading: boolean;
  error: Error | null;
  getSession: (id: string) => FilmSession | undefined;
  getPlayerHighlights: (playerId: string) => PlayerHighlight[];
  /** @deprecated Upload flow creates sessions via POST /uploads/initiate */
  createSession: (input: CreateSessionInput) => Promise<FilmSession>;
  /** Invalidate the sessions cache — call after a new upload completes */
  invalidateSessions: () => void;
}

export function useFilmAnalysis(): UseFilmAnalysisResult {
  const qc = useQueryClient();

  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery<FilmSession[]>({
    queryKey: ["film-sessions"],
    queryFn: async () => {
      const data = await apiGet<ApiSession[]>("/film-analysis/sessions");
      return data.map(mapApiToUi);
    },
    // On error (401 in demo mode, network issues, etc.) return empty list
    // so the UI shows the empty-state card rather than mock sessions.
    throwOnError: false,
    retry: false,
  });

  const getSession = React.useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions],
  );

  const getPlayerHighlights = React.useCallback(
    (playerId: string) =>
      mockPlayerHighlights.filter((h) => h.playerId === playerId),
    [],
  );

  const invalidateSessions = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["film-sessions"] });
  }, [qc]);

  // createSession is no longer used — uploads go through FilmUploadPage →
  // POST /api/film-analysis/uploads/initiate.  Kept for interface compat.
  const createSession = React.useCallback(
    async (_input: CreateSessionInput): Promise<FilmSession> => {
      throw new Error(
        "createSession is deprecated. Use the upload flow (POST /uploads/initiate) instead.",
      );
    },
    [],
  );

  return {
    sessions,
    isLoading,
    error: error instanceof Error ? error : null,
    getSession,
    getPlayerHighlights,
    createSession,
    invalidateSessions,
  };
}
