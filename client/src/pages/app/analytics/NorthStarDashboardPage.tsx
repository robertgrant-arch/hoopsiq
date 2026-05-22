/**
 * NorthStarDashboardPage — /app/analytics/north-star
 *
 * Executive/board one-pager. 7 metrics. Premium strategy document feel.
 * Lots of whitespace. Large typography. Color used sparingly.
 */
import React, { useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  AlertTriangle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  warningSignals,
  leadingIndicators,
  vdvTimeSeries,
  enterpriseMetrics,
  cohortRetention,
  VDV_CURRENT,
  VDV_TARGET,
  type WarningSignal,
  type LeadingIndicator,
} from "@/features/analytics/kpi";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Sparkline SVG (60×24px, 12 data points)                                    */
/* -------------------------------------------------------------------------- */

function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const W = 60;
  const H = 24;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  function x(i: number) {
    return pad + (i / (values.length - 1)) * (W - pad * 2);
  }

  function y(v: number) {
    return H - pad - ((v - min) / range) * (H - pad * 2);
  }

  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");

  const areaPath =
    path +
    ` L${x(values.length - 1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <path d={areaPath} fill={color} opacity="0.12" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {/* Last data point dot */}
      <circle
        cx={x(values.length - 1)}
        cy={y(values[values.length - 1])}
        r={2}
        fill={color}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Delta badge                                                                 */
/* -------------------------------------------------------------------------- */

function DeltaBadge({
  delta,
  label,
  isGood,
}: {
  delta: string;
  label?: string;
  isGood: boolean;
}) {
  const color = isGood ? SUCCESS : DANGER;
  const startsWith = delta.startsWith("↑") || delta.startsWith("+");
  const Icon = startsWith ? TrendingUp : delta.startsWith("↓") || delta.startsWith("-") ? TrendingDown : Minus;

  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color }}>
      <Icon className="w-3 h-3" />
      {delta}{label ? ` ${label}` : ""}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* The 7 metric cards                                                          */
/* -------------------------------------------------------------------------- */

type MetricCard = {
  id: number;
  name: string;
  value: string;
  valueColor: string;
  delta: string;
  deltaGood: boolean;
  deltaLabel?: string;
  description: string;
  sparkValues: number[];
  sparkColor: string;
  badge?: { text: string; color: string };
};

const METRICS: MetricCard[] = [
  {
    id: 1,
    name: "Verified Development Velocity",
    value: "61%",
    valueColor: PRIMARY,
    delta: "↑ +4.2pp",
    deltaGood: true,
    deltaLabel: "this month",
    description:
      "The percentage of active players in active programs verifiably improving their skills. HoopsIQ's North Star — every product decision is optimized to move this number.",
    sparkValues: [48, 49, 50, 49, 51, 53, 54, 55, 57, 57, 59, 61],
    sparkColor: PRIMARY,
  },
  {
    id: 2,
    name: "Program Retention at Month 12",
    value: "58%",
    valueColor: WARNING,
    delta: "↓ -2pp",
    deltaGood: false,
    deltaLabel: "vs. target",
    description:
      "Programs still active 12 months after onboarding. Slightly below the 60% target. Month-1 parent engagement is the strongest leading predictor of 12-month survival.",
    sparkValues: [55, 54, 56, 55, 57, 56, 58, 57, 59, 58, 59, 58],
    sparkColor: WARNING,
    badge: { text: "2pp below target", color: WARNING },
  },
  {
    id: 3,
    name: "Net Dollar Retention",
    value: "112%",
    valueColor: SUCCESS,
    delta: "↑ +4pp",
    deltaGood: true,
    deltaLabel: "vs. last quarter",
    description:
      "Revenue retained from existing programs after expansions and churn. >100% means existing programs are growing faster than they're churning — a core SaaS health signal.",
    sparkValues: [101, 103, 105, 104, 107, 106, 108, 108, 110, 111, 111, 112],
    sparkColor: SUCCESS,
  },
  {
    id: 4,
    name: "Multi-Season Player Records",
    value: "34%",
    valueColor: SUCCESS,
    delta: "↑ +8pp",
    deltaGood: true,
    deltaLabel: "this year",
    description:
      "Active players with verified data across 2+ seasons. Multi-season records are the network effect flywheel — they increase recruiter demand, director NPS, and family loyalty.",
    sparkValues: [18, 20, 21, 23, 24, 25, 27, 28, 30, 31, 32, 34],
    sparkColor: SUCCESS,
  },
  {
    id: 5,
    name: "Recruiter Access Requests / Month",
    value: "847",
    valueColor: PRIMARY,
    delta: "↑ +23%",
    deltaGood: true,
    deltaLabel: "MoM",
    description:
      "College and professional scouts requesting player profile access. This number is the market's real-time signal that HoopsIQ development data is trusted and valued externally.",
    sparkValues: [420, 470, 510, 540, 580, 610, 650, 700, 730, 770, 810, 847],
    sparkColor: PRIMARY,
  },
  {
    id: 6,
    name: "Active Warning Signals",
    value: "2 critical · 3 monitoring",
    valueColor: DANGER,
    delta: "↑ +1",
    deltaGood: false,
    deltaLabel: "vs. last week",
    description:
      "Automated signals detecting data quality degradation (inflation, staleness, director dropout). Warning signals are leading indicators of VDV score corruption and churn risk.",
    sparkValues: [1, 1, 2, 1, 2, 3, 2, 2, 3, 4, 4, 5],
    sparkColor: DANGER,
    badge: { text: "Requires attention", color: DANGER },
  },
  {
    id: 7,
    name: "Referral Rate",
    value: "31%",
    valueColor: SUCCESS,
    delta: "↑ +5pp",
    deltaGood: true,
    deltaLabel: "vs. last quarter",
    description:
      "New programs sourced from director and coach referrals. Referral programs activate 38% faster and retain at 78% through Month 12 vs. 52% for self-serve.",
    sparkValues: [18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31],
    sparkColor: SUCCESS,
  },
];

function MetricCard({ metric }: { metric: MetricCard }) {
  const isLarge = metric.id === 1;
  return (
    <div
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8 flex flex-col gap-4"
      style={isLarge ? { borderColor: `${PRIMARY.replace(")", " / 0.40)")}` } : undefined}
    >
      {/* Top row: name + sparkline */}
      <div className="flex items-start justify-between gap-4">
        <div className="text-[13px] text-[var(--text-muted)] font-medium leading-tight max-w-[200px]">
          {metric.name}
        </div>
        <Sparkline values={metric.sparkValues} color={metric.sparkColor} />
      </div>

      {/* Value */}
      <div
        className="font-black leading-none tracking-tight"
        style={{
          fontSize: isLarge ? 56 : 48,
          color: metric.valueColor,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {metric.value}
      </div>

      {/* Delta */}
      <DeltaBadge
        delta={metric.delta}
        label={metric.deltaLabel}
        isGood={metric.deltaGood}
      />

      {/* Description */}
      <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
        {metric.description}
      </p>

      {/* Optional status badge */}
      {metric.badge && (
        <div
          className="inline-flex self-start items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `${metric.badge.color.replace(")", " / 0.12)")}`,
            color: metric.badge.color,
          }}
        >
          <AlertCircle className="w-3 h-3" />
          {metric.badge.text}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Warning panel                                                               */
/* -------------------------------------------------------------------------- */

function severityColor(severity: WarningSignal["severity"]) {
  if (severity === "critical") return DANGER;
  if (severity === "warning")  return WARNING;
  return PRIMARY;
}

function severityLabel(severity: WarningSignal["severity"]) {
  if (severity === "critical") return "Critical";
  if (severity === "warning")  return "Warning";
  return "Monitor";
}

function WarningPanel() {
  const signals = warningSignals;
  const criticalCount = signals.filter((s) => s.severity === "critical").length;
  const warningCount  = signals.filter((s) => s.severity === "warning").length;
  const monitorCount  = signals.filter((s) => s.severity === "monitor").length;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Active Signals Requiring Attention</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {criticalCount} critical · {warningCount} warning · {monitorCount} monitoring
          </p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${DANGER.replace(")", " / 0.12)")}`, color: DANGER }}
            >
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${WARNING.replace(")", " / 0.12)")}`, color: WARNING }}
            >
              {warningCount} Warning
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {signals.map((signal) => {
          const color = severityColor(signal.severity);
          return (
            <div
              key={signal.id}
              className="flex gap-4 p-4 rounded-xl"
              style={{ background: `${color.replace(")", " / 0.06)")}` }}
            >
              {/* Severity dot */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: color }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color }}
                  >
                    {severityLabel(signal.severity)}
                  </span>
                  {signal.programName && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      · {signal.programName}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                    Detected {signal.detectedAt}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text-primary)] mb-2 leading-snug">
                  {signal.description}
                </p>
                <div className="flex gap-4 text-[11px] text-[var(--text-muted)] flex-wrap">
                  <span>
                    <span className="font-medium">Metric:</span> {signal.metric}
                  </span>
                  <span>
                    <span className="font-medium">Actual:</span>{" "}
                    <span style={{ color }}>{signal.actual}</span>
                  </span>
                </div>
                <div className="mt-2 text-[11px]" style={{ color }}>
                  → {signal.recommendedAction}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Strategic context — "this week's focus" rotating card                       */
/* -------------------------------------------------------------------------- */

function ThisWeekFocus() {
  // Find the leading indicator furthest below target
  const furthestBehind = leadingIndicators
    .filter((li) => li.value < li.target)
    .reduce<LeadingIndicator | null>((worst, li) => {
      if (!worst) return li;
      const worstGap = (worst.target - worst.value) / worst.target;
      const liGap    = (li.target - li.value) / li.target;
      return liGap > worstGap ? li : worst;
    }, null);

  if (!furthestBehind) return null;

  const gapPct = Math.round(((furthestBehind.target - furthestBehind.value) / furthestBehind.target) * 100);

  return (
    <div
      className="rounded-2xl p-6 md:p-8 border"
      style={{
        background: `${PRIMARY.replace(")", " / 0.06)")}`,
        borderColor: `${PRIMARY.replace(")", " / 0.25)")}`,
      }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3"
        style={{ color: PRIMARY }}
      >
        This Week&apos;s Focus
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
        {furthestBehind.name}
      </h3>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-3xl font-black" style={{ color: WARNING }}>
          {furthestBehind.value}{furthestBehind.unit.startsWith("%") ? "%" : ""}
        </span>
        <span className="text-[13px] text-[var(--text-muted)]">
          of {furthestBehind.target}{furthestBehind.unit.startsWith("%") ? "%" : ""} target
        </span>
        <span
          className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${DANGER.replace(")", " / 0.12)")}`, color: DANGER }}
        >
          {gapPct}% below target
        </span>
      </div>
      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-3">
        {furthestBehind.whatItPredicts}
      </p>
      <div className="flex items-center gap-2 text-[12px]" style={{ color: PRIMARY }}>
        <Eye className="w-3.5 h-3.5" />
        <span>
          Predictive strength:{" "}
          <span className="font-semibold capitalize">{furthestBehind.predictiveStrength}</span>
          {" "}· Optimize this to move VDV toward {VDV_TARGET}%
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function NorthStarDashboardPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Executive"
          title="North Star Dashboard"
          subtitle="HoopsIQ · 7 metrics that matter · Updated weekly"
          actions={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {}}
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          }
        />

        {/* Context line */}
        <p className="text-[13px] text-[var(--text-muted)] -mt-4 max-w-2xl leading-relaxed border-l-2 pl-4" style={{ borderColor: `${PRIMARY.replace(")", " / 0.40)")}` }}>
          These seven numbers represent HoopsIQ's theory of value creation.
          VDV is the output. The six metrics below it are the operating conditions
          that make VDV possible at scale.
        </p>

        {/* 7 Metric cards — 2-col desktop grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {METRICS.map((metric) => (
            <div
              key={metric.id}
              className={metric.id === 1 ? "md:col-span-2" : undefined}
            >
              <MetricCard metric={metric} />
            </div>
          ))}
        </div>

        {/* Warning panel */}
        <WarningPanel />

        {/* Strategic context */}
        <ThisWeekFocus />

        {/* Footer note */}
        <div className="text-center text-[11px] text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
          Generated by HoopsIQ Product Intelligence · Data as of this week · Internal use only
        </div>
      </div>
    </AppShell>
  );
}
