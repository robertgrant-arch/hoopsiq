/**
 * ProgramOpsHub — /app/coach/program
 *
 * Multi-program hub for coaches who manage multiple teams.
 * The program switcher changes all dashboard data for the selected program.
 *
 * Acceptance criterion:
 *  Given a coach belongs to multiple teams, when they use the program
 *  switcher, then dashboard data changes to the selected team.
 */

import React, { useState } from "react";
import { Link } from "wouter";
import {
  Users,
  Calendar,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Upload,
  Megaphone,
  Shield,
  Zap,
  BarChart2,
  Star,
  ArrowRight,
  Circle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  PROGRAMS,
  PROGRAM_LEVEL_LABEL,
  PROGRAM_LEVEL_AGE,
  ANNOUNCEMENTS,
  PROGRAM_EVENTS,
  buildRecipientList,
  getProgramById,
  type Program,
  type ProgramLevel,
} from "@/lib/mock/program-ops";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT  = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

const LEVEL_HUE: Record<ProgramLevel, number> = {
  varsity:    220,
  jv:         290,
  freshman:   150,
  aau_17u:    25,
  aau_15u:    75,
  aau_13u:    200,
};

function levelColor(level: ProgramLevel) {
  const h = LEVEL_HUE[level] ?? 220;
  return {
    accent:  `oklch(0.72 0.18 ${h})`,
    bg:      `oklch(0.14 0.02 ${h})`,
    border:  `oklch(0.72 0.18 ${h} / 0.25)`,
    pill:    `oklch(0.72 0.18 ${h} / 0.12)`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paymentHealthColor(v: number): string {
  if (v >= 0.90) return SUCCESS;
  if (v >= 0.75) return WARNING;
  return DANGER;
}

function availabilityCount(program: Program) {
  const avail  = program.roster.filter((p) => p.availability === "available").length;
  const total  = program.roster.length;
  const injured = program.roster.filter((p) => p.availability === "unavailable").length;
  return { avail, total, injured };
}

// ─── Program switcher tab ──────────────────────────────────────────────────────

function ProgramTab({
  program,
  active,
  onClick,
}: {
  program: Program;
  active: boolean;
  onClick: () => void;
}) {
  const c = levelColor(program.level);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border transition-all text-left shrink-0"
      style={
        active
          ? { borderColor: c.border, background: c.bg, boxShadow: `0 0 0 1px ${c.border}` }
          : { borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.12 0.005 260)" }
      }
    >
      <span
        className="text-[12px] font-bold"
        style={{ color: active ? c.accent : "inherit" }}
      >
        {PROGRAM_LEVEL_LABEL[program.level]}
      </span>
      <span className="text-[10px]" style={{ color: MUTED }}>
        {program.rosterCount} players
      </span>
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-mono" style={{ color: MUTED }}>
        {icon}
        {label}
      </div>
      <p className="text-[24px] font-bold tabular-nums leading-none" style={{ color: color ?? "inherit" }}>
        {value}
      </p>
      {sub && <p className="text-[11px]" style={{ color: MUTED }}>{sub}</p>}
    </div>
  );
}

// ─── Roster quick table ────────────────────────────────────────────────────────

function RosterStrip({ program }: { program: Program }) {
  const avail = program.roster.filter((p) => p.availability === "available");
  const limited = program.roster.filter((p) => p.availability === "limited");
  const unavail = program.roster.filter((p) => p.availability === "unavailable");

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: MUTED }} />
          <span className="text-[12px] font-semibold">Roster</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "oklch(0.20 0.01 260)", color: MUTED }}
          >
            {program.rosterCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span style={{ color: SUCCESS }}>{avail.length} available</span>
          {limited.length > 0 && <span style={{ color: WARNING }}>{limited.length} limited</span>}
          {unavail.length > 0 && <span style={{ color: DANGER }}>{unavail.length} out</span>}
        </div>
      </div>
      <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
        {program.roster.map((p) => (
          <div
            key={p.playerId}
            className="flex items-center gap-2.5 text-[12px] py-1 rounded-lg px-2 hover:bg-muted/20 transition-colors"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: ACCENT.replace(")", " / 0.12)"), color: ACCENT }}
            >
              {p.initials}
            </div>
            <span className="flex-1 font-medium truncate">{p.playerName}</span>
            <span style={{ color: MUTED }} className="shrink-0">#{p.jerseyNumber}</span>
            <span className="text-[10px] shrink-0" style={{ color: MUTED }}>{p.position}</span>
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background:
                  p.availability === "available" ? SUCCESS
                  : p.availability === "limited" ? WARNING
                  : DANGER,
              }}
            />
            {p.paymentStatus === "overdue" && (
              <DollarSign className="w-3 h-3 shrink-0" style={{ color: DANGER }} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1 border-t border-border">
        <Link href="/app/coach/program/roster-import" asChild>
          <a
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            <Upload className="w-3 h-3" />
            Import players
          </a>
        </Link>
        <Link href="/app/team/roster-detail" asChild>
          <a
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
          >
            View roster
            <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      </div>
    </div>
  );
}

// ─── Upcoming events strip ────────────────────────────────────────────────────

function EventsStrip({ programId }: { programId: string }) {
  const events = PROGRAM_EVENTS.filter((e) => e.programId === programId).slice(0, 4);

  const typeIcon: Record<string, React.ReactNode> = {
    practice:   <Zap className="w-3 h-3" />,
    game:       <Trophy className="w-3 h-3" />,
    tournament: <Star className="w-3 h-3" />,
    travel:     <ArrowRight className="w-3 h-3" />,
    meeting:    <Users className="w-3 h-3" />,
    optional:   <Circle className="w-3 h-3" />,
  };
  const typeColor: Record<string, string> = {
    practice:   ACCENT,
    game:       WARNING,
    tournament: SUCCESS,
    travel:     MUTED,
    meeting:    "oklch(0.65 0.15 230)",
    optional:   MUTED,
  };

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
        <p className="text-[12px]" style={{ color: MUTED }}>No upcoming events for this program.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: MUTED }} />
          <span className="text-[12px] font-semibold">Upcoming Events</span>
        </div>
        <Link href="/app/team/schedule" asChild>
          <a className="text-[11px]" style={{ color: ACCENT }}>View all</a>
        </Link>
      </div>
      <div className="space-y-2">
        {events.map((evt) => {
          const confirmed = Object.values(evt.rsvps).filter((r) => r === "yes").length;
          const total = Object.keys(evt.rsvps).length;
          const color = typeColor[evt.type] ?? MUTED;
          return (
            <div
              key={evt.id}
              className="flex items-start gap-3 rounded-lg border px-3 py-2.5"
              style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.12 0.005 260)" }}
            >
              <span className="mt-0.5 shrink-0" style={{ color }}>{typeIcon[evt.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold">{evt.title}</p>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
                  <Clock className="w-3 h-3" />
                  <span>{evt.date}{evt.time ? ` · ${evt.time}` : ""}</span>
                </div>
              </div>
              {total > 0 && (
                <span className="text-[10px] shrink-0" style={{ color: confirmed >= total * 0.8 ? SUCCESS : WARNING }}>
                  {confirmed}/{total}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick-action panel ────────────────────────────────────────────────────────

function QuickActions({ program }: { program: Program }) {
  const c = levelColor(program.level);
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <p className="text-[12px] font-semibold mb-3">Quick actions</p>
      {[
        {
          label: "Broadcast announcement",
          icon: <Megaphone className="w-4 h-4" />,
          href:  "/app/coach/program/broadcast",
          color: ACCENT,
        },
        {
          label: "Import roster",
          icon: <Upload className="w-4 h-4" />,
          href:  "/app/coach/program/roster-import",
          color: SUCCESS,
        },
        {
          label: "Team schedule",
          icon: <Calendar className="w-4 h-4" />,
          href:  "/app/team/schedule",
          color: WARNING,
        },
        {
          label: "Staff directory",
          icon: <Shield className="w-4 h-4" />,
          href:  "/app/team/staff",
          color: MUTED,
        },
        {
          label: "Season management",
          icon: <BarChart2 className="w-4 h-4" />,
          href:  "/app/admin/seasons",
          color: MUTED,
        },
      ].map((a) => (
        <Link key={a.label} href={a.href} asChild>
          <a
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:bg-muted/20 transition-colors text-[12px] font-medium"
          >
            <span style={{ color: a.color }}>{a.icon}</span>
            {a.label}
            <ArrowRight className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: MUTED }} />
          </a>
        </Link>
      ))}
    </div>
  );
}

// ─── Recent broadcasts ────────────────────────────────────────────────────────

function RecentBroadcasts({ programId }: { programId: string }) {
  const anns = ANNOUNCEMENTS.filter((a) => a.programId === programId).slice(0, 3);
  if (anns.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4" style={{ color: MUTED }} />
          <span className="text-[12px] font-semibold">Recent Broadcasts</span>
        </div>
        <Link href="/app/coach/program/broadcast" asChild>
          <a className="text-[11px]" style={{ color: ACCENT }}>Compose</a>
        </Link>
      </div>
      {anns.map((a) => {
        const readPct = a.recipientCount > 0 ? Math.round((a.readCount / a.recipientCount) * 100) : 0;
        return (
          <div key={a.id} className="space-y-1 border-b border-border last:border-0 pb-2 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-medium line-clamp-1">{a.title}</p>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={
                  a.status === "sent"
                    ? { background: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS }
                    : { background: MUTED.replace(")", " / 0.12)"), color: MUTED }
                }
              >
                {a.status === "sent" ? "Sent" : "Draft"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: MUTED }}>
              <span className="capitalize">{a.targetRole.replace("_", " ")}</span>
              {a.status === "sent" && (
                <span>{readPct}% read · {a.recipientCount} recipients</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProgramOpsHub(): React.ReactElement {
  // Default to first program the coach is assigned to
  const [activeProgramId, setActiveProgramId] = useState(PROGRAMS[0].id);

  const program = getProgramById(activeProgramId) ?? PROGRAMS[0];
  const c = levelColor(program.level);
  const { avail, total, injured } = availabilityCount(program);

  const overdue = program.roster.filter((p) => p.paymentStatus === "overdue").length;
  const pendingRsvp = PROGRAM_EVENTS
    .filter((e) => e.programId === activeProgramId)
    .reduce((sum, e) => sum + Object.values(e.rsvps).filter((r) => r === "pending").length, 0);

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-5xl mx-auto pt-4 space-y-5">
        <PageHeader
          eyebrow="Coach · Program Operations"
          title="Program Hub"
          subtitle="Manage rosters, schedules, announcements, and operations across all your teams."
        />

        {/* ── Program switcher ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-[0.10em]" style={{ color: MUTED }}>
            Select program
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PROGRAMS.map((p) => (
              <ProgramTab
                key={p.id}
                program={p}
                active={p.id === activeProgramId}
                onClick={() => setActiveProgramId(p.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Selected program header ────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5 relative overflow-hidden"
          style={{ borderColor: c.border, background: c.bg }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse at top left, oklch(0.35 0.12 ${LEVEL_HUE[program.level]} / 0.12) 0%, transparent 60%)`,
          }} />
          <div className="relative flex items-start gap-4 flex-wrap">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-[14px] font-black border-2 shrink-0"
              style={{ color: c.accent, background: c.pill, borderColor: c.border }}
            >
              {PROGRAM_LEVEL_LABEL[program.level].slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="text-[20px] font-bold leading-tight">{program.name}</h2>
              <div className="flex items-center gap-3 text-[12px] flex-wrap" style={{ color: MUTED }}>
                <span>{program.season}</span>
                <span>·</span>
                <span>{PROGRAM_LEVEL_AGE[program.level]}</span>
                <span>·</span>
                <span
                  className="font-bold"
                  style={{ color: program.record.wins > program.record.losses ? SUCCESS : DANGER }}
                >
                  {program.record.wins}–{program.record.losses}
                </span>
              </div>
            </div>
            {program.pendingAlerts > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold shrink-0"
                style={{ borderColor: WARNING.replace(")", " / 0.30)"), background: WARNING.replace(")", " / 0.07)"), color: WARNING }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {program.pendingAlerts} alerts
              </div>
            )}
          </div>

          {/* Next game + practice */}
          <div className="relative mt-4 grid sm:grid-cols-2 gap-3">
            {program.nextGame && (
              <div
                className="rounded-xl border px-4 py-3 space-y-1"
                style={{ borderColor: WARNING.replace(")", " / 0.25)"), background: WARNING.replace(")", " / 0.05)") }}
              >
                <p className="text-[10px] uppercase tracking-wide font-mono" style={{ color: WARNING }}>
                  <Trophy className="inline w-3 h-3 mr-1" />Next game
                </p>
                <p className="text-[13px] font-bold">vs. {program.nextGame.opponent}</p>
                <p className="text-[11.5px]" style={{ color: MUTED }}>
                  {program.nextGame.date} · {program.nextGame.time}
                </p>
                <p className="text-[11px]" style={{ color: MUTED }}>{program.nextGame.location}</p>
              </div>
            )}
            {program.nextPractice && (
              <div
                className="rounded-xl border px-4 py-3 space-y-1"
                style={{ borderColor: ACCENT.replace(")", " / 0.20)"), background: ACCENT.replace(")", " / 0.04)") }}
              >
                <p className="text-[10px] uppercase tracking-wide font-mono" style={{ color: ACCENT }}>
                  <Zap className="inline w-3 h-3 mr-1" />Next practice
                </p>
                <p className="text-[13px] font-bold">Practice</p>
                <p className="text-[11.5px]" style={{ color: MUTED }}>{program.nextPractice.date} · {program.nextPractice.time}</p>
                <p className="text-[11px]" style={{ color: MUTED }}>{program.nextPractice.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stat bar ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Roster"
            value={program.rosterCount}
            sub={`${avail} available · ${injured} out`}
            icon={<Users className="w-3 h-3" />}
          />
          <StatCard
            label="Payment health"
            value={`${Math.round(program.paymentHealth * 100)}%`}
            sub={overdue > 0 ? `${overdue} overdue` : "All current"}
            color={paymentHealthColor(program.paymentHealth)}
            icon={<DollarSign className="w-3 h-3" />}
          />
          <StatCard
            label="Attendance"
            value={`${Math.round(program.attendanceRate * 100)}%`}
            sub="Season avg"
            color={program.attendanceRate >= 0.85 ? SUCCESS : WARNING}
            icon={<CheckCircle2 className="w-3 h-3" />}
          />
          <StatCard
            label="RSVP pending"
            value={pendingRsvp}
            sub="Across upcoming events"
            color={pendingRsvp > 0 ? WARNING : SUCCESS}
            icon={<Clock className="w-3 h-3" />}
          />
        </div>

        {/* ── Main 2-col layout ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          {/* Left */}
          <div className="space-y-5">
            <RosterStrip program={program} />
            <EventsStrip programId={activeProgramId} />
            <RecentBroadcasts programId={activeProgramId} />
          </div>

          {/* Right */}
          <div className="space-y-4">
            <QuickActions program={program} />

            {/* All programs overview */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-[12px] font-semibold">All Programs</p>
              {PROGRAMS.map((p) => {
                const lc = levelColor(p.level);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProgramId(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all hover:brightness-110"
                    style={
                      p.id === activeProgramId
                        ? { borderColor: lc.border, background: lc.bg }
                        : { borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.12 0.005 260)" }
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                      style={{ background: lc.pill, color: lc.accent }}
                    >
                      {PROGRAM_LEVEL_LABEL[p.level].slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold">{p.name}</p>
                      <p className="text-[10px]" style={{ color: MUTED }}>
                        {p.rosterCount} players · {p.record.wins}–{p.record.losses}
                      </p>
                    </div>
                    {p.pendingAlerts > 0 && (
                      <span
                        className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: DANGER.replace(")", " / 0.15)"), color: DANGER }}
                      >
                        {p.pendingAlerts}
                      </span>
                    )}
                    {p.id === activeProgramId && (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: lc.accent }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
