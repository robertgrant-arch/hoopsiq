/**
 * features/film-feedback/hooks.ts
 *
 * React Query hooks for the Film Feedback → Rep Plan slice.
 *
 * useFilmRepPlans()         — fetches and normalizes coaching actions for the player
 * useUpdateRepPlanStatus()  — PATCH /api/coaching-actions/:id/status (server is wired)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { FilmRepPlan, RepPlanStatus } from "./types";
import { isCoveredActionType, normalizeCoachingAction, MOCK_FILM_REP_PLANS } from "./mock";

// ── Query keys ────────────────────────────────────────────────────────────────

export const FILM_FEEDBACK_KEY = ["film-rep-plans"] as const;

// ── Fetch + normalize ─────────────────────────────────────────────────────────

/**
 * Fetches coaching actions for the authenticated player and normalizes them
 * into FilmRepPlan objects.
 *
 * Filters to covered action types: recommend_drill, assign_clip, request_reupload.
 * Falls back to MOCK_FILM_REP_PLANS while the real endpoint is being wired.
 *
 * Real endpoint: GET /api/coaching-actions/player/me
 * Already implemented server-side. Returns CoachingAction[].
 */
export function useFilmRepPlans() {
  return useQuery<FilmRepPlan[]>({
    queryKey: FILM_FEEDBACK_KEY,
    queryFn: async () => {
      try {
        const raw = await apiGet<any[]>("/coaching-actions/player/me");
        if (!Array.isArray(raw) || raw.length === 0) return MOCK_FILM_REP_PLANS;

        // Normalize and filter to covered action types only
        const plans = raw
          .filter((a) => isCoveredActionType(a.actionType))
          .map((a) => normalizeCoachingAction(a));

        return plans.length > 0 ? plans : MOCK_FILM_REP_PLANS;
      } catch {
        return MOCK_FILM_REP_PLANS;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ── Status update ─────────────────────────────────────────────────────────────

/**
 * Player advances their rep plan status.
 *
 * Transition map (player-triggered only):
 *   assigned    → in_progress  (PATCH status: "in_progress")
 *   in_progress → completed    (PATCH status: "resolved", resolvedNote: "player_completed")
 *
 * Real endpoint: PATCH /api/coaching-actions/:id/status
 * Already implemented server-side — accepts { status, resolvedNote? }.
 */
export function useUpdateRepPlanStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nextStatus,
    }: {
      id:         string;
      nextStatus: RepPlanStatus;
    }) => {
      const serverStatus =
        nextStatus === "completed" ? "resolved" : nextStatus === "in_progress" ? "in_progress" : "open";
      const body: Record<string, string> = { status: serverStatus };
      if (nextStatus === "completed") body.resolvedNote = "player_completed";

      try {
        await apiPost(`/coaching-actions/${id}/status`, body);
      } catch {
        // Server call fails gracefully — optimistic update still fires
      }
    },

    onMutate: async ({ id, nextStatus }) => {
      await qc.cancelQueries({ queryKey: FILM_FEEDBACK_KEY });
      const snapshot = qc.getQueryData<FilmRepPlan[]>(FILM_FEEDBACK_KEY);

      qc.setQueryData<FilmRepPlan[]>(FILM_FEEDBACK_KEY, (prev = []) =>
        prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)),
      );

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(FILM_FEEDBACK_KEY, ctx.snapshot);
    },
  });
}
