/**
 * useParent — hooks for the parent portal.
 *
 * Security fix #5 (demo isolation): in demo mode, all queries are scoped to
 * the linkedChildId on the authenticated user object.  No other child's data
 * is accessible.  In production the server enforces this via
 * validateParentChildAccess on every /api/parent/* endpoint.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost } from "../client";
import { useAuth } from "@/lib/auth";
import {
  mockChild,
  mockScheduleEvents,
  mockAttendance,
  mockBillingItems,
  mockDevelopmentSummary,
} from "@/lib/mock/parent";
import { mockPlayerAssignments } from "@/lib/mock/athlete";


// ── Children list ─────────────────────────────────────────────────────────────

export function useGuardianChildren() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["parent", "children"],
    queryFn: async () => {
      if (IS_DEMO) {
        // Demo: only return the child linked to the authenticated parent user.
        // This enforces fix #5 — a demo parent can't see other demo athletes.
        if (!user?.linkedChildId) return [];
        return [mockChild];
      }
      return apiGet<typeof mockChild[]>("/parent/children");
    },
    enabled: !!user,
  });
}

// ── Child profile ─────────────────────────────────────────────────────────────

export function useChildProfile(playerId: string) {
  const { user } = useAuth();
  return useQuery<typeof mockChild>({
    queryKey: ["parent", "child", playerId],
    queryFn: async (): Promise<typeof mockChild> => {
      if (IS_DEMO) {
        // Enforce: parent can only access their linked child
        if (user?.linkedChildId !== playerId) {
          throw new Error("Access denied: not your linked child");
        }
        return mockChild;
      }
      return apiGet<typeof mockChild>(`/parent/child/${playerId}`);
    },
    enabled: !!playerId && !!user,
  });
}

// ── Child assignments ─────────────────────────────────────────────────────────

type ChildAssignment = Omit<(typeof mockPlayerAssignments)[number], "coachFeedback">;

export function useChildAssignments(playerId: string) {
  const { user } = useAuth();
  return useQuery<ChildAssignment[]>({
    queryKey: ["parent", "child", playerId, "assignments"],
    queryFn: async (): Promise<ChildAssignment[]> => {
      if (IS_DEMO) {
        if (user?.linkedChildId !== playerId) {
          throw new Error("Access denied");
        }
        // Return read-only view: strip coachFeedback (parent sees summaries only)
        return mockPlayerAssignments.map(({ coachFeedback: _cf, ...a }) => a);
      }
      return apiGet<ChildAssignment[]>(`/parent/child/${playerId}/assignments`);
    },
    enabled: !!playerId && !!user,
  });
}

// ── Child schedule ────────────────────────────────────────────────────────────

export function useChildSchedule(playerId: string) {
  const { user } = useAuth();
  return useQuery<typeof mockScheduleEvents>({
    queryKey: ["parent", "child", playerId, "schedule"],
    queryFn: async (): Promise<typeof mockScheduleEvents> => {
      if (IS_DEMO) {
        if (user?.linkedChildId !== playerId) throw new Error("Access denied");
        return mockScheduleEvents;
      }
      return apiGet<typeof mockScheduleEvents>(`/parent/child/${playerId}/schedule`);
    },
    enabled: !!playerId && !!user,
  });
}

// ── Child attendance ──────────────────────────────────────────────────────────

export function useChildAttendance(playerId: string) {
  const { user } = useAuth();
  return useQuery<typeof mockAttendance>({
    queryKey: ["parent", "child", playerId, "attendance"],
    queryFn: async (): Promise<typeof mockAttendance> => {
      if (IS_DEMO) {
        if (user?.linkedChildId !== playerId) throw new Error("Access denied");
        return mockAttendance;
      }
      return apiGet<typeof mockAttendance>(`/parent/child/${playerId}/attendance`);
    },
    enabled: !!playerId && !!user,
  });
}

// ── Child development ─────────────────────────────────────────────────────────

export function useChildDevelopment(playerId: string) {
  const { user } = useAuth();
  return useQuery<typeof mockDevelopmentSummary>({
    queryKey: ["parent", "child", playerId, "development"],
    queryFn: async (): Promise<typeof mockDevelopmentSummary> => {
      if (IS_DEMO) {
        if (user?.linkedChildId !== playerId) throw new Error("Access denied");
        return mockDevelopmentSummary;
      }
      return apiGet<typeof mockDevelopmentSummary>(`/parent/child/${playerId}/development`);
    },
    enabled: !!playerId && !!user,
  });
}

// ── Child RSVP ────────────────────────────────────────────────────────────────

export function useRsvpForChild(playerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      status,
      note,
    }: {
      eventId: string;
      status: "available" | "unavailable" | "maybe";
      note?: string;
    }) => {
      if (IS_DEMO) {
        // Demo: optimistic only, no real call
        return Promise.resolve({ ok: true });
      }
      return apiPost(`/parent/child/${playerId}/availability`, {
        eventId,
        status,
        note,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent", "child", playerId, "schedule"] });
    },
  });
}
