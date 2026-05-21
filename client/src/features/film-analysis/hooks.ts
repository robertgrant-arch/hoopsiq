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
import { apiGet, apiPost } from "@/lib/api/client";
import type {
  AnalysisClip,
  BoundedEventType,
  CoachReviewStatus,
  SessionAnalysisSummary,
} from "./types";
import { MOCK_ANALYSIS_CLIPS, MOCK_SESSION_SUMMARY } from "./mock";

const KEYS = {
  clips:   (sessionId: string) => ["film-analysis-clips", sessionId] as const,
  summary: (sessionId: string) => ["film-analysis-summary", sessionId] as const,
};

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
    }: {
      clipId:           string;
      status:           CoachReviewStatus;
      note?:            string;
      editedEventType?: BoundedEventType;
    }) => {
      // Let errors propagate — onError will roll back the optimistic update
      await apiPost(`/film-analysis/clips/${clipId}/review`, {
        status,
        note,
        editedEventType,
      });
    },

    onMutate: async ({ clipId, status, note, editedEventType }) => {
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
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: "coach", // real impl: from auth context
                },
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
      // Invalidate summary so counts update
      qc.invalidateQueries({ queryKey: KEYS.summary(sessionId) });
    },
  });
}
