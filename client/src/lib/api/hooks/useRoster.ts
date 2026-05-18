import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "../client";

// Types (subset of DB schema shape)
export type Player = {
  id: string;
  name: string;
  position: string | null;
  jerseyNumber: number | null;
  grade: string | null;
  gradYear: number | null;
  height: string | null;
  weight: number | null;
  status: "active" | "injured" | "suspended" | "inactive";
  role: string | null;
  parentGuardianName: string | null;
  parentGuardianEmail: string | null;
  createdAt: string;
};

export function useRoster() {
  return useQuery({
    queryKey: ["roster"],
    queryFn: () => apiGet<Player[]>("/roster"),
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ["roster", id],
    queryFn: () => apiGet<Player>(`/roster/${id}`),
    enabled: !!id,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Player>) => apiPost<Player>("/roster", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster"] }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Player> & { id: string }) =>
      apiPatch<{ ok: boolean }>(`/roster/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster"] }),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/roster/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster"] }),
  });
}

// ── Film / clip UI shape ───────────────────────────────────────────────────
// A slimmer view of a roster player used in film tagging and coaching-action
// pickers. Adds `initials` for avatar rendering and includes a "Full Team"
// sentinel entry at index 0.

export type RosterEntry = {
  id: string;
  name: string;
  position: string;
  initials: string;
};

const FALLBACK_ROSTER: RosterEntry[] = [
  { id: "team", name: "Full Team",    position: "",   initials: "" },
  { id: "p1",   name: "Marcus Davis", position: "PG", initials: "MD" },
  { id: "p2",   name: "Jordan Smith", position: "SG", initials: "JS" },
  { id: "p3",   name: "Tyler Brown",  position: "SF", initials: "TB" },
  { id: "p4",   name: "Chris Evans",  position: "PF", initials: "CE" },
  { id: "p5",   name: "Devon Carter", position: "C",  initials: "DC" },
];

/**
 * Returns the roster in the shape needed by film/coaching-action pickers:
 *  - "Full Team" sentinel as the first entry
 *  - Each player mapped to { id, name, position, initials }
 *  - Falls back to demo data when the API is unavailable (unauthenticated / demo mode)
 *
 * Replaces the standalone @/lib/hooks/useRoster hook which is now deleted.
 */
export function useRosterForFilm(): { roster: RosterEntry[]; isLoading: boolean } {
  const { data: players, isLoading } = useRoster();

  if (!players || players.length === 0) {
    return { roster: FALLBACK_ROSTER, isLoading };
  }

  const entries: RosterEntry[] = players.map((p) => ({
    id:       p.id,
    name:     p.name,
    position: p.position ?? "",
    initials: p.name
      .split(" ")
      .map((w) => w[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  }));

  return {
    roster: [{ id: "team", name: "Full Team", position: "", initials: "" }, ...entries],
    isLoading,
  };
}
