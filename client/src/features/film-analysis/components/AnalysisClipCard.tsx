/**
 * features/film-analysis/components/AnalysisClipCard.tsx
 *
 * The core UI unit for structured basketball film analysis.
 *
 * Three zones, visually distinct:
 *   Zone A — WHAT WAS OBSERVED (objective detections, no interpretation)
 *   Zone B — WHAT WE INFER     (bounded event type + confidence + evidence)
 *   Zone C — COACH REVIEW      (approve / edit / reject / flag for teaching)
 *
 * Design principles:
 *   - Confidence is always visible and color-coded
 *   - "Requires review" is surfaced prominently, not buried
 *   - Evidence items are listed, not described in prose
 *   - Coach decisions are permanent record — edit history preserved
 *   - suggestedCoachNote is templated copy, not hallucinated prose
 */

import { useState } from "react";
import { Film, ChevronDown, ChevronRight, Check, X, AlertTriangle, Edit3, BookOpen, Info, Play, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  COURT_ZONE_LABELS,
  EVENT_LABELS,
  confidenceTier,
} from "../types";
import type {
  AnalysisClip,
  BoundedEventType,
  CoachReviewStatus,
  EvidenceStrength,
} from "../types";

// ── Color tokens ──────────────────────────────────────────────────────────────

const COLORS = {
  high:     "oklch(0.75 0.12 140)",   // green
  medium:   "oklch(0.78 0.16 75)",    // amber
  low:      "oklch(0.68 0.22 25)",    // red
  primary:  "oklch(0.72 0.18 290)",   // purple
  muted:    "oklch(0.55 0.02 260)",
};

const EVIDENCE_STRENGTH_COLOR: Record<EvidenceStrength, string> = {
  strong:   COLORS.high,
  moderate: COLORS.medium,
  weak:     COLORS.low,
};

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ score, requiresReview }: { score: number; requiresReview: boolean }) {
  const tier   = confidenceTier(score);
  const color  = COLORS[tier];
  const pct    = Math.round(score * 100);
  const labels = { high: "High confidence", medium: "Review suggested", low: "Low confidence — review required" };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border"
        style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}
      >
        {pct}% · {labels[tier]}
      </span>
      {requiresReview && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
          style={{ color: COLORS.medium, borderColor: `${COLORS.medium}40`, backgroundColor: `${COLORS.medium}10` }}>
          <AlertTriangle className="w-2.5 h-2.5" />
          Review required
        </span>
      )}
    </div>
  );
}

// ── Coach review status badge ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<CoachReviewStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:             { label: "Pending review",        color: COLORS.muted,   icon: null },
  confirmed:           { label: "Confirmed ✓",           color: COLORS.high,    icon: <Check className="w-3 h-3" /> },
  edited:              { label: "Coach edited",          color: COLORS.primary, icon: <Edit3 className="w-3 h-3" /> },
  rejected:            { label: "Rejected",              color: COLORS.low,     icon: <X className="w-3 h-3" /> },
  flagged_for_teaching:{ label: "Teaching point",        color: COLORS.medium,  icon: <BookOpen className="w-3 h-3" /> },
  uncertain:           { label: "Uncertain — revisit",   color: COLORS.muted,   icon: <span className="font-bold">?</span> },
};

// ── Evidence list ─────────────────────────────────────────────────────────────

function EvidenceList({ evidence }: { evidence: AnalysisClip["inference"]["evidenceItems"] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {evidence.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0"
            style={{ backgroundColor: EVIDENCE_STRENGTH_COLOR[item.strength] }}
          />
          <div className="min-w-0">
            <span className="text-[12px] text-muted-foreground leading-snug">{item.description}</span>
            {item.frameMs !== undefined && (
              <span className="text-[10.5px] text-muted-foreground/50 ml-1.5 font-mono">
                @{Math.floor(item.frameMs / 1000)}s
              </span>
            )}
          </div>
          <span
            className="text-[9.5px] font-mono uppercase tracking-widest shrink-0 mt-[3px]"
            style={{ color: EVIDENCE_STRENGTH_COLOR[item.strength] }}
          >
            {item.strength}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Helpers for boundary editing ──────────────────────────────────────────────

function msToMmSs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function mmSsToMs(str: string): number | null {
  const parts = str.trim().split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s) && s < 60) return (m * 60 + s) * 1000;
  }
  const sec = parseInt(str, 10);
  if (!isNaN(sec) && sec >= 0) return sec * 1000;
  return null;
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface AnalysisClipCardProps {
  clip:     AnalysisClip;
  onReview: (clipId: string, status: CoachReviewStatus, note?: string, editedType?: BoundedEventType) => void;
  isPending?: boolean;
  /** Called when the coach clicks the play button — parent seeks its video player */
  onPreview?: (startMs: number, endMs: number) => void;
  /** Called when the coach saves adjusted boundaries */
  onBoundaryUpdate?: (clipId: string, startMs: number, endMs: number) => void;
  isBoundaryPending?: boolean;
}

export function AnalysisClipCard({ clip, onReview, isPending, onPreview, onBoundaryUpdate, isBoundaryPending }: AnalysisClipCardProps) {
  const [observationsOpen, setObservationsOpen] = useState(false);
  const [editMode, setEditMode]               = useState(false);
  const [editNote, setEditNote]               = useState(clip.coachDecision?.note ?? "");
  const [editedType, setEditedType]           = useState<BoundedEventType | "">(
    (clip.coachDecision?.editedEventType as BoundedEventType | undefined) ?? ""
  );

  // Boundary editing state — seeded from clip's current boundaries
  const [boundaryMode, setBoundaryMode]       = useState(false);
  const [editStartStr, setEditStartStr]       = useState(msToMmSs(clip.startMs));
  const [editEndStr, setEditEndStr]           = useState(msToMmSs(clip.endMs));

  // Auto-expand Zone A for classified clips (real observations vs placeholder)
  const isClassified = clip.observations.length > 1 ||
    (clip.observations[0]?.description !== "Candidate window — confirm or reject this event" &&
     clip.observations[0]?.description !== "Candidate window — review to confirm or reject this event");
  const [observationsOpen, setObservationsOpen] = useState(isClassified);

  const hasDecision = clip.coachDecision !== null;
  const statusCfg   = hasDecision
    ? STATUS_CONFIG[clip.coachDecision!.status]
    : STATUS_CONFIG["pending"];

  const eventLabel = clip.coachDecision?.editedEventType
    ? EVENT_LABELS[clip.coachDecision.editedEventType]
    : EVENT_LABELS[clip.inference.eventType];

  return (
    <div
      className="rounded-2xl border bg-card overflow-hidden"
      style={{
        borderColor: clip.inference.requiresReview
          ? `${COLORS.medium}40`
          : hasDecision
          ? `${statusCfg.color}30`
          : "var(--color-border, oklch(0.22 0.005 260))",
      }}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold tabular-nums">{clip.timestamp}</span>
          {clip.primaryPlayerName && (
            <>
              <span className="text-muted-foreground/30 text-[11px]">·</span>
              <span className="text-[12px] text-muted-foreground">
                {clip.primaryPlayerName}
                {clip.primaryPlayerJersey && ` #${clip.primaryPlayerJersey}`}
              </span>
            </>
          )}
          {clip.observations[0]?.courtZone && clip.observations[0].courtZone !== "unknown" && (
            <>
              <span className="text-muted-foreground/30 text-[11px]">·</span>
              <span className="text-[11px] text-muted-foreground">
                {COURT_ZONE_LABELS[clip.observations[0].courtZone]}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Play button — only when parent has a video player */}
          {onPreview && (
            <button
              onClick={() => onPreview(clip.startMs, clip.endMs)}
              title={`Preview ${msToMmSs(clip.startMs)}–${msToMmSs(clip.endMs)}`}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all hover:brightness-110"
              style={{ backgroundColor: `${COLORS.primary}15`, borderColor: `${COLORS.primary}30`, color: COLORS.primary }}
            >
              <Play className="w-2.5 h-2.5" />
              {msToMmSs(clip.startMs)}
            </button>
          )}
          {/* Scissors — adjust clip boundaries (always available) */}
          {onBoundaryUpdate && !boundaryMode && !editMode && (
            <button
              onClick={() => {
                setEditStartStr(msToMmSs(clip.startMs));
                setEditEndStr(msToMmSs(clip.endMs));
                setBoundaryMode(true);
              }}
              title="Adjust clip boundaries"
              className="p-1 rounded-md text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <Scissors className="w-3 h-3" />
            </button>
          )}
          {hasDecision && (
            <span
              className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full border"
              style={{ color: statusCfg.color, borderColor: `${statusCfg.color}35`, backgroundColor: `${statusCfg.color}10` }}
            >
              {statusCfg.icon}
              {statusCfg.label}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* ── Zone A: Observations ──────────────────────────────────────────── */}
        <div>
          {/* Header row — label + toggle + detection count */}
          <button
            onClick={() => setObservationsOpen((o) => !o)}
            className="flex items-center gap-1.5 w-full text-left mb-2 group"
          >
            <span
              className="text-[10px] font-mono uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
            >
              Observed
            </span>
            <span className="text-[10.5px] text-muted-foreground/60">
              · {clip.observations.length} signal{clip.observations.length !== 1 ? "s" : ""} detected
            </span>
            <span className="ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
              {observationsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
          </button>

          {/* Collapsed summary — show first observation inline */}
          {!observationsOpen && clip.observations[0] && (
            <p className="text-[12px] text-muted-foreground/70 leading-snug pl-1 line-clamp-1 italic">
              {clip.observations[0].description}
            </p>
          )}

          {/* Expanded observation list */}
          {observationsOpen && (
            <div className="flex flex-col gap-2.5 border-l-2 pl-3.5"
              style={{ borderColor: `${COLORS.primary}25` }}
            >
              {clip.observations.map((obs, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.08em]">
                      {obs.type.replace(/_/g, " ")}
                    </span>
                    {obs.frameMs !== undefined && (
                      <span className="text-[9.5px] text-muted-foreground/35 font-mono">
                        @ {msToMmSs(obs.frameMs)}
                      </span>
                    )}
                    <span className="ml-auto text-[9.5px] text-muted-foreground/35 font-mono tabular-nums">
                      {Math.round(obs.detectionConfidence * 100)}% det.
                    </span>
                  </div>
                  <p className="text-[12.5px] text-foreground/80 leading-relaxed">{obs.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Obs → Inference connector ─────────────────────────────────────── */}
        {isClassified && (
          <div className="flex items-center gap-2 -my-2">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[9.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground/40 shrink-0 px-1">
              inferred from above
            </span>
            <div className="flex-1 h-px bg-border/40" />
          </div>
        )}

        {/* ── Zone B: Inference ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${COLORS.medium}15`, color: COLORS.medium }}
            >
              Inferred
            </span>
            <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-[0.06em]">
              · classification
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[16px] font-bold leading-tight">{eventLabel}</div>
              {clip.inference.subLabel && (
                <div className="text-[12px] text-muted-foreground mt-0.5">{clip.inference.subLabel}</div>
              )}
            </div>
            <ConfidenceBadge
              score={clip.inference.confidence}
              requiresReview={clip.inference.requiresReview}
            />
          </div>

          {/* Evidence */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2">
              Evidence ({clip.inference.evidenceItems.length})
            </div>
            <EvidenceList evidence={clip.inference.evidenceItems} />
          </div>

          {/* Alternatives */}
          {clip.inference.alternatives && clip.inference.alternatives.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/50">
              <Info className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <span className="text-[11px] text-muted-foreground/60">Also considered:</span>
              {clip.inference.alternatives.map((alt) => (
                <span
                  key={alt.eventType}
                  className="text-[10.5px] text-muted-foreground/50 font-mono"
                >
                  {EVENT_LABELS[alt.eventType]} ({Math.round(alt.confidence * 100)}%)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Suggested coaching note */}
        {clip.suggestedCoachNote && !hasDecision && (
          <div className="rounded-lg border border-dashed border-border px-3 py-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1">
              Suggested note (editable)
            </div>
            <p className="text-[12.5px] text-muted-foreground italic">{clip.suggestedCoachNote}</p>
          </div>
        )}

        {/* Coach note (if reviewed) */}
        {hasDecision && clip.coachDecision!.note && (
          <div className="rounded-lg border-l-2 border-primary pl-3 py-1.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-primary mb-1">
              Coach note
            </div>
            <p className="text-[12.5px] text-foreground/80 leading-relaxed">
              {clip.coachDecision!.note}
            </p>
          </div>
        )}

        {/* ── Zone C: Coach Review ──────────────────────────────────────────── */}
        {!hasDecision && !editMode && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1">
              Coach review
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={isPending}
                onClick={() => { onReview(clip.id, "confirmed"); toast.success("Confirmed."); }}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold border transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: `${COLORS.high}15`, borderColor: `${COLORS.high}40`, color: COLORS.high }}
              >
                <Check className="w-3.5 h-3.5 inline mr-1" />
                Confirm
              </button>
              <button
                disabled={isPending}
                onClick={() => setEditMode(true)}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold border transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: `${COLORS.primary}12`, borderColor: `${COLORS.primary}35`, color: COLORS.primary }}
              >
                <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                Edit label
              </button>
              <button
                disabled={isPending}
                onClick={() => { onReview(clip.id, "flagged_for_teaching"); toast.success("Flagged for teaching."); }}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold border transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: `${COLORS.medium}12`, borderColor: `${COLORS.medium}35`, color: COLORS.medium }}
              >
                <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                Flag for teaching
              </button>
              <button
                disabled={isPending}
                onClick={() => { onReview(clip.id, "uncertain"); toast("Marked uncertain — stays in review queue."); }}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold border transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: `${COLORS.muted}18`, borderColor: `${COLORS.muted}40`, color: COLORS.muted }}
              >
                <span className="font-bold inline mr-1">?</span>
                Uncertain
              </button>
              <button
                disabled={isPending}
                onClick={() => { onReview(clip.id, "rejected"); toast("Rejected."); }}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold border transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: `${COLORS.low}10`, borderColor: `${COLORS.low}30`, color: COLORS.low }}
              >
                <X className="w-3.5 h-3.5 inline mr-1" />
                Reject
              </button>
            </div>
          </div>
        )}

        {editMode && (
          <div className="flex flex-col gap-3 pt-1 border-t border-border/50">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              Relabel event
            </div>

            {/* Event-type selector */}
            <select
              value={editedType}
              onChange={(e) => setEditedType(e.target.value as BoundedEventType | "")}
              className="w-full px-3 py-2 text-[13px] rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="">— keep current label —</option>
              <optgroup label="Shot Attempt">
                <option value="shot_made_2">2PT Make</option>
                <option value="shot_missed_2">2PT Miss</option>
                <option value="shot_made_3">3PT Make</option>
                <option value="shot_missed_3">3PT Miss</option>
                <option value="free_throw_made">FT Made</option>
                <option value="free_throw_missed">FT Missed</option>
              </optgroup>
              <optgroup label="Drive">
                <option value="drive_left">Drive Left</option>
                <option value="drive_right">Drive Right</option>
              </optgroup>
              <optgroup label="Pass">
                <option value="pass_completed">Pass</option>
                <option value="pass_lob">Lob</option>
              </optgroup>
              <optgroup label="Turnover">
                <option value="turnover_live_ball">Live Ball Turnover</option>
                <option value="turnover_out_of_bounds">Out-of-Bounds TO</option>
              </optgroup>
              <optgroup label="Defense">
                <option value="steal">Steal</option>
                <option value="block">Block</option>
                <option value="closeout">Closeout</option>
                <option value="contest_shot">Shot Contest</option>
              </optgroup>
            </select>

            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              Correction note (required)
            </div>
            <textarea
              autoFocus
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Describe the correction…"
              rows={2}
              className="w-full px-3 py-2 text-[13px] rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <div className="flex items-center gap-2">
              <button
                disabled={!editNote.trim() || isPending}
                onClick={() => {
                  onReview(
                    clip.id,
                    "edited",
                    editNote.trim(),
                    editedType ? (editedType as BoundedEventType) : undefined,
                  );
                  setEditMode(false);
                  toast.success("Saved. Coach review logged.");
                }}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary, color: "#fff" }}
              >
                Save
              </button>
              <button
                onClick={() => { setEditMode(false); setEditNote(""); setEditedType(""); }}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-border transition-all hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {/* ── Boundary editing mode ────────────────────────────────────────── */}
        {boundaryMode && (
          <div className="flex flex-col gap-3 pt-1 border-t border-border/50">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              Adjust clip window
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                  Start (MM:SS)
                </label>
                <input
                  type="text"
                  value={editStartStr}
                  onChange={(e) => setEditStartStr(e.target.value)}
                  placeholder="0:00"
                  className="w-full px-3 py-2 text-[13px] font-mono rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <span className="text-muted-foreground/40 mt-5">→</span>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                  End (MM:SS)
                </label>
                <input
                  type="text"
                  value={editEndStr}
                  onChange={(e) => setEditEndStr(e.target.value)}
                  placeholder="0:10"
                  className="w-full px-3 py-2 text-[13px] font-mono rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Duration preview */}
            {(() => {
              const s = mmSsToMs(editStartStr);
              const e = mmSsToMs(editEndStr);
              const durSec = s !== null && e !== null && e > s
                ? ((e - s) / 1000).toFixed(1)
                : null;
              return (
                <div className="text-[11px] text-muted-foreground">
                  {durSec !== null
                    ? <span>Duration: <span className="font-semibold text-foreground">{durSec}s</span></span>
                    : <span className="text-amber-500">⚠ End must be after start</span>
                  }
                </div>
              );
            })()}

            {/* Preview with new boundaries */}
            {onPreview && (
              <button
                onClick={() => {
                  const s = mmSsToMs(editStartStr);
                  const e = mmSsToMs(editEndStr);
                  if (s !== null && e !== null && e > s) onPreview(s, e);
                }}
                className="flex items-center gap-1.5 w-fit text-[12px] font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Play className="w-3 h-3" />
                Preview new boundaries
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                disabled={isBoundaryPending || (() => {
                  const s = mmSsToMs(editStartStr);
                  const e = mmSsToMs(editEndStr);
                  return s === null || e === null || e <= s;
                })()}
                onClick={() => {
                  const s = mmSsToMs(editStartStr);
                  const e = mmSsToMs(editEndStr);
                  if (s !== null && e !== null && e > s) {
                    onBoundaryUpdate!(clip.id, s, e);
                    setBoundaryMode(false);
                    toast.success("Clip boundaries saved.");
                  }
                }}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary, color: "#fff" }}
              >
                Save boundaries
              </button>
              <button
                onClick={() => setBoundaryMode(false)}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-border transition-all hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
