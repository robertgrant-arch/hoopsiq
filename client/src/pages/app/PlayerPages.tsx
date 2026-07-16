import { Link, useRoute } from "wouter";
import { useState, useEffect } from "react";
import {
  Play,
  Upload,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Circle,
  MessageSquare,
  Film,
  ChevronRight,
  Bell,
  Star,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  todayCheckinDone,
  todayWodRecord,
} from "@/features/readiness/checkin";
import { apiGet } from "@/lib/api/client";
import { useTeamReadinessToday } from "@/lib/api/hooks/useReadiness";
import { useAssignments } from "@/lib/api/hooks/useAssignments";
import { usePlayerFilmInbox } from "@/features/film-room/hooks";
import { isActionable } from "@/features/film-room/types";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { FocusChip, useCurrentFocus } from "@/components/player/FocusChip";
import { useAuth } from "@/lib/auth";
import {
  todaysWod,
  skillTracks,
  achievements,
  athleteUploads,
  notifications,
  type VideoUpload,
} from "@/lib/mock/data";
import { MOCK_HUB_DATA } from "@/features/player-development/mock";
import { SKILLS as SKILL_VELOCITIES } from "@/pages/app/player/SkillVelocityPage";
import { UPCOMING_MILESTONES } from "@/pages/app/player/PlayerMilestonePage";

/* ----------------------------- Shared primitives ----------------------------- */

function ProgressRing({
  percent,
  size = 80,
  stroke = 6,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="oklch(0.28 0.01 260)"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="oklch(0.78 0.17 75)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {label}
      </div>
    </div>
  );
}

/* ─── Today's Work checklist ─────────────────────────────────────────────────
 * Reshape of the old daily status strip + assignments card: the same data
 * sources (readiness check-in, WOD record, film inbox, assignments) rendered
 * as the day's checklist per the development-first reframe (§4.2).
 * ──────────────────────────────────────────────────────────────────────────── */

const SUCCESS_CLR = "oklch(0.75 0.12 140)";
const WARNING_CLR = "oklch(0.78 0.16 75)";
const MUTED_CLR = "oklch(0.55 0.02 260)";

function TodaysWorkChecklist() {
  const { user } = useAuth();
  // Server stores readiness check-ins keyed by the auth userId (see
  // server/modules/readiness/routes.ts POST /). Fall back to the static mock
  // flag until data arrives so the checklist never renders blank.
  const { data: todayCheckins } = useTeamReadinessToday();
  const checkinDone = todayCheckins
    ? todayCheckins.some((c) => c.playerId === user?.id)
    : todayCheckinDone;

  const wodState = todayWodRecord.state;
  const wodDone = wodState === "completed";
  const wodSub = wodDone
    ? `${todayWodRecord.drillsCompleted}/${todayWodRecord.drillsTotal} drills done`
    : wodState === "skipped"
    ? "Skipped — coach notified"
    : wodState === "modified_by_coach"
    ? `Modified by coach · ${todayWodRecord.plannedMinutes} min`
    : `${todayWodRecord.plannedMinutes} min · ${todayWodRecord.drillsTotal} drills`;

  // Film to review — needs-action count from the film-room inbox.
  const { data: filmInbox, isLoading: filmLoading } = usePlayerFilmInbox();
  const filmCount = (filmInbox ?? []).filter((r) => isActionable(r.status)).length;

  // From Coach — open assignments (wired to /api/assignments, mock in demo).
  const { data: myAssignments, isLoading: assignmentsLoading } = useAssignments();
  const openAssignments = (myAssignments ?? []).filter(
    (a) => a.status === "assigned" || a.status === "in_progress" || a.status === "overdue",
  ).length;

  const tasks = [
    {
      id: "checkin",
      label: "Check in",
      sub: checkinDone ? "Submitted today" : "60 seconds — how you're feeling",
      href: "/app/player/checkin",
      done: checkinDone,
      loading: false,
    },
    {
      id: "training",
      label: "Today's Training",
      sub: wodSub,
      href: "/app/player/wod",
      done: wodDone,
      loading: false,
    },
    {
      id: "film",
      label: `Film to review${filmLoading ? "" : ` (${filmCount})`}`,
      sub: filmLoading
        ? "Loading…"
        : filmCount > 0
        ? `${filmCount} clip${filmCount > 1 ? "s" : ""} from coach`
        : "Nothing waiting",
      href: "/app/player/film",
      done: !filmLoading && filmCount === 0,
      loading: filmLoading,
    },
    {
      id: "coach",
      label: "From Coach",
      sub: assignmentsLoading
        ? "Loading…"
        : openAssignments > 0
        ? `${openAssignments} open assignment${openAssignments > 1 ? "s" : ""}`
        : "All caught up",
      href: "/app/player/assignments",
      done: !assignmentsLoading && openAssignments === 0,
      loading: assignmentsLoading,
    },
  ];

  const doneCount = tasks.filter((t) => t.done).length;
  const allDone = doneCount === tasks.length;

  return (
    <div className="rounded-xl border border-border bg-card mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          Today's Work
        </div>
        <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
          {doneCount}/{tasks.length}
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {tasks.map((t) => (
          <Link key={t.id} href={t.href} asChild>
            <a className="flex items-center gap-3 px-4 py-3 min-h-[52px] hover:bg-muted/40 transition">
              {t.done ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: SUCCESS_CLR }} />
              ) : (
                <Circle className="w-5 h-5 shrink-0" style={{ color: t.loading ? MUTED_CLR : WARNING_CLR }} />
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-semibold leading-tight ${t.done ? "text-muted-foreground" : ""}`}>
                  {t.label}
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{t.sub}</div>
              </div>
              {!t.done && (
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: MUTED_CLR }} />
              )}
            </a>
          </Link>
        ))}
      </div>
      {allDone && (
        <div className="px-4 py-3 border-t border-border bg-[oklch(0.75_0.12_140/0.08)] text-[13px] font-semibold" style={{ color: SUCCESS_CLR }}>
          Day complete. {doneCount} for {tasks.length}.
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

export function PlayerDashboard() {
  const { user } = useAuth();
  const unread = notifications.filter((n) => !n.read).length;

  // Current focus — the IDP #1 priority, shared with the FocusChip.
  const focus = useCurrentFocus();
  const topFocusArea = MOCK_HUB_DATA.focusAreas[0];

  // Coach's latest — most recent coach note; falls back to the focus cue.
  const latestFeedback = MOCK_HUB_DATA.recentFeedback[0];

  // Progress strip — focus-area velocity + nearest incomplete milestone.
  const focusVelocity = SKILL_VELOCITIES.find((s) => s.skill === focus.category);
  const nextMilestone = [...UPCOMING_MILESTONES]
    .filter((m) => m.pct < 100)
    .sort((a, b) => b.pct - a.pct)[0];

  // Compact summaries — top skill track by progress (full list at /app/player/skills).
  const topTrack = [...skillTracks].sort((a, b) => b.progress - a.progress)[0];

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Player · Today"
          title={`Let's get it, ${user?.name.split(" ")[0]}.`}
          subtitle="Your daily blueprint is ready. Hit your training, log film, stack reps."
          actions={
            <Link href="/app/messages" asChild>
              <a className="relative inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-[13px] hover:bg-muted transition">
                <Bell className="w-4 h-4" />
                Inbox
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </a>
            </Link>
          }
        />

        {/* ── 1. Focus banner — visually dominant (reframe §4.1) ──────────── */}
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-7 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.14em] font-mono text-primary">
              Today's Focus
            </div>
            <span className="text-lg leading-none">{topFocusArea?.emoji ?? "🎯"}</span>
          </div>
          <h2 className="display text-3xl sm:text-4xl leading-tight mb-3">
            {focus.focusArea}
          </h2>
          {focus.coachCue && (
            <p className="text-[13.5px] text-muted-foreground italic leading-relaxed max-w-2xl">
              “{focus.coachCue}”{" "}
              <span className="not-italic font-medium text-foreground/80">
                — {focus.coachName}
              </span>
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-[12px] text-muted-foreground">
            <span>
              Score{" "}
              <span className="text-amber-500 font-bold">
                {topFocusArea?.currentScore ?? "—"}
              </span>
              {" → "}
              <span className="text-primary font-bold">
                {topFocusArea?.targetScore ?? "—"}
              </span>
              {" / 10"}
            </span>
            <Link href="/app/player/development" asChild>
              <a className="text-[11.5px] text-primary hover:underline flex items-center gap-1">
                View full plan <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </Link>
          </div>
        </div>

        {/* ── 2. Today's work checklist (reframe §4.2) ────────────────────── */}
        <TodaysWorkChecklist />

        {/* ── 3. Coach's latest (reframe §4.3) ────────────────────────────── */}
        <div className="rounded-xl border border-[oklch(0.72_0.18_290)]/30 bg-[oklch(0.72_0.18_290)]/5 p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-mono text-[oklch(0.72_0.18_290)] mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Coach's Latest
          </div>
          <p className="text-[13px] leading-relaxed mb-2">
            “{latestFeedback?.text ?? focus.coachCue}”
          </p>
          <div className="text-[11.5px] text-muted-foreground">
            {latestFeedback?.coachName ?? focus.coachName}
            {latestFeedback?.date && <> · {latestFeedback.date}</>}
            {latestFeedback?.linkedClip && (
              <>
                {" · "}
                <Link href={latestFeedback.linkedClip.href} asChild>
                  <a className="text-primary hover:underline">
                    {latestFeedback.linkedClip.title}
                  </a>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── 4. Progress strip (reframe §4.4) ────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Focus velocity
            </div>
            <div className="display text-xl leading-none" style={{ color: SUCCESS_CLR }}>
              {focusVelocity?.velocityLabel ?? "+0.2/cycle"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 truncate">
              {focus.category || focus.focusArea}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Consistency
            </div>
            <div className="display text-xl leading-none text-[oklch(0.72_0.2_50)]">
              {user?.streak ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 truncate">
              training days in a row
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Next milestone
            </div>
            <div className="display text-xl leading-none text-primary">
              {nextMilestone ? `${nextMilestone.pct}%` : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 truncate">
              {nextMilestone?.title ?? "All caught up"}
            </div>
          </div>
        </div>

        {/* ── 5. Everything else, one tap away — compact link rows ────────── */}
        <div className="grid gap-2 lg:grid-cols-2 lg:gap-3">
          {/* Up next — WOD summary (full plan lives at /app/player/wod) */}
          <Link href="/app/player/wod" asChild>
            <a className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition group">
              <div className="w-9 h-9 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                  Up next
                </div>
                <div className="text-[13px] font-semibold truncate group-hover:text-primary transition">
                  {todaysWod.drills[0]?.name ?? todaysWod.title}
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate">
                  {todaysWod.drills.length} drills · {todaysWod.durationMin} min
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition" />
            </a>
          </Link>

          {/* Recent uploads — one-line summary */}
          <Link href="/app/player/uploads" asChild>
            <a className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition group">
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Film className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                  Recent uploads
                </div>
                <div className="text-[12.5px] truncate">
                  <span className="font-semibold">{athleteUploads.length} recent</span>
                  {athleteUploads[0] && (
                    <span className="text-muted-foreground">
                      {" "}· latest: {athleteUploads[0].title} ({statusMeta(athleteUploads[0].status).label})
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition" />
            </a>
          </Link>

          {/* Skill tracks — top track summary */}
          <Link href="/app/player/skills" asChild>
            <a className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition group">
              <span className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 text-[16px]">
                {topTrack?.icon ?? "🏀"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[12.5px] font-semibold truncate">
                    {topTrack?.name ?? "Skill Tracks"}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    View all →
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[oklch(0.28_0.01_260)] overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${topTrack?.progress ?? 0}%` }}
                  />
                </div>
              </div>
            </a>
          </Link>

          {/* Most recent win — growth story preview */}
          <Link href="/app/player/growth-story" asChild>
            <a className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/50 transition group">
              <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" style={{ color: "oklch(0.72 0.18 290)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                  Recent win
                </div>
                <div className="text-[12.5px] truncate">
                  <span className="font-semibold">Ball Handling</span>
                  <span className="font-mono font-bold" style={{ color: "oklch(0.72 0.18 290)" }}>
                    {" "}+1.4
                  </span>
                  <span className="text-muted-foreground"> · last 30 days</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  See all wins →
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-primary transition" />
            </a>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Upload Row ----------------------------- */

function statusMeta(s: VideoUpload["status"]) {
  switch (s) {
    case "PROCESSING":
      return { label: "Processing…", color: "text-muted-foreground", bg: "bg-muted" };
    case "READY":
      return { label: "AI Feedback Ready", color: "text-primary", bg: "bg-primary/15" };
    case "LOW_CONFIDENCE":
      return { label: "Low Confidence · Coach Review", color: "text-[oklch(0.75_0.15_60)]", bg: "bg-[oklch(0.35_0.08_60)]" };
    case "COACH_REVIEWED":
      return { label: "Coach Reviewed", color: "text-[oklch(0.75_0.15_145)]", bg: "bg-[oklch(0.3_0.08_145)]" };
  }
}

function UploadRow({ upload }: { upload: VideoUpload }) {
  const s = statusMeta(upload.status);
  return (
    <Link href={`/app/player/uploads/${upload.id}`} asChild>
      <a className="flex items-center gap-4 rounded-lg border border-border p-3 hover:border-primary/50 transition group">
        <div className="w-20 h-12 rounded bg-gradient-to-br from-[oklch(0.25_0.01_260)] to-[oklch(0.17_0.01_260)] flex items-center justify-center shrink-0">
          <Play className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13.5px] font-medium truncate group-hover:text-primary transition">
              {upload.title}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono shrink-0">
              {upload.duration}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
            <span className={`px-2 py-0.5 rounded-full ${s.bg} ${s.color} font-medium max-w-full truncate`}>
              {s.label}
            </span>
            <span className="text-muted-foreground whitespace-nowrap">{upload.uploadedAt}</span>
            {upload.issues.length > 0 && (
              <span className="text-muted-foreground whitespace-nowrap">
                · {upload.issues.length} observations
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition" />
      </a>
    </Link>
  );
}

/* ----------------------------- Workout drill card ----------------------------- */

function WorkoutDrillCard({
  drill,
  index,
  isDone,
  onToggle,
}: {
  drill: import("@/lib/mock/data").Drill;
  index: number;
  isDone: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasCues = drill.cues && drill.cues.length > 0;
  const hasDesc = !!drill.description;
  const isExpandable = hasDesc || hasCues;

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isDone
          ? "border-primary/40 bg-primary/5"
          : "border-border"
      }`}
    >
      {/* ── Primary row ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Sequence number */}
        <span className="font-mono text-[12px] text-muted-foreground w-5 shrink-0 text-right">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Check toggle */}
        <button
          onClick={onToggle}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
          className="shrink-0 transition-transform active:scale-90"
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className={`text-[14px] font-semibold leading-tight ${isDone ? "text-muted-foreground line-through" : ""}`}>
            {drill.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-muted-foreground">
            <span>{drill.sets} sets × {drill.reps}</span>
            <span>·</span>
            <span>~{drill.duration} min</span>
            {drill.skillFocus && (
              <>
                <span>·</span>
                <span className="text-primary/70 font-medium truncate">{drill.skillFocus}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand toggle — only if there's something to show */}
        {isExpandable && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Hide drill details" : "Show drill details"}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>

      {/* ── Expanded detail panel ── */}
      {isExpandable && expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-3">
          {hasDesc && (
            <p className="text-[12.5px] text-foreground/80 leading-relaxed">
              {drill.description}
            </p>
          )}
          {hasCues && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground mb-1.5">
                Key Cues
              </div>
              <ul className="space-y-1">
                {drill.cues!.map((cue, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
                    {cue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Workout ----------------------------- */

export function PlayerWorkout() {
  const [completed, setCompleted] = useState<string[]>([]);
  const toggle = (id: string) =>
    setCompleted((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const done = completed.length;
  const total = todaysWod.drills.length;
  const percent = (done / total) * 100;

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[900px] mx-auto">
        <PageHeader
          eyebrow={`Today's Training · WOD · ${todaysWod.category}`}
          title={todaysWod.title}
          subtitle={todaysWod.description}
          actions={<FocusChip />}
        />

        <div className="flex items-center gap-6 mb-8">
          <ProgressRing
            percent={percent}
            size={80}
            label={
              <div>
                <div className="display text-xl">{done}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                  of {total}
                </div>
              </div>
            }
          />
          <div>
            <div className="display text-2xl mb-1">
              {done === total ? "🔥 Session crushed." : `${total - done} drills to go`}
            </div>
            <div className="text-[13px] text-muted-foreground">
              {todaysWod.durationMin} min · +{todaysWod.xp} XP on completion
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {todaysWod.drills.map((d, i) => (
            <WorkoutDrillCard
              key={d.id}
              drill={d}
              index={i}
              isDone={completed.includes(d.id)}
              onToggle={() => toggle(d.id)}
            />
          ))}
        </div>

        {done === total && (
          <div className="mt-8 rounded-xl border border-primary/40 bg-primary/10 p-6 text-center">
            <div className="display text-2xl mb-2 text-primary">🔥 Session Complete</div>
            <p className="text-[13.5px] text-muted-foreground mb-4">
              +{todaysWod.xp} XP earned. Another training day in a row banked. Don't stop.
            </p>
            <Link href="/app/player" asChild>
              <a className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                Back to dashboard
              </a>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ----------------------------- Pending re-upload requests ----------------------------- */

interface ReuploadRequest {
  id: string;
  issueCategory?: string;
  coachNote?: string;
  sessionId?: string;
  createdAt: string;
}

function PendingReuploadBanner({ requests }: { requests: ReuploadRequest[] }) {
  if (requests.length === 0) return null;
  return (
    <div className="mb-6 rounded-xl border border-violet-500/30 bg-violet-500/8 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-violet-500 shrink-0" />
        <span className="text-[13px] font-semibold text-violet-500">
          {requests.length} pending re-upload request{requests.length > 1 ? "s" : ""} from your coach
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-violet-500/20 bg-card p-3"
          >
            <div className="flex flex-col gap-1 min-w-0">
              {r.issueCategory && (
                <span className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-violet-500">
                  {r.issueCategory}
                </span>
              )}
              {r.coachNote && (
                <p className="text-[12.5px] text-muted-foreground leading-snug">
                  {r.coachNote}
                </p>
              )}
            </div>
            <Link href={`/app/player/uploads?resolves=${r.id}`} asChild>
              <a className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-violet-500 text-white text-[11.5px] font-semibold hover:bg-violet-600 transition">
                <RotateCcw className="w-3 h-3" /> Record & Upload
              </a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Uploads list ----------------------------- */

export function PlayerUploads() {
  const [pendingReuploads, setPendingReuploads] = useState<ReuploadRequest[]>([]);

  useEffect(() => {
    apiGet<ReuploadRequest[]>("/coaching-actions/player/me?actionType=request_reupload&status=open")
      .then((rows) => { if (Array.isArray(rows)) setPendingReuploads(rows); })
      .catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Film · Personal uploads"
          title="My Uploads"
          subtitle="Submit video. AI reviews. Coach confirms. Stack the reps."
          actions={
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
              <Upload className="w-4 h-4" /> New upload
            </button>
          }
        />
        <PendingReuploadBanner requests={pendingReuploads} />
        <div className="space-y-2">
          {athleteUploads.map((v) => (
            <UploadRow key={v.id} upload={v} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Upload detail ----------------------------- */

export function PlayerUploadDetail() {
  const [, params] = useRoute("/app/player/uploads/:id");
  const upload = athleteUploads.find((u) => u.id === params?.id);

  if (!upload) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8">
          <h1 className="display text-3xl">Upload not found</h1>
        </div>
      </AppShell>
    );
  }

  const s = statusMeta(upload.status);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-4">
          <Link href="/app/player/uploads" asChild>
            <a className="hover:text-foreground">Uploads</a>
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{upload.title}</span>
        </div>

        <h1 className="display text-3xl mb-2">{upload.title}</h1>
        <div className="flex items-center gap-3 mb-6 text-[12.5px]">
          <span className={`px-2 py-0.5 rounded-full ${s.bg} ${s.color} font-medium`}>
            {s.label}
          </span>
          <span className="text-muted-foreground">
            {upload.duration} · uploaded {upload.uploadedAt}
          </span>
          <span className="text-muted-foreground">
            · AI confidence {(upload.aiConfidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video pane */}
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-xl border border-border bg-gradient-to-br from-[oklch(0.2_0.01_260)] to-[oklch(0.12_0.01_260)] flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background:
                    "radial-gradient(circle at 30% 50%, oklch(0.7 0.2 75 / 0.3), transparent 50%)",
                }}
              />
              <button className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition">
                <Play className="w-6 h-6 ml-1" />
              </button>
              {/* Fake timeline */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                <span>0:00</span>
                <div className="flex-1 h-1 rounded-full bg-white/10 relative">
                  {upload.issues.map((iss, idx) => {
                    const pos = parseFloat(iss.timestamp.split(":")[1]) / 120;
                    return (
                      <div
                        key={idx}
                        className="absolute w-2 h-2 -top-0.5 rounded-full"
                        style={{
                          left: `${pos * 100}%`,
                          background:
                            iss.severity === "major"
                              ? "oklch(0.7 0.2 30)"
                              : "oklch(0.78 0.17 75)",
                        }}
                        title={`${iss.timestamp} · ${iss.category}`}
                      />
                    );
                  })}
                </div>
                <span>{upload.duration}</span>
              </div>
            </div>

            {/* AI observations */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="display text-lg">AI observations</h2>
                <span className="text-[11px] font-mono text-muted-foreground">
                  · model v2.1 · {(upload.aiConfidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <div className="space-y-2">
                {upload.issues.map((iss, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-card p-4 flex gap-4"
                  >
                    <div className="font-mono text-[13px] text-primary shrink-0 w-10 pt-0.5">
                      {iss.timestamp}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] uppercase tracking-[0.1em] font-mono text-muted-foreground">
                          {iss.category}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            iss.severity === "major"
                              ? "bg-[oklch(0.3_0.1_30)] text-[oklch(0.8_0.15_30)]"
                              : "bg-[oklch(0.3_0.08_60)] text-[oklch(0.82_0.12_60)]"
                          }`}
                        >
                          {iss.severity}
                        </span>
                      </div>
                      <p className="text-[13px]">{iss.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 italic">
                AI observations are probabilistic — not a verdict. Your coach's review is canonical.
              </p>
            </div>
          </div>

          {/* Coach review sidebar */}
          <div>
            {upload.coachReview ? (
              <div className="rounded-xl border border-[oklch(0.72_0.18_290)]/40 bg-[oklch(0.72_0.18_290)]/5 p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-mono text-[oklch(0.72_0.18_290)] mb-3">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Coach Reviewed
                </div>
                <div className="text-[14px] font-semibold mb-2">
                  {upload.coachReview.coachName}
                </div>
                <p className="text-[13px] text-muted-foreground mb-4 italic leading-relaxed">
                  "{upload.coachReview.verdict}"
                </p>
                <div className="space-y-3 text-[12.5px]">
                  {upload.coachReview.comments.map((c, i) => (
                    <div key={i} className="border-l-2 border-[oklch(0.72_0.18_290)] pl-3">
                      <div className="font-mono text-[11px] text-[oklch(0.72_0.18_290)] mb-0.5">
                        @ {c.t}
                      </div>
                      <p>{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  Awaiting Coach
                </div>
                <p className="text-[13px] text-muted-foreground">
                  AI has flagged this for Coach Reed's review. Typical turnaround: 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Skill Tracks ----------------------------- */

export function PlayerSkills() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Progression · Skill Tracks"
          title="Your five pillars"
          subtitle="Every training session contributes XP to one or more tracks. Level up each skill independently."
          actions={<FocusChip />}
        />
        <div className="grid md:grid-cols-2 gap-4">
          {skillTracks.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-3xl mb-1">{t.icon}</div>
                  <h3 className="display text-xl">{t.name}</h3>
                </div>
                <div className="text-right">
                  <div className="display text-3xl text-primary">L{t.level}</div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    {t.progress}% to L{t.level + 1}
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[oklch(0.28_0.01_260)] overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Achievements ----------------------------- */

export function PlayerAchievements() {
  const tierColor = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "from-[oklch(0.55_0.14_50)] to-[oklch(0.4_0.1_50)]";
      case "silver":
        return "from-[oklch(0.75_0.01_260)] to-[oklch(0.55_0.01_260)]";
      case "gold":
        return "from-[oklch(0.78_0.17_75)] to-[oklch(0.6_0.15_75)]";
      case "platinum":
        return "from-[oklch(0.85_0.08_220)] to-[oklch(0.65_0.08_220)]";
      default:
        return "from-muted to-muted";
    }
  };

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Progression · Achievements"
          title="The vault"
          subtitle="Milestones you've unlocked — and the ones still out there."
        />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-5 ${
                a.unlocked ? "border-primary/30" : "border-border opacity-50"
              } bg-card`}
            >
              <div
                className={`w-14 h-14 rounded-lg bg-gradient-to-br ${tierColor(a.tier)} flex items-center justify-center mb-4`}
              >
                {a.unlocked ? (
                  <Trophy className="w-6 h-6 text-background" />
                ) : (
                  <Star className="w-6 h-6 text-background/50" />
                )}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
                {a.tier}
              </div>
              <div className="display text-[17px] mb-1.5">{a.name}</div>
              <p className="text-[12.5px] text-muted-foreground mb-3">
                {a.description}
              </p>
              {a.unlocked ? (
                <div className="text-[11px] text-primary font-mono">
                  Unlocked · {a.unlockedAt}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground font-mono">Locked</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Messages (shared) ----------------------------- */

export function Messages() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1100px] mx-auto">
        <PageHeader
          eyebrow="Communication"
          title="Messages & Notifications"
          subtitle="Coach DMs, team broadcasts, system alerts."
        />
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link key={n.id} href={n.href} asChild>
              <a
                className={`flex items-start gap-4 rounded-lg border p-4 transition ${
                  n.read
                    ? "border-border bg-card"
                    : "border-primary/40 bg-primary/5"
                }`}
              >
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
                {n.read && <div className="w-2 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                      {n.type}
                    </span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">
                      {n.createdAt}
                    </span>
                  </div>
                  <div className="text-[13.5px] font-medium">{n.title}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">
                    {n.detail}
                  </div>
                </div>
                <Film className="w-4 h-4 text-muted-foreground mt-1" />
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
