/**
 * features/player-development/hooks.ts
 *
 * Data hooks for the Player Development Hub.
 * All hooks follow the existing codebase pattern of:
 *   - useQuery / useMutation from @tanstack/react-query
 *   - apiGet / apiPost from @/lib/api/client
 *   - graceful fallback to mock data while backend endpoints are built
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api/client";
import type { PlayerHubData, CoachAction } from "./types";
import { MOCK_HUB_DATA } from "./mock";

// ── Query keys ─────────────────────────────────────────────────────────────

const KEYS = {
  hub:     ["player-hub"]             as const,
  actions: ["player-coaching-actions"] as const,
};

// ── Hub data ───────────────────────────────────────────────────────────────

/**
 * Fetches the full player hub payload from GET /api/player/hub.
 * Falls back to MOCK_HUB_DATA while the endpoint is being built.
 * When the real endpoint ships, remove the catch and the mock import.
 */
export function usePlayerHub() {
  return useQuery<PlayerHubData>({
    queryKey: KEYS.hub,
    queryFn:  async () => {
      try {
        const data = await apiGet<PlayerHubData>("/player/hub");
        // Validate shape — real endpoint may return a wrapped response
        if (data && Array.isArray((data as any).focusAreas)) return data;
        return MOCK_HUB_DATA;
      } catch {
        // Endpoint not yet implemented — use mock data
        return MOCK_HUB_DATA;
      }
    },
    staleTime: 5 * 60 * 1000, // treat hub data as fresh for 5 min
  });
}

// ── Coaching actions ───────────────────────────────────────────────────────

/**
 * Fetches coaching actions for the authenticated player.
 * GET /api/coaching-actions/player/me is already implemented on the server.
 * Falls back to the mock actions from the hub data if the call fails.
 */
export function usePlayerCoachingActions(mockFallback: CoachAction[]) {
  return useQuery<CoachAction[]>({
    queryKey: KEYS.actions,
    queryFn:  async () => {
      try {
        const data = await apiGet<CoachAction[]>("/coaching-actions/player/me");
        return Array.isArray(data) && data.length > 0 ? data : mockFallback;
      } catch {
        return mockFallback;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ── Drill completion ───────────────────────────────────────────────────────

/**
 * Marks a today's drill as completed.
 * Optimistically updates the hub cache so the UI responds instantly.
 * POST /api/player/drills/:id/complete — not yet implemented server-side;
 * the optimistic update still works so the UI feels real.
 */
export function useMarkDrillDone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (focusAreaId: string) => {
      try {
        await apiPost(`/player/drills/${focusAreaId}/complete`, {});
      } catch {
        // Endpoint not yet implemented; optimistic update is sufficient for now
      }
    },

    onMutate: async (focusAreaId) => {
      await qc.cancelQueries({ queryKey: KEYS.hub });
      const snapshot = qc.getQueryData<PlayerHubData>(KEYS.hub);

      if (snapshot) {
        qc.setQueryData<PlayerHubData>(KEYS.hub, {
          ...snapshot,
          focusAreas: snapshot.focusAreas.map((fa) =>
            fa.id === focusAreaId ? { ...fa, dueToday: false } : fa,
          ),
        });
      }
      return { snapshot };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(KEYS.hub, ctx.snapshot);
    },
  });
}

// ── Check-in status ────────────────────────────────────────────────────────

/**
 * Returns whether the player has checked in today.
 * Derives from the hub data — no separate fetch needed.
 */
export function useCheckedInToday() {
  const { data } = usePlayerHub();
  return data?.checkedInToday ?? false;
}
