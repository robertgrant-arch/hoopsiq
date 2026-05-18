import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  X,
  Send,
  Bell,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  type Position,
  type AgeGroup,
  type SkillCategory,
  type BenchmarkReport,
  type IDPTemplate,
  type IDPGoalTemplate,
  sampleBenchmarkReports,
  idpTemplates,
  getRecommendedTemplate,
  getPriorityGaps,
  SKILL_LABELS,
  SKILL_ICONS,
} from "@/features/benchmarks/mock";

/* -------------------------------------------------------------------------- */
/* Colors                                                                      */
/* -------------------------------------------------------------------------- */

const PRIMARY  = "oklch(0.72 0.18 290)";
const SUCCESS  = "oklch(0.75 0.12 140)";
const WARNING  = "oklch(0.78 0.16 75)";
const DANGER   = "oklch(0.68 0.22 25)";
const MUTED    = "oklch(0.55 0.02 260)";

/* -------------------------------------------------------------------------- */
/* Step indicator                                                              */
/* -------------------------------------------------------------------------- */

function StepIndicator({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
            style={
              n === step
                ? { background: PRIMARY, color: "oklch(0.98 0.005 260)" }
                : n < step
                ? { background: SUCCESS, color: "oklch(0.98 0.005 260)" }
                : { background: "oklch(0.20 0.01 260)", color: MUTED }
            }
          >
            {n < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
          </div>
          {n < total && (
            <div
              className="h-px w-8"
              style={{ background: n < step ? SUCCESS : "oklch(0.22 0.01 260)" }}
            />
          )}
        </div>
      ))}
      <span className="text-[12px] text-muted-foreground ml-1">Step {step} of {total}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gap summary inline                                                          */
/* -------------------------------------------------------------------------- */

function GapSummary({ report }: { report: BenchmarkReport }) {
  const critical = report.gaps.filter((g) => g.priority === "critical" || g.priority === "high");
  const topNames = critical.slice(0, 3).map((g) => SKILL_LABELS[g.skill]);

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: `${DANGER.replace(")", " / 0.08)")}`, border: `1px solid ${DANGER.replace(")", " / 0.20)")}` }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: DANGER }} />
        <span className="text-[13px] font-semibold">
          {report.playerName} has {critical.length} critical gap{critical.length !== 1 ? "s" : ""}
          {topNames.length > 0 && `: ${topNames.join(", ")}`}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 ml-6">
        {report.gaps
          .filter((g) => g.gap > 0)
          .sort((a, b) => b.gap - a.gap)
          .map((g) => (
            <span
              key={g.skill}
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background:
                  g.priority === "critical"
                    ? `${DANGER.replace(")", " / 0.15)")}`
                    : g.priority === "high"
                    ? `${WARNING.replace(")", " / 0.15)")}`
                    : `${PRIMARY.replace(")", " / 0.12)")}`,
                color:
                  g.priority === "critical"
                    ? DANGER
                    : g.priority === "high"
                    ? WARNING
                    : PRIMARY,
              }}
            >
              {SKILL_ICONS[g.skill]} {SKILL_LABELS[g.skill]} (+{g.gap})
            </span>
          ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Template card                                                               */
/* -------------------------------------------------------------------------- */

function TemplateCard({
  template,
  selected,
  recommended,
  onSelect,
}: {
  template: IDPTemplate;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border p-4 transition-all flex flex-col gap-2"
      style={
        selected
          ? { borderColor: PRIMARY, background: `${PRIMARY.replace(")", " / 0.08)")}` }
          : { borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.14 0.005 260)" }
      }
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[13px] font-bold">{template.name}</span>
        {recommended && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}
          >
            <Sparkles className="w-3 h-3" />
            Recommended
          </span>
        )}
        {selected && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
            style={{ background: `${PRIMARY.replace(")", " / 0.15)")}`, color: PRIMARY }}
          >
            Selected
          </span>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{template.description}</p>
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        {template.focusAreas.map((skill) => (
          <span
            key={skill}
            className="text-[10.5px] px-2 py-0.5 rounded-md font-medium"
            style={{ background: `${PRIMARY.replace(")", " / 0.10)")}`, color: PRIMARY }}
          >
            {SKILL_ICONS[skill]} {SKILL_LABELS[skill]}
          </span>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto">
          {template.typicalDuration}w program
        </span>
      </div>
      <div className="text-[10.5px] text-muted-foreground italic">Best for: {template.bestFor}</div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Goal editor                                                                 */
/* -------------------------------------------------------------------------- */

type GoalDraft = {
  skill: SkillCategory;
  title: string;
  description: string;
  baselineLevel: number;
  targetLevel: number;
  timelineWeeks: number;
  milestones: string[];
  keyDrills: string[];
  successCriteria: string;
  coachNotes: string;
};

const TIMELINE_OPTIONS = [4, 6, 8, 12];

function GoalEditor({
  goal,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  goal: GoalDraft;
  index: number;
  onUpdate: (updated: GoalDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  function update<K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) {
    onUpdate({ ...goal, [key]: value });
  }

  function updateMilestone(i: number, val: string) {
    const updated = [...goal.milestones];
    updated[i] = val;
    update("milestones", updated);
  }

  function updateDrill(i: number, val: string) {
    const updated = [...goal.keyDrills];
    updated[i] = val;
    update("keyDrills", updated);
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border"
        style={{ background: "oklch(0.16 0.005 260)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ background: `${PRIMARY.replace(")", " / 0.15)")}`, color: PRIMARY }}
          >
            {index + 1}
          </div>
          <span className="text-[13px] font-semibold">
            {SKILL_ICONS[goal.skill]} {SKILL_LABELS[goal.skill]}
          </span>
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-red-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Title */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Goal Title
          </span>
          <input
            value={goal.title}
            onChange={(e) => update("title", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}
          />
        </label>

        {/* Levels */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              Baseline Level
            </span>
            <div
              className="h-9 px-3 rounded-lg border border-border flex items-center text-[13px] font-semibold"
              style={{ color: MUTED, background: "oklch(0.16 0.005 260)" }}
            >
              {goal.baselineLevel} / 5
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
              Target Level ({goal.baselineLevel + 1}–5)
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={goal.baselineLevel + 1}
                max={5}
                value={goal.targetLevel}
                onChange={(e) => update("targetLevel", Number(e.target.value))}
                className="flex-1 accent-primary"
                style={{ accentColor: PRIMARY }}
              />
              <span
                className="text-[14px] font-bold w-8 text-right"
                style={{ color: PRIMARY }}
              >
                {goal.targetLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Timeline
          </span>
          <div className="flex gap-2 flex-wrap">
            {TIMELINE_OPTIONS.map((w) => (
              <button
                key={w}
                onClick={() => update("timelineWeeks", w)}
                className="h-9 px-4 rounded-lg text-[13px] font-medium transition-all"
                style={
                  goal.timelineWeeks === w
                    ? { background: PRIMARY, color: "oklch(0.98 0.005 260)" }
                    : { background: "oklch(0.20 0.01 260)", color: MUTED }
                }
              >
                {w} weeks
              </button>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Milestones (3)
          </span>
          {goal.milestones.map((m, i) => (
            <input
              key={i}
              value={m}
              onChange={(e) => updateMilestone(i, e.target.value)}
              placeholder={`Milestone ${i + 1}`}
              className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-1"
              style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Key drills */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Key Drills
          </span>
          {goal.keyDrills.map((d, i) => (
            <input
              key={i}
              value={d}
              onChange={(e) => updateDrill(i, e.target.value)}
              placeholder={`Drill ${i + 1}`}
              className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-1"
              style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Success criteria */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Success Criteria
          </span>
          <input
            value={goal.successCriteria}
            onChange={(e) => update("successCriteria", e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-1"
            style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}
          />
        </label>

        {/* Coach notes */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
            Coach Notes (optional)
          </span>
          <textarea
            value={goal.coachNotes}
            onChange={(e) => update("coachNotes", e.target.value)}
            rows={2}
            placeholder="Any additional context for this goal…"
            className="px-3 py-2 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-1 resize-none"
            style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}
          />
        </label>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Parent preview generator                                                    */
/* -------------------------------------------------------------------------- */

function buildParentSummary(
  playerName: string,
  goals: GoalDraft[],
  season: string,
): string {
  const skillNames = goals.map((g) => SKILL_LABELS[g.skill]).join(", ");
  const firstGoal  = goals[0];
  const method     = firstGoal?.successCriteria
    ? `measured through: "${firstGoal.successCriteria}"`
    : "assessed by the coaching staff";
  return (
    `This ${season} season, ${playerName} is focusing on ${skillNames}. ` +
    `The goal is to reach level ${firstGoal?.targetLevel ?? "—"} in ${firstGoal ? SKILL_LABELS[firstGoal.skill] : "key skills"} ` +
    `over ${firstGoal?.timelineWeeks ?? "—"} weeks, ${method}. ` +
    `We'll track progress through milestones and update you at each checkpoint.`
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

const SEASONS = ["Spring 2026", "Summer 2026", "Fall 2026", "Winter 2026–27"];

export default function IDPGeneratorPage() {
  const [location] = useLocation();

  // Parse query params for pre-selection
  const searchParams = useMemo(() => {
    const idx = location.indexOf("?");
    return idx >= 0 ? new URLSearchParams(location.slice(idx)) : new URLSearchParams();
  }, [location]);

  const preSelectedPlayerId = searchParams.get("player") ?? "";
  const preSelectedSkill    = searchParams.get("skill") as SkillCategory | null;

  /* ── State ── */
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedPlayerId, setSelectedPlayerId]         = useState(preSelectedPlayerId || "");
  const [playerSearch, setPlayerSearch]                 = useState("");
  const [analysisRun, setAnalysisRun]                   = useState(!!preSelectedPlayerId);
  const [selectedTemplateId, setSelectedTemplateId]     = useState<string>("");
  const [overrideSkills, setOverrideSkills]             = useState<SkillCategory[]>(
    preSelectedSkill ? [preSelectedSkill] : [],
  );

  // Step 2
  const [goals, setGoals] = useState<GoalDraft[]>([]);

  // Step 3
  const [season, setSeason]           = useState(SEASONS[0]);
  const [sendToPlayer, setSendToPlayer] = useState(true);
  const [notifyParent, setNotifyParent] = useState(false);

  /* ── Derived ── */
  const selectedReport = useMemo(
    () => sampleBenchmarkReports.find((r) => r.playerId === selectedPlayerId) ?? null,
    [selectedPlayerId],
  );

  const recommendedTemplate = useMemo(
    () =>
      selectedReport
        ? getRecommendedTemplate(selectedReport.gaps)
        : null,
    [selectedReport],
  );

  const activeTemplate = useMemo(
    () => idpTemplates.find((t) => t.id === selectedTemplateId) ?? recommendedTemplate ?? null,
    [selectedTemplateId, recommendedTemplate],
  );

  const filteredPlayers = useMemo(
    () =>
      playerSearch.trim().length === 0
        ? sampleBenchmarkReports
        : sampleBenchmarkReports.filter((r) =>
            r.playerName.toLowerCase().includes(playerSearch.toLowerCase()),
          ),
    [playerSearch],
  );

  // When template or override skills change, rebuild goal drafts
  useEffect(() => {
    if (!activeTemplate || !selectedReport) return;
    const skills =
      overrideSkills.length > 0
        ? overrideSkills.slice(0, 3)
        : activeTemplate.focusAreas.slice(0, 3);

    const newGoals: GoalDraft[] = skills.map((skill) => {
      const tpl: IDPGoalTemplate | undefined = activeTemplate.sampleGoals.find(
        (g) => g.skill === skill,
      );
      const currentLevel =
        selectedReport.gaps.find((g) => g.skill === skill)?.currentLevel ?? 2;
      const targetLevel =
        tpl?.targetLevel ?? Math.min(currentLevel + 2, 5);

      return {
        skill,
        title:           tpl?.title ?? `${SKILL_LABELS[skill]} Development`,
        description:     tpl?.description ?? "",
        baselineLevel:   currentLevel,
        targetLevel:     Math.max(currentLevel + 1, targetLevel),
        timelineWeeks:   tpl?.timelineWeeks ?? 8,
        milestones:      tpl?.milestones ?? ["", "", ""],
        keyDrills:       tpl?.keyDrills ?? ["", "", ""],
        successCriteria: tpl?.successCriteria ?? "",
        coachNotes:      "",
      };
    });
    setGoals(newGoals);
  }, [activeTemplate, overrideSkills, selectedReport]);

  /* ── Handlers ── */
  function handleRunAnalysis() {
    if (!selectedPlayerId) {
      toast.error("Select a player first");
      return;
    }
    setAnalysisRun(true);
    if (recommendedTemplate) {
      setSelectedTemplateId(recommendedTemplate.id);
    }
  }

  function toggleOverrideSkill(skill: SkillCategory) {
    setOverrideSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length < 3
        ? [...prev, skill]
        : prev,
    );
  }

  function handleAddGoal() {
    if (goals.length >= 5) {
      toast.error("Maximum 5 goals per IDP");
      return;
    }
    const usedSkills = new Set(goals.map((g) => g.skill));
    const nextSkill = SKILLS_ALL.find((s) => !usedSkills.has(s));
    if (!nextSkill) return;
    setGoals((prev) => [
      ...prev,
      {
        skill:           nextSkill,
        title:           `${SKILL_LABELS[nextSkill]} Development`,
        description:     "",
        baselineLevel:   2,
        targetLevel:     3,
        timelineWeeks:   8,
        milestones:      ["", "", ""],
        keyDrills:       ["", ""],
        successCriteria: "",
        coachNotes:      "",
      },
    ]);
  }

  function handleActivate() {
    if (!selectedReport) return;
    toast.success(`IDP activated for ${selectedReport.playerName}`, {
      description: `${goals.length} goal${goals.length !== 1 ? "s" : ""} · ${season}${
        sendToPlayer ? " · Sent to player" : ""
      }${notifyParent ? " · Parent notified" : ""}`,
    });
  }

  function canProceedStep1() {
    return selectedPlayerId && analysisRun && (selectedTemplateId || !!recommendedTemplate);
  }

  function canProceedStep2() {
    return (
      goals.length > 0 &&
      goals.every((g) => g.title.trim().length > 0)
    );
  }

  const parentSummary = useMemo(
    () =>
      selectedReport && goals.length > 0
        ? buildParentSummary(selectedReport.playerName, goals, season)
        : "",
    [selectedReport, goals, season],
  );

  /* ── Render ── */
  return (
    <AppShell>
      <div className="px-5 lg:px-10 py-8 max-w-[900px] mx-auto">
        <PageHeader
          eyebrow="IDP Generator"
          title="Build Development Plan"
          subtitle="Gap-analysis driven IDP creation — select a player, run the benchmark, pick a template, and configure goals."
        />

        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator step={step} total={3} />
        </div>

        {/* ──────────────── STEP 1 ──────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <h3 className="text-[15px] font-semibold">Select Player</h3>

              <div className="relative">
                <input
                  value={playerSearch}
                  onChange={(e) => { setPlayerSearch(e.target.value); setAnalysisRun(false); }}
                  placeholder="Search players…"
                  className="w-full h-10 pl-4 pr-10 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}
                />
              </div>

              {/* Player list */}
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                {filteredPlayers.map((r) => (
                  <button
                    key={r.playerId}
                    onClick={() => {
                      setSelectedPlayerId(r.playerId);
                      setAnalysisRun(false);
                      setSelectedTemplateId("");
                      setOverrideSkills([]);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left"
                    style={
                      r.playerId === selectedPlayerId
                        ? { borderColor: PRIMARY, background: `${PRIMARY.replace(")", " / 0.08)")}` }
                        : { borderColor: "oklch(0.22 0.01 260)", background: "oklch(0.14 0.005 260)" }
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{
                        background: `${PRIMARY.replace(")", " / 0.15)")}`,
                        color: PRIMARY,
                      }}
                    >
                      {r.playerName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold">{r.playerName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.position} · {r.ageGroup} · Class of {r.gradYear}
                      </div>
                    </div>
                    {r.playerId === selectedPlayerId && (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={!selectedPlayerId}
                className="h-10 px-5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all disabled:opacity-40 w-fit"
                style={{ background: PRIMARY, color: "oklch(0.98 0.005 260)" }}
              >
                <Sparkles className="w-4 h-4" />
                Run Gap Analysis
              </button>
            </div>

            {/* Gap summary + recommendation */}
            {analysisRun && selectedReport && (
              <>
                <GapSummary report={selectedReport} />

                {recommendedTemplate && (
                  <div
                    className="rounded-lg px-4 py-3 flex items-center gap-2 text-[13px]"
                    style={{
                      background: `${SUCCESS.replace(")", " / 0.08)")}`,
                      border: `1px solid ${SUCCESS.replace(")", " / 0.20)")}`,
                    }}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
                    <span>
                      Based on {selectedReport.playerName}'s gaps, we recommend:{" "}
                      <strong>{recommendedTemplate.name}</strong> program
                    </span>
                  </div>
                )}

                {/* Template grid */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-[15px] font-semibold">Choose a Template</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {idpTemplates.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        selected={selectedTemplateId === t.id}
                        recommended={t.id === recommendedTemplate?.id}
                        onSelect={() => {
                          setSelectedTemplateId(t.id);
                          setOverrideSkills([]);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Override skills */}
                <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-semibold">Override Focus Skills</h4>
                    <span className="text-[11px] text-muted-foreground">— pick up to 3</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS_ALL.map((skill) => {
                      const active = overrideSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleOverrideSkill(skill)}
                          className="h-8 px-3 rounded-lg text-[12px] font-medium transition-all border"
                          style={
                            active
                              ? { background: `${PRIMARY.replace(")", " / 0.12)")}`, color: PRIMARY, borderColor: PRIMARY }
                              : { background: "oklch(0.18 0.005 260)", color: MUTED, borderColor: "oklch(0.22 0.01 260)" }
                          }
                        >
                          {SKILL_ICONS[skill]} {SKILL_LABELS[skill]}
                        </button>
                      );
                    })}
                  </div>
                  {overrideSkills.length > 0 && (
                    <p className="text-[12px] text-muted-foreground">
                      Goals will be configured for: {overrideSkills.map((s) => SKILL_LABELS[s]).join(", ")}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ──────────────── STEP 2 ──────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold">Configure Goals</h3>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  {selectedReport?.playerName} · {activeTemplate?.name}
                </p>
              </div>
              <span className="text-[12px] text-muted-foreground">
                {goals.length} / 5 goals
              </span>
            </div>

            {goals.map((g, i) => (
              <GoalEditor
                key={g.skill}
                goal={g}
                index={i}
                onUpdate={(updated) =>
                  setGoals((prev) => prev.map((x, j) => (j === i ? updated : x)))
                }
                onRemove={() => setGoals((prev) => prev.filter((_, j) => j !== i))}
                canRemove={goals.length > 1}
              />
            ))}

            {goals.length < 5 && (
              <button
                onClick={handleAddGoal}
                className="h-10 px-4 rounded-xl border-2 border-dashed text-[13px] font-medium flex items-center gap-2 transition-colors hover:border-primary/50"
                style={{ borderColor: "oklch(0.25 0.01 260)", color: MUTED }}
              >
                <Plus className="w-4 h-4" />
                Add another goal
              </button>
            )}
          </div>
        )}

        {/* ──────────────── STEP 3 ──────────────── */}
        {step === 3 && selectedReport && (
          <div className="flex flex-col gap-5">
            {/* Full IDP summary */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-[0.12em] font-mono mb-0.5"
                    style={{ color: PRIMARY }}
                  >
                    IDP Review
                  </div>
                  <h3 className="text-[18px] font-bold">{selectedReport.playerName}</h3>
                  <p className="text-[12px] text-muted-foreground">
                    {selectedReport.position} · {selectedReport.ageGroup} · {activeTemplate?.name}
                  </p>
                </div>
                <div
                  className="text-[11px] px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: `${SUCCESS.replace(")", " / 0.13)")}`, color: SUCCESS }}
                >
                  {goals.length} Goals
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {goals.map((g, i) => (
                  <div
                    key={g.skill}
                    className="rounded-lg p-4 flex flex-col gap-2"
                    style={{ background: "oklch(0.15 0.005 260)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: `${PRIMARY.replace(")", " / 0.15)")}`, color: PRIMARY }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[13px] font-semibold">{g.title}</span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-md font-medium ml-auto"
                        style={{ background: `${PRIMARY.replace(")", " / 0.10)")}`, color: PRIMARY }}
                      >
                        {SKILL_ICONS[g.skill]} {SKILL_LABELS[g.skill]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-muted-foreground flex-wrap">
                      <span>
                        Level {g.baselineLevel}{" "}
                        <span style={{ color: PRIMARY }}>→ {g.targetLevel}</span>
                      </span>
                      <span>{g.timelineWeeks} weeks</span>
                      {g.keyDrills.filter(Boolean).length > 0 && (
                        <span>{g.keyDrills.filter(Boolean).length} drills</span>
                      )}
                    </div>
                    {g.milestones.filter(Boolean).length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {g.milestones.filter(Boolean).map((m, mi) => (
                          <div key={mi} className="flex items-start gap-2 text-[11.5px] text-muted-foreground">
                            <span className="mt-0.5 shrink-0" style={{ color: SUCCESS }}>✓</span>
                            {m}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Parent summary */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.1em] text-[11px] font-mono">
                Parent-Facing Summary
              </h4>
              <p className="text-[13px] leading-relaxed italic">{parentSummary}</p>
            </div>

            {/* Season + toggles */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <h3 className="text-[15px] font-semibold">Activation Settings</h3>

              {/* Season */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
                  Season
                </span>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-1"
                  style={{ "--tw-ring-color": PRIMARY } as React.CSSProperties}
                >
                  {SEASONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSendToPlayer((v) => !v)}
                  className="flex items-center gap-3 text-left"
                >
                  {sendToPlayer ? (
                    <ToggleRight className="w-8 h-8 shrink-0" style={{ color: SUCCESS }} />
                  ) : (
                    <ToggleLeft className="w-8 h-8 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium">Send to Player</span>
                    </div>
                    <span className="text-[11.5px] text-muted-foreground">
                      Player will see this IDP in their app immediately
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setNotifyParent((v) => !v)}
                  className="flex items-center gap-3 text-left"
                >
                  {notifyParent ? (
                    <ToggleRight className="w-8 h-8 shrink-0" style={{ color: SUCCESS }} />
                  ) : (
                    <ToggleLeft className="w-8 h-8 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium">Notify Parent</span>
                    </div>
                    <span className="text-[11.5px] text-muted-foreground">
                      Sends a parent summary email and digest notification
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="h-10 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-all disabled:opacity-30"
            style={{ background: "oklch(0.20 0.01 260)", color: MUTED }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !canProceedStep1()) {
                  toast.error("Run gap analysis and select a template first");
                  return;
                }
                if (step === 2 && !canProceedStep2()) {
                  toast.error("Give each goal a title before continuing");
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="h-10 px-5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: PRIMARY, color: "oklch(0.98 0.005 260)" }}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleActivate}
              className="h-10 px-5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: SUCCESS, color: "oklch(0.98 0.005 260)" }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Activate IDP
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const SKILLS_ALL: SkillCategory[] = [
  "ball_handling",
  "shooting",
  "finishing",
  "defense",
  "footwork",
  "iq_reads",
  "athleticism",
  "conditioning",
];
