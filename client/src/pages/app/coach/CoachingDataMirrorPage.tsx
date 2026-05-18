/**
 * CoachingDataMirrorPage — /app/coach/data-mirror
 *
 * The "behavioral mirror" — shows coaches what their platform data says about
 * their coaching. Tone: trusted advisor, not performance review.
 *
 * Sections:
 *   1. Effectiveness Score Hero — SVG gauge + weighted breakdown
 *   2. Behavioral Metrics Grid — 2×4 metric cards with bars & insights
 *   3. Month-by-Month Trend   — SVG sparklines, click to expand
 *   4. Patterns & Insights    — AI observation cards with actions
 *   5. Reflection Prompts     — weekly coaching mirror questions
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X,
  BookOpen,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Info,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";
import {
  coachBehavioralMetrics,
  coachEffectivenessBreakdown,
  getMetricTrend,
  type BehavioralMetric,
  type TrendPoint,
} from "@/lib/mock/coach-metrics";

// ─────────────────────────────────────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  primary: "oklch(0.72 0.18 290)",
  success: "oklch(0.75 0.12 140)",
  warning: "oklch(0.78 0.16 75)",
  danger:  "oklch(0.68 0.22 25)",
  muted:   "oklch(0.55 0.02 260)",
};

function statusColor(status: BehavioralMetric["status"]) {
  if (status === "strong")     return C.success;
  if (status === "developing") return C.warning;
  return C.danger;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Effectiveness Score Hero
// ─────────────────────────────────────────────────────────────────────────────

/** SVG semicircle gauge, score 0–100. Arc fills left-to-right in primary. */
function EffectivenessGauge({ score }: { score: number }) {
  const R = 90;
  const cx = 110;
  const cy = 110;
  const startAngle = -180;
  const endAngle   = 0;

  function polarToXY(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(from: number, to: number, r: number) {
    const s = polarToXY(from, r);
    const e = polarToXY(to, r);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const fillAngle = startAngle + (score / 100) * 180;
  const scoreColor =
    score >= 70 ? C.primary :
    score >= 50 ? C.warning :
    C.danger;

  return (
    <svg viewBox="0 0 220 120" className="w-full max-w-[280px] mx-auto" aria-label={`Effectiveness score: ${score}`}>
      {/* Track */}
      <path
        d={arcPath(-180, 0, R)}
        fill="none"
        stroke="oklch(0.25 0.01 260)"
        strokeWidth={16}
        strokeLinecap="round"
      />
      {/* Fill */}
      {score > 0 && (
        <path
          d={arcPath(-180, fillAngle, R)}
          fill="none"
          stroke={scoreColor}
          strokeWidth={16}
          strokeLinecap="round"
        />
      )}
      {/* Score label */}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={36}
        fontWeight={700}
        fill="currentColor"
        className="text-foreground"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 26}
        textAnchor="middle"
        fontSize={11}
        fill={C.muted}
      >
        out of 100
      </text>
      {/* Axis labels */}
      <text x={12} y={cy + 10} fontSize={10} fill={C.muted}>0</text>
      <text x={198} y={cy + 10} fontSize={10} fill={C.muted}>100</text>
    </svg>
  );
}

function ScoreBreakdownRow({
  label, weight, score, contribution,
}: {
  label: string; weight: number; score: number; contribution: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 text-[12px] text-muted-foreground">{label}</div>
      <span
        className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
        style={{ background: "oklch(0.22 0.01 260)", color: C.muted }}
      >
        {Math.round(weight * 100)}%
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: C.primary }}
        />
      </div>
      <div className="w-8 text-right text-[12px] font-mono shrink-0">{score}</div>
      <div className="w-10 text-right text-[11px] text-muted-foreground shrink-0">
        +{contribution.toFixed(1)}
      </div>
    </div>
  );
}

function EffectivenessHero() {
  const [expanded, setExpanded] = useState(false);
  const { overallScore, components } = coachEffectivenessBreakdown;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-center mb-2">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono mb-3">
          Your Coaching Effectiveness Score
        </div>
        <EffectivenessGauge score={overallScore} />
        <p className="text-[13px] text-muted-foreground mt-2 max-w-sm mx-auto">
          Composite of 6 behavioral signals from your platform activity.
          Benchmarked against development-level coaches.
        </p>
      </div>

      {/* Breakdown toggle */}
      <div className="mt-5 border-t border-border pt-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition w-full"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          How is this calculated?
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 mb-1">
              <span className="w-36">Component</span>
              <span className="w-10">Weight</span>
              <span className="flex-1">Score</span>
              <span className="w-8 text-right">Raw</span>
              <span className="w-10 text-right">Pts</span>
            </div>
            {components.map((c) => (
              <ScoreBreakdownRow key={c.label} {...c} />
            ))}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Overall score</span>
              <span className="font-bold text-[16px]">{overallScore}</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/50 text-center mt-4">
        This score is private — only you can see it.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 — Behavioral Metrics Grid
// ─────────────────────────────────────────────────────────────────────────────

function MetricBenchmarkBar({ value, benchmark, unit }: {
  value: number; benchmark: number; unit: string;
}) {
  const max = Math.max(value, benchmark) * 1.3;
  const valuePct = (value / max) * 100;
  const benchmarkPct = (benchmark / max) * 100;
  const isAbove = value >= benchmark;

  return (
    <div className="space-y-1.5">
      {/* Your value bar */}
      <div className="flex items-center gap-2">
        <div className="w-12 text-[10px] text-muted-foreground shrink-0">You</div>
        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${valuePct}%`,
              background: isAbove ? C.success : C.warning,
            }}
          />
        </div>
      </div>
      {/* Benchmark bar */}
      <div className="flex items-center gap-2">
        <div className="w-12 text-[10px] text-muted-foreground shrink-0">Avg</div>
        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${benchmarkPct}%`, background: "oklch(0.45 0.02 260)" }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: BehavioralMetric }) {
  const [insightOpen, setInsightOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const sc = statusColor(metric.status);
  const trendPositive = metric.trend > 0;
  // For "at_risk_response" (days), lower is better
  const lowerIsBetter = metric.unit === "days";
  const trendIsGood = lowerIsBetter ? !trendPositive : trendPositive;

  const statusLabel = { strong: "Strong", developing: "Developing", lagging: "Lagging" }[metric.status];

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-[14px] leading-snug">{metric.label}</span>
          <button
            onClick={() => setTooltipOpen((v) => !v)}
            className="text-muted-foreground/50 hover:text-muted-foreground transition shrink-0"
            aria-label="What does this measure?"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${sc.replace(")", " / 0.12)")}`, color: sc }}
        >
          {statusLabel}
        </span>
      </div>

      {tooltipOpen && (
        <p className="text-[11.5px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          {metric.description}
        </p>
      )}

      {/* Value */}
      <div className="flex items-end gap-2">
        <span
          className="font-bold text-[28px] leading-none font-mono"
          style={{ color: sc }}
        >
          {metric.value}
        </span>
        <span className="text-[12px] text-muted-foreground mb-1">{metric.unit}</span>

        {/* Trend */}
        <div
          className="ml-auto flex items-center gap-1 text-[12px] font-semibold"
          style={{ color: trendIsGood ? C.success : C.danger }}
        >
          {trendPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {trendPositive ? "+" : ""}{metric.trend} {metric.unit === "%" ? "pp" : metric.unit}
        </div>
      </div>

      {/* Benchmark bar */}
      <MetricBenchmarkBar
        value={metric.value}
        benchmark={metric.benchmark}
        unit={metric.unit}
      />
      <p className="text-[10.5px] text-muted-foreground">{metric.benchmarkLabel}</p>

      {/* AI Insight toggle */}
      <button
        onClick={() => setInsightOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        AI insight
        {insightOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {insightOpen && (
        <p className="text-[12px] text-foreground bg-muted/30 rounded-lg px-3 py-2.5 leading-snug">
          {metric.insight}
        </p>
      )}

      {/* Module recommendation */}
      {(metric.status === "lagging" || metric.status === "developing") && metric.moduleRecommendationId && (
        <Link href={`/app/learn/courses/${metric.moduleRecommendationId}`} asChild>
          <a className="flex items-center gap-1.5 text-[11.5px] font-semibold mt-auto"
             style={{ color: C.primary }}>
            <BookOpen className="w-3.5 h-3.5" />
            Suggested module
            <ArrowRight className="w-3 h-3" />
          </a>
        </Link>
      )}
    </div>
  );
}

function BehavioralMetricsGrid() {
  return (
    <div>
      <h2 className="font-bold text-[18px] mb-4">Behavioral Metrics</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {coachBehavioralMetrics.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Month-by-Month Trend Sparklines
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  expanded,
}: {
  data: TrendPoint[];
  color: string;
  expanded?: boolean;
}) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const W = expanded ? 340 : 120;
  const H = expanded ? 80 : 40;
  const padX = expanded ? 28 : 8;
  const padY = expanded ? 10 : 4;

  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (W - padX * 2);
    const y = padY + ((maxV - d.value) / range) * (H - padY * 2);
    return { x, y, ...d };
  });

  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {/* Area fill */}
      <path d={areaD} fill={`${color.replace(")", " / 0.10)")}`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={expanded ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots on expanded */}
      {expanded && pts.map((p) => (
        <circle key={p.month} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
      {/* Month labels on expanded */}
      {expanded && pts.map((p) => (
        <text key={p.month + "l"} x={p.x} y={H - 1} textAnchor="middle" fontSize={9} fill={C.muted}>
          {p.month}
        </text>
      ))}
    </svg>
  );
}

function SparklineCard({ metric }: { metric: BehavioralMetric }) {
  const [expanded, setExpanded] = useState(false);
  const data = getMetricTrend(metric.id);
  const sc = statusColor(metric.status);
  const last = data[data.length - 1];

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className={`rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40 ${expanded ? "col-span-2" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[12px] font-semibold leading-snug">{metric.label}</span>
        <span className="font-mono font-bold text-[15px] shrink-0" style={{ color: sc }}>
          {last?.value}{metric.unit === "%" ? "%" : ""}
        </span>
      </div>
      <Sparkline data={data} color={sc} expanded={expanded} />
      {expanded && (
        <div className="mt-3 text-[11px] text-muted-foreground">
          6-month trend · Dec 2025 – May 2026
        </div>
      )}
    </button>
  );
}

function MonthlyTrendSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[18px]">6-Month Trends</h2>
        <p className="text-[12px] text-muted-foreground">Click any chart to expand</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {coachBehavioralMetrics.map((m) => (
          <SparklineCard key={m.id} metric={m} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Patterns & Insights
// ─────────────────────────────────────────────────────────────────────────────

type InsightCard = {
  id: string;
  variant: "warning" | "info" | "success";
  text: string;
  source: string;
  actionLabel: string;
  actionHref: string;
};

const AI_INSIGHTS: InsightCard[] = [
  {
    id: "i1",
    variant: "warning",
    text: "Malik's readiness has been below 65 four times in the last two weeks — always on days after school tests. Worth a conversation about load management during exam weeks.",
    source: "Based on readiness logs · 14-day window",
    actionLabel: "View Malik's readiness",
    actionHref: "/app/coach/players/p10/idp",
  },
  {
    id: "i2",
    variant: "info",
    text: "Your ball handling observations dropped 60% since mid-March. Three players in that category are showing the flattest skill velocity on your roster.",
    source: "Based on observation logs · March–May",
    actionLabel: "Open film queue",
    actionHref: "/app/coach/queue",
  },
  {
    id: "i3",
    variant: "success",
    text: "Three players who completed 80%+ WODs this month improved skill velocity by 2.3x compared to players below that threshold. Consistent work is showing up in the data.",
    source: "Based on WOD completion and skill logs · 30-day window",
    actionLabel: "View WOD completion",
    actionHref: "/app/coach/wods",
  },
];

function InsightVariantStyles(variant: InsightCard["variant"]) {
  if (variant === "warning") return {
    border: "oklch(0.78 0.16 75 / 0.4)",
    bg: "oklch(0.78 0.16 75 / 0.06)",
    icon: <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: C.warning }} />,
  };
  if (variant === "success") return {
    border: "oklch(0.75 0.12 140 / 0.4)",
    bg: "oklch(0.75 0.12 140 / 0.06)",
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.success }} />,
  };
  return {
    border: "oklch(0.72 0.18 290 / 0.35)",
    bg: "oklch(0.72 0.18 290 / 0.05)",
    icon: <Info className="w-4 h-4 shrink-0" style={{ color: C.primary }} />,
  };
}

function PatternsInsightsSection() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = AI_INSIGHTS.filter((c) => !dismissed.has(c.id));

  return (
    <div>
      <h2 className="font-bold text-[18px] mb-4">Patterns & Insights</h2>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-6 text-center text-[13px] text-muted-foreground">
          All insights dismissed. New ones will appear as your data updates.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((card) => {
            const styles = InsightVariantStyles(card.variant);
            return (
              <div
                key={card.id}
                className="rounded-xl border p-4"
                style={{ borderColor: styles.border, background: styles.bg }}
              >
                <div className="flex items-start gap-3">
                  {styles.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-snug">{card.text}</p>
                    <p className="text-[10.5px] text-muted-foreground/60 mt-1.5">{card.source}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <Link href={card.actionHref} asChild>
                        <a
                          className="text-[12px] font-semibold flex items-center gap-1"
                          style={{ color: C.primary }}
                        >
                          {card.actionLabel} <ArrowRight className="w-3 h-3" />
                        </a>
                      </Link>
                      <button
                        onClick={() => {
                          toast.success("Added to coaching journal");
                        }}
                        className="text-[12px] text-muted-foreground hover:text-foreground transition"
                      >
                        Note this
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setDismissed((s) => { const n = new Set(Array.from(s)); n.add(card.id); return n; })}
                    className="text-muted-foreground/40 hover:text-muted-foreground transition shrink-0"
                    aria-label="Dismiss insight"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Reflection Prompts
// ─────────────────────────────────────────────────────────────────────────────

const REFLECTION_PROMPTS = [
  {
    id: "r1",
    question: "Where is your attention going?",
    hint: "Check your observation data for clues.",
  },
  {
    id: "r2",
    question: "Which player surprised you most in the last 2 weeks?",
    hint: "Is it reflected in their data?",
  },
  {
    id: "r3",
    question: "What practice element have you been avoiding?",
    hint: "Your practice plan history might show a pattern.",
  },
];

function ReflectionPromptsSection() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());

  function handleSave(id: string) {
    if (!answers[id]?.trim()) return;
    setSaved((s) => { const n = new Set(Array.from(s)); n.add(id); return n; });
    toast.success("Reflection saved to coaching journal");
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-[18px]">Your Coaching Mirror This Week</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Three questions. No right answers. Just honest reflection.
        </p>
      </div>

      <div className="space-y-4">
        {REFLECTION_PROMPTS.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-semibold">{p.question}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{p.hint}</p>
              </div>
            </div>
            <textarea
              className="w-full rounded-lg border border-border bg-background text-[13px] px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 min-h-[60px]"
              placeholder="A sentence or two is enough..."
              value={answers[p.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [p.id]: e.target.value }))}
              rows={2}
              disabled={saved.has(p.id)}
            />
            <div className="flex items-center justify-between mt-2">
              {saved.has(p.id) ? (
                <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: C.success }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved to journal
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/50">
                  Saves to your coaching journal
                </span>
              )}
              {!saved.has(p.id) && (
                <button
                  onClick={() => handleSave(p.id)}
                  disabled={!answers[p.id]?.trim()}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-md transition disabled:opacity-40"
                  style={{ background: `${C.primary.replace(")", " / 0.12)")}`, color: C.primary }}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CoachingDataMirrorPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto space-y-10">
        <PageHeader
          eyebrow="Coach Development · Private"
          title="Your Coaching Mirror"
          subtitle="Here's what the data shows about your coaching patterns this season. You decide what to do with it."
          actions={
            <Link href="/app/coach/impact-report" asChild>
              <a
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md font-semibold text-[12.5px] uppercase tracking-[0.07em] transition hover:brightness-110"
                style={{ background: C.primary, color: "#fff" }}
              >
                <TrendingUp className="w-4 h-4" /> Season Report
              </a>
            </Link>
          }
        />

        {/* 1 — Effectiveness Score */}
        <div className="max-w-xl mx-auto lg:mx-0">
          <EffectivenessHero />
        </div>

        {/* 2 — Behavioral Metrics Grid */}
        <BehavioralMetricsGrid />

        {/* 3 — Sparkline Trends */}
        <MonthlyTrendSection />

        {/* 4 — AI Insights */}
        <PatternsInsightsSection />

        {/* 5 — Reflection */}
        <ReflectionPromptsSection />
      </div>
    </AppShell>
  );
}
