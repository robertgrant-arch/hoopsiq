/**
 * features/film-analysis/hooks.ts
 *
 * Data hooks for the structured film analysis slice.
 *
 * All hooks fall back to MOCK_ANALYSIS_CLIPS / MOCK_SESSION_SUMMARY while
 * the real pipeline emits structured events. The hook signatures are designed
 * so the mock can be swapped for real API calls without changing consumers.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api/client";
import type {
  AnalysisClip,
  BoundedEventType,
  CoachReviewStatus,
  SessionAnalysisSummary,
} from "./types";
import { MOCK_ANALYSIS_CLIPS, MOCK_SESSION_SUMMARY } from "./mock";

const KEYS = {
  clips:         (sessionId: string) => ["film-analysis-clips", sessionId] as const,
  approvedClips: (sessionId: string) => ["film-approved-clips", sessionId] as const,
  summary:       (sessionId: string) => ["film-analysis-summary", sessionId] as const,
};

// ── Approved clips for a session ─────────────────────────────────────────────
//
// Returns only clips whose coachDecision.status is confirmed | edited |
// flagged_for_teaching.  These are the canonical units for downstream
// analysis — pending and rejected candidates are excluded.
//
// Falls back to [] on error (no mock — an empty approved list is the
// correct state when no reviews have been recorded yet).
//
// Re-fetches whenever the clips cache is invalidated so approved counts
// stay in sync with the review UI without a manual refresh.

export function useApprovedClips(sessionId: string) {
  return useQuery<AnalysisClip[]>({
    queryKey: KEYS.approvedClips(sessionId),
    queryFn: async () => {
      try {
        const data = await apiGet<AnalysisClip[]>(
          `/film-analysis/sessions/${sessionId}/approved-clips`,
        );
        return Array.isArray(data) ? data : [];
      } catch {
        // 401 in demo mode, network errors → empty list (not mock)
        return [];
      }
    },
    staleTime: 60 * 1_000, // 1 min — short because reviews change this frequently
  });
}

// ── Fetch clips for a session ─────────────────────────────────────────────────

export function useAnalysisClips(sessionId: string) {
  return useQuery<AnalysisClip[]>({
    queryKey: KEYS.clips(sessionId),
    queryFn: async () => {
      try {
        const data = await apiGet<AnalysisClip[]>(
          `/film-analysis/sessions/${sessionId}/clips`
        );
        // Return the real array — including empty [] when no analysis has run.
        // Only fall back to mock on a non-array (unexpected shape) or catch block.
        if (Array.isArray(data)) return data;
        return MOCK_ANALYSIS_CLIPS;
      } catch {
        // 401 in demo mode, network errors → show mock clips so UI is not blank
        return MOCK_ANALYSIS_CLIPS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Session summary (aggregate counts) ───────────────────────────────────────

export function useSessionAnalysisSummary(sessionId: string) {
  return useQuery<SessionAnalysisSummary>({
    queryKey: KEYS.summary(sessionId),
    queryFn: async () => {
      try {
        const data = await apiGet<SessionAnalysisSummary>(
          `/film-analysis/sessions/${sessionId}/summary`
        );
        if (data && typeof data.totalClips === "number") return data;
        return MOCK_SESSION_SUMMARY;
      } catch {
        return MOCK_SESSION_SUMMARY;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Coach review (optimistic, real endpoint when wired) ───────────────────────

export function useCoachReviewClip(sessionId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clipId,
      status,
      note,
      editedEventType,
      teachingPoint,
    }: {
      clipId:           string;
      status:           CoachReviewStatus;
      note?:            string;
      editedEventType?: BoundedEventType;
      teachingPoint?:   { skill: string; instruction: string; clipUsage: string };
    }) => {
      // Let errors propagate — onError will roll back the optimistic update
      await apiPost(`/film-analysis/clips/${clipId}/review`, {
        status,
        note,
        editedEventType,
        teachingPoint,
      });
    },

    onMutate: async ({ clipId, status, note, editedEventType, teachingPoint }) => {
      await qc.cancelQueries({ queryKey: KEYS.clips(sessionId) });
      const snapshot = qc.getQueryData<AnalysisClip[]>(KEYS.clips(sessionId));

      qc.setQueryData<AnalysisClip[]>(KEYS.clips(sessionId), (prev = []) =>
        prev.map((clip) =>
          clip.id !== clipId
            ? clip
            : {
                ...clip,
                coachDecision: {
                  status,
                  note,
                  editedEventType,
                  teachingPoint,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: "coach",
                } as AnalysisClip["coachDecision"],
                inference: editedEventType
                  ? { ...clip.inference, eventType: editedEventType }
                  : clip.inference,
              }
        )
      );

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(KEYS.clips(sessionId), ctx.snapshot);
    },

    onSuccess: () => {
      // Invalidate clip lists, summary, and teaching points — all derived from annotations
      qc.invalidateQueries({ queryKey: KEYS.summary(sessionId) });
      qc.invalidateQueries({ queryKey: KEYS.approvedClips(sessionId) });
      qc.invalidateQueries({ queryKey: ["film-teaching-points", sessionId] });
    },
  });
}

// ── Session playback info (Mux playbackId + duration) ────────────────────────

export function useSessionPlayback(sessionId: string) {
  return useQuery<{ playbackId: string | null; durationSec: number | null }>({
    queryKey: ["film-session-playback", sessionId],
    queryFn: async () => {
      try {
        return await apiGet<{ playbackId: string | null; durationSec: number | null }>(
          `/film-analysis/sessions/${sessionId}/playback-info`,
        );
      } catch {
        return { playbackId: null, durationSec: null };
      }
    },
    staleTime: 10 * 60 * 1_000, // 10 min — playbackId rarely changes
  });
}

// ── Clip boundary update ──────────────────────────────────────────────────────

export function useUpdateClipBoundaries(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clipId,
      startMs,
      endMs,
    }: {
      clipId: string;
      startMs: number;
      endMs: number;
    }) => {
      return apiPatch<{ clipId: string; startMs: number; endMs: number; updatedAt: string }>(
        `/film-analysis/clips/${clipId}/boundaries`,
        { startMs, endMs },
      );
    },
    onSuccess: () => {
      // Invalidate clip lists so the new boundaries appear immediately
      qc.invalidateQueries({ queryKey: KEYS.clips(sessionId) });
      qc.invalidateQueries({ queryKey: KEYS.approvedClips(sessionId) });
    },
  });
}

// ── Classify approved clips for a session ────────────────────────────────────

export function useClassifySession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return apiPost<{ classified: number; skipped: number; message: string }>(
        `/film-analysis/sessions/${sessionId}/classify`,
        {},
      );
    },
    onSuccess: () => {
      // Re-fetch clips so the upgraded inference appears immediately
      qc.invalidateQueries({ queryKey: KEYS.clips(sessionId) });
      qc.invalidateQueries({ queryKey: KEYS.approvedClips(sessionId) });
    },
  });
}

// ── Session teaching points ───────────────────────────────────────────────────
// Fetches generated teaching points for a session.
// Only flagged_for_teaching clips with recorded teachingPoint contribute.
// Falls back to [] on error — an empty list is correct when no clips are flagged.

export function useSessionTeachingPoints(sessionId: string) {
  return useQuery<import("./types").GeneratedTeachingPoint[]>({
    queryKey: ["film-teaching-points", sessionId],
    queryFn: async () => {
      try {
        const data = await apiGet<import("./types").GeneratedTeachingPoint[]>(
          `/film-analysis/sessions/${sessionId}/teaching-points`,
        );
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    staleTime: 2 * 60 * 1_000, // 2 min — refreshes after review actions
  });
}

// ── Dispatch teaching point → player development ─────────────────────────────
// Creates a coaching action from a flagged_for_teaching clip and writes
// dispatch traceability back to the annotation row.

export function useDispatchTeachingPoint(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clipId,
      playerId,
    }: {
      clipId:    string;
      playerId?: string;
    }) => {
      return apiPost<{ coachingActionId: string; dispatchedAt: string; status: string }>(
        `/film-analysis/teaching-points/${clipId}/dispatch`,
        { playerId },
      );
    },
    onSuccess: () => {
      // Refresh teaching points so the dispatched badge updates
      qc.invalidateQueries({ queryKey: ["film-teaching-points", sessionId] });
      // Refresh clips so coachDecision.dispatchedAt is visible in the review UI
      qc.invalidateQueries({ queryKey: KEYS.clips(sessionId) });
    },
  });
}
