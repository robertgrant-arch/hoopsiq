import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowUpDown,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  type BenchmarkReport,
  type SkillCategory,
  type PlayerBenchmarkGap,
  sampleBenchmarkReports,
  SKILL_LABELS,
  SKILL_ICONS,
} from "@/features/benchmarks/mock";

/* -------------------------------------------------------------------------- */
/* Color helpers                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY   = "oklch(0.72 0.18 290)";
const SUCCESS   = "oklch(0.75 0.12 140)";
const WARNING   = "oklch(0.78 0.16 75)";
const DANGER    = "oklch(0.68 0.22 25)";
const MUTED     = "oklch(0.55 0.02 260)";

function priorityColor(priority: PlayerBenchmarkGap["priority"]): string {
  switch (priority) {
    case "critical": return DANGER;
    case "high":     return WARNING;
    case "moderate": return PRIMARY;
    default:         return SUCCESS;
  }
}

function gapScoreColor(score: number): string {
  if (score <= 0.5) return SUCCESS;
  if (score <= 1.5) return WARNING;
  return DANGER;
}

/* -------------------------------------------------------------------------- */
/* Level dots component                                                        */
/* -------------------------------------------------------------------------- */

function LevelDots({
  current,
  target,
  max = 5,
}: {
  current: number;
  target: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const filled   = n <= current;
        const isTarget = n > current && n <= target;
        return (
          <div
            key={n}
            className="w-3 h-3 rounded-full border transition-all"
            style={{
              background: filled
                ? PRIMARY
                : isTarget
                ? "transparent"
                : "oklch(0.25 0.01 260)",
              borderColor: filled
                ? PRIMARY
                : isTarget
                ? PRIMARY
                : "oklch(0.30 0.01 260)",
              opacity: isTarget ? 0.5 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gap label                                                                   */
/* -------------------------------------------------------------------------- */

function GapBadge({ gap, priority }: { gap: number; priority: PlayerBenchmarkGap["priority"] }) {
  if (gap <= 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}
      >
        <CheckCircle2 className="w-3 h-3" />
        On track
      </span>
    );
  }
  const label = gap === 1 ? "+1 needed" : `+${gap} critical`;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: `${priorityColor(priority).replace(")", " / 0.15)")}`,
        color: priorityColor(priority),
      }}
    >
      {priority !== "moderate" && <AlertTriangle className="w-3 h-3" />}
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Gap Analysis Grid Card                                                      */
/* -------------------------------------------------------------------------- */

function SkillGapCard({ gap }: { gap: PlayerBenchmarkGap }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{SKILL_ICONS[gap.skill]}</span>
          <span className="text-[13px] font-semibold">{SKILL_LABELS[gap.skill]}</span>
        </div>
        <GapBadge gap={gap.gap} priority={gap.priority} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Current</span>
          <span className="text-[12px] font-semibold" style={{ color: PRIMARY }}>
            {gap.currentLevel} / 5
          </span>
        </div>
        <LevelDots current={gap.currentLevel} target={gap.targetLevel} />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted-foreground">Target for age / position</span>
          <span className="text-[11px]" style={{ color: MUTED }}>
            {gap.targetLevel} / 5
          </span>
        </div>
      </div>

      {gap.gap > 0 && (
        <p className="text-[11.5px] text-muted-foreground leading-relaxed border-t border-border pt-2">
          {gap.recommendation}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SVG Benchmark Bar Chart                                                     */
/* -------------------------------------------------------------------------- */

function BenchmarkBarChart({ gaps }: { gaps: PlayerBenchmarkGap[] }) {
  const BAR_H    = 28;
  const GAP_Y    = 8;
  const LABEL_W  = 112;
  const VALUE_W  = 36;
  const CHART_W  = 260;
  const MAX_VAL  = 5;
  const ROW_H    = BAR_H + GAP_Y;
  const HEIGHT   = gaps.length * ROW_H + 4;
  const TOTAL_W  = LABEL_W + CHART_W + VALUE_W + 16;

  return (
    <svg
      viewBox={`0 0 ${TOTAL_W} ${HEIGHT}`}
      width="100%"
      className="overflow-visible"
      aria-label="Benchmark comparison chart"
    >
      {gaps.map((g, i) => {
        const y         = i * ROW_H;
        const currentW  = Math.max(4, (g.currentLevel / MAX_VAL) * CHART_W);
        const targetW   = (g.targetLevel / MAX_VAL) * CHART_W;
        const isAhead   = g.currentLevel >= g.targetLevel;

        return (
          <g key={g.skill} transform={`translate(0, ${y})`}>
            {/* Skill label */}
            <text
              x={LABEL_W - 8}
              y={BAR_H / 2 + 1}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="oklch(0.65 0.02 260)"
              fontFamily="inherit"
            >
              {SKILL_ICONS[g.skill]} {SKILL_LABELS[g.skill]}
            </text>

            {/* Track background */}
            <rect
              x={LABEL_W}
              y={4}
              width={CHART_W}
              height={BAR_H - 8}
              rx={4}
              fill="oklch(0.20 0.01 260)"
            />

            {/* Current bar */}
            <rect
              x={LABEL_W}
              y={4}
              width={currentW}
              height={BAR_H - 8}
              rx={4}
              fill={isAhead ? SUCCESS : PRIMARY}
              opacity={0.85}
            />

            {/* Target dashed outline */}
            {!isAhead && (
              <rect
                x={LABEL_W}
                y={4}
                width={targetW}
                height={BAR_H - 8}
                rx={4}
                fill="none"
                stroke={WARNING}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                opacity={0.6}
              />
            )}

            {/* Target tick */}
            {!isAhead && (
              <line
                x1={LABEL_W + targetW}
                y1={2}
                x2={LABEL_W + targetW}
                y2={BAR_H - 2}
                stroke={WARNING}
                strokeWidth={1.5}
                opacity={0.7}
              />
            )}

            {/* Value labels */}
            <text
              x={LABEL_W + CHART_W + 8}
              y={BAR_H / 2 + 1}
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={600}
              fill={isAhead ? SUCCESS : PRIMARY}
              fontFamily="inherit"
            >
              {g.currentLevel}
            </text>
            {!isAhead && (
              <text
                x={LABEL_W + CHART_W + 22}
                y={BAR_H / 2 + 1}
                dominantBaseline="middle"
                fontSize={10}
                fill={WARNING}
                fontFamily="inherit"
              >
                /{g.targetLevel}
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${LABEL_W}, ${HEIGHT - 2})`}>
        <rect x={0} y={0} width={10} height={4} rx={2} fill={PRIMARY} opacity={0.85} />
        <text x={14} y={2} dominantBaseline="middle" fontSize={9} fill="oklch(0.50 0.02 260)" fontFamily="inherit">
          Current
        </text>
        <rect x={56} y={0} width={10} height={4} rx={2} fill="none" stroke={WARNING} strokeWidth={1} strokeDasharray="3 2" />
        <text x={70} y={2} dominantBaseline="middle" fontSize={9} fill="oklch(0.50 0.02 260)" fontFamily="inherit">
          Target
        </text>
        <rect x={112} y={0} width={10} height={4} rx={2} fill={SUCCESS} opacity={0.85} />
        <text x={126} y={2} dominantBaseline="middle" fontSize={9} fill="oklch(0.50 0.02 260)" fontFamily="inherit">
          At / above benchmark
        </text>
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Overall gap ring                                                            */
/* -------------------------------------------------------------------------- */

function GapRing({ score }: { score: number }) {
  const color  = gapScoreColor(score);
  const R      = 28;
  const STROKE = 5;
  const CIRC   = 2 * Math.PI * R;
  const pct    = Math.min(score / 3, 1); // 3 = max meaningful gap
  const dash   = pct * CIRC;
  const label  = score <= 0.5 ? "On Track" : score <= 1.5 ? "Gaps" : "At Risk";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={70} height={70} viewBox="0 0 70 70">
        <circle
          cx={35} cy={35} r={R}
          fill="none"
          stroke="oklch(0.22 0.01 260)"
          strokeWidth={STROKE}
        />
        <circle
          cx={35} cy={35} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${CIRC}`}
          strokeLinecap="round"
          transform="rotate(-90 35 35)"
        />
        <text
          x={35} y={33}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fontWeight={700}
          fill={color}
          fontFamily="inherit"
        >
          {score.toFixed(1)}
        </text>
        <text
          x={35} y={46}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fill="oklch(0.55 0.02 260)"
          fontFamily="inherit"
        >
          avg gap
        </text>
      </svg>
      <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Program-wide table row status                                               */
/* -------------------------------------------------------------------------- */

function ProgramRowStatus({ score }: { score: number }) {
  if (score <= 0.5) {
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}
      >
        On Track
      </span>
    );
  }
  if (score <= 1.5) {
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `${WARNING.replace(")", " / 0.15)")}`, color: WARNING }}
      >
        1–2 Gaps
      </span>
    );
  }
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${DANGER.replace(")", " / 0.15)")}`, color: DANGER }}
    >
      2+ Critical
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function BenchmarkingPage() {
  const reports = sampleBenchmarkReports;

  const [selectedId, setSelectedId]   = useState<string>(reports[0].playerId);
  const [programView, setProgramView] = useState(false);
  const [sortDesc, setSortDesc]       = useState(true);

  const selected = useMemo(
    () => reports.find((r) => r.playerId === selectedId) ?? reports[0],
    [reports, selectedId],
  );

  const priorityGaps = useMemo(
    () =>
      [...selected.gaps]
        .filter((g) => g.gap > 0)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 3),
    [selected],
  );

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) =>
        sortDesc
          ? b.overallGapScore - a.overallGapScore
          : a.overallGapScore - b.overallGapScore,
      ),
    [reports, sortDesc],
  );

  return (
    <AppShell>
      <div className="px-5 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Benchmarking System"
          title="Player Benchmarks"
          subtitle="Compare each player against age-group and position standards. Identify gaps and launch development plans."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProgramView(false)}
                className="h-9 px-4 rounded-lg text-[13px] font-medium transition-all"
                style={
                  !programView
                    ? { background: PRIMARY, color: "oklch(0.98 0.005 260)" }
                    : { background: "oklch(0.22 0.01 260)", color: MUTED }
                }
              >
                Player View
              </button>
              <button
                onClick={() => setProgramView(true)}
                className="h-9 px-4 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5"
                style={
                  programView
                    ? { background: PRIMARY, color: "oklch(0.98 0.005 260)" }
                    : { background: "oklch(0.22 0.01 260)", color: MUTED }
                }
              >
                <Users className="w-3.5 h-3.5" />
                All Players
              </button>
            </div>
          }
        />

        {/* ── Program-wide table view ── */}
        {programView && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="text-[14px] font-semibold">Program Overview</h2>
              <button
                onClick={() => setSortDesc((d) => !d)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort by gap {sortDesc ? "↓" : "↑"}
              </button>
            </div>

            <div className="divide-y divide-border">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_80px_64px_100px_100px_80px] px-5 py-2.5 bg-muted/10">
                {["Player", "Age", "Pos", "Gap Score", "Top Priority", "Status"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {h}
                  </span>
                ))}
              </div>

              {sortedReports.map((r) => {
                const topGap = r.topPriority[0];
                const rowBg =
                  r.overallGapScore <= 0.5
                    ? `${SUCCESS.replace(")", " / 0.04)")}`
                    : r.overallGapScore <= 1.5
                    ? `${WARNING.replace(")", " / 0.04)")}`
                    : `${DANGER.replace(")", " / 0.05)")}`;

                return (
                  <button
                    key={r.playerId}
                    onClick={() => { setProgramView(false); setSelectedId(r.playerId); }}
                    className="w-full grid grid-cols-[1fr_80px_64px_100px_100px_80px] px-5 py-3 text-left hover:bg-muted/20 transition-colors"
                    style={{ background: rowBg }}
                  >
                    <span className="text-[13px] font-semibold">{r.playerName}</span>
                    <span className="text-[12px] text-muted-foreground self-center">{r.ageGroup}</span>
                    <span
                      className="text-[12px] font-mono font-bold self-center"
                      style={{ color: PRIMARY }}
                    >
                      {r.position}
                    </span>
                    <span
                      className="text-[14px] font-bold self-center"
                      style={{ color: gapScoreColor(r.overallGapScore) }}
                    >
                      {r.overallGapScore.toFixed(1)}
                    </span>
                    <span className="text-[11.5px] self-center text-muted-foreground">
                      {topGap ? `${SKILL_ICONS[topGap]} ${SKILL_LABELS[topGap]}` : "—"}
                    </span>
                    <span className="self-center">
                      <ProgramRowStatus score={r.overallGapScore} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Player detail view ── */}
        {!programView && (
          <div className="flex flex-col gap-6">
            {/* Player selector strip */}
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {reports.map((r) => {
                const active = r.playerId === selectedId;
                return (
                  <button
                    key={r.playerId}
                    onClick={() => setSelectedId(r.playerId)}
                    className="shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border transition-all"
                    style={
                      active
                        ? {
                            borderColor: PRIMARY,
                            background: `${PRIMARY.replace(")", " / 0.12)")}`,
                          }
                        : {
                            borderColor: "oklch(0.22 0.01 260)",
                            background: "oklch(0.14 0.005 260)",
                          }
                    }
                  >
                    <span
                      className="text-[13px] font-semibold whitespace-nowrap"
                      style={{ color: active ? PRIMARY : "oklch(0.75 0.02 260)" }}
                    >
                      {r.playerName}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: MUTED }}>
                      {r.position} · {r.ageGroup}
                    </span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: gapScoreColor(r.overallGapScore) }}
                    >
                      {r.overallGapScore.toFixed(1)} avg gap
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Report header */}
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-5 flex-wrap">
              <GapRing score={selected.overallGapScore} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-[0.12em] font-mono mb-0.5" style={{ color: MUTED }}>
                  {selected.position} · {selected.ageGroup} · Class of {selected.gradYear}
                </div>
                <h2 className="text-[22px] font-bold leading-tight">{selected.playerName}</h2>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                  {selected.strengths.length} skill{selected.strengths.length !== 1 ? "s" : ""} at or above benchmark
                  {" · "}
                  {selected.topPriority.length} priority area{selected.topPriority.length !== 1 ? "s" : ""} to address
                </p>
              </div>
              <Link href={`/app/coach/idp-generator?player=${selected.playerId}`} asChild>
                <a
                  className="shrink-0 h-9 px-4 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90"
                  style={{ background: PRIMARY, color: "oklch(0.98 0.005 260)" }}
                >
                  Build IDP
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </Link>
            </div>

            {/* Gap analysis grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: PRIMARY }} />
                <h3 className="text-[15px] font-semibold">Gap Analysis</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {SKILLS_ORDER.map((skill) => {
                  const gap = selected.gaps.find((g) => g.skill === skill);
                  if (!gap) return null;
                  return <SkillGapCard key={skill} gap={gap} />;
                })}
              </div>
            </div>

            {/* SVG Benchmark comparison chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold mb-4">Benchmark Comparison</h3>
              <div className="overflow-x-auto">
                <div style={{ minWidth: 420 }}>
                  <BenchmarkBarChart gaps={selected.gaps} />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                Solid bar = current level · Dashed outline = position / age-group benchmark
              </div>
            </div>

            {/* Top priority panel */}
            {priorityGaps.length > 0 && (
              <div className="rounded-xl border p-5" style={{ borderColor: `${DANGER.replace(")", " / 0.30)")}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" style={{ color: DANGER }} />
                  <h3 className="text-[15px] font-semibold">Focus These Areas This Season</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {priorityGaps.map((g, idx) => (
                    <div
                      key={g.skill}
                      className="flex items-start gap-4 p-4 rounded-lg"
                      style={{ background: "oklch(0.16 0.005 260)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5"
                        style={{
                          background: priorityColor(g.priority).replace(")", " / 0.15)"),
                          color: priorityColor(g.priority),
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-semibold">
                            {SKILL_ICONS[g.skill]} {SKILL_LABELS[g.skill]}
                          </span>
                          <GapBadge gap={g.gap} priority={g.priority} />
                        </div>
                        <p className="text-[12px] text-muted-foreground">{g.recommendation}</p>
                      </div>
                      <Link
                        href={`/app/coach/idp-generator?player=${selected.playerId}&skill=${g.skill}`} asChild>
                        <a
                          className="shrink-0 h-8 px-3 rounded-lg text-[12px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 whitespace-nowrap"
                          style={{ background: `${PRIMARY.replace(")", " / 0.14)")}`, color: PRIMARY }}
                        >
                          Start IDP
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths panel */}
            {selected.strengths.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} />
                  <h3 className="text-[15px] font-semibold">Strengths</h3>
                  <span className="text-[11px] text-muted-foreground">
                    — at or above benchmark
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.strengths.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                      style={{
                        background: `${SUCCESS.replace(")", " / 0.13)")}`,
                        color: SUCCESS,
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {SKILL_ICONS[skill]} {SKILL_LABELS[skill]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const SKILLS_ORDER: SkillCategory[] = [
  "ball_handling",
  "shooting",
  "finishing",
  "defense",
  "footwork",
  "iq_reads",
  "athleticism",
  "conditioning",
];
