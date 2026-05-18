/**
 * PracticePlanBuilder — Coach HQ
 *
 * Faithful build of the Practice Plan Builder described in Prompt 8 §17:
 *   • drag-and-drop drill sequencing (dnd-kit)
 *   • running clock with budget warnings
 *   • equipment / staff allocation summary
 *   • drill library drawer with category + intensity + surface filters
 *   • inline duration editing
 *   • multiple plans (CRUD via Zustand store)
 *   • print/share-friendly view
 *
 * In production this maps to `/(coach)/practice-plans` with `PracticePlanBuilder`
 * as the canonical component.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Trash2,
  Copy,
  Printer,
  Share2,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  Users,
  Wrench,
  X,
  Edit3,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Flame,
  Target,
  Tag,
  Flag,
  Lightbulb,
  BarChart3,
  Activity,
  Award,
  Brain,
  TrendingUp,
  Zap,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  drillCategories,
  drillLibrary,
  findCategory,
  findDrill as findGlobalDrill,
  planEquipment as _planEquipmentRaw,
  planMaxCoaches as _planMaxCoachesRaw,
  planTotalMinutes,
  type Drill,
  type DrillIntensity,
  type DrillSurface,
  type PracticePlan,
  type PracticePlanBlock,
  type PracticeObjective,
  type PracticeObjectiveCategory,
  type PracticeTargetGroup,
  type PracticeIntensity,
  type PracticeReflection,
  type DrillFeedback,
} from "@/lib/mock/practice";
import { usePracticePlans } from "@/lib/practicePlanStore";
import { apiGet } from "@/lib/api/client";
import { usePracticePlanSync } from "@/lib/api/hooks/usePracticePlanSync";
import { useCustomDrillsStore } from "@/lib/customDrillsStore";
import { CustomDrillEditor } from "@/components/coach/CustomDrillEditor";
import { useAuth } from "@/lib/auth";
import { MOCK_TEAM_READINESS, statusColor, REASON_LABELS as READINESS_REASON_LABELS } from "@/lib/readiness";
import { ReadinessStatusBadge } from "@/components/readiness/ReadinessStatusBadge";

/**
 * Resolve a drill against both the global library and the persisted custom
 * drills store. Used everywhere this page reads a drill out of a plan block.
 */
function findDrill(drillId: string): Drill | undefined {
  return (
    findGlobalDrill(drillId) ??
    useCustomDrillsStore.getState().byId(drillId)
  );
}

/** Re-export of practice helpers but using our merged drill resolver. */
function planEquipment(plan: PracticePlan): string[] {
  const set = new Set<string>();
  for (const b of plan.blocks) {
    findDrill(b.drillId)?.equipment.forEach((e) => set.add(e));
  }
  return Array.from(set).sort();
}
function planMaxCoaches(plan: PracticePlan): number {
  return plan.blocks.reduce((m, b) => Math.max(m, findDrill(b.drillId)?.coachesNeeded ?? 1), 1);
}
// Touch the original helpers so the linter doesn't flag them as unused if some
// import path changes later. (No-op in optimised build.)
void _planEquipmentRaw;
void _planMaxCoachesRaw;

const INTENSITIES: DrillIntensity[] = ["LOW", "MEDIUM", "HIGH", "MAX"];
const SURFACES: DrillSurface[] = ["HALF_COURT", "FULL_COURT", "BASELINE", "STATIONARY"];

const INTENSITY_COLOR: Record<DrillIntensity, string> = {
  LOW: "oklch(0.75 0.12 200)",
  MEDIUM: "oklch(0.78 0.16 75)",
  HIGH: "oklch(0.74 0.18 30)",
  MAX: "oklch(0.65 0.22 15)",
};

// ── Phase-2 constants ─────────────────────────────────────────────────────────

const OBJECTIVE_TAGS: PracticeObjective[] = [
  { id: "obj_pnr_coverage",  label: "PnR Coverage",   category: "tactic" },
  { id: "obj_zone_offense",  label: "Zone Offense",    category: "tactic" },
  { id: "obj_transition",    label: "Transition",      category: "tactic" },
  { id: "obj_late_clock",    label: "Late Clock",      category: "tactic" },
  { id: "obj_blob_slob",     label: "BLOB / SLOB",     category: "tactic" },
  { id: "obj_closeouts",     label: "Closeouts",       category: "skill" },
  { id: "obj_finishing",     label: "Finishing",       category: "skill" },
  { id: "obj_shooting",      label: "Shooting",        category: "skill" },
  { id: "obj_ball_handling", label: "Ball Handling",   category: "skill" },
  { id: "obj_help_defense",  label: "Help Defense",    category: "skill" },
  { id: "obj_free_throws",   label: "Free Throws",     category: "skill" },
  { id: "obj_communication", label: "Communication",   category: "mindset" },
  { id: "obj_compete",       label: "Compete Level",   category: "mindset" },
  { id: "obj_film_review",   label: "Film Review",     category: "mindset" },
  { id: "obj_conditioning",  label: "Conditioning",    category: "conditioning" },
  { id: "obj_opponent_prep", label: "Opponent Prep",   category: "opponent_prep" },
];

const OBJECTIVE_CAT_COLOR: Record<PracticeObjectiveCategory, string> = {
  tactic:        "oklch(0.72 0.17 50)",
  skill:         "oklch(0.65 0.18 290)",
  mindset:       "oklch(0.75 0.18 150)",
  conditioning:  "oklch(0.65 0.22 15)",
  opponent_prep: "oklch(0.68 0.22 25)",
};

const TARGET_GROUPS: PracticeTargetGroup[] = [
  { type: "full_team", label: "Full Team" },
  { type: "guards",    label: "Guards" },
  { type: "wings",     label: "Wings" },
  { type: "bigs",      label: "Bigs / Forwards" },
  { type: "starters",  label: "Starters" },
  { type: "bench",     label: "Bench Unit" },
];

const PRACTICE_INTENSITIES: { value: PracticeIntensity; label: string; color: string; desc: string }[] = [
  { value: "RECOVERY",  label: "Recovery",  color: "oklch(0.75 0.12 200)", desc: "Light load, film-heavy" },
  { value: "MODERATE",  label: "Moderate",  color: "oklch(0.78 0.16 75)",  desc: "Normal training day" },
  { value: "HIGH",      label: "High",      color: "oklch(0.74 0.18 30)",  desc: "Game-level intensity" },
  { value: "MAX",       label: "Max",       color: "oklch(0.65 0.22 15)",  desc: "Peak load before rest" },
];

// Quick-start plan templates for the improved empty state
const PLAN_TEMPLATES: Array<{ label: string; desc: string; icon: React.ReactNode; overrides: Partial<PracticePlan> }> = [
  {
    label: "Skill Day",
    desc: "Shooting · Handles · Finishing",
    icon: <Target className="w-5 h-5" />,
    overrides: {
      title: "Skill Development Day",
      focus: "Individual skill work — shooting, ball handling, finishing.",
      budgetMin: 75,
      plannedIntensity: "MODERATE",
      objectives: [
        { id: "obj_shooting",     label: "Shooting",     category: "skill" },
        { id: "obj_ball_handling",label: "Ball Handling", category: "skill" },
        { id: "obj_finishing",    label: "Finishing",    category: "skill" },
      ],
    },
  },
  {
    label: "Opponent Prep",
    desc: "Scout-driven · Game-ready",
    icon: <Flag className="w-5 h-5" />,
    overrides: {
      title: "Opponent Prep",
      focus: "Opponent-specific coverage schemes and ATO sets.",
      budgetMin: 90,
      plannedIntensity: "HIGH",
      objectives: [
        { id: "obj_opponent_prep", label: "Opponent Prep", category: "opponent_prep" },
        { id: "obj_pnr_coverage",  label: "PnR Coverage",  category: "tactic" },
        { id: "obj_late_clock",    label: "Late Clock",    category: "tactic" },
      ],
    },
  },
  {
    label: "Recovery Day",
    desc: "Film · Walkthroughs · Free throws",
    icon: <Activity className="w-5 h-5" />,
    overrides: {
      title: "Recovery & Film Day",
      focus: "Low-impact review. Film, walk-throughs, free throw work.",
      budgetMin: 60,
      plannedIntensity: "RECOVERY",
      objectives: [
        { id: "obj_film_review",  label: "Film Review",  category: "mindset" },
        { id: "obj_free_throws",  label: "Free Throws",  category: "skill" },
        { id: "obj_communication",label: "Communication",category: "mindset" },
      ],
    },
  },
];

function formatSurface(s: DrillSurface): string {
  return s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(date: string, start: string): string {
  try {
    const d = new Date(`${date}T${start}`);
    return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return `${date} ${start}`;
  }
}

function addMinutes(date: string, time: string, minutes: number): string {
  try {
    const d = new Date(`${date}T${time}`);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Star rating (1–5)                                                          */
/* -------------------------------------------------------------------------- */

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: 1 | 2 | 3 | 4 | 5) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n as 1 | 2 | 3 | 4 | 5)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className="w-4 h-4"
            fill={(hover || value) >= n ? "oklch(0.78 0.16 75)" : "transparent"}
            stroke={(hover || value) >= n ? "oklch(0.78 0.16 75)" : "currentColor"}
          />
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Objectives chip bar                                                         */
/* -------------------------------------------------------------------------- */

function ObjectiveChip({ obj, onRemove }: { obj: PracticeObjective; onRemove?: () => void }) {
  const color = OBJECTIVE_CAT_COLOR[obj.category];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border"
      style={{ borderColor: `${color}50`, background: `${color}18`, color }}
    >
      {obj.label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Pre-practice summary card — "why this practice exists"                      */
/* -------------------------------------------------------------------------- */

function PrePracticeSummaryCard({ plan }: { plan: PracticePlan }) {
  const objs = plan.objectives ?? [];
  const intensity = PRACTICE_INTENSITIES.find((i) => i.value === plan.plannedIntensity);
  const group = plan.targetGroup;
  if (objs.length === 0 && !intensity && !plan.opponent && !group) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="text-[9.5px] font-mono uppercase tracking-[0.14em] text-primary/70 mb-1">
            Today's objective
          </div>
          <p className="text-[13px] font-medium text-foreground leading-snug">
            {plan.focus || "No focus set yet."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {intensity && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold border"
              style={{ borderColor: `${intensity.color}50`, background: `${intensity.color}18`, color: intensity.color }}
            >
              <Flame className="w-3 h-3" />
              {intensity.label}
            </span>
          )}
          {group && (
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold border border-border text-muted-foreground bg-muted/30">
              <Users className="w-3 h-3" />
              {group.label}
            </span>
          )}
        </div>
      </div>

      {plan.opponent && (
        <div className="flex items-center gap-2 mb-3 text-[12px] text-muted-foreground">
          <Flag className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>
            <span className="font-semibold text-foreground">Opponent prep:</span> {plan.opponent}
          </span>
        </div>
      )}

      {objs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {objs.map((o) => <ObjectiveChip key={o.id} obj={o} />)}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Plan intent panel (right rail — objectives + targeting + intensity)         */
/* -------------------------------------------------------------------------- */

function PlanIntentPanel({
  plan,
  onUpdate,
}: {
  plan: PracticePlan;
  onUpdate: (patch: Partial<PracticePlan>) => void;
}) {
  const [open, setOpen] = useState(true);
  const [objPickerOpen, setObjPickerOpen] = useState(false);
  const objs = plan.objectives ?? [];

  function toggleObjective(tag: PracticeObjective) {
    const exists = objs.find((o) => o.id === tag.id);
    onUpdate({
      objectives: exists
        ? objs.filter((o) => o.id !== tag.id)
        : [...objs, tag],
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
            Practice intent
          </span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">

          {/* Objectives */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
              Objectives
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {objs.map((o) => (
                <ObjectiveChip key={o.id} obj={o} onRemove={() => toggleObjective(o)} />
              ))}
              {objs.length === 0 && (
                <span className="text-[12px] text-muted-foreground italic">No objectives set.</span>
              )}
            </div>
            <button
              onClick={() => setObjPickerOpen((p) => !p)}
              className="text-[11.5px] text-primary hover:underline"
            >
              {objPickerOpen ? "↑ Hide" : "+ Add objective"}
            </button>
            {objPickerOpen && (
              <div className="mt-2 flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-muted/20">
                {OBJECTIVE_TAGS.map((tag) => {
                  const active = !!objs.find((o) => o.id === tag.id);
                  const color = OBJECTIVE_CAT_COLOR[tag.category];
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleObjective(tag)}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium border transition"
                      style={
                        active
                          ? { borderColor: `${color}80`, background: `${color}25`, color }
                          : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                      }
                    >
                      {active && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Target group */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
              Target group
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TARGET_GROUPS.map((g) => {
                const active = plan.targetGroup?.type === g.type;
                return (
                  <button
                    key={g.type}
                    onClick={() => onUpdate({ targetGroup: active ? undefined : g })}
                    className={`h-7 px-3 rounded-full text-[11px] font-medium border transition ${
                      active
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Planned intensity */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
              Planned intensity
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRACTICE_INTENSITIES.map((lv) => {
                const active = plan.plannedIntensity === lv.value;
                return (
                  <button
                    key={lv.value}
                    onClick={() => onUpdate({ plannedIntensity: active ? undefined : lv.value })}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition"
                    style={
                      active
                        ? { borderColor: `${lv.color}60`, background: `${lv.color}15`, color: lv.color }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    <Flame className="w-3 h-3 shrink-0" style={{ color: lv.color }} />
                    <div>
                      <div className="text-[11.5px] font-semibold leading-tight">{lv.label}</div>
                      <div className="text-[9.5px] text-muted-foreground leading-tight">{lv.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opponent name */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
              Opponent prep (optional)
            </div>
            <Input
              value={plan.opponent ?? ""}
              onChange={(e) => onUpdate({ opponent: e.target.value || undefined })}
              placeholder="e.g. Westbury Catholic"
              className="h-8 text-[12px]"
            />
          </div>

        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recommendations strip — mock AI insights from film + IDP                   */
/* -------------------------------------------------------------------------- */

const MOCK_RECOMMENDATIONS = [
  {
    id: "rec_1",
    icon: <Brain className="w-3.5 h-3.5 text-violet-500" />,
    source: "Recent film",
    text: "Weak-hand finishing flagged in 3 of last 4 sessions. Add a Left Mikan block?",
    drillId: "drl_mikan_left",
    color: "violet",
  },
  {
    id: "rec_2",
    icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />,
    source: "IDP focus areas",
    text: "4 players have Ball Handling as IDP priority — current plan is only 10% handles.",
    drillId: "drl_full_court_handles",
    color: "emerald",
  },
  {
    id: "rec_3",
    icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
    source: "Drill effectiveness",
    text: "PnR Ice drill rated 5★ in last 2 opponent preps. Westbury runs heavy PnR.",
    drillId: "drl_pnr_ice",
    color: "amber",
  },
];

function RecommendationsStrip({
  onAddDrill,
}: {
  onAddDrill: (drillId: string) => void;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = MOCK_RECOMMENDATIONS.filter((r) => !dismissed.has(r.id));
  if (visible.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
          Recommendations
        </span>
      </div>
      <div className="space-y-2">
        {visible.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-border p-3 flex flex-col gap-2 bg-muted/10"
          >
            <div className="flex items-start gap-2">
              {r.icon}
              <div className="flex-1 min-w-0">
                <div className="text-[9.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
                  {r.source}
                </div>
                <p className="text-[11.5px] leading-snug">{r.text}</p>
              </div>
              <button
                onClick={() => setDismissed((p) => new Set(Array.from(p).concat(r.id)))}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {r.drillId && (
              <button
                onClick={() => { onAddDrill(r.drillId!); setDismissed((p) => new Set(Array.from(p).concat(r.id))); }}
                className="self-start text-[10.5px] font-semibold text-primary hover:underline"
              >
                + Add to plan
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Team readiness panel (right rail — surfaces flagged/restricted players)    */
/* -------------------------------------------------------------------------- */

function TeamReadinessPanel() {
  const [expanded, setExpanded] = useState(true);
  const atRisk = MOCK_TEAM_READINESS.filter(
    (p) => p.status === "RESTRICTED" || p.status === "FLAGGED",
  );
  const unknown = MOCK_TEAM_READINESS.filter((p) => p.status === "UNKNOWN");

  if (atRisk.length === 0 && unknown.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-2 text-[12px] text-[oklch(0.60_0.15_145)]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        All players cleared — no readiness concerns today
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.72_0.17_75)] shrink-0" />
        <span className="text-[12px] font-semibold flex-1">Player Readiness</span>
        {atRisk.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[oklch(0.72_0.17_75/0.1)] text-[oklch(0.72_0.17_75)] border border-[oklch(0.72_0.17_75/0.3)]">
            {atRisk.length} flagged
          </span>
        )}
        {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          {atRisk.map((player) => {
            const c = statusColor(player.status);
            const firstReason = player.reasons[0];
            return (
              <div
                key={player.playerId}
                className="px-4 py-2.5 flex items-center gap-2.5 border-b border-border/40 last:border-0"
                style={{ background: c.bg }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0"
                  style={{ color: c.text, borderColor: c.border }}
                >
                  {player.playerName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{player.playerName}</div>
                  {firstReason && firstReason !== "no_data" && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {READINESS_REASON_LABELS[firstReason]}
                    </div>
                  )}
                </div>
                <ReadinessStatusBadge
                  status={player.status}
                  confidence={player.confidence}
                  showLabel={false}
                />
              </div>
            );
          })}
          {unknown.length > 0 && (
            <div className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border/40">
              {unknown.length} player{unknown.length > 1 ? "s" : ""} with no check-in today
            </div>
          )}
          <div className="px-4 py-2 border-t border-border/40">
            <Link href="/app/coach/readiness" asChild>
              <a className="text-[11px] text-primary hover:underline">View full readiness report →</a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Post-practice review dialog                                                 */
/* -------------------------------------------------------------------------- */

function PostPracticeReview({
  plan,
  open,
  onClose,
  onSubmit,
}: {
  plan: PracticePlan;
  open: boolean;
  onClose: () => void;
  onSubmit: (reflection: PracticeReflection) => void;
}) {
  const [actualDuration, setActualDuration] = useState(planTotalMinutes(plan));
  const [whatWorked, setWhatWorked]         = useState("");
  const [whatDidnt, setWhatDidnt]           = useState("");
  const [generalNote, setGeneralNote]       = useState("");
  const [feedback, setFeedback]             = useState<DrillFeedback[]>(
    plan.blocks.map((b) => ({
      drillId:    b.drillId,
      rating:     3 as const,
      note:       "",
      teachAgain: true,
    })),
  );

  function patchFeedback(drillId: string, patch: Partial<DrillFeedback>) {
    setFeedback((prev) => prev.map((f) => f.drillId === drillId ? { ...f, ...patch } : f));
  }

  function handleSubmit() {
    onSubmit({
      whatWorked,
      whatDidnt,
      generalNote,
      actualDurationMin: actualDuration,
      drillFeedback: feedback,
      completedAt: new Date().toISOString(),
    });
    onClose();
    toast.success("Practice marked complete. Great session.");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Post-Practice Review — {plan.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Actual duration */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
                Actual duration
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(Number(e.target.value))}
                  className="w-20 h-8 text-center font-mono"
                  min={5}
                  max={300}
                />
                <span className="text-[12px] text-muted-foreground">
                  min · planned {plan.budgetMin} min
                  {actualDuration !== plan.budgetMin && (
                    <span className={`ml-2 font-mono ${actualDuration > plan.budgetMin ? "text-amber-500" : "text-emerald-500"}`}>
                      ({actualDuration > plan.budgetMin ? "+" : ""}{actualDuration - plan.budgetMin} min)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Per-drill feedback */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> Drill effectiveness
            </div>
            <div className="space-y-3">
              {plan.blocks.map((b) => {
                const drill = findDrill(b.drillId);
                const fb = feedback.find((f) => f.drillId === b.drillId);
                if (!drill || !fb) return null;
                const cat = findCategory(drill.categoryId);
                return (
                  <div key={b.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {cat && (
                          <div
                            className="w-1.5 h-8 rounded-full shrink-0"
                            style={{ background: cat.color }}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-[13px] truncate">{drill.title}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{b.durationMin} min</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StarRating
                          value={fb.rating}
                          onChange={(v) => patchFeedback(b.drillId, { rating: v })}
                        />
                        <label className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fb.teachAgain}
                            onChange={(e) => patchFeedback(b.drillId, { teachAgain: e.target.checked })}
                            className="rounded"
                          />
                          Teach again
                        </label>
                      </div>
                    </div>
                    <Textarea
                      value={fb.note}
                      onChange={(e) => patchFeedback(b.drillId, { note: e.target.value })}
                      placeholder="Notes on this drill (optional)"
                      rows={1}
                      className="text-[12px] resize-none min-h-[32px]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reflection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> What worked
              </div>
              <Textarea
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                placeholder="Drills that landed, energy, execution…"
                rows={4}
                className="text-[12.5px] resize-none"
              />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> What didn't
              </div>
              <Textarea
                value={whatDidnt}
                onChange={(e) => setWhatDidnt(e.target.value)}
                placeholder="Missed reps, execution gaps, energy issues…"
                rows={4}
                className="text-[12.5px] resize-none"
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
              General note
            </div>
            <Textarea
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="Anything else for the file — adjustments made, player notes, prep for next practice…"
              rows={3}
              className="text-[12.5px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Award className="w-4 h-4" /> Mark Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Completed plan read-only reflection view                                    */
/* -------------------------------------------------------------------------- */

function CompletedPlanView({ plan }: { plan: PracticePlan }) {
  const r = plan.reflection;
  if (!r) return null;

  return (
    <div className="space-y-4">
      {/* Duration comparison */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Duration comparison
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-foreground">{r.actualDurationMin}</div>
            <div className="text-[10px] text-muted-foreground">actual min</div>
          </div>
          <div className="text-muted-foreground">vs</div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-muted-foreground">{plan.budgetMin}</div>
            <div className="text-[10px] text-muted-foreground">planned min</div>
          </div>
          <div className={`ml-2 text-[13px] font-semibold font-mono ${r.actualDurationMin > plan.budgetMin ? "text-amber-500" : "text-emerald-500"}`}>
            {r.actualDurationMin > plan.budgetMin ? "+" : ""}{r.actualDurationMin - plan.budgetMin} min
          </div>
        </div>
      </div>

      {/* Drill ratings */}
      {r.drillFeedback.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Drill effectiveness
          </div>
          <div className="space-y-2">
            {r.drillFeedback.map((fb) => {
              const drill = findDrill(fb.drillId);
              if (!drill) return null;
              return (
                <div key={fb.drillId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-[12.5px] truncate">{drill.title}</div>
                    {fb.note && <p className="text-[11px] text-muted-foreground">{fb.note}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StarRating value={fb.rating} readonly />
                    {!fb.teachAgain && (
                      <span className="text-[10px] text-rose-500 font-mono">Won't repeat</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* What worked / didn't */}
      {(r.whatWorked || r.whatDidnt) && (
        <div className="grid grid-cols-2 gap-4">
          {r.whatWorked && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4">
              <div className="text-[9.5px] font-mono uppercase tracking-[0.12em] text-emerald-600 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> What worked
              </div>
              <p className="text-[12.5px] leading-relaxed">{r.whatWorked}</p>
            </div>
          )}
          {r.whatDidnt && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
              <div className="text-[9.5px] font-mono uppercase tracking-[0.12em] text-amber-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> What didn't
              </div>
              <p className="text-[12.5px] leading-relaxed">{r.whatDidnt}</p>
            </div>
          )}
        </div>
      )}

      {r.generalNote && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-2">
            General note
          </div>
          <p className="text-[12.5px] leading-relaxed">{r.generalNote}</p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sortable block row                                                          */
/* -------------------------------------------------------------------------- */

function BlockRow({
  block,
  drill,
  index,
  startsAt,
  onDurationChange,
  onNotesChange,
  onRemove,
}: {
  block: PracticePlanBlock;
  drill: Drill | undefined;
  index: number;
  startsAt: string;
  onDurationChange: (mins: number) => void;
  onNotesChange: (notes: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const cat = drill ? findCategory(drill.categoryId) : undefined;
  const [editingDuration, setEditingDuration] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-lg border border-border bg-card hover:border-primary/40 transition overflow-hidden"
    >
      <div className="flex items-stretch">
        {/* Color rail */}
        <div className="w-1.5 shrink-0" style={{ background: cat?.color ?? "var(--muted)" }} />

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="px-2 flex items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Step number */}
        <div className="w-9 shrink-0 flex items-center justify-center font-mono text-[12px] text-muted-foreground border-r border-border/50">
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {cat && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider whitespace-nowrap"
                    style={{ background: `${cat.color.replace(")", " / 0.15)")}`, color: cat.color }}
                  >
                    {cat.name}
                  </span>
                )}
                {drill && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider whitespace-nowrap"
                    style={{
                      background: `${INTENSITY_COLOR[drill.intensity].replace(")", " / 0.15)")}`,
                      color: INTENSITY_COLOR[drill.intensity],
                    }}
                  >
                    {drill.intensity}
                  </span>
                )}
                <span className="font-mono text-[10.5px] text-muted-foreground hidden md:inline">starts {startsAt}</span>
              </div>
              <h4 className="font-semibold text-[14px] leading-snug">{drill?.title ?? "Unknown drill"}</h4>
              <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{drill?.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {editingDuration ? (
                <NumericInput
                  aria-label="Block duration in minutes"
                  value={block.durationMin}
                  onChange={(v) => {
                    onDurationChange(v);
                    setEditingDuration(false);
                  }}
                  min={1}
                  max={120}
                  autoFocus
                  className="w-16 h-8 text-center font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingDuration(false);
                  }}
                />
              ) : (
                <button
                  onClick={() => setEditingDuration(true)}
                  className="inline-flex items-center gap-1 font-mono text-[13px] text-primary hover:bg-primary/10 px-2 py-1 rounded"
                >
                  {block.durationMin} min
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                aria-label="Remove block"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Equipment + notes */}
          <div className="mt-2 flex items-start gap-3">
            <div className="flex flex-wrap gap-1.5">
              {drill?.equipment.map((eq) => (
                <span key={eq} className="text-[10.5px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  {eq}
                </span>
              ))}
              {drill && drill.coachesNeeded > 1 && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  <Users className="w-3 h-3" /> {drill.coachesNeeded} coaches
                </span>
              )}
            </div>
          </div>

          <Textarea
            value={block.notes}
            placeholder="Coach notes (e.g., 'lefties to far end', 'focus on guide hand')"
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-2 text-[12.5px] min-h-[36px] resize-none bg-background"
            rows={1}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drill library drawer                                                        */
/* -------------------------------------------------------------------------- */

function DrillLibraryDrawer({
  onPick,
  trigger,
}: {
  onPick: (drillId: string) => void;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const coachId = user?.id ?? "coach_anonymous";
  const orgId = (user as any)?.orgId as string | undefined;

  const [tab, setTab] = useState<"LIBRARY" | "MINE">("LIBRARY");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | "ALL">("ALL");
  const [activeIntensity, setActiveIntensity] = useState<DrillIntensity | "ALL">("ALL");
  const [activeSurface, setActiveSurface] = useState<DrillSurface | "ALL">("ALL");
  const [open, setOpen] = useState(false);

  // Custom drill editor state.
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Drill | null>(null);
  const customDrills = useCustomDrillsStore((s) => s.drills);
  const removeCustom = useCustomDrillsStore((s) => s.remove);

  const visibleCustoms = useMemo(
    () =>
      customDrills.filter((d) => {
        if (d.visibility === "public") return true;
        if (d.visibility === "org" && orgId && d.orgId === orgId) return true;
        return d.ownerCoachId === coachId;
      }),
    [customDrills, coachId, orgId],
  );

  const sourceList = tab === "LIBRARY" ? drillLibrary : visibleCustoms;

  const filtered = useMemo(() => {
    return sourceList.filter((d) => {
      const title = typeof d.title === "string" ? d.title : "";
      const description = typeof d.description === "string" ? d.description : "";
      const tags = Array.isArray(d.tags) ? d.tags : [];
      if (activeCat !== "ALL" && d.categoryId !== activeCat) return false;
      if (activeIntensity !== "ALL" && d.intensity !== activeIntensity) return false;
      if (activeSurface !== "ALL" && d.surface !== activeSurface) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !title.toLowerCase().includes(q) &&
          !description.toLowerCase().includes(q) &&
          !tags.some((t) => t.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [sourceList, search, activeCat, activeIntensity, activeSurface]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        {/* Drill Library toolbar — 4 explicit zones, never overlapping */}
        <SheetHeader className="drill-toolbar shrink-0 px-5 pt-5 pb-4 border-b border-border flex flex-col gap-3 text-left space-y-0">
          {/* Row 1 — header (title + subtitle + new-drill button) */}
          <div className="drill-toolbar-header flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex flex-col gap-1 min-w-0">
              <SheetTitle className="font-display text-lg uppercase tracking-tight leading-tight">
                {tab === "LIBRARY" ? "Drill Library" : "My Drills"}
              </SheetTitle>
              <p className="text-[12.5px] text-muted-foreground leading-snug">
                {tab === "LIBRARY"
                  ? `${drillLibrary.length} drills across ${drillCategories.length} categories. Click to add to plan.`
                  : `${visibleCustoms.length} custom drill${visibleCustoms.length === 1 ? "" : "s"} authored by you or shared with your org.`}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New drill
            </Button>
          </div>

          {/* Row 2 — tabs */}
          <div className="drill-toolbar-tabs flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-border p-0.5 bg-card">
              <button
                onClick={() => setTab("LIBRARY")}
                className={`h-7 px-3 rounded text-[11.5px] font-mono uppercase tracking-wider transition whitespace-nowrap ${
                  tab === "LIBRARY"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setTab("MINE")}
                className={`h-7 px-3 rounded text-[11.5px] font-mono uppercase tracking-wider transition whitespace-nowrap ${
                  tab === "MINE"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Drills{visibleCustoms.length > 0 ? ` · ${visibleCustoms.length}` : ""}
              </button>
            </div>
          </div>

          {/* Rows 3 + 4 — search/chips on the left, filters/matched on the right at >=lg */}
          <div className="drill-toolbar-bottom grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-4 gap-y-3 items-start">
            {/* Row 3 — search + chips */}
            <div className="drill-toolbar-search-and-chips flex flex-col gap-2 min-w-0">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, description, tag…"
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <button
                  onClick={() => setActiveCat("ALL")}
                  className={`h-7 px-2.5 rounded-full text-[11px] border whitespace-nowrap ${
                    activeCat === "ALL"
                      ? "bg-primary/15 border-primary text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  All
                </button>
                {drillCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`h-7 px-2.5 rounded-full text-[11px] border inline-flex items-center gap-1.5 whitespace-nowrap ${
                      activeCat === c.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4 — filters + matched count */}
            <div className="drill-toolbar-filters flex flex-wrap items-center gap-2 lg:justify-end">
              <Select value={activeIntensity} onValueChange={(v) => setActiveIntensity(v as any)}>
                <SelectTrigger className="h-8 min-w-[150px] text-[12px] shrink-0">
                  <SelectValue placeholder="Intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All intensities</SelectItem>
                  {INTENSITIES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={activeSurface} onValueChange={(v) => setActiveSurface(v as any)}>
                <SelectTrigger className="h-8 min-w-[150px] text-[12px] shrink-0">
                  <SelectValue placeholder="Surface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All surfaces</SelectItem>
                  {SURFACES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatSurface(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                {filtered.length} matched
              </span>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {tab === "MINE" && visibleCustoms.length === 0
                  ? "You haven't authored any drills yet. Click 'New drill' to add your first."
                  : "No drills match your filters."}
              </div>
            )}
            {filtered.map((d) => {
              const cat = findCategory(d.categoryId);
              const owned = d.isCustom && d.ownerCoachId === coachId;
              return (
                <div
                  key={d.id}
                  className="relative rounded-lg border border-border hover:border-primary/50 bg-card transition group"
                >
                  <button
                    onClick={() => {
                      onPick(d.id);
                      toast.success(`Added "${d.title}" to plan`);
                    }}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-1 h-12 rounded-full shrink-0"
                        style={{ background: cat?.color ?? "var(--muted)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-semibold text-[13.5px] truncate">{d.title}</h4>
                            {d.isCustom && (
                              <span
                                className={`text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                                  d.visibility === "public"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : d.visibility === "org"
                                      ? "bg-blue-500/15 text-blue-400"
                                      : "bg-primary/15 text-primary"
                                }`}
                              >
                                {d.visibility ?? "private"}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11.5px] text-muted-foreground shrink-0">
                            {d.defaultDurationMin} min
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">
                          {d.description}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          <span
                            className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{
                              background: `${INTENSITY_COLOR[d.intensity].replace(")", " / 0.15)")}`,
                              color: INTENSITY_COLOR[d.intensity],
                            }}
                          >
                            {d.intensity}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                            {formatSurface(d.surface)}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {d.minPlayers === d.maxPlayers
                              ? `${d.minPlayers}p`
                              : `${d.minPlayers}–${d.maxPlayers}p`}
                          </span>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary mt-1 shrink-0" />
                    </div>
                  </button>
                  {owned && (
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Edit drill"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(d);
                          setEditorOpen(true);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:text-destructive"
                        title="Delete drill"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete custom drill "${d.title}"?`)) {
                            removeCustom(d.id);
                            toast.success(`Deleted "${d.title}"—plans that already used it keep the block.`);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
      <CustomDrillEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        ownerCoachId={coachId}
        orgId={orgId}
        onSaved={(d) => {
          // Auto-switch to My Drills tab so the new entry is immediately visible.
          setTab("MINE");
          // If the user saved a brand-new drill, drop it straight into the plan
          // they're editing as a convenience (matches Coach HQ acceptance criteria).
          if (!editing) {
            onPick(d.id);
          }
        }}
      />
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Right-rail summary                                                          */
/* -------------------------------------------------------------------------- */

function PlanSummary({
  plan,
  onTitleChange,
  onFocusChange,
  onBudgetChange,
  onDateChange,
  onTimeChange,
  onStatusChange,
  onUpdate,
  onPrint,
  onCompletePractice,
}: {
  plan: PracticePlan;
  onTitleChange: (v: string) => void;
  onFocusChange: (v: string) => void;
  onBudgetChange: (v: number) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onStatusChange: (v: PracticePlan["status"]) => void;
  onUpdate: (patch: Partial<PracticePlan>) => void;
  onPrint: () => void;
  onCompletePractice: () => void;
}) {
  const total = planTotalMinutes(plan);
  const remaining = plan.budgetMin - total;
  const overBudget = remaining < 0;
  const equipment = planEquipment(plan);
  const coaches = planMaxCoaches(plan);
  const pct = Math.min(100, (total / Math.max(plan.budgetMin, 1)) * 100);

  // Distribution by category
  const dist = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of plan.blocks) {
      const drill = findDrill(b.drillId);
      if (!drill) continue;
      map.set(drill.categoryId, (map.get(drill.categoryId) ?? 0) + b.durationMin);
    }
    return Array.from(map.entries()).map(([catId, mins]) => ({
      cat: findCategory(catId)!,
      mins,
      pct: (mins / Math.max(total, 1)) * 100,
    }));
  }, [plan.blocks, total]);

  return (
    <div className="space-y-4">
      {/* Plan intent (objectives, targeting, intensity) */}
      <PlanIntentPanel plan={plan} onUpdate={onUpdate} />

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
            Plan Title
          </div>
          <Input
            value={plan.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="font-display text-base h-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
              Date
            </div>
            <Input type="date" value={plan.date} onChange={(e) => onDateChange(e.target.value)} className="h-9" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
              Start
            </div>
            <Input type="time" value={plan.startTime} onChange={(e) => onTimeChange(e.target.value)} className="h-9" />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
            Focus
          </div>
          <Textarea
            value={plan.focus}
            onChange={(e) => onFocusChange(e.target.value)}
            placeholder="What's the point of this practice?"
            rows={2}
            className="text-[12.5px] resize-none"
          />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground mb-1">
            Status
          </div>
          <Select value={plan.status} onValueChange={(v) => onStatusChange(v as PracticePlan["status"])}>
            <SelectTrigger className="h-9 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Time Budget</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            <span className={overBudget ? "text-destructive" : "text-foreground"}>{total}</span> / {plan.budgetMin} min
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${overBudget ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <NumericInput
            aria-label="Practice plan minute budget"
            value={plan.budgetMin}
            onChange={onBudgetChange}
            min={15}
            max={240}
            className="h-8 w-20 text-center font-mono text-sm"
          />
          <span className="text-[12px] text-muted-foreground">min budgeted</span>
          <span className="ml-auto text-[12px] font-mono">
            {overBudget ? (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" /> over by {Math.abs(remaining)} min
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {remaining} min left
              </span>
            )}
          </span>
        </div>
      </div>

      {dist.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
            Time by Category
          </div>
          <div className="space-y-2">
            {dist.map((row) => (
              <div key={row.cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: row.cat.color }} />
                    {row.cat.name}
                  </span>
                  <span className="font-mono text-muted-foreground">{row.mins} min · {row.pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full" style={{ background: row.cat.color, width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
          Resource Plan
        </div>
        <div className="flex items-center gap-2 text-[12.5px]">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>
            <strong className="font-mono">{coaches}</strong> coach{coaches !== 1 ? "es" : ""} needed
          </span>
        </div>
        <div className="flex items-start gap-2 text-[12.5px]">
          <Wrench className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
          <div className="flex flex-wrap gap-1">
            {equipment.length === 0 && <span className="text-muted-foreground">No equipment required</span>}
            {equipment.map((eq) => (
              <span key={eq} className="font-mono text-[11px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                {eq}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={onPrint} variant="outline" className="w-full justify-start h-9 text-[12.5px]">
          <Printer className="w-4 h-4 mr-2" /> Print / share
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/app/coach/practice-plans?id=${plan.id}`);
            toast.success("Share link copied");
          }}
          className="w-full justify-start h-9 text-[12.5px]"
        >
          <Share2 className="w-4 h-4 mr-2" /> Copy share link
        </Button>
        {plan.status !== "COMPLETED" && plan.blocks.length > 0 && (
          <Button
            onClick={onCompletePractice}
            variant="outline"
            className="w-full justify-start h-9 text-[12.5px] border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500"
          >
            <Award className="w-4 h-4 mr-2" /> Complete practice…
          </Button>
        )}
        {plan.status === "COMPLETED" && (
          <div className="flex items-center gap-2 text-[12px] text-emerald-600 font-medium p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" /> Practice completed
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Plan list (left rail)                                                       */
/* -------------------------------------------------------------------------- */

function PlanList({
  plans,
  activeId,
  onPick,
  onCreate,
  onDuplicate,
  onDelete,
}: {
  plans: PracticePlan[];
  activeId: string | null;
  onPick: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card flex flex-col h-fit max-h-[calc(100vh-180px)]">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">Plans</div>
          <div className="font-display text-base mt-0.5">{plans.length}</div>
        </div>
        <Button size="sm" onClick={onCreate} className="h-8 px-3">
          <Plus className="w-3.5 h-3.5 mr-1" /> New
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {plans.map((p) => {
            const isActive = p.id === activeId;
            const total = planTotalMinutes(p);
            return (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => onPick(p.id)}
                  className={`w-full text-left rounded-md p-2.5 transition ${
                    isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[13px] truncate flex-1">{p.title}</span>
                    {p.status === "PUBLISHED" && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-emerald-500/30 text-emerald-400">
                        LIVE
                      </Badge>
                    )}
                    {p.status === "DRAFT" && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-amber-500/30 text-amber-400">
                        DRAFT
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {formatTime(p.date, p.startTime)} · {total}m / {p.budgetMin}m
                  </div>
                </button>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(p.id);
                    }}
                    className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                    aria-label="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${p.title}"?`)) onDelete(p.id);
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Print / share dialog                                                        */
/* -------------------------------------------------------------------------- */

function PrintView({ plan }: { plan: PracticePlan }) {
  let cumulative = 0;
  return (
    <div className="bg-white text-black p-8 font-sans rounded-md">
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">HoopsOS · Practice Plan</div>
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <div className="text-sm mt-1">
          {formatTime(plan.date, plan.startTime)} · Budget {plan.budgetMin} min · {plan.authorName}
        </div>
        {plan.focus && <div className="text-sm mt-2 italic text-zinc-700">Focus: {plan.focus}</div>}
        {(plan.objectives ?? []).length > 0 && (
          <div className="text-xs mt-1 text-zinc-600">
            Objectives: {(plan.objectives ?? []).map((o) => o.label).join(" · ")}
          </div>
        )}
        {plan.opponent && (
          <div className="text-xs mt-0.5 text-zinc-600">Opponent prep: {plan.opponent}</div>
        )}
        {plan.targetGroup && (
          <div className="text-xs mt-0.5 text-zinc-600">Target group: {plan.targetGroup.label}</div>
        )}
      </div>

      <table className="w-full text-sm">
        <thead className="border-b-2 border-black text-left">
          <tr>
            <th className="py-1.5 pr-2 w-12">#</th>
            <th className="py-1.5 pr-2 w-20">Time</th>
            <th className="py-1.5 pr-2 w-16">Min</th>
            <th className="py-1.5 pr-2">Drill</th>
            <th className="py-1.5 pr-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {plan.blocks.map((b, i) => {
            const drill = findDrill(b.drillId);
            const startsAt = addMinutes(plan.date, plan.startTime, cumulative);
            cumulative += b.durationMin;
            return (
              <tr key={b.id} className="border-b border-zinc-300">
                <td className="py-1.5 pr-2 font-mono">{String(i + 1).padStart(2, "0")}</td>
                <td className="py-1.5 pr-2 font-mono">{startsAt}</td>
                <td className="py-1.5 pr-2 font-mono">{b.durationMin}</td>
                <td className="py-1.5 pr-2">
                  <div className="font-semibold">{drill?.title}</div>
                  <div className="text-xs text-zinc-600">{drill?.description}</div>
                </td>
                <td className="py-1.5 pr-2 text-xs">{b.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 text-xs flex items-center justify-between">
        <span>Total scheduled: {planTotalMinutes(plan)} min · Equipment: {planEquipment(plan).join(", ") || "—"}</span>
        <span>Generated by HoopsOS</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function CoachPracticePlanBuilder() {
  const { plans, activePlanId, setActive, createPlan, duplicatePlan, deletePlan, updatePlan, addBlock, updateBlock, removeBlock, reorderBlocks, completePlan } =
    usePracticePlans();
  const { user } = useAuth();
  const [printOpen, setPrintOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"plans" | "build" | "details">("build");

  // Sync plans to/from server so they appear on all devices
  usePracticePlanSync(user?.id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const plan = plans.find((p) => p.id === activePlanId) ?? plans[0];

  if (!plan) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 max-w-[900px] mx-auto">
          <div className="text-center py-12 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl mb-2">Build your first practice plan</h2>
            <p className="text-[13px] text-muted-foreground max-w-sm mx-auto mb-6">
              Set objectives, sequence drills, track intensity, and review outcomes — all in one place.
            </p>
            <Button onClick={() => createPlan()} size="lg">
              <Plus className="w-4 h-4 mr-1.5" /> Blank plan
            </Button>
          </div>

          {/* Quick-start templates */}
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-3 text-center">
            Or start from a template
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLAN_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                onClick={() => {
                  const id = createPlan({
                    title: tmpl.overrides.title,
                    date: new Date().toISOString().slice(0, 10),
                    ...tmpl.overrides,
                  });
                  setActive(id);
                  toast.success(`"${tmpl.label}" template loaded`);
                }}
                className="group text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/4 transition p-5"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3 text-muted-foreground group-hover:text-primary transition">
                  {tmpl.icon}
                </div>
                <div className="font-semibold text-[14px] mb-1">{tmpl.label}</div>
                <div className="text-[12px] text-muted-foreground">{tmpl.desc}</div>
                {tmpl.overrides.plannedIntensity && (
                  <div className="mt-2">
                    {(() => {
                      const lv = PRACTICE_INTENSITIES.find((l) => l.value === tmpl.overrides.plannedIntensity);
                      return lv ? (
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                          style={{ borderColor: `${lv.color}50`, background: `${lv.color}18`, color: lv.color }}
                        >
                          {lv.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = plan.blocks.findIndex((b) => b.id === active.id);
    const toIndex = plan.blocks.findIndex((b) => b.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    reorderBlocks(plan.id, fromIndex, toIndex);
  };

  // Cumulative starts for each block
  let cumulative = 0;
  const startTimes = plan.blocks.map((b) => {
    const start = addMinutes(plan.date, plan.startTime, cumulative);
    cumulative += b.durationMin;
    return start;
  });

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1500px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ"
          title="Practice Plan Builder"
          subtitle="Drag drills from the library, sequence them, watch the clock. Print to PDF for your staff or share a read-only link."
          actions={
            <div className="flex items-center gap-2">
              <Link href="/app/coach" asChild>
                <a className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Coach HQ <ChevronRight className="w-3 h-3" />
                </a>
              </Link>
              <DrillLibraryDrawer
                onPick={(drillId) => addBlock(plan.id, drillId)}
                trigger={
                  <Button className="h-9 px-4 font-semibold">
                    <Plus className="w-4 h-4 mr-1.5" /> Add Drill
                  </Button>
                }
              />
            </div>
          }
        />

        {/* Mobile tab switcher — hidden on desktop where all 3 columns are visible */}
        <div className="lg:hidden flex border border-border rounded-lg overflow-hidden mb-4">
          {(["plans", "build", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 h-10 text-[12px] font-mono uppercase tracking-wider transition ${
                mobileTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "plans" ? "Plans" : tab === "build" ? "Build" : "Details"}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[260px_1fr_320px] gap-5">
          {/* Left rail: plan list */}
          <div className={mobileTab !== "plans" ? "hidden lg:block" : ""}>
          <PlanList
            plans={plans}
            activeId={activePlanId}
            onPick={setActive}
            onCreate={() => {
              const id = createPlan({
                title: "New Practice Plan",
                date: new Date().toISOString().slice(0, 10),
              });
              toast.success("New plan created");
              setActive(id);
            }}
            onDuplicate={(id) => {
              duplicatePlan(id);
              toast.success("Plan duplicated");
            }}
            onDelete={(id) => {
              deletePlan(id);
              toast.success("Plan deleted");
            }}
          />
          </div>

          {/* Center: timeline */}
          <div className={`rounded-xl border border-border bg-card overflow-hidden ${mobileTab !== "build" ? "hidden lg:block" : ""}`}>
            <div className="p-5 border-b border-border bg-gradient-to-b from-card to-background">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-muted-foreground">
                      Practice timeline
                    </div>
                    {plan.status === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-xl uppercase tracking-tight">{plan.title}</h2>
                  {/* Objective tags — compact inline row */}
                  {(plan.objectives ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(plan.objectives ?? []).map((o) => <ObjectiveChip key={o.id} obj={o} />)}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] text-muted-foreground">{formatTime(plan.date, plan.startTime)}</div>
                  <div className="font-mono text-[14px] mt-0.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                    {planTotalMinutes(plan)}m
                    <span className="text-muted-foreground"> / {plan.budgetMin}m</span>
                  </div>
                  {plan.plannedIntensity && (() => {
                    const lv = PRACTICE_INTENSITIES.find((l) => l.value === plan.plannedIntensity);
                    return lv ? (
                      <div className="mt-1 text-[10px] font-mono" style={{ color: lv.color }}>
                        <Flame className="w-2.5 h-2.5 inline mr-0.5" />{lv.label}
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
              {plan.focus && (
                <p className="text-[12.5px] text-muted-foreground italic">{plan.focus}</p>
              )}
            </div>

            {plan.blocks.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg mb-1">No drills yet</h3>
                <p className="text-[13px] text-muted-foreground mb-1">
                  Add drills from the library to build your timeline.
                </p>
                <p className="text-[12px] text-muted-foreground mb-5 italic">
                  Set objectives in the Details panel so every drill has a purpose.
                </p>
                <DrillLibraryDrawer
                  onPick={(drillId) => addBlock(plan.id, drillId)}
                  trigger={
                    <Button>
                      <Plus className="w-4 h-4 mr-1.5" /> Open Drill Library
                    </Button>
                  }
                />
              </div>
            )}

            {plan.blocks.length > 0 && (
              <div className="p-4">
                {/* Pre-practice summary card */}
                {plan.status !== "COMPLETED" && (
                  <PrePracticeSummaryCard plan={plan} />
                )}
                {/* Post-practice completed view */}
                {plan.status === "COMPLETED" && plan.reflection && (
                  <CompletedPlanView plan={plan} />
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={plan.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {plan.blocks.map((b, i) => (
                        <BlockRow
                          key={b.id}
                          block={b}
                          drill={findDrill(b.drillId)}
                          index={i}
                          startsAt={startTimes[i]}
                          onDurationChange={(mins) => updateBlock(plan.id, b.id, { durationMin: mins })}
                          onNotesChange={(notes) => updateBlock(plan.id, b.id, { notes })}
                          onRemove={() => removeBlock(plan.id, b.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <DrillLibraryDrawer
                    onPick={(drillId) => addBlock(plan.id, drillId)}
                    trigger={
                      <Button variant="outline" className="h-9">
                        <Plus className="w-4 h-4 mr-1.5" /> Add another drill
                      </Button>
                    }
                  />
                  <div className="text-[12px] font-mono text-muted-foreground">
                    Last edited {new Date(plan.updatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right rail: summary + intent + recommendations */}
          <div className={`space-y-4 ${mobileTab !== "details" ? "hidden lg:block" : ""}`}>
            <PlanSummary
              plan={plan}
              onTitleChange={(v) => updatePlan(plan.id, { title: v })}
              onFocusChange={(v) => updatePlan(plan.id, { focus: v })}
              onBudgetChange={(v) => updatePlan(plan.id, { budgetMin: v })}
              onDateChange={(v) => updatePlan(plan.id, { date: v })}
              onTimeChange={(v) => updatePlan(plan.id, { startTime: v })}
              onStatusChange={(v) => updatePlan(plan.id, { status: v })}
              onUpdate={(patch) => updatePlan(plan.id, patch)}
              onPrint={() => setPrintOpen(true)}
              onCompletePractice={() => setReviewOpen(true)}
            />
            {plan.status !== "COMPLETED" && (
              <>
                <TeamReadinessPanel />
                <RecommendationsStrip onAddDrill={(drillId) => addBlock(plan.id, drillId)} />
              </>
            )}
          </div>
        </div>

        <Dialog open={printOpen} onOpenChange={setPrintOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Print / share view</DialogTitle>
            </DialogHeader>
            <PrintView plan={plan} />
            <div className="flex items-center justify-between mt-2">
              <div className="text-[11px] text-muted-foreground">
                Production: a "Print as PDF" action would render this through React-PDF.
              </div>
              <Button onClick={() => window.print()} variant="outline" size="sm">
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Browser print
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <PostPracticeReview
          plan={plan}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onSubmit={(reflection) => completePlan(plan.id, reflection)}
        />
      </div>
    </AppShell>
  );
}

export default CoachPracticePlanBuilder;
