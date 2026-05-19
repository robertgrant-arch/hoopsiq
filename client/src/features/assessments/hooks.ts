/**
 * features/assessments/hooks.ts
 *
 * Data hooks for the Assessments → IDP slice.
 *
 * Pattern: try real API → fall back to mock data.
 * Self-assessment is managed as optimistic local state until
 * POST /api/player/self-assessment is implemented server-side.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import type { AssessmentSliceData, SelfAssessmentInput } from "./types";
import {
  MOCK_ASSESSMENT_DATA,
  applySelfAssessment,
  computeGaps,
  recommendFocusAreas,
} from "./mock";

// ── Query keys ─────────────────────────────────────────────────────────────

const KEYS = {
  assessments: ["player-assessments"] as const,
};

// ── Assessment + IDP data ─────────────────────────────────────────────────

/**
 * Fetches the player's assessment scores and active IDP from the server.
 * Falls back to MOCK_ASSESSMENT_DATA while backend is being wired.
 *
 * Real endpoints (already implemented server-side):
 *   GET /api/roster/:id/skill-assessments
 *   GET /api/roster/:id/idp
 *
 * TODO: create GET /api/player/assessments/hub that aggregates both
 *       into a single request (mirrors the player hub pattern).
 */
export function useAssessmentData() {
  return useQuery<AssessmentSliceData>({
    queryKey: KEYS.assessments,
    queryFn: async () => {
      try {
        // When the hub endpoint exists, replace this with a single call.
        const data = await apiGet<AssessmentSliceData>("/player/assessments/hub");
        if (data && Array.isArray((data as any).scores)) return data;
        return MOCK_ASSESSMENT_DATA;
      } catch {
        return MOCK_ASSESSMENT_DATA;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Derived selectors (pure, no extra fetch) ──────────────────────────────

/** Returns gap analysis derived from cached assessment scores. */
export function useAssessmentGaps() {
  const { data } = useAssessmentData();
  if (!data) return { gaps: [], topRecommendations: [] };
  const gaps = computeGaps(data.scores);
  return {
    gaps,
    topRecommendations: recommendFocusAreas(gaps, 3),
  };
}

// ── Self-assessment ───────────────────────────────────────────────────────

/**
 * Manages the player's self-assessment submission.
 *
 * Local state tracks the current form values.
 * On submit: optimistically updates the assessment cache,
 * then attempts POST /api/player/self-assessment (graceful fail while not yet built).
 */
export function useSelfAssessment() {
  const qc = useQueryClient();
  const { data } = useAssessmentData();

  // Derive initial values from current data or default to midpoint (5)
  const [draft, setDraft] = useState<Partial<SelfAssessmentInput>>({});

  const mutation = useMutation({
    mutationFn: async (input: SelfAssessmentInput) => {
      try {
        await apiPost("/player/self-assessment", { scores: input });
      } catch {
        // Endpoint not yet built — optimistic update is sufficient
      }
    },

    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: KEYS.assessments });
      const snapshot = qc.getQueryData<AssessmentSliceData>(KEYS.assessments);

      if (snapshot) {
        qc.setQueryData<AssessmentSliceData>(KEYS.assessments, {
          ...snapshot,
          selfAssessmentSubmittedAt: new Date().toISOString(),
          scores: applySelfAssessment(snapshot.scores, input),
        });
      }
      return { snapshot };
    },

    onError: (_err, _input, ctx) => {
      if (ctx?.snapshot) {
        qc.setQueryData(KEYS.assessments, ctx.snapshot);
      }
    },
  });

  function setRating(category: keyof SelfAssessmentInput, value: number) {
    setDraft((prev) => ({ ...prev, [category]: value }));
  }

  function getDraftRating(category: keyof SelfAssessmentInput): number {
    // Draft value → existing self score → default midpoint
    return (
      draft[category] ??
      data?.scores.find((s) => s.category === category)?.selfScore ??
      5
    );
  }

  function submitSelfAssessment() {
    // Build full input from draft + existing self scores + default 5
    const allCategories = [
      "shooting", "finishing", "ball_handling", "decision_making",
      "footwork", "defensive_habits", "physical_readiness", "discipline",
    ] as const;

    const input = Object.fromEntries(
      allCategories.map((cat) => [cat, getDraftRating(cat)])
    ) as SelfAssessmentInput;

    mutation.mutate(input);
    setDraft({});
  }

  return {
    draft,
    setRating,
    getDraftRating,
    submitSelfAssessment,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}

// ── IDP milestone completion ──────────────────────────────────────────────

/** Marks an IDP milestone as complete — optimistic, graceful fallback. */
export function useCompleteMilestone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      focusAreaId,
      milestoneId,
    }: {
      focusAreaId: string;
      milestoneId: string;
    }) => {
      try {
        await apiPost(
          `/roster/me/idp/focus-areas/${focusAreaId}/milestones/${milestoneId}/complete`,
          {}
        );
      } catch {
        // Endpoint signature TBD — optimistic update handles the UX
      }
    },

    onMutate: async ({ focusAreaId, milestoneId }) => {
      await qc.cancelQueries({ queryKey: KEYS.assessments });
      const snapshot = qc.getQueryData<AssessmentSliceData>(KEYS.assessments);

      if (snapshot) {
        qc.setQueryData<AssessmentSliceData>(KEYS.assessments, {
          ...snapshot,
          idpFocusAreas: snapshot.idpFocusAreas.map((fa) =>
            fa.id !== focusAreaId
              ? fa
              : {
                  ...fa,
                  milestones: fa.milestones.map((m) =>
                    m.id !== milestoneId
                      ? m
                      : { ...m, completedAt: new Date().toISOString() }
                  ),
                }
          ),
        });
      }
      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(KEYS.assessments, ctx.snapshot);
    },
  });
}
