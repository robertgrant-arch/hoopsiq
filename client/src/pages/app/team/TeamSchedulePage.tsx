import { useState } from "react";
import { Link } from "wouter";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  ClipboardList,
  UserCheck,
  UserX,
  Send,
  Filter,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type AvailabilityStatus = "yes" | "no" | "maybe";
type Event = {
  id: string;
  type: "practice" | "game" | "optional";
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  homeAway?: "home" | "away";
  status: "upcoming" | "completed";
  availabilityDeadline: string | null;
  availability: Record<string, AvailabilityStatus> | null;
  attendance: Record<string, AttendanceStatus> | null;
};

// ── Mock data ──────────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { id: "p1",  name: "Marcus Davis",   initials: "MD", position: "PG" },
  { id: "p2",  name: "Jordan Smith",   initials: "JS", position: "SG" },
  { id: "p3",  name: "Tyler Brown",    initials: "TB", position: "SF" },
  { id: "p4",  name: "Devon Williams", initials: "DW", position: "PF" },
  { id: "p5",  name: "Caleb Moore",    initials: "CM", position: "C"  },
  { id: "p6",  name: "Isaiah Jones",   initials: "IJ", position: "PG" },
  { id: "p7",  name: "Nathan Reed",    initials: "NR", position: "SG" },
  { id: "p8",  name: "Chris Evans",    initials: "CE", position: "SF" },
  { id: "p9",  name: "Malik Thompson", initials: "MT", position: "PF" },
  { id: "p10", name: "Dante Garcia",   initials: "DG", position: "C"  },
];

const EVENTS: Event[] = [
  {
    id: "e1",
    type: "practice",
    title: "Practice",
    date: "Wed May 14",
    time: "3:30 PM",
    endTime: "5:30 PM",
    location: "Main Gym",
    status: "upcoming",
    availabilityDeadline: "Tue May 13 · 8 PM",
    availability: { p1:"yes", p2:"yes", p3:"maybe", p4:"yes", p5:"yes", p6:"yes", p7:"no", p8:"yes", p9:"maybe", p10:"yes" },
    attendance: null,
  },
  {
    id: "e2",
    type: "game",
    title: "@ Toms River North",
    date: "Fri May 16",
    time: "7:00 PM",
    location: "Toms River North HS",
    homeAway: "away",
    status: "upcoming",
    availabilityDeadline: "Thu May 15 · 12 PM",
    availability: { p1:"yes", p2:"yes", p3:"yes", p4:"yes", p5:"yes", p6:"no", p7:"no", p8:"yes", p9:"yes", p10:"yes" },
    attendance: null,
  },
  {
    id: "e3",
    type: "practice",
    title: "Practice",
    date: "Mon May 12",
    time: "3:30 PM",
    endTime: "5:30 PM",
    location: "Main Gym",
    status: "completed",
    availabilityDeadline: null,
    availability: null,
    attendance: { p1:"present", p2:"present", p3:"absent", p4:"present", p5:"present", p6:"present", p7:"absent", p8:"present", p9:"late", p10:"present" },
  },
  {
    id: "e4",
    type: "game",
    title: "vs. Lakewood",
    date: "Fri May 9",
    time: "7:00 PM",
    location: "Home Gym",
    homeAway: "home",
    status: "completed",
    availabilityDeadline: null,
    availability: null,
    attendance: { p1:"present", p2:"present", p3:"present", p4:"present", p5:"present", p6:"present", p7:"absent", p8:"present", p9:"present", p10:"present" },
  },
  {
    id: "e5",
    type: "optional",
    title: "Film Session (Optional)",
    date: "Sat May 17",
    time: "10:00 AM",
    location: "Film Room",
    status: "upcoming",
    availabilityDeadline: "Fri May 16 · 6 PM",
    availability: { p1:"yes", p2:"no", p3:"yes", p4:"yes", p5:"yes", p6:"yes", p7:"no", p8:"no", p9:"yes", p10:"yes" },
    attendance: null,
  },
];

// Mock "today" as May 14 for demo purposes
const TODAY_DATE = "Wed May 14";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getEventBorderColor(type: Event["type"]) {
  if (type === "game") return "border-l-blue-500";
  if (type === "practice") return "border-l-green-500";
  return "border-l-muted-foreground/40";
}

function getEventTypeLabel(type: Event["type"]) {
  if (type === "game") return "Game";
  if (type === "practice") return "Practice";
  return "Optional";
}

function getEventTypeBadgeVariant(type: Event["type"]): "default" | "secondary" | "outline" {
  if (type === "game") return "default";
  if (type === "practice") return "secondary";
  return "outline";
}

function computeAvailabilitySummary(availability: Record<string, AvailabilityStatus>) {
  const yes = Object.values(availability).filter((v) => v === "yes").length;
  const maybe = Object.values(availability).filter((v) => v === "maybe").length;
  const no = Object.values(availability).filter((v) => v === "no").length;
  return { yes, maybe, no };
}

function computeAttendanceSummary(attendance: Record<string, AttendanceStatus>) {
  const present = Object.values(attendance).filter((v) => v === "present").length;
  const absent = Object.values(attendance).filter((v) => v === "absent").length;
  const late = Object.values(attendance).filter((v) => v === "late").length;
  const excused = Object.values(attendance).filter((v) => v === "excused").length;
  return { present, absent, late, excused };
}

function isEventTodayOrPast(event: Event) {
  return event.date === TODAY_DATE || event.status === "completed";
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PlayerInitialsChip({ initials }: { initials: string }) {
  return (
    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground shrink-0">
      {initials}
    </div>
  );
}

function AvailabilityBadge({ status }: { status: AvailabilityStatus | undefined }) {
  if (status === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Yes
      </span>
    );
  }
  if (status === "maybe") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-500">
        <AlertCircle className="w-3.5 h-3.5" />
        Maybe
      </span>
    );
  }
  if (status === "no") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-red-500">
        <XCircle className="w-3.5 h-3.5" />
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
      — No response
    </span>
  );
}

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { label: string; className: string }> = {
    present: { label: "Present", className: "text-green-600" },
    absent:  { label: "Absent",  className: "text-red-500" },
    late:    { label: "Late",    className: "text-amber-500" },
    excused: { label: "Excused", className: "text-blue-500" },
  };
  const { label, className } = map[status];
  return <span className={`text-[12px] font-medium ${className}`}>{label}</span>;
}

// ── Event list card ────────────────────────────────────────────────────────────

function EventCard({
  event,
  selected,
  onClick,
}: {
  event: Event;
  selected: boolean;
  onClick: () => void;
}) {
  const borderColor = getEventBorderColor(event.type);

  const summaryLine =
    event.status === "upcoming" && event.availability
      ? (() => {
          const { yes, maybe, no } = computeAvailabilitySummary(event.availability);
          return `${yes} confirmed · ${maybe} maybe · ${no} declined`;
        })()
      : event.status === "completed" && event.attendance
      ? (() => {
          const { present, absent, late } = computeAttendanceSummary(event.attendance);
          const parts = [`${present} present`];
          if (absent) parts.push(`${absent} absent`);
          if (late) parts.push(`${late} late`);
          return parts.join(" · ");
        })()
      : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border-l-4 ${borderColor} rounded-r-lg px-4 py-3.5 transition-colors ${
        selected
          ? "bg-primary/8 border border-primary/20 border-l-4"
          : "bg-card border border-border hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold leading-tight truncate">
              {event.title}
            </span>
            {event.type === "game" && event.homeAway === "away" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                AWAY
              </Badge>
            )}
            {event.type === "game" && event.homeAway === "home" && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                HOME
              </Badge>
            )}
            {event.type === "optional" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Optional
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground mt-1">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{event.date}</span>
            <span className="mx-0.5">·</span>
            <Clock className="w-3 h-3 shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{event.location}</span>
          </div>
          {summaryLine && (
            <div className="mt-1.5 text-[11.5px] text-muted-foreground">{summaryLine}</div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

// ── Upcoming event detail ──────────────────────────────────────────────────────

function UpcomingEventDetail({
  event,
  onTakeAttendance,
}: {
  event: Event;
  onTakeAttendance: () => void;
}) {
  const availability = event.availability ?? {};
  const responded = Object.values(availability).length;
  const total = TEAM_MEMBERS.length;
  const nonResponders = TEAM_MEMBERS.filter((m) => !availability[m.id]);
  const { yes, maybe, no } = computeAvailabilitySummary(availability);
  const canTakeAttendance = isEventTodayOrPast(event);

  function handleSendReminders() {
    toast(`Reminders sent to ${nonResponders.length} player${nonResponders.length !== 1 ? "s" : ""}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getEventTypeBadgeVariant(event.type)}>
              {getEventTypeLabel(event.type)}
            </Badge>
            {event.type === "game" && event.homeAway && (
              <Badge
                className={
                  event.homeAway === "away"
                    ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                }
              >
                {event.homeAway.toUpperCase()}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-semibold">{event.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {event.time}
              {event.endTime ? ` – ${event.endTime}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          </div>
        </div>
      </div>

      {/* Availability deadline */}
      {event.availabilityDeadline && (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5 border border-border">
          <Bell className="w-4 h-4 text-primary shrink-0" />
          <span>
            Availability deadline: <span className="font-medium text-foreground">{event.availabilityDeadline}</span>
          </span>
        </div>
      )}

      {/* Availability grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-[13px] font-medium">
              Availability — {responded} of {total} responded
            </span>
            <span className="text-[12px] text-muted-foreground">
              ({yes} yes · {maybe} maybe · {no} no)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendReminders}
            disabled={nonResponders.length === 0}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send Reminder
          </Button>
        </div>
        <div className="divide-y divide-border">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-4 py-2.5">
              <PlayerInitialsChip initials={member.initials} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{member.name}</div>
                <div className="text-[11px] text-muted-foreground">{member.position}</div>
              </div>
              <AvailabilityBadge status={availability[member.id]} />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {canTakeAttendance && (
          <Button onClick={onTakeAttendance}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Take Attendance
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() =>
            toast(
              `Reminders sent to ${nonResponders.length} player${nonResponders.length !== 1 ? "s" : ""}`
            )
          }
          disabled={nonResponders.length === 0}
        >
          <Bell className="w-4 h-4 mr-2" />
          Send Reminder to Non-Responders
        </Button>
      </div>
    </div>
  );
}

// ── Completed event detail ─────────────────────────────────────────────────────

function CompletedEventDetail({
  event,
  liveAttendance,
  onStatusChange,
}: {
  event: Event;
  liveAttendance: Record<string, AttendanceStatus>;
  onStatusChange: (playerId: string, status: AttendanceStatus) => void;
}) {
  const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

  const statusColors: Record<AttendanceStatus, string> = {
    present: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
    absent:  "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
    late:    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    excused: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const { present, absent, late, excused } = computeAttendanceSummary(liveAttendance);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getEventTypeBadgeVariant(event.type)}>
              {getEventTypeLabel(event.type)}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Completed
            </Badge>
          </div>
          <h2 className="text-xl font-semibold">{event.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {event.time}
              {event.endTime ? ` – ${event.endTime}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {(
          [
            { label: "Present", count: present, color: "text-green-600" },
            { label: "Absent",  count: absent,  color: "text-red-500" },
            { label: "Late",    count: late,    color: "text-amber-500" },
            { label: "Excused", count: excused, color: "text-blue-500" },
          ] as const
        ).map(({ label, count, color }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center bg-muted/40 border border-border rounded-lg py-3"
          >
            <span className={`text-2xl font-bold ${color}`}>{count}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {/* Attendance grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
          <UserCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-[13px] font-medium">Attendance Record</span>
        </div>
        <div className="divide-y divide-border">
          {TEAM_MEMBERS.map((member) => {
            const current = liveAttendance[member.id] ?? "present";
            return (
              <div key={member.id} className="flex items-center gap-3 px-4 py-2.5">
                <PlayerInitialsChip initials={member.initials} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{member.name}</div>
                  <div className="text-[11px] text-muted-foreground">{member.position}</div>
                </div>
                <div className="flex items-center gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatusChange(member.id, s)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors capitalize ${
                        current === s
                          ? statusColors[s]
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => toast("Attendance recorded")}>
          <ClipboardList className="w-4 h-4 mr-2" />
          Save Attendance
        </Button>
      </div>
    </div>
  );
}

// ── Attendance taking mode ─────────────────────────────────────────────────────

function AttendanceTakingPanel({
  event,
  liveAttendance,
  onStatusChange,
  onSave,
  onCancel,
}: {
  event: Event;
  liveAttendance: Record<string, AttendanceStatus>;
  onStatusChange: (playerId: string, status: AttendanceStatus) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];

  const statusColors: Record<AttendanceStatus, string> = {
    present: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
    absent:  "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
    late:    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    excused: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getEventTypeBadgeVariant(event.type)}>
              {getEventTypeLabel(event.type)}
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20">Taking Attendance</Badge>
          </div>
          <h2 className="text-xl font-semibold">{event.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {event.time}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Player grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          <span className="text-[13px] font-medium">Mark attendance for each player</span>
        </div>
        <div className="divide-y divide-border">
          {TEAM_MEMBERS.map((member) => {
            const current = liveAttendance[member.id] ?? "present";
            return (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                <PlayerInitialsChip initials={member.initials} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{member.name}</div>
                  <div className="text-[11px] text-muted-foreground">{member.position}</div>
                </div>
                <div className="flex items-center gap-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatusChange(member.id, s)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors capitalize ${
                        current === s
                          ? statusColors[s]
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={onSave}>
          <UserCheck className="w-4 h-4 mr-2" />
          Save & Notify Parents
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function TeamSchedulePage() {
  const [filterTab, setFilterTab] = useState<"upcoming" | "completed" | "all">("upcoming");
  const [selectedEventId, setSelectedEventId] = useState<string>("e1");
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [liveAttendance, setLiveAttendance] = useState<Record<string, AttendanceStatus>>({});

  const filteredEvents = EVENTS.filter((e) => {
    if (filterTab === "upcoming") return e.status === "upcoming";
    if (filterTab === "completed") return e.status === "completed";
    return true;
  });

  const selectedEvent = EVENTS.find((e) => e.id === selectedEventId) ?? null;

  function handleSelectEvent(id: string) {
    setSelectedEventId(id);
    setAttendanceMode(false);
    setLiveAttendance({});
  }

  function handleEnterAttendanceMode() {
    if (!selectedEvent) return;
    const prefill: Record<string, AttendanceStatus> = {};
    if (selectedEvent.attendance) {
      Object.assign(prefill, selectedEvent.attendance);
    } else {
      // Default all to present when starting fresh
      TEAM_MEMBERS.forEach((m) => (prefill[m.id] = "present"));
    }
    setLiveAttendance(prefill);
    setAttendanceMode(true);
  }

  function handleEnterCompletedEdit(event: Event) {
    if (event.attendance) {
      setLiveAttendance({ ...event.attendance });
    } else {
      const prefill: Record<string, AttendanceStatus> = {};
      TEAM_MEMBERS.forEach((m) => (prefill[m.id] = "present"));
      setLiveAttendance(prefill);
    }
  }

  function handleAttendanceStatusChange(playerId: string, status: AttendanceStatus) {
    setLiveAttendance((prev) => ({ ...prev, [playerId]: status }));
  }

  function handleSaveAttendance() {
    const absentCount = Object.values(liveAttendance).filter((s) => s === "absent").length;
    toast(
      `Attendance saved. ${absentCount > 0 ? `Parents notified of ${absentCount} absence${absentCount !== 1 ? "s" : ""}.` : "No absences recorded."}`
    );
    setAttendanceMode(false);
  }

  // Pre-populate liveAttendance when switching to a completed event
  function handleSelectWithPrefill(id: string) {
    const ev = EVENTS.find((e) => e.id === id);
    if (ev && ev.status === "completed" && ev.attendance) {
      setLiveAttendance({ ...ev.attendance });
    } else {
      setLiveAttendance({});
    }
    setSelectedEventId(id);
    setAttendanceMode(false);
  }

  // Sync liveAttendance when selectedEvent changes to completed (initial selection)
  const effectiveAttendance =
    selectedEvent?.status === "completed" && Object.keys(liveAttendance).length === 0
      ? selectedEvent.attendance ?? {}
      : liveAttendance;

  return (
    <AppShell>
      <div className="p-6 lg:p-8 max-w-none">
        <PageHeader
          eyebrow="Team"
          title="Team Schedule"
          subtitle="Upcoming events, availability, and attendance tracking."
        />

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-border">
          {(["upcoming", "completed", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 text-[13px] font-medium capitalize transition-colors border-b-2 -mb-px ${
                filterTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-6">
          {/* Event list */}
          <div className="w-80 shrink-0 flex flex-col gap-2">
            {filteredEvents.length === 0 && (
              <div className="text-[13px] text-muted-foreground text-center py-10">
                No {filterTab} events found.
              </div>
            )}
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                selected={selectedEventId === event.id}
                onClick={() => handleSelectWithPrefill(event.id)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="flex-1 min-w-0">
            {!selectedEvent ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                <Calendar className="w-10 h-10 opacity-30" />
                <span className="text-[14px]">Select an event to view details</span>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6">
                {attendanceMode ? (
                  <AttendanceTakingPanel
                    event={selectedEvent}
                    liveAttendance={liveAttendance}
                    onStatusChange={handleAttendanceStatusChange}
                    onSave={handleSaveAttendance}
                    onCancel={() => setAttendanceMode(false)}
                  />
                ) : selectedEvent.status === "upcoming" ? (
                  <UpcomingEventDetail
                    event={selectedEvent}
                    onTakeAttendance={handleEnterAttendanceMode}
                  />
                ) : (
                  <CompletedEventDetail
                    event={selectedEvent}
                    liveAttendance={effectiveAttendance as Record<string, AttendanceStatus>}
                    onStatusChange={handleAttendanceStatusChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default TeamSchedulePage;
