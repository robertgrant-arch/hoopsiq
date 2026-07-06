import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost } from "../client";


export type ReadinessCheckin = {
  id: string;
  playerId: string;
  fatigue: number;
  sleep: number;
  soreness: number;
  mood: number;
  note: string | null;
  flagged: boolean;
  checkedInAt: string;
};

// ── Demo-mode fallback data ────────────────────────────────────────────────
// Mirrors the IS_DEMO pattern in useAdmin/useAnnouncements so readiness pages
// render without a live backend. Player ids match @/lib/mock/data roster.
// Spread: a_1/a_4/a_7/a_12 flagged, a_6/a_11 missing (unknown), rest ready.

function demoCheckedInAt(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function demoTeamCheckinsToday(): ReadinessCheckin[] {
  const rows: Array<[string, number, number, number, number, boolean, number, number]> = [
    // playerId, fatigue, sleep, soreness, mood, flagged, hour, minute
    ["a_1",  8, 6, 8, 3, true,  7, 42],
    ["a_2",  3, 8, 2, 4, false, 7, 15],
    ["a_3",  4, 7, 3, 4, false, 7, 55],
    ["a_4",  5, 4, 4, 3, true,  8, 5],
    ["a_5",  4, 7, 5, 3, false, 7, 30],
    ["a_7",  7, 6, 5, 3, true,  8, 20],
    ["a_8",  2, 8, 2, 5, false, 6, 58],
    ["a_9",  3, 7, 3, 4, false, 7, 22],
    ["a_10", 3, 8, 2, 4, false, 7, 47],
    ["a_12", 4, 7, 7, 3, true,  8, 12],
  ];
  return rows.map(([playerId, fatigue, sleep, soreness, mood, flagged, h, m], i) => ({
    id: `demo_rc_${i + 1}`,
    playerId,
    fatigue,
    sleep,
    soreness,
    mood,
    note: null,
    flagged,
    checkedInAt: demoCheckedInAt(h, m),
  }));
}

/** Deterministic wellness wave for a player's recent history in demo mode. */
function demoPlayerSeries(playerId: string, days: number): ReadinessCheckin[] {
  const n = Math.min(days, 14);
  const seed = playerId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const out: ReadinessCheckin[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(7, 30, 0, 0);
    const fatigue = 3 + ((i * 2 + seed) % 5);      // 3–7
    const sleep = 6 + ((i + seed) % 3);            // 6–8
    const soreness = 2 + ((i * 3 + seed) % 5);     // 2–6
    out.push({
      id: `demo_rc_${playerId}_${i}`,
      playerId,
      fatigue,
      sleep,
      soreness,
      mood: 3 + (i % 2),
      note: null,
      flagged: fatigue >= 7 || soreness >= 7,
      checkedInAt: d.toISOString(),
    });
  }
  return out;
}

export function useTeamReadinessToday() {
  return useQuery({
    queryKey: ["readiness", "today"],
    queryFn: async (): Promise<ReadinessCheckin[]> => {
      if (IS_DEMO) return demoTeamCheckinsToday();
      return apiGet<ReadinessCheckin[]>("/readiness/today");
    },
  });
}

export function usePlayerReadiness(playerId: string, days = 30) {
  return useQuery({
    queryKey: ["readiness", "player", playerId, days],
    queryFn: async (): Promise<ReadinessCheckin[]> => {
      if (IS_DEMO) return demoPlayerSeries(playerId, days);
      return apiGet<ReadinessCheckin[]>(`/readiness/player/${playerId}?days=${days}`);
    },
    enabled: !!playerId,
  });
}

export function useSubmitReadiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReadinessCheckin>) =>
      apiPost<{ ok: boolean }>("/readiness", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["readiness", "today"] });
    },
  });
}
