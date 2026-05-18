/**
 * ClubAnalyticsPage — development velocity dashboard for program directors.
 *
 * Shows program health, age-group summaries, a sortable player velocity table,
 * skill group breakdowns, monthly trend sparklines, and at-risk alerts.
 */
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  X,
  ArrowRight,
  Activity,
  Users,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  programHealthCards,
  ageGroupSummaries,
  playerVelocity,
  skillGroupMetrics,
  monthlySnapshots,
  type PlayerVelocityRecord,
  type DevelopmentTrend,
} from "@/features/analytics/mock";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const BLUE    = "oklch(0.65 0.15 230)";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

type SortCol =
  | "playerName"
  | "skillVelocity"
  | "wodCompletionRate"
  | "filmObservations"
  | "attendanceRate"
  | "trend";

type SortDir = "asc" | "desc";

type ActiveFilter = "all" | "atRisk" | "improving" | "17U" | "15U" | "13U";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function trendColor(trend: DevelopmentTrend): string {
  switch (trend) {
    case "improving":  return SUCCESS;
    case "plateauing": return WARNING;
    case "declining":  return DANGER;
    case "new":        return BLUE;
  }
}

function trendLabel(trend: DevelopmentTrend): string {
  switch (trend) {
    case "improving":  return "Improving";
    case "plateauing": return "Plateauing";
    case "declining":  return "Declining";
    case "new":        return "New";
  }
}

function statusColor(status: "good" | "warning" | "critical" | "neutral"): string {
  switch (status) {
    case "good":     return SUCCESS;
    case "warning":  return WARNING;
    case "critical": return DANGER;
    case "neutral":  return "oklch(0.55 0.02 260)";
  }
}

/* -------------------------------------------------------------------------- */
/* SVG Sparkline                                                               */
/* -------------------------------------------------------------------------- */

function Sparkline({
  values,
  color,
  width = 120,
  height = 36,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padV = 4;
  const padH = 4;

  const points = values.map((v, i) => {
    const x = padH + (i / (values.length - 1)) * (width  - padH * 2);
    const y = (height - padV) - ((v - min) / range) * (height - padV * 2) + padV;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const lastX = padH + ((values.length - 1) / (values.length - 1)) * (width - padH * 2);
  const lastY = (height - padV) - ((values[values.length - 1] - min) / range) * (height - padV * 2) + padV;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
      <polyline
        points={points}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Program Health Strip                                                        */
/* -------------------------------------------------------------------------- */

function ProgramHealthStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      {programHealthCards.map((card) => {
        const color = statusColor(card.status);
        const trendUp = (card.trend ?? 0) > 0;
        const trendFlat = (card.trend ?? 0) === 0;

        return (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: color }}
              />
            </div>
            <div className="font-mono font-bold text-2xl leading-none" style={{ color }}>
              {card.value}
            </div>
            <div className="text-[11px] text-muted-foreground">{card.subtitle}</div>
            {card.trend !== undefined && (
              <div
                className="text-[11px] font-medium flex items-center gap-0.5"
                style={{
                  color: trendFlat
                    ? "oklch(0.55 0.02 260)"
                    : trendUp ? SUCCESS : DANGER,
                }}
              >
                {trendFlat ? (
                  <Minus className="w-3 h-3" />
                ) : trendUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trendFlat ? "No change" : `${trendUp ? "+" : ""}${card.trend}% vs last period`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Age Group Summary                                                           */
/* -------------------------------------------------------------------------- */

function AgeGroupSummaryStrip() {
  return (
    <div className="mb-6">
      <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-1.5">
        <Users className="w-4 h-4" /> Age Group Summary
      </h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {ageGroupSummaries.map((grp) => (
          <div
            key={grp.ageGroup}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[15px]">{grp.ageGroup}</span>
              <span className="text-[12px] text-muted-foreground">{grp.playerCount} players</span>
            </div>

            {/* Velocity bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Avg velocity</span>
                <span className="font-medium text-foreground">{(grp.avgVelocity * 100).toFixed(0)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${grp.avgVelocity * 100}%`, background: PRIMARY }}
                />
              </div>
            </div>

            {/* Completion */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Avg completion</span>
                <span className="font-medium text-foreground">{pct(grp.avgCompletion)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: pct(grp.avgCompletion), background: SUCCESS }}
                />
              </div>
            </div>

            {grp.atRiskCount > 0 && (
              <div
                className="text-[11px] font-semibold flex items-center gap-1"
                style={{ color: WARNING }}
              >
                <AlertTriangle className="w-3 h-3" />
                {grp.atRiskCount} at risk
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* At-Risk Alert Panel                                                         */
/* -------------------------------------------------------------------------- */

function AtRiskPanel({
  players,
  onViewPlayer,
}: {
  players: PlayerVelocityRecord[];
  onViewPlayer: (p: PlayerVelocityRecord) => void;
}) {
  if (players.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-4 mb-6"
      style={{
        borderColor: `${WARNING.replace(")", " / 0.35)")}`,
        background:  `${WARNING.replace(")", " / 0.06)")}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color: WARNING }} />
        <span className="font-semibold text-[13px]">
          {players.length} At-Risk Player{players.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2">
        {players.map((p) => (
          <div
            key={p.playerId}
            className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{ background: DANGER }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold">{p.playerName}</div>
              {p.riskReason && (
                <div className="text-[11px] text-muted-foreground mt-0.5">{p.riskReason}</div>
              )}
            </div>
            <button
              onClick={() => onViewPlayer(p)}
              className="shrink-0 text-[11px] font-medium flex items-center gap-0.5 transition-colors"
              style={{ color: PRIMARY }}
            >
              View <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Risk detail modal                                                           */
/* -------------------------------------------------------------------------- */

function RiskModal({
  player,
  onClose,
}: {
  player: PlayerVelocityRecord;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.6)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-border bg-card w-full max-w-md p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-bold text-[15px]">{player.playerName}</p>
            <p className="text-[12px] text-muted-foreground">{player.ageGroup} · {player.position} · {player.gradYear}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="rounded-xl border p-3 mb-4 text-[12px] flex items-start gap-2"
          style={{ borderColor: `${WARNING.replace(")", " / 0.35)")}`, background: `${WARNING.replace(")", " / 0.08)")}` }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: WARNING }} />
          <span>{player.riskReason}</span>
        </div>

        <div className="space-y-2">
          {[
            { label: "WOD Completion",  value: pct(player.wodCompletionRate), color: player.wodCompletionRate >= 0.8 ? SUCCESS : player.wodCompletionRate >= 0.5 ? WARNING : DANGER },
            { label: "Attendance",       value: pct(player.attendanceRate),    color: player.attendanceRate >= 0.85 ? SUCCESS : player.attendanceRate >= 0.70 ? WARNING : DANGER },
            { label: "Film Observations",value: String(player.filmObservations), color: player.filmObservations >= 8 ? SUCCESS : player.filmObservations >= 4 ? WARNING : DANGER },
            { label: "IDP On-Track",     value: `${player.idpOnTrack} / ${player.idpGoals}`, color: player.idpOnTrack === player.idpGoals ? SUCCESS : WARNING },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
              <span className="text-[12px] flex-1 text-muted-foreground">{row.label}</span>
              <span className="text-[12px] font-semibold" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Button size="sm" className="w-full" style={{ background: PRIMARY, color: "#fff" }}>
            Open Player Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Player velocity table                                                       */
/* -------------------------------------------------------------------------- */

function SortButton({
  col,
  active,
  dir,
  onClick,
  children,
}: {
  col: SortCol;
  active: SortCol;
  dir: SortDir;
  onClick: (c: SortCol) => void;
  children: React.ReactNode;
}) {
  const isActive = col === active;
  return (
    <button
      onClick={() => onClick(col)}
      className="flex items-center gap-0.5 text-left whitespace-nowrap text-[11px] uppercase tracking-wider transition-colors"
      style={{ color: isActive ? PRIMARY : "oklch(0.50 0.02 260)", fontWeight: isActive ? 600 : 400 }}
    >
      {children}
      {isActive ? (
        dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3 opacity-30" />
      )}
    </button>
  );
}

function PlayerVelocityTable({
  filter,
  onRiskClick,
}: {
  filter: ActiveFilter;
  onRiskClick: (p: PlayerVelocityRecord) => void;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("skillVelocity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(col: SortCol) {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const rows = useMemo(() => {
    let list = [...playerVelocity];

    // Apply filter
    if (filter === "atRisk")    list = list.filter((p) => p.atRisk);
    if (filter === "improving") list = list.filter((p) => p.trend === "improving");
    if (filter === "17U")       list = list.filter((p) => p.ageGroup === "17U");
    if (filter === "15U")       list = list.filter((p) => p.ageGroup === "15U");
    if (filter === "13U")       list = list.filter((p) => p.ageGroup === "13U");

    // Sort
    list.sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortCol) {
        case "playerName":       va = a.playerName;       vb = b.playerName; break;
        case "skillVelocity":    va = a.skillVelocity;    vb = b.skillVelocity; break;
        case "wodCompletionRate":va = a.wodCompletionRate;vb = b.wodCompletionRate; break;
        case "filmObservations": va = a.filmObservations; vb = b.filmObservations; break;
        case "attendanceRate":   va = a.attendanceRate;   vb = b.attendanceRate; break;
        case "trend":            va = a.trend;            vb = b.trend; break;
        default:                 va = a.skillVelocity;    vb = b.skillVelocity;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [filter, sortCol, sortDir]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-medium">
                <SortButton col="playerName" active={sortCol} dir={sortDir} onClick={handleSort}>Player</SortButton>
              </th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap text-[11px] uppercase tracking-wider text-muted-foreground">Age</th>
              <th className="text-left px-3 py-3 font-medium">
                <SortButton col="skillVelocity" active={sortCol} dir={sortDir} onClick={handleSort}>Velocity</SortButton>
              </th>
              <th className="text-left px-3 py-3 font-medium">
                <SortButton col="wodCompletionRate" active={sortCol} dir={sortDir} onClick={handleSort}>WOD %</SortButton>
              </th>
              <th className="text-left px-3 py-3 font-medium">
                <SortButton col="filmObservations" active={sortCol} dir={sortDir} onClick={handleSort}>Film</SortButton>
              </th>
              <th className="text-left px-3 py-3 font-medium">
                <SortButton col="attendanceRate" active={sortCol} dir={sortDir} onClick={handleSort}>Attend.</SortButton>
              </th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap text-[11px] uppercase tracking-wider text-muted-foreground">IDP</th>
              <th className="text-left px-3 py-3 font-medium">
                <SortButton col="trend" active={sortCol} dir={sortDir} onClick={handleSort}>Trend</SortButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.playerId}
                className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20"
                style={
                  p.atRisk
                    ? { borderLeft: `3px solid ${WARNING}` }
                    : undefined
                }
                onClick={p.atRisk ? () => onRiskClick(p) : undefined}
              >
                {/* Player */}
                <td className="px-4 py-3">
                  <div className="font-medium text-[13px]">{p.playerName}</div>
                  <div className="text-[10px] text-muted-foreground">{p.position} · {p.gradYear}</div>
                </td>

                {/* Age group */}
                <td className="px-3 py-3 text-muted-foreground">{p.ageGroup}</td>

                {/* Skill velocity mini-bar */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.skillVelocity * 100}%`, background: PRIMARY }}
                      />
                    </div>
                    <span className="text-[11px] font-mono">{(p.skillVelocity * 100).toFixed(0)}</span>
                  </div>
                </td>

                {/* WOD completion */}
                <td className="px-3 py-3">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: p.wodCompletionRate >= 0.8 ? SUCCESS : p.wodCompletionRate >= 0.6 ? WARNING : DANGER }}
                  >
                    {pct(p.wodCompletionRate)}
                  </span>
                </td>

                {/* Film */}
                <td className="px-3 py-3 font-mono text-muted-foreground">{p.filmObservations}</td>

                {/* Attendance */}
                <td className="px-3 py-3">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: p.attendanceRate >= 0.85 ? SUCCESS : p.attendanceRate >= 0.70 ? WARNING : DANGER }}
                  >
                    {pct(p.attendanceRate)}
                  </span>
                </td>

                {/* IDP */}
                <td className="px-3 py-3">
                  <span className="font-mono text-muted-foreground">{p.idpOnTrack}/{p.idpGoals}</span>
                </td>

                {/* Trend pill */}
                <td className="px-3 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      background: `${trendColor(p.trend).replace(")", " / 0.14)")}`,
                      color: trendColor(p.trend),
                    }}
                  >
                    {trendLabel(p.trend)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skill group breakdown                                                       */
/* -------------------------------------------------------------------------- */

function SkillGroupBreakdown() {
  return (
    <div className="mb-6">
      <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-1.5">
        <Activity className="w-4 h-4" /> Skill Group Breakdown
      </h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
        {skillGroupMetrics.map((sg) => {
          const total = sg.improving + sg.plateauing + sg.declining;
          const impW  = total > 0 ? (sg.improving  / total) * 100 : 0;
          const platW = total > 0 ? (sg.plateauing / total) * 100 : 0;
          const decW  = total > 0 ? (sg.declining  / total) * 100 : 0;

          return (
            <div key={sg.skill} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium">{sg.skill}</span>
                <span className="text-[12px] font-mono text-muted-foreground">
                  <span className="text-foreground font-semibold">{sg.avgLevel.toFixed(1)}</span>
                  <span> / 5.0</span>
                </span>
              </div>

              {/* Stacked bar */}
              <div className="h-2 rounded-full overflow-hidden flex gap-px">
                {impW > 0 && (
                  <div className="h-full" style={{ width: `${impW}%`, background: SUCCESS }} />
                )}
                {platW > 0 && (
                  <div className="h-full" style={{ width: `${platW}%`, background: WARNING }} />
                )}
                {decW > 0 && (
                  <div className="h-full" style={{ width: `${decW}%`, background: DANGER }} />
                )}
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: SUCCESS }} />
                  {sg.improving} improving
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: WARNING }} />
                  {sg.plateauing} plateauing
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: DANGER }} />
                  {sg.declining} declining
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Monthly trend sparklines                                                    */
/* -------------------------------------------------------------------------- */

function MonthlyTrendSparklines() {
  const metrics: {
    label: string;
    values: number[];
    color: string;
    unit?: string;
  }[] = [
    {
      label:  "WOD Completion %",
      values: monthlySnapshots.map((s) => s.wodCompletionRate),
      color:  SUCCESS,
      unit:   "%",
    },
    {
      label:  "Film Observations",
      values: monthlySnapshots.map((s) => s.filmObservations),
      color:  PRIMARY,
    },
    {
      label:  "Avg Readiness",
      values: monthlySnapshots.map((s) => s.avgReadiness),
      color:  BLUE,
    },
    {
      label:  "Active IDP Goals",
      values: monthlySnapshots.map((s) => s.activeIdpGoals),
      color:  WARNING,
    },
  ];

  const months = monthlySnapshots.map((s) => s.month);

  return (
    <div className="mb-6">
      <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4" /> 6-Month Trends
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {metrics.map((m) => {
          const current  = m.values[m.values.length - 1];
          const previous = m.values[m.values.length - 2];
          const delta    = current - previous;

          return (
            <div key={m.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{m.label}</p>
                  <p className="font-mono font-bold text-[20px] leading-none" style={{ color: m.color }}>
                    {current}{m.unit}
                  </p>
                </div>
                <span
                  className="text-[11px] font-medium flex items-center gap-0.5 mt-1"
                  style={{ color: delta > 0 ? SUCCESS : delta < 0 ? DANGER : "oklch(0.55 0.02 260)" }}
                >
                  {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {delta > 0 ? "+" : ""}{delta}{m.unit}
                </span>
              </div>

              <Sparkline values={m.values} color={m.color} width={200} height={40} />

              {/* Month labels */}
              <div className="flex justify-between mt-1">
                {months.map((mo) => (
                  <span key={mo} className="text-[9px] text-muted-foreground/50">{mo}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter tab strip                                                            */
/* -------------------------------------------------------------------------- */

function FilterStrip({
  active,
  onChange,
}: {
  active: ActiveFilter;
  onChange: (f: ActiveFilter) => void;
}) {
  const tabs: { value: ActiveFilter; label: string }[] = [
    { value: "all",      label: "All" },
    { value: "atRisk",   label: "At Risk" },
    { value: "improving",label: "Improving" },
    { value: "17U",      label: "17U" },
    { value: "15U",      label: "15U" },
    { value: "13U",      label: "13U" },
  ];

  return (
    <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap shrink-0 transition-all"
          style={
            active === t.value
              ? { background: `${PRIMARY.replace(")", " / 0.14)")}`, color: PRIMARY }
              : { color: "oklch(0.55 0.02 260)" }
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ClubAnalyticsPage() {
  const [activeFilter, setActiveFilter]         = useState<ActiveFilter>("all");
  const [selectedRiskPlayer, setSelectedRiskPlayer] = useState<PlayerVelocityRecord | null>(null);

  const atRiskPlayers = useMemo(
    () => playerVelocity.filter((p) => p.atRisk),
    []
  );

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        <PageHeader
          eyebrow="Club Analytics"
          title="Development Velocity"
          subtitle="Program-wide development metrics, skill velocity, and player health."
        />

        {/* Program health cards */}
        <ProgramHealthStrip />

        {/* At-risk alert panel */}
        <AtRiskPanel
          players={atRiskPlayers}
          onViewPlayer={(p) => setSelectedRiskPlayer(p)}
        />

        {/* Age group summary */}
        <AgeGroupSummaryStrip />

        {/* Player velocity table */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[13px] font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Player Velocity
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {playerVelocity.length} players · click at-risk rows for details
            </span>
          </div>
          <FilterStrip active={activeFilter} onChange={setActiveFilter} />
        </div>

        <PlayerVelocityTable
          filter={activeFilter}
          onRiskClick={(p) => setSelectedRiskPlayer(p)}
        />

        {/* Skill breakdown */}
        <SkillGroupBreakdown />

        {/* Trend sparklines */}
        <MonthlyTrendSparklines />
      </div>

      {/* Risk detail modal */}
      {selectedRiskPlayer && (
        <RiskModal
          player={selectedRiskPlayer}
          onClose={() => setSelectedRiskPlayer(null)}
        />
      )}
    </AppShell>
  );
}
