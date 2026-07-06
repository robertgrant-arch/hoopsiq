/**
 * useAdmin — hooks for the admin club operations layer.
 * Demo mode returns mock data; production calls /api/admin/* and related endpoints.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost, apiPatch } from "../client";
import {
  mockSeasons, mockTeams, mockMembershipPlans,
  mockRegistrations, mockInvoices, mockAdminOverview,
  type Season, type Team, type MembershipPlan,
  type Registration, type Invoice,
} from "@/lib/mock/admin";


// ── Overview ──────────────────────────────────────────────────────────────────

export function useAdminOverview(seasonId?: string) {
  return useQuery({
    queryKey: ["admin", "overview", seasonId],
    queryFn: async () => {
      if (IS_DEMO) return mockAdminOverview;
      return apiGet<typeof mockAdminOverview>(`/admin/overview${seasonId ? `?seasonId=${seasonId}` : ""}`);
    },
    staleTime: 60_000,
  });
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export function useSeasons(opts: { includeArchived?: boolean } = {}) {
  return useQuery<Season[]>({
    queryKey: ["seasons", opts],
    queryFn: async (): Promise<Season[]> => {
      if (IS_DEMO) {
        return opts.includeArchived ? mockSeasons : mockSeasons.filter((s) => s.status !== "archived");
      }
      return apiGet<Season[]>(`/seasons${opts.includeArchived ? "?includeArchived=true" : ""}`);
    },
    staleTime: 60_000,
  });
}

export function useSeason(id: string) {
  return useQuery<Season | null>({
    queryKey: ["seasons", id],
    queryFn: async (): Promise<Season | null> => {
      if (IS_DEMO) return mockSeasons.find((s) => s.id === id) ?? null;
      return apiGet<Season>(`/seasons/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Season>) => {
      if (IS_DEMO) return Promise.resolve({ ...data, id: `season_${Date.now()}`, createdAt: new Date().toISOString() } as Season);
      return apiPost<Season>("/seasons", data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });
}

export function useUpdateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Season> & { id: string }) => {
      if (IS_DEMO) return Promise.resolve({ id, ...data } as Season);
      return apiPatch<Season>(`/seasons/${id}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export function useTeams(opts: { seasonId?: string } = {}) {
  return useQuery<Team[]>({
    queryKey: ["teams", opts],
    queryFn: async (): Promise<Team[]> => {
      if (IS_DEMO) {
        return opts.seasonId ? mockTeams.filter((t) => t.seasonId === opts.seasonId) : mockTeams;
      }
      return apiGet<Team[]>(`/teams${opts.seasonId ? `?seasonId=${opts.seasonId}` : ""}`);
    },
    staleTime: 60_000,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Team>) => {
      if (IS_DEMO) return Promise.resolve({ ...data, id: `team_${Date.now()}`, rosterCount: 0, isActive: true } as Team);
      return apiPost<Team>("/teams", data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Team> & { id: string }) => {
      if (IS_DEMO) return Promise.resolve({ id, ...data } as Team);
      return apiPatch<Team>(`/teams/${id}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}

// ── Membership Plans ──────────────────────────────────────────────────────────

export function useMembershipPlans(opts: { seasonId?: string; status?: string } = {}) {
  return useQuery<MembershipPlan[]>({
    queryKey: ["membership-plans", opts],
    queryFn: async (): Promise<MembershipPlan[]> => {
      if (IS_DEMO) {
        let plans = mockMembershipPlans;
        if (opts.seasonId) plans = plans.filter((p) => p.seasonId === opts.seasonId);
        if (opts.status) plans = plans.filter((p) => p.status === opts.status);
        return plans;
      }
      const params = new URLSearchParams();
      if (opts.seasonId) params.set("seasonId", opts.seasonId);
      return apiGet<MembershipPlan[]>(`/invoices/plans/all?${params}`);
    },
    staleTime: 60_000,
  });
}

export function useCreateMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MembershipPlan>) => {
      if (IS_DEMO) return Promise.resolve({ ...data, id: `plan_${Date.now()}`, status: "draft", enrollmentCount: 0 } as MembershipPlan);
      return apiPost<MembershipPlan>("/invoices/plans", data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membership-plans"] }),
  });
}

export function useUpdateMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MembershipPlan> & { id: string }) => {
      if (IS_DEMO) return Promise.resolve({ id, ...data } as MembershipPlan);
      return apiPatch<MembershipPlan>(`/invoices/plans/${id}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membership-plans"] }),
  });
}

// ── Registrations ─────────────────────────────────────────────────────────────

export function useRegistrations(opts: { seasonId?: string; status?: string } = {}) {
  return useQuery<Registration[]>({
    queryKey: ["registrations", opts],
    queryFn: async (): Promise<Registration[]> => {
      if (IS_DEMO) {
        let regs = mockRegistrations;
        if (opts.seasonId) regs = regs.filter((r) => r.seasonId === opts.seasonId);
        if (opts.status) regs = regs.filter((r) => r.status === opts.status);
        return regs;
      }
      const params = new URLSearchParams();
      if (opts.seasonId) params.set("seasonId", opts.seasonId);
      if (opts.status) params.set("status", opts.status);
      return apiGet<Registration[]>(`/registrations?${params}`);
    },
    staleTime: 30_000,
  });
}

export function useUpdateRegistrationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      if (IS_DEMO) return Promise.resolve({ id, status });
      return apiPatch(`/registrations/${id}/status`, { status, adminNotes });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registrations"] }),
  });
}

export function useSubmitRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { playerId: string; seasonId: string; planId?: string; teamId?: string }) => {
      if (IS_DEMO) return Promise.resolve({ id: `reg_${Date.now()}`, ...data, status: "pending" });
      return apiPost("/registrations", data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registrations"] }),
  });
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export function useInvoices(opts: { seasonId?: string; status?: string; playerId?: string } = {}) {
  return useQuery<Invoice[]>({
    queryKey: ["invoices", opts],
    queryFn: async (): Promise<Invoice[]> => {
      if (IS_DEMO) {
        let invs = mockInvoices;
        if (opts.seasonId) invs = invs.filter((i) => i.seasonId === opts.seasonId);
        if (opts.status) invs = invs.filter((i) => i.status === opts.status);
        if (opts.playerId) invs = invs.filter((i) => i.playerId === opts.playerId);
        return invs;
      }
      const params = new URLSearchParams();
      if (opts.seasonId) params.set("seasonId", opts.seasonId);
      if (opts.status) params.set("status", opts.status);
      if (opts.playerId) params.set("playerId", opts.playerId);
      return apiGet<Invoice[]>(`/invoices?${params}`);
    },
    staleTime: 30_000,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, amount, method, referenceNote }: { invoiceId: string; amount: number; method: string; referenceNote?: string }) => {
      if (IS_DEMO) return Promise.resolve({ ok: true });
      return apiPost(`/invoices/${invoiceId}/payments`, { amount, method, referenceNote });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

// ── Attendance (admin view) ───────────────────────────────────────────────────

export type AttendanceSummary = {
  overall: { present: number; total: number; rate: number | null; eventCount: number };
  events: Array<{ eventId: string; eventTitle: string; eventType: string; date: string; present: number; total: number; rate: number | null }>;
};

export function useAdminAttendance() {
  return useQuery<AttendanceSummary>({
    queryKey: ["admin", "attendance"],
    queryFn: async (): Promise<AttendanceSummary> => {
      if (IS_DEMO) {
        return {
          overall: { present: 312, total: 360, rate: 87, eventCount: 24 },
          events: [
            { eventId: "e1", eventTitle: "vs. Barnegat", eventType: "game", date: "2025-11-10", present: 14, total: 14, rate: 100 },
            { eventId: "e2", eventTitle: "Practice — Full", eventType: "practice", date: "2025-11-08", present: 11, total: 14, rate: 79 },
            { eventId: "e3", eventTitle: "Tournament Day 1", eventType: "tournament", date: "2025-11-05", present: 14, total: 14, rate: 100 },
            { eventId: "e4", eventTitle: "Film Session", eventType: "film", date: "2025-11-04", present: 10, total: 14, rate: 71 },
            { eventId: "e5", eventTitle: "Practice — Skills", eventType: "practice", date: "2025-11-01", present: 12, total: 14, rate: 86 },
          ],
        };
      }
      return apiGet<AttendanceSummary>("/admin/attendance");
    },
    staleTime: 120_000,
  });
}

// ── Compliance ────────────────────────────────────────────────────────────────

export type ComplianceSummary = {
  compliant: number;
  incomplete: number;
  total: number;
  requiredForms: number;
  players: Array<{ playerId: string; playerName: string; compliant: boolean; missingForms: string[]; missingCount: number }>;
};

export function useAdminCompliance() {
  return useQuery<ComplianceSummary>({
    queryKey: ["admin", "compliance"],
    queryFn: async (): Promise<ComplianceSummary> => {
      if (IS_DEMO) {
        return {
          compliant: 51,
          incomplete: 7,
          total: 58,
          requiredForms: 3,
          players: [
            { playerId: "u_athlete_2", playerName: "Devon Miles", compliant: false, missingForms: ["Liability Waiver", "Medical Release"], missingCount: 2 },
            { playerId: "u_athlete_4", playerName: "Amir Washington", compliant: false, missingForms: ["Liability Waiver"], missingCount: 1 },
          ],
        };
      }
      return apiGet<ComplianceSummary>("/admin/compliance");
    },
    staleTime: 120_000,
  });
}
