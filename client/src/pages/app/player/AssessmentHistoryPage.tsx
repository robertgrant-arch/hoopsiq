import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import {
  getAssessmentHistory,
  latestAssessmentsByPlayer,
  getLevelLabel,
  getCategoryLabel,
  CATEGORY_LABELS,
  skillProtocols,
  type SkillCategory,
  type AssessmentResult,
  type SkillAssessment,
} from "@/features/skill-assessment/mock";

// Demo: player viewing their own history (p10 = Malik Henderson for demo)
const DEMO_PLAYER_ID = "p10";
const DEMO_PLAYER_NAME = "Malik Henderson";

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

function deltaText(delta: number): string {
  if (delta > 0) return `↑ +${delta.toFixed(0)} pts since last test`;
  if (delta < 0) return `↓ ${delta.toFixed(0)} pts since last test`;
  return "→ No change";
}

function deltaColor(delta: number): string {
  if (delta > 5) return "oklch(0.75 0.12 140)";
  if (delta < -5) return "oklch(0.68 0.22 25)";
  return "oklch(0.55 0.02 260)";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function weeksUntil(targetIso: string): number {
  return Math.max(0, Math.round((new Date(targetIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)));
}

// ─── Assessment type badge ────────────────────────────────────────────────────

function AssessmentTypeBadge({ type }: { type: SkillAssessment["assessmentType"] }) {
  const labels = { structured: "Structured Test", coach_rated: "Coach Rated", game_performance: "Game Performance" };
  const colors = {
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

// ─── SVG Trajectory Chart ─────────────────────────────────────────────────────

interface TrajectoryChartProps {
  history: SkillAssessment[];
  category: SkillCategory;
}

function TrajectoryChart({ history, category }: TrajectoryChartProps) {
  const W = 240;
  const H = 64;
  const padX = 12;
  const padY = 8;

  const points = history
    .map((a) => a.results.find((r) => r.category === category))
    .filter((r): r is AssessmentResult => r !== undefined);

  if (points.length < 1) {
    return (
      <svg width={W} height={H}>
        <text x={W / 2} y={H / 2 + 4} textAnchor="middle" fontSize={10} fill="oklch(0.55 0.02 260)" fontFamily="inherit">
          No data
        </text>
      </svg>
    );
  }

  const usableW = W - padX * 2;
  const usableH = H - padY * 2;

  // x position: spread evenly across assessments
  const xOf = (i: number) =>
    points.length === 1 ? padX + usableW / 2 : padX + (i / (points.length - 1)) * usableW;
  // y position: level 1-5, inverted (1 = bottom, 5 = top)
  const yOf = (level: number) => padY + usableH - ((level - 1) / 4) * usableH;

  const color = levelColor(points[points.length - 1].level);

  const polylinePoints = points.map((p, i) => `${xOf(i)},${yOf(p.level)}`).join(" ");

  return (
    <svg width={W} height={H} className="block">
      {/* Grid lines */}
      {[1, 2, 3, 4, 5].map((lvl) => (
        <line
          key={lvl}
          x1={padX}
          x2={W - padX}
          y1={yOf(lvl)}
          y2={yOf(lvl)}
          stroke="oklch(0.55 0.02 260 / 0.15)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ))}
      {/* Level labels */}
      {[1, 3, 5].map((lvl) => (
        <text key={lvl} x={padX - 2} y={yOf(lvl) + 4} fontSize={9} fill="oklch(0.55 0.02 260 / 0.6)" textAnchor="end" fontFamily="inherit">
          {lvl}
        </text>
      ))}
      {/* Line */}
      {points.length > 1 && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={`${color}cc`}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(p.level)} r={4} fill={color} />
          <title>{`${formatDate(history[i].assessedAt)}: Level ${p.level} (${p.score})`}</title>
        </g>
      ))}
    </svg>
  );
}

// ─── Current Levels Card ──────────────────────────────────────────────────────

function CurrentLevelsCard({ assessment }: { assessment: SkillAssessment }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Your Current Levels</div>
        <div className="text-[11px] text-muted-foreground">
          Assessed {formatDate(assessment.assessedAt)} · Week {assessment.week} · {assessment.season}
        </div>
      </div>
      <div className="space-y-3">
        {SKILL_CATEGORIES.map((cat) => {
          const result = assessment.results.find((r) => r.category === cat);
          if (!result) return null;
          const color = levelColor(result.level);
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium text-foreground">{getCategoryLabel(cat)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: deltaColor(result.delta) }}>
                    {deltaText(result.delta)}
                  </span>
                  <span className="text-[12px] font-bold" style={{ color }}>{getLevelLabel(result.level)}</span>
                </div>
              </div>
              {/* 5-dot row */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className="h-2 flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor: lvl <= result.level ? color : "oklch(0.55 0.02 260 / 0.2)",
                    }}
                  />
                ))}
                <span className="text-[11px] text-muted-foreground ml-1 shrink-0">{result.level}/5</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Trajectory Grid ──────────────────────────────────────────────────────────

function SkillTrajectoryGrid({ history }: { history: SkillAssessment[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center text-muted-foreground text-[13px]">
        No assessment history to display.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <div className="text-[14px] font-semibold text-foreground">Skill Trajectory</div>
        <div className="text-[12px] text-muted-foreground">Level progression across your assessment history</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SKILL_CATEGORIES.map((cat) => {
          const latestResult = history[history.length - 1]?.results.find((r) => r.category === cat);
          return (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-foreground">{getCategoryLabel(cat)}</span>
                {latestResult && (
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: levelColor(latestResult.level) }}
                  >
                    L{latestResult.level}
                  </span>
                )}
              </div>
              <TrajectoryChart history={history} category={cat} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border">
        <span>Dots = each assessment · Y-axis = level (1–5) · Dashed lines = level thresholds</span>
      </div>
    </div>
  );
}

// ─── History timeline card ────────────────────────────────────────────────────

function AssessmentTimelineCard({ assessment }: { assessment: SkillAssessment }) {
  const [expanded, setExpanded] = useState(false);
  const positive = assessment.overallDelta > 2;
  const negative = assessment.overallDelta < -2;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        className="w-full flex items-start gap-4 p-5 text-left min-h-[60px]"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Date column */}
        <div className="shrink-0 w-14 text-center">
          <div
            className="text-[20px] font-black leading-none"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            {new Date(assessment.assessedAt).getDate()}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {new Date(assessment.assessedAt).toLocaleString("en-US", { month: "short" })}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {new Date(assessment.assessedAt).getFullYear()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[13px] font-semibold text-foreground">
              Week {assessment.week} · {assessment.season}
            </span>
            <AssessmentTypeBadge type={assessment.assessmentType} />
          </div>
          <div className="text-[12px] text-muted-foreground">by {assessment.assessorName}</div>

          {/* Compact level badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {assessment.results.map((r) => (
              <span
                key={r.category}
                className="text-[11px] font-medium px-2 py-0.5 rounded border"
                style={{
                  color: levelColor(r.level),
                  borderColor: `${levelColor(r.level)}40`,
                  backgroundColor: `${levelColor(r.level)}10`,
                }}
                title={`${getCategoryLabel(r.category)}: Level ${r.level} · Score ${r.score}`}
              >
                {CATEGORY_LABELS[r.category].split(" ")[0]} L{r.level}
              </span>
            ))}
          </div>
        </div>

        {/* Delta + chevron */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold"
            style={{
              color: positive ? "oklch(0.75 0.12 140)" : negative ? "oklch(0.68 0.22 25)" : "oklch(0.55 0.02 260)",
              backgroundColor: positive
                ? "oklch(0.75 0.12 140 / 0.12)"
                : negative
                ? "oklch(0.68 0.22 25 / 0.12)"
                : "oklch(0.55 0.02 260 / 0.1)",
            }}
          >
            {positive ? <TrendingUp size={12} /> : negative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {assessment.overallDelta > 0 ? "+" : ""}
            {assessment.overallDelta.toFixed(1)}
          </div>
          {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          {/* Per-category breakdown */}
          <div className="grid gap-2">
            {assessment.results.map((r) => {
              const color = levelColor(r.level);
              return (
                <div key={r.category} className="flex items-center gap-3">
                  <span className="text-[12px] text-muted-foreground w-28 shrink-0">{getCategoryLabel(r.category)}</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className="h-2 flex-1 rounded-full"
                        style={{ backgroundColor: lvl <= r.level ? color : "oklch(0.55 0.02 260 / 0.2)" }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 w-28 justify-end">
                    <span className="text-[12px] font-semibold" style={{ color }}>
                      {getLevelLabel(r.level)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">({r.score})</span>
                    {r.delta !== 0 && (
                      <span className="text-[11px] font-medium" style={{ color: deltaColor(r.delta) }}>
                        {r.delta > 0 ? `+${r.delta}` : r.delta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coach summary */}
          {assessment.coachSummary && (
            <div className="bg-muted/40 rounded-lg p-3">
              <div className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                Coach Notes
              </div>
              <p className="text-[13px] text-foreground">{assessment.coachSummary}</p>
            </div>
          )}

          {/* Coach-only check */}
          {!assessment.parentVisible && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              <span>This assessment is not yet shared with your parent/guardian.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Next assessment prompt ───────────────────────────────────────────────────

function NextAssessmentPrompt({ latestAssessmentDate }: { latestAssessmentDate?: string }) {
  const NEXT_ASSESSMENT_DATE = "2026-06-06T10:00:00Z"; // 3 weeks out
  const weeksOut = weeksUntil(NEXT_ASSESSMENT_DATE);

  return (
    <div
      className="rounded-xl border p-5 flex items-start gap-4"
      style={{
        borderColor: "oklch(0.72 0.18 290 / 0.3)",
        backgroundColor: "oklch(0.72 0.18 290 / 0.05)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "oklch(0.72 0.18 290 / 0.15)" }}
      >
        <Calendar size={18} style={{ color: "oklch(0.72 0.18 290)" }} />
      </div>
      <div className="flex-1 min-w-0">
        {weeksOut > 0 ? (
          <>
            <div className="text-[14px] font-semibold text-foreground">
              Your next assessment is in {weeksOut} week{weeksOut !== 1 ? "s" : ""}
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Scheduled for {formatDate(NEXT_ASSESSMENT_DATE)} · Structured Test
            </div>
          </>
        ) : (
          <>
            <div className="text-[14px] font-semibold text-foreground">No scheduled assessment</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              Request your next assessment from Coach Grant
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => toast.success("Request sent to Coach Grant", { description: "You'll receive a confirmation when scheduled." })}
          className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg min-h-[36px] transition-opacity"
          style={{ backgroundColor: "oklch(0.72 0.18 290)", color: "#fff" }}
        >
          <Bell size={12} />
          {weeksOut > 0 ? "Get reminded" : "Request assessment"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssessmentHistoryPage() {
  const { user } = useAuth();
  const playerId = DEMO_PLAYER_ID;

  // In production this would use the logged-in athlete's ID.
  const history = useMemo(() => getAssessmentHistory(playerId), [playerId]);
  const latest = latestAssessmentsByPlayer[playerId];

  const visibleHistory = history.filter((a) => a.parentVisible);
  const chronologicalHistory = [...visibleHistory].reverse();

  const overallDelta = latest?.overallDelta ?? 0;
  const trendLabel =
    overallDelta > 5 ? "Improving" : overallDelta < -5 ? "Declining" : "Plateauing";
  const trendIcon =
    overallDelta > 5 ? <TrendingUp size={14} /> : overallDelta < -5 ? <TrendingDown size={14} /> : <Minus size={14} />;
  const trendColor =
    overallDelta > 5 ? "oklch(0.75 0.12 140)" : overallDelta < -5 ? "oklch(0.68 0.22 25)" : "oklch(0.78 0.16 75)";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          eyebrow="Development"
          title="Assessment History"
          subtitle="Track your skill progression across every assessment you've completed."
        />

        {/* Summary banner */}
        {latest && (
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-[13px] font-semibold text-foreground">
                {history.length} assessment{history.length !== 1 ? "s" : ""} this season
              </div>
              <div className="text-[12px] text-muted-foreground">
                Last assessed {formatDate(latest.assessedAt)} · by {latest.assessorName}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold"
                style={{ backgroundColor: `${trendColor}15`, color: trendColor }}
              >
                {trendIcon}
                {trendLabel}
              </div>
              <div
                className="text-[20px] font-black"
                style={{ color: deltaColor(overallDelta) }}
              >
                {overallDelta > 0 ? "+" : ""}
                {overallDelta.toFixed(1)}
              </div>
            </div>
          </div>
        )}

        {/* Next assessment prompt */}
        <NextAssessmentPrompt latestAssessmentDate={latest?.assessedAt} />

        {/* Current levels card */}
        {latest && <CurrentLevelsCard assessment={latest} />}

        {/* Trajectory chart */}
        <SkillTrajectoryGrid history={visibleHistory} />

        {/* Assessment timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <ClipboardCheck size={15} style={{ color: "oklch(0.72 0.18 290)" }} />
              Assessment Timeline
            </h2>
            <span className="text-[12px] text-muted-foreground">{chronologicalHistory.length} records</span>
          </div>

          {chronologicalHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground text-[13px]">
              No assessments recorded yet. Your coach will schedule your first session.
            </div>
          ) : (
            <div className="space-y-3">
              {chronologicalHistory.map((assessment) => (
                <AssessmentTimelineCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
