/**
 * PlayerIDPPage — Player Development Graph
 * Route: /app/coach/players/:id/idp
 *
 * Accessed from CoachDashboard "Development Gaps" section.
 */
import React, { useMemo } from "react";
import { useParams, Link } from "wouter";
import {
  Film,
  Dumbbell,
  Calendar,
  Activity,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import {
  DEVELOPMENT_PROFILES,
  DEVELOPMENT_GOALS,
  DEVELOPMENT_EVIDENCE,
  SKILL_AREAS,
  DRILL_PRESCRIPTIONS,
  type DevelopmentProfile,
  type DevelopmentGoal,
  type DevelopmentEvidence,
  type DrillPrescription,
  type SkillArea,
} from "@/features/player-development/mock";
import {
  computeGoalProgress,
  isPlayerStale,
  goalRisk,
  daysSinceActivity,
  daysUntilDeadline,
  groupEvidenceByWeek,
  weekLabel,
  computeRecommendation,
} from "@/lib/idp-selectors";

/* -------------------------------------------------------------------------- */
/* Color constants                                                             */
/* -------------------------------------------------------------------------- */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED    = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const DEMO_TODAY = "2026-05-17";

function relativeDate(dateStr: string): string {
  if (!dateStr) return "—";
  const todayMs = new Date(DEMO_TODAY).getTime();
  const dateMs  = new Date(dateStr).getTime();
  const days    = Math.round((todayMs - dateMs) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30)  return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

function shortGoalTitle(title: string): string {
  const words = title.split(" ");
  return words.length > 4 ? words.slice(0, 4).join(" ") + "…" : title;
}

function skillColor(category: SkillArea["category"]): string {
  if (category === "offense")  return PRIMARY;
  if (category === "defense")  return DANGER;
  return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function StatusChip({ status }: { status: DevelopmentProfile["status"] }): React.ReactElement {
  const map: Record<DevelopmentProfile["status"], { label: string; color: string }> = {
    thriving:             { label: "Thriving",           color: SUCCESS  },
    stale:                { label: "Stale",              color: WARNING  },
    restricted:           { label: "Restricted",         color: DANGER   },
    "missing-data":       { label: "Missing Data",       color: MUTED    },
    "deadline-approaching": { label: "Deadline Soon",    color: WARNING  },
  };
  const { label, color } = map[status];
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color} / 0.12`.replace("/ 0.12", ""), color, opacity: 1,
               backgroundColor: color.replace(")", " / 0.12)").replace("oklch(", "oklch(") }}
    >
      {label}
    </span>
  );
}

function VdvBadge({ status }: { status: DevelopmentProfile["vdvStatus"] }): React.ReactElement {
  const map: Record<DevelopmentProfile["vdvStatus"], { label: string; color: string }> = {
    verified:    { label: "VDV Verified",    color: SUCCESS },
    "in-progress": { label: "VDV In Progress", color: WARNING },
    "not-started": { label: "VDV Not Started", color: MUTED  },
  };
  const { label, color } = map[status];
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
      style={{ borderColor: `${color}40`, color }}
    >
      {label}
    </span>
  );
}

function ProgressBar({ pct, color = PRIMARY }: { pct: number; color?: string }): React.ReactElement {
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "oklch(0.55 0.02 260 / 0.12)" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

function RiskBadge({ risk }: { risk: ReturnType<typeof goalRisk> }): React.ReactElement {
  const map = {
    "on-track": { label: "On Track", color: SUCCESS },
    "at-risk":  { label: "At Risk",  color: WARNING },
    overdue:    { label: "Overdue",  color: DANGER  },
  };
  const { label, color } = map[risk];
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: `${color}1a`, color }}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Skill Development SVG Chart                                                */
/* -------------------------------------------------------------------------- */

function SkillChart({ goals }: { goals: DevelopmentGoal[] }): React.ReactElement {
  const ROW_H    = 44;
  const LABEL_W  = 148;
  const SCORE_W  = 52;
  const PAD_L    = 8;
  const PAD_R    = 8;
  const BAR_H    = 14;
  const totalH   = SKILL_AREAS.length * ROW_H + 24;
  const viewW    = 700;
  const barW     = viewW - LABEL_W - SCORE_W - PAD_L - PAD_R;

  return (
    <div className="px-4 pb-4 pt-2">
      <svg
        viewBox={`0 0 ${viewW} ${totalH}`}
        className="w-full"
        aria-label="Skill development chart"
        role="img"
      >
        {SKILL_AREAS.map((sa, i) => {
          const y     = i * ROW_H + 12;
          const color = skillColor(sa.category);

          const match = goals.find(
            (g) => g.skillAreaId === sa.id && (g.status === "active" || g.status === "paused"),
          );

          const barY  = y + (ROW_H - BAR_H) / 2 - 4;

          if (!match) {
            return (
              <g key={sa.id}>
                <text x={PAD_L} y={y + ROW_H / 2 - 2} fontSize={11} fill={MUTED} dominantBaseline="middle">
                  {sa.name}
                </text>
                <rect
                  x={LABEL_W} y={barY} width={barW} height={BAR_H}
                  rx={3} fill="none" stroke={MUTED} strokeWidth={1} strokeDasharray="4 3"
                />
                <text x={LABEL_W + barW / 2} y={barY + BAR_H / 2} fontSize={9} fill={MUTED}
                  textAnchor="middle" dominantBaseline="middle">
                  No goal set
                </text>
              </g>
            );
          }

          const { baselineScore: bl, currentScore: cur, targetScore: tgt } = match;
          const curPct = (cur / 10) * barW;
          const blX    = LABEL_W + (bl / 10) * barW;
          const tgtX   = LABEL_W + (tgt / 10) * barW;

          return (
            <g key={sa.id}>
              {/* label */}
              <text x={PAD_L} y={y + ROW_H / 2 - 2} fontSize={11} fill="var(--text-primary, #ccc)" dominantBaseline="middle">
                {sa.name}
              </text>
              {/* background track */}
              <rect x={LABEL_W} y={barY} width={barW} height={BAR_H} rx={3} fill="oklch(0.55 0.02 260 / 0.10)" />
              {/* current score bar */}
              <rect x={LABEL_W} y={barY} width={curPct} height={BAR_H} rx={3} fill={color} opacity={0.85} />
              {/* baseline tick */}
              <line x1={blX} y1={barY - 3} x2={blX} y2={barY + BAR_H + 3}
                stroke="oklch(0.55 0.02 260)" strokeWidth={1.5} />
              {/* target tick */}
              <line x1={tgtX} y1={barY - 3} x2={tgtX} y2={barY + BAR_H + 3}
                stroke={color} strokeWidth={2} strokeDasharray="2 2" opacity={0.7} />
              {/* score label */}
              <text
                x={LABEL_W + barW + 6} y={barY + BAR_H / 2}
                fontSize={10} fill={color} dominantBaseline="middle" fontWeight="600"
              >
                {cur.toFixed(1)} / 10
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 px-1 flex-wrap">
        {[
          { label: "Baseline",   el: <span className="inline-block w-4 border-t-2" style={{ borderColor: MUTED }} /> },
          { label: "Current",    el: <span className="inline-block w-4 h-2.5 rounded-sm opacity-85" style={{ background: PRIMARY }} /> },
          { label: "Target",     el: <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: PRIMARY, opacity: 0.7 }} /> },
        ].map(({ label, el }) => (
          <div key={label} className="flex items-center gap-1.5">
            {el}
            <span className="text-[10px]" style={{ color: MUTED }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Goal Card                                                                   */
/* -------------------------------------------------------------------------- */

function GoalCard({ goal, playerId }: { goal: DevelopmentGoal; playerId: string }): React.ReactElement {
  const progress = computeGoalProgress(goal);
  const risk     = goalRisk(goal, DEMO_TODAY);
  const daysLeft = daysUntilDeadline(goal.targetDate, DEMO_TODAY);
  const sa       = SKILL_AREAS.find((s) => s.id === goal.skillAreaId);
  const isPaused = goal.status === "paused";

  // Tricolor bar geometry
  const range      = goal.targetScore - goal.baselineScore;
  const achieved   = range > 0 ? Math.min(1, (goal.currentScore - goal.baselineScore) / range) : 1;
  const tgtPct     = 100; // target is always at 100% of the range

  return (
    <div
      className="p-4 border-b border-border last:border-b-0"
      style={isPaused ? { background: "oklch(0.55 0.02 260 / 0.04)" } : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-[13px] leading-tight">{goal.title}</span>
            {sa && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: `${skillColor(sa.category)}1a`, color: skillColor(sa.category) }}
              >
                {sa.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={
                isPaused
                  ? { background: `${MUTED}1a`, color: MUTED }
                  : { background: `${PRIMARY}1a`, color: PRIMARY }
              }
            >
              {isPaused ? "Paused" : "Active"}
            </span>
            <RiskBadge risk={risk} />
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${
                goal.confidence === "high" ? SUCCESS : goal.confidence === "medium" ? WARNING : DANGER
              }1a`, color: goal.confidence === "high" ? SUCCESS : goal.confidence === "medium" ? WARNING : DANGER }}
            >
              {goal.confidence} confidence
            </span>
          </div>
        </div>
        <Link href={`/app/coach/players/${playerId}/idp/goals/${goal.id}`} asChild>
          <a className="text-[11px] shrink-0 hover:underline" style={{ color: PRIMARY }}>
            View detail →
          </a>
        </Link>
      </div>

      {/* Tricolor progress bar */}
      <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: "oklch(0.55 0.02 260 / 0.12)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${achieved * 100}%`, background: PRIMARY, opacity: 0.85 }}
        />
        {/* target tick */}
        <div
          className="absolute top-0 h-full w-0.5"
          style={{ left: `${tgtPct - 1}%`, background: "oklch(0.55 0.02 260 / 0.5)" }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px] flex-wrap" style={{ color: MUTED }}>
        <span>Target: {new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span
          style={{ color: daysLeft < 7 ? DANGER : undefined, fontWeight: daysLeft < 7 ? 600 : undefined }}
        >
          {daysLeft >= 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d overdue`}
        </span>
        <span>{goal.evidenceIds.length} evidence</span>
        <span style={{ color: "var(--text-muted)" }}>Owner: {goal.ownerName}</span>
      </div>

      {goal.nextAction && (
        <p className="text-[11px] italic mt-1.5 leading-snug" style={{ color: MUTED }}>
          Next: {goal.nextAction}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence Item                                                               */
/* -------------------------------------------------------------------------- */

function EvidenceItem({ ev, goals }: { ev: DevelopmentEvidence; goals: DevelopmentGoal[] }): React.ReactElement {
  const linkedGoal = goals.find((g) => g.id === ev.goalId);

  const iconBg = (() => {
    if (ev.type === "film_clip")      return `${PRIMARY}1a`;
    if (ev.type === "drill_result")   return `${SUCCESS}1a`;
    if (ev.type === "wod_completion") return `${SUCCESS}1a`;
    if (ev.type === "assessment")     return `${PRIMARY}1a`;
    if (ev.type === "readiness_signal") {
      const c = ev.readinessStatus === "RESTRICTED" ? DANGER : ev.readinessStatus === "FLAGGED" ? WARNING : MUTED;
      return `${c}1a`;
    }
    // coach_note
    const c = ev.sentiment === "positive" ? SUCCESS : ev.sentiment === "concern" ? DANGER : MUTED;
    return `${c}1a`;
  })();

  const iconColor = (() => {
    if (ev.type === "film_clip")      return PRIMARY;
    if (ev.type === "drill_result")   return SUCCESS;
    if (ev.type === "wod_completion") return SUCCESS;
    if (ev.type === "assessment")     return PRIMARY;
    if (ev.type === "readiness_signal") {
      return ev.readinessStatus === "RESTRICTED" ? DANGER : ev.readinessStatus === "FLAGGED" ? WARNING : MUTED;
    }
    return ev.sentiment === "positive" ? SUCCESS : ev.sentiment === "concern" ? DANGER : MUTED;
  })();

  const leftBorder = ev.type === "coach_note"
    ? ev.sentiment === "positive" ? SUCCESS : ev.sentiment === "concern" ? DANGER : MUTED
    : undefined;

  const Icon = (() => {
    if (ev.type === "film_clip")        return Film;
    if (ev.type === "drill_result")     return Dumbbell;
    if (ev.type === "wod_completion")   return CheckCircle2;
    if (ev.type === "assessment")       return TrendingUp;
    if (ev.type === "readiness_signal") return AlertTriangle;
    return MessageSquare;
  })();

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0"
      style={leftBorder ? { borderLeft: `3px solid ${leftBorder}` } : undefined}
    >
      {/* Icon circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: iconBg }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[11px]" style={{ color: MUTED }}>{relativeDate(ev.date)}</span>
              {ev.type === "film_clip" && ev.aiConfidence != null && (
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${PRIMARY}1a`, color: PRIMARY }}
                >
                  AI {Math.round(ev.aiConfidence * 100)}%
                </span>
              )}
            </div>
            <p className="font-semibold text-[13px] leading-snug mb-0.5">{ev.title}</p>
            <p className="text-[12px] leading-snug line-clamp-2" style={{ color: MUTED }}>{ev.summary}</p>
          </div>

          {/* Goal badge */}
          {linkedGoal && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 max-w-[96px] truncate"
              style={{ background: `${PRIMARY}0d`, color: PRIMARY }}
              title={linkedGoal.title}
            >
              {shortGoalTitle(linkedGoal.title)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drill Prescription Card                                                    */
/* -------------------------------------------------------------------------- */

function PrescriptionCard({ rx }: { rx: DrillPrescription }): React.ReactElement {
  const isSkipped = rx.status === "skipped";
  const color = rx.status === "active" ? SUCCESS : rx.status === "completed" ? MUTED : DANGER;
  const label = rx.status === "active" ? "Active" : rx.status === "completed" ? "Completed" : "Skipped";

  return (
    <div
      className="px-4 py-3 border-b border-border last:border-b-0"
      style={isSkipped ? { opacity: 0.55 } : undefined}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-medium text-[13px] leading-tight">{rx.drillName}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded border"
            style={{ borderColor: `${MUTED}30`, color: MUTED }}
          >
            {rx.frequency}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}1a`, color }}
          >
            {label}
          </span>
        </div>
      </div>
      <ProgressBar pct={rx.completionRate * 100} color={color} />
      <div className="flex items-center justify-between mt-1 text-[10px]" style={{ color: MUTED }}>
        <span>{rx.reps}</span>
        <span>{Math.round(rx.completionRate * 100)}% completion</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recommendation Panel                                                       */
/* -------------------------------------------------------------------------- */

function RecommendationPanel({ profile, goals, evidence, prescriptions }: {
  profile: DevelopmentProfile;
  goals: DevelopmentGoal[];
  evidence: DevelopmentEvidence[];
  prescriptions: DrillPrescription[];
}): React.ReactElement | null {
  const rec = computeRecommendation(profile, goals, evidence, prescriptions, DEMO_TODAY);
  if (!rec) return null;

  const priorityColor = rec.priority === "high" ? DANGER : rec.priority === "medium" ? WARNING : MUTED;
  const priorityLabel = rec.priority === "high" ? "High Priority" : rec.priority === "medium" ? "Medium" : "Low";

  const Icon = (() => {
    if (rec.type === "assign_film")      return Film;
    if (rec.type === "assign_drill")     return Dumbbell;
    if (rec.type === "schedule_checkin") return Calendar;
    if (rec.type === "modify_wod")       return Activity;
    return MessageSquare;
  })();

  return (
    <div
      className="rounded-xl border p-4 flex items-start gap-4"
      style={{ borderColor: `${priorityColor}40`, background: `${priorityColor}08` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${priorityColor}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: priorityColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-bold text-[14px]">{rec.title}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${priorityColor}1a`, color: priorityColor }}
          >
            {priorityLabel}
          </span>
        </div>
        <p className="text-[13px] leading-snug mb-3" style={{ color: MUTED }}>{rec.reason}</p>
        <Link href={rec.actionHref} asChild>
          <a
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: priorityColor, color: "#fff" }}
            onClick={() => toast.info(`Opening: ${rec.actionLabel}`)}
          >
            {rec.actionLabel} →
          </a>
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function PlayerIDPPage(): React.ReactElement {
  const { id: playerId } = useParams<{ id: string }>();

  const profile      = useMemo(() => DEVELOPMENT_PROFILES.find((p) => p.playerId === playerId) ?? null, [playerId]);
  const goals        = useMemo(() => DEVELOPMENT_GOALS.filter((g) => g.playerId === playerId && (g.status === "active" || g.status === "paused")), [playerId]);
  const allEvidence  = useMemo(() => DEVELOPMENT_EVIDENCE.filter((e) => e.playerId === playerId), [playerId]);
  const prescriptions = useMemo(() => DRILL_PRESCRIPTIONS.filter((rx) => rx.playerId === playerId), [playerId]);
  const weekGroups   = useMemo(() => groupEvidenceByWeek(allEvidence), [allEvidence]);

  if (!profile) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <UserX className="w-12 h-12 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-bold text-[16px] mb-1">Player not found</p>
            <p className="text-[13px] mb-4" style={{ color: MUTED }}>No development profile exists for this player ID.</p>
            <Link href="/app/coach/roster" asChild>
              <a className="text-[13px] font-medium hover:underline" style={{ color: PRIMARY }}>← Back to Roster</a>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const stale      = isPlayerStale(profile.lastActivityDate, DEMO_TODAY);
  const staleDays  = daysSinceActivity(profile.lastActivityDate, DEMO_TODAY);
  const showEmpty  = profile.status === "missing-data" || (allEvidence.length === 0 && goals.length === 0);

  return (
    <AppShell>
      <PageHeader
        title={profile.playerName}
        actions={
          <Link href="/app/coach/roster" asChild>
            <a className="flex items-center gap-1 text-[13px] hover:underline" style={{ color: MUTED }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Roster
            </a>
          </Link>
        }
      />

      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto space-y-5">

        {/* ------------------------------------------------------------------ */}
        {/* 1. Profile Header Card                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Left: name / position / class */}
            <div>
              <h1 className="font-bold text-[22px] leading-tight mb-1">{profile.playerName}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{ background: `${PRIMARY}18`, color: PRIMARY }}
                >
                  {profile.position}
                </span>
                <span className="text-[12px]" style={{ color: MUTED }}>Class of {profile.classYear}</span>
              </div>
            </div>

            {/* Center: status chips */}
            <div className="flex flex-col gap-2 justify-center">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip status={profile.status} />
                <VdvBadge status={profile.vdvStatus} />
              </div>
              <p className="text-[11px]" style={{ color: MUTED }}>Coach: {profile.coachName}</p>
            </div>

            {/* Right: activity + progress */}
            <div className="flex flex-col gap-2 justify-center">
              <div className="text-[11px]" style={{ color: MUTED }}>
                Last activity: <span className="font-medium text-foreground">{relativeDate(profile.lastActivityDate)}</span>
              </div>
              <div className="text-[11px]" style={{ color: MUTED }}>
                Last assessment: <span className="font-medium text-foreground">
                  {profile.lastAssessmentDate ? relativeDate(profile.lastAssessmentDate) : "—"}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]" style={{ color: MUTED }}>
                  <span>Overall progress</span>
                  <span className="font-bold" style={{ color: PRIMARY }}>{profile.overallProgress}%</span>
                </div>
                <ProgressBar pct={profile.overallProgress} />
              </div>
            </div>
          </div>

          {/* Status strips */}
          {stale && profile.status !== "restricted" && (
            <div
              className="px-5 py-2 text-[12px] font-medium"
              style={{ background: `${WARNING}18`, color: WARNING, borderTop: `1px solid ${WARNING}30` }}
            >
              No IDP activity in {staleDays} days — this player needs coach attention
            </div>
          )}
          {profile.status === "restricted" && (
            <div
              className="px-5 py-2 text-[12px] font-medium"
              style={{ background: `${DANGER}18`, color: DANGER, borderTop: `1px solid ${DANGER}30` }}
            >
              Player is currently RESTRICTED from full-contact activity
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Recommendation Panel                                             */}
        {/* ------------------------------------------------------------------ */}
        <RecommendationPanel
          profile={profile}
          goals={goals}
          evidence={allEvidence}
          prescriptions={prescriptions}
        />

        {/* ------------------------------------------------------------------ */}
        {/* 3. Empty state (above main grid when applicable)                    */}
        {/* ------------------------------------------------------------------ */}
        {showEmpty && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-bold text-[16px] mb-1">No development history yet</p>
            <p className="text-[13px] mb-5" style={{ color: MUTED }}>
              Start by setting goals or prescribing a skill drill
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={`/app/coach/players/${playerId}/idp/goals/new`} asChild>
                <a
                  className="text-[13px] font-semibold px-4 py-2 rounded-lg"
                  style={{ background: PRIMARY, color: "#fff" }}
                  onClick={() => toast.info("Opening goal editor…")}
                >
                  Set First Goal
                </a>
              </Link>
              <Link href="/app/coach/drill-library" asChild>
                <a
                  className="text-[13px] font-semibold px-4 py-2 rounded-lg border"
                  style={{ borderColor: `${PRIMARY}50`, color: PRIMARY }}
                >
                  Browse Drills
                </a>
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 4. Main 2-col grid                                                  */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left col — spans 2 */}
          <div className="lg:col-span-2 space-y-5">

            {/* Skill Development Graph */}
            <CollapsibleSection title="Skill Development" defaultOpen>
              <SkillChart goals={goals} />
            </CollapsibleSection>

            {/* Active Goals */}
            <CollapsibleSection title="Active Goals" count={goals.length} defaultOpen>
              {goals.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px]" style={{ color: MUTED }}>
                  No active goals — set a goal to start tracking progress.
                </div>
              ) : (
                <div>
                  {goals.map((g) => (
                    <GoalCard key={g.id} goal={g} playerId={playerId ?? ""} />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Evidence Timeline */}
            <CollapsibleSection title="Evidence Timeline" count={allEvidence.length} defaultOpen>
              {allEvidence.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px]" style={{ color: MUTED }}>
                  No evidence recorded yet.{" "}
                  <Link href="/app/coach/film/upload" asChild>
                    <a className="underline hover:no-underline" style={{ color: PRIMARY }}>Add film evidence →</a>
                  </Link>
                </div>
              ) : (
                <div>
                  {Array.from(weekGroups.entries()).map(([weekStart, items]) => (
                    <div key={weekStart}>
                      <div
                        className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: MUTED, background: "oklch(0.55 0.02 260 / 0.04)", borderBottom: "1px solid var(--border)" }}
                      >
                        {weekLabel(weekStart)}
                      </div>
                      {items.map((ev) => (
                        <EvidenceItem key={ev.id} ev={ev} goals={goals} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </div>

          {/* Right col */}
          <div className="space-y-5">

            {/* Drill Prescriptions */}
            <CollapsibleSection title="Prescriptions" count={prescriptions.length} defaultOpen>
              {prescriptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px]" style={{ color: MUTED }}>
                  No prescriptions assigned.
                </div>
              ) : (
                <div>
                  {prescriptions.map((rx) => (
                    <PrescriptionCard key={rx.id} rx={rx} />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Quick Links */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-bold text-[14px] mb-3">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: "View full roster",  href: "/app/coach/roster"       },
                  { label: "Film room",          href: "/app/coach/film"         },
                  { label: "Drill library",      href: "/app/coach/drill-library" },
                  { label: "Assign WOD",         href: "/app/coach/assignments"  },
                ].map(({ label, href }) => (
                  <Link key={href} href={href} asChild>
                    <a
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] hover:opacity-80 transition-opacity"
                      style={{ background: `${PRIMARY}0a`, color: PRIMARY }}
                    >
                      {label}
                      <span className="text-[11px]">→</span>
                    </a>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
