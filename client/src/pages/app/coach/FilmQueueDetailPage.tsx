/**
 * FilmQueueDetailPage — /app/coach/queue/:videoId
 *
 * Queue detail screen with:
 *  - AI confidence meter + film metadata
 *  - Extracted clips with category, severity, detected players
 *  - Inline clip action bar (assign, goal, practice plan, scout, response)
 *  - Low-confidence review workflow: coach confirms or overrides AI label
 *    before clips can be actioned
 *  - Processing and error states
 */

import React, { useState } from "react";
import { Link, useParams } from "wouter";
import {
  Film,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  Target,
  Users,
  ClipboardList,
  BookOpen,
  MessageSquare,
  CheckCheck,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  FILM_LIBRARY,
  EXTRACTED_CLIPS,
  CLIP_CATEGORY_COLORS,
  STATUS_CONFIG,
  getFilmById,
  getClipsForFilm,
  type ExtractedClip,
  type FilmEntry,
  type ClipCategory,
} from "@/lib/mock/film";
import { MOCK_ISSUES } from "@/lib/mock/action-lanes";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER = "oklch(0.68 0.22 25)";
const MUTED = "oklch(0.55 0.02 260)";
const INFO = "oklch(0.65 0.15 230)";

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

// ─── Video player mock ────────────────────────────────────────────────────────

function VideoMock({ activeTime }: { activeTime: string | null }) {
  return (
    <div
      className="rounded-xl overflow-hidden aspect-video relative w-full"
      style={{ background: "oklch(0.10 0.005 260)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 35% 45%, oklch(0.22 0.05 260) 0%, oklch(0.10 0.005 260) 70%)",
        }}
      />
      {/* Court lines */}
      <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full opacity-20">
        <line x1="400" y1="0" x2="400" y2="450" stroke="white" strokeWidth="1" />
        <circle cx="400" cy="225" r="60" stroke="white" strokeWidth="1" fill="none" />
        <rect x="300" y="0" width="200" height="150" stroke="white" strokeWidth="1" fill="none" />
      </svg>
      {/* Telestration */}
      <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full pointer-events-none">
        <circle cx="280" cy="170" r="28" stroke={WARNING} strokeWidth="2.5" fill="none" />
        <path d="M280 170 Q360 100 480 150" stroke={WARNING} strokeWidth="2" fill="none" strokeDasharray="5 3" />
        <polygon points="480,150 470,143 470,157" fill={WARNING} />
      </svg>
      {/* HUD */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white text-xs">
          ▶
        </div>
        <div className="flex-1 h-1 rounded-full bg-white/20 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[38%] bg-primary" />
          {[14, 37, 62, 104].map((t) => (
            <div
              key={t}
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
              style={{ left: `${(t / 120) * 100}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded font-mono">
          {activeTime ?? "0:00"} / 1:38
        </span>
      </div>
      {/* Tools */}
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

// ─── AI confidence meter ──────────────────────────────────────────────────────

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = confColor(value);
  const circumference = 2 * Math.PI * 28;
  const dash = (value * circumference);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 shrink-0">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="oklch(0.20 0.01 260)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div>
        <p className="text-[12px] font-semibold" style={{ color }}>
          {value >= 0.75 ? "High confidence" : value >= 0.65 ? "Moderate confidence" : "Low confidence"}
        </p>
        <p className="text-[11px]" style={{ color: MUTED }}>
          {value < 0.70 ? "Coach review required before actioning clips" : "AI analysis complete"}
        </p>
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
      className="rounded-xl border p-3 space-y-2.5 mt-2"
      style={{
        borderColor: WARNING.replace(")", " / 0.30)"),
        background: WARNING.replace(")", " / 0.05)"),
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: WARNING }}>
        <AlertTriangle className="inline w-3 h-3 mr-1" />
        Low confidence — confirm before actioning
      </p>
      <p className="text-[12px] leading-snug">
        <span className="font-semibold">AI says:</span> {clip.aiMessage}
      </p>

      {mode === "idle" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-colors"
            style={{ background: SUCCESS.replace(")", " / 0.15)"), color: SUCCESS }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm AI label
          </button>
          <button
            type="button"
            onClick={() => setMode("override")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-[12px] font-medium hover:bg-muted/30 transition-colors"
          >
            Override label
          </button>
        </div>
      )}

      {mode === "override" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className="py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left transition-colors"
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
            placeholder="Add override note (optional)"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-[12px] resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOverride(cat, note)}
              className="flex-1 py-2 rounded-lg text-[12px] font-semibold"
              style={{ background: ACCENT, color: "white" }}
            >
              Apply override
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="px-3 py-2 rounded-lg border border-border text-[12px] font-medium hover:bg-muted/30 transition-colors"
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

type ClipAction = "assign" | "goal" | "plan" | "scout" | "response" | "note";

const CLIP_ACTIONS: { id: ClipAction; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "assign", label: "Assign to player", icon: <Users className="w-3.5 h-3.5" />, color: ACCENT },
  { id: "goal", label: "Attach to goal", icon: <Target className="w-3.5 h-3.5" />, color: SUCCESS },
  { id: "plan", label: "Add to practice plan", icon: <ClipboardList className="w-3.5 h-3.5" />, color: WARNING },
  { id: "scout", label: "Add to scout report", icon: <BookOpen className="w-3.5 h-3.5" />, color: DANGER },
  { id: "response", label: "Request player response", icon: <MessageSquare className="w-3.5 h-3.5" />, color: INFO },
  { id: "note", label: "Open full clip", icon: <ChevronRight className="w-3.5 h-3.5" />, color: MUTED },
];

function InlineActionBar({ clip }: { clip: ExtractedClip }) {
  const [active, setActive] = useState<ClipAction | null>(null);
  const [completed, setCompleted] = useState<Set<ClipAction>>(new Set());

  function doAction(action: ClipAction, note: string) {
    const msgs: Record<ClipAction, string> = {
      assign: `Clip assigned to ${clip.detectedPlayerNames[0] ?? "player"}.`,
      goal: "Clip attached to development goal as evidence.",
      plan: "Added to next practice plan.",
      scout: "Added to scout report.",
      response: "Player response requested.",
      note: "",
    };
    toast.success(msgs[action]);
    setCompleted((prev) => new Set([...Array.from(prev), action]));
    setActive(null);
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex flex-wrap gap-1.5">
        {CLIP_ACTIONS.map((act) => {
          const done = completed.has(act.id);
          return act.id === "note" ? (
            <Link key={act.id} href={`/app/coach/clips/${clip.id}`}>
              <a
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors hover:bg-muted/30"
                style={{ borderColor: "oklch(0.24 0.01 260)", color: MUTED }}
              >
                {act.icon}
                {act.label}
              </a>
            </Link>
          ) : (
            <button
              key={act.id}
              type="button"
              onClick={() => setActive(active === act.id ? null : act.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all"
              style={
                done
                  ? { borderColor: SUCCESS.replace(")", " / 0.30)"), background: SUCCESS.replace(")", " / 0.08)"), color: SUCCESS }
                  : active === act.id
                  ? { borderColor: act.color.replace(")", " / 0.50)"), background: act.color.replace(")", " / 0.10)"), color: act.color }
                  : { borderColor: "oklch(0.24 0.01 260)", color: MUTED }
              }
            >
              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : act.icon}
              {done ? "Done" : act.label}
            </button>
          );
        })}
      </div>

      {/* Inline forms */}
      {active === "assign" && (
        <InlineForm
          label="Assign to player"
          playerSelect={clip.detectedPlayerNames}
          placeholder="Select player or type name"
          onSubmit={(val) => doAction("assign", val)}
          onCancel={() => setActive(null)}
          color={ACCENT}
        />
      )}
      {active === "goal" && (
        <InlineForm
          label="Attach to development goal"
          preset="Jalen Carter — Shooting Goal"
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
          playerSelect={clip.detectedPlayerNames}
          placeholder="Select player…"
          onSubmit={(val) => doAction("response", val)}
          onCancel={() => setActive(null)}
          color={INFO}
        />
      )}
    </div>
  );
}

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
      className="rounded-xl border p-3 space-y-2"
      style={{
        borderColor: color.replace(")", " / 0.25)"),
        background: color.replace(")", " / 0.04)"),
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
        {label}
      </p>
      {playerSelect && playerSelect.length > 1 ? (
        <select
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[12px] focus:outline-none"
        >
          {playerSelect.map((p) => <option key={p}>{p}</option>)}
        </select>
      ) : (
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(val)}
          className="flex-1 py-2 rounded-lg text-[12px] font-semibold"
          style={{ background: color, color: "white" }}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg border border-border text-[12px] hover:bg-muted/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Clip card ────────────────────────────────────────────────────────────────

function ClipCard({
  clip,
  onActive,
  isActive,
}: {
  clip: ExtractedClip;
  onActive: (t: string) => void;
  isActive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(!clip.needsConfirmation);
  const [overrideApplied, setOverrideApplied] = useState(false);

  const catColor = CLIP_CATEGORY_COLORS[clip.category] ?? ACCENT;
  const isReviewed = clip.actionState.isReviewed;
  const hasActions =
    clip.actionState.assignedToPlayerName ||
    clip.actionState.linkedGoalTitle ||
    clip.actionState.addedToPracticePlan ||
    clip.actionState.addedToScoutReport ||
    clip.actionState.responseRequested;

  function handleConfirm() {
    setConfirmed(true);
    toast.success("AI label confirmed. Clip is ready to action.");
  }

  function handleOverride(cat: ClipCategory, note: string) {
    setConfirmed(true);
    setOverrideApplied(true);
    toast.success(`Label overridden to "${cat}".`);
  }

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        borderColor: isActive
          ? ACCENT.replace(")", " / 0.40)")
          : isReviewed
          ? "oklch(0.22 0.01 260)"
          : clip.needsConfirmation && !confirmed
          ? WARNING.replace(")", " / 0.30)")
          : "oklch(0.22 0.01 260)",
        background: isActive ? ACCENT.replace(")", " / 0.04)") : "oklch(0.12 0.005 260)",
        opacity: isReviewed ? 0.75 : 1,
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => {
          onActive(clip.startTime);
          setExpanded((p) => !p);
        }}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        {/* Timestamp */}
        <span
          className="font-mono text-[11px] shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
          style={{ background: ACCENT.replace(")", " / 0.12)"), color: ACCENT }}
        >
          {clip.startTime}
        </span>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
              style={{ background: catColor.replace(")", " / 0.12)"), color: catColor }}
            >
              {overrideApplied ? "Overridden" : clip.category}
            </span>
            {clip.severity === "major" && (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: DANGER }} />
            )}
            {clip.needsConfirmation && !confirmed && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: WARNING.replace(")", " / 0.12)"), color: WARNING }}
              >
                Needs confirmation
              </span>
            )}
            {confirmed && clip.needsConfirmation && (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: SUCCESS }} />
            )}
            {isReviewed && (
              <span className="ml-auto text-[10px]" style={{ color: SUCCESS }}>
                <CheckCheck className="inline w-3.5 h-3.5 mr-0.5" />Reviewed
              </span>
            )}
          </div>
          <p className="text-[13px] font-semibold">{clip.title}</p>
          <p className="text-[12px] leading-snug" style={{ color: MUTED }}>
            {clip.aiMessage}
          </p>

          {/* Detected players */}
          {clip.detectedPlayerNames.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: MUTED }}>
              <Users className="w-3 h-3" />
              {clip.detectedPlayerNames.join(", ")}
            </div>
          )}

          {/* Existing action badges */}
          {hasActions && (
            <div className="flex flex-wrap gap-1 mt-1">
              {clip.actionState.assignedToPlayerName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: ACCENT.replace(")", " / 0.12)"), color: ACCENT }}>
                  Assigned → {clip.actionState.assignedToPlayerName}
                </span>
              )}
              {clip.actionState.linkedGoalTitle && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS }}>
                  Goal attached
                </span>
              )}
              {clip.actionState.addedToPracticePlan && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: WARNING.replace(")", " / 0.12)"), color: WARNING }}>
                  Practice plan
                </span>
              )}
              {clip.actionState.addedToScoutReport && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: DANGER.replace(")", " / 0.12)"), color: DANGER }}>
                  Scout report
                </span>
              )}
              {clip.actionState.responseRequested && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: INFO.replace(")", " / 0.12)"), color: INFO }}>
                  Response requested
                </span>
              )}
            </div>
          )}
        </div>

        {/* AI confidence pip */}
        <span
          className="text-[10px] font-mono shrink-0 mt-0.5"
          style={{ color: confColor(clip.aiConfidence) }}
        >
          {Math.round(clip.aiConfidence * 100)}%
        </span>
      </button>

      {/* Expanded: confirm panel + action bar */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-[oklch(0.18_0.005_260)] pt-3 space-y-2">
          {clip.needsConfirmation && !confirmed && (
            <ConfirmPanel
              clip={clip}
              onConfirm={handleConfirm}
              onOverride={handleOverride}
            />
          )}
          {(confirmed || !clip.needsConfirmation) && (
            <InlineActionBar clip={clip} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Error + not-found states ─────────────────────────────────────────────────

function NotFoundCard() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center space-y-3">
      <AlertCircle className="w-8 h-8 mx-auto" style={{ color: DANGER }} />
      <p className="text-[15px] font-semibold">Film not found</p>
      <p className="text-[13px] text-muted-foreground">This entry doesn't exist or was deleted.</p>
      <Link href="/app/coach/queue">
        <a className="text-[13px] font-semibold" style={{ color: ACCENT }}>
          ← Back to queue
        </a>
      </Link>
    </div>
  );
}

function FailedCard({ film }: { film: FilmEntry }) {
  return (
    <div
      className="rounded-2xl border px-5 py-8 space-y-3"
      style={{
        borderColor: DANGER.replace(")", " / 0.25)"),
        background: DANGER.replace(")", " / 0.04)"),
      }}
    >
      <AlertCircle className="w-8 h-8" style={{ color: DANGER }} />
      <p className="text-[15px] font-semibold">Processing failed</p>
      {film.errorMessage && (
        <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>
          {film.errorMessage}
        </p>
      )}
      <button
        type="button"
        onClick={() => toast("Re-upload initiated.")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-[13px] font-medium hover:bg-muted/30 transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Retry upload
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FilmQueueDetailPage(): React.ReactElement {
  const params = useParams<{ videoId: string }>();
  const videoId = params.videoId ?? "";

  const film = getFilmById(videoId);
  const clips = getClipsForFilm(videoId);
  const [activeTime, setActiveTime] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);

  if (!film) {
    return (
      <AppShell>
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <NotFoundCard />
        </div>
      </AppShell>
    );
  }

  const cfg = STATUS_CONFIG[film.processingStatus];
  const isLowConf = film.processingStatus === "low_confidence";
  const isFailed = film.processingStatus === "failed";

  const visibleClips = showReviewed
    ? clips
    : clips.filter((c) => !c.actionState.isReviewed || c.needsConfirmation);

  const reviewedCount = clips.filter((c) => c.actionState.isReviewed).length;
  const unconfirmedCount = clips.filter((c) => c.needsConfirmation && !c.actionState.isReviewed).length;

  return (
    <AppShell>
      <div className="px-4 lg:px-8 pb-24 max-w-5xl mx-auto pt-4 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
          <Link href="/app/coach/queue">
            <a className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Review Queue
            </a>
          </Link>
          <span>·</span>
          <span className="text-foreground font-medium truncate">{film.title}</span>
        </div>

        <PageHeader
          eyebrow={`Film · ${cfg.label}`}
          title={film.title}
          subtitle={`${film.date} · ${film.duration ?? "—"} · ${clips.length} clips · ${reviewedCount}/${clips.length} reviewed`}
          actions={
            reviewedCount === clips.length && clips.length > 0 ? (
              <span
                className="flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: SUCCESS.replace(")", " / 0.12)"), color: SUCCESS }}
              >
                <CheckCheck className="w-4 h-4" /> All reviewed
              </span>
            ) : null
          }
        />

        {/* Failed state */}
        {isFailed && <FailedCard film={film} />}

        {/* Main layout */}
        {!isFailed && (
          <div className="grid lg:grid-cols-[1fr_420px] gap-5">
            {/* Left: video + confidence */}
            <div className="space-y-4">
              <VideoMock activeTime={activeTime} />

              {/* Confidence + metadata */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                {film.aiConfidence !== undefined && (
                  <ConfidenceMeter value={film.aiConfidence} />
                )}
                <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-border">
                  {[
                    { label: "Total clips", value: clips.length },
                    { label: "Unreviewed", value: clips.filter((c) => !c.actionState.isReviewed).length, color: ACCENT },
                    { label: "Needs confirm", value: unconfirmedCount, color: unconfirmedCount > 0 ? WARNING : MUTED },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-[18px] font-bold tabular-nums" style={{ color: s.color ?? "inherit" }}>
                        {s.value}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {film.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: ACCENT.replace(")", " / 0.10)"), color: ACCENT }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Low-confidence banner */}
              {isLowConf && (
                <div
                  className="rounded-xl border p-4 space-y-2"
                  style={{
                    borderColor: WARNING.replace(")", " / 0.30)"),
                    background: WARNING.replace(")", " / 0.06)"),
                  }}
                >
                  <p className="text-[13px] font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: WARNING }} />
                    Low-confidence review workflow
                  </p>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
                    AI confidence for this session was below threshold ({Math.round((film.aiConfidence ?? 0) * 100)}%).
                    Each clip must be <strong className="text-foreground">confirmed or overridden</strong> before
                    it can be assigned to players or attached to development goals.
                  </p>
                </div>
              )}
            </div>

            {/* Right: clips */}
            <div className="space-y-3">
              {/* Show/hide reviewed toggle */}
              {reviewedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReviewed((p) => !p)}
                  className="flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/30 transition-colors w-full"
                >
                  {showReviewed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showReviewed ? "Hide reviewed clips" : `Show all (${reviewedCount} reviewed)`}
                </button>
              )}

              {visibleClips.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-4 py-6 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 mx-auto" style={{ color: SUCCESS }} />
                  <p className="text-[13px] font-semibold">All clips reviewed</p>
                </div>
              ) : (
                visibleClips.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    isActive={activeTime === clip.startTime}
                    onActive={setActiveTime}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
