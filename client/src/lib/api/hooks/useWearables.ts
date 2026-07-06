import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost, apiPatch, apiDelete } from "../client";


export type WearableProvider = "apple_health" | "whoop" | "garmin" | "oura";

export type WearableConnection = {
  id: string;
  provider: WearableProvider;
  status: string;
  lastSyncedAt: string | null;
};

export type WearableMetrics = {
  provider: string;
  recordedDate: string;
  recoveryScore: number | null;
  hrv: number | null;
  restingHr: number | null;
  sleepScore: number | null;
  sleepDurationMins: number | null;
  strainScore: number | null;
  steps: number | null;
  /** Not yet returned by the API — present in demo data only. */
  activeCalories?: number | null;
};

export type WearableSharing = {
  shareRecovery: boolean;
  shareSleep: boolean;
  shareStrain: boolean;
  shareHeartRate: boolean;
  shareWithCoaches: boolean;
  shareWithTeam: boolean;
};

// ── Demo-mode fallback data ────────────────────────────────────────────────
// Mirrors the IS_DEMO pattern in useAdmin/useAnnouncements/useReadiness so the
// wearables page renders (and stays interactive) without a live backend.
// Module-level state persists connect/disconnect/sharing toggles for the session.

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const demoConnections: WearableConnection[] = [
  { id: "demo_wc_whoop", provider: "whoop", status: "connected", lastSyncedAt: minutesAgo(3) },
  { id: "demo_wc_garmin", provider: "garmin", status: "disconnected", lastSyncedAt: null },
  { id: "demo_wc_oura", provider: "oura", status: "disconnected", lastSyncedAt: null },
];

const DEMO_RECOVERY_WAVE = [62, 55, 48, 71, 79, 66, 74];

function demoMetricsHistory(days: number): WearableMetrics[] {
  const n = Math.max(1, Math.min(days, 30));
  const out: WearableMetrics[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const recovery = DEMO_RECOVERY_WAVE[(DEMO_RECOVERY_WAVE.length - 1 - i % DEMO_RECOVERY_WAVE.length + DEMO_RECOVERY_WAVE.length) % DEMO_RECOVERY_WAVE.length];
    out.push({
      provider: "whoop",
      recordedDate: isoDaysAgo(i),
      recoveryScore: recovery,
      hrv: 60 + (recovery % 12),
      restingHr: 50 + (i % 4),
      sleepScore: Math.min(95, recovery + 7),
      sleepDurationMins: 8 * 60 + 14 - i * 6,
      strainScore: 11.4,
      steps: 9842 - i * 310,
      activeCalories: 487 - i * 12,
    });
  }
  return out;
}

function demoTodayMetrics(): WearableMetrics[] {
  return [
    {
      provider: "whoop",
      recordedDate: isoDaysAgo(0),
      recoveryScore: 74,
      hrv: 68,
      restingHr: 52,
      sleepScore: 81,
      sleepDurationMins: 8 * 60 + 14,
      strainScore: 11.4,
      steps: 9842,
      activeCalories: 487,
    },
  ];
}

const demoSharing: WearableSharing = {
  shareRecovery: true,
  shareSleep: true,
  shareStrain: false,
  shareHeartRate: false,
  shareWithCoaches: true,
  shareWithTeam: false,
};

export function useMyConnections() {
  return useQuery({
    queryKey: ["wearables", "connections"],
    queryFn: async (): Promise<WearableConnection[]> => {
      if (IS_DEMO) return demoConnections.map((c) => ({ ...c }));
      return apiGet<WearableConnection[]>("/wearables/me/connections");
    },
  });
}

export function useMyMetrics() {
  return useQuery({
    queryKey: ["wearables", "metrics"],
    queryFn: async (): Promise<WearableMetrics[]> => {
      if (IS_DEMO) {
        const connected = demoConnections.some((c) => c.status === "connected");
        return connected ? demoTodayMetrics() : [];
      }
      return apiGet<WearableMetrics[]>("/wearables/me/metrics");
    },
  });
}

export function useMyMetricsHistory(days = 30) {
  return useQuery({
    queryKey: ["wearables", "metrics", "history", days],
    queryFn: async (): Promise<WearableMetrics[]> => {
      if (IS_DEMO) {
        const connected = demoConnections.some((c) => c.status === "connected");
        return connected ? demoMetricsHistory(days) : [];
      }
      return apiGet<WearableMetrics[]>(`/wearables/me/metrics/history?days=${days}`);
    },
  });
}

export function useMySharing() {
  return useQuery({
    queryKey: ["wearables", "sharing"],
    queryFn: async (): Promise<WearableSharing> => {
      if (IS_DEMO) return { ...demoSharing };
      return apiGet<WearableSharing>("/wearables/me/sharing");
    },
  });
}

export function useUpdateSharing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<WearableSharing>): Promise<WearableSharing> => {
      if (IS_DEMO) {
        Object.assign(demoSharing, settings);
        return { ...demoSharing };
      }
      return apiPatch<WearableSharing>("/wearables/me/sharing", settings);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wearables", "sharing"] });
    },
  });
}

export function useConnectProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: WearableProvider) => {
      if (IS_DEMO) {
        const existing = demoConnections.find((c) => c.provider === provider);
        if (existing) {
          existing.status = "pending";
        } else {
          demoConnections.push({
            id: `demo_wc_${provider}`,
            provider,
            status: "pending",
            lastSyncedAt: null,
          });
        }
        return {
          connectionId: `demo_wc_${provider}`,
          authUrl: null,
          message: "Demo mode — connection simulated",
        };
      }
      return apiPost<{ connectionId: string; authUrl: string | null; message: string }>(
        `/wearables/connect/${provider}`,
        {},
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wearables"] });
    },
  });
}

export function useDisconnectProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (provider: WearableProvider) => {
      if (IS_DEMO) {
        const existing = demoConnections.find((c) => c.provider === provider);
        if (existing) {
          existing.status = "disconnected";
          existing.lastSyncedAt = null;
        }
        return { ok: true };
      }
      return apiDelete(`/wearables/disconnect/${provider}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wearables"] });
    },
  });
}

export function usePlayerWearables(playerId: string) {
  return useQuery({
    queryKey: ["wearables", "player", playerId],
    queryFn: () => apiGet<WearableMetrics[]>(`/wearables/player/${playerId}`),
    enabled: !!playerId,
  });
}
