/**
 * CoachClipPage — /app/coach/clips/:clipId
 *
 * Full clip detail view with:
 *  - Video mock with telestration overlay
 *  - Clip metadata: category, AI confidence, detected players, timestamps
 *  - 6 clip action buttons with completion tracking
 *  - Player assignment list (who's been assigned + completion state)
 *  - IDP evidence section (shows when clip is attached to a development goal)
 *  - Export / share action
 *  - Not-found fallback
 */

import React, { useState } from "react";
import { Link, useParams } from "wouter";
import {
  Film,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  ChevronLeft,
  Users,
  Target,
  ClipboardList,
  BookOpen,
  MessageSquare,
  Share2,
  Download,
  Eye,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  getClipById,
  getAssignmentsForClip,
  getFilmById,
  FILM_EVIDENCE,
  CLIP_CATEGORY_COLORS,
  type ExtractedClip,
  type ClipCategory,
  type AssignmentState,
  type ClipAssignment,
} from "@/lib/mock/film";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT  = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";
const INFO    = "oklch(0.65 0.15 230)";

const CATEGORY_OPTIONS: ClipCategory[] = [
  "Finishing", "Defense", "Transition", "Ball Handling",
  "Shooting", "Playmaking", "Footwork", "Screen Execution", "Off-Ball", "Communication",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confColor(conf: number): string {
  if (conf >= 0.75) return SUCCESS;
  if (conf >= 0.65) return WARNING;
  return DANGER;
}

const ASSIGNMENT_STATE_CONFIG: Record<AssignmentState, { label: string; color: string }> = {
  assigned:          { label: "Assigned",          color: MUTED   },
  watched:           { label: "Watched",            color: INFO    },
  response_submitted:{ label: "Response submitted", color: SUCCESS },
  coach_reviewed:    { label: "Coach reviewed",     color: ACCENT  },
};

function formatIso(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// ─── Video mock ───────────────────────────────────────────────────────────────

function VideoMock({ startTime, endTime }: { startTime: string; endTime: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden aspect-video relative w-full"
      style={{ background: "oklch(0.10 0.005 260)" }}
    >
      {/* Gradient fill */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, oklch(0.22 0.05 260) 0%, oklch(0.10 0.005 260) 70%)",
        }}
      />
      {/* Court lines */}
      <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full opacity-20">
        <line x1="400" y1="0" x2="400" y2="450" stroke="white" strokeWidth="1" />
        <circle cx="400" cy="225" r="60" stroke="white" strokeWidth="1" fill="none" />
        <rect x="500" y="0" width="200" height="150" stroke="white" strokeWidth="1" fill="none" />
        <rect x="100" y="300" width="200" height="150" stroke="white" strokeWidth="1" fill="none" />
      </svg>
      {/* Telestration: player circle + path arrow */}
      <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full pointer-events-none">
        <circle cx="520" cy="180" r="30" stroke={DANGER} strokeWidth="2.5" fill="none" />
        <path d="M520 180 Q440 140 330 200" stroke={DANGER} strokeWidth="2" fill="none" strokeDasharray="6 3" />
        <polygon points="330,200 342,193 342,207" fill={DANGER} />
        {/* Secondary highlight */}
        <circle cx="200" cy="350" r="20" stroke={SUCCESS} strokeWidth="2" fill={SUCCESS.replace(")", " / 0.08)")} />
      </svg>
      {/* HUD bottom */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white text-xs">
          ▶
        </div>
        <div className="flex-1 h-1 rounded-full bg-white/20 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[28%]" style={{ background: ACCENT }} />
        </div>
        <span className="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded font-mono">
          {startTime} — {endTime}
        </span>
      </div>
      {/* Clip label overlay */}
      <div className="absolute top-3 left-3">
        <span
          className="text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: "oklch(0 0 0 / 0.70)", color: "white" }}
        >
          CLIP
        </span>
      </div>
      {/* Telestration toolbar */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {["→", "○", "✕"].map((t) => (
          <button
            key={t}
            type="button"
            className="w-8 h-8 rounded-md bg-black/60 text-white text-sm hover:bg-primary hover:text-black transition font-semibold"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AI confidence ring ───────────────────────────────────────────────────────

function ConfidenceRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = confColor(value);
  const circumference = 2 * Math.PI * 28;
  const dash = value * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 shrink-0">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="oklch(0.20 0.01 260)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-[13px] font-semibold" style={{ color }}>
          {value >= 0.75 ? "High confidence" : value >= 0.65 ? "Moderate confidence" : "Low confidence"}
        </p>
        <p className="text-[11px]" style={{ color: MUTED }}>AI analysis score</p>
      </div>
    </div>
  );
}

// ─── Low-confidence confirm panel ─────────────────────────────────────────────

function ConfirmPanel({
  clip,
  onConfirm,
  onOverride,
}: {
  clip: ExtractedClip;
  onConfirm: () => void;
  onOverride: (cat: ClipCategory, note: string) => void;
}) {
  const [mode, setMode] = useState<"idle" | "override">("idle");
  const [cat, setCat] = useState<ClipCategory>(clip.category);
  const [note, setNote] = useState("");

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        borderColor: WARNING.replace(")", " / 0.30)"),
        background: WARNING.replace(")", " / 0.05)"),
      }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: WARNING }}>
        <AlertTriangle className="w-4 h-4" />
        Low confidence — confirm before actioning
      </p>
      <p className="text-[13px] leading-snug">
        <span className="font-semibold">AI says: </span>{clip.aiMessage}
      </p>

      {mode === "idle" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-colors"
            style={{ background: SUCCESS.replace(")", " / 0.15)"), color: SUCCESS }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm AI label
          </button>
          <button
            type="button"
            onClick={() => setMode("override")}
            className="flex-1 py-2.5 rounded-lg border border-border text-[13px] font-medium hover:bg-muted/30 transition-colors"
          >
            Override label
          </button>
        </div>
      )}

      {mode === "override" && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: MUTED }}>
            Select correct category
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className="py-2 px-2.5 rounded-lg border text-[12px] font-medium text-left transition-colors"
                style={
                  cat === c
                    ? { borderColor: ACCENT.replace(")", " / 0.50)"), background: ACCENT.replace(")", " / 0.10)"), color: ACCENT }
                    : { borderColor: "oklch(0.24 0.01 260)", color: MUTED }
                }
              >
                {c}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Override note (optional)"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-[12px] resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOverride(cat, note)}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold"
              style={{ background: ACCENT, color: "white" }}
            >
              Apply override
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="px-4 py-2.5 rounded-lg border border-border text-[13px] hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Clip action bar ──────────────────────────────────────────────────────────

type ClipAction = "assign" | "goal" | "plan" | "scout" | "response" | "export";

const CLIP_ACTIONS: {
  id: ClipAction;
  label: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
}[] = [
  { id: "assign",   label: "Assign to player",        icon: <Users className="w-4 h-4" />,         color: ACCENT,   desc: "Send this clip for individual review" },
  { id: "goal",     label: "Attach to goal",           icon: <Target className="w-4 h-4" />,        color: SUCCESS,  desc: "Add as IDP evidence on a development goal" },
  { id: "plan",     label: "Add to practice plan",     icon: <ClipboardList className="w-4 h-4" />, color: WARNING,  desc: "Include in the next practice session" },
  { id: "scout",    label: "Add to scout report",      icon: <BookOpen className="w-4 h-4" />,      color: DANGER,   desc: "Flag for opponent or player scouting" },
  { id: "response", label: "Request response",         icon: <MessageSquare className="w-4 h-4" />, color: INFO,     desc: "Ask player to record a video response" },
  { id: "export",   label: "Export / share",           icon: <Share2 className="w-4 h-4" />,        color: MUTED,    desc: "Download or copy sharable link" },
];

function InlineForm({
  label,
  placeholder,
  preset,
  playerSelect,
  onSubmit,
  onCancel,
  color,
}: {
  label: string;
  placeholder: string;
  preset?: string;
  playerSelect?: string[];
  onSubmit: (val: string) => void;
  onCancel: () => void;
  color: string;
}) {
  const [val, setVal] = useState(preset ?? (playerSelect?.[0] ?? ""));

  return (
    <div
      className="rounded-xl border p-4 space-y-3 mt-3"
      style={{
        borderColor: color.replace(")", " / 0.25)"),
        background: color.replace(")", " / 0.04)"),
      }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color }}>
        {label}
      </p>
      {playerSelect && playerSelect.length > 1 ? (
        <select
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] focus:outline-none"
        >
          {playerSelect.map((p) => <option key={p}>{p}</option>)}
        </select>
      ) : (
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(val)}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
          style={{ background: color, color: "white" }}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-[13px] hover:bg-muted/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ClipActionPanel({ clip }: { clip: ExtractedClip }) {
  const [active, setActive] = useState<ClipAction | null>(null);
  const [completed, setCompleted] = useState<Set<ClipAction>>(() => {
    const done = new Set<ClipAction>();
    if (clip.actionState.assignedToPlayerId)  done.add("assign");
    if (clip.actionState.linkedGoalId)        done.add("goal");
    if (clip.actionState.addedToPracticePlan) done.add("plan");
    if (clip.actionState.addedToScoutReport)  done.add("scout");
    if (clip.actionState.responseRequested)   done.add("response");
    return done;
  });

  function doAction(action: ClipAction, _val: string) {
    const msgs: Record<ClipAction, string> = {
      assign:   `Clip assigned to ${clip.detectedPlayerNames[0] ?? "player"}.`,
      goal:     "Clip attached to development goal as evidence.",
      plan:     "Added to next practice plan.",
      scout:    "Added to scout report.",
      response: "Player response requested.",
      export:   "Sharable link copied to clipboard.",
    };
    toast.success(msgs[action]);
    setCompleted((prev) => new Set([...Array.from(prev), action]));
    setActive(null);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CLIP_ACTIONS.map((act) => {
          const done = completed.has(act.id);
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => {
                if (act.id === "export") {
                  doAction("export", "");
                  return;
                }
                setActive(active === act.id ? null : act.id);
              }}
              className="flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all"
              style={
                done
                  ? { borderColor: SUCCESS.replace(")", " / 0.30)"), background: SUCCESS.replace(")", " / 0.07)"), color: SUCCESS }
                  : active === act.id
                  ? { borderColor: act.color.replace(")", " / 0.40)"), background: act.color.replace(")", " / 0.08)"), color: act.color }
                  : { borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.12 0.005 260)", color: MUTED }
              }
            >
              <div className="flex items-center gap-2">
                {done ? <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} /> : act.icon}
                <span className="text-[12px] font-semibold" style={{ color: done ? SUCCESS : undefined }}>
                  {done ? "Done" : act.label}
                </span>
              </div>
              <span className="text-[11px] leading-snug" style={{ color: MUTED }}>
                {act.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline forms */}
      {active === "assign" && (
        <InlineForm
          label="Assign to player"
          playerSelect={clip.detectedPlayerNames.length > 0 ? clip.detectedPlayerNames : ["Player"]}
          placeholder="Select player"
          onSubmit={(val) => doAction("assign", val)}
          onCancel={() => setActive(null)}
          color={ACCENT}
        />
      )}
      {active === "goal" && (
        <InlineForm
          label="Attach to development goal"
          preset={clip.actionState.linkedGoalTitle ?? "Jalen Carter — Shooting Goal"}
          placeholder="Search goals…"
          onSubmit={(val) => doAction("goal", val)}
          onCancel={() => setActive(null)}
          color={SUCCESS}
        />
      )}
      {active === "plan" && (
        <InlineForm
          label="Add to practice plan"
          preset="Thursday — Pre-Westbury Sharpening"
          placeholder="Select plan…"
          onSubmit={(val) => doAction("plan", val)}
          onCancel={() => setActive(null)}
          color={WARNING}
        />
      )}
      {active === "scout" && (
        <InlineForm
          label="Add to scout report"
          preset="South Texas Showcase — Oak Hill Academy"
          placeholder="Select report…"
          onSubmit={(val) => doAction("scout", val)}
          onCancel={() => setActive(null)}
          color={DANGER}
        />
      )}
      {active === "response" && (
        <InlineForm
          label="Request player response"
          playerSelect={clip.detectedPlayerNames.length > 0 ? clip.detectedPlayerNames : ["Player"]}
          placeholder="Select player…"
          onSubmit={(val) => doAction("response", val)}
          onCancel={() => setActive(null)}
          color={INFO}
        />
      )}
    </div>
  );
}

// ─── Assignment list ──────────────────────────────────────────────────────────

function AssignmentRow({ assignment }: { assignment: ClipAssignment }) {
  const cfg = ASSIGNMENT_STATE_CONFIG[assignment.completionState];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.12 0.005 260)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Initials avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{ background: ACCENT.replace(")", " / 0.15)"), color: ACCENT }}
        >
          {assignment.playerInitials}
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[13px] font-semibold">{assignment.playerName}</p>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
            <Clock className="w-3 h-3" />
            <span>Due {formatIso(assignment.dueDate)}</span>
            <span>·</span>
            <span>{assignment.watchPercent}% watched</span>
            {assignment.responseRequired && (
              <>
                <span>·</span>
                <MessageSquare className="w-3 h-3" style={{ color: INFO }} />
                <span style={{ color: INFO }}>Response required</span>
              </>
            )}
          </div>
        </div>

        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: cfg.color.replace(")", " / 0.12)"), color: cfg.color }}
        >
          {cfg.label}
        </span>
      </button>

      {/* Expanded: player note + coach feedback */}
      {expanded && (assignment.playerNote || assignment.coachFeedback) && (
        <div
          className="px-4 pb-4 pt-2 space-y-3 border-t"
          style={{ borderColor: "oklch(0.18 0.005 260)" }}
        >
          {assignment.playerNote && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                Player note
              </p>
              <p className="text-[12.5px] leading-relaxed">{assignment.playerNote}</p>
            </div>
          )}
          {assignment.coachFeedback && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
                Coach feedback
              </p>
              <p className="text-[12.5px] leading-relaxed">{assignment.coachFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── IDP evidence section ─────────────────────────────────────────────────────

function IDPEvidenceSection({ clipId, goalId, goalTitle, goalPlayerId }: {
  clipId: string;
  goalId?: string;
  goalTitle?: string;
  goalPlayerId?: string;
}) {
  const evidence = FILM_EVIDENCE.filter((e) => e.filmClipId === clipId);

  if (evidence.length === 0 && !goalId) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" style={{ color: SUCCESS }} />
        <p className="text-[13px] font-semibold">IDP Evidence</p>
      </div>

      {goalId && (
        <div
          className="rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3"
          style={{ borderColor: SUCCESS.replace(")", " / 0.25)"), background: SUCCESS.replace(")", " / 0.05)") }}
        >
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />
            <div>
              <p className="text-[12px] font-semibold">{goalTitle}</p>
              <p className="text-[11px]" style={{ color: MUTED }}>
                Clip attached as development evidence
              </p>
            </div>
          </div>
          {goalPlayerId && (
            <Link href={`/app/coach/players/${goalPlayerId}/idp`}>
              <a
                className="flex items-center gap-1 text-[11px] font-semibold shrink-0"
                style={{ color: SUCCESS }}
              >
                View IDP
                <ArrowRight className="w-3 h-3" />
              </a>
            </Link>
          )}
        </div>
      )}

      {evidence.map((ev) => (
        <div
          key={ev.id}
          className="rounded-lg border px-3 py-2.5 space-y-1"
          style={{ borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.12 0.005 260)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 shrink-0" style={{ color: ACCENT }} />
            <p className="text-[12px] font-semibold">{ev.title}</p>
            {ev.sentiment === "positive" && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto shrink-0"
                style={{ background: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS }}
              >
                Positive
              </span>
            )}
            {ev.sentiment === "concern" && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-auto shrink-0"
                style={{ background: DANGER.replace(")", " / 0.12)"), color: DANGER }}
              >
                Concern
              </span>
            )}
          </div>
          <p className="text-[11.5px] leading-snug" style={{ color: MUTED }}>
            {ev.summary}
          </p>
          <p className="text-[10px]" style={{ color: MUTED }}>{ev.date}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Not found ────────────────────────────────────────────────────────────────

function NotFoundCard() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center space-y-3">
      <AlertCircle className="w-8 h-8 mx-auto" style={{ color: DANGER }} />
      <p className="text-[16px] font-semibold">Clip not found</p>
      <p className="text-[13px] text-muted-foreground">
        This clip doesn't exist or may have been removed.
      </p>
      <Link href="/app/coach/queue">
        <a className="text-[13px] font-semibold" style={{ color: ACCENT }}>
          ← Back to review queue
        </a>
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoachClipPage(): React.ReactElement {
  const params = useParams<{ clipId: string }>();
  const clipId = params.clipId ?? "";

  const clip = getClipById(clipId);
  const assignments = getAssignmentsForClip(clipId);

  const [confirmed, setConfirmed] = useState(!clip?.needsConfirmation);
  const [overrideLabel, setOverrideLabel] = useState<ClipCategory | null>(null);

  if (!clip) {
    return (
      <AppShell>
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <NotFoundCard />
        </div>
      </AppShell>
    );
  }

  const film = getFilmById(clip.filmId);
  const catColor = CLIP_CATEGORY_COLORS[overrideLabel ?? clip.category] ?? ACCENT;
  const displayCategory = overrideLabel ?? clip.category;

  function handleConfirm() {
    setConfirmed(true);
    toast.success("AI label confirmed. Clip is ready to action.");
  }

  function handleOverride(cat: ClipCategory, _note: string) {
    setOverrideLabel(cat);
    setConfirmed(true);
    toast.success(`Label overridden to "${cat}".`);
  }

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-5xl mx-auto pt-4 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] flex-wrap" style={{ color: MUTED }}>
          <Link href="/app/coach/queue">
            <a className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Review Queue
            </a>
          </Link>
          {film && (
            <>
              <span>·</span>
              <Link href={`/app/coach/queue/${film.id}`}>
                <a className="hover:text-foreground transition-colors truncate max-w-[160px]">
                  {film.title}
                </a>
              </Link>
            </>
          )}
          <span>·</span>
          <span className="text-foreground font-medium truncate">{clip.title}</span>
        </div>

        {/* Header */}
        <PageHeader
          eyebrow="Coach · Film · Clip"
          title={clip.title}
          subtitle={`${displayCategory} · ${clip.startTime} – ${clip.endTime}${clip.severity === "major" ? " · Major flag" : ""}`}
          actions={
            clip.actionState.isReviewed ? (
              <span
                className="flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS }}
              >
                <CheckCheck className="w-4 h-4" /> Reviewed
              </span>
            ) : null
          }
        />

        {/* Main 2-col layout */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-5">
          {/* ── Left column ── */}
          <div className="space-y-5">
            {/* Video mock */}
            <VideoMock startTime={clip.startTime} endTime={clip.endTime} />

            {/* Clip metadata card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              {/* Category + confidence row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{ background: catColor.replace(")", " / 0.12)"), color: catColor }}
                  >
                    {displayCategory}
                    {overrideLabel && (
                      <span className="ml-1 opacity-70">(overridden)</span>
                    )}
                  </span>
                  {clip.severity === "major" && (
                    <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: DANGER }}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Major flag
                    </div>
                  )}
                </div>
                <ConfidenceRing value={clip.aiConfidence} />
              </div>

              {/* AI message */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                  AI Analysis
                </p>
                <p className="text-[13px] leading-relaxed">{clip.aiMessage}</p>
              </div>

              {/* Detected players */}
              {clip.detectedPlayerNames.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                    Detected players
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {clip.detectedPlayerNames.map((name, i) => (
                      <Link
                        key={name}
                        href={`/app/coach/players/${clip.detectedPlayerIds[i] ?? "#"}`}
                      >
                        <a
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors hover:brightness-110"
                          style={{ background: ACCENT.replace(")", " / 0.10)"), color: ACCENT }}
                        >
                          <Users className="w-3 h-3" />
                          {name}
                        </a>
                      </Link>
                    ))}
                    {clip.detectedPlayerNames.length === 0 && (
                      <span className="text-[12px]" style={{ color: MUTED }}>No player detected</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {clip.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {clip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "oklch(0.20 0.01 260)", color: MUTED }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Low-confidence review workflow */}
            {clip.needsConfirmation && !confirmed && (
              <ConfirmPanel
                clip={clip}
                onConfirm={handleConfirm}
                onOverride={handleOverride}
              />
            )}

            {/* Clip actions */}
            {confirmed && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-[13px] font-semibold">Clip Actions</p>
                <ClipActionPanel clip={clip} />
              </div>
            )}

            {/* Blocked message when not yet confirmed */}
            {clip.needsConfirmation && !confirmed && (
              <div
                className="rounded-xl border px-4 py-3 flex items-center gap-3"
                style={{
                  borderColor: WARNING.replace(")", " / 0.25)"),
                  background: WARNING.replace(")", " / 0.04)"),
                }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: WARNING }} />
                <p className="text-[12.5px]" style={{ color: MUTED }}>
                  Confirm or override the AI label above to unlock clip actions.
                </p>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">
            {/* IDP evidence */}
            <IDPEvidenceSection
              clipId={clip.id}
              goalId={clip.actionState.linkedGoalId}
              goalTitle={clip.actionState.linkedGoalTitle}
              goalPlayerId={clip.actionState.linkedGoalPlayerId}
            />

            {/* Existing action badges summary */}
            {(clip.actionState.assignedToPlayerName ||
              clip.actionState.addedToPracticePlan ||
              clip.actionState.addedToScoutReport ||
              clip.actionState.responseRequested) && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-[13px] font-semibold">Action summary</p>
                <div className="flex flex-col gap-2">
                  {clip.actionState.assignedToPlayerName && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <Users className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                      <span>Assigned to <strong>{clip.actionState.assignedToPlayerName}</strong></span>
                    </div>
                  )}
                  {clip.actionState.addedToPracticePlan && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <ClipboardList className="w-3.5 h-3.5" style={{ color: WARNING }} />
                      <span>Added to practice plan</span>
                      {clip.actionState.practicePlanNote && (
                        <span className="text-[11px]" style={{ color: MUTED }}>
                          · {clip.actionState.practicePlanNote}
                        </span>
                      )}
                    </div>
                  )}
                  {clip.actionState.addedToScoutReport && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <BookOpen className="w-3.5 h-3.5" style={{ color: DANGER }} />
                      <span>Added to scout report</span>
                    </div>
                  )}
                  {clip.actionState.responseRequested && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <MessageSquare className="w-3.5 h-3.5" style={{ color: INFO }} />
                      <span>Player response requested</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignment completion tracking */}
            {assignments.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" style={{ color: ACCENT }} />
                  <p className="text-[13px] font-semibold">Assignments</p>
                  <span
                    className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: ACCENT.replace(")", " / 0.12)"), color: ACCENT }}
                  >
                    {assignments.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {assignments.map((a) => (
                    <AssignmentRow key={a.id} assignment={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Export / download */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-[13px] font-semibold">Export</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => toast.success("Sharable link copied to clipboard.")}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border text-[12px] font-medium hover:bg-muted/30 transition-colors text-left"
                >
                  <Share2 className="w-4 h-4" style={{ color: ACCENT }} />
                  Copy sharable link
                </button>
                <button
                  type="button"
                  onClick={() => toast.success("Clip download initiated.")}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border text-[12px] font-medium hover:bg-muted/30 transition-colors text-left"
                >
                  <Download className="w-4 h-4" style={{ color: MUTED }} />
                  Download clip
                </button>
              </div>
            </div>

            {/* Source film link */}
            {film && (
              <Link href={`/app/coach/queue/${film.id}`}>
                <a
                  className="flex items-center gap-2.5 rounded-xl border border-border px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <Film className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate">{film.title}</p>
                    <p className="text-[11px]" style={{ color: MUTED }}>Source film · {film.date}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                </a>
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
