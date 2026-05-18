/**
 * VDVCommandCenterPage — /app/analytics/vdv
 *
 * The primary internal product team dashboard for the North Star metric.
 * Verified Development Velocity in full operational detail.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  vdvTimeSeries,
  weeklyVitalSigns,
  programQualityScores,
  VDV_CURRENT,
  VDV_TARGET,
  VDV_YEAR1_TARGET,
  TOTAL_ACTIVE_PROGRAMS,
  TOTAL_ACTIVE_PLAYERS,
  type WeeklyVitalSign,
  type ProgramQualityScore,
  type VDVDataPoint,
} from "@/features/analytics/kpi";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Section 1 — VDV Hero Gauge                                                  */
/* -------------------------------------------------------------------------- */

function VDVHeroGauge() {
  const pct = VDV_CURRENT;
  const fillWidth = `${pct}%`;

  // Color zones for progress bar
  function getZoneColor(pos: number): string {
    if (pos < VDV_YEAR1_TARGET) return DANGER;
    if (pos < 60) return WARNING;
    if (pos < VDV_TARGET) return SUCCESS;
    return PRIMARY;
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8 md:p-12 text-center">
      {/* Hero number */}
      <div
        className="font-black leading-none mb-3"
        style={{ fontSize: 72, color: PRIMARY, fontVariantNumeric: "tabular-nums" }}
      >
        {VDV_CURRENT}%
      </div>
      <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto mb-8 leading-relaxed">
        of active players in active programs are verifiably improving
      </p>

      {/* Progress bar with zone coloring */}
      <div className="max-w-xl mx-auto">
        <div className="relative h-4 rounded-full overflow-hidden bg-[var(--bg-base)] mb-3">
          {/* Danger zone: 0–Year1 */}
          <div
            className="absolute top-0 left-0 h-full rounded-l-full"
            style={{ width: `${VDV_YEAR1_TARGET}%`, background: DANGER, opacity: 0.25 }}
          />
          {/* Warning zone: Year1–60 */}
          <div
            className="absolute top-0 h-full"
            style={{ left: `${VDV_YEAR1_TARGET}%`, width: `${60 - VDV_YEAR1_TARGET}%`, background: WARNING, opacity: 0.25 }}
          />
          {/* Success zone: 60–75 */}
          <div
            className="absolute top-0 h-full"
            style={{ left: "60%", width: `${VDV_TARGET - 60}%`, background: SUCCESS, opacity: 0.25 }}
          />
          {/* Primary zone: 75–100 */}
          <div
            className="absolute top-0 h-full rounded-r-full"
            style={{ left: `${VDV_TARGET}%`, width: `${100 - VDV_TARGET}%`, background: PRIMARY, opacity: 0.25 }}
          />
          {/* Active fill */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
            style={{ width: fillWidth, background: getZoneColor(pct) }}
          />
          {/* Current marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-700"
            style={{ left: fillWidth, background: getZoneColor(pct) }}
          />
        </div>

        {/* Markers */}
        <div className="relative h-6 text-[11px] text-[var(--text-muted)]">
          {/* Year 1 target marker */}
          <div
            className="absolute -translate-x-1/2 text-center"
            style={{ left: `${VDV_YEAR1_TARGET}%` }}
          >
            <div className="w-px h-2 bg-[var(--border)] mx-auto mb-0.5" />
            <span style={{ color: DANGER }}>Yr 1 ({VDV_YEAR1_TARGET}%)</span>
          </div>
          {/* Current marker label */}
          <div
            className="absolute -translate-x-1/2 text-center font-semibold"
            style={{ left: `${VDV_CURRENT}%`, color: SUCCESS }}
          >
            <div className="w-px h-2 bg-current mx-auto mb-0.5" />
            Now ({VDV_CURRENT}%)
          </div>
          {/* Category leader marker */}
          <div
            className="absolute -translate-x-1/2 text-center"
            style={{ left: `${VDV_TARGET}%` }}
          >
            <div className="w-px h-2 bg-[var(--border)] mx-auto mb-0.5" />
            <span style={{ color: PRIMARY }}>Leader ({VDV_TARGET}%)</span>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-[var(--border)]">
        <div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{TOTAL_ACTIVE_PROGRAMS}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Active Programs</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{TOTAL_ACTIVE_PLAYERS.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Active Players</div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: SUCCESS }}>+4.2pp</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">vs. Last Month</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 2 — VDV 16-Week Trend Line Chart                                    */
/* -------------------------------------------------------------------------- */

function VDVTrendChart({ data }: { data: VDVDataPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    point: VDVDataPoint;
  } | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const PADDING = { top: 24, right: 24, bottom: 40, left: 40 };
  const WIDTH = 800;
  const HEIGHT = 200;
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const minVDV = 0;
  const maxVDV = 100;

  function xPos(i: number) {
    return PADDING.left + (i / (data.length - 1)) * chartW;
  }

  function yPos(v: number) {
    return PADDING.top + chartH - ((v - minVDV) / (maxVDV - minVDV)) * chartH;
  }

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(d.vdv)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L${xPos(data.length - 1)},${PADDING.top + chartH} L${xPos(0)},${PADDING.top + chartH} Z`;

  // Measure path length for dash animation
  const pathLen = 900; // approximate

  // Y-axis grid lines
  const gridLines = [0, 25, 45, 60, 75, 100];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 relative">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">VDV — 16-Week Trend</h2>
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ minWidth: 480, height: HEIGHT }}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="vdvArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.18" />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((v) => {
            const y = yPos(v);
            const isDashed = v === VDV_YEAR1_TARGET || v === VDV_TARGET;
            const color =
              v === VDV_YEAR1_TARGET
                ? DANGER
                : v === VDV_TARGET
                ? SUCCESS
                : "oklch(0.35 0.005 260)";
            return (
              <g key={v}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + chartW}
                  y2={y}
                  stroke={color}
                  strokeWidth={isDashed ? 1.5 : 0.5}
                  strokeDasharray={isDashed ? "6 4" : undefined}
                  opacity={isDashed ? 0.8 : 0.4}
                />
                <text
                  x={PADDING.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill="oklch(0.55 0.02 260)"
                >
                  {v}%
                </text>
                {isDashed && (
                  <text
                    x={PADDING.left + chartW + 4}
                    y={y + 4}
                    fontSize={8.5}
                    fill={color}
                  >
                    {v === VDV_YEAR1_TARGET ? "Yr1 target" : "Leader"}
                  </text>
                )}
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#vdvArea)" />

          {/* Main line — animated via stroke-dashoffset */}
          <path
            d={linePath}
            fill="none"
            stroke={PRIMARY}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={animated ? "none" : pathLen}
            strokeDashoffset={animated ? 0 : pathLen}
            style={{
              transition: animated ? "stroke-dashoffset 1.2s ease-in-out" : undefined,
            }}
          />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xPos(i)}
              cy={yPos(d.vdv)}
              r={4}
              fill={PRIMARY}
              stroke="var(--bg-surface, #1a1a2e)"
              strokeWidth={2}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const svg = svgRef.current;
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const scaleX = rect.width / WIDTH;
                const scaleY = rect.height / HEIGHT;
                setTooltip({
                  x: xPos(i) * scaleX,
                  y: yPos(d.vdv) * scaleY,
                  point: d,
                });
              }}
            />
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => {
            if (i % 2 !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={xPos(i)}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize={9}
                fill="oklch(0.55 0.02 260)"
              >
                {d.week}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3 py-2 shadow-xl text-xs"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 40,
              transform: "translateY(-50%)",
            }}
          >
            <div className="font-semibold text-[var(--text-primary)] mb-1">{tooltip.point.week}</div>
            <div style={{ color: PRIMARY }}>VDV: {tooltip.point.vdv}%</div>
            <div className="text-[var(--text-muted)]">{tooltip.point.activePrograms} programs</div>
            <div className="text-[var(--text-muted)]">{tooltip.point.activePlayers.toLocaleString()} players</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 3 — VDV by Program Segment                                          */
/* -------------------------------------------------------------------------- */

type SegmentBar = { label: string; value: number };

function HorizontalBarGroup({
  title,
  bars,
  icon,
}: {
  title: string;
  bars: SegmentBar[];
  icon: React.ReactNode;
}) {
  const max = 100;
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[var(--text-muted)]">{icon}</span>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="space-y-3">
        {bars.map((bar) => {
          const color =
            bar.value >= VDV_TARGET
              ? PRIMARY
              : bar.value >= 60
              ? SUCCESS
              : bar.value >= VDV_YEAR1_TARGET
              ? WARNING
              : DANGER;
          return (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[var(--text-muted)]">{bar.label}</span>
                <span className="text-[12px] font-semibold" style={{ color }}>
                  {bar.value}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(bar.value / max) * 100}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VDVBySegment() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HorizontalBarGroup
        title="By Program Size"
        icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="8" width="3" height="5" rx="0.5" fill="currentColor" opacity="0.5"/><rect x="5.5" y="5" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.7"/><rect x="10" y="2" width="3" height="11" rx="0.5" fill="currentColor"/></svg>}
        bars={[
          { label: "1–3 Teams", value: 58 },
          { label: "4–10 Teams", value: 64 },
          { label: "10+ Teams", value: 67 },
        ]}
      />
      <HorizontalBarGroup
        title="By Team Tier"
        icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="7,1 8.8,5.2 13.3,5.5 10,8.5 11,13 7,10.5 3,13 4,8.5 0.7,5.5 5.2,5.2" fill="currentColor" opacity="0.7"/></svg>}
        bars={[
          { label: "Premier", value: 71 },
          { label: "Gold", value: 59 },
          { label: "Silver", value: 48 },
        ]}
      />
      <HorizontalBarGroup
        title="By Region"
        icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg>}
        bars={[
          { label: "Northeast", value: 63 },
          { label: "Southeast", value: 57 },
          { label: "Midwest", value: 60 },
          { label: "West", value: 65 },
        ]}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 4 — Assessment Cadence Heatmap                                      */
/* -------------------------------------------------------------------------- */

type HeatmapProgram = {
  name: string;
  counts: number[]; // 12 weeks
  avgPerWeek: number;
  isGoingCold: boolean;
};

function buildHeatmapData(programs: ProgramQualityScore[]): HeatmapProgram[] {
  // Generate plausible 12-week assessment counts per program
  const seed = (progIdx: number, week: number) => {
    const base = programs[progIdx].assessmentDensity / 100;
    const noise = Math.sin(progIdx * 7 + week * 3) * 0.3 + Math.cos(progIdx + week) * 0.2;
    const raw = Math.round((base + noise) * 6);
    // Programs going cold (red status) — last 3 weeks drop to 0
    if (programs[progIdx].status === "red" && week >= 9) return 0;
    return Math.max(0, Math.min(8, raw));
  };

  return programs
    .map((p, pi) => {
      const counts = Array.from({ length: 12 }, (_, wi) => seed(pi, wi));
      const lastThree = counts.slice(9);
      const isGoingCold = lastThree.every((c) => c === 0) && counts.slice(0, 9).some((c) => c > 0);
      const avgPerWeek = counts.reduce((a, b) => a + b, 0) / 12;
      return { name: p.programName, counts, avgPerWeek, isGoingCold };
    })
    .sort((a, b) => b.avgPerWeek - a.avgPerWeek);
}

function cellColor(count: number): string {
  if (count === 0) return "bg-[var(--bg-base)]";
  if (count === 1) return "";
  if (count <= 3) return "";
  return "";
}

function cellStyle(count: number): React.CSSProperties {
  if (count === 0) return { background: "oklch(0.18 0.005 260)" };
  if (count === 1) return { background: `${PRIMARY.replace(")", " / 0.20)")}` };
  if (count <= 3) return { background: `${PRIMARY.replace(")", " / 0.50)")}` };
  return { background: PRIMARY };
}

function AssessmentHeatmap() {
  const heatData = buildHeatmapData(programQualityScores);
  const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Assessment Cadence by Program
        </h2>
        <span className="text-xs text-[var(--text-muted)]">Last 12 weeks</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 text-[11px] text-[var(--text-muted)]">
        <span>Assessments / week:</span>
        {[0, 1, 2, 4].map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded"
              style={cellStyle(v)}
            />
            <span>{v === 0 ? "None" : v === 1 ? "1" : v === 2 ? "2–3" : "4+"}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-1 h-4 rounded" style={{ background: DANGER }} />
          <span style={{ color: DANGER }}>Going cold</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 580 }}>
          {/* Week headers */}
          <div className="flex mb-1.5 pl-44">
            {weeks.map((w) => (
              <div
                key={w}
                className="flex-1 text-center text-[10px] text-[var(--text-muted)]"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Program rows */}
          <div className="space-y-1">
            {heatData.map((prog) => (
              <div
                key={prog.name}
                className="flex items-center gap-0"
                style={
                  prog.isGoingCold
                    ? { borderLeft: `3px solid ${DANGER}`, paddingLeft: 4 }
                    : { paddingLeft: 7 }
                }
              >
                {/* Program name */}
                <div className="w-40 shrink-0 text-[11px] text-[var(--text-muted)] truncate pr-3">
                  {prog.name.split(" – ")[0]}
                </div>
                {/* Heat cells */}
                <div className="flex flex-1 gap-0.5">
                  {prog.counts.map((count, wi) => (
                    <div
                      key={wi}
                      className="flex-1 h-5 rounded cursor-default group relative"
                      style={cellStyle(count)}
                      title={`${prog.name} · ${weeks[wi]}: ${count} assessments`}
                    >
                      {count > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Avg */}
                <div className="w-10 text-right text-[10px] text-[var(--text-muted)] pl-2">
                  {prog.avgPerWeek.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 5 — Vital Signs Grid                                                */
/* -------------------------------------------------------------------------- */

function VitalSignCard({ vs }: { vs: WeeklyVitalSign }) {
  const delta = vs.current - vs.prior;
  const up = vs.trend === "up";
  const down = vs.trend === "down";
  const goodness = vs.isGood(vs.trend);

  const trendColor = vs.trend === "flat"
    ? "oklch(0.55 0.02 260)"
    : goodness
    ? SUCCESS
    : DANGER;

  const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
      <div className="text-[11px] text-[var(--text-muted)] mb-2 leading-tight">{vs.label}</div>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-2xl font-bold text-[var(--text-primary)] leading-none">
          {vs.current}
        </span>
        <span className="text-[11px] text-[var(--text-muted)] mb-0.5">{vs.unit}</span>
      </div>
      <div className="flex items-center gap-1">
        <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
        <span className="text-[11px] font-medium" style={{ color: trendColor }}>
          {delta > 0 ? "+" : ""}{typeof delta === "number" && !Number.isInteger(delta) ? delta.toFixed(1) : delta}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">vs last week</span>
      </div>
    </div>
  );
}

function VitalSigns() {
  return (
    <div>
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Weekly Vital Signs</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {weeklyVitalSigns.map((vs) => (
          <VitalSignCard key={vs.label} vs={vs} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function VDVCommandCenterPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Product Intelligence"
          title="VDV Command Center"
          subtitle="Verified Development Velocity — the metric that drives everything"
          actions={
            <>
              <select className="text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] rounded-lg px-3 py-2 cursor-pointer">
                <option>Last 16 weeks</option>
                <option>Last 8 weeks</option>
                <option>Last 4 weeks</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {}}
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </>
          }
        />

        {/* S1 — Hero gauge */}
        <VDVHeroGauge />

        {/* S2 — Trend chart */}
        <VDVTrendChart data={vdvTimeSeries} />

        {/* S3 — By segment */}
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">VDV by Program Segment</h2>
          <VDVBySegment />
        </div>

        {/* S4 — Heatmap */}
        <AssessmentHeatmap />

        {/* S5 — Vital signs */}
        <VitalSigns />
      </div>
    </AppShell>
  );
}
