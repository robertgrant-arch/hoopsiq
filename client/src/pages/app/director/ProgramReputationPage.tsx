/**
 * ProgramReputationPage — Aggregate program development metrics.
 * Route: /app/director/program-reputation
 *
 * Sections:
 *   1. Hero "Development Track Record" metric
 *   2. Four reputation pillars (2×2 grid)
 *   3. Season-over-season skill improvement line chart
 *   4. Recruiting outcomes funnel
 *   5. Shareable program card
 *   6. Methodology note
 */
import { useState } from "react";
import {
  TrendingUp,
  Film,
  Award,
  Users,
  BarChart2,
  Share2,
  Download,
  ChevronRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";
const MUTED   = "oklch(0.55 0.02 260)";

const PROGRAM_NAME = "Barnegat Elite";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

type SeasonData = {
  season: string;
  ballHandling: number;
  shooting: number;
  defense: number;
};

const SEASON_DATA: SeasonData[] = [
  { season: "Fall '23", ballHandling: 64, shooting: 58, defense: 61 },
  { season: "Spring '24", ballHandling: 69, shooting: 63, defense: 65 },
  { season: "Fall '24", ballHandling: 75, shooting: 70, defense: 71 },
  { season: "Spring '25", ballHandling: 82, shooting: 76, defense: 78 },
];

type Placement = {
  name: string; school: string; division: "D1" | "D2" | "D3" | "NAIA" | "JUCO"; year: number;
};

const PLACEMENTS: Placement[] = [
  { name: "Marcus Webb",    school: "Penn State",       division: "D1",   year: 2023 },
  { name: "Devon Reese",    school: "Seton Hall",       division: "D1",   year: 2024 },
  { name: "Amir Johnson",   school: "Rutgers",          division: "D1",   year: 2024 },
  { name: "Chris Osei",     school: "Rider University", division: "D2",   year: 2023 },
  { name: "T.J. Torres",    school: "Monmouth Univ.",   division: "D1",   year: 2022 },
  { name: "Kevin Park",     school: "Rowan University", division: "D3",   year: 2022 },
  { name: "Jake Simmons",   school: "Lincoln Univ.",    division: "D2",   year: 2021 },
  { name: "Ray Waters",     school: "NJIT",             division: "D1",   year: 2021 },
  { name: "Donnell Shaw",   school: "Essex CC",         division: "JUCO", year: 2025 },
  { name: "Louis Ferreira", school: "Georgian Court",   division: "D2",   year: 2025 },
  { name: "Brayden Cox",    school: "Stockton Univ.",   division: "D3",   year: 2025 },
  { name: "Andre Watts",    school: "Caldwell Univ.",   division: "D2",   year: 2023 },
  { name: "Omar Hassan",    school: "Drew University",  division: "D3",   year: 2022 },
  { name: "Nathan Bell",    school: "Sussex CC",        division: "JUCO", year: 2024 },
];

const DIV_COLORS: Record<string, string> = {
  D1:   PRIMARY,
  D2:   SUCCESS,
  D3:   WARNING,
  NAIA: "oklch(0.72 0.18 190)",
  JUCO: MUTED,
};

const DIV_ORDER = ["D1", "D2", "D3", "NAIA", "JUCO"];

function divCount(div: string) {
  return PLACEMENTS.filter((p) => p.division === div).length;
}

const mostRecent = PLACEMENTS.reduce((a, b) => (a.year >= b.year ? a : b));

/* -------------------------------------------------------------------------- */
/* SVG Bar Chart — season skill improvement                                   */
/* -------------------------------------------------------------------------- */

function SkillBarChart() {
  const seasons = ["Fall '23", "Spring '24", "Fall '24", "Spring '25"];
  const skills  = [
    { key: "ballHandling" as keyof SeasonData, label: "Ball Handling", color: PRIMARY  },
    { key: "shooting"     as keyof SeasonData, label: "Shooting",      color: SUCCESS  },
    { key: "defense"      as keyof SeasonData, label: "Defense",       color: WARNING  },
  ];

  const W        = 340;
  const H        = 120;
  const padL     = 24;
  const padB     = 24;
  const padT     = 8;
  const padR     = 8;
  const innerW   = W - padL - padR;
  const innerH   = H - padT - padB;
  const minVal   = 50;
  const maxVal   = 95;
  const range    = maxVal - minVal;

  function toX(i: number) {
    return padL + (i / (seasons.length - 1)) * innerW;
  }
  function toY(v: number) {
    return padT + innerH - ((v - minVal) / range) * innerH;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 340 }}>
      {/* Grid lines */}
      {[60, 70, 80, 90].map((v) => (
        <line
          key={v}
          x1={padL} y1={toY(v)}
          x2={W - padR} y2={toY(v)}
          stroke="oklch(0.35 0.01 260)" strokeWidth="0.5" strokeDasharray="3 3"
        />
      ))}

      {/* Skill lines */}
      {skills.map((skill) => {
        const pts = SEASON_DATA.map((d, i) => [toX(i), toY(d[skill.key] as number)] as [number, number]);
        const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
        return (
          <g key={skill.key}>
            <path d={path} fill="none" stroke={skill.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3" fill={skill.color} />
            ))}
          </g>
        );
      })}

      {/* X axis labels */}
      {seasons.map((s, i) => (
        <text
          key={s}
          x={toX(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize="8"
          fill="oklch(0.55 0.02 260)"
        >
          {s}
        </text>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* SVG distribution curve for coachability                                    */
/* -------------------------------------------------------------------------- */

function CoachabilityDistribution() {
  const W = 280; const H = 80;
  const mean = 83; const sd = 9;

  function gaussian(x: number) {
    return Math.exp(-0.5 * ((x - mean) / sd) ** 2);
  }

  const xs = Array.from({ length: 81 }, (_, i) => i + 50);
  const ys = xs.map(gaussian);
  const maxY = Math.max(...ys);

  function toSvgX(x: number) { return ((x - 50) / 80) * (W - 20) + 10; }
  function toSvgY(y: number) { return H - 10 - (y / maxY) * (H - 20); }

  const points = xs.map((x, i) => `${toSvgX(x).toFixed(1)},${toSvgY(ys[i]).toFixed(1)}`).join(" ");
  const areaPath = `M ${toSvgX(50)},${H - 10} ${xs.map((x, i) => `L ${toSvgX(x).toFixed(1)},${toSvgY(ys[i]).toFixed(1)}`).join(" ")} L ${toSvgX(130)},${H - 10} Z`;

  // Program avg marker at 83
  const progX = toSvgX(mean);
  const progY = toSvgY(gaussian(mean));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 280 }}>
      <defs>
        <linearGradient id="coachGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.3" />
          <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#coachGrad)" />
      <polyline points={points} fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Program avg line */}
      <line x1={progX} y1={toSvgY(0)} x2={progX} y2={progY} stroke={SUCCESS} strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx={progX} cy={progY} r="3.5" fill={SUCCESS} />
      <text x={progX + 5} y={progY - 4} fontSize="8" fill={SUCCESS}>Your program</text>
      {/* X axis */}
      <line x1="10" y1={H - 10} x2={W - 10} y2={H - 10} stroke="oklch(0.35 0.01 260)" strokeWidth="0.5" />
      {[60, 70, 80, 90, 100].map((v) => (
        <text key={v} x={toSvgX(v)} y={H - 1} textAnchor="middle" fontSize="8" fill="oklch(0.50 0.02 260)">{v}</text>
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* SVG placement bar chart                                                     */
/* -------------------------------------------------------------------------- */

function PlacementBarChart() {
  const data = DIV_ORDER.map((div) => ({ div, count: divCount(div), color: DIV_COLORS[div] }));
  const maxCount = Math.max(...data.map((d) => d.count));
  const W = 280; const H = 80;
  const barW = 36; const gap = 12;
  const totalW = data.length * barW + (data.length - 1) * gap;
  const startX = (W - totalW) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 280 }}>
      {data.map((d, i) => {
        const barH = ((d.count / maxCount) * (H - 30));
        const x    = startX + i * (barW + gap);
        const y    = H - 20 - barH;
        return (
          <g key={d.div}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill={d.color} fillOpacity="0.85" />
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="10" fontWeight="700" fill={d.color}>
              {d.count}
            </text>
            <text x={x + barW / 2} y={H - 5} textAnchor="middle" fontSize="9" fill="oklch(0.55 0.02 260)">
              {d.div}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Recruiting funnel SVG                                                       */
/* -------------------------------------------------------------------------- */

function RecruitingFunnel() {
  const stages = [
    { label: "Athletes in program",       value: 82,  color: PRIMARY  },
    { label: "Public profiles",           value: 41,  color: SUCCESS  },
    { label: "Recruiter views",           value: 148, color: WARNING  },
    { label: "Access approved",           value: 23,  color: "oklch(0.72 0.18 190)" },
    { label: "Export downloaded",         value: 11,  color: "oklch(0.72 0.20 35)"  },
    { label: "College placement",         value: 14,  color: SUCCESS  },
  ];

  const maxW = 300;
  const rowH = 40;
  const H    = stages.length * rowH;

  return (
    <svg viewBox={`0 0 ${maxW} ${H}`} className="w-full" style={{ maxWidth: 300 }}>
      {stages.map((stage, i) => {
        const pct  = stage.value / stages[0].value;
        const w    = Math.max(pct * maxW, 80);
        const x    = (maxW - w) / 2;
        const y    = i * rowH;
        return (
          <g key={stage.label}>
            <rect x={x} y={y + 4} width={w} height={rowH - 10} rx="5" fill={stage.color} fillOpacity="0.18" />
            <rect x={x} y={y + 4} width={w} height={rowH - 10} rx="5" fill={stage.color} fillOpacity="0.05"
              stroke={stage.color} strokeWidth="1" strokeOpacity="0.4" />
            <text x={maxW / 2} y={y + rowH / 2 + 1} textAnchor="middle" fontSize="11" fontWeight="700" fill={stage.color}>
              {stage.value}
            </text>
            <text x={maxW / 2} y={y + rowH / 2 + 12} textAnchor="middle" fontSize="9" fill="oklch(0.55 0.02 260)">
              {stage.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Shareable program card                                                      */
/* -------------------------------------------------------------------------- */

function ShareableCard() {
  const stats = [
    { label: "Athletes Placed (10yr)",  value: String(PLACEMENTS.length) },
    { label: "D1 Placements",           value: String(divCount("D1"))      },
    { label: "Avg Coachability Index",  value: "83"                        },
    { label: "Avg Skill Improvement",   value: "+18pt"                     },
  ];

  return (
    <div
      className="rounded-2xl border-2 p-6 space-y-5 relative overflow-hidden"
      style={{ borderColor: `${PRIMARY}40`, background: "oklch(0.14 0.008 260)" }}
    >
      {/* Watermark accent */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-5"
        style={{ background: PRIMARY }}
      />

      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: PRIMARY }}>
          HoopsIQ Program Card
        </div>
        <div className="text-[20px] font-black text-[var(--text-primary)]">{PROGRAM_NAME}</div>
        <div className="text-[12px] text-[var(--text-muted)] mt-0.5">Program Development Metrics · Spring 2026</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-[var(--bg-base)] p-3 border border-[var(--border)]">
            <div className="text-[22px] font-black" style={{ color: PRIMARY }}>{s.value}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-3 text-[13px] font-semibold text-center"
        style={{ background: `${SUCCESS}14`, color: SUCCESS }}
      >
        Athletes improve 34% faster than comparable programs
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => toast.success("Share link copied to clipboard")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Link
        </button>
        <button
          onClick={() => toast.success("Generating PDF card...")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold transition-colors"
          style={{ background: PRIMARY, color: "white" }}
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pillar card                                                                 */
/* -------------------------------------------------------------------------- */

function PillarCard({
  icon,
  title,
  tagline,
  stats,
  chart,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  stats: { label: string; value: string; color: string }[];
  chart?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${PRIMARY}14`, color: PRIMARY }}
          >
            {icon}
          </div>
          <h3 className="text-[15px] font-bold text-[var(--text-primary)]">{title}</h3>
        </div>
        {badge && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: `${SUCCESS}12`, color: SUCCESS }}
          >
            {badge}
          </span>
        )}
      </div>

      <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tagline}</p>

      {chart && <div>{chart}</div>}

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-[var(--bg-base)] p-2.5 text-center">
            <div className="text-[18px] font-black leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function ProgramReputationPage() {
  return (
    <AppShell>
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-8">
        <PageHeader
          eyebrow="Program Intelligence"
          title="Program Reputation"
          subtitle="How your program's development outcomes compare — the data that makes your recruiting case"
        />

        {/* Hero metric card */}
        <div
          className="rounded-2xl border-2 p-8 text-center space-y-3 relative overflow-hidden"
          style={{ borderColor: `${SUCCESS}40`, background: "oklch(0.15 0.012 140 / 0.4)" }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${SUCCESS}, transparent 70%)`,
            }}
          />
          <div className="relative space-y-2">
            <div className="text-[12px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
              Development Track Record
            </div>
            <div className="text-[60px] sm:text-[80px] font-black leading-none" style={{ color: SUCCESS }}>
              34%
            </div>
            <div className="text-[18px] sm:text-[22px] font-bold text-[var(--text-primary)]">
              Athletes in {PROGRAM_NAME} improve faster than comparable programs
            </div>
            <div className="text-[13px] text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              Measured across skill assessment scores, coachability index, and attendance trends over four consecutive seasons.
              Benchmark is the anonymized aggregate of all programs using HoopsIQ with similar roster sizes.
            </div>
            <div className="flex items-center justify-center gap-6 pt-2">
              {[
                { label: "Seasons of data",       value: "4"    },
                { label: "Total assessments",      value: "214"  },
                { label: "Benchmark programs",     value: "38"   },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-[20px] font-black" style={{ color: SUCCESS }}>{s.value}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Four pillars */}
        <div>
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
            Reputation Pillars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PillarCard
              icon={<TrendingUp className="w-4 h-4" />}
              title="Skill Development Rate"
              tagline="Average skill score delta per player over the last 12 months. Ball handling, shooting, and defense tracked independently against program averages and the HoopsIQ benchmark."
              badge="↑ Above benchmark"
              stats={[
                { label: "Avg skill delta",        value: "+18pt", color: PRIMARY },
                { label: "Benchmark avg",          value: "+13pt", color: MUTED   },
                { label: "Top improvement",        value: "+31pt", color: SUCCESS  },
              ]}
              chart={
                <div>
                  <div className="flex gap-3 mb-2 flex-wrap">
                    {[
                      { label: "Ball Handling", color: PRIMARY },
                      { label: "Shooting",      color: SUCCESS },
                      { label: "Defense",       color: WARNING },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <span className="w-3 h-0.5 rounded-full" style={{ background: s.color, display: "inline-block" }} />
                        {s.label}
                      </div>
                    ))}
                  </div>
                  <SkillBarChart />
                </div>
              }
            />

            <PillarCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              title="Coachability Outcomes"
              tagline='College programs trust athletes from high-coachability environments. Our athletes score significantly above the benchmark in follow-through, IDP completion, and coach responsiveness.'
              badge="Top quartile"
              stats={[
                { label: "Avg coachability",    value: "83",  color: PRIMARY },
                { label: "Attendance rate",     value: "89%", color: SUCCESS },
                { label: "IDP completion",      value: "74%", color: WARNING },
              ]}
              chart={
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-2">Program coachability vs. benchmark distribution</div>
                  <CoachabilityDistribution />
                </div>
              }
            />

            <PillarCard
              icon={<Film className="w-4 h-4" />}
              title="Film Engagement"
              tagline="Athletes with film evidence get 3× more recruiter interest. Our program-wide film engagement rate is well above average — coaches actively annotate and assign film review."
              stats={[
                { label: "Avg film sessions",       value: "14",  color: PRIMARY },
                { label: "Annotation rate",         value: "62%", color: SUCCESS },
                { label: "Full film packages",      value: "67%", color: WARNING },
              ]}
            />

            <PillarCard
              icon={<Award className="w-4 h-4" />}
              title="Placement Track Record"
              tagline={`${PLACEMENTS.length} athletes have moved on to college programs this decade across all divisions. Most recent: ${mostRecent.name}, ${mostRecent.school} (${mostRecent.year}).`}
              badge={`${PLACEMENTS.length} placements`}
              stats={[
                { label: "D1 placements",  value: String(divCount("D1")),                    color: PRIMARY  },
                { label: "D2 placements",  value: String(divCount("D2")),                    color: SUCCESS  },
                { label: "D3 + NAIA/JUCO", value: String(divCount("D3") + divCount("JUCO")), color: WARNING  },
              ]}
              chart={<PlacementBarChart />}
            />
          </div>
        </div>

        {/* Season line chart + funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Season-over-season skill chart */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Season-Over-Season Skill Improvement
              </h3>
            </div>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "Ball Handling", color: PRIMARY },
                { label: "Shooting",      color: SUCCESS },
                { label: "Defense",       color: WARNING },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                  <span className="w-4 h-0.5 rounded-full" style={{ background: s.color, display: "inline-block" }} />
                  {s.label}
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <SkillBarChart />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {SEASON_DATA.map((d) => (
                <div key={d.season}>
                  <div className="text-[11px] text-[var(--text-muted)] mb-1">{d.season}</div>
                  <div className="text-[13px] font-bold" style={{ color: PRIMARY }}>
                    {Math.round((d.ballHandling + d.shooting + d.defense) / 3)}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">avg score</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiting outcomes funnel */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Recruiting Outcomes Funnel</h3>
            </div>
            <div className="text-[12px] text-[var(--text-muted)]">
              How {PROGRAM_NAME} athletes move through the recruiting pipeline
            </div>
            <div className="flex justify-center">
              <RecruitingFunnel />
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <Zap className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
              <span style={{ color: SUCCESS }}>14</span> college placements in the last 10 years
            </div>
          </div>
        </div>

        {/* Shareable program card */}
        <div className="max-w-sm">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Shareable Program Card</h3>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            Share this with prospective families to show what{" "}
            <span style={{ color: PRIMARY }}>{PROGRAM_NAME}</span> delivers.
          </p>
          <ShareableCard />
        </div>

        {/* Methodology note */}
        <div
          className="rounded-xl p-4 border"
          style={{ borderColor: "oklch(0.35 0.01 260)", background: "oklch(0.15 0.005 260 / 0.5)" }}
        >
          <div className="flex items-start gap-2.5 text-[12px] text-[var(--text-muted)] leading-relaxed">
            <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: MUTED }} />
            <span>
              <strong className="text-[var(--text-primary)]">Methodology:</strong>{" "}
              Comparisons are based on aggregate anonymized data from programs using HoopsIQ with similar roster size,
              geographic market, and age-group composition. Individual athlete data is never disclosed in comparative
              analysis. Skill deltas are calculated from coach-administered assessments using the HoopsIQ assessment
              rubric. The 34% improvement figure reflects the mean cross-skill improvement index across four consecutive
              seasons, compared against programs in the same cohort. Updated each time a new assessment cycle closes.
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
