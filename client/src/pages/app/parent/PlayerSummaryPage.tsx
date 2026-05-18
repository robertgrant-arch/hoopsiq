/**
 * PlayerSummaryPage — parent-friendly athlete development summary.
 *
 * Route: /app/parent/player/:playerId/summary
 *
 * Visibility rules (from VisibilityControls):
 *  - showCoachNotes = false (default) → private coach notes are NEVER rendered
 *  - showReadiness  → readiness trend card shown or hidden
 *  - showInjuryStatus → injury badge shown or hidden
 *  - showDevelopmentGoals → goal progress cards shown or hidden
 *  - showAttendance → attendance stat shown or hidden
 *
 * Acceptance criteria enforced here:
 *  ✓ Private coach notes are stripped when showCoachNotes = false
 *  ✓ Parent-visible goals show progress bar + next milestone
 *  ✓ Injury status only visible if showInjuryStatus = true
 */

import React from "react";
import { useParams, Link } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  CheckCircle2,
  Target,
  Calendar,
  ChevronRight,
  Lock,
  AlertTriangle,
  Flame,
  BarChart3,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { mockAttendance } from "@/lib/mock/parent";
import {
  ACTIVE_GUARDIAN,
  GUARDIAN_PLAYER_PROFILES,
  PARENT_GOAL_SUMMARIES,
  getVisibility,
  type ParentGoalSummary,
  type VisibilityControls,
} from "@/lib/mock/guardian";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";
const MUTED = "oklch(0.55 0.02 260)";
const INFO = "oklch(0.65 0.15 230)";

const STATUS_COLORS: Record<ParentGoalSummary["statusColor"], string> = {
  green: SUCCESS,
  yellow: WARNING,
  orange: DANGER,
  purple: ACCENT,
};

const TREND_CONFIG = {
  improving: { Icon: TrendingUp, label: "Improving", color: SUCCESS },
  stable: { Icon: Minus, label: "Stable", color: WARNING },
  declining: { Icon: TrendingDown, label: "Declining", color: DANGER },
  restricted: { Icon: ShieldAlert, label: "Restricted", color: "oklch(0.55 0.15 320)" },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso: string): number {
  const diff = new Date(iso + "T00:00:00").getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlayerHeroCard({
  playerId,
  controls,
}: {
  playerId: string;
  controls: VisibilityControls;
}) {
  const profile = GUARDIAN_PLAYER_PROFILES[playerId];
  if (!profile) return null;

  const trend = TREND_CONFIG[profile.readinessTrend];

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        borderColor: ACCENT.replace(")", " / 0.25)"),
        background: ACCENT.replace(")", " / 0.04)"),
      }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold shrink-0 text-white"
          style={{ background: ACCENT }}
        >
          {profile.initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold leading-tight">{profile.name}</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            #{profile.jerseyNumber} · {profile.position} · {profile.team}
          </p>
          <p className="text-[12px] text-muted-foreground">
            Class of {profile.gradYear} · {profile.coachName}
          </p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.20 50)" }} />
            <span className="text-[18px] font-bold tabular-nums">{profile.streak}</span>
          </div>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
            Day streak
          </p>
        </div>

        {/* Readiness */}
        {controls.showReadiness ? (
          <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <trend.Icon className="w-3.5 h-3.5" style={{ color: trend.color }} />
              <span className="text-[12px] font-semibold" style={{ color: trend.color }}>
                {trend.label}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
              Readiness
            </p>
          </div>
        ) : (
          <LockedCard label="Readiness" />
        )}

        {/* Injury */}
        {controls.showInjuryStatus ? (
          <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              {profile.hasActiveInjuryFlag ? (
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: WARNING }} />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
              )}
              <span
                className="text-[12px] font-semibold"
                style={{ color: profile.hasActiveInjuryFlag ? WARNING : SUCCESS }}
              >
                {profile.hasActiveInjuryFlag ? "Flagged" : "Healthy"}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
              Health
            </p>
          </div>
        ) : (
          <LockedCard label="Health" />
        )}
      </div>

      {/* Injury detail (only if flagged + visible) */}
      {controls.showInjuryStatus && profile.hasActiveInjuryFlag && profile.injuryNote && (
        <div
          className="rounded-xl border px-3 py-2.5 flex items-start gap-2"
          style={{
            borderColor: WARNING.replace(")", " / 0.30)"),
            background: WARNING.replace(")", " / 0.06)"),
          }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: WARNING }} />
          <p className="text-[12.5px] leading-snug">{profile.injuryNote}</p>
        </div>
      )}
    </div>
  );
}

function LockedCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center opacity-50">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Lock className="w-3 h-3" style={{ color: MUTED }} />
      </div>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  );
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  showCoachNotes,
}: {
  goal: ParentGoalSummary;
  showCoachNotes: boolean;
}) {
  const color = STATUS_COLORS[goal.statusColor];
  const days = daysUntil(goal.targetDate);

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{
        borderColor: color.replace(")", " / 0.25)"),
        background: color.replace(")", " / 0.04)"),
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-bold leading-tight">{goal.title}</p>
          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
            {goal.skillArea}
          </p>
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: color.replace(")", " / 0.14)"),
            color,
          }}
        >
          {goal.statusLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: MUTED }}>Progress</span>
          <span className="font-mono font-semibold" style={{ color }}>
            {goal.progressPct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-[oklch(0.20_0.01_260)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${goal.progressPct}%`, background: color }}
          />
        </div>
      </div>

      {/* Target date */}
      <div className="flex items-center gap-2 text-[12px]">
        <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: MUTED }} />
        <span style={{ color: MUTED }}>
          Target:{" "}
          <span className="font-semibold text-foreground">{formatDate(goal.targetDate)}</span>
          {days > 0 && (
            <span style={{ color: days <= 7 ? DANGER : MUTED }}>
              {" "}({days} day{days !== 1 ? "s" : ""})
            </span>
          )}
          {days <= 0 && (
            <span style={{ color: DANGER }}> (deadline passed)</span>
          )}
        </span>
      </div>

      {/* Next milestone */}
      <div
        className="rounded-xl border px-3 py-2.5 space-y-1"
        style={{
          borderColor: ACCENT.replace(")", " / 0.20)"),
          background: ACCENT.replace(")", " / 0.04)"),
        }}
      >
        <p
          className="text-[10px] uppercase tracking-widest font-semibold"
          style={{ color: ACCENT }}
        >
          Next milestone
        </p>
        <p className="text-[12.5px] leading-snug">{goal.nextMilestone}</p>
      </div>

      {/*
        Coach note — only rendered when showCoachNotes = true.
        This is the privacy gate: private notes never appear unless a coach
        explicitly enables visibility for this guardian.
      */}
      {showCoachNotes && goal.privateCoachNote && (
        <div
          className="rounded-xl border px-3 py-2.5 space-y-1"
          style={{
            borderColor: INFO.replace(")", " / 0.25)"),
            background: INFO.replace(")", " / 0.06)"),
          }}
        >
          <p
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: INFO }}
          >
            Coach note
          </p>
          <p className="text-[12.5px] leading-snug">{goal.privateCoachNote}</p>
        </div>
      )}
    </div>
  );
}

// ─── Development section ──────────────────────────────────────────────────────

function DevelopmentSection({
  playerId,
  controls,
}: {
  playerId: string;
  controls: VisibilityControls;
}) {
  if (!controls.showDevelopmentGoals) {
    return (
      <div
        className="rounded-2xl border px-5 py-6 flex flex-col items-center gap-3 text-center"
        style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.11 0.005 260)" }}
      >
        <Lock className="w-6 h-6" style={{ color: MUTED }} />
        <p className="text-[13px] font-semibold">Development goals not visible</p>
        <p className="text-[12px] text-muted-foreground max-w-xs">
          Your program's coaching staff controls what development information
          is shared with guardians. Contact your coach if you have questions.
        </p>
      </div>
    );
  }

  const goals = PARENT_GOAL_SUMMARIES.filter((g) => g.playerId === playerId);

  if (goals.length === 0) {
    return (
      <div
        className="rounded-2xl border px-5 py-6 text-center"
        style={{ borderColor: "oklch(0.22 0.01 260)" }}
      >
        <Target className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">No active development goals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
          Development Goals · {goals.length}
        </p>
        {controls.showCoachNotes && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: INFO.replace(")", " / 0.12)"),
              color: INFO,
            }}
          >
            Coach notes visible
          </span>
        )}
      </div>
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          showCoachNotes={controls.showCoachNotes}
        />
      ))}
    </div>
  );
}

// ─── Attendance section ───────────────────────────────────────────────────────

function AttendanceSection({ controls }: { controls: VisibilityControls }) {
  if (!controls.showAttendance) return null;

  const total = mockAttendance.length;
  const attended = mockAttendance.filter((a) => a.attended).length;
  const excused = mockAttendance.filter((a) => !a.attended && a.excused).length;
  const unexcused = mockAttendance.filter((a) => !a.attended && !a.excused).length;
  const pct = Math.round((attended / total) * 100);

  const barColor =
    pct >= 85 ? SUCCESS : pct >= 70 ? WARNING : DANGER;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
        Attendance
      </p>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: SUCCESS }}>
            {attended}
          </p>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>Attended</p>
        </div>
        <div>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: WARNING }}>
            {excused}
          </p>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>Excused</p>
        </div>
        <div>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: unexcused > 0 ? DANGER : MUTED }}>
            {unexcused}
          </p>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>Unexcused</p>
        </div>
      </div>

      {/* Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: MUTED }}>Attendance rate</span>
          <span className="font-semibold" style={{ color: barColor }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-[oklch(0.20_0.01_260)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Recent records */}
      <div className="space-y-1 pt-1">
        {mockAttendance.slice(0, 5).map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between py-1 border-b border-[oklch(0.18_0.005_260)] last:border-0 text-[12px]"
          >
            <span className="text-muted-foreground">{rec.eventTitle}</span>
            <span
              className="font-semibold"
              style={{
                color: rec.attended ? SUCCESS : rec.excused ? WARNING : DANGER,
              }}
            >
              {rec.attended ? "Present" : rec.excused ? "Excused" : "Absent"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Privacy notice ───────────────────────────────────────────────────────────

function PrivacyNotice({ controls }: { controls: VisibilityControls }) {
  const hidden: string[] = [];
  if (!controls.showCoachNotes) hidden.push("private coach notes");
  if (!controls.showReadiness) hidden.push("readiness data");
  if (!controls.showInjuryStatus) hidden.push("injury details");
  if (!controls.showAssignments) hidden.push("film assignments");
  if (hidden.length === 0) return null;

  return (
    <div
      className="rounded-xl border px-4 py-3 flex items-start gap-2.5"
      style={{
        borderColor: "oklch(0.25 0.02 260)",
        background: "oklch(0.12 0.005 260)",
      }}
    >
      <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: MUTED }} />
      <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
        Some information is not shown in the family view:{" "}
        <span className="text-foreground">{hidden.join(", ")}</span>.
        Contact your coaching staff to request changes.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlayerSummaryPage(): React.ReactElement {
  const params = useParams<{ playerId: string }>();
  const playerId = params.playerId ?? "";
  const guardian = ACTIVE_GUARDIAN;

  const profile = GUARDIAN_PLAYER_PROFILES[playerId];
  const controls = getVisibility(guardian.id, playerId);

  // Access guard: make sure this guardian is allowed to see this player
  const isLinked = guardian.linkedPlayerIds.includes(playerId);

  if (!isLinked || !profile) {
    return (
      <AppShell>
        <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 mx-auto" style={{ color: DANGER }} />
            <p className="text-[15px] font-semibold">Player not found</p>
            <p className="text-[13px] text-muted-foreground">
              You don't have access to this player's profile.
            </p>
            <Link href="/app/parent" asChild>
              <a className="text-[13px] font-semibold" style={{ color: ACCENT }}>
                ← Back to dashboard
              </a>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pb-24 max-w-lg mx-auto pt-4 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
          <Link href="/app/parent" asChild>
            <a className="hover:text-foreground transition-colors">Dashboard</a>
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{profile.name}</span>
        </div>

        <PageHeader
          eyebrow="Family Portal"
          title={`${profile.name.split(" ")[0]}'s Summary`}
          subtitle={`${profile.team} · ${profile.coachName}`}
        />

        {/* Hero card */}
        <PlayerHeroCard playerId={playerId} controls={controls} />

        {/* Development goals */}
        <DevelopmentSection playerId={playerId} controls={controls} />

        {/* Attendance */}
        <AttendanceSection controls={controls} />

        {/* Privacy notice */}
        <PrivacyNotice controls={controls} />

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/app/parent/schedule" asChild>
            <a
              className="flex items-center justify-between rounded-xl border px-4 py-3 hover:border-primary/40 transition-all"
              style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.11 0.005 260)" }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-[13px] font-medium">Schedule</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: MUTED }} />
            </a>
          </Link>
          <Link href="/app/parent/messages" asChild>
            <a
              className="flex items-center justify-between rounded-xl border px-4 py-3 hover:border-primary/40 transition-all"
              style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.11 0.005 260)" }}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
                <span className="text-[13px] font-medium">Messages</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: MUTED }} />
            </a>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
