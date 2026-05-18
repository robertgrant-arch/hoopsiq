import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import {
  DEVELOPMENT_GOALS,
  DEVELOPMENT_EVIDENCE,
  DEVELOPMENT_PROFILES,
  SKILL_AREAS,
  DRILL_PRESCRIPTIONS,
  FILM_CLIPS,
  SKILL_RUBRIC,
  type DevelopmentGoal,
  type DevelopmentEvidence,
} from "@/lib/mock/player-development";
import {
  computeGoalProgress,
  goalRisk,
  daysUntilDeadline,
  filterEvidenceForGoal,
  weekLabel,
  groupEvidenceByWeek,
} from "@/lib/idp-selectors";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

interface EvidenceItemProps {
  ev: DevelopmentEvidence;
  detailed?: boolean;
}

function EvidenceTypeIcon({ type }: { type: DevelopmentEvidence["type"] }) {
  const map: Record<DevelopmentEvidence["type"], { icon: string; bg: string }> = {
    film_clip:       { icon: "▶", bg: "oklch(0.72 0.18 290 / 0.15)" },
    drill_result:    { icon: "⚡", bg: "oklch(0.75 0.12 140 / 0.15)" },
    wod_completion:  { icon: "🏋", bg: "oklch(0.78 0.16 75 / 0.15)" },
    coach_note:      { icon: "✏", bg: "oklch(0.55 0.02 260 / 0.12)" },
    readiness_signal:{ icon: "⚑", bg: "oklch(0.68 0.22 25 / 0.15)" },
    assessment:      { icon: "📋", bg: "oklch(0.75 0.12 140 / 0.10)" },
  };
  const { icon, bg } = map[type];
  return (
    <span
      className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] shrink-0"
      style={{ background: bg }}
    >
      {icon}
    </span>
  );
}

function SentimentBorder({ sentiment }: { sentiment?: "positive" | "neutral" | "concern" }) {
  const colors: Record<string, string> = {
    positive: "oklch(0.75 0.12 140)",
    neutral:  "oklch(0.55 0.02 260)",
    concern:  "oklch(0.68 0.22 25)",
  };
  return sentiment ? colors[sentiment] : "oklch(0.55 0.02 260)";
}

function MiniProgressBar({ pct, label }: { pct: number; label?: string }) {
  const color =
    pct >= 80 ? "oklch(0.75 0.12 140)"
    : pct >= 50 ? "oklch(0.78 0.16 75)"
    : "oklch(0.68 0.22 25)";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "oklch(0.55 0.02 260 / 0.12)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      {label && <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>}
    </div>
  );
}

function EvidenceItem({ ev, detailed = false }: EvidenceItemProps) {
  const borderColor = ev.type === "coach_note" ? SentimentBorder({ sentiment: ev.sentiment }) : undefined;

  return (
    <div
      className={`flex gap-3 py-3 px-4${ev.type === "coach_note" ? " border-l-2 pl-4 ml-0" : ""}`}
      style={ev.type === "coach_note" ? { borderLeftColor: borderColor } : undefined}
    >
      <EvidenceTypeIcon type={ev.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold leading-tight">{ev.title}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 ml-auto">{relativeDate(ev.date)}</span>
        </div>

        {ev.coachName && (
          <div className="text-[11px] text-muted-foreground mb-0.5">{ev.coachName}</div>
        )}

        <p className={`text-[12px] text-muted-foreground leading-relaxed${detailed ? "" : " line-clamp-2"}`}>
          {ev.summary}
        </p>

        {/* Film clip extras */}
        {ev.type === "film_clip" && ev.filmClipId && (() => {
          const clip = FILM_CLIPS.find((c) => c.id === ev.filmClipId);
          return clip ? (
            <div className="mt-1.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)" }}
                >
                  AI {Math.round(clip.aiConfidence * 100)}%
                </span>
                <a href="#" className="text-[11px] underline-offset-2 hover:underline" style={{ color: "oklch(0.72 0.18 290)" }}>
                  View clip
                </a>
              </div>
              {clip.aiTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {clip.aiTags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null;
        })()}

        {/* Drill result extras */}
        {ev.type === "drill_result" && ev.completionPct != null && (
          <MiniProgressBar pct={ev.completionPct} label={`${ev.completionPct}%`} />
        )}

        {/* Assessment score */}
        {ev.type === "assessment" && ev.score != null && (
          <span
            className="inline-block mt-1 text-[11px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "oklch(0.75 0.12 140 / 0.12)", color: "oklch(0.75 0.12 140)" }}
          >
            Score: {ev.score} / 10
          </span>
        )}

        {/* Readiness signal */}
        {ev.type === "readiness_signal" && ev.readinessStatus && (
          <span
            className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{
              background: ev.readinessStatus === "READY" ? "oklch(0.75 0.12 140 / 0.12)" : "oklch(0.68 0.22 25 / 0.12)",
              color:      ev.readinessStatus === "READY" ? "oklch(0.75 0.12 140)"        : "oklch(0.68 0.22 25)",
            }}
          >
            {ev.readinessStatus}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Score Progression SVG                                                       */
/* -------------------------------------------------------------------------- */

function ScoreProgressionSvg({ goal }: { goal: DevelopmentGoal }) {
  const W = 320;
  const H = 72;
  const PAD = 24;
  const trackW = W - PAD * 2;
  const cx = (score: number) => PAD + ((score - 0) / 10) * trackW;

  const baseX = cx(goal.baselineScore);
  const curX  = cx(goal.currentScore);
  const tgtX  = cx(goal.targetScore);
  const fillW = curX - baseX;
  const progress = computeGoalProgress(goal);

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden="true">
        {/* Full track */}
        <rect x={PAD} y={30} width={trackW} height={6} rx={3} fill="oklch(0.55 0.02 260 / 0.12)" />
        {/* Filled portion */}
        {fillW > 0 && (
          <rect x={baseX} y={30} width={fillW} height={6} rx={3} fill="oklch(0.72 0.18 290)" />
        )}
        {/* Baseline node */}
        <circle cx={baseX} cy={33} r={6} fill="white" stroke="oklch(0.55 0.02 260)" strokeWidth={2} />
        <text x={baseX} y={18} textAnchor="middle" fontSize={9} fill="oklch(0.55 0.02 260)" fontFamily="monospace">Baseline</text>
        <text x={baseX} y={27} textAnchor="middle" fontSize={9} fill="oklch(0.55 0.02 260)" fontFamily="monospace">{goal.baselineScore.toFixed(1)}</text>
        {/* Current node */}
        <circle cx={curX} cy={33} r={7} fill="oklch(0.72 0.18 290)" />
        <text x={curX} y={55} textAnchor="middle" fontSize={9} fill="oklch(0.72 0.18 290)" fontFamily="monospace" fontWeight="bold">Current</text>
        <text x={curX} y={65} textAnchor="middle" fontSize={9} fill="oklch(0.72 0.18 290)" fontFamily="monospace" fontWeight="bold">{goal.currentScore.toFixed(1)}</text>
        {/* Target diamond */}
        <polygon
          points={`${tgtX},24 ${tgtX + 6},33 ${tgtX},42 ${tgtX - 6},33`}
          fill="none"
          stroke="oklch(0.75 0.12 140)"
          strokeWidth={2}
        />
        <text x={tgtX} y={18} textAnchor="middle" fontSize={9} fill="oklch(0.75 0.12 140)" fontFamily="monospace">Target</text>
        <text x={tgtX} y={27} textAnchor="middle" fontSize={9} fill="oklch(0.75 0.12 140)" fontFamily="monospace">{goal.targetScore.toFixed(1)}</text>
      </svg>
      <p className="text-[11px] text-muted-foreground text-center">{progress}% of the way from baseline to target</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function GoalDetailPage() {
  const { id: playerId, goalId } = useParams<{ id: string; goalId: string }>();
  const [addingNote, setAddingNote] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteSentiment, setNoteSentiment] = useState<"positive" | "neutral" | "concern">("neutral");
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const goal = DEVELOPMENT_GOALS.find((g) => g.id === goalId && g.playerId === playerId);
  const profile = DEVELOPMENT_PROFILES.find((p) => p.playerId === playerId);
  const skillArea = goal ? SKILL_AREAS.find((sa) => sa.id === goal.skillAreaId) : null;

  if (!goal || !profile) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
          <p className="text-muted-foreground text-sm">Goal not found.</p>
        </div>
      </AppShell>
    );
  }

  const allEvidence = filterEvidenceForGoal(DEVELOPMENT_EVIDENCE, goalId);
  const coachNotes = allEvidence.filter((ev) => ev.type === "coach_note");
  const prescriptions = DRILL_PRESCRIPTIONS.filter((rx) => rx.goalId === goalId);
  const clips = FILM_CLIPS.filter((c) => c.linkedGoalId === goalId);

  const risk = goalRisk(goal);
  const days = daysUntilDeadline(goal.targetDate);
  const progress = computeGoalProgress(goal);
  const weekGroups = groupEvidenceByWeek(allEvidence);

  const riskColor =
    risk === "overdue"  ? "oklch(0.68 0.22 25)" :
    risk === "at-risk"  ? "oklch(0.78 0.16 75)" :
                          "oklch(0.75 0.12 140)";

  const daysColor =
    days < 0    ? "oklch(0.68 0.22 25)" :
    days <= 7   ? "oklch(0.68 0.22 25)" :
    days <= 14  ? "oklch(0.78 0.16 75)" :
                  "oklch(0.75 0.12 140)";

  const confidenceColor =
    goal.confidence === "high"   ? "oklch(0.75 0.12 140)" :
    goal.confidence === "medium" ? "oklch(0.78 0.16 75)"  :
                                   "oklch(0.68 0.22 25)";

  const statusColor =
    goal.status === "achieved" ? "oklch(0.75 0.12 140)" :
    goal.status === "paused"   ? "oklch(0.78 0.16 75)"  :
    goal.status === "dropped"  ? "oklch(0.68 0.22 25)"  :
                                 "oklch(0.72 0.18 290)";

  function Chip({ label, color }: { label: string; color: string }) {
    return (
      <span
        className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
        style={{ background: `color-mix(in oklch, ${color} 15%, transparent)`, color }}
      >
        {label}
      </span>
    );
  }

  function handleSaveNote() {
    if (!noteBody.trim()) {
      toast.error("Note body cannot be empty.");
      return;
    }
    toast.success("Note saved");
    setNoteBody("");
    setNoteSentiment("neutral");
    setAddingNote(false);
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
        {/* Back nav */}
        <div className="mb-4">
          <Link href={`/app/coach/players/${playerId}/idp`}>
            <a className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit transition-colors">
              ← IDP
            </a>
          </Link>
        </div>

        <PageHeader
          eyebrow={`${profile.playerName} · ${skillArea?.name ?? goal.skillAreaId}`}
          title={goal.title}
          subtitle={`Owner: ${goal.ownerName} · Created ${formatDate(goal.createdAt)}`}
          actions={
            <>
              <Chip label={risk} color={riskColor} />
              <Chip label={`${goal.confidence} confidence`} color={confidenceColor} />
              <Chip label={goal.status} color={statusColor} />
            </>
          }
        />

        {/* About this goal toggle */}
        <button
          type="button"
          onClick={() => setAboutExpanded((v) => !v)}
          className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 mb-5 transition-colors"
        >
          {aboutExpanded ? "▾" : "▸"} About this goal
        </button>
        {aboutExpanded && (
          <p className="text-[13px] text-muted-foreground mb-6 max-w-2xl rounded-lg border border-border px-4 py-3 bg-card leading-relaxed">
            {goal.description}
          </p>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Top: Goal Progress Card                                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border border-border bg-card mb-6 px-5 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Section 1 — Score Progression */}
            <div className="pb-4 md:pb-0 md:pr-6">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-3">Score Progression</p>
              <ScoreProgressionSvg goal={goal} />
            </div>

            {/* Section 2 — Deadline Stats */}
            <div className="pt-4 md:pt-0 md:px-6">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-3">Deadline</p>
              <p className="text-[12px] text-muted-foreground mb-1">Target date: <span className="text-foreground font-medium">{formatDate(goal.targetDate)}</span></p>
              <p
                className="text-3xl font-bold leading-none mb-2"
                style={{ color: daysColor }}
              >
                {days < 0 ? Math.abs(days) : days}
                <span className="text-[13px] font-normal ml-1.5" style={{ color: daysColor }}>
                  {days < 0 ? "days overdue" : "days remaining"}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Chip label={risk} color={riskColor} />
                <span className="text-[12px] text-muted-foreground">{progress}% progress</span>
              </div>
            </div>

            {/* Section 3 — Confidence & Evidence */}
            <div className="pt-4 md:pt-0 md:pl-6">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono mb-3">Confidence & Evidence</p>
              <div className="flex items-center gap-2 mb-2">
                <Chip label={`${goal.confidence} confidence`} color={confidenceColor} />
                <span className="text-[12px] text-muted-foreground">{allEvidence.length} items</span>
              </div>
              <p className="text-[12px] leading-relaxed">
                <span className="text-muted-foreground">Next action: </span>
                {goal.nextAction}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Main 2-col grid                                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Evidence Timeline */}
            <CollapsibleSection
              title="Goal Evidence"
              count={allEvidence.length}
              defaultOpen
            >
              {allEvidence.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-muted-foreground text-center">
                  No evidence linked to this goal yet. Add film clips, coach notes, or drill results to track progress.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {Array.from(weekGroups.entries()).map(([weekStart, items]) => (
                    <div key={weekStart}>
                      <div className="px-4 py-2" style={{ background: "oklch(0.55 0.02 260 / 0.05)" }}>
                        <span className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                          {weekLabel(weekStart)}
                        </span>
                      </div>
                      {items.map((ev: DevelopmentEvidence) => (
                        <EvidenceItem key={ev.id} ev={ev} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Coach Notes */}
            <CollapsibleSection
              title="Coach Notes"
              count={coachNotes.length}
              defaultOpen
              actionsSlot={
                <button
                  type="button"
                  onClick={() => setAddingNote((v) => !v)}
                  className="text-[12px] font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                >
                  {addingNote ? "Cancel" : "+ Add Note"}
                </button>
              }
            >
              <div className="divide-y divide-border">
                {coachNotes.length === 0 && !addingNote && (
                  <p className="px-5 py-6 text-[13px] text-muted-foreground text-center">No coach notes yet.</p>
                )}
                {coachNotes.map((ev) => (
                  <EvidenceItem key={ev.id} ev={ev} detailed />
                ))}

                {addingNote && (
                  <div className="px-5 py-4 space-y-3">
                    <textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      rows={4}
                      placeholder="Write your note here…"
                      className="w-full text-[13px] rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex items-center gap-2">
                      {(["positive", "neutral", "concern"] as const).map((s) => {
                        const sColor =
                          s === "positive" ? "oklch(0.75 0.12 140)" :
                          s === "concern"  ? "oklch(0.68 0.22 25)"  :
                                             "oklch(0.55 0.02 260)";
                        const active = noteSentiment === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setNoteSentiment(s)}
                            className="text-[11px] px-2.5 py-1 rounded-full border capitalize font-medium transition-colors"
                            style={{
                              borderColor: active ? sColor : "var(--border)",
                              background:  active ? `color-mix(in oklch, ${sColor} 15%, transparent)` : "transparent",
                              color:       active ? sColor : "var(--muted-foreground)",
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleSaveNote}
                        className="ml-auto text-[12px] font-semibold px-3 py-1 rounded-lg"
                        style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Score Rubric */}
            <CollapsibleSection title="Skill Rubric" defaultOpen>
              <div className="divide-y divide-border">
                {SKILL_RUBRIC.slice().reverse().map((row) => {
                  const isBaseline = row.level === Math.round(goal.baselineScore);
                  const isCurrent  = row.level === Math.round(goal.currentScore);
                  const isTarget   = row.level === Math.round(goal.targetScore);
                  const isBelow    = row.level < Math.round(goal.baselineScore);

                  let rowBg = "transparent";
                  let textColor = isBelow ? "oklch(0.55 0.02 260)" : "inherit";
                  if (isCurrent)  rowBg = "oklch(0.72 0.18 290 / 0.10)";
                  if (isBaseline && !isCurrent) rowBg = "oklch(0.55 0.02 260 / 0.07)";

                  return (
                    <div
                      key={row.level}
                      className="flex gap-3 px-4 py-2.5"
                      style={{
                        background: rowBg,
                        border: isTarget ? "1px dashed oklch(0.75 0.12 140)" : undefined,
                        opacity: isBelow ? 0.5 : 1,
                      }}
                    >
                      <span
                        className="text-[11px] font-mono font-bold w-5 shrink-0 text-right pt-0.5"
                        style={{ color: isCurrent ? "oklch(0.72 0.18 290)" : textColor }}
                      >
                        {row.level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-semibold" style={{ color: isCurrent ? "oklch(0.72 0.18 290)" : undefined }}>
                            {row.label}
                          </span>
                          {isCurrent  && <span className="text-[9.5px] px-1 py-0.5 rounded font-semibold" style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}>Current</span>}
                          {isBaseline && !isCurrent && <span className="text-[9.5px] px-1 py-0.5 rounded font-semibold" style={{ background: "oklch(0.55 0.02 260 / 0.12)", color: "oklch(0.55 0.02 260)" }}>Baseline</span>}
                          {isTarget   && <span className="text-[9.5px] px-1 py-0.5 rounded font-semibold" style={{ background: "oklch(0.75 0.12 140 / 0.12)", color: "oklch(0.75 0.12 140)" }}>Target</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{row.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* Drill Prescriptions */}
            <CollapsibleSection title="Prescriptions" count={prescriptions.length} defaultOpen>
              {prescriptions.length === 0 ? (
                <p className="px-5 py-5 text-[13px] text-muted-foreground text-center">No drill prescriptions assigned.</p>
              ) : (
                <div className="divide-y divide-border">
                  {prescriptions.map((rx) => {
                    const pct = Math.round(rx.completionRate * 100);
                    const barColor =
                      pct >= 80 ? "oklch(0.75 0.12 140)" :
                      pct >= 50 ? "oklch(0.78 0.16 75)"  :
                                  "oklch(0.68 0.22 25)";
                    const rxStatusColor =
                      rx.status === "completed" ? "oklch(0.75 0.12 140)" :
                      rx.status === "skipped"   ? "oklch(0.68 0.22 25)"  :
                                                  "oklch(0.72 0.18 290)";
                    return (
                      <div key={rx.id} className="px-4 py-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[13px] font-bold leading-tight">{rx.drillName}</span>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 uppercase"
                            style={{ background: `color-mix(in oklch, ${rxStatusColor} 15%, transparent)`, color: rxStatusColor }}
                          >
                            {rx.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground">{rx.reps} · {rx.frequency}</p>
                        {rx.dueDate && (
                          <p className="text-[11px] text-muted-foreground">Due {formatDate(rx.dueDate)}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: "oklch(0.55 0.02 260 / 0.12)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">{pct}%</span>
                        </div>
                        {rx.status === "active" && (
                          <button
                            type="button"
                            onClick={() => toast.success("Prescription marked complete")}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted/40 transition-colors mt-1"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

            {/* Film Clips */}
            <CollapsibleSection title="Film Clips" count={clips.length} defaultOpen>
              {clips.length === 0 ? (
                <p className="px-5 py-5 text-[13px] text-muted-foreground text-center">No film clips linked to this goal.</p>
              ) : (
                <div className="divide-y divide-border">
                  {clips.map((clip) => (
                    <div key={clip.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold leading-tight">{clip.title}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{formatDuration(clip.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)" }}
                        >
                          AI {Math.round(clip.aiConfidence * 100)}%
                        </span>
                        {clip.aiTags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {clip.annotations.length > 0 && (
                        <ul className="text-[11px] text-muted-foreground space-y-0.5 pl-3">
                          {clip.annotations.map((a, i) => (
                            <li key={i} className="list-disc leading-snug">{a}</li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        onClick={() => toast.info("Film player coming soon")}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                      >
                        View clip
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
