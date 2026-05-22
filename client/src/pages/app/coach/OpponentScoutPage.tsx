import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  ChevronLeft, Plus, Printer, Share2, CheckCircle2, Edit3,
  Film, BookOpen, CalendarPlus, AlertTriangle, Crosshair,
  Star, Target, Users, ClipboardList, FileText, X,
  Dumbbell, Trophy, Shield, Flame, ChevronDown, ChevronUp,
  Check, Clock, Circle, Copy, Link2, Sparkles, History,
  ArrowUp, ArrowDown, Minus, BarChart2, Zap, RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  mockOpponents, mockScoutReports, mockScoutPlays,
  mockOpponentHistory, mockAISuggestions,
  teamColor, statusMeta,
  TENDENCY_CAT_LABEL, SEVERITY_COLOR, TASK_TYPE_LABEL,
  SCOUT_PLAY_CAT_LABEL, SCOUT_TEAM_ROLES,
  generatePracticeEmphasis, PRACTICE_BLOCK_FOCUS_LABEL,
  type ScoutReport, type ScoutTendency, type ScoutKeyPlayer,
  type MatchupNote, type ScoutAssignment, type Severity,
  type TendencyCategory, type ThreatLevel, type ScoutPlayCategory,
  type AITendencySuggestion, type GeneratedPracticeBlock,
} from "@/features/scouting/mock";

// ── Tab definition ─────────────────────────────────────────────────────────

type Tab =
  | "game_plan"
  | "tendencies"
  | "key_players"
  | "matchups"
  | "assignments"
  | "clips"
  | "plays"
  | "history"
  | "practice";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "game_plan",   label: "Game Plan",   icon: <Crosshair className="w-3.5 h-3.5" /> },
  { key: "tendencies",  label: "Tendencies",  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: "key_players", label: "Key Players", icon: <Star className="w-3.5 h-3.5" /> },
  { key: "matchups",    label: "Matchups",    icon: <Users className="w-3.5 h-3.5" /> },
  { key: "assignments", label: "Assignments", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: "clips",       label: "Clips",       icon: <Film className="w-3.5 h-3.5" /> },
  { key: "plays",       label: "Scout Plays", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { key: "history",     label: "History",     icon: <History className="w-3.5 h-3.5" /> },
  { key: "practice",   label: "Practice",    icon: <Dumbbell className="w-3.5 h-3.5" /> },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function ThreatStars({ level, interactive = false, onChange }: {
  level: ThreatLevel;
  interactive?: boolean;
  onChange?: (v: ThreatLevel) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 transition-colors ${
            i <= (hover || level)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          } ${interactive ? "cursor-pointer" : ""}`}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(i as ThreatLevel)}
        />
      ))}
    </div>
  );
}

function SeverityPill({ severity }: { severity: Severity }) {
  const c = SEVERITY_COLOR[severity];
  const labels: Record<Severity, string> = {
    low: "Low", medium: "Medium", high: "High", critical: "Critical",
  };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize"
      style={{ color: c.text, background: c.bg, borderColor: c.border }}
    >
      {labels[severity]}
    </span>
  );
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {count != null && (
        <span className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5">{count}</span>
      )}
    </div>
  );
}

// ── Game Plan Tab ──────────────────────────────────────────────────────────

function GamePlanTab({
  report, onUpdate,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void }) {
  const [editSummary, setEditSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(report.gamePlanSummary);
  const [newKey, setNewKey] = useState("");

  function addKey() {
    if (!newKey.trim()) return;
    onUpdate({ keysToWin: [...report.keysToWin, newKey.trim()] });
    setNewKey("");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel label="Game plan summary" />
          <Button
            size="sm" variant="ghost" className="h-7 text-[11px] gap-1"
            onClick={() => { setEditSummary(!editSummary); setSummaryDraft(report.gamePlanSummary); }}
          >
            <Edit3 className="w-3 h-3" />{editSummary ? "Cancel" : "Edit"}
          </Button>
        </div>
        {editSummary ? (
          <div className="space-y-2">
            <Textarea
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              className="text-[13px] min-h-[120px] resize-none"
            />
            <Button size="sm" onClick={() => {
              onUpdate({ gamePlanSummary: summaryDraft });
              setEditSummary(false);
              toast.success("Summary saved");
            }}>
              Save
            </Button>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {report.gamePlanSummary || <span className="italic">Add a game plan narrative…</span>}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <SectionLabel label="Keys to the game" count={report.keysToWin.length} />
        <div className="space-y-2 mb-3">
          {report.keysToWin.map((key, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 group rounded-lg px-3 py-2.5 bg-muted/40 border border-border/50"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="flex-1 text-[13px] leading-snug">{key}</p>
              <button
                onClick={() => onUpdate({ keysToWin: report.keysToWin.filter((_, idx) => idx !== i) })}
                className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKey()}
            placeholder="Add a key to the game…"
            className="text-[12px] h-8 flex-1"
          />
          <Button size="sm" onClick={addKey} disabled={!newKey.trim()} className="h-8">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {report.keyPlayers.filter((p) => p.threatLevel >= 3).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionLabel label="Primary threats at a glance" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.keyPlayers
              .filter((p) => p.threatLevel >= 3)
              .sort((a, b) => b.threatLevel - a.threatLevel)
              .map((player) => (
                <div key={player.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold bg-muted rounded px-1.5 py-0.5">
                      #{player.jerseyNumber}
                    </span>
                    <span className="font-semibold text-[13px] truncate">{player.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{player.position}</span>
                  </div>
                  <ThreatStars level={player.threatLevel} />
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug line-clamp-2">
                    {player.defensivePlan}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tendencies ─────────────────────────────────────────────────────────────

function TendencyCard({
  tendency, onRemove,
}: { tendency: ScoutTendency; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const c = SEVERITY_COLOR[tendency.severity];
  return (
    <div className="rounded-xl border bg-card overflow-hidden" style={{ borderColor: c.border }}>
      <div
        className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        style={{ background: c.bg }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[13.5px]">{tendency.title}</span>
            <SeverityPill severity={tendency.severity} />
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tendency.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] bg-muted/70 border border-border/50 rounded px-1.5 py-0.5 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 py-3 border-t border-border/40">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {tendency.description}
          </p>
          {tendency.clipId && (
            <button className="mt-2 text-[11px] text-primary hover:underline flex items-center gap-1">
              <Film className="w-3 h-3" /> View clip
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AISuggestionCard({
  suggestion, onAccept, onDismiss,
}: {
  suggestion: AITendencySuggestion;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const c = SEVERITY_COLOR[suggestion.severity];
  const confPct = Math.round(suggestion.confidence * 100);
  return (
    <div className="rounded-xl border border-[oklch(0.65_0.18_290/0.3)] bg-[oklch(0.65_0.18_290/0.04)] overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[oklch(0.65_0.18_290)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-[13px]">{suggestion.title}</span>
            <SeverityPill severity={suggestion.severity} />
            <span className="text-[10px] text-muted-foreground ml-auto">
              {confPct}% confidence
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-snug">
            {suggestion.description}
          </p>
          <p className="text-[10.5px] text-[oklch(0.65_0.18_290)] mt-1.5 font-medium">
            {suggestion.sourceSummary}
          </p>
        </div>
      </div>
      <div className="px-4 pb-3 flex items-center gap-2 border-t border-[oklch(0.65_0.18_290/0.15)] pt-2.5">
        <Button
          size="sm" className="h-6 text-[10.5px] gap-1 bg-[oklch(0.65_0.18_290)] hover:bg-[oklch(0.60_0.18_290)] text-white"
          onClick={onAccept}
        >
          <Check className="w-3 h-3" /> Add to report
        </Button>
        <Button
          size="sm" variant="ghost" className="h-6 text-[10.5px] text-muted-foreground"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function AddTendencyDialog({
  open, onClose, onAdd, side,
}: { open: boolean; onClose: () => void; onAdd: (t: ScoutTendency) => void; side: "offense" | "defense" }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TendencyCategory>("halfcourt_offense");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const offenseCats: TendencyCategory[] = ["halfcourt_offense", "transition_offense", "special_situations"];
  const defenseCats: TendencyCategory[] = ["halfcourt_defense", "transition_defense", "press", "rebounding"];
  const cats = side === "offense" ? offenseCats : defenseCats;

  function addTag() {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    setTags([...tags, tagInput.trim()]);
    setTagInput("");
  }

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({
      id: `t_${Date.now()}`,
      category,
      title: title.trim(),
      description: description.trim(),
      severity,
      tags,
    });
    setTitle(""); setDescription(""); setTags([]); setTagInput("");
    onClose();
    toast.success("Tendency added");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {side === "offense" ? "Offensive" : "Defensive"} Tendency
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    category === cat
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {TENDENCY_CAT_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Severity</label>
            <div className="flex gap-1.5">
              {(["low", "medium", "high", "critical"] as Severity[]).map((s) => {
                const c = SEVERITY_COLOR[s];
                return (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`flex-1 text-[11px] py-1.5 rounded-lg border capitalize font-medium transition-all ${
                      severity === s ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-80"
                    }`}
                    style={{
                      color: c.text,
                      background: severity === s ? c.bg : undefined,
                      borderColor: c.border,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tendency title…"
            className="text-[13px]"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the tendency — what they do, when they do it, and how to counter it…"
            className="text-[13px] min-h-[80px] resize-none"
          />
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Tags</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag…"
                className="text-[12px] h-7 flex-1"
              />
              <Button size="sm" variant="outline" className="h-7" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-muted rounded-full px-2 py-0.5 flex items-center gap-1"
                  >
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!title.trim()}>Add tendency</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TendenciesTab({
  report, onUpdate, opponentId,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void; opponentId: string }) {
  const [addSide, setAddSide] = useState<"offense" | "defense" | null>(null);
  const [dismissedAI, setDismissedAI] = useState<Set<string>>(new Set());

  const aiSuggestions = mockAISuggestions.filter(
    (s) => s.opponentId === opponentId && !dismissedAI.has(s.id),
  );
  const aiOffense = aiSuggestions.filter((s) => s.side === "offense");
  const aiDefense = aiSuggestions.filter((s) => s.side === "defense");

  function acceptAI(s: AITendencySuggestion) {
    const t: ScoutTendency = {
      id: `t_ai_${s.id}`,
      category: s.category,
      title: s.title,
      description: s.description,
      severity: s.severity,
      tags: s.tags,
    };
    if (s.side === "offense") {
      onUpdate({ offenseTendencies: [...report.offenseTendencies, t] });
    } else {
      onUpdate({ defenseTendencies: [...report.defenseTendencies, t] });
    }
    setDismissedAI((p) => new Set(Array.from(p).concat(s.id)));
    toast.success("Tendency added from AI analysis");
  }

  function dismissAI(id: string) {
    setDismissedAI((p) => new Set(Array.from(p).concat(id)));
  }

  function removeOffense(id: string) {
    onUpdate({ offenseTendencies: report.offenseTendencies.filter((t) => t.id !== id) });
  }
  function removeDefense(id: string) {
    onUpdate({ defenseTendencies: report.defenseTendencies.filter((t) => t.id !== id) });
  }

  const offByCat = report.offenseTendencies.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, ScoutTendency[]>);

  const defByCat = report.defenseTendencies.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, ScoutTendency[]>);

  return (
    <div className="space-y-6">
      {/* AI suggestions panel */}
      {aiSuggestions.length > 0 && (
        <div className="rounded-xl border border-[oklch(0.65_0.18_290/0.3)] bg-[oklch(0.65_0.18_290/0.04)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[oklch(0.65_0.18_290)]" />
            <span className="text-[12px] font-semibold text-[oklch(0.65_0.18_290)]">
              AI Film Analysis — {aiSuggestions.length} suggested tendencies
            </span>
          </div>
          <p className="text-[11.5px] text-muted-foreground mb-3">
            Detected from Westbury film sessions. Review and add what's accurate.
          </p>
          <div className="space-y-2">
            {aiSuggestions.map((s) => (
              <AISuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={() => acceptAI(s)}
                onDismiss={() => dismissAI(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Offensive tendencies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel label="Offensive tendencies" count={report.offenseTendencies.length} />
          <Button
            size="sm" variant="outline" className="h-7 text-[11px] gap-1"
            onClick={() => setAddSide("offense")}
          >
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        {report.offenseTendencies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="w-5 h-5 text-muted-foreground/30" />
            <p className="text-[12px] text-muted-foreground">
              No offensive tendencies yet. Add what you know — or accept an AI suggestion above.
            </p>
          </div>
        ) : (
          Object.entries(offByCat).map(([cat, tendencies]) => (
            <div key={cat} className="mb-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2 pl-1">
                {TENDENCY_CAT_LABEL[cat as TendencyCategory]}
              </div>
              <div className="space-y-2">
                {tendencies.map((t) => (
                  <TendencyCard key={t.id} tendency={t} onRemove={() => removeOffense(t.id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Defensive tendencies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel label="Defensive tendencies" count={report.defenseTendencies.length} />
          <Button
            size="sm" variant="outline" className="h-7 text-[11px] gap-1"
            onClick={() => setAddSide("defense")}
          >
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        {report.defenseTendencies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 flex flex-col items-center gap-2 text-center">
            <Shield className="w-5 h-5 text-muted-foreground/30" />
            <p className="text-[12px] text-muted-foreground">No defensive tendencies yet.</p>
          </div>
        ) : (
          Object.entries(defByCat).map(([cat, tendencies]) => (
            <div key={cat} className="mb-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2 pl-1">
                {TENDENCY_CAT_LABEL[cat as TendencyCategory]}
              </div>
              <div className="space-y-2">
                {tendencies.map((t) => (
                  <TendencyCard key={t.id} tendency={t} onRemove={() => removeDefense(t.id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {addSide && (
        <AddTendencyDialog
          open
          side={addSide}
          onClose={() => setAddSide(null)}
          onAdd={(t) => {
            if (addSide === "offense") onUpdate({ offenseTendencies: [...report.offenseTendencies, t] });
            else onUpdate({ defenseTendencies: [...report.defenseTendencies, t] });
          }}
        />
      )}
    </div>
  );
}

// ── Key Players ────────────────────────────────────────────────────────────

function KeyPlayerCard({ player, onRemove }: { player: ScoutKeyPlayer; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const threatColor =
    player.threatLevel >= 5 ? "oklch(0.68 0.22 25)"
    : player.threatLevel >= 4 ? "oklch(0.65 0.18 35)"
    : player.threatLevel >= 3 ? "oklch(0.65 0.17 75)"
    : "oklch(0.60 0.05 240)";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-[13px] border shrink-0"
          style={{
            color: threatColor,
            background: `${threatColor.replace(")", " / 0.1)")}`,
            borderColor: `${threatColor.replace(")", " / 0.3)")}`,
          }}
        >
          #{player.jerseyNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px]">{player.name}</span>
            <span className="text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              {player.position}
            </span>
            {player.height && (
              <span className="text-[11px] text-muted-foreground">{player.height}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ThreatStars level={player.threatLevel} />
            {player.defensiveAssignment && (
              <span className="text-[10.5px] text-muted-foreground">
                → {player.defensiveAssignment}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!expanded && (
        <div className="px-4 pb-3 text-[11.5px] text-muted-foreground border-t border-border/40 pt-2">
          <p className="line-clamp-2 leading-snug">{player.defensivePlan}</p>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-[oklch(0.60_0.15_145)] mb-1.5">
                Strengths
              </div>
              <ul className="space-y-1">
                {player.strengths.map((s, i) => (
                  <li key={i} className="text-[11.5px] flex items-start gap-1.5">
                    <Flame className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-[oklch(0.60_0.15_145)] mb-1.5">
                Weaknesses
              </div>
              <ul className="space-y-1">
                {player.weaknesses.map((w, i) => (
                  <li key={i} className="text-[11.5px] flex items-start gap-1.5">
                    <Target className="w-3 h-3 text-primary shrink-0 mt-0.5" />{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {player.goToMoves.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                Go-to moves
              </div>
              <div className="flex flex-wrap gap-1.5">
                {player.goToMoves.map((m, i) => (
                  <span
                    key={i}
                    className="text-[10.5px] bg-muted/70 border border-border/50 rounded px-2 py-0.5 text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-primary mb-1">
              Defensive plan
            </div>
            <p className="text-[12px] leading-snug">{player.defensivePlan}</p>
          </div>
          {player.notes && (
            <p className="text-[11.5px] text-muted-foreground italic">
              Coach note: {player.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AddPlayerDialog({
  open, onClose, onAdd,
}: { open: boolean; onClose: () => void; onAdd: (p: ScoutKeyPlayer) => void }) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState<ScoutKeyPlayer["position"]>("PG");
  const [height, setHeight] = useState("");
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(3);
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [goToMoves, setGoToMoves] = useState("");
  const [defensivePlan, setDefensivePlan] = useState("");
  const [assignment, setAssignment] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setName(""); setJersey(""); setPosition("PG"); setHeight("");
    setThreatLevel(3); setStrengths(""); setWeaknesses("");
    setGoToMoves(""); setDefensivePlan(""); setAssignment(""); setNotes("");
  }

  function handleAdd() {
    if (!name.trim() || !jersey.trim()) return;
    onAdd({
      id: `kp_${Date.now()}`,
      name: name.trim(),
      jerseyNumber: jersey.trim(),
      position,
      height: height.trim() || undefined,
      threatLevel,
      strengths: strengths.split(",").map((s) => s.trim()).filter(Boolean),
      weaknesses: weaknesses.split(",").map((w) => w.trim()).filter(Boolean),
      goToMoves: goToMoves.split(",").map((m) => m.trim()).filter(Boolean),
      defensivePlan: defensivePlan.trim(),
      defensiveAssignment: assignment.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    reset();
    onClose();
    toast.success("Key player added");
  }

  const POSITIONS: ScoutKeyPlayer["position"][] = ["PG", "SG", "SF", "PF", "C", "G", "F"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Key Player</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1 block">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" className="text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Jersey *</label>
              <Input value={jersey} onChange={(e) => setJersey(e.target.value)} placeholder="#5" className="text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Position</label>
              <Select value={position} onValueChange={(v) => setPosition(v as ScoutKeyPlayer["position"])}>
                <SelectTrigger className="h-9 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Height</label>
              <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder='6"2' className="text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Threat level</label>
              <div className="h-9 flex items-center">
                <ThreatStars level={threatLevel} interactive onChange={setThreatLevel} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">
              Strengths <span className="text-muted-foreground/60">(comma-separated)</span>
            </label>
            <Input value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="Elite PnR, Good shooter, Fast" className="text-[12px]" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">
              Weaknesses <span className="text-muted-foreground/60">(comma-separated)</span>
            </label>
            <Input value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} placeholder="Weak left hand, Poor FT shooter" className="text-[12px]" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">
              Go-to moves <span className="text-muted-foreground/60">(comma-separated)</span>
            </label>
            <Input value={goToMoves} onChange={(e) => setGoToMoves(e.target.value)} placeholder="PnR top-key, Step-back mid" className="text-[12px]" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Defensive plan</label>
            <Textarea
              value={defensivePlan}
              onChange={(e) => setDefensivePlan(e.target.value)}
              placeholder="How we guard this player…"
              className="text-[12px] min-h-[60px] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Our assignment</label>
              <Input value={assignment} onChange={(e) => setAssignment(e.target.value)} placeholder="Marcus Johnson" className="text-[12px]" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Coach note</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note…" className="text-[12px]" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!name.trim() || !jersey.trim()}>Add player</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeyPlayersTab({
  report, onUpdate,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const sorted = [...report.keyPlayers].sort((a, b) => b.threatLevel - a.threatLevel);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionLabel label="Scouted players" count={report.keyPlayers.length} />
        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="w-3 h-3" /> Add player
        </Button>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 flex flex-col items-center gap-3 text-center">
          <Star className="w-6 h-6 text-muted-foreground/30" />
          <div>
            <p className="text-[13px] text-muted-foreground">No key players added yet.</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Add the players your team needs to know about.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="w-3 h-3" /> Add first player
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((player) => (
            <KeyPlayerCard
              key={player.id}
              player={player}
              onRemove={() => onUpdate({ keyPlayers: report.keyPlayers.filter((p) => p.id !== player.id) })}
            />
          ))}
        </div>
      )}
      <AddPlayerDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(p) => onUpdate({ keyPlayers: [...report.keyPlayers, p] })}
      />
    </div>
  );
}

// ── Matchups ───────────────────────────────────────────────────────────────

function AddMatchupDialog({
  open, onClose, onAdd, keyPlayers,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (m: MatchupNote) => void;
  keyPlayers: ScoutKeyPlayer[];
}) {
  const [ourPlayer, setOurPlayer] = useState("");
  const [theirPlayer, setTheirPlayer] = useState("");
  const [theirJersey, setTheirJersey] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<"primary" | "secondary">("primary");

  function handleAdd() {
    if (!ourPlayer.trim() || !theirPlayer.trim()) return;
    onAdd({
      id: `mn_${Date.now()}`,
      ourPlayerName: ourPlayer.trim(),
      theirPlayerName: theirPlayer.trim(),
      theirJerseyNumber: theirJersey.trim(),
      coachNote: note.trim(),
      priority,
    });
    setOurPlayer(""); setTheirPlayer(""); setTheirJersey(""); setNote("");
    onClose();
    toast.success("Matchup added");
  }

  // Prefill their jersey when a known key player is selected
  function selectTheirPlayer(name: string) {
    setTheirPlayer(name);
    const kp = keyPlayers.find((p) => p.name === name);
    if (kp) setTheirJersey(kp.jerseyNumber);
  }

  const ROSTER_NAMES = [
    "Marcus Johnson", "DeShawn Williams", "Tyler Brooks",
    "Jordan Davis", "Elijah Carter", "Jaylen Scott",
    "Cam Porter", "Noah Rivera",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Matchup Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Our player</label>
            <Select value={ourPlayer} onValueChange={setOurPlayer}>
              <SelectTrigger className="h-9 text-[12px]">
                <SelectValue placeholder="Select our player…" />
              </SelectTrigger>
              <SelectContent>
                {ROSTER_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1 block">Their player</label>
              {keyPlayers.length > 0 ? (
                <Select value={theirPlayer} onValueChange={selectTheirPlayer}>
                  <SelectTrigger className="h-9 text-[12px]">
                    <SelectValue placeholder="Select or type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {keyPlayers.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        #{p.jerseyNumber} {p.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={theirPlayer}
                  onChange={(e) => setTheirPlayer(e.target.value)}
                  placeholder="Opponent player name"
                  className="text-[12px]"
                />
              )}
              {theirPlayer === "__custom" && (
                <Input
                  className="mt-1 text-[12px]"
                  placeholder="Enter name…"
                  onChange={(e) => setTheirPlayer(e.target.value)}
                />
              )}
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Jersey #</label>
              <Input
                value={theirJersey}
                onChange={(e) => setTheirJersey(e.target.value)}
                placeholder="5"
                className="text-[12px]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Coach note</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Force baseline, no middle drives. Contest every catch…"
              className="text-[12px] min-h-[70px] resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Priority</label>
            <div className="flex gap-2">
              {(["primary", "secondary"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 text-[12px] rounded-lg border capitalize font-medium transition-colors ${
                    priority === p
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={!ourPlayer.trim() || !theirPlayer.trim() || theirPlayer === "__custom"}
          >
            Add matchup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MatchupsTab({
  report, onUpdate,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionLabel label="Matchup assignments" count={report.matchupNotes.length} />
        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="w-3 h-3" /> Add matchup
        </Button>
      </div>
      {report.matchupNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 flex flex-col items-center gap-3 text-center">
          <Users className="w-6 h-6 text-muted-foreground/30" />
          <div>
            <p className="text-[13px] text-muted-foreground">No matchup notes yet.</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Assign your players to guard their key threats.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="w-3 h-3" /> Add first matchup
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {report.matchupNotes.map((mn) => (
            <div
              key={mn.id}
              className={`rounded-xl border bg-card p-4 ${mn.priority === "primary" ? "border-primary/25" : "border-border"}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-[13px]">{mn.ourPlayerName}</span>
                    <span className="text-muted-foreground text-[12px]">on</span>
                    <span className="font-semibold text-[13px]">
                      #{mn.theirJerseyNumber} {mn.theirPlayerName}
                    </span>
                    {mn.priority === "primary" && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12.5px] text-muted-foreground leading-snug">{mn.coachNote}</p>
                </div>
                <button
                  onClick={() => onUpdate({ matchupNotes: report.matchupNotes.filter((m) => m.id !== mn.id) })}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddMatchupDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(m) => onUpdate({ matchupNotes: [...report.matchupNotes, m] })}
        keyPlayers={report.keyPlayers}
      />
    </div>
  );
}

// ── Assignments ────────────────────────────────────────────────────────────

const ASSIGNMENT_STATUS_ICON: Record<ScoutAssignment["status"], React.ReactNode> = {
  open:        <Circle className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Clock className="w-4 h-4 text-[oklch(0.65_0.17_75)]" />,
  done:        <Check className="w-4 h-4 text-[oklch(0.60_0.15_145)]" />,
};

function CreateAssignmentDialog({
  open, onClose, onAdd,
}: { open: boolean; onClose: () => void; onAdd: (a: ScoutAssignment) => void }) {
  const [assignee, setAssignee] = useState("");
  const [taskType, setTaskType] = useState<ScoutAssignment["taskType"]>("watch_film");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const STAFF = [
    "Coach Martinez", "Coach Thompson", "Coach Williams",
    "Player: Trey Evans", "Player: Marcus Johnson", "Custom…",
  ];

  function handleAdd() {
    if (!assignee.trim() || !description.trim()) return;
    onAdd({
      id: `sa_${Date.now()}`,
      assigneeName: assignee.trim(),
      taskType,
      description: description.trim(),
      dueDate: dueDate || undefined,
      status: "open",
    });
    setAssignee(""); setDescription(""); setDueDate("");
    onClose();
    toast.success("Assignment created");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Scout Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Assign to</label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-9 text-[12px]">
                <SelectValue placeholder="Select person…" />
              </SelectTrigger>
              <SelectContent>
                {STAFF.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {assignee === "Custom…" && (
              <Input
                className="mt-1 text-[12px]"
                placeholder="Enter name…"
                onChange={(e) => setAssignee(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Task type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(TASK_TYPE_LABEL) as ScoutAssignment["taskType"][]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTaskType(t)}
                  className={`text-[10.5px] px-2 py-1.5 rounded-lg border font-medium transition-colors ${
                    taskType === t
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {TASK_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What exactly needs to be done…"
              className="text-[12px] min-h-[80px] resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Due date (optional)</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-[12px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={!assignee.trim() || assignee === "Custom…" || !description.trim()}
          >
            Create assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentsTab({
  report, onUpdate,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void }) {
  const [addOpen, setAddOpen] = useState(false);

  function cycleStatus(id: string) {
    const cycle: Record<ScoutAssignment["status"], ScoutAssignment["status"]> = {
      open: "in_progress", in_progress: "done", done: "open",
    };
    onUpdate({
      assignments: report.assignments.map((a) =>
        a.id === id ? { ...a, status: cycle[a.status] } : a,
      ),
    });
  }

  const done = report.assignments.filter((a) => a.status === "done").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionLabel label="Scout assignments" count={report.assignments.length} />
        <div className="flex items-center gap-2">
          {report.assignments.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {done}/{report.assignments.length} done
            </span>
          )}
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="w-3 h-3" /> Assign
          </Button>
        </div>
      </div>

      {report.assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 flex flex-col items-center gap-3 text-center">
          <ClipboardList className="w-6 h-6 text-muted-foreground/30" />
          <div>
            <p className="text-[13px] text-muted-foreground">No assignments yet.</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Delegate scouting tasks to your staff and players.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="w-3 h-3" /> Create first assignment
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {report.assignments.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border bg-card p-4 flex items-start gap-3 ${a.status === "done" ? "opacity-60" : ""}`}
            >
              <button
                onClick={() => cycleStatus(a.id)}
                className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
                title="Click to advance status"
              >
                {ASSIGNMENT_STATUS_ICON[a.status]}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[13px] truncate">{a.assigneeName}</span>
                  <span className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
                    {TASK_TYPE_LABEL[a.taskType]}
                  </span>
                  {a.dueDate && (
                    <span className="text-[10.5px] text-muted-foreground flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      Due{" "}
                      {new Date(a.dueDate).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                  {a.description}
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdate({ assignments: report.assignments.filter((x) => x.id !== a.id) })
                }
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <CreateAssignmentDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(a) => onUpdate({ assignments: [...report.assignments, a] })}
      />
    </div>
  );
}

// ── Clips Tab ──────────────────────────────────────────────────────────────

function ClipsTab({
  report, onUpdate,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void }) {
  const MOCK_CLIPS = [
    { id: "clip_1", title: "Q3 — Pick & Roll Coverage vs. Westbury", duration: "2:14", tag: "PnR Defense" },
    { id: "clip_2", title: "Sideline Out of Bounds — Stagger", duration: "0:48", tag: "SLOB" },
    { id: "clip_3", title: "Transition Defense Breakdowns", duration: "3:22", tag: "Transition D" },
    { id: "clip_4", title: "Hill Step-Back Mid — Film Room Cut", duration: "1:05", tag: "Key Player" },
    { id: "clip_5", title: "Thomas Post-up Feeds", duration: "1:48", tag: "Key Player" },
  ];

  const linked = MOCK_CLIPS.filter((c) => report.linkedClipIds.includes(c.id));
  const unlinked = MOCK_CLIPS.filter((c) => !report.linkedClipIds.includes(c.id));

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel label="Linked clips" count={linked.length} />
        {linked.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 text-center">
            <p className="text-[12px] text-muted-foreground">
              No clips attached — add from Film Room below.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {linked.map((clip) => (
              <div key={clip.id} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
                <Film className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{clip.title}</div>
                  <div className="text-[11px] text-muted-foreground flex gap-2 mt-0.5">
                    <span>{clip.duration}</span><span>·</span><span>{clip.tag}</span>
                  </div>
                </div>
                <Button
                  size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground"
                  onClick={() =>
                    onUpdate({ linkedClipIds: report.linkedClipIds.filter((id) => id !== clip.id) })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {unlinked.length > 0 && (
        <div>
          <SectionLabel label="Add from Film Room" />
          <div className="space-y-2">
            {unlinked.map((clip) => (
              <div
                key={clip.id}
                className="rounded-lg border border-dashed border-border bg-muted/20 p-3 flex items-center gap-3"
              >
                <Film className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-muted-foreground truncate">{clip.title}</div>
                  <div className="text-[11px] text-muted-foreground">{clip.duration} · {clip.tag}</div>
                </div>
                <Button
                  size="sm" variant="outline" className="h-6 text-[10px] gap-1"
                  onClick={() =>
                    onUpdate({ linkedClipIds: [...report.linkedClipIds, clip.id] })
                  }
                >
                  <Plus className="w-2.5 h-2.5" /> Attach
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border px-4 py-3 bg-muted/20 flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          Open Film Room to create a dedicated scout playlist
        </p>
        <Link href="/app/coach/film">
          <a>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
              <Film className="w-3 h-3" /> Film Room
            </Button>
          </a>
        </Link>
      </div>
    </div>
  );
}

// ── Scout Plays Tab ────────────────────────────────────────────────────────

function PlaysTab({
  report, onUpdate, opponentId,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void; opponentId: string }) {
  const opponentPlays = mockScoutPlays.filter((p) => p.opponentId === opponentId);
  const linked = opponentPlays.filter((p) => report.linkedPlayIds.includes(p.id));
  const unlinked = opponentPlays.filter((p) => !report.linkedPlayIds.includes(p.id));

  const CAT_COLOR: Record<string, { text: string; bg: string; border: string }> = {
    halfcourt:  { text: "oklch(0.65 0.18 290)", bg: "oklch(0.65 0.18 290 / 0.08)", border: "oklch(0.65 0.18 290 / 0.25)" },
    blob:       { text: "oklch(0.60 0.15 145)", bg: "oklch(0.75 0.18 150 / 0.08)", border: "oklch(0.75 0.18 150 / 0.25)" },
    slob:       { text: "oklch(0.65 0.18 35)",  bg: "oklch(0.68 0.20 35 / 0.08)",  border: "oklch(0.68 0.20 35 / 0.25)"  },
    ato:        { text: "oklch(0.65 0.17 75)",  bg: "oklch(0.72 0.17 75 / 0.08)",  border: "oklch(0.72 0.17 75 / 0.25)"  },
    transition: { text: "oklch(0.68 0.22 25)",  bg: "oklch(0.68 0.22 25 / 0.08)",  border: "oklch(0.68 0.22 25 / 0.25)"  },
  };

  return (
    <div className="space-y-5">
      {/* What scout plays are */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-start gap-2.5">
        <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Scout team plays</span> simulate your opponent's tendencies in practice.
          Link these plays so your scout team can run them against your starters — and your defense gets real reps.
        </p>
      </div>

      {/* Linked plays */}
      <div>
        <SectionLabel label="Active scout team plays" count={linked.length} />
        {linked.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 text-center">
            <p className="text-[12px] text-muted-foreground">
              No plays linked yet — add from the library below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {linked.map((play) => {
              const c = CAT_COLOR[play.category] ?? CAT_COLOR.halfcourt;
              return (
                <div
                  key={play.id}
                  className="rounded-xl border bg-card p-4"
                  style={{ borderColor: c.border }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                      style={{ background: c.bg, borderColor: c.border }}
                    >
                      <BookOpen className="w-4 h-4" style={{ color: c.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-[13.5px]">{play.name}</span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ color: c.text, background: c.bg, borderColor: c.border }}
                        >
                          {SCOUT_PLAY_CAT_LABEL[play.category]}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 ml-auto">
                          {play.formation}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground leading-snug">
                        {play.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="text-[11px] text-amber-600 font-medium">
                          {play.simulatesNote}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground shrink-0"
                      onClick={() =>
                        onUpdate({ linkedPlayIds: report.linkedPlayIds.filter((id) => id !== play.id) })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available plays */}
      {unlinked.length > 0 && (
        <div>
          <SectionLabel label="Add scout plays" />
          <div className="space-y-2">
            {unlinked.map((play) => {
              const c = CAT_COLOR[play.category] ?? CAT_COLOR.halfcourt;
              return (
                <div
                  key={play.id}
                  className="rounded-xl border border-dashed border-border bg-muted/10 p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-medium text-[13px]">{play.name}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{ color: c.text, background: c.bg, borderColor: c.border }}
                      >
                        {SCOUT_PLAY_CAT_LABEL[play.category]}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{play.simulatesNote}</p>
                  </div>
                  <Button
                    size="sm" variant="outline" className="h-7 text-[11px] gap-1 shrink-0"
                    onClick={() => onUpdate({ linkedPlayIds: [...report.linkedPlayIds, play.id] })}
                  >
                    <Plus className="w-3 h-3" /> Link
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border px-4 py-3 bg-muted/20 flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          Create new scout plays in Playbook Studio
        </p>
        <Link href="/app/playbook">
          <a>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
              <BookOpen className="w-3 h-3" /> Playbook Studio
            </Button>
          </a>
        </Link>
      </div>
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────

function HistoryTab({ opponentId }: { opponentId: string }) {
  const history = mockOpponentHistory
    .filter((g) => g.opponentId === opponentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const wins = history.filter((g) => g.result === "W").length;
  const losses = history.filter((g) => g.result === "L").length;
  const avgMarginW = wins > 0
    ? Math.round(history.filter((g) => g.result === "W").reduce((s, g) => s + (g.ourScore - g.theirScore), 0) / wins)
    : 0;
  const avgMarginL = losses > 0
    ? Math.round(history.filter((g) => g.result === "L").reduce((s, g) => s + (g.theirScore - g.ourScore), 0) / losses)
    : 0;

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 flex flex-col items-center gap-2 text-center">
        <History className="w-7 h-7 text-muted-foreground/30" />
        <p className="text-[13px] text-muted-foreground">No game history recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Record summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="font-mono text-[24px] font-bold leading-none text-[oklch(0.60_0.15_145)]">
            {wins}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Wins</div>
          {avgMarginW > 0 && (
            <div className="text-[10px] text-muted-foreground">avg +{avgMarginW}</div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="font-mono text-[24px] font-bold leading-none text-[oklch(0.68_0.22_25)]">
            {losses}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Losses</div>
          {avgMarginL > 0 && (
            <div className="text-[10px] text-muted-foreground">avg -{avgMarginL}</div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <div className="font-mono text-[24px] font-bold leading-none">{history.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Games played</div>
        </div>
      </div>

      {/* Game log */}
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/50">
        {history.map((game) => {
          const isWin = game.result === "W";
          const margin = Math.abs(game.ourScore - game.theirScore);
          return (
            <div key={game.id} className="px-4 py-3.5 flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0 ${
                  isWin
                    ? "bg-[oklch(0.75_0.18_150/0.15)] text-[oklch(0.60_0.15_145)] border border-[oklch(0.75_0.18_150/0.3)]"
                    : "bg-[oklch(0.68_0.22_25/0.12)] text-[oklch(0.68_0.22_25)] border border-[oklch(0.68_0.22_25/0.3)]"
                }`}
              >
                {game.result}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-[14px]">
                    {game.ourScore}–{game.theirScore}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      isWin ? "text-[oklch(0.60_0.15_145)]" : "text-[oklch(0.68_0.22_25)]"
                    }`}
                  >
                    {isWin ? `W +${margin}` : `L -${margin}`}
                  </span>
                  <span className="text-[11px] text-muted-foreground capitalize">
                    {game.homeAway}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {new Date(game.date).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </div>
                {game.notes && (
                  <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{game.notes}</p>
                )}
                {game.filmSessionId && (
                  <button className="mt-1.5 text-[11px] text-primary hover:underline flex items-center gap-1">
                    <Film className="w-3 h-3" /> View film session
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Practice Tab ───────────────────────────────────────────────────────────

function PracticeBlockCard({
  block,
  onAddToPlan,
  added,
}: {
  block: GeneratedPracticeBlock;
  onAddToPlan: (id: string) => void;
  added: boolean;
}) {
  const intensityColor: Record<string, string> = {
    high:   "oklch(0.68 0.22 25)",
    medium: "oklch(0.78 0.16 75)",
    low:    "oklch(0.65 0.15 230)",
  };
  const color = intensityColor[block.intensity] ?? "oklch(0.65 0.18 290)";

  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-2 transition-all"
      style={{
        borderColor: added ? "oklch(0.75 0.12 140 / 0.35)" : "hsl(var(--border))",
        background: added ? "oklch(0.75 0.12 140 / 0.04)" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{ color, borderColor: `${color} / 0.30`, background: `${color} / 0.08` }}
            >
              {PRACTICE_BLOCK_FOCUS_LABEL[block.focus]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {block.suggestedMinutes} min · {block.intensity} intensity
            </span>
            {block.priority === 1 && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                PRIORITY
              </span>
            )}
          </div>
          <p className="text-[13px] font-semibold">{block.title}</p>
          <p className="text-[11.5px] text-muted-foreground leading-snug">{block.rationale}</p>
          <div className="rounded-lg bg-muted/40 border border-border/40 px-2.5 py-1.5 mt-1">
            <p className="text-[11px] text-muted-foreground font-medium">Drill:</p>
            <p className="text-[11.5px]">{block.drill}</p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Source: {block.sourceTendencyTitle}
          </p>
        </div>
        <div className="shrink-0">
          {added ? (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "oklch(0.75 0.12 140)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Added
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1 shrink-0"
              onClick={() => onAddToPlan(block.id)}
            >
              <CalendarPlus className="w-3 h-3" /> Add to plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PracticeTab({
  report, onUpdate,
}: { report: ScoutReport; onUpdate: (p: Partial<ScoutReport>) => void }) {
  const linked = !!report.linkedPracticePlanId;
  const [generated, setGenerated] = useState<GeneratedPracticeBlock[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [addedBlocks, setAddedBlocks] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  // Scout-team roles for this report
  const scoutRoles = SCOUT_TEAM_ROLES.filter((r) => r.scoutReportId === report.id);

  function handleGenerate() {
    setGenerating(true);
    // Simulate brief processing
    setTimeout(() => {
      const blocks = generatePracticeEmphasis(report);
      setGenerated(blocks);
      setHasGenerated(true);
      setGenerating(false);
      toast.success(`${blocks.length} practice blocks generated from scout tendencies`);
    }, 600);
  }

  function addBlockToPlan(blockId: string) {
    setAddedBlocks((prev) => new Set(Array.from(prev).concat(blockId)));
    toast.success("Block added to practice plan.");
    if (!linked) {
      onUpdate({ linkedPracticePlanId: "plan_1" });
    }
  }

  function addAllToPlan() {
    setAddedBlocks(new Set(generated.map((b) => b.id)));
    onUpdate({ linkedPracticePlanId: "plan_1" });
    toast.success(`All ${generated.length} blocks added to practice plan.`);
  }

  const totalMinutes = generated.reduce((s, b) => s + b.suggestedMinutes, 0);

  return (
    <div className="space-y-5">
      {/* Linked practice plan */}
      <div>
        <SectionLabel label="Linked practice plan" />
        {linked ? (
          <div className="rounded-xl border border-[oklch(0.65_0.18_290/0.3)] bg-[oklch(0.65_0.18_290/0.05)] p-5">
            <div className="flex items-start gap-3">
              <Dumbbell className="w-5 h-5 text-[oklch(0.65_0.18_290)] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-[14px]">Pre-Westbury Practice Plan</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  May 21 · 90 min · HIGH intensity · {addedBlocks.size > 0 ? `${addedBlocks.size + 5} blocks` : "5 blocks"}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["PnR Defense", "Ice Coverage", "Corner 3 Defense", "Post Physicality", "Film Review"].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-muted/70 rounded px-2 py-0.5 text-muted-foreground border border-border/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Link href="/app/coach/practice-plans">
                  <a>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
                      <BookOpen className="w-3 h-3" /> Open plan
                    </Button>
                  </a>
                </Link>
                <Button
                  size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground"
                  onClick={() => {
                    onUpdate({ linkedPracticePlanId: undefined });
                    toast.success("Practice plan unlinked");
                  }}
                >
                  Unlink
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 flex flex-col items-center gap-3 text-center px-6">
            <Dumbbell className="w-7 h-7 text-muted-foreground/30" />
            <div>
              <p className="text-[13px] font-medium">No practice plan linked</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Generate practice emphasis below — blocks will be added automatically when you link a plan.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline" className="gap-1.5"
                onClick={() => { onUpdate({ linkedPracticePlanId: "plan_1" }); toast.success("Practice plan linked"); }}
              >
                <CalendarPlus className="w-3.5 h-3.5" /> Link existing
              </Button>
              <Link href="/app/coach/practice-plans">
                <a>
                  <Button className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create game-prep plan
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Scout-team roles */}
      {scoutRoles.length > 0 && (
        <div>
          <SectionLabel label="Scout team roles" count={scoutRoles.length} />
          <div className="space-y-2">
            {scoutRoles.map((role) => (
              <div
                key={role.id}
                className="rounded-xl border border-[oklch(0.68_0.22_25/0.25)] bg-[oklch(0.68_0.22_25/0.04)] p-4 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-[oklch(0.68_0.22_25)] shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold">{role.playerName}</span>
                      <span className="text-[11px] text-muted-foreground">runs as</span>
                      <span className="text-[13px] font-semibold text-[oklch(0.68_0.22_25)]">
                        #{role.simOpponentJersey} {role.simOpponentPlayer}
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted"
                      >
                        {role.simOpponentPosition}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{role.practiceDate}</p>
                    {role.notes && (
                      <p className="text-[11.5px] text-muted-foreground italic">{role.notes}</p>
                    )}
                    <div className="space-y-1 mt-1">
                      {role.tendenciesToSimulate.map((t, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11.5px]">
                          <span className="text-muted-foreground mt-0.5">·</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate practice emphasis */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel label="Practice emphasis" />
          {hasGenerated && generated.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {totalMinutes} min · {generated.length} blocks
              </span>
              <Button
                size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                onClick={addAllToPlan}
              >
                <CalendarPlus className="w-3 h-3" /> Add all to plan
              </Button>
            </div>
          )}
        </div>

        {!hasGenerated ? (
          <div
            className="rounded-xl border border-dashed p-6 flex flex-col items-center gap-3 text-center"
            style={{ borderColor: "oklch(0.65 0.18 290 / 0.30)" }}
          >
            <Sparkles className="w-7 h-7 text-[oklch(0.65_0.18_290)] opacity-60" />
            <div>
              <p className="text-[13px] font-semibold">Generate from scout tendencies</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 max-w-sm mx-auto">
                Analyzes your scouted tendencies and creates drill recommendations for your game-prep practice — with rationale for each block.
              </p>
            </div>
            {report.offenseTendencies.length + report.defenseTendencies.length === 0 ? (
              <p className="text-[11.5px] text-muted-foreground">
                Add tendencies in the Tendencies tab first.
              </p>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="gap-1.5 mt-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generating ? "Generating…" : `Generate practice emphasis (${report.offenseTendencies.length + report.defenseTendencies.length} tendencies)`}
              </Button>
            )}
          </div>
        ) : generated.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 flex flex-col items-center gap-2 text-center">
            <p className="text-[13px] text-muted-foreground">No blocks generated — add more tendencies and try again.</p>
            <Button size="sm" variant="outline" onClick={() => setHasGenerated(false)}>
              Re-generate
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {generated.map((block) => (
              <PracticeBlockCard
                key={block.id}
                block={block}
                onAddToPlan={addBlockToPlan}
                added={addedBlocks.has(block.id)}
              />
            ))}
            <div className="flex items-center justify-between pt-1">
              <Button
                size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-muted-foreground"
                onClick={() => { setHasGenerated(false); setGenerated([]); setAddedBlocks(new Set()); }}
              >
                <RotateCcw className="w-3 h-3" /> Re-generate
              </Button>
              <Link href="/app/coach/practice-plans">
                <a>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
                    <BookOpen className="w-3 h-3" /> Open practice plan builder
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Print packet ───────────────────────────────────────────────────────────

function PrintPacket({ report }: { report: ScoutReport }) {
  const hue = 220;
  const c = teamColor(hue);
  const criticalTendencies = [
    ...report.offenseTendencies,
    ...report.defenseTendencies,
  ].filter((t) => t.severity === "critical" || t.severity === "high");

  return (
    <div className="bg-white text-black text-[12px] font-sans max-w-[700px] mx-auto p-8 space-y-5 print:p-6">
      <div className="border-b-2 pb-4 flex items-start justify-between" style={{ borderColor: c.dot }}>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-gray-500 mb-1">
            Scout Report
          </div>
          <h1 className="text-[22px] font-bold leading-tight">vs. {report.opponentName}</h1>
          {report.gameDate && (
            <p className="text-[12px] text-gray-500 mt-0.5">
              {new Date(report.gameDate).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400">Prepared by</div>
          <div className="font-semibold">{report.authorName}</div>
          <div className="text-[10px] text-gray-400 mt-0.5 capitalize">{report.status}</div>
        </div>
      </div>

      {report.gamePlanSummary && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: c.dot }}>
            Game Plan
          </h2>
          <p className="text-[11.5px] leading-relaxed text-gray-700">{report.gamePlanSummary}</p>
        </div>
      )}

      {report.keysToWin.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: c.dot }}>
            Keys to the Game
          </h2>
          <ol className="list-decimal list-inside space-y-1.5">
            {report.keysToWin.map((k, i) => (
              <li key={i} className="text-[11.5px] text-gray-800">{k}</li>
            ))}
          </ol>
        </div>
      )}

      {report.keyPlayers.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: c.dot }}>
            Key Players
          </h2>
          <div className="space-y-2.5">
            {report.keyPlayers.map((player) => (
              <div key={player.id} className="border rounded p-3 border-gray-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] bg-gray-100 rounded px-1.5 py-0.5">
                    #{player.jerseyNumber}
                  </span>
                  <span className="font-bold">{player.name}</span>
                  <span className="text-gray-500">{player.position}</span>
                  <span className="ml-auto">
                    {"★".repeat(player.threatLevel)}{"☆".repeat(5 - player.threatLevel)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-1.5">
                  <div>
                    <span className="font-semibold">Strengths: </span>
                    {player.strengths.join(", ")}
                  </div>
                  <div>
                    <span className="font-semibold">Weaknesses: </span>
                    {player.weaknesses.join(", ")}
                  </div>
                </div>
                {player.goToMoves.length > 0 && (
                  <div className="text-[11px] mb-1.5">
                    <span className="font-semibold">Go-to moves: </span>
                    {player.goToMoves.join(", ")}
                  </div>
                )}
                <div className="text-[11px]">
                  <span className="font-semibold">How to guard: </span>
                  {player.defensivePlan}
                </div>
                {player.defensiveAssignment && (
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Assignment: {player.defensiveAssignment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {report.matchupNotes.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: c.dot }}>
            Matchup Assignments
          </h2>
          <div className="space-y-1.5">
            {report.matchupNotes.map((mn) => (
              <div key={mn.id} className="text-[11.5px]">
                <span className="font-semibold">{mn.ourPlayerName}</span>{" "}
                on{" "}
                <span className="font-semibold">#{mn.theirJerseyNumber} {mn.theirPlayerName}</span>
                <span className="text-gray-600"> — {mn.coachNote}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {criticalTendencies.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: c.dot }}>
            Critical Tendencies
          </h2>
          {criticalTendencies.map((t) => (
            <div key={t.id} className="mb-1.5 text-[11.5px]">
              <span className="font-semibold">[{t.severity.toUpperCase()}] {t.title}: </span>
              <span className="text-gray-700">{t.description}</span>
            </div>
          ))}
        </div>
      )}

      {report.assignments.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: c.dot }}>
            Scout Assignments
          </h2>
          {report.assignments.map((a) => (
            <div key={a.id} className="text-[11.5px] mb-1">
              <span className="font-semibold">{a.assigneeName}</span>
              {" — "}{a.description}
              {a.dueDate && (
                <span className="text-gray-500">
                  {" "}(due{" "}
                  {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-[9px] text-gray-400 text-center border-t pt-3">
        Generated by HoopsIQ · Confidential — Coach use only
      </div>
    </div>
  );
}

// ── Share dialog ───────────────────────────────────────────────────────────

function ShareDialog({
  open, onClose, report, opponentName,
}: { open: boolean; onClose: () => void; report: ScoutReport; opponentName: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://app.hoopsiq.com/scout/${report.id}?token=demo_share_token`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isReadyToShare = report.status === "final";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share Scout Report</DialogTitle>
        </DialogHeader>

        {!isReadyToShare && (
          <div className="rounded-lg border border-[oklch(0.72_0.17_75/0.3)] bg-[oklch(0.72_0.17_75/0.08)] px-3 py-2.5 flex items-start gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.65_0.17_75)] mt-0.5 shrink-0" />
            <p className="text-[12px] text-muted-foreground">
              This report is still a draft. Mark it{" "}
              <span className="font-semibold">Final</span> before sharing so
              your staff sees the completed version.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Read-only share link</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] font-mono text-muted-foreground truncate">
                {shareUrl}
              </div>
              <Button
                size="sm" variant="outline" className="h-9 gap-1.5 shrink-0"
                onClick={copyLink}
              >
                {copied ? (
                  <><Check className="w-3 h-3 text-green-500" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </Button>
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-1.5">
              Anyone with this link can view the scout report — no login required.
              The link expires 48 hours after the game date.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <div className="text-[11px] font-semibold mb-1">Access details</div>
            <div className="space-y-0.5 text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Report status</span>
                <span className={isReadyToShare ? "text-[oklch(0.60_0.15_145)]" : "text-[oklch(0.65_0.18_290)]"}>
                  {report.status === "final" ? "Final" : "Draft"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Permissions</span>
                <span>View only</span>
              </div>
              <div className="flex justify-between">
                <span>Expiry</span>
                <span>48h post-game</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Done</Button>
          <Button onClick={copyLink} className="gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Copy link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function OpponentScoutPage() {
  const [, params] = useRoute("/app/coach/scouting/:opponentId");
  const opponentId = params?.opponentId ?? "";

  const opponent = mockOpponents.find((o) => o.id === opponentId);
  const [report, setReport] = useState<ScoutReport | null>(
    () => mockScoutReports.find((r) => r.opponentId === opponentId) ?? null,
  );

  const [activeTab, setActiveTab] = useState<Tab>("game_plan");
  const [printOpen, setPrintOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (!opponent) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Crosshair className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-[14px] text-muted-foreground">Opponent not found.</p>
          <Link href="/app/coach/scouting">
            <a><Button variant="outline">Back to scouting</Button></a>
          </Link>
        </div>
      </AppShell>
    );
  }

  const hue = opponent.primaryColor ? Number(opponent.primaryColor) : 220;
  const c = teamColor(hue);
  const sm = report ? statusMeta(report.status) : null;

  function updateReport(patch: Partial<ScoutReport>) {
    setReport((prev) =>
      prev ? { ...prev, ...patch, updatedAt: new Date().toISOString() } : prev,
    );
  }

  function startNewReport() {
    const now = new Date().toISOString();
    setReport({
      id: `sr_${Date.now()}`,
      opponentId: opponent!.id,
      opponentName: opponent!.name,
      status: "draft",
      gamePlanSummary: "",
      keysToWin: [],
      offenseTendencies: [],
      defenseTendencies: [],
      keyPlayers: [],
      matchupNotes: [],
      assignments: [],
      linkedClipIds: [],
      linkedPlayIds: [],
      authorName: "Coach Williams",
      createdAt: now,
      updatedAt: now,
    });
    toast.success("New scout report started");
  }

  const tabCounts: Partial<Record<Tab, number>> = report
    ? {
        tendencies:  report.offenseTendencies.length + report.defenseTendencies.length,
        key_players: report.keyPlayers.length,
        matchups:    report.matchupNotes.length,
        assignments: report.assignments.length,
        clips:       report.linkedClipIds.length,
        plays:       report.linkedPlayIds.length,
        history:     mockOpponentHistory.filter((g) => g.opponentId === opponentId).length,
      }
    : { history: mockOpponentHistory.filter((g) => g.opponentId === opponentId).length };

  return (
    <AppShell>
      <div className="mb-5">
        <Link href="/app/coach/scouting" asChild>
          <a className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Scouting
          </a>
        </Link>

        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[13px] font-bold border-2 shrink-0"
            style={{ color: c.text, background: c.bg, borderColor: c.border }}
          >
            {opponent.abbreviation ?? opponent.name.slice(0, 3).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[26px] font-bold leading-tight">{opponent.name}</h1>
              {sm && (
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                  style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}
                >
                  {sm.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground flex-wrap">
              {opponent.conference && <span>{opponent.conference}</span>}
              {opponent.division && <span>{opponent.division}</span>}
              {opponent.coachName && <span>{opponent.coachName}</span>}
              {opponent.record && (
                <span className="font-semibold text-foreground">
                  {opponent.record.wins}–{opponent.record.losses}
                </span>
              )}
              {report?.gameDate && (
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Game{" "}
                  {new Date(report.gameDate).toLocaleDateString("en-US", {
                    month: "short", day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {!report ? (
              <Button onClick={startNewReport} className="gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Start scout report
              </Button>
            ) : (
              <>
                {report.status === "draft" && (
                  <Button
                    onClick={() => {
                      updateReport({ status: "final" });
                      toast.success("Marked as final — ready to share");
                    }}
                    variant="outline" className="gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark final
                  </Button>
                )}
                <Button
                  variant="outline" className="gap-1.5"
                  onClick={() => setPrintOpen(true)}
                >
                  <Printer className="w-3.5 h-3.5" /> Scout packet
                </Button>
                <Button
                  variant="ghost" className="gap-1.5"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {!report ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-20 flex flex-col items-center gap-4 text-center px-6">
          <Crosshair className="w-10 h-10 text-muted-foreground/30" />
          <div>
            <p className="text-[15px] font-semibold">No scout report yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Build a complete pre-game packet — tendencies, key players, matchups, film clips, and practice focus.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={startNewReport} className="gap-1.5 mt-1">
              <Plus className="w-3.5 h-3.5" /> Start scout report
            </Button>
            <Button
              variant="outline" className="gap-1.5 mt-1"
              onClick={() => setActiveTab("history")}
            >
              <History className="w-3.5 h-3.5" /> View game history
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-0 overflow-x-auto border-b border-border mb-5">
            {TABS.map((tab) => {
              const count = tabCounts[tab.key];
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {count != null && count > 0 && (
                    <span
                      className={`text-[10px] rounded-full px-1.5 py-0.5 font-mono ${
                        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div>
            {activeTab === "game_plan"   && <GamePlanTab   report={report} onUpdate={updateReport} />}
            {activeTab === "tendencies"  && <TendenciesTab  report={report} onUpdate={updateReport} opponentId={opponentId} />}
            {activeTab === "key_players" && <KeyPlayersTab  report={report} onUpdate={updateReport} />}
            {activeTab === "matchups"    && <MatchupsTab    report={report} onUpdate={updateReport} />}
            {activeTab === "assignments" && <AssignmentsTab report={report} onUpdate={updateReport} />}
            {activeTab === "clips"       && <ClipsTab       report={report} onUpdate={updateReport} />}
            {activeTab === "plays"       && <PlaysTab       report={report} onUpdate={updateReport} opponentId={opponentId} />}
            {activeTab === "history"     && <HistoryTab     opponentId={opponentId} />}
            {activeTab === "practice"   && <PracticeTab    report={report} onUpdate={updateReport} />}
          </div>
        </>
      )}

      {/* History tab accessible even without a report */}
      {!report && activeTab === "history" && (
        <div className="mt-5">
          <HistoryTab opponentId={opponentId} />
        </div>
      )}

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scout Packet — {opponent.name}</DialogTitle>
          </DialogHeader>
          {report && <PrintPacket report={report} />}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <p className="text-[11px] text-muted-foreground">
              Production: renders via React-PDF into a shareable link.
            </p>
            <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {report && (
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          report={report}
          opponentName={opponent.name}
        />
      )}
    </AppShell>
  );
}
