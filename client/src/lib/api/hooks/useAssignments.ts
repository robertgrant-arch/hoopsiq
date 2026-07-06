import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost, apiPatch } from "../client";
import { mockPlayerAssignments } from "@/features/player/mock";


export type Assignment = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  playerId: string | null;
  filmClipId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  payload: unknown;
  createdAt: string;
};

export type ComplianceByPlayer = {
  playerId: string;
  name: string;
  total: number;
  completed: number;
  rate: number;
};

/** Demo: map the athlete-portal mock into the API `Assignment` shape.
 *  Display-only extras (type, priority, xpReward, …) travel in `payload`,
 *  matching how the server stores assignment metadata. */
function demoAssignments(): Assignment[] {
  const STATUS_MAP: Record<string, string> = {
    open: "assigned",
    in_progress: "in_progress",
    submitted: "submitted",
    graded: "reviewed",
  };
  return mockPlayerAssignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    status: STATUS_MAP[a.status] ?? "assigned",
    dueAt: a.dueDate,
    playerId: "u_athlete_1",
    filmClipId: a.linkedClipId ?? null,
    submittedAt: a.completedAt ?? null,
    reviewedAt: a.status === "graded" ? a.completedAt ?? null : null,
    payload: {
      type: a.type,
      priority: a.priority,
      xpReward: a.xpReward,
      assignedBy: a.assignedBy,
      coachFeedback: a.coachFeedback,
    },
    createdAt: a.dueDate,
  }));
}

export function useAssignments(filters?: { playerId?: string; status?: string }) {
  return useQuery({
    queryKey: ["assignments", filters],
    queryFn: async () => {
      if (IS_DEMO) {
        let items = demoAssignments();
        if (filters?.playerId) items = items.filter((a) => a.playerId === filters.playerId);
        if (filters?.status) items = items.filter((a) => a.status === filters.status);
        return items;
      }
      const params = new URLSearchParams();
      if (filters?.playerId) params.set("playerId", filters.playerId);
      if (filters?.status) params.set("status", filters.status);
      const qs = params.toString();
      return apiGet<Assignment[]>(`/assignments${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Assignment>) => {
      if (IS_DEMO) {
        return {
          id: `assignment_${Date.now()}`,
          title: "",
          description: null,
          status: "assigned",
          dueAt: null,
          playerId: null,
          filmClipId: null,
          submittedAt: null,
          reviewedAt: null,
          payload: null,
          createdAt: new Date().toISOString(),
          ...data,
        } as Assignment;
      }
      return apiPost<Assignment>("/assignments", data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useCompleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      if (IS_DEMO) return { ok: true };
      return apiPatch<{ ok: boolean }>(`/assignments/${id}/complete`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useReviewAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiPatch<{ ok: boolean }>(`/assignments/${id}/review`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useComplianceByPlayer() {
  return useQuery({
    queryKey: ["assignments", "compliance", "by-player"],
    queryFn: () => apiGet<ComplianceByPlayer[]>("/assignments/compliance/by-player"),
  });
}
