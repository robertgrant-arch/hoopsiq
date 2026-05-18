import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Video,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  PlusCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import {
  skillProtocols,
  playerAssessments,
  latestAssessmentsByPlayer,
  getAssessmentHistory,
  getLevelLabel,
  getCategoryLabel,
  CATEGORY_LABELS,
  type SkillCategory,
  type AssessmentType,
  type AssessmentResult,
  type SkillAssessment,
} from "@/features/skill-assessment/mock";

// ─── Demo roster pulled from analytics mock shape ────────────────────────────

const ROSTER_PLAYERS = [
  { id: "p10", name: "Malik Henderson", position: "PG", ageGroup: "17U" },
  { id: "p6",  name: "Jaylen Scott",    position: "SG", ageGroup: "17U" },
  { id: "p8",  name: "Noah Rivera",     position: "SF", ageGroup: "17U" },
  { id: "p3",  name: "Tyler Brooks",    position: "PF", ageGroup: "17U" },
  { id: "p7",  name: "Cam Porter",      position: "C",  ageGroup: "17U" },
  { id: "p12", name: "Brandon Lee",     position: "PG", ageGroup: "15U" },
  { id: "p4",  name: "Marcus Webb",     position: "SG", ageGroup: "15U" },
  { id: "p5",  name: "Isaiah Grant",    position: "SF", ageGroup: "15U" },
  { id: "p9",  name: "DeShawn Morris",  position: "PF", ageGroup: "15U" },
  { id: "p11", name: "Jalen King",      position: "C",  ageGroup: "15U" },
  { id: "p2",  name: "Andre Miles",     position: "PG", ageGroup: "13U" },
];

const SKILL_CATEGORIES: SkillCategory[] = [
  "ball_handling","shooting","finishing","defense","footwork","iq_reads","athleticism","conditioning",
];

// ─── Color helpers ────────────────────────────────────────────────────────────

function levelColor(level: number): string {
  if (level >= 5) return "oklch(0.72 0.18 290)";
  if (level === 4) return "oklch(0.75 0.12 140)";
  if (level === 3) return "oklch(0.78 0.16 75)";
  if (level === 2) return "oklch(0.68 0.22 25)";
  return "oklch(0.55 0.02 260)";
}

function deltaColor(delta: number): string {
  if (delta > 5) return "oklch(0.75 0.12 140)";
  if (delta < -5) return "oklch(0.68 0.22 25)";
  return "oklch(0.55 0.02 260)";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function weeksAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 7);
  const w = Math.round(diff);
  if (w <= 0) return "this week";
  if (w === 1) return "1 week ago";
  return `${w} weeks ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlayerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  return (
    <div className="w-9 h-9 rounded-full border border-border bg-muted flex items-center justify-center text-[12px] font-bold text-muted-foreground shrink-0">
      {initials.toUpperCase()}
    </div>
  );
}

function LevelDot({ level }: { level: number }) {
  return (
    <div
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: levelColor(level) }}
      title={`Level ${level} — ${getLevelLabel(level)}`}
    />
  );
}

function AssessmentTypeBadge({ type }: { type: AssessmentType }) {
  const labels: Record<AssessmentType, string> = {
    structured: "Structured Test",
    coach_rated: "Coach Rated",
    game_performance: "Game Performance",
  };
  const colors: Record<AssessmentType, string> = {
    structured: "oklch(0.72 0.18 290)",
    coach_rated: "oklch(0.78 0.16 75)",
    game_performance: "oklch(0.75 0.12 140)",
  };
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
      style={{ color: colors[type], borderColor: `${colors[type]}40`, backgroundColor: `${colors[type]}12` }}
    >
      {labels[type]}
    </span>
  );
}

// ─── Category Form Card ───────────────────────────────────────────────────────

interface CategoryFormCardProps {
  category: SkillCategory;
  priorResult?: AssessmentResult;
  value: { level: number; score: number; notes: string; videoLink: string };
  onChange: (val: { level: number; score: number; notes: string; videoLink: string }) => void;
}

function CategoryFormCard({ category, priorResult, value, onChange }: CategoryFormCardProps) {
  const [expanded, setExpanded] = useState(false);
  const protocol = skillProtocols.find((p) => p.category === category)!;
  const videoRequired = value.level >= 3;
  const delta = priorResult
    ? value.level !== priorResult.level
      ? (value.level - priorResult.level) * 100 + (value.score - priorResult.score)
      : value.score - priorResult.score
    : 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left min-h-[52px]"
        onClick={() => setExpanded((v) => !v)}
        type="button"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-foreground">{getCategoryLabel(category)}</span>
            <span className="text-[11px] text-muted-foreground">{protocol.drillName}</span>
            {videoRequired && (
              <span className="flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ color: "oklch(0.72 0.18 290)", backgroundColor: "oklch(0.72 0.18 290 / 0.1)" }}>
                <Video size={10} /> Video req.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {value.level > 0 ? (
              <span className="text-[12px] font-medium" style={{ color: levelColor(value.level) }}>
                Level {value.level} — {getLevelLabel(value.level)} · Score {value.score}
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground">Not assessed</span>
            )}
            {priorResult && value.level > 0 && (
              <span className="text-[11px]" style={{ color: deltaColor(delta) }}>
                {delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : "→ 0"}
              </span>
            )}
            {priorResult && (
              <span className="text-[11px] text-muted-foreground">
                Last: Lvl {priorResult.level} · {priorResult.score} · {weeksAgo(
                  playerAssessments.find((a) => a.results.includes(priorResult))?.assessedAt ?? ""
                )}
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-5">
          {/* Method note */}
          <p className="text-[12px] text-muted-foreground">{protocol.measurementMethod}</p>

          {/* Level cards */}
          <div className="grid gap-2">
            {protocol.levels.map((lv) => {
              const selected = value.level === lv.level;
              return (
                <button
                  key={lv.level}
                  type="button"
                  onClick={() => onChange({ ...value, level: lv.level, score: selected ? value.score : 50 })}
                  className="text-left rounded-lg border p-3 transition-colors"
                  style={{
                    borderColor: selected ? levelColor(lv.level) : undefined,
                    backgroundColor: selected ? `${levelColor(lv.level)}12` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[12px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: levelColor(lv.level), color: "#fff" }}
                    >
                      {lv.level}
                    </span>
                    <span className="text-[13px] font-semibold text-foreground">{lv.label}</span>
                    <span className="text-[11px] text-muted-foreground ml-auto">{lv.typicalRange}</span>
                  </div>
                  <ul className="space-y-0.5 pl-7">
                    {lv.criteria.map((c, i) => (
                      <li key={i} className="text-[12px] text-muted-foreground flex gap-1.5">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Score slider */}
          {value.level > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-foreground">Within-level score</span>
                <span className="text-[12px] font-bold" style={{ color: levelColor(value.level) }}>{value.score}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={value.score}
                onChange={(e) => onChange({ ...value, score: Number(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
                style={{ accentColor: levelColor(value.level) }}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Low end of {getLevelLabel(value.level)}</span>
                <span>High end</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Notes (optional)</label>
            <textarea
              value={value.notes}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              placeholder={`Observations for ${getCategoryLabel(category)}...`}
              rows={2}
              className="w-full rounded-lg border border-border bg-background text-[13px] text-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.18_290)] placeholder:text-muted-foreground"
            />
          </div>

          {/* Video link */}
          {value.level >= 3 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-[12px] font-medium text-foreground">Evidence film link</label>
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ color: "oklch(0.68 0.22 25)", backgroundColor: "oklch(0.68 0.22 25 / 0.1)" }}>
                  Required at Level 3+
                </span>
              </div>
              <input
                type="text"
                value={value.videoLink}
                onChange={(e) => onChange({ ...value, videoLink: e.target.value })}
                placeholder="film_clip_id or URL"
                className="w-full rounded-lg border border-border bg-background text-[13px] text-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.18_290)] placeholder:text-muted-foreground min-h-[44px]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Progress visualization (SVG bars) ───────────────────────────────────────

function ProgressVisualization({
  categoryValues,
  priorResults,
}: {
  categoryValues: Record<SkillCategory, { level: number; score: number }>;
  priorResults: AssessmentResult[];
}) {
  const maxBarWidth = 260;
  const rowH = 28;
  const labelW = 104;

  return (
    <div className="overflow-x-auto">
      <svg
        width={labelW + maxBarWidth + 48}
        height={SKILL_CATEGORIES.length * rowH + 8}
        className="block"
      >
        {SKILL_CATEGORIES.map((cat, i) => {
          const y = i * rowH + 4;
          const prior = priorResults.find((r) => r.category === cat);
          const current = categoryValues[cat];
          const priorW = prior ? (((prior.level - 1) * 100 + prior.score) / 400) * maxBarWidth : 0;
          const currentW = current.level > 0 ? (((current.level - 1) * 100 + current.score) / 400) * maxBarWidth : 0;

          return (
            <g key={cat}>
              {/* Label */}
              <text x={0} y={y + 15} fontSize={11} fill="oklch(0.55 0.02 260)" fontFamily="inherit">
                {getCategoryLabel(cat)}
              </text>
              {/* Track */}
              <rect x={labelW} y={y + 6} width={maxBarWidth} height={12} rx={4} fill="oklch(0.55 0.02 260 / 0.12)" />
              {/* Prior bar */}
              {priorW > 0 && (
                <rect x={labelW} y={y + 6} width={priorW} height={12} rx={4} fill="oklch(0.55 0.02 260 / 0.35)" />
              )}
              {/* Current bar */}
              {currentW > 0 && (
                <rect x={labelW} y={y + 6} width={currentW} height={12} rx={4} fill={`${levelColor(current.level)}cc`} />
              )}
              {/* Level label */}
              {current.level > 0 && (
                <text x={labelW + currentW + 4} y={y + 15} fontSize={10} fill={levelColor(current.level)} fontFamily="inherit" fontWeight="600">
                  L{current.level}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({ playerId }: { playerId: string }) {
  const history = getAssessmentHistory(playerId).slice().reverse();

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-[13px]">
        No assessment history for this player.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((assessment) => {
        const positive = assessment.overallDelta > 2;
        const negative = assessment.overallDelta < -2;
        return (
          <div key={assessment.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-foreground">{formatDate(assessment.assessedAt)}</span>
                  <span className="text-[12px] text-muted-foreground">Week {assessment.week} · {assessment.season}</span>
                  <AssessmentTypeBadge type={assessment.assessmentType} />
                  {!assessment.parentVisible && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Coach only</span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">by {assessment.assessorName}</p>
              </div>
              <div
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold"
                style={{
                  color: positive ? "oklch(0.75 0.12 140)" : negative ? "oklch(0.68 0.22 25)" : "oklch(0.55 0.02 260)",
                  backgroundColor: positive ? "oklch(0.75 0.12 140 / 0.1)" : negative ? "oklch(0.68 0.22 25 / 0.1)" : "oklch(0.55 0.02 260 / 0.1)",
                }}
              >
                {positive ? <TrendingUp size={12} /> : negative ? <TrendingDown size={12} /> : <Minus size={12} />}
                {assessment.overallDelta > 0 ? "+" : ""}{assessment.overallDelta.toFixed(1)}
              </div>
            </div>

            {/* Category badges */}
            <div className="flex flex-wrap gap-1.5">
              {assessment.results.map((r) => (
                <span
                  key={r.category}
                  className="text-[11px] font-medium px-2 py-0.5 rounded border"
                  style={{
                    color: levelColor(r.level),
                    borderColor: `${levelColor(r.level)}40`,
                    backgroundColor: `${levelColor(r.level)}10`,
                  }}
                  title={`${getCategoryLabel(r.category)}: Level ${r.level} (${r.score})`}
                >
                  {CATEGORY_LABELS[r.category].split(" ")[0]} L{r.level}
                </span>
              ))}
            </div>

            {assessment.coachSummary && (
              <p className="text-[12px] text-muted-foreground border-t border-border pt-3 italic">
                "{assessment.coachSummary}"
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FormValues = Record<SkillCategory, { level: number; score: number; notes: string; videoLink: string }>;

function makeEmptyForm(): FormValues {
  return Object.fromEntries(
    SKILL_CATEGORIES.map((cat) => [cat, { level: 0, score: 50, notes: "", videoLink: "" }])
  ) as FormValues;
}

export default function SkillAssessmentPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("structured");
  const [formValues, setFormValues] = useState<FormValues>(makeEmptyForm());
  const [coachSummary, setCoachSummary] = useState("");
  const [tab, setTab] = useState<"new" | "history">("new");
  const [saving, setSaving] = useState(false);

  const filteredPlayers = useMemo(
    () =>
      ROSTER_PLAYERS.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.position.toLowerCase().includes(search.toLowerCase()) ||
        p.ageGroup.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const selectedPlayer = ROSTER_PLAYERS.find((p) => p.id === selectedPlayerId) ?? null;
  const priorAssessment = selectedPlayerId ? latestAssessmentsByPlayer[selectedPlayerId] : undefined;

  // Compute overall delta for summary
  const assessedCategories = SKILL_CATEGORIES.filter((cat) => formValues[cat].level > 0);
  const overallDelta = useMemo(() => {
    if (!priorAssessment || assessedCategories.length === 0) return 0;
    const deltas = assessedCategories.map((cat) => {
      const prior = priorAssessment.results.find((r) => r.category === cat);
      const cur = formValues[cat];
      if (!prior) return 0;
      return cur.level !== prior.level
        ? (cur.level - prior.level) * 100 + (cur.score - prior.score)
        : cur.score - prior.score;
    });
    return deltas.reduce((a, b) => a + b, 0) / deltas.length;
  }, [formValues, priorAssessment, assessedCategories]);

  const trendStatus =
    overallDelta > 5 ? "Improving" : overallDelta < -5 ? "Declining" : "Plateauing";
  const trendColor =
    overallDelta > 5 ? "oklch(0.75 0.12 140)" : overallDelta < -5 ? "oklch(0.68 0.22 25)" : "oklch(0.78 0.16 75)";

  function handlePlayerSelect(id: string) {
    setSelectedPlayerId(id);
    setFormValues(makeEmptyForm());
    setCoachSummary("");
    setTab("new");
  }

  function handleSave() {
    if (!selectedPlayer) {
      toast.error("Select a player first.");
      return;
    }
    if (assessedCategories.length === 0) {
      toast.error("Assess at least one skill category before saving.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(`Assessment saved for ${selectedPlayer.name}`, {
        description: `${assessedCategories.length} categories · Overall delta ${overallDelta > 0 ? "+" : ""}${overallDelta.toFixed(1)} · Visible to parents`,
      });
    }, 900);
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          eyebrow="Assessments"
          title="Skill Assessment"
          subtitle="Evaluate player skill levels across 8 categories using structured test protocols."
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ─── Left column ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Player selector */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                <User size={14} style={{ color: "oklch(0.72 0.18 290)" }} />
                Select Player
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, position, or age group…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.18_290)] min-h-[44px]"
                />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredPlayers.map((player) => {
                  const latest = latestAssessmentsByPlayer[player.id];
                  const selected = player.id === selectedPlayerId;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handlePlayerSelect(player.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left min-h-[44px]"
                      style={{
                        backgroundColor: selected ? "oklch(0.72 0.18 290 / 0.1)" : undefined,
                        borderWidth: selected ? 1 : 0,
                        borderStyle: "solid",
                        borderColor: selected ? "oklch(0.72 0.18 290 / 0.4)" : "transparent",
                      }}
                    >
                      <PlayerInitials name={player.name} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground">{player.name}</div>
                        <div className="text-[11px] text-muted-foreground">{player.position} · {player.ageGroup}</div>
                      </div>
                      {latest && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {SKILL_CATEGORIES.slice(0, 4).map((cat) => {
                            const r = latest.results.find((x) => x.category === cat);
                            return r ? <LevelDot key={cat} level={r.level} /> : null;
                          })}
                        </div>
                      )}
                      {selected && <CheckCircle2 size={14} style={{ color: "oklch(0.72 0.18 290)" }} className="shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlayer && (
              <>
                {/* Tab bar */}
                <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border w-fit">
                  {(["new", "history"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors min-h-[36px]"
                      style={{
                        backgroundColor: tab === t ? "oklch(0.72 0.18 290)" : "transparent",
                        color: tab === t ? "#fff" : "oklch(0.55 0.02 260)",
                      }}
                    >
                      {t === "new" ? <PlusCircle size={13} /> : <History size={13} />}
                      {t === "new" ? "New Assessment" : "History"}
                    </button>
                  ))}
                </div>

                {tab === "history" ? (
                  <HistoryTab playerId={selectedPlayer.id} />
                ) : (
                  <>
                    {/* Assessment type */}
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                      <h2 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                        <ClipboardCheck size={14} style={{ color: "oklch(0.72 0.18 290)" }} />
                        Assessment Type
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {(["structured", "coach_rated", "game_performance"] as AssessmentType[]).map((t) => {
                          const labels: Record<AssessmentType, string> = {
                            structured: "Structured Test",
                            coach_rated: "Coach Rated",
                            game_performance: "Game Performance",
                          };
                          const active = assessmentType === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setAssessmentType(t)}
                              className="px-4 py-2 rounded-full text-[13px] font-medium border transition-colors min-h-[44px]"
                              style={{
                                backgroundColor: active ? "oklch(0.72 0.18 290)" : "transparent",
                                color: active ? "#fff" : "oklch(0.55 0.02 260)",
                                borderColor: active ? "oklch(0.72 0.18 290)" : "oklch(0.55 0.02 260 / 0.3)",
                              }}
                            >
                              {labels[t]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category cards */}
                    <div className="space-y-3">
                      {SKILL_CATEGORIES.map((cat) => (
                        <CategoryFormCard
                          key={cat}
                          category={cat}
                          priorResult={priorAssessment?.results.find((r) => r.category === cat)}
                          value={formValues[cat]}
                          onChange={(val) => setFormValues((prev) => ({ ...prev, [cat]: val }))}
                        />
                      ))}
                    </div>

                    {/* Progress visualization */}
                    {assessedCategories.length > 0 && (
                      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                        <h2 className="text-[13px] font-semibold text-foreground">Before / After Comparison</h2>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "oklch(0.55 0.02 260 / 0.35)" }} />
                            Prior assessment
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "oklch(0.72 0.18 290 / 0.8)" }} />
                            Current assessment
                          </div>
                        </div>
                        <ProgressVisualization
                          categoryValues={formValues}
                          priorResults={priorAssessment?.results ?? []}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {!selectedPlayer && (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground text-[13px]">
                Select a player to begin an assessment
              </div>
            )}
          </div>

          {/* ─── Right sidebar (summary) ──────────────────────────────── */}
          <div className="lg:w-80 w-full shrink-0 space-y-4 lg:sticky lg:top-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-[13px] font-semibold text-foreground">Assessment Summary</h2>

              {!selectedPlayer ? (
                <p className="text-[12px] text-muted-foreground">No player selected.</p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <PlayerInitials name={selectedPlayer.name} />
                    <div>
                      <div className="text-[14px] font-bold text-foreground">{selectedPlayer.name}</div>
                      <div className="text-[11px] text-muted-foreground">{selectedPlayer.position} · {selectedPlayer.ageGroup}</div>
                    </div>
                  </div>

                  <AssessmentTypeBadge type={assessmentType} />

                  {/* Category summary */}
                  <div className="space-y-1.5">
                    {SKILL_CATEGORIES.map((cat) => {
                      const v = formValues[cat];
                      const prior = priorAssessment?.results.find((r) => r.category === cat);
                      const isEmpty = v.level === 0;
                      return (
                        <div key={cat} className="flex items-center justify-between text-[12px]">
                          <span className="text-muted-foreground">{getCategoryLabel(cat)}</span>
                          {isEmpty ? (
                            <span className="text-muted-foreground opacity-40">—</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {prior && (
                                <span className="text-muted-foreground opacity-60">L{prior.level}</span>
                              )}
                              {prior && <span className="text-muted-foreground opacity-40">→</span>}
                              <span className="font-semibold" style={{ color: levelColor(v.level) }}>L{v.level}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {assessedCategories.length > 0 && (
                    <>
                      <div className="border-t border-border pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-muted-foreground">Overall delta</span>
                          <span className="text-[13px] font-bold" style={{ color: deltaColor(overallDelta) }}>
                            {overallDelta > 0 ? "+" : ""}{overallDelta.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-muted-foreground">Trend</span>
                          <span className="text-[12px] font-semibold" style={{ color: trendColor }}>
                            {trendStatus === "Improving" && <TrendingUp size={12} className="inline mr-1" />}
                            {trendStatus === "Declining" && <TrendingDown size={12} className="inline mr-1" />}
                            {trendStatus === "Plateauing" && <Minus size={12} className="inline mr-1" />}
                            {trendStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-muted-foreground">Categories assessed</span>
                          <span className="text-[12px] font-semibold text-foreground">{assessedCategories.length} / 8</span>
                        </div>
                      </div>

                      {/* Coach summary textarea */}
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-foreground">Coach summary</label>
                        <textarea
                          value={coachSummary}
                          onChange={(e) => setCoachSummary(e.target.value)}
                          placeholder="Overall notes on this assessment cycle…"
                          rows={3}
                          className="w-full rounded-lg border border-border bg-background text-[12px] text-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[oklch(0.72_0.18_290)] placeholder:text-muted-foreground"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || assessedCategories.length === 0}
                    className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: "oklch(0.72 0.18 290)" }}
                  >
                    <ClipboardCheck size={15} />
                    {saving ? "Saving…" : "Save Assessment"}
                  </button>

                  {assessedCategories.length === 0 && (
                    <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      Assess at least one category to enable save.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Prior assessment card */}
            {priorAssessment && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h2 className="text-[12px] font-semibold text-foreground text-muted-foreground uppercase tracking-wide">Prior Assessment</h2>
                <div className="text-[12px] text-muted-foreground">{formatDate(priorAssessment.assessedAt)} · Week {priorAssessment.week}</div>
                <AssessmentTypeBadge type={priorAssessment.assessmentType} />
                {priorAssessment.coachSummary && (
                  <p className="text-[12px] text-muted-foreground italic">"{priorAssessment.coachSummary.slice(0, 140)}…"</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
