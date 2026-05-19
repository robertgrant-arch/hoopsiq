/**
 * features/growth-story/hooks.ts
 *
 * Data hooks for the Growth Story / development momentum slice.
 * Tries GET /api/player/growth-story; falls back to MOCK_GROWTH_STORY.
 */

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { GrowthStoryData } from "./types";
import { MOCK_GROWTH_STORY } from "./mock";

const KEYS = {
  growthStory: ["player-growth-story"] as const,
};

/**
 * Fetches the player's growth story for the current period.
 * Falls back to mock data while GET /api/player/growth-story is not yet built.
 *
 * When the real endpoint exists:
 *   - Query skill_assessments for the player over the last 30 days
 *   - Compute per-category deltas
 *   - Join with coaching actions and IDP comments for coach notes
 *   - Return as GrowthStoryData
 */
export function useGrowthStory() {
  return useQuery<GrowthStoryData>({
    queryKey: KEYS.growthStory,
    queryFn: async () => {
      try {
        const data = await apiGet<GrowthStoryData>("/player/growth-story");
        if (data && Array.isArray((data as any).wins)) return data;
        return MOCK_GROWTH_STORY;
      } catch {
        return MOCK_GROWTH_STORY;
      }
    },
    staleTime: 10 * 60 * 1000,
  });
}
