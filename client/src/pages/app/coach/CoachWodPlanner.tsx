/**
 * CoachWodPlanner — Daily WOD builder.
 *
 * Each WOD block carries full instructional context:
 *   description   — plain-English "how to run this drill"
 *   skill_focus   — primary motor pattern / skill targeted
 *   rep_format    — sets × reps or duration guidance shown to the player
 *   equipment     — what the player needs to have ready
 *   coaching_points — coach cues (one per line)
 *   success_metrics — what "good" looks like
 *
 * When a library drill is selected, its metadata auto-populates the block.
 * AI-generated blocks include a description + cues from the LLM.
 * Missing descriptions show an inline nudge to add or auto-generate one.
 */
import { useMemo, useState } from "react";
import {
  Plus, Trash2, Sparkles, RefreshCw, CheckCircle,
  ChevronRight, X, GripVertical, ChevronDown, Clock,
  Zap, Send, Info, AlertCircle, Dumbbell, Target, Package,
  PenLine,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { drillLibrary, type Drill } from "@/features/practice-plan/mock";
import { useCustomDrillsStore } from "@/lib/customDrillsStore";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type WodBlockType =
  | "warmup" | "skill" | "shooting" | "finishing"
  | "footwork" | "defense" | "conditioning" | "competitive" | "recovery";

type WodSource = "library" | "custom" | "generated";

type WodBlock = {
  id: string;
  block_type: WodBlockType;
  source: WodSource;
  drill_name: string;
  source_drill_id: string;
  minutes: number;
  // ── Instructional context ──────────────────────────────────────────────────
  /** Plain-English drill description shown to coach and player. */
  description: string;
  /** Primary skill or motor pattern this block develops. */
  skill_focus: string;
  /** Rep/set/format guidance — e.g. "3 × 10 reps" or "90 sec continuous". */
  rep_format: string;
  /** Equipment the player needs. */
  equipment: string[];
  /** Coaching cues, one per line. */
  coaching_points: string;
  /** What "completed successfully" looks like. */
  success_metrics: string;
  /**
   * True when description was written by AI (not the coach).
   * Surfaces an edit nudge so the coach can personalise it.
   */
  ai_description: boolean;
};

type AiWodBlock = {
  block_type: string;
  drill_name: string;
  minutes: number;
  // Required fields AI must return
  description: string;
  skill_focus: string;
  rep_format: string;
  equipment: string[];
  coaching_points: string[];
  success_metrics: string[];
};

type AiWodResult = {
  theme: string;
  rationale: string;
  blocks: AiWodBlock[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_TYPES: WodBlockType[] = [
  "warmup", "skill", "shooting", "finishing", "footwork",
  "defense", "conditioning", "competitive", "recovery",
];

const FOCUS_OPTIONS = [
  "Ball handling", "Finishing", "Shooting", "Footwork", "Defense",
  "Post moves", "Playmaking", "Off-ball movement", "Conditioning", "IQ & reads",
];

const BLOCK_COLORS: Record<WodBlockType, string> = {
  warmup:       "oklch(0.78 0.16 75)",
  skill:        "oklch(0.65 0.18 250)",
  shooting:     "oklch(0.6 0.15 145)",
  finishing:    "oklch(0.65 0.2 300)",
  footwork:     "oklch(0.72 0.16 200)",
  defense:      "oklch(0.55 0.2 25)",
  conditioning: "oklch(0.74 0.18 30)",
  competitive:  "oklch(0.6 0.2 330)",
  recovery:     "oklch(0.72 0.12 170)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId() {
  return `wod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const emptyBlock = (): WodBlock => ({
  id:               makeId(),
  block_type:       "skill",
  source:           "library",
  drill_name:       "",
  source_drill_id:  "",
  minutes:          8,
  description:      "",
  skill_focus:      "",
  rep_format:       "",
  equipment:        [],
  coaching_points:  "",
  success_metrics:  "",
  ai_description:   false,
});

/** Pull instructional fields from a library drill into a WodBlock patch. */
function drillToBlockPatch(drill: Drill): Partial<WodBlock> {
  return {
    drill_name:      drill.title,
    description:     drill.description ?? "",
    skill_focus:     drill.skillFocus ?? drill.tags.slice(0, 2).join(" · "),
    rep_format:      drill.repFormat ?? `${drill.defaultDurationMin} min`,
    equipment:       drill.equipment ?? [],
    coaching_points: drill.coachingPoints?.join("\n") ?? "",
    ai_description:  false,
  };
}

function aiBlockToWodBlock(b: AiWodBlock): WodBlock {
  return {
    id:              makeId(),
    block_type:      (BLOCK_TYPES.includes(b.block_type as WodBlockType)
      ? b.block_type : "skill") as WodBlockType,
    source:          "generated",
    drill_name:      b.drill_name,
    source_drill_id: "",
    minutes:         b.minutes,
    description:     b.description ?? "",
    skill_focus:     b.skill_focus ?? "",
    rep_format:      b.rep_format ?? "",
    equipment:       b.equipment ?? [],
    coaching_points: b.coaching_points.join("\n"),
    success_metrics: b.success_metrics.join("\n"),
    ai_description:  true,
  };
}

// ─── Drill info panel (shown inside expanded block) ───────────────────────────

function DrillInfoSection({
  block,
  onChange,
}: {
  block: WodBlock;
  onChange: (patch: Partial<WodBlock>) => void;
}) {
  const hasDescription = block.description.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
            <Info className="w-3 h-3" /> Description
          </label>
          {block.ai_description && (
            <span className="flex items-center gap-1 text-[10px] text-primary/70 font-medium">
              <Sparkles className="w-2.5 h-2.5" /> AI-written · edit to personalise
            </span>
          )}
        </div>
        {hasDescription ? (
          <Textarea
            rows={3}
            value={block.description}
            onChange={(e) => onChange({ description: e.target.value, ai_description: false })}
            className="text-xs resize-none"
            placeholder="How is this drill run? Plain English, actionable…"
          />
        ) : (
          <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 flex items-start gap-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-amber-400 font-medium mb-1.5">No description yet</p>
              <Textarea
                rows={2}
                value={block.description}
                onChange={(e) => onChange({ description: e.target.value })}
                className="text-xs resize-none bg-background"
                placeholder="Describe the drill in plain English so any player can run it solo…"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Skill focus + Rep format */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Skill Focus
          </label>
          <Input
            value={block.skill_focus}
            onChange={(e) => onChange({ skill_focus: e.target.value })}
            placeholder="e.g. Weak-hand finishing"
            className="text-xs h-8"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Format / Reps
          </label>
          <Input
            value={block.rep_format}
            onChange={(e) => onChange({ rep_format: e.target.value })}
            placeholder="e.g. 3 × 10 reps · both sides"
            className="text-xs h-8"
          />
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
          <Package className="w-3 h-3" /> Equipment
        </label>
        <Input
          value={block.equipment.join(", ")}
          onChange={(e) => onChange({
            equipment: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
          })}
          placeholder="e.g. Cones, 1 Ball, Chair  (comma-separated)"
          className="text-xs h-8"
        />
      </div>

      {/* Coaching cues + Success metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
            <PenLine className="w-3 h-3" /> Coaching Cues
          </label>
          <Textarea
            rows={3}
            value={block.coaching_points}
            onChange={(e) => onChange({ coaching_points: e.target.value })}
            placeholder={"One cue per line…\nEyes up on the dribble\nJump off one foot"}
            className="text-xs resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" /> Success Metrics
          </label>
          <Textarea
            rows={3}
            value={block.success_metrics}
            onChange={(e) => onChange({ success_metrics: e.target.value })}
            placeholder={"One metric per line…\n8/10 makes\n30 sec without errors"}
            className="text-xs resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Block Row ───────────────────────────────────────────────────────

function SortableBlock({
  block,
  index,
  onChange,
  onRemove,
  drillOptions,
  customDrillOptions,
}: {
  block: WodBlock;
  index: number;
  onChange: (patch: Partial<WodBlock>) => void;
  onRemove: () => void;
  drillOptions: typeof drillLibrary;
  customDrillOptions: typeof drillLibrary;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity:  isDragging ? 0.45 : 1,
    zIndex:   isDragging ? 50 : undefined,
  };

  const [expanded, setExpanded] = useState(false);
  const color   = BLOCK_COLORS[block.block_type];
  const options = block.source === "library" ? drillOptions : customDrillOptions;

  // Does the description need attention?
  const missingDesc = !block.description.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-card hover:border-border/80 transition-colors overflow-hidden"
    >
      {/* ── Collapsed header ─────────────────────────────────────────────── */}
      <div className="flex items-stretch min-h-[56px]">
        {/* Color rail */}
        <div className="w-1 shrink-0 rounded-l-lg" style={{ background: color }} />

        {/* Drag handle */}
        <button
          {...attributes} {...listeners}
          className="px-2.5 flex items-center text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Block index */}
        <div className="flex items-center pr-2 text-xs text-muted-foreground font-mono w-5 shrink-0">
          {index + 1}
        </div>

        {/* Type selector */}
        <div className="flex items-center py-2 pr-2">
          <Select
            value={block.block_type}
            onValueChange={(v) => onChange({ block_type: v as WodBlockType })}
          >
            <SelectTrigger
              className="h-6 text-[10px] font-bold uppercase tracking-wider border-0 shadow-none px-2 focus:ring-0"
              style={{ color, background: `${color.replace(")", " / 0.12)")}` }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_TYPES.map((bt) => (
                <SelectItem key={bt} value={bt} className="text-xs capitalize">{bt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drill name + description snippet */}
        <div className="flex-1 flex flex-col justify-center py-2 pr-2 min-w-0">
          <Input
            value={block.drill_name}
            onChange={(e) => onChange({ drill_name: e.target.value })}
            placeholder="Drill name…"
            className="h-6 border-0 shadow-none bg-transparent px-0 text-[13px] font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 leading-tight"
          />
          {/* Description preview / empty nudge */}
          {block.drill_name && (
            <p
              className={`text-[11px] leading-snug truncate mt-0.5 ${
                missingDesc
                  ? "text-amber-500/80 italic"
                  : "text-muted-foreground"
              }`}
            >
              {missingDesc
                ? "No description — expand to add one"
                : block.description}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 pr-2 shrink-0">
          {block.source === "generated" && (
            <Badge variant="secondary" className="text-[9px] gap-0.5 py-0 h-4 px-1.5">
              <Sparkles className="w-2 h-2" /> AI
            </Badge>
          )}
          {!missingDesc && block.skill_focus && (
            <span
              className="hidden sm:inline text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none"
              style={{ background: `${color.replace(")", " / 0.12)")}`, color }}
            >
              {block.skill_focus.split(" · ")[0]}
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1 pr-3 text-sm text-muted-foreground shrink-0">
          <Clock className="w-3 h-3" />
          <input
            type="number"
            value={block.minutes}
            min={1}
            max={60}
            onChange={(e) => onChange({ minutes: Math.max(1, Number(e.target.value)) })}
            className="w-7 bg-transparent text-right text-sm font-semibold text-foreground focus:outline-none"
          />
          <span className="text-xs">m</span>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center px-2.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={expanded ? "Collapse" : "Expand block details"}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="flex items-center px-2.5 text-muted-foreground hover:text-destructive transition-colors border-l border-border"
          aria-label="Remove block"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Expanded section ──────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          {/* Source + drill picker */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={block.source}
              onValueChange={(v) =>
                onChange({ source: v as WodSource, source_drill_id: "", drill_name: "" })
              }
            >
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="library"   className="text-xs">Library</SelectItem>
                <SelectItem value="custom"    className="text-xs">Custom</SelectItem>
                <SelectItem value="generated" className="text-xs">Generated</SelectItem>
              </SelectContent>
            </Select>

            {block.source !== "generated" && options.length > 0 && (
              <Select
                value={block.source_drill_id}
                onValueChange={(id) => {
                  const drill = options.find((d) => d.id === id);
                  if (drill) {
                    onChange({ source_drill_id: id, ...drillToBlockPatch(drill) });
                  } else {
                    onChange({ source_drill_id: id });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs flex-1 min-w-[180px]">
                  <SelectValue placeholder={`Pick from ${block.source}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DrillInfoSection block={block} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ─── Session Summary Panel ────────────────────────────────────────────────────

function SessionSummary({
  blocks,
  playerName,
  theme,
  aiTheme,
}: {
  blocks: WodBlock[];
  playerName: string;
  theme: string;
  aiTheme: string | null;
}) {
  const totalMins = blocks.reduce((s, b) => s + b.minutes, 0);
  const intensity = totalMins >= 55 ? "High" : totalMins >= 35 ? "Medium" : "Low";
  const intensityColor =
    intensity === "High"   ? "oklch(0.55 0.2 25)"
    : intensity === "Medium" ? "oklch(0.78 0.16 75)"
    : "oklch(0.6 0.15 145)";

  const byType = BLOCK_TYPES.map((type) => ({
    type,
    mins:  blocks.filter((b) => b.block_type === type).reduce((s, b) => s + b.minutes, 0),
    color: BLOCK_COLORS[type],
  })).filter((t) => t.mins > 0);

  const missingDescCount = blocks.filter((b) => b.drill_name && !b.description.trim()).length;

  return (
    <div className="space-y-4">
      {/* Player card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Session</div>
        <div className="space-y-0.5">
          <div className="text-base font-bold truncate">{playerName || "—"}</div>
          <div className="text-[12px] text-muted-foreground truncate">{theme || "No theme set"}</div>
        </div>
        {aiTheme && (
          <div className="flex items-center gap-1.5 text-[11px] text-primary">
            <Sparkles className="w-3 h-3" /> AI-generated
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums">{totalMins}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">min</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{blocks.length}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">blocks</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: intensityColor }}>{intensity}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">load</div>
          </div>
        </div>

        {blocks.length > 0 && totalMins > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Timeline</div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  style={{
                    width:      `${(b.minutes / totalMins) * 100}%`,
                    background: BLOCK_COLORS[b.block_type],
                    minWidth:   2,
                  }}
                  title={`${b.drill_name || b.block_type} — ${b.minutes}m`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Missing-description warning */}
      {missingDescCount > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-400 leading-snug">
            {missingDescCount} block{missingDescCount > 1 ? "s" : ""} missing description.
            Players won't know how to run {missingDescCount > 1 ? "them" : "it"} solo.
          </p>
        </div>
      )}

      {/* Block breakdown */}
      {byType.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">Breakdown</div>
          {byType.map(({ type, mins, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[11px] capitalize flex-1">{type}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{mins}m</span>
              <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(mins / totalMins) * 100}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full gap-2" disabled>
          <Send className="w-4 h-4" />
          Send to Player
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          Connect a player to send this WOD
        </p>
      </div>
    </div>
  );
}

// ─── AI Panel ────────────────────────────────────────────────────────────────

function AiWodPanel({
  open,
  onClose,
  defaultPlayerName,
  defaultMinutes,
  onApprove,
}: {
  open: boolean;
  onClose: () => void;
  defaultPlayerName: string;
  defaultMinutes: number;
  onApprove: (result: AiWodResult) => void;
}) {
  const [playerName,     setPlayerName]     = useState(defaultPlayerName);
  const [position,       setPosition]       = useState("");
  const [focusAreas,     setFocusAreas]     = useState<string[]>(["Ball handling", "Finishing"]);
  const [targetMinutes,  setTargetMinutes]  = useState(defaultMinutes || 45);
  const [intensity,      setIntensity]      = useState<"low" | "medium" | "high">("medium");
  const [coachNotes,     setCoachNotes]     = useState("");
  const [status,         setStatus]         = useState<"idle" | "loading" | "result" | "error">("idle");
  const [result,         setResult]         = useState<AiWodResult | null>(null);
  const [error,          setError]          = useState("");

  function toggleFocus(f: string) {
    setFocusAreas((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  async function generate() {
    if (!focusAreas.length) { toast.error("Select at least one focus area."); return; }
    setStatus("loading");
    setError("");
    try {
      const res = await apiFetch<AiWodResult>("/wods/generate", {
        method: "POST",
        body: JSON.stringify({ playerName, position, focusAreas, targetMinutes, intensity, coachNotes }),
      });
      setResult(res);
      setStatus("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setStatus("error");
    }
  }

  const totalGenMinutes = result?.blocks.reduce((s, b) => s + b.minutes, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI WOD Generator
          </DialogTitle>
        </DialogHeader>

        {status !== "result" ? (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Player</label>
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Position</label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Guard, Forward…" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Focus Areas</label>
              <div className="flex flex-wrap gap-1.5">
                {FOCUS_OPTIONS.map((f) => (
                  <button key={f} type="button" onClick={() => toggleFocus(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      focusAreas.includes(f)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">
                  Duration — {targetMinutes} min
                </label>
                <input type="range" min={20} max={90} step={5} value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Intensity</label>
                <div className="flex gap-1.5">
                  {(["low", "medium", "high"] as const).map((i) => (
                    <button key={i} type="button" onClick={() => setIntensity(i)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-semibold border capitalize transition-colors ${
                        intensity === i
                          ? i === "high"   ? "bg-red-500/20 text-red-400 border-red-500/40"
                          : i === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-green-500/20 text-green-400 border-green-500/40"
                          : "bg-background text-muted-foreground border-border"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Coach notes</label>
              <Textarea value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)}
                rows={2} placeholder="e.g. Avoid jumping today, focus on weak hand…"
              />
            </div>

            {status === "error" && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={generate} disabled={status === "loading"} className="w-full gap-2">
              {status === "loading"
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4" /> Generate WOD</>
              }
            </Button>
          </div>
        ) : result ? (
          <div className="space-y-4 pt-1">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-primary font-mono">Suggestion</div>
              <div className="font-semibold">{result.theme}</div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{result.rationale}</p>
              <div className="text-xs text-muted-foreground pt-0.5">
                {totalGenMinutes} min · {result.blocks.length} blocks
              </div>
            </div>

            <div className="space-y-2">
              {result.blocks.map((b, i) => {
                const blockType = (BLOCK_TYPES.includes(b.block_type as WodBlockType)
                  ? b.block_type : "skill") as WodBlockType;
                return (
                  <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 self-stretch rounded-full shrink-0"
                        style={{ background: BLOCK_COLORS[blockType] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">{b.block_type}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{b.minutes}m</span>
                        </div>
                        <div className="text-[13px] font-semibold mt-0.5">{b.drill_name}</div>
                      </div>
                    </div>
                    {b.description && (
                      <p className="text-[11px] text-muted-foreground leading-snug pl-3">
                        {b.description}
                      </p>
                    )}
                    {b.skill_focus && (
                      <div className="pl-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Target className="w-2.5 h-2.5" />
                        {b.skill_focus}
                      </div>
                    )}
                    {b.coaching_points.length > 0 && (
                      <ul className="pl-3 space-y-0.5">
                        {b.coaching_points.map((cp, j) => (
                          <li key={j} className="flex items-start gap-1 text-[11px] text-muted-foreground">
                            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />{cp}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => { onApprove(result); onClose(); }} className="flex-1 gap-2">
                <CheckCircle className="w-4 h-4" /> Use This WOD
              </Button>
              <Button variant="outline" onClick={() => setStatus("idle")} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Redo
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoachWodPlanner() {
  const { user }   = useAuth();
  const coachId    = user?.id ?? "coach_anonymous";
  const orgId      = (user as any)?.orgId as string | undefined;
  const allCustom  = useCustomDrillsStore((s) => s.drills);

  const customDrills = useMemo(
    () => allCustom.filter((d) => {
      if (d.visibility === "public") return true;
      if (d.visibility === "org" && orgId && d.orgId === orgId) return true;
      return d.ownerCoachId === coachId;
    }),
    [allCustom, coachId, orgId],
  );

  const [playerName, setPlayerName] = useState("Andrew G.");
  const [dailyTheme, setDailyTheme] = useState("Ball control + layup footwork");
  const [coachNote,  setCoachNote]  = useState("Keep cues simple and reps game-like. Build confidence on weak hand.");

  const [blocks, setBlocks] = useState<WodBlock[]>(() => {
    // Pre-populate from library drills so the default state demonstrates rich context
    const libPatch = (id: string) => {
      const d = drillLibrary.find((x) => x.id === id);
      return d ? drillToBlockPatch(d) : {};
    };
    return [
      {
        ...emptyBlock(),
        block_type:  "warmup",
        source:      "library",
        source_drill_id: "drl_dyn_warmup",
        minutes:     7,
        ...libPatch("drl_dyn_warmup"),
      },
      {
        ...emptyBlock(),
        block_type:  "skill",
        source:      "library",
        source_drill_id: "drl_two_ball",
        minutes:     9,
        ...libPatch("drl_two_ball"),
      },
      {
        ...emptyBlock(),
        block_type:  "finishing",
        source:      "library",
        source_drill_id: "drl_mikan",
        minutes:     10,
        ...libPatch("drl_mikan"),
      },
      {
        ...emptyBlock(),
        block_type:  "competitive",
        drill_name:  "1v1 Live Finishing",
        description: "Player attacks coach 1v1 from the wing. Coach gives live resistance — no free paths. Player must read and finish with contact. Alternate driving sides each rep.",
        skill_focus: "Live finishing · contact reads",
        rep_format:  "5 reps each side · full resistance",
        equipment:   [],
        coaching_points: "Attack at game speed, not drill speed\nRead where contact comes from — adjust finish angle\nScore with your eyes, not your head",
        minutes:     11,
        source:      "generated",
        ai_description: false,
      },
      {
        ...emptyBlock(),
        block_type:  "recovery",
        drill_name:  "Stretch & Breathwork",
        description: "Hip flexor lunge stretch (45 sec each side) → hamstring doorframe stretch → 5 box-breath cycles (4 in, 4 hold, 4 out). Full parasympathetic reset.",
        skill_focus: "Recovery · nervous system reset",
        rep_format:  "45 sec per stretch · 5 breath cycles",
        equipment:   [],
        coaching_points: "Relax into the stretch — don't force range of motion\nSlow the breath intentionally — this is as important as the workout",
        minutes:     8,
        source:      "generated",
        ai_description: false,
      },
    ];
  });

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiTheme,     setAiTheme]     = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const from = prev.findIndex((b) => b.id === active.id);
        const to   = prev.findIndex((b) => b.id === over.id);
        return arrayMove(prev, from, to);
      });
    }
  }

  function updateBlock(id: string, patch: Partial<WodBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function addBlock()            { setBlocks((prev) => [...prev, emptyBlock()]); }
  function removeBlock(id: string) { setBlocks((prev) => prev.filter((b) => b.id !== id)); }

  function handleAiApprove(result: AiWodResult) {
    setBlocks(result.blocks.map(aiBlockToWodBlock));
    setDailyTheme(result.theme);
    setAiTheme(result.theme);
    toast.success("AI WOD loaded — review descriptions before sending.");
  }

  const totalMinutes = useMemo(
    () => blocks.reduce((s, b) => s + (Number.isFinite(b.minutes) ? b.minutes : 0), 0),
    [blocks],
  );

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Daily WOD Planner"
          subtitle="Build player workouts. Every block includes a description, cues, and format so players can execute solo."
          actions={
            <Button onClick={() => setAiPanelOpen(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Button>
          }
        />

        <div className="grid lg:grid-cols-[1fr_272px] gap-6">
          {/* ── Left: Builder ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Session metadata */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Player</label>
                  <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Daily Theme</label>
                  <Input value={dailyTheme} onChange={(e) => setDailyTheme(e.target.value)} placeholder="e.g. Ball control + finishing" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Coach Note</label>
                <Textarea value={coachNote} onChange={(e) => setCoachNote(e.target.value)} rows={2} placeholder="Key cues and context for this session…" />
              </div>
            </div>

            {/* AI banner */}
            {aiTheme && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground text-xs">AI-designed:</span>
                <span className="font-medium text-sm flex-1 truncate">{aiTheme}</span>
                <button onClick={() => setAiTheme(null)} className="text-muted-foreground hover:text-foreground ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Block list */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {blocks.map((block, index) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      index={index}
                      onChange={(patch) => updateBlock(block.id, patch)}
                      onRemove={() => removeBlock(block.id)}
                      drillOptions={drillLibrary}
                      customDrillOptions={customDrills as typeof drillLibrary}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add block */}
            <button
              onClick={addBlock}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add block
            </button>
          </div>

          {/* ── Right: Summary ────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <SessionSummary
              blocks={blocks}
              playerName={playerName}
              theme={dailyTheme}
              aiTheme={aiTheme}
            />
          </div>
        </div>
      </div>

      <AiWodPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        defaultPlayerName={playerName}
        defaultMinutes={totalMinutes || 45}
        onApprove={handleAiApprove}
      />
    </AppShell>
  );
}
