import { useState } from "react";
import {
  Calendar, MapPin, Clock, CheckCircle2, XCircle, HelpCircle,
  Swords, Dumbbell, Trophy, Film, Zap, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useChildSchedule, useRsvpForChild } from "@/lib/api/hooks/useParent";
import type { ScheduleEvent } from "@/features/parent/mock";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  game: <Swords className="w-4 h-4" />,
  practice: <Dumbbell className="w-4 h-4" />,
  tournament: <Trophy className="w-4 h-4" />,
  film: <Film className="w-4 h-4" />,
  conditioning: <Zap className="w-4 h-4" />,
};

const TYPE_COLOR: Record<string, string> = {
  game: "oklch(0.68 0.22 25)",
  tournament: "oklch(0.72 0.18 290)",
  practice: "oklch(0.75 0.12 140)",
  film: "oklch(0.7 0.18 310)",
  conditioning: "oklch(0.78 0.17 75)",
};

const RSVP_CONFIG = {
  going: { label: "Going", icon: CheckCircle2, color: "oklch(0.75 0.12 140)" },
  not_going: { label: "Can't make it", icon: XCircle, color: "oklch(0.68 0.22 25)" },
  maybe: { label: "Maybe", icon: HelpCircle, color: "oklch(0.78 0.17 75)" },
} as const;

type RsvpStatus = "going" | "not_going" | "maybe";

/* -------------------------------------------------------------------------- */
/* Event card                                                                   */
/* -------------------------------------------------------------------------- */

function EventCard({
  event, rsvp, onRsvp,
}: {
  event: ScheduleEvent;
  rsvp: RsvpStatus | null;
  onRsvp: (id: string, status: RsvpStatus) => void;
}) {
  const color = TYPE_COLOR[event.type] ?? "oklch(0.72 0.18 290)";
  const icon = TYPE_ICON[event.type];
  const isFuture = new Date(event.date) >= new Date();

  return (
    <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: `${color}30` }}>
      {/* Color accent bar */}
      <div className="h-1" style={{ background: color }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, color }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="font-semibold text-[14px]">{event.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 capitalize">{event.type}</div>
              </div>
              {event.required && (
                <Badge variant="secondary" className="text-[10px] shrink-0">Required</Badge>
              )}
            </div>
            <div className="mt-2 space-y-1 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {event.location}
              </div>
            </div>
            {event.notes && (
              <div className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground border-l-2 border-muted">
                {event.notes}
              </div>
            )}
          </div>
        </div>

        {/* RSVP buttons */}
        {isFuture && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground mr-1">RSVP:</span>
            {(["going", "maybe", "not_going"] as RsvpStatus[]).map((s) => {
              const cfg = RSVP_CONFIG[s];
              const Icon = cfg.icon;
              const isActive = rsvp === s;
              return (
                <button
                  key={s}
                  onClick={() => onRsvp(event.id, s)}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all"
                  style={isActive
                    ? { background: `${cfg.color}20`, borderColor: cfg.color, color: cfg.color }
                    : { borderColor: "transparent", color: "oklch(0.5 0 0)" }
                  }
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {!isFuture && (
          <div className="mt-2 text-[11px] text-muted-foreground">Past event</div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                  */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
      <Calendar className="w-8 h-8 text-muted-foreground/30" />
      <p className="font-semibold">No upcoming events</p>
      <p className="text-[12px] text-muted-foreground max-w-xs">
        New events will appear here when your coaching staff adds them to the schedule.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function ParentSchedulePage() {
  const { user } = useAuth();
  const playerId = user?.linkedChildId ?? "";

  const { data: rawEvents = [], isLoading, isError } = useChildSchedule(playerId);
  const rsvpMutation = useRsvpForChild(playerId);

  const [rsvps, setRsvps] = useState<Record<string, RsvpStatus>>({});
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  // Seed rsvp state from fetched data (only once per fetch by merging)
  const scheduleEvents = rawEvents as ScheduleEvent[];

  const now = new Date();
  const events = filter === "upcoming"
    ? scheduleEvents.filter((e) => new Date(e.date) >= now)
    : scheduleEvents;

  // Build effective RSVP map: local overrides take precedence over server state
  const effectiveRsvps: Record<string, RsvpStatus | null> = {};
  scheduleEvents.forEach((e) => {
    effectiveRsvps[e.id] = (rsvps[e.id] ?? (e.rsvpStatus as RsvpStatus | null)) ?? null;
  });

  // Group by month
  const grouped = events.reduce<Record<string, ScheduleEvent[]>>((acc, e) => {
    const key = formatMonth(e.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  function handleRsvp(eventId: string, status: RsvpStatus) {
    setRsvps((prev) => ({ ...prev, [eventId]: status }));
    const cfg = RSVP_CONFIG[status];
    toast.success(`RSVP updated: ${cfg.label}`);
    // Fire API call (no-op in demo)
    rsvpMutation.mutate({
      eventId,
      status: status === "going" ? "available" : status === "not_going" ? "unavailable" : "maybe",
    });
  }

  const pendingRsvp = events.filter(
    (e) => new Date(e.date) >= now && !effectiveRsvps[e.id]
  ).length;

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader eyebrow="Family Portal" title="Schedule" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (isError || !playerId) {
    return (
      <AppShell>
        <PageHeader eyebrow="Family Portal" title="Schedule" />
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-[12px] text-red-400">
          {!playerId ? "No linked athlete found. Contact your program admin." : "Failed to load schedule. Please refresh."}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Family Portal"
        title="Schedule"
        subtitle="Upcoming games, practices, and events."
        actions={
          pendingRsvp > 0 ? (
            <Badge
              variant="secondary"
              className="gap-1"
              style={{ color: "oklch(0.72 0.17 75)" }}
            >
              <HelpCircle className="w-3 h-3" />
              {pendingRsvp} RSVP{pendingRsvp > 1 ? "s" : ""} needed
            </Badge>
          ) : undefined
        }
      />

      {/* Filter strip */}
      <div className="flex gap-2 mb-5">
        {(["upcoming", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all"
            style={filter === f
              ? { background: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290)", color: "white" }
              : { borderColor: "transparent", color: "oklch(0.5 0 0)" }
            }
          >
            {f === "upcoming" ? "Upcoming" : "All events"}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <h2 className="font-semibold text-[13px] text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {month}
              </h2>
              <div className="space-y-3">
                {monthEvents.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    rsvp={effectiveRsvps[e.id] ?? null}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
