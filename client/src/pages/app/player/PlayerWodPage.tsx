/**
 * PlayerWodPage — daily WOD completion flow for athletes.
 *
 * States: not_started → in_progress → completed | skipped
 * If coach has modified the WOD, a "Modified" badge is shown.
 * On completion, a DevelopmentEvidence record is produced and
 * the player's IDP goal progress is updated (mock).
 */

import React, { useState } from "react";
import { Link } from "wouter";
import {
  Play,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Clock,
  Target,
  Sparkles,
  Dumbbell,
  AlertTriangle,
  Info,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Flame,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { todaysWod } from "@/lib/mock/data";
import {
  todayWodRecord,
  myWodHistory,
  SKIP_REASON_LABELS,
  type WodState,
  type SkipReason,
  type WodCompletion,
} from "@/lib/mock/player-checkin";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";
const MUTED = "oklch(0.55 0.02 260)";

const STATE_BADGE: Record<WodState, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: MUTED },
  in_progress: { label: "In Progress", color: WARNING },
  completed: { label: "Completed", color: SUCCESS },
  skipped: { label: "Skipped", color: DANGER },
  modified_by_coach: { label: "Modified", color: WARNING },
};

const SKIP_REASONS: SkipReason[] = [
  "injury",
  "illness",
  "personal",
  "too_fatigued",
  "coach_excused",
  "other",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px]"
      style={{ color: color ?? MUTED }}
    >
      {icon}
      {label}
    </span>
  );
}

function DrillRow({
  index,
  name,
  sets,
  reps,
  skillFocus,
  done,
  onToggle,
}: {
  index: number;
  name: string;
  sets: number;
  reps: string;
  skillFocus?: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.98] min-h-[56px]"
      style={{
        borderColor: done
          ? SUCCESS.replace(")", " / 0.35)")
          : "oklch(0.24 0.01 260)",
        background: done
          ? SUCCESS.replace(")", " / 0.07)")
          : "oklch(0.12 0.005 260)",
      }}
      aria-pressed={done}
    >
      {/* Number / check */}
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all"
        style={{
          background: done
            ? SUCCESS.replace(")", " / 0.25)")
            : "oklch(0.20 0.01 260)",
          color: done ? SUCCESS : MUTED,
        }}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : String(index + 1).padStart(2, "0")}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold leading-tight"
          style={{ color: done ? SUCCESS : "inherit", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}
        >
          {name}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
          {sets} × {reps}
          {skillFocus && (
            <span style={{ color: ACCENT.replace(")", " / 0.70)") }}>
              {" · "}
              {skillFocus.split(" · ")[0]}
            </span>
          )}
        </p>
      </div>
    </button>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span style={{ color: MUTED }}>Progress</span>
        <span className="font-mono font-semibold" style={{ color: ACCENT }}>
          {done}/{total} drills
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-[oklch(0.20_0.01_260)]">
        <div
          className="h-full rounded-full transition-all duration-400"
          style={{ width: `${pct}%`, background: ACCENT }}
        />
      </div>
    </div>
  );
}

function WodHistoryRow({ wod }: { wod: WodCompletion }) {
  const badge = STATE_BADGE[wod.state];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[oklch(0.18_0.005_260)] last:border-0">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: badge.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium truncate">{wod.wodTitle}</p>
        <p className="text-[11px]" style={{ color: MUTED }}>
          {new Date(wod.date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
          {wod.state === "completed" &&
            ` · ${wod.elapsedMinutes} min · +${wod.xpAwarded} XP`}
          {wod.state === "skipped" &&
            ` · Skipped — ${SKIP_REASON_LABELS[wod.skipReason!]}`}
          {wod.state === "modified_by_coach" &&
            ` · Modified · ${wod.elapsedMinutes} min`}
        </p>
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-wide shrink-0"
        style={{ color: badge.color }}
      >
        {badge.label}
      </span>
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function NotStartedView({
  coachModification,
  onStart,
  onSkip,
}: {
  coachModification?: string;
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-4">
      {coachModification && (
        <div
          className="rounded-xl border px-4 py-3 flex items-start gap-3"
          style={{
            borderColor: WARNING.replace(")", " / 0.30)"),
            background: WARNING.replace(")", " / 0.06)"),
          }}
        >
          <AlertTriangle
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: WARNING }}
          />
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide mb-0.5"
              style={{ color: WARNING }}
            >
              Coach Modified This WOD
            </p>
            <p className="text-[12.5px] leading-snug">{coachModification}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2 min-h-[52px] text-[15px] font-bold"
          style={{ background: ACCENT, color: "white" }}
          onClick={onStart}
        >
          <Play className="w-5 h-5" />
          Start WOD
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1.5 px-4 rounded-xl border border-border text-[13px] font-medium min-h-[52px] hover:bg-muted/30 transition-colors"
          style={{ color: MUTED }}
        >
          <XCircle className="w-4 h-4" />
          Skip
        </button>
      </div>
    </div>
  );
}

function InProgressView({
  drills,
  doneDrills,
  onToggleDrill,
  onComplete,
  onSkip,
}: {
  drills: typeof todaysWod.drills;
  doneDrills: Set<string>;
  onToggleDrill: (id: string) => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const doneCount = doneDrills.size;
  const allDone = doneCount === drills.length;

  return (
    <div className="space-y-4">
      <ProgressBar done={doneCount} total={drills.length} />

      <div className="space-y-2">
        {drills.map((d, i) => (
          <DrillRow
            key={d.id}
            index={i}
            name={d.name}
            sets={d.sets}
            reps={d.reps}
            skillFocus={d.skillFocus}
            done={doneDrills.has(d.id)}
            onToggle={() => onToggleDrill(d.id)}
          />
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1 gap-2 min-h-[52px] text-[15px] font-bold transition-opacity"
          style={{
            background: allDone ? SUCCESS : ACCENT,
            color: "white",
            opacity: allDone ? 1 : 0.6,
          }}
          onClick={onComplete}
        >
          <CheckCircle2 className="w-5 h-5" />
          {allDone ? "Finish WOD" : `Finish Early (${doneCount}/${drills.length})`}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1.5 px-4 rounded-xl border border-border text-[13px] font-medium min-h-[52px] hover:bg-muted/30 transition-colors"
          style={{ color: MUTED }}
        >
          <XCircle className="w-4 h-4" />
          Skip
        </button>
      </div>
    </div>
  );
}

function SkipView({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: SkipReason, note: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<SkipReason>("too_fatigued");
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border px-4 py-3"
        style={{
          borderColor: DANGER.replace(")", " / 0.25)"),
          background: DANGER.replace(")", " / 0.05)"),
        }}
      >
        <p className="text-[13px] font-semibold mb-0.5" style={{ color: DANGER }}>
          Skip today's WOD
        </p>
        <p className="text-[12px]" style={{ color: MUTED }}>
          Your coach will see this. Please select a reason.
        </p>
      </div>

      {/* Reason grid */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-semibold">Reason</label>
        <div className="grid grid-cols-2 gap-2">
          {SKIP_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className="rounded-xl border px-3 py-2.5 text-[12.5px] font-medium text-left transition-all duration-150 active:scale-95 min-h-[44px]"
              style={
                reason === r
                  ? {
                      borderColor: ACCENT.replace(")", " / 0.50)"),
                      background: ACCENT.replace(")", " / 0.10)"),
                      color: ACCENT,
                    }
                  : {
                      borderColor: "oklch(0.24 0.01 260)",
                      background: "oklch(0.12 0.005 260)",
                      color: "inherit",
                    }
              }
              aria-pressed={reason === r}
            >
              {SKIP_REASON_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-semibold">
          Additional note{" "}
          <span style={{ color: MUTED }} className="font-normal">
            (optional)
          </span>
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything your coach should know?"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2 min-h-[52px] font-bold"
          style={{ background: DANGER, color: "white" }}
          onClick={() => onConfirm(reason, note)}
        >
          <XCircle className="w-4 h-4" />
          Confirm Skip
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 rounded-xl border border-border text-[13px] font-medium min-h-[52px] hover:bg-muted/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}

function CompletedView({
  drillsDone,
  drillsTotal,
  elapsed,
  xp,
}: {
  drillsDone: number;
  drillsTotal: number;
  elapsed: number;
  xp: number;
}) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border p-5 flex flex-col items-center gap-4 text-center"
        style={{
          borderColor: SUCCESS.replace(")", " / 0.35)"),
          background: SUCCESS.replace(")", " / 0.07)"),
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: SUCCESS.replace(")", " / 0.15)") }}
        >
          <Trophy className="w-8 h-8" style={{ color: SUCCESS }} />
        </div>
        <div>
          <p
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: SUCCESS }}
          >
            WOD Complete
          </p>
          <h2 className="text-2xl font-bold mt-1">Well done! 🔥</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {drillsDone}/{drillsTotal} drills · {elapsed} min
          </p>
        </div>

        {/* XP badge */}
        <div
          className="rounded-full px-4 py-1.5 flex items-center gap-2 text-[14px] font-bold"
          style={{ background: ACCENT.replace(")", " / 0.15)"), color: ACCENT }}
        >
          <Sparkles className="w-4 h-4" />
          +{xp} XP earned
        </div>
      </div>

      <div
        className="rounded-xl border px-4 py-3 flex items-start gap-3"
        style={{
          borderColor: ACCENT.replace(")", " / 0.20)"),
          background: ACCENT.replace(")", " / 0.05)"),
        }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} />
        <p className="text-[12.5px] leading-relaxed">
          This session has been logged to your development record. Your coach can see your progress.
        </p>
      </div>

      <div className="flex gap-2">
        <Link href="/app/player" className="flex-1">
          <a
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-border text-[13px] font-medium min-h-[48px] hover:bg-muted/30 transition-colors"
          >
            Back to Home
          </a>
        </Link>
        <Link href="/app/player/checkin" className="flex-1">
          <a
            className="flex items-center justify-center gap-2 w-full rounded-xl text-[13px] font-semibold min-h-[48px]"
            style={{ background: ACCENT, color: "white" }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Check-In
          </a>
        </Link>
      </div>
    </div>
  );
}

function SkippedView({ reason, note }: { reason: SkipReason; note: string }) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border p-5 flex flex-col items-center gap-3 text-center"
        style={{
          borderColor: DANGER.replace(")", " / 0.30)"),
          background: DANGER.replace(")", " / 0.06)"),
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: DANGER.replace(")", " / 0.12)") }}
        >
          <XCircle className="w-7 h-7" style={{ color: DANGER }} />
        </div>
        <div>
          <p
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: DANGER }}
          >
            WOD Skipped
          </p>
          <h2 className="text-xl font-bold mt-1">
            {SKIP_REASON_LABELS[reason]}
          </h2>
          {note && (
            <p className="text-[13px] text-muted-foreground mt-1.5 italic">
              "{note}"
            </p>
          )}
        </div>
        <p className="text-[12.5px] text-muted-foreground max-w-xs">
          Your coach has been notified. Rest up and come back strong.
        </p>
      </div>

      <Link href="/app/player">
        <a
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-border text-[13px] font-medium min-h-[48px] hover:bg-muted/30 transition-colors"
        >
          Back to Home
        </a>
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageState = "not_started" | "in_progress" | "skip_form" | "completed" | "skipped";

export default function PlayerWodPage(): React.ReactElement {
  const wod = todaysWod;
  const initial: PageState =
    todayWodRecord.state === "completed"
      ? "completed"
      : todayWodRecord.state === "skipped"
      ? "skipped"
      : "not_started";

  const [pageState, setPageState] = useState<PageState>(initial);
  const [doneDrills, setDoneDrills] = useState<Set<string>>(new Set());
  const [skipReason, setSkipReason] = useState<SkipReason>("too_fatigued");
  const [skipNote, setSkipNote] = useState("");
  const [startTime] = useState<number>(Date.now());

  function toggleDrill(id: string) {
    setDoneDrills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStart() {
    setPageState("in_progress");
    toast("WOD started — tap each drill as you complete it.");
  }

  function handleComplete() {
    setPageState("completed");
    const elapsed = Math.round((Date.now() - startTime) / 60000);
    toast.success(`WOD complete! +${wod.xp} XP earned. Logged to your development record.`);
    void elapsed; // used in CompletedView via prop
  }

  function handleSkipConfirm(reason: SkipReason, note: string) {
    setSkipReason(reason);
    setSkipNote(note);
    setPageState("skipped");
    toast(`WOD skipped (${SKIP_REASON_LABELS[reason]}). Your coach has been notified.`);
  }

  const elapsedMin = Math.max(1, Math.round((Date.now() - startTime) / 60000));

  return (
    <AppShell>
      <div className="px-4 pb-24 max-w-lg mx-auto pt-4 space-y-5">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link href="/app/player">
            <a className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/30 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </a>
          </Link>
          <div>
            <p
              className="text-[10px] uppercase tracking-widest font-mono"
              style={{ color: ACCENT }}
            >
              Today's WOD
            </p>
            <h1 className="text-xl font-bold leading-tight">{wod.title}</h1>
          </div>
          {todayWodRecord.coachModification && (
            <span
              className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full"
              style={{
                background: WARNING.replace(")", " / 0.12)"),
                color: WARNING,
              }}
            >
              Modified
            </span>
          )}
        </div>

        {/* ── WOD meta ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-xl border px-4 py-3 flex items-center gap-5"
          style={{ borderColor: "oklch(0.24 0.01 260)", background: "oklch(0.12 0.005 260)" }}
        >
          <StatPill
            icon={<Clock className="w-3.5 h-3.5" />}
            label={`${wod.durationMin} min`}
          />
          <StatPill
            icon={<Target className="w-3.5 h-3.5" />}
            label={`Level ${wod.level}`}
          />
          <StatPill
            icon={<Sparkles className="w-3.5 h-3.5" />}
            label={`+${wod.xp} XP`}
            color={ACCENT}
          />
          <StatPill
            icon={<Dumbbell className="w-3.5 h-3.5" />}
            label={`${wod.drills.length} drills`}
          />
        </div>

        {/* ── State machine ────────────────────────────────────────────────── */}
        {pageState === "not_started" && (
          <NotStartedView
            coachModification={todayWodRecord.coachModification}
            onStart={handleStart}
            onSkip={() => setPageState("skip_form")}
          />
        )}

        {pageState === "in_progress" && (
          <InProgressView
            drills={wod.drills}
            doneDrills={doneDrills}
            onToggleDrill={toggleDrill}
            onComplete={handleComplete}
            onSkip={() => setPageState("skip_form")}
          />
        )}

        {pageState === "skip_form" && (
          <SkipView
            onConfirm={handleSkipConfirm}
            onCancel={() => setPageState(doneDrills.size > 0 ? "in_progress" : "not_started")}
          />
        )}

        {pageState === "completed" && (
          <CompletedView
            drillsDone={doneDrills.size === 0 ? wod.drills.length : doneDrills.size}
            drillsTotal={wod.drills.length}
            elapsed={elapsedMin}
            xp={wod.xp}
          />
        )}

        {pageState === "skipped" && (
          <SkippedView reason={skipReason} note={skipNote} />
        )}

        {/* ── Drill list (shown in not_started state only) ──────────────────── */}
        {pageState === "not_started" && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
              Drills · {wod.drills.length}
            </p>
            {wod.drills.map((d, i) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.11 0.005 260)" }}
              >
                <span
                  className="w-6 text-[11px] font-mono shrink-0 text-center"
                  style={{ color: MUTED }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{d.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                    {d.sets} × {d.reps}
                    {d.skillFocus && (
                      <span style={{ color: ACCENT.replace(")", " / 0.70)") }}>
                        {" · "}{d.skillFocus.split(" · ")[0]}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 7-day WOD history ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
              Recent WODs
            </span>
            <span className="text-[11px]" style={{ color: MUTED }}>Last 7 days</span>
          </div>
          <div className="px-4 py-2">
            {myWodHistory.slice(0, 7).map((w) => (
              <WodHistoryRow key={w.id} wod={w} />
            ))}
          </div>
        </div>

        {/* Completion streak callout */}
        <div
          className="rounded-xl border px-4 py-3 flex items-center gap-3"
          style={{
            borderColor: "oklch(0.22 0.01 260)",
            background: "oklch(0.11 0.005 260)",
          }}
        >
          <Flame className="w-4 h-4 shrink-0" style={{ color: "oklch(0.72 0.20 50)" }} />
          <p className="text-[12.5px] text-muted-foreground">
            Complete today's WOD to protect your{" "}
            <span className="font-semibold text-foreground">5-day streak</span>.
          </p>
          <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground ml-auto" />
        </div>

      </div>
    </AppShell>
  );
}
