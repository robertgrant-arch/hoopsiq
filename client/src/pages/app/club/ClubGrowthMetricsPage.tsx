/**
 * ClubGrowthMetricsPage — Club director's growth and expansion dashboard.
 * Route: /app/club/growth
 */
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

interface GrowthStat {
  label: string;
  current: number;
  prior: number;
  unit?: string;
}

const GROWTH_STATS: GrowthStat[] = [
  { label: "Total Teams",         current: 6,  prior: 4  },
  { label: "Rostered Athletes",   current: 89, prior: 71 },
  { label: "Active Coaches",      current: 14, prior: 11 },
  { label: "Families on Platform",current: 76, prior: 58 },
];

interface TeamHealth {
  name: string;
  athletes: number;
  coach: string;
  vdvPct: number;
  vdvSpark: number[];
  avgAssessment: number;
  filmRate: number;
  familyEng: number;
  healthScore: number;
}

const TEAM_HEALTH: TeamHealth[] = [
  {
    name: "17U Premier",
    athletes: 14,
    coach: "Coach Martinez",
    vdvPct: 79,
    vdvSpark: [62, 65, 68, 71, 73, 76, 77, 79],
    avgAssessment: 7.4,
    filmRate: 88,
    familyEng: 91,
    healthScore: 94,
  },
  {
    name: "16U Elite",
    athletes: 13,
    coach: "Coach Thompson",
    vdvPct: 71,
    vdvSpark: [55, 58, 62, 64, 66, 68, 70, 71],
    avgAssessment: 6.9,
    filmRate: 82,
    familyEng: 85,
    healthScore: 88,
  },
  {
    name: "18U Premier",
    athletes: 12,
    coach: "Coach Williams",
    vdvPct: 68,
    vdvSpark: [60, 62, 64, 65, 66, 67, 67, 68],
    avgAssessment: 7.1,
    filmRate: 79,
    familyEng: 78,
    healthScore: 85,
  },
  {
    name: "15U Gold",
    athletes: 15,
    coach: "Coach Davis",
    vdvPct: 63,
    vdvSpark: [48, 51, 54, 56, 58, 60, 62, 63],
    avgAssessment: 6.5,
    filmRate: 71,
    familyEng: 82,
    healthScore: 79,
  },
  {
    name: "16U Silver",
    athletes: 14,
    coach: "Coach Johnson",
    vdvPct: 54,
    vdvSpark: [42, 44, 47, 48, 50, 51, 53, 54],
    avgAssessment: 6.1,
    filmRate: 65,
    familyEng: 74,
    healthScore: 71,
  },
  {
    name: "14U Development",
    athletes: 21,
    coach: "Coach Brown",
    vdvPct: 41,
    vdvSpark: [38, 38, 39, 40, 39, 41, 40, 41],
    avgAssessment: 5.7,
    filmRate: 52,
    familyEng: 68,
    healthScore: 61,
  },
];

interface AgeGroup {
  label: string;
  current: number;
  retained: number;
  new_: number;
}

const AGE_PIPELINE: AgeGroup[] = [
  { label: "14U",  current: 21, retained: 0,  new_: 21 },
  { label: "15U",  current: 15, retained: 13, new_: 2  },
  { label: "16U",  current: 27, retained: 11, new_: 16 },
  { label: "17U",  current: 14, retained: 18, new_: -4 }, // some left
  { label: "18U",  current: 12, retained: 9,  new_: 3  },
];

interface RecruitingDivision {
  div: string;
  count: number;
  color: string;
}

const RECRUITING_DIVISIONS: RecruitingDivision[] = [
  { div: "D1",   count: 8,  color: PRIMARY  },
  { div: "D2",   count: 14, color: SUCCESS  },
  { div: "D3",   count: 9,  color: WARNING  },
  { div: "NAIA", count: 6,  color: "oklch(0.72 0.10 200)" },
  { div: "JUCO", count: 4,  color: "oklch(0.65 0.06 260)" },
];

const COMMITMENTS = [
  { player: "Marcus T.", school: "University of Illinois",   division: "D1",   year: 2027 },
  { player: "Jordan H.", school: "Butler University",        division: "D1",   year: 2026 },
  { player: "Devon A.",  school: "Ohio Valley University",   division: "D2",   year: 2027 },
];

const GRAD_YEAR_ACTIVITY = [
  { year: "2027", activity: 64, color: PRIMARY },
  { year: "2028", activity: 42, color: SUCCESS },
  { year: "2029", activity: 21, color: WARNING },
];

interface RadarDimension {
  label: string;
  yours: number;
  top25: number;
}

const RADAR_DIMS: RadarDimension[] = [
  { label: "VDV%",          yours: 72, top25: 81 },
  { label: "Family Eng",    yours: 80, top25: 74 },
  { label: "Film Density",  yours: 68, top25: 79 },
  { label: "Coach Activity",yours: 75, top25: 78 },
  { label: "Recruit Reach", yours: 85, top25: 80 },
  { label: "Form Compl",    yours: 88, top25: 82 },
  { label: "Assess Consist",yours: 71, top25: 84 },
  { label: "Player Reten",  yours: 78, top25: 77 },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function healthColor(score: number): string {
  if (score >= 88) return SUCCESS;
  if (score >= 75) return PRIMARY;
  if (score >= 62) return WARNING;
  return DANGER;
}

function pctBar(pct: number, color: string, height = "h-2") {
  return (
    <div className={`w-full ${height} rounded-full bg-[var(--bg-base)]`}>
      <div className={`${height} rounded-full`} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Growth Stat Cards with comparison bars                                      */
/* -------------------------------------------------------------------------- */

function GrowthStatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {GROWTH_STATS.map((stat) => {
        const delta = stat.current - stat.prior;
        const priorPct = (stat.prior / stat.current) * 100;
        return (
          <div key={stat.label} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
              {stat.label}
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-[38px] font-black leading-none text-[var(--text-primary)]">
                {stat.current}
              </span>
              <span className="text-[12px] font-semibold mb-1.5" style={{ color: SUCCESS }}>
                ↑{delta}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mb-3">from {stat.prior} last season</div>

            {/* Comparison bars */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--text-muted)] w-14 shrink-0">This season</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-base)]">
                  <div className="h-2 rounded-full" style={{ width: "100%", background: PRIMARY }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--text-muted)] w-14 shrink-0">Last season</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-base)]">
                  <div className="h-2 rounded-full opacity-40"
                    style={{ width: `${priorPct}%`, background: PRIMARY }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Team Health Table                                                           */
/* -------------------------------------------------------------------------- */

function TeamSparkline({ data }: { data: number[] }) {
  const W = 60;
  const H = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  function toX(i: number) { return (i / (data.length - 1)) * W; }
  function toY(v: number) { return H - 2 - ((v - min) / range) * (H - 4); }

  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const trending = data[data.length - 1] > data[0];

  return (
    <svg width={W} height={H} aria-hidden="true">
      <polyline points={points} fill="none"
        stroke={trending ? SUCCESS : WARNING}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function TeamHealthTable() {
  const sorted = [...TEAM_HEALTH].sort((a, b) => b.healthScore - a.healthScore);

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {["Team", "Athletes", "Coach", "VDV% (trend)", "Avg Score", "Film Rate", "Family Eng", "Health"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, ri) => {
            const hColor = healthColor(team.healthScore);
            return (
              <tr key={team.name}
                className={`border-b border-[var(--border)] ${ri % 2 === 0 ? "bg-[var(--bg-surface)]" : ""}`}
              >
                <td className="px-4 py-3 font-semibold text-[var(--text-primary)] text-[13px]">{team.name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] text-[13px]">{team.athletes}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] text-[12px]">{team.coach}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{team.vdvPct}%</span>
                    <TeamSparkline data={team.vdvSpark} />
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--text-primary)] text-[13px] font-medium">{team.avgAssessment}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--text-muted)]">{team.filmRate}%</span>
                    <div className="w-16 h-1.5 rounded-full bg-[var(--bg-base)]">
                      <div className="h-1.5 rounded-full" style={{ width: `${team.filmRate}%`, background: PRIMARY, opacity: 0.7 }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--text-muted)]">{team.familyEng}%</span>
                    <div className="w-16 h-1.5 rounded-full bg-[var(--bg-base)]">
                      <div className="h-1.5 rounded-full" style={{ width: `${team.familyEng}%`, background: SUCCESS, opacity: 0.7 }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                    style={{ color: hColor, background: `${hColor.replace(")", " / 0.12)")}` }}
                  >
                    {team.healthScore}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Athlete Pipeline Flow                                                       */
/* -------------------------------------------------------------------------- */

function AthletePipeline() {
  const maxCurrent = Math.max(...AGE_PIPELINE.map((a) => a.current));

  return (
    <div className="space-y-3">
      {AGE_PIPELINE.map((group, i) => {
        const pct = (group.current / maxCurrent) * 100;
        const retainedPct = group.retained > 0 ? (group.retained / group.current) * 100 : 0;

        return (
          <div key={group.label} className="bg-[var(--bg-base)] rounded-xl p-4">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-[13px] font-bold text-[var(--text-primary)] w-10 shrink-0">{group.label}</span>
              <div className="flex-1">
                {/* Stacked bar: retained (success) + new (primary) */}
                <div className="h-6 rounded-lg bg-[var(--bg-surface)] overflow-hidden flex">
                  {group.retained > 0 && (
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${retainedPct}%`, background: SUCCESS }}
                    >
                      {retainedPct > 12 ? `${group.retained} ret` : ""}
                    </div>
                  )}
                  {group.new_ > 0 && (
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${(group.new_ / group.current) * 100}%`, background: PRIMARY, opacity: 0.85 }}
                    >
                      {((group.new_ / group.current) * 100) > 12 ? `${group.new_} new` : ""}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[20px] font-black text-[var(--text-primary)] w-8 text-right shrink-0">
                {group.current}
              </span>
            </div>

            {i > 0 && group.retained > 0 && (
              <div className="text-[11px] text-[var(--text-muted)]">
                <span className="font-semibold" style={{ color: SUCCESS }}>
                  {Math.round(retainedPct)}% retention
                </span>
                {" "}from {AGE_PIPELINE[i - 1].label} — {retainedPct >= 65 ? "above" : "below"} national avg of 58%
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: SUCCESS }} />
          <span className="text-[11px] text-[var(--text-muted)]">Returning from prior age group</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: PRIMARY, opacity: 0.85 }} />
          <span className="text-[11px] text-[var(--text-muted)]">New to program or age group</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Recruiting Activity Bar Chart                                               */
/* -------------------------------------------------------------------------- */

function RecruitingActivityChart() {
  const maxActivity = Math.max(...GRAD_YEAR_ACTIVITY.map((g) => g.activity));
  const W = 300;
  const H = 100;
  const PAD_B = 20;
  const PAD_T = 10;
  const PAD_L = 8;
  const chartH = H - PAD_T - PAD_B;
  const barW = 60;
  const spacing = (W - PAD_L * 2) / GRAD_YEAR_ACTIVITY.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[320px]" aria-label="Recruiting activity by grad year">
      {GRAD_YEAR_ACTIVITY.map((g, i) => {
        const h = (g.activity / maxActivity) * chartH;
        const x = PAD_L + i * spacing + (spacing - barW) / 2;
        const y = PAD_T + chartH - h;
        return (
          <g key={g.year}>
            <rect x={x} y={y} width={barW} height={h} fill={g.color} fillOpacity="0.82" rx="4" />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={g.color} fontSize="10" fontWeight="700">
              {g.activity}
            </text>
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fill="oklch(0.55 0.02 260)" fontSize="10">
              {g.year}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Radar Chart (SVG octagon)                                                   */
/* -------------------------------------------------------------------------- */

function RadarChart() {
  const cx = 180;
  const cy = 170;
  const r = 120;
  const n = RADAR_DIMS.length;

  function getPoint(value: number, idx: number): [number, number] {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const norm = value / 100;
    return [cx + r * norm * Math.cos(angle), cy + r * norm * Math.sin(angle)];
  }

  function polygonPoints(values: number[]): string {
    return values.map((v, i) => getPoint(v, i).join(",")).join(" ");
  }

  const gridLevels = [25, 50, 75, 100];
  const yoursPts = polygonPoints(RADAR_DIMS.map((d) => d.yours));
  const top25Pts = polygonPoints(RADAR_DIMS.map((d) => d.top25));

  return (
    <svg viewBox="0 0 360 340" className="w-full max-w-[360px] mx-auto" aria-label="Program comparison radar chart">
      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const norm = level / 100;
          return `${cx + r * norm * Math.cos(angle)},${cy + r * norm * Math.sin(angle)}`;
        }).join(" ");
        return (
          <polygon key={level} points={pts}
            fill="none" stroke="oklch(0.30 0.01 260)" strokeWidth="0.8" />
        );
      })}

      {/* Axis lines */}
      {RADAR_DIMS.map((_, i) => {
        const [x, y] = getPoint(100, i);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke="oklch(0.28 0.01 260)" strokeWidth="0.8" />
        );
      })}

      {/* Top 25% polygon */}
      <polygon points={top25Pts} fill={SUCCESS} fillOpacity="0.10" stroke={SUCCESS} strokeWidth="1.5" strokeDasharray="4 2" />

      {/* Your program polygon */}
      <polygon points={yoursPts} fill={PRIMARY} fillOpacity="0.18" stroke={PRIMARY} strokeWidth="2" />

      {/* Axis labels */}
      {RADAR_DIMS.map((dim, i) => {
        const [x, y] = getPoint(118, i);
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const anchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";

        const yoursVsTop = dim.yours - dim.top25;
        const labelColor = yoursVsTop >= 0 ? SUCCESS : DANGER;

        return (
          <g key={dim.label}>
            <text x={x} y={y} textAnchor={anchor as "middle" | "start" | "end"}
              fill="oklch(0.70 0.02 260)" fontSize="10" fontWeight="500">
              {dim.label}
            </text>
            <text x={x} y={y + 11} textAnchor={anchor as "middle" | "start" | "end"}
              fill={labelColor} fontSize="9" fontWeight="700">
              {yoursVsTop >= 0 ? `+${yoursVsTop}` : yoursVsTop}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(14, 310)">
        <rect width="10" height="10" fill={PRIMARY} fillOpacity="0.18" stroke={PRIMARY} strokeWidth="2" rx="2" />
        <text x="14" y="9" fill="oklch(0.65 0.02 260)" fontSize="10">Elevation Basketball</text>
      </g>
      <g transform="translate(160, 310)">
        <rect width="10" height="10" fill={SUCCESS} fillOpacity="0.10" stroke={SUCCESS} strokeWidth="1.5" rx="2" />
        <text x="14" y="9" fill="oklch(0.65 0.02 260)" fontSize="10">Top 25% of similar programs</text>
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ClubGrowthMetricsPage() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-12">
        <PageHeader
          eyebrow="Club Intelligence"
          title="Growth Metrics"
          subtitle="How Elevation Basketball is growing — and where the opportunity is"
        />

        {/* ── Section 1: Growth Snapshot ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Club Growth — Current Season</h2>
          </div>
          <GrowthStatCards />
        </section>

        {/* ── Section 2: Team Health ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Teams — Comparative Health</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              Sorted by health score. VDV% trend shows the last 8 weeks.
            </p>
          </div>
          <TeamHealthTable />
        </section>

        {/* ── Section 3: Athlete Pipeline ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Athlete Progression Across Age Groups</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              How athletes move through your program year over year.
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <AthletePipeline />
            <div className="mt-5 p-4 rounded-xl" style={{ background: `${SUCCESS.replace(")", " / 0.08)")}` }}>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                <span className="font-semibold" style={{ color: SUCCESS }}>65% of your 16U athletes return for 17U</span>
                {" "}— above the national average of 58%. Strong 16U retention is a signal of coach quality and program identity.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: Recruiting Outcomes ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">College Placements & Recruiting Activity</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stats */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Verified profiles active",     value: 34  },
                  { label: "Recruiter access requests",    value: 127 },
                  { label: "Unique schools with views",    value: 31  },
                  { label: "Commitments this season",      value: 3   },
                ].map((item) => (
                  <div key={item.label} className="bg-[var(--bg-base)] rounded-xl p-3">
                    <div className="text-[28px] font-black text-[var(--text-primary)]">{item.value}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Division breakdown */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">
                  Schools by Division
                </div>
                <div className="space-y-2">
                  {RECRUITING_DIVISIONS.map((d) => {
                    const maxCount = Math.max(...RECRUITING_DIVISIONS.map((x) => x.count));
                    return (
                      <div key={d.div} className="flex items-center gap-3">
                        <span className="text-[12px] font-bold w-10 shrink-0" style={{ color: d.color }}>{d.div}</span>
                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-base)]">
                          <div className="h-2 rounded-full" style={{ width: `${(d.count / maxCount) * 100}%`, background: d.color }} />
                        </div>
                        <span className="text-[12px] text-[var(--text-muted)] w-4 text-right">{d.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Commitments + chart */}
            <div className="space-y-4">
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">
                  Commitments This Season
                </div>
                <div className="space-y-3">
                  {COMMITMENTS.map((c) => (
                    <div key={c.player}
                      className="flex items-center gap-3 p-3 bg-[var(--bg-base)] rounded-xl">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: `${SUCCESS.replace(")", " / 0.15)")}`, color: SUCCESS }}
                      >
                        {c.player.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{c.player}</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">{c.school}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-bold" style={{ color: PRIMARY }}>{c.division}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{c.year}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">
                  Recruiter Activity by Grad Year
                </div>
                <RecruitingActivityChart />
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  Class of 2027 is drawing the most attention — 64 access requests this season.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Seat Tracking ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Subscription & Seat Status</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Visible to directors only</p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Current Plan</div>
                <div className="text-[18px] font-bold text-[var(--text-primary)]">Club Pro</div>
                <div className="text-[12px] text-[var(--text-muted)]">Renews Jun 1, 2026</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Athlete Seats</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-black text-[var(--text-primary)]">89</span>
                  <span className="text-[14px] text-[var(--text-muted)]">/ 100</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-[var(--bg-base)]">
                  <div className="h-2.5 rounded-full" style={{ width: "89%", background: WARNING }} />
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Cost Per Athlete</div>
                <div className="text-[28px] font-black text-[var(--text-primary)]">$4.49</div>
                <div className="text-[12px] text-[var(--text-muted)]">per athlete/month</div>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)]"
              style={{ background: `${WARNING.replace(")", " / 0.08)")}` }}
            >
              <span className="text-[18px] shrink-0">⚠️</span>
              <div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  You're using 89 of 100 athlete seats.
                </div>
                <div className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  If your roster grows with spring tryouts, you'll exceed your seat limit. Consider upgrading
                  to the Enterprise tier (unlimited athletes) before roster expansion.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 6: Program Reputation Radar ── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Program Reputation vs. Peers</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              How Elevation Basketball compares to similar programs on HoopsIQ (anonymized). Eight dimensions of program quality.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <RadarChart />

              <div className="flex-1 space-y-3">
                <div className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Dimension breakdown
                </div>
                {RADAR_DIMS.map((dim) => {
                  const diff = dim.yours - dim.top25;
                  const color = diff >= 0 ? SUCCESS : DANGER;
                  return (
                    <div key={dim.label} className="flex items-center gap-3">
                      <span className="text-[12px] text-[var(--text-muted)] w-32 shrink-0">{dim.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-base)]">
                        <div className="h-1.5 rounded-full" style={{ width: `${dim.yours}%`, background: PRIMARY, opacity: 0.7 }} />
                      </div>
                      <span className="text-[11px] font-bold w-10 text-right" style={{ color }}>
                        {diff >= 0 ? `+${diff}` : diff}
                      </span>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-[var(--border)]">
                  <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                    <span className="font-semibold text-[var(--text-primary)]">You lead in:</span> Family Engagement, Recruiting Reach, Form Completion.{" "}
                    <span className="font-semibold text-[var(--text-primary)]">Focus areas:</span> Assessment Consistency and Film Density lag the top quartile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
