/**
 * ProgramAnalyticsV2Page — board-room analytics for club directors.
 *
 * Sections:
 *   1. Retention Intelligence — cohort retention, churn risk model, trend curve
 *   2. Cohort Analysis       — Fall 2025 vs Spring 2026 development outcomes (SVG bar chart)
 *   3. Outcome Correlations  — proof that the program works (stat comparison cards)
 *   4. Coach Performance     — table with drill-down, effectiveness score, color coding
 *   5. Program Health Trend  — 6-month sparklines for 4 key metrics
 *   6. Season-End Projection — trajectory forecast with vs-prior-season comparison
 */
import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Award,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Target,
  Film,
  Dumbbell,
  CheckCircle2,
  Activity,
  Star,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const BLUE    = "oklch(0.65 0.15 230)";
const TEAL    = "oklch(0.70 0.13 190)";

/* -------------------------------------------------------------------------- */
/* Inline mock data                                                            */
/* -------------------------------------------------------------------------- */

type CohortRetention = {
  ageGroup: "17U" | "15U" | "13U";
  rate: number;
  vsLastSeason: number;
  headcount: number;
};

type ChurnRiskPlayer = {
  id: string;
  name: string;
  ageGroup: string;
  churnProbability: number;
  signals: string[];
  lastActive: string;
};

type MonthlyRetentionPoint = { month: string; pct: number };

type CohortComparison = {
  metric: string;
  fall2025: number;
  spring2026: number;
  unit: string;
  higherIsBetter: boolean;
};

type CorrelationStat = {
  id: string;
  metric: string;
  finding: string;
  sampleSize: number;
  seasons: number;
  icon: "wod" | "film" | "idp";
  strength: "strong" | "moderate";
};

type CoachRecord = {
  id: string;
  name: string;
  playersAssigned: number;
  observationsThisMonth: number;
  avgFilmResponseHours: number;
  idpReviewRate: number;
  atRiskInterventionRate: number;
  effectivenessScore: number;
  status: "green" | "yellow" | "red";
};

type CoachPlayer = { name: string; trend: "up" | "flat" | "down"; idpStatus: string };

const COHORT_RETENTION: CohortRetention[] = [
  { ageGroup: "17U", rate: 0.84, vsLastSeason: 0.05, headcount: 38 },
  { ageGroup: "15U", rate: 0.91, vsLastSeason: 0.09, headcount: 44 },
  { ageGroup: "13U", rate: 0.96, vsLastSeason: 0.07, headcount: 31 },
];

const CHURN_RISK_PLAYERS: ChurnRiskPlayer[] = [
  {
    id: "cr1",
    name: "Marcus T.",
    ageGroup: "17U",
    churnProbability: 0.74,
    signals: ["No WOD in 18 days", "Film uploads dropped", "IDP not opened in 3 weeks"],
    lastActive: "May 3",
  },
  {
    id: "cr2",
    name: "Jaylen P.",
    ageGroup: "15U",
    churnProbability: 0.68,
    signals: ["Attendance below 40%", "No check-in streak broken", "Coach message unread 9 days"],
    lastActive: "May 7",
  },
  {
    id: "cr3",
    name: "DeShawn M.",
    ageGroup: "15U",
    churnProbability: 0.63,
    signals: ["Skill velocity plateau (6 weeks)", "No film submitted last 4 sessions"],
    lastActive: "May 10",
  },
];

const MONTHLY_RETENTION: MonthlyRetentionPoint[] = [
  { month: "Nov", pct: 100 },
  { month: "Dec", pct: 97 },
  { month: "Jan", pct: 94 },
  { month: "Feb", pct: 91 },
  { month: "Mar", pct: 89 },
  { month: "Apr", pct: 88 },
  { month: "May", pct: 88 },
];

const COHORT_COMPARISON: CohortComparison[] = [
  { metric: "Avg skill delta @ 90 days",    fall2025: 0.58, spring2026: 0.45, unit: "levels",   higherIsBetter: true },
  { metric: "WOD completion @ 30 days",     fall2025: 71,   spring2026: 64,   unit: "%",         higherIsBetter: true },
  { metric: "IDP goal completion rate",     fall2025: 67,   spring2026: 58,   unit: "%",         higherIsBetter: true },
];

const CORRELATION_STATS: CorrelationStat[] = [
  {
    id: "cs1",
    metric: "WOD Completion vs Skill Velocity",
    finding: "Players with >75% WOD completion improve 2.3× faster than those below 50% — the single strongest predictor of development velocity in the dataset.",
    sampleSize: 113,
    seasons: 3,
    icon: "wod",
    strength: "strong",
  },
  {
    id: "cs2",
    metric: "Film Submission vs Coach Observation Rate",
    finding: "Players who submit 2+ films/month receive 3.1× more coach observations and show 44% higher goal completion. Film drives coaching attention.",
    sampleSize: 89,
    seasons: 2,
    icon: "film",
    strength: "strong",
  },
  {
    id: "cs3",
    metric: "IDP On-Track vs Season Completion",
    finding: "Players rated 'on track' at mid-season complete 78% of their development goals; 'at-risk' players complete 31%. The 90-day IDP review is the critical intervention point.",
    sampleSize: 97,
    seasons: 3,
    icon: "idp",
    strength: "moderate",
  },
];

const COACHES: CoachRecord[] = [
  {
    id: "coach1",
    name: "Marcus Williams",
    playersAssigned: 18,
    observationsThisMonth: 47,
    avgFilmResponseHours: 14,
    idpReviewRate: 0.92,
    atRiskInterventionRate: 0.88,
    effectivenessScore: 91,
    status: "green",
  },
  {
    id: "coach2",
    name: "Terri Jackson",
    playersAssigned: 22,
    observationsThisMonth: 38,
    avgFilmResponseHours: 22,
    idpReviewRate: 0.84,
    atRiskInterventionRate: 0.76,
    effectivenessScore: 78,
    status: "green",
  },
  {
    id: "coach3",
    name: "Devon Reese",
    playersAssigned: 19,
    observationsThisMonth: 21,
    avgFilmResponseHours: 51,
    idpReviewRate: 0.58,
    atRiskInterventionRate: 0.50,
    effectivenessScore: 53,
    status: "yellow",
  },
  {
    id: "coach4",
    name: "Angela Diaz",
    playersAssigned: 16,
    observationsThisMonth: 9,
    avgFilmResponseHours: 84,
    idpReviewRate: 0.31,
    atRiskInterventionRate: 0.33,
    effectivenessScore: 28,
    status: "red",
  },
];

const COACH_PLAYERS: Record<string, CoachPlayer[]> = {
  coach1: [
    { name: "Malik Henderson",  trend: "up",   idpStatus: "On track" },
    { name: "Jordan Okafor",    trend: "up",   idpStatus: "On track" },
    { name: "Brandon Lee",      trend: "up",   idpStatus: "On track" },
    { name: "Darius Webb",      trend: "flat", idpStatus: "Behind" },
  ],
  coach2: [
    { name: "Tyrese Morgan",    trend: "up",   idpStatus: "On track" },
    { name: "Caleb Washington", trend: "flat", idpStatus: "On track" },
    { name: "Marcus T.",        trend: "down", idpStatus: "At risk" },
  ],
  coach3: [
    { name: "Jaylen P.",        trend: "down", idpStatus: "At risk" },
    { name: "Kofi Asante",      trend: "flat", idpStatus: "Behind" },
    { name: "DeShawn M.",       trend: "flat", idpStatus: "At risk" },
  ],
  coach4: [
    { name: "Elijah Ross",      trend: "flat", idpStatus: "Behind" },
    { name: "Nate Griffin",     trend: "down", idpStatus: "At risk" },
  ],
};

type SparklineMetric = {
  label: string;
  currentValue: string;
  unit: string;
  trend: "up" | "down";
  good: boolean; // up = good or down = good
  values: number[];
  color: string;
  icon: "skill" | "wod" | "risk" | "idp";
};

const SPARKLINE_METRICS: SparklineMetric[] = [
  {
    label: "Avg Skill Delta / Player",
    currentValue: "+0.52",
    unit: "levels",
    trend: "up",
    good: true,
    values: [0.31, 0.36, 0.38, 0.44, 0.48, 0.52],
    color: SUCCESS,
    icon: "skill",
  },
  {
    label: "WOD Completion Rate",
    currentValue: "73%",
    unit: "",
    trend: "up",
    good: true,
    values: [58, 62, 64, 68, 70, 73],
    color: PRIMARY,
    icon: "wod",
  },
  {
    label: "At-Risk Count",
    currentValue: "7",
    unit: "players",
    trend: "down",
    good: true,
    values: [14, 13, 12, 10, 9, 7],
    color: TEAL,
    icon: "risk",
  },
  {
    label: "IDP Goal Completion",
    currentValue: "61%",
    unit: "",
    trend: "up",
    good: true,
    values: [44, 48, 52, 55, 58, 61],
    color: WARNING,
    icon: "idp",
  },
];

type ProjectionItem = {
  label: string;
  projected: string;
  vsLastSeason: string;
  onTrack: boolean;
};

const PROJECTIONS: ProjectionItem[] = [
  { label: "Avg skill delta / player",  projected: "0.6 levels", vsLastSeason: "+0.05",  onTrack: true },
  { label: "IDP goal completion",       projected: "71%",        vsLastSeason: "+4pp",   onTrack: true },
  { label: "Season retention",          projected: "88%",        vsLastSeason: "+7pp",   onTrack: true },
  { label: "Film submissions",          projected: "340",        vsLastSeason: "+62",     onTrack: false },
];

/* -------------------------------------------------------------------------- */
/* SVG helpers                                                                 */
/* -------------------------------------------------------------------------- */

function Sparkline({
  values,
  color,
  width = 120,
  height = 40,
  fillOpacity = 0.12,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
  fillOpacity?: number;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padV = 4;
  const padH = 4;

  const pts = values.map((v, i) => {
    const x = padH + (i / (values.length - 1)) * (width - padH * 2);
    const y = (height - padV) - ((v - min) / range) * (height - padV * 2) + padV;
    return [x, y] as [number, number];
  });

  const pointsStr = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `M ${pts[0][0]},${height} ${pts.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} L ${pts[pts.length - 1][0]},${height} Z`;

  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
      <path d={areaPath} fill={color} fillOpacity={fillOpacity} />
      <polyline
        points={pointsStr}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="3" fill={color} />
    </svg>
  );
}

type GroupedBarProps = {
  data: CohortComparison[];
  width?: number;
  height?: number;
};

function GroupedBarChart({ data, width = 480, height = 180 }: GroupedBarProps) {
  const padLeft   = 60;
  const padRight  = 16;
  const padTop    = 16;
  const padBottom = 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Normalize each metric to 0-1 for consistent display
  const groups = data.map((d) => {
    const maxVal = Math.max(d.fall2025, d.spring2026) * 1.2;
    return {
      label: d.metric,
      fallPct: d.fall2025 / maxVal,
      springPct: d.spring2026 / maxVal,
      fallLabel: `${d.fall2025}${d.unit}`,
      springLabel: `${d.spring2026}${d.unit}`,
      higherIsBetter: d.higherIsBetter,
    };
  });

  const groupWidth = chartW / groups.length;
  const barWidth = Math.min(groupWidth * 0.28, 30);
  const barGap = 4;

  const fallColor   = PRIMARY;
  const springColor = TEAL;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      {/* Y axis label lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padTop + chartH * (1 - pct);
        return (
          <g key={pct}>
            <line
              x1={padLeft}
              y1={y}
              x2={padLeft + chartW}
              y2={y}
              stroke="oklch(0.55 0.02 260 / 0.12)"
              strokeWidth="1"
            />
          </g>
        );
      })}

      {/* Bars */}
      {groups.map((g, gi) => {
        const groupX = padLeft + gi * groupWidth + groupWidth / 2;
        const fallX  = groupX - barWidth - barGap / 2;
        const sprX   = groupX + barGap / 2;
        const fallH  = g.fallPct   * chartH;
        const sprH   = g.springPct * chartH;
        const fallY  = padTop + chartH - fallH;
        const sprY   = padTop + chartH - sprH;

        return (
          <g key={gi}>
            {/* Fall bar */}
            <rect
              x={fallX}
              y={fallY}
              width={barWidth}
              height={fallH}
              rx="3"
              fill={fallColor}
              fillOpacity="0.85"
            />
            <text
              x={fallX + barWidth / 2}
              y={fallY - 4}
              textAnchor="middle"
              fontSize="9"
              fill={fallColor}
              fontWeight="600"
            >
              {g.fallLabel}
            </text>

            {/* Spring bar */}
            <rect
              x={sprX}
              y={sprY}
              width={barWidth}
              height={sprH}
              rx="3"
              fill={springColor}
              fillOpacity="0.85"
            />
            <text
              x={sprX + barWidth / 2}
              y={sprY - 4}
              textAnchor="middle"
              fontSize="9"
              fill={springColor}
              fontWeight="600"
            >
              {g.springLabel}
            </text>

            {/* Group label */}
            <text
              x={groupX}
              y={padTop + chartH + 16}
              textAnchor="middle"
              fontSize="9"
              fill="oklch(0.55 0.02 260)"
            >
              {g.label.length > 18 ? g.label.slice(0, 16) + "…" : g.label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${padLeft}, ${height - 8})`}>
        <rect x={0} y={-6} width={10} height={10} rx="2" fill={fallColor} fillOpacity="0.85" />
        <text x={14} y={5} fontSize="9" fill={fallColor} fontWeight="600">Fall 2025</text>
        <rect x={70} y={-6} width={10} height={10} rx="2" fill={springColor} fillOpacity="0.85" />
        <text x={84} y={5} fontSize="9" fill={springColor} fontWeight="600">Spring 2026</text>
      </g>
    </svg>
  );
}

function RetentionCurve({ data }: { data: MonthlyRetentionPoint[] }) {
  const w = 480;
  const h = 120;
  const padL = 40;
  const padR = 16;
  const padT = 12;
  const padB = 28;
  const cW = w - padL - padR;
  const cH = h - padT - padB;

  const minV = 80;
  const maxV = 102;

  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * cW;
    const y = padT + cH - ((d.pct - minV) / (maxV - minV)) * cH;
    return [x, y] as [number, number];
  });

  const lineStr = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `M ${pts[0][0]},${padT + cH} ${pts.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} L ${pts[pts.length - 1][0]},${padT + cH} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      {/* Y grid */}
      {[85, 90, 95, 100].map((v) => {
        const y = padT + cH - ((v - minV) / (maxV - minV)) * cH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={padL + cW} y2={y} stroke="oklch(0.55 0.02 260 / 0.10)" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="oklch(0.55 0.02 260)">
              {v}%
            </text>
          </g>
        );
      })}

      {/* Area + line */}
      <path d={areaPath} fill={PRIMARY} fillOpacity="0.10" />
      <polyline points={lineStr} stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Dots + month labels */}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill={PRIMARY} />
          <text x={x} y={padT + cH + 16} textAnchor="middle" fontSize="9" fill="oklch(0.55 0.02 260)">
            {data[i].month}
          </text>
          <text x={x} y={y - 6} textAnchor="middle" fontSize="8" fill={PRIMARY} fontWeight="600">
            {data[i].pct}%
          </text>
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function statusColorForCoach(status: CoachRecord["status"]): string {
  switch (status) {
    case "green":  return SUCCESS;
    case "yellow": return WARNING;
    case "red":    return DANGER;
  }
}

function pct(n: number, decimals = 0): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

/* -------------------------------------------------------------------------- */
/* Section 1: Retention Intelligence                                           */
/* -------------------------------------------------------------------------- */

function RetentionIntelligence() {
  const [showChurnDetail, setShowChurnDetail] = useState(false);

  const overall =
    COHORT_RETENTION.reduce((sum, c) => sum + c.rate * c.headcount, 0) /
    COHORT_RETENTION.reduce((sum, c) => sum + c.headcount, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[16px] font-bold text-foreground">Retention Intelligence</h2>
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: `${SUCCESS}18`, color: SUCCESS }}
        >
          +7pp vs last season
        </span>
      </div>

      {/* Overall + by cohort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Overall */}
        <div className="rounded-xl border border-border bg-card p-4 sm:col-span-1">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Overall</div>
          <div className="text-[28px] font-bold font-mono leading-none" style={{ color: SUCCESS }}>
            {Math.round(overall * 100)}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Season retention</div>
          <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: SUCCESS }}>
            <TrendingUp className="w-3 h-3" />
            +7pp YoY
          </div>
        </div>

        {/* By cohort */}
        {COHORT_RETENTION.map((c) => (
          <div key={c.ageGroup} className="rounded-xl border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              {c.ageGroup} · {c.headcount} players
            </div>
            <div
              className="text-[26px] font-bold font-mono leading-none"
              style={{ color: c.rate >= 0.9 ? SUCCESS : c.rate >= 0.8 ? WARNING : DANGER }}
            >
              {Math.round(c.rate * 100)}%
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: SUCCESS }}>
              <TrendingUp className="w-3 h-3" />
              +{Math.round(c.vsLastSeason * 100)}pp YoY
            </div>
          </div>
        ))}
      </div>

      {/* WOD retention insight */}
      <div
        className="rounded-xl p-4 text-[13px] font-medium"
        style={{ background: `${SUCCESS}0C`, border: `1px solid ${SUCCESS}25` }}
      >
        <span style={{ color: SUCCESS }}>Program insight: </span>
        <span className="text-foreground">
          Players who complete 80%+ WODs retain at <strong>94%</strong> vs{" "}
          <strong>61%</strong> for those below 60% completion.
        </span>
        <span className="text-muted-foreground ml-1.5">Based on 113 players over 3 seasons.</span>
      </div>

      {/* Month-by-month curve */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-[13px] font-semibold text-foreground mb-3">Season Retention Curve</div>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 320 }}>
            <RetentionCurve data={MONTHLY_RETENTION} />
          </div>
        </div>
      </div>

      {/* Churn risk */}
      <div className="rounded-xl border border-border bg-card p-5">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowChurnDetail((v) => !v)}
          style={{ minHeight: 44 }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: DANGER }} />
            <span className="text-[14px] font-semibold text-foreground">
              Churn Risk — <span style={{ color: DANGER }}>{CHURN_RISK_PLAYERS.length} players above 60%</span>
            </span>
          </div>
          {showChurnDetail ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showChurnDetail && (
          <div className="mt-4 space-y-3">
            {CHURN_RISK_PLAYERS.map((p) => (
              <div
                key={p.id}
                className="rounded-lg p-3"
                style={{ background: `${DANGER}08`, border: `1px solid ${DANGER}20` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[13px] font-semibold text-foreground">{p.name}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">{p.ageGroup}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[12px] font-bold font-mono" style={{ color: DANGER }}>
                      {Math.round(p.churnProbability * 100)}% risk
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {p.signals.map((sig, i) => (
                    <span
                      key={i}
                      className="rounded-md px-2 py-0.5 text-[10px]"
                      style={{ background: `${DANGER}10`, color: DANGER }}
                    >
                      {sig}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-muted-foreground">Last active: {p.lastActive}</div>
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p.churnProbability * 100}%`, background: DANGER }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 2: Cohort Analysis                                                  */
/* -------------------------------------------------------------------------- */

function CohortAnalysis() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[16px] font-bold text-foreground">Cohort Analysis</h2>
        <span className="text-[13px] text-muted-foreground">Fall 2025 vs Spring 2026</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-[13px] font-semibold text-foreground mb-1">Development Outcomes by Cohort</div>
        <div className="text-[12px] text-muted-foreground mb-4">
          Comparing players at equivalent points in their first 90 days.
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: 340 }}>
            <GroupedBarChart data={COHORT_COMPARISON} />
          </div>
        </div>

        {/* Metric summary */}
        <div className="mt-4 space-y-2">
          {COHORT_COMPARISON.map((d) => {
            const diff = d.fall2025 - d.spring2026;
            const fallLeads = d.higherIsBetter ? diff > 0 : diff < 0;
            return (
              <div key={d.metric} className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">{d.metric}</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: PRIMARY }}>Fall: {d.fall2025}{d.unit}</span>
                  <span style={{ color: TEAL }}>Spring: {d.spring2026}{d.unit}</span>
                  {fallLeads && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${SUCCESS}14`, color: SUCCESS }}>
                      Fall leads
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key finding callout */}
      <div
        className="rounded-xl p-4"
        style={{ background: `${PRIMARY}0C`, border: `1px solid ${PRIMARY}25` }}
      >
        <div className="flex items-start gap-2">
          <Star className="w-4 h-4 shrink-0 mt-0.5" style={{ color: PRIMARY }} />
          <div>
            <div className="text-[13px] font-semibold text-foreground mb-0.5">Key finding</div>
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              Fall 2025 cohort shows <strong className="text-foreground">23% higher skill velocity</strong> at 90 days compared to Spring 2026.
              This may reflect a more structured onboarding program — or seasonal selection effects.
              Recommend reviewing the Spring 2026 onboarding sequence at the 30-day mark.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 3: Outcome Correlations                                             */
/* -------------------------------------------------------------------------- */

function OutcomeCorrelations() {
  const iconMap = {
    wod:  <Dumbbell className="w-4 h-4 shrink-0" />,
    film: <Film className="w-4 h-4 shrink-0" />,
    idp:  <Target className="w-4 h-4 shrink-0" />,
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />
        <h2 className="text-[16px] font-bold text-foreground">Development Outcome Correlations</h2>
      </div>

      <div className="text-[13px] text-muted-foreground">
        Proof that program engagement drives results — based on{" "}
        <strong className="text-foreground">113 players over 3 seasons</strong> of HoopsIQ data.
      </div>

      <div className="space-y-3">
        {CORRELATION_STATS.map((cs) => {
          const strengthColor = cs.strength === "strong" ? SUCCESS : WARNING;
          return (
            <div key={cs.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                >
                  {iconMap[cs.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[14px] font-semibold text-foreground">{cs.metric}</span>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${strengthColor}14`, color: strengthColor }}
                    >
                      {cs.strength} correlation
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{cs.finding}</p>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    Based on <strong className="text-foreground">{cs.sampleSize} players</strong> over{" "}
                    <strong className="text-foreground">{cs.seasons} seasons</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 4: Coach Performance                                                */
/* -------------------------------------------------------------------------- */

function CoachPerformance() {
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);

  type SortCol = "name" | "obs" | "film" | "idp" | "score";
  const [sortCol, setSortCol] = useState<SortCol>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const list = [...COACHES];
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortCol) {
      case "name":  list.sort((a, b) => dir * a.name.localeCompare(b.name)); break;
      case "obs":   list.sort((a, b) => dir * (a.observationsThisMonth - b.observationsThisMonth)); break;
      case "film":  list.sort((a, b) => dir * (a.avgFilmResponseHours - b.avgFilmResponseHours)); break;
      case "idp":   list.sort((a, b) => dir * (a.idpReviewRate - b.idpReviewRate)); break;
      case "score": list.sort((a, b) => dir * (a.effectivenessScore - b.effectivenessScore)); break;
    }
    return list;
  }, [sortCol, sortDir]);

  function SortHeader({ col, label }: { col: SortCol; label: string }) {
    const active = sortCol === col;
    return (
      <button
        onClick={() => handleSort(col)}
        className="flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors"
        style={{ color: active ? PRIMARY : "oklch(0.55 0.02 260)" }}
      >
        {label}
        {active ? (
          sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
        ) : null}
      </button>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[16px] font-bold text-foreground">Coach Performance</h2>
        <span className="text-[12px] text-muted-foreground">Director view · this month</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div
          className="grid gap-2 px-4 py-2.5 border-b border-border text-[11px]"
          style={{ gridTemplateColumns: "1fr 80px 80px 80px 80px 64px 32px" }}
        >
          <SortHeader col="name"  label="Coach" />
          <SortHeader col="obs"   label="Obs." />
          <SortHeader col="film"  label="Film RT" />
          <SortHeader col="idp"   label="IDP Rate" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">At-Risk</span>
          <SortHeader col="score" label="Score" />
          <span />
        </div>

        {/* Rows */}
        {sorted.map((coach) => {
          const sc = statusColorForCoach(coach.status);
          const isExpanded = expandedCoach === coach.id;
          const players = COACH_PLAYERS[coach.id] ?? [];

          return (
            <div key={coach.id} className="border-b border-border last:border-0">
              <button
                className="w-full grid gap-2 px-4 py-3 hover:bg-muted/40 transition-colors text-left items-center"
                style={{ gridTemplateColumns: "1fr 80px 80px 80px 80px 64px 32px", minHeight: 52 }}
                onClick={() => setExpandedCoach(isExpanded ? null : coach.id)}
              >
                {/* Name + status dot */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sc }} />
                  <span className="text-[13px] font-medium text-foreground truncate">{coach.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">({coach.playersAssigned})</span>
                </div>
                {/* Observations */}
                <div className="text-[13px] font-mono text-foreground">{coach.observationsThisMonth}</div>
                {/* Film response */}
                <div
                  className="text-[13px] font-mono"
                  style={{
                    color: coach.avgFilmResponseHours <= 24 ? SUCCESS : coach.avgFilmResponseHours <= 48 ? WARNING : DANGER,
                  }}
                >
                  {coach.avgFilmResponseHours}h
                </div>
                {/* IDP rate */}
                <div
                  className="text-[13px] font-mono"
                  style={{ color: coach.idpReviewRate >= 0.8 ? SUCCESS : coach.idpReviewRate >= 0.6 ? WARNING : DANGER }}
                >
                  {pct(coach.idpReviewRate)}
                </div>
                {/* At-risk */}
                <div
                  className="text-[13px] font-mono"
                  style={{ color: coach.atRiskInterventionRate >= 0.75 ? SUCCESS : coach.atRiskInterventionRate >= 0.55 ? WARNING : DANGER }}
                >
                  {pct(coach.atRiskInterventionRate)}
                </div>
                {/* Score */}
                <div
                  className="text-[14px] font-bold font-mono"
                  style={{ color: sc }}
                >
                  {coach.effectivenessScore}
                </div>
                {/* Expand toggle */}
                <div className="flex justify-end">
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded player detail */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 pt-1"
                  style={{ borderTop: "1px solid oklch(0.55 0.02 260 / 0.12)" }}
                >
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Player outcomes</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {players.map((pl, i) => {
                      const tColor = pl.trend === "up" ? SUCCESS : pl.trend === "down" ? DANGER : WARNING;
                      const statusC = pl.idpStatus === "On track" ? SUCCESS : pl.idpStatus === "At risk" ? DANGER : WARNING;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: "oklch(0.55 0.02 260 / 0.05)", border: "1px solid oklch(0.55 0.02 260 / 0.12)" }}
                        >
                          <span className="text-[12px] text-foreground">{pl.name}</span>
                          <div className="flex items-center gap-2">
                            {pl.trend === "up" ? (
                              <TrendingUp className="w-3 h-3" style={{ color: tColor }} />
                            ) : pl.trend === "down" ? (
                              <TrendingDown className="w-3 h-3" style={{ color: tColor }} />
                            ) : (
                              <span className="text-[11px]" style={{ color: tColor }}>—</span>
                            )}
                            <span
                              className="text-[10px] font-semibold rounded px-1.5 py-0.5"
                              style={{ background: `${statusC}14`, color: statusC }}
                            >
                              {pl.idpStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground px-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: SUCCESS }} />High performer</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: WARNING }} />Needs attention</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: DANGER }} />Lagging — intervention needed</span>
        <span className="ml-auto">Score = composite 0–100 · Film RT · Obs · IDP · At-risk response</span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 5: Program Health Trend                                             */
/* -------------------------------------------------------------------------- */

function ProgramHealthTrend() {
  const iconMap = {
    skill: <TrendingUp className="w-4 h-4" />,
    wod:   <Dumbbell className="w-4 h-4" />,
    risk:  <AlertTriangle className="w-4 h-4" />,
    idp:   <Target className="w-4 h-4" />,
  };

  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
          <h2 className="text-[16px] font-bold text-foreground">Program Health Trend</h2>
        </div>
        <span className="text-[12px] text-muted-foreground">6-month rolling</span>

        {/* Network benchmark badge */}
        <div
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold"
          style={{ background: `${SUCCESS}12`, color: SUCCESS, border: `1px solid ${SUCCESS}30` }}
        >
          <Star className="w-3 h-3" />
          Top quartile vs HoopsIQ network
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SPARKLINE_METRICS.map((m) => {
          const trendColor = m.good ? SUCCESS : DANGER;
          return (
            <div key={m.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-0.5" style={{ color: m.color }}>
                    {iconMap[m.icon]}
                  </div>
                  <div className="text-[12px] text-muted-foreground">{m.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-[24px] font-bold font-mono leading-none" style={{ color: m.color }}>
                    {m.currentValue}
                  </div>
                  {m.unit && <div className="text-[11px] text-muted-foreground">{m.unit}</div>}
                  <div className="flex items-center justify-end gap-1 mt-0.5" style={{ color: trendColor }}>
                    {m.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-[10px] font-semibold">
                      {m.trend === "up" ? "Trending up" : "Trending down"}{m.good ? " ✓" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <Sparkline values={m.values} color={m.color} width={280} height={48} />

              {/* Month labels */}
              <div className="flex justify-between mt-1 px-1">
                {months.map((mo) => (
                  <span key={mo} className="text-[9px] text-muted-foreground">{mo}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 6: Season-End Projection                                           */
/* -------------------------------------------------------------------------- */

function SeasonEndProjection() {
  const onTrackCount = PROJECTIONS.filter((p) => p.onTrack).length;
  const beatLastSeason = 3;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[16px] font-bold text-foreground">Season-End Projection</h2>
        <span className="text-[12px] text-muted-foreground">Spring 2026 · current trajectory</span>
      </div>

      {/* On-track banner */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: `${SUCCESS}0C`, border: `1px solid ${SUCCESS}25` }}
      >
        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: SUCCESS }} />
        <div>
          <div className="text-[13px] font-semibold" style={{ color: SUCCESS }}>
            On track to beat Fall 2025 in {beatLastSeason} of 4 metrics
          </div>
          <div className="text-[12px] text-muted-foreground">
            Film volume is the only metric projected below last season's pace.
          </div>
        </div>
      </div>

      {/* Projection cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PROJECTIONS.map((proj) => (
          <div
            key={proj.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 leading-tight">
              {proj.label}
            </div>
            <div
              className="text-[22px] font-bold font-mono leading-none mb-1"
              style={{ color: proj.onTrack ? SUCCESS : WARNING }}
            >
              {proj.projected}
            </div>
            <div
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: proj.onTrack ? SUCCESS : WARNING }}
            >
              {proj.onTrack ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {proj.vsLastSeason} vs Fall 2025
            </div>
          </div>
        ))}
      </div>

      {/* Assumptions note */}
      <div className="text-[11px] text-muted-foreground px-1">
        Projections based on current-season trajectory extrapolated to season end.
        Assumes consistent engagement patterns and no significant roster changes.
        Director review recommended before sharing externally.
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Main export                                                                 */
/* -------------------------------------------------------------------------- */

type PageSection = "retention" | "cohort" | "correlations" | "coaches" | "health" | "projection";

const SECTION_LABELS: { key: PageSection; label: string; short: string }[] = [
  { key: "retention",   label: "Retention",         short: "Retention" },
  { key: "cohort",      label: "Cohort Analysis",   short: "Cohorts" },
  { key: "correlations",label: "Correlations",      short: "Outcomes" },
  { key: "coaches",     label: "Coach Performance", short: "Coaches" },
  { key: "health",      label: "Health Trend",      short: "Trend" },
  { key: "projection",  label: "Projection",        short: "Projection" },
];

export default function ProgramAnalyticsV2Page() {
  const [activeSection, setActiveSection] = useState<PageSection>("retention");

  const sectionContent: Record<PageSection, React.ReactNode> = {
    retention:    <RetentionIntelligence />,
    cohort:       <CohortAnalysis />,
    correlations: <OutcomeCorrelations />,
    coaches:      <CoachPerformance />,
    health:       <ProgramHealthTrend />,
    projection:   <SeasonEndProjection />,
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          eyebrow="Program Analytics v2"
          title="Program Intelligence"
          subtitle="Retention analysis, cohort outcomes, and development correlations. Built for confident decision-making."
        />

        {/* Section nav */}
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-1">
          {SECTION_LABELS.map((s) => {
            const active = activeSection === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className="relative px-3 py-2 text-[12px] sm:text-[13px] font-medium transition-all"
                style={{
                  minHeight: 44,
                  color: active ? PRIMARY : "oklch(0.55 0.02 260)",
                }}
              >
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.short}</span>
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: PRIMARY }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Active section */}
        <div>{sectionContent[activeSection]}</div>

        {/* Quick-jump footer */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          <span className="text-[11px] text-muted-foreground self-center mr-2">Jump to:</span>
          {SECTION_LABELS.filter((s) => s.key !== activeSection).map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium border border-border hover:border-[oklch(0.72_0.18_290_/_0.4)] transition-all"
              style={{ minHeight: 36 }}
            >
              {s.short}
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
