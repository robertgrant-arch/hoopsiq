import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  Filter,
  MapPin,
  Clock,
  Copy,
  RefreshCw,
  AlertTriangle,
  Users,
  Star,
  Trophy,
  Dumbbell,
  Circle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Color tokens ───────────────────────────────────────────────────────────────

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";

// Event type dot colors (accessible, distinct)
const TYPE_COLORS = {
  practice:   "oklch(0.60 0.16 240)",  // blue
  game:       PRIMARY,                  // purple
  tournament: WARNING,                  // amber
  optional:   "oklch(0.55 0.02 260)",  // gray
} as const;

// Per-athlete accent (household view)
const ATHLETE_COLORS = {
  marcus: PRIMARY,
  jaylen: SUCCESS,
} as const;

// ── Types ──────────────────────────────────────────────────────────────────────

type EventType = "practice" | "game" | "tournament" | "optional";
type FilterType = "all" | EventType;

type CalEvent = {
  id: string;
  type: EventType;
  title: string;
  date: string;         // "YYYY-MM-DD"
  startTime: string;    // "HH:MM" 24h
  endTime: string;      // "HH:MM" 24h
  startDisplay: string; // "3:30 PM"
  endDisplay: string;   // "5:30 PM"
  location: string;
  isPast: boolean;
  athlete: "marcus" | "jaylen" | "both"; // household view
  eventPath: string;    // detail link
};

// ── Mock events — full May 2026 ────────────────────────────────────────────────
// Today = May 16, 2026 (per session context)

const ALL_EVENTS: CalEvent[] = [
  // Week 1
  { id: "e01", type: "practice",   title: "Practice",                     date: "2026-05-04", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: true,  athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e02", type: "game",       title: "vs. Lakewood Bears",           date: "2026-05-06", startTime: "19:00", endTime: "21:00", startDisplay: "7:00 PM", endDisplay: "9:00 PM", location: "Home Gym",                  isPast: true,  athlete: "marcus", eventPath: "/app/team/events/2" },
  { id: "e03", type: "optional",   title: "Film Session (Optional)",      date: "2026-05-07", startTime: "10:00", endTime: "11:30", startDisplay: "10:00 AM", endDisplay: "11:30 AM", location: "Film Room",               isPast: true,  athlete: "marcus", eventPath: "/app/team/events/1" },
  // Week 2
  { id: "e04", type: "practice",   title: "Practice",                     date: "2026-05-11", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: true,  athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e05", type: "practice",   title: "Practice",                     date: "2026-05-12", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: true,  athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e06", type: "game",       title: "@ Toms River South",           date: "2026-05-13", startTime: "19:00", endTime: "21:00", startDisplay: "7:00 PM", endDisplay: "9:00 PM", location: "Toms River South HS",        isPast: true,  athlete: "marcus", eventPath: "/app/team/events/2" },
  { id: "e07", type: "practice",   title: "Practice",                     date: "2026-05-14", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: true,  athlete: "both",   eventPath: "/app/team/events/1" },
  // Week 3 (today = May 16)
  { id: "e08", type: "game",       title: "@ Toms River North",           date: "2026-05-16", startTime: "19:00", endTime: "21:00", startDisplay: "7:00 PM", endDisplay: "9:00 PM", location: "Toms River North HS",        isPast: false, athlete: "marcus", eventPath: "/app/team/events/2" },
  { id: "e09", type: "optional",   title: "Recruiting Visit (Optional)",  date: "2026-05-17", startTime: "11:00", endTime: "13:00", startDisplay: "11:00 AM", endDisplay: "1:00 PM", location: "Shore Sports Complex",      isPast: false, athlete: "jaylen", eventPath: "/app/team/events/1" },
  { id: "e10", type: "practice",   title: "Practice",                     date: "2026-05-19", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: false, athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e11", type: "practice",   title: "Practice",                     date: "2026-05-20", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: false, athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e12", type: "game",       title: "vs. Brick Memorial",           date: "2026-05-20", startTime: "19:00", endTime: "21:00", startDisplay: "7:00 PM", endDisplay: "9:00 PM", location: "Home Gym",                  isPast: false, athlete: "marcus", eventPath: "/app/team/events/2" },
  // Week 4 — tournament weekend
  { id: "e13", type: "practice",   title: "Pre-Tournament Practice",      date: "2026-05-21", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: false, athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e14", type: "tournament", title: "Spring Invitational — Day 1",  date: "2026-05-23", startTime: "08:00", endTime: "20:00", startDisplay: "8:00 AM",  endDisplay: "8:00 PM",  location: "Prudential Center, Newark", isPast: false, athlete: "marcus", eventPath: "/app/team/events/3" },
  { id: "e15", type: "tournament", title: "Spring Invitational — Day 2",  date: "2026-05-24", startTime: "07:30", endTime: "20:00", startDisplay: "7:30 AM",  endDisplay: "8:00 PM",  location: "Prudential Center, Newark", isPast: false, athlete: "marcus", eventPath: "/app/team/events/3" },
  { id: "e16", type: "tournament", title: "Spring Invitational — Day 3",  date: "2026-05-25", startTime: "08:00", endTime: "15:00", startDisplay: "8:00 AM",  endDisplay: "3:00 PM",  location: "Prudential Center, Newark", isPast: false, athlete: "marcus", eventPath: "/app/team/events/3" },
  { id: "e17", type: "optional",   title: "Film Review (Optional)",       date: "2026-05-26", startTime: "10:00", endTime: "11:30", startDisplay: "10:00 AM", endDisplay: "11:30 AM", location: "Film Room",               isPast: false, athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e18", type: "practice",   title: "Practice",                     date: "2026-05-28", startTime: "15:30", endTime: "17:30", startDisplay: "3:30 PM", endDisplay: "5:30 PM", location: "Main Gym",                  isPast: false, athlete: "both",   eventPath: "/app/team/events/1" },
  { id: "e19", type: "practice",   title: "Practice",                     date: "2026-05-28", startTime: "17:30", endTime: "19:30", startDisplay: "5:30 PM", endDisplay: "7:30 PM", location: "Annex Gym",                 isPast: false, athlete: "jaylen", eventPath: "/app/team/events/1" },
  { id: "e20", type: "game",       title: "vs. Point Pleasant Beach",     date: "2026-05-29", startTime: "19:00", endTime: "21:00", startDisplay: "7:00 PM", endDisplay: "9:00 PM", location: "Home Gym",                  isPast: false, athlete: "marcus", eventPath: "/app/team/events/2" },
];

const TODAY = "2026-05-16";
const CURRENT_YEAR  = 2026;
const CURRENT_MONTH = 4; // 0-indexed May

// ── Conflict detection ─────────────────────────────────────────────────────────

type Conflict = { a: CalEvent; b: CalEvent };

function detectConflicts(events: CalEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];
  // Group by date
  const byDate = new Map<string, CalEvent[]>();
  for (const e of events) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }
  byDate.forEach((dayEvents) => {
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const a = dayEvents[i];
        const b = dayEvents[j];
        // Overlap if a.startTime < b.endTime AND b.startTime < a.endTime
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          conflicts.push({ a, b });
        }
      }
    }
  });
  return conflicts;
}

// ── Calendar helpers ───────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function typeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    practice: "Practice",
    game: "Game",
    tournament: "Tournament",
    optional: "Optional",
  };
  return labels[type];
}

function typeIcon(type: EventType): React.ReactNode {
  const icons: Record<EventType, React.ReactNode> = {
    practice:   <Dumbbell className="w-3 h-3" />,
    game:       <Star className="w-3 h-3" />,
    tournament: <Trophy className="w-3 h-3" />,
    optional:   <Circle className="w-3 h-3" />,
  };
  return icons[type];
}

// ── Event dot ─────────────────────────────────────────────────────────────────

function EventDot({
  type,
  athlete,
  householdMode,
}: {
  type: EventType;
  athlete: CalEvent["athlete"];
  householdMode: boolean;
}) {
  if (householdMode && athlete !== "both") {
    const color = athlete === "marcus" ? ATHLETE_COLORS.marcus : ATHLETE_COLORS.jaylen;
    return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />;
  }
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLORS[type] }} />;
}

// ── Event list item ────────────────────────────────────────────────────────────

function EventListItem({
  event,
  householdMode,
}: {
  event: CalEvent;
  householdMode: boolean;
}) {
  const color = TYPE_COLORS[event.type];
  return (
    <Link href={event.eventPath} asChild>
      <a
        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/40 ${
          event.isPast ? "opacity-50" : ""
        }`}
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center pt-1 shrink-0 gap-1">
          {typeIcon(event.type)}
          {householdMode && event.athlete !== "both" && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: ATHLETE_COLORS[event.athlete] }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold">{event.title}</span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: `${color.replace(")", " / 0.12)")}`, color }}
            >
              {typeLabel(event.type)}
            </span>
            {event.isPast && (
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Past</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[12px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.startDisplay}
              {event.endDisplay ? ` – ${event.endDisplay}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />
      </a>
    </Link>
  );
}

// ── This-week summary strip ────────────────────────────────────────────────────

function WeekSummary({ events }: { events: CalEvent[] }) {
  const todayDate = new Date(TODAY);
  const sunday = new Date(todayDate);
  sunday.setDate(todayDate.getDate() - todayDate.getDay());
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const thisWeek = events.filter((e) => {
    const d = new Date(e.date);
    return d >= sunday && d <= saturday;
  });

  const practices   = thisWeek.filter((e) => e.type === "practice").length;
  const games       = thisWeek.filter((e) => e.type === "game").length;
  const tournaments = thisWeek.filter((e) => e.type === "tournament").length;

  const nextEvent = events
    .filter((e) => e.date >= TODAY && !e.isPast)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0];

  // Days until next event
  let countdown = "";
  if (nextEvent) {
    const diff = Math.ceil(
      (new Date(nextEvent.date).getTime() - new Date(TODAY).getTime()) / 86400000
    );
    countdown = diff === 0 ? "Today!" : diff === 1 ? "Tomorrow" : `${diff} days away`;
  }

  return (
    <div className="flex items-center gap-4 flex-wrap bg-muted/30 border border-border rounded-xl px-4 py-3 mb-5 text-[13px]">
      <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">This Week</span>
      <span className="flex items-center gap-1.5" style={{ color: TYPE_COLORS.practice }}>
        <Dumbbell className="w-3.5 h-3.5" />
        {practices} practice{practices !== 1 ? "s" : ""}
      </span>
      <span className="flex items-center gap-1.5" style={{ color: TYPE_COLORS.game }}>
        <Star className="w-3.5 h-3.5" />
        {games} game{games !== 1 ? "s" : ""}
      </span>
      {tournaments > 0 && (
        <span className="flex items-center gap-1.5" style={{ color: TYPE_COLORS.tournament }}>
          <Trophy className="w-3.5 h-3.5" />
          {tournaments} tournament day{tournaments !== 1 ? "s" : ""}
        </span>
      )}
      {nextEvent && (
        <span className="ml-auto text-[12px] font-medium" style={{ color: PRIMARY }}>
          Next: {nextEvent.title} — {countdown}
        </span>
      )}
    </div>
  );
}

// ── Month grid view ────────────────────────────────────────────────────────────

function MonthGrid({
  year,
  month,
  events,
  selectedDay,
  onSelectDay,
  householdMode,
}: {
  year: number;
  month: number;
  events: CalEvent[];
  selectedDay: string | null;
  onSelectDay: (dateKey: string) => void;
  householdMode: boolean;
}) {
  const daysInMonth  = getDaysInMonth(year, month);
  const firstDay     = getFirstDayOfMonth(year, month);
  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  // Grid cells: null = empty leading cell, number = day
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[80px] bg-muted/10" />;
          }
          const dateKey     = formatDateKey(year, month, day);
          const dayEvents   = eventsByDate.get(dateKey) ?? [];
          const isToday     = dateKey === TODAY;
          const isSelected  = dateKey === selectedDay;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDay(dateKey)}
              className={`min-h-[80px] p-1.5 flex flex-col items-start gap-1 transition-colors text-left ${
                isSelected
                  ? "bg-primary/8"
                  : isToday
                  ? "bg-primary/5"
                  : "hover:bg-muted/30"
              }`}
            >
              {/* Day number */}
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold leading-none ${
                  isToday ? "text-white" : "text-foreground"
                }`}
                style={isToday ? { background: PRIMARY } : undefined}
              >
                {day}
              </span>

              {/* Event dots — up to 3 shown */}
              <div className="flex flex-wrap gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventDot
                    key={e.id}
                    type={e.type}
                    athlete={e.athlete}
                    householdMode={householdMode}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[9px] text-muted-foreground font-medium leading-none mt-0.5">
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>

              {/* First event label (sm+) */}
              {dayEvents.length > 0 && (
                <span
                  className="hidden sm:block text-[9px] leading-tight truncate w-full font-medium"
                  style={{ color: TYPE_COLORS[dayEvents[0].type] }}
                >
                  {dayEvents[0].title}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type ViewMode = "month" | "list";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function TeamCalendarPage() {
  const [viewMode, setViewMode]         = useState<ViewMode>("month");
  const [filter, setFilter]             = useState<FilterType>("all");
  const [householdMode, setHouseholdMode] = useState(false);
  const [selectedDay, setSelectedDay]   = useState<string | null>(TODAY);
  const [year, setYear]                 = useState(CURRENT_YEAR);
  const [month, setMonth]               = useState(CURRENT_MONTH);

  // Filtered events
  const filteredEvents = useMemo<CalEvent[]>(() => {
    return ALL_EVENTS.filter((e) => filter === "all" || e.type === filter);
  }, [filter]);

  // Events for selected day
  const selectedDayEvents = useMemo<CalEvent[]>(() => {
    if (!selectedDay) return [];
    return filteredEvents.filter((e) => e.date === selectedDay);
  }, [selectedDay, filteredEvents]);

  // Conflicts
  const conflicts = useMemo<Conflict[]>(() => detectConflicts(filteredEvents), [filteredEvents]);

  // Month navigation
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const FILTERS: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: "all",        label: "All",         icon: <Calendar className="w-3 h-3" />   },
    { id: "practice",   label: "Practices",   icon: <Dumbbell className="w-3 h-3" />   },
    { id: "game",       label: "Games",       icon: <Star className="w-3 h-3" />        },
    { id: "tournament", label: "Tournaments", icon: <Trophy className="w-3 h-3" />      },
    { id: "optional",   label: "Optional",    icon: <Circle className="w-3 h-3" />      },
  ];

  function handleAddToPhone() {
    void navigator.clipboard.writeText("webcal://hoopsiq.app/team/calendar.ics").catch(() => null);
    toast.success("Calendar link copied — paste into your calendar app.");
  }

  function handleSyncAll() {
    toast.success("Calendar sync updated.");
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Team"
          title="Team Calendar"
          subtitle="Full schedule with conflict detection, filters, and household view."
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleAddToPhone}>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Add to phone
              </Button>
              <Button variant="outline" size="sm" onClick={handleSyncAll}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Sync all
              </Button>
            </div>
          }
        />

        {/* ── Conflict detection banner ── */}
        {conflicts.length > 0 && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 border text-[13px]"
            style={{
              background: `${WARNING.replace(")", " / 0.10)")}`,
              borderColor: `${WARNING.replace(")", " / 0.30)")}`,
              color: WARNING,
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Schedule conflict detected</span>
              {conflicts.map((c, i) => (
                <span key={i} className="text-[12px]" style={{ color: "var(--foreground)", opacity: 0.75 }}>
                  "{c.a.title}" and "{c.b.title}" overlap on{" "}
                  {new Date(c.a.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Controls row ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          {/* Month navigation (only in month view) */}
          {viewMode === "month" && (
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted/50 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-[15px] font-semibold min-w-[130px] text-center">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted/50 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
          {viewMode === "list" && (
            <span className="text-[15px] font-semibold">All Events</span>
          )}

          <div className="flex items-center gap-2">
            {/* Household toggle */}
            <button
              onClick={() => setHouseholdMode((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all"
              style={
                householdMode
                  ? { background: `${SUCCESS.replace(")", " / 0.12)")}`, borderColor: `${SUCCESS.replace(")", " / 0.30)")}`, color: SUCCESS }
                  : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
              }
            >
              <Users className="w-3 h-3" />
              Household
            </button>

            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 flex items-center gap-1.5 text-[12px] font-medium transition-colors ${
                  viewMode === "month" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Month
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 flex items-center gap-1.5 text-[12px] font-medium transition-colors border-l border-border ${
                  viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {FILTERS.map((f) => {
            const isActive = filter === f.id;
            const dotColor = f.id === "all" ? PRIMARY : TYPE_COLORS[f.id as EventType] ?? PRIMARY;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all"
                style={
                  isActive
                    ? { background: `${dotColor.replace(")", " / 0.12)")}`, borderColor: `${dotColor.replace(")", " / 0.35)")}`, color: dotColor }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                }
              >
                {f.icon}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Household legend ── */}
        {householdMode && (
          <div className="flex items-center gap-4 mb-4 text-[12px]">
            <span className="text-muted-foreground font-medium">Household:</span>
            {[
              { name: "Marcus", color: ATHLETE_COLORS.marcus },
              { name: "Jaylen", color: ATHLETE_COLORS.jaylen },
            ].map((a) => (
              <span key={a.name} className="flex items-center gap-1.5 font-medium" style={{ color: a.color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                {a.name}
              </span>
            ))}
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {viewMode === "month" && (
          <div className="flex flex-col gap-5">
            <WeekSummary events={filteredEvents} />
            <MonthGrid
              year={year}
              month={month}
              events={filteredEvents}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              householdMode={householdMode}
            />

            {/* Day panel */}
            {selectedDay && (
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold">
                    {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric",
                    })}
                    {selectedDay === TODAY && (
                      <span
                        className="ml-2 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY }}
                      >
                        Today
                      </span>
                    )}
                  </h3>
                  <span className="text-[12px] text-muted-foreground">
                    {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {selectedDayEvents.length === 0 ? (
                  <div className="text-[13px] text-muted-foreground/60 text-center py-6 border border-dashed border-border rounded-xl">
                    No events on this day.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedDayEvents.map((event) => (
                      <EventListItem key={event.id} event={event} householdMode={householdMode} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === "list" && (
          <div className="flex flex-col gap-5">
            <WeekSummary events={filteredEvents} />

            {/* Upcoming */}
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground px-1">
                Upcoming
              </div>
              {filteredEvents
                .filter((e) => !e.isPast)
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map((event) => (
                  <EventListItem key={event.id} event={event} householdMode={householdMode} />
                ))}
            </div>

            {/* Past */}
            <div className="flex flex-col gap-2">
              <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground px-1 mt-2">
                Past Events
              </div>
              {filteredEvents
                .filter((e) => e.isPast)
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((event) => (
                  <EventListItem key={event.id} event={event} householdMode={householdMode} />
                ))}
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="flex items-center gap-4 flex-wrap mt-6 pt-4 border-t border-border">
          <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">Legend</span>
          {(["practice", "game", "tournament", "optional"] as const).map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[type] }} />
              {typeLabel(type)}
            </span>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default TeamCalendarPage;
