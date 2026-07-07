/**
 * Film Room v2 — TanStack Query hooks. Same contract as the rest of the API
 * layer: real endpoints when auth is active, mock data in demo mode.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client";
import { IS_DEMO } from "@/lib/auth";
import type {
  AssignmentDetail, AttentionCounts, Clip, FilmSummary, FollowupKind,
  QueueRow, QueueSummary, RosterPlayer,
} from "./types";
import {
  MOCK_ATTENTION, MOCK_CLIPS, MOCK_FILMS, MOCK_QUEUE, MOCK_ROSTER,
  mockAssignmentDetail,
} from "./mock";

// ── Queries ────────────────────────────────────────────────────────────────

export function useFilms() {
  return useQuery({
    queryKey: ["film-room", "films"],
    queryFn: async (): Promise<FilmSummary[]> => {
      if (IS_DEMO) return MOCK_FILMS;
      // Reuses the existing film-analysis session list, mapped to FilmSummary.
      const sessions = await apiGet<any[]>("/film-analysis/sessions");
      return sessions.map((s) => ({
        id: s.id,
        title: s.title,
        kind: s.kind ?? "game",
        status: s.status === "ready" ? "ready" : s.status,
        opponent: s.opponent ?? null,
        playedAt: s.playedAt ?? null,
        durationSeconds: s.durationSeconds ?? null,
        playbackId: s.playbackId ?? null,
        clipCount: s.clipCount ?? 0,
        sentCount: s.sentCount ?? 0,
        unwatchedCount: s.unwatchedCount ?? 0,
        overdueCount: s.overdueCount ?? 0,
      }));
    },
  });
}

export function useAttention() {
  return useQuery({
    queryKey: ["film-room", "attention"],
    queryFn: (): Promise<AttentionCounts> =>
      IS_DEMO ? Promise.resolve(MOCK_ATTENTION) : apiGet<AttentionCounts>("/film-room/attention"),
  });
}

export function useClips(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["film-room", "clips", sessionId],
    enabled: !!sessionId,
    queryFn: (): Promise<Clip[]> =>
      IS_DEMO
        ? Promise.resolve(MOCK_CLIPS[sessionId!] ?? [])
        : apiGet<Clip[]>(`/film-room/sessions/${sessionId}/clips`),
  });
}

export function useFilmRoster() {
  return useQuery({
    queryKey: ["film-room", "roster"],
    queryFn: async (): Promise<RosterPlayer[]> => {
      if (IS_DEMO) return MOCK_ROSTER;
      const rows = await apiGet<any[]>("/roster");
      return rows.map((p) => ({
        id: p.id, name: p.name, position: p.position ?? null,
        jersey: p.jerseyNumber != null ? String(p.jerseyNumber) : undefined,
      }));
    },
  });
}

export function useAssignmentQueue(filters?: { status?: string; player?: string }) {
  const qs = new URLSearchParams();
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.player) qs.set("player", filters.player);
  return useQuery({
    queryKey: ["film-room", "assignments", filters ?? {}],
    queryFn: async (): Promise<{ rows: QueueRow[]; summary: QueueSummary | null }> => {
      if (IS_DEMO) {
        let rows = MOCK_QUEUE;
        if (filters?.status) rows = rows.filter((r) => r.status === filters.status);
        if (filters?.player) rows = rows.filter((r) => r.player.id === filters.player);
        return {
          rows,
          summary: {
            active: MOCK_QUEUE.filter((r) => !["completed", "archived", "draft"].includes(r.status)).length,
            watched: MOCK_QUEUE.filter((r) => ["watched", "responded", "completed"].includes(r.status)).length,
            responded: MOCK_QUEUE.filter((r) => ["responded", "completed"].includes(r.status)).length,
            overdue: MOCK_QUEUE.filter((r) => r.overdue).length,
          },
        };
      }
      return apiGet(`/film-room/assignments${qs.size ? `?${qs}` : ""}`);
    },
  });
}

export function useAssignmentDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["film-room", "assignment", id],
    enabled: !!id,
    queryFn: (): Promise<AssignmentDetail> => {
      if (IS_DEMO) {
        const d = mockAssignmentDetail(id!);
        return d ? Promise.resolve(d) : Promise.reject(new Error("Assignment not found"));
      }
      return apiGet<AssignmentDetail>(`/film-room/assignment-players/${id}`);
    },
  });
}

/** Player-side inbox — same endpoint; server scopes to the caller's rows. */
export function usePlayerFilmInbox() {
  return useQuery({
    queryKey: ["film-room", "player-inbox"],
    queryFn: async (): Promise<QueueRow[]> => {
      if (IS_DEMO) return MOCK_QUEUE.filter((r) => r.player.id === "p_moore" || r.status !== "completed");
      const res = await apiGet<{ rows: QueueRow[] }>("/film-room/assignments");
      return res.rows;
    },
  });
}

// ── Mutations (demo mode resolves locally so the UI stays interactive) ─────

function demoResolve<T>(value: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), 150));
}

const ATTENTION_KEY = ["film-room", "attention"];

export function useCreateClip(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Clip>) =>
      IS_DEMO
        ? demoResolve({
            id: `demo_${Math.random().toString(36).slice(2, 8)}`,
            sessionId, source: "coach", status: "draft",
            startMs: body.startMs ?? 0, endMs: body.endMs ?? 1000,
            title: body.title ?? "", note: body.note ?? "",
            noteSource: "coach", categories: body.categories ?? [],
            priority: body.priority ?? "normal", lockedAt: null,
            playerIds: body.playerIds ?? [], createdAt: new Date().toISOString(),
          } as Clip)
        : apiPost<Clip>(`/film-room/sessions/${sessionId}/clips`, body),
    onSuccess: (clip) => {
      qc.setQueryData<Clip[]>(["film-room", "clips", sessionId], (old) =>
        old ? [...old, clip].sort((a, b) => a.startMs - b.startMs) : [clip]);
      qc.invalidateQueries({ queryKey: ATTENTION_KEY });
    },
  });
}

export function useUpdateClip(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Clip> & { id: string }) =>
      IS_DEMO ? demoResolve({ id, ...body }) : apiPatch<Clip>(`/film-room/clips/${id}`, body),
    onMutate: async ({ id, ...body }) => {
      await qc.cancelQueries({ queryKey: ["film-room", "clips", sessionId] });
      const prev = qc.getQueryData<Clip[]>(["film-room", "clips", sessionId]);
      qc.setQueryData<Clip[]>(["film-room", "clips", sessionId], (old) =>
        old?.map((c) => (c.id === id ? { ...c, ...body } as Clip : c)));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["film-room", "clips", sessionId], ctx.prev);
    },
    onSettled: () => {
      if (!IS_DEMO) qc.invalidateQueries({ queryKey: ["film-room", "clips", sessionId] });
      qc.invalidateQueries({ queryKey: ATTENTION_KEY });
    },
  });
}

export function useDeleteClip(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      IS_DEMO ? demoResolve({ ok: true }) : apiDelete(`/film-room/clips/${id}`),
    onSuccess: (_r, id) => {
      qc.setQueryData<Clip[]>(["film-room", "clips", sessionId], (old) =>
        old?.filter((c) => c.id !== id));
      qc.invalidateQueries({ queryKey: ATTENTION_KEY });
    },
  });
}

export function useAssignClip(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      clipId: string; playerIds: string[]; dueAt?: string | null;
      requireResponse: boolean; responsePrompt?: string; send?: boolean;
    }) =>
      IS_DEMO
        ? demoResolve({ ok: true, players: input.playerIds.length })
        : apiPost(`/film-room/clips/${input.clipId}/assignments`, input),
    onSuccess: (_r, input) => {
      qc.setQueryData<Clip[]>(["film-room", "clips", sessionId], (old) =>
        old?.map((c) => (c.id === input.clipId
          ? { ...c, status: "assigned" as const, lockedAt: c.lockedAt ?? new Date().toISOString() }
          : c)));
      qc.invalidateQueries({ queryKey: ["film-room", "assignments"] });
      qc.invalidateQueries({ queryKey: ATTENTION_KEY });
    },
  });
}

export function useFollowup(assignmentPlayerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: FollowupKind; body?: string; meta?: Record<string, unknown> }) =>
      IS_DEMO
        ? demoResolve({ ok: true })
        : apiPost(`/film-room/assignment-players/${assignmentPlayerId}/followups`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["film-room", "assignment", assignmentPlayerId] });
      qc.invalidateQueries({ queryKey: ["film-room", "assignments"] });
      qc.invalidateQueries({ queryKey: ATTENTION_KEY });
    },
  });
}

export function useEscalateToIdp(assignmentPlayerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { focusArea: string; note?: string }) =>
      IS_DEMO
        ? demoResolve({ ok: true })
        : apiPost(`/film-room/assignment-players/${assignmentPlayerId}/escalate`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["film-room", "assignment", assignmentPlayerId] });
    },
  });
}

export function useWatchProgress(assignmentPlayerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (watchPct: number) =>
      IS_DEMO
        ? demoResolve({ watchPct })
        : apiPost(`/film-room/assignment-players/${assignmentPlayerId}/progress`, { watchPct }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["film-room", "player-inbox"] });
    },
  });
}

export function useSubmitReview(assignmentPlayerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      kind: "text" | "confidence" | "flag_review_request";
      textBody?: string; confidence?: number; clientCreatedAt?: string;
    }) =>
      IS_DEMO
        ? demoResolve({ ok: true })
        : apiPost(`/film-room/assignment-players/${assignmentPlayerId}/review`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["film-room", "player-inbox"] });
      qc.invalidateQueries({ queryKey: ["film-room", "assignment", assignmentPlayerId] });
    },
  });
}
