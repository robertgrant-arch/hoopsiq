import { useState } from "react";
import {
  Calendar, MapPin, Clock, CheckCircle2, XCircle, HelpCircle,
  Swords, Dumbbell, Trophy, Film, Zap, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { mockScheduleEvents, type ScheduleEvent } from "@/features/parent/mock";
import { mockAvailability, type AvailabilityEntry } from "@/features/player/mock";

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

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  game:         <Swords className="w-4 h-4" />,
  practice:     <Dumbbell className="w-4 h-4" />,
  tournament:   <Trophy className="w-4 h-4" />,
  film:         <Film className="w-4 h-4" />,
  conditioning: <Zap className="w-4 h-4" />,
};

const TYPE_COLOR: Record<string, string> = {
  game:         "oklch(0.68 0.22 25)",
  tournament:   "oklch(0.72 0.18 290)",
  practice:     "oklch(0.75 0.12 140)",
  film:         "oklch(0.7 0.18 310)",
  conditioning: "oklch(0.78 0.17 75)",
};

type AvailStatus = "available" | "unavailable" | "maybe";

const AVAIL_CONFIG: Record<AvailStatus, { label: string; icon: React.ComponentType<any>; color: string }> = {
  available:   { label: "I'm going",     icon: CheckCircle2, color: "oklch(0.75 0.12 140)" },
  maybe:       { label: "Maybe",         icon: HelpCircle,   color: "oklch(0.78 0.17 75)" },
  unavailable: { label: "Can't make it", icon: XCircle,      color: "oklch(0.68 0.22 25)" },
};

/* -------------------------------------------------------------------------- */
/* Availability buttons                                                         */
/* -------------------------------------------------------------------------- */

function AvailabilityButtons({
  eventId,
  current,
  isFuture,
  onChange,
}: {
  eventId: string;
  current: AvailStatus | null;
  isFuture: boolean;
  onChange: (id: string, status: AvailStatus) => void;
}) {
  if (!isFuture) {
    return (
      <div className="text-[11px] text-muted-foreground mt-2">Past event</div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <span className="text-[11px] text-muted-foreground">Availability:</span>
      {(["available", "maybe", "unavailable"] as AvailStatus[]).map((s) => {
        const cfg = AVAIL_CONFIG[s];
        const Icon = cfg.icon;
        const isActive = current === s;
        return (
          <button
            key={s}
            onClick={() => onChange(eventId, s)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all"
            style={isActive
              ? { background: `${cfg.color}20`, borderColor: cfg.color, color: cfg.color }
              : { borderColor: "hsl(var(--border))", color: "oklch(0.5 0 0)" }
            }
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Event card                                                                   */
/* -------------------------------------------------------------------------- */

function EventCard({
  event,
  avail,
  onAvail,
}: {
  event: ScheduleEvent;
  avail: AvailStatus | null;
  onAvail: (id: string, status: AvailStatus) => void;
}) {
  const color = TYPE_COLOR[event.type] ?? "oklch(0.72 0.18 290)";
  const icon = TYPE_ICON[event.type];
  const isFuture = new Date(event.date) >= new Date();
  const countdown = daysUntil(event.date);

  return (
    <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: `${color}30` }}>
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
                <div className="text-[11px] text-muted-foreground capitalize mt-0.5">{event.type}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {countdown && (
                  <span className="font-mono text-[12px] font-bold" style={{ color }}>
                    {countdown}
                  </span>
                )}
                {event.required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
              </div>
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
            <AvailabilityButtons
              eventId={event.id}
              current={avail}
              isFuture={isFuture}
              onChange={onAvail}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Next up hero                                                                 */
/* -------------------------------------------------------------------------- */

function NextUpHero({ events, avail }: { events: ScheduleEvent[]; avail: Record<string, AvailStatus> }) {
  const next = events.find((e) => new Date(e.date) >= new Date());
  if (!next) return null;
  const color = TYPE_COLOR[next.type] ?? "oklch(0.72 0.18 290)";
  const countdown = daysUntil(next.date);

  return (
    <div
      className="rounded-2xl border p-5 relative overflow-hidden"
      style={{ borderColor: `${color}40`, background: `${color}08` }}
    >
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <Clock className="w-3 h-3" /> Next up
      </div>
      <h2 className="text-[22px] font-bold leading-tight">{next.title}</h2>
      <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground flex-wrap">
        <span>{formatDate(next.date)}</span>
        <span>·</span>
        <span>{next.startTime}</span>
        <span>·</span>
        <span>{next.location}</span>
      </div>
      {countdown && (
        <div className="mt-2 font-mono text-[28px] font-bold" style={{ color }}>
          {countdown}
        </div>
      )}
      {avail[next.id] && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px]">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: AVAIL_CONFIG[avail[next.id]].color }} />
          <span style={{ color: AVAIL_CONFIG[avail[next.id]].color }}>
            {AVAIL_CONFIG[avail[next.id]].label}
          </span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function PlayerSchedulePage() {
  const [availability, setAvailability] = useState<Record<string, AvailStatus>>(() => {
    const init: Record<string, AvailStatus> = {};
    Object.entries(mockAvailability).forEach(([id, entry]) => {
      init[id] = entry.status as AvailStatus;
    });
    return init;
  });

  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  const now = new Date();
  const events = filter === "upcoming"
    ? mockScheduleEvents.filter((e) => new Date(e.date) >= now)
    : mockScheduleEvents;

  const grouped = events.reduce<Record<string, ScheduleEvent[]>>((acc, e) => {
    const key = formatMonth(e.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const pendingCount = events.filter(
    (e) => new Date(e.date) >= now && !availability[e.id]
  ).length;

  function handleAvail(eventId: string, status: AvailStatus) {
    setAvailability((prev) => ({ ...prev, [eventId]: status }));
    toast.success(
      `Availability updated — ${AVAIL_CONFIG[status].label}`,
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Athlete Portal"
        title="Schedule"
        subtitle="Upcoming games, practices, and events."
        actions={
          pendingCount > 0 ? (
            <Badge variant="secondary" style={{ color: "oklch(0.72 0.17 75)" }}>
              {pendingCount} availability needed
            </Badge>
          ) : undefined
        }
      />

      <div className="space-y-5">
        <NextUpHero events={mockScheduleEvents} avail={availability} />

        {/* Filter strip */}
        <div className="flex gap-2">
          {(["upcoming", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all"
              style={filter === f
                ? { background: "oklch(0.72 0.18 290)", borderColor: "oklch(0.72 0.18 290)", color: "white" }
                : { borderColor: "transparent" }
              }
            >
              {f === "upcoming" ? "Upcoming" : "All events"}
            </button>
          ))}
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 flex flex-col items-center text-center gap-3">
            <Calendar className="w-8 h-8 text-muted-foreground/30" />
            <p className="font-semibold">No upcoming events</p>
            <p className="text-[12px] text-muted-foreground">Your coach hasn't scheduled anything yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="font-semibold text-[12px] text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> {month}
                </h2>
                <div className="space-y-3">
                  {monthEvents.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      avail={availability[e.id] ?? null}
                      onAvail={handleAvail}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
