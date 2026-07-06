import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IS_DEMO } from "@/lib/auth";
import { apiGet, apiPost, apiPatch } from "../client";


export type Event = {
  id: string;
  title: string;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  homeAway: "home" | "away" | null;
  opponent: string | null;
  notes: string | null;
  createdAt: string;
};

export type EventAvailability = {
  id: string;
  eventId: string;
  playerId: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type EventAttendance = {
  id: string;
  eventId: string;
  playerId: string;
  present: boolean;
  note: string | null;
  createdAt: string;
};

// Demo mode: schedule relative to "today" so dashboards always show a live-
// looking week without a backend (mirrors IS_DEMO in useAdmin/useAnnouncements).
function demoDate(dayOffset: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function demoEvents(): Event[] {
  return [
    {
      id: "demo_evt_1",
      title: "Practice",
      type: "practice",
      status: "scheduled",
      startsAt: demoDate(0, 15, 30).toISOString(),
      endsAt: demoDate(0, 17, 15).toISOString(),
      location: "Barnegat HS · Main Gym",
      homeAway: null,
      opponent: null,
      notes: "Ball pressure defense → half-court execution",
      createdAt: demoDate(-7, 9, 0).toISOString(),
    },
    {
      id: "demo_evt_2",
      title: "Walkthrough",
      type: "practice",
      status: "scheduled",
      startsAt: demoDate(1, 16, 0).toISOString(),
      endsAt: demoDate(1, 17, 0).toISOString(),
      location: "Barnegat HS",
      homeAway: null,
      opponent: null,
      notes: null,
      createdAt: demoDate(-7, 9, 0).toISOString(),
    },
    {
      id: "demo_evt_3",
      title: "Game — Oak Hill",
      type: "game",
      status: "scheduled",
      startsAt: demoDate(2, 17, 0).toISOString(),
      endsAt: demoDate(2, 19, 0).toISOString(),
      location: "Oak Hill HS",
      homeAway: "away",
      opponent: "Oak Hill Academy",
      notes: null,
      createdAt: demoDate(-7, 9, 0).toISOString(),
    },
  ];
}

export function useEvents(from?: Date) {
  return useQuery({
    queryKey: ["events", from?.toISOString()],
    queryFn: async (): Promise<Event[]> => {
      if (IS_DEMO) {
        const all = demoEvents();
        return from ? all.filter((e) => new Date(e.startsAt) >= from) : all;
      }
      const params = new URLSearchParams();
      if (from) params.set("from", from.toISOString());
      const qs = params.toString();
      return apiGet<Event[]>(`/events${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => apiGet<Event>(`/events/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Event>) => apiPost<Event>("/events", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Event> & { id: string }) =>
      apiPatch<{ ok: boolean }>(`/events/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useEventAvailability(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "availability"],
    queryFn: () => apiGet<EventAvailability[]>(`/events/${eventId}/availability`),
    enabled: !!eventId,
  });
}

export function useSubmitAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      ...data
    }: { eventId: string } & Record<string, unknown>) => {
      if (IS_DEMO) return { ok: true };
      return apiPost<{ ok: boolean }>(`/events/${eventId}/availability`, data);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["events", vars.eventId, "availability"] }),
  });
}

export function useEventAttendance(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "attendance"],
    queryFn: () => apiGet<EventAttendance[]>(`/events/${eventId}/attendance`),
    enabled: !!eventId,
  });
}

export function useSubmitAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      records,
    }: {
      eventId: string;
      records: Partial<EventAttendance>[];
    }) =>
      apiPost<{ ok: boolean }>(`/events/${eventId}/attendance`, { records }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["events", vars.eventId, "attendance"] }),
  });
}
