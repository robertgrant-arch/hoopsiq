/**
 * RosterIntelligencePage — Cross-season athlete intelligence.
 * Route: /app/club/roster-intel
 *
 * Sections:
 *   1. Multi-Season Development Table — skill + attendance trends across seasons
 *   2. Retention Spotlight           — featured athlete cards with SVG sparklines
 *   3. Age Progression View          — 15U → 17U readiness candidates
 *   4. Program Alumni                — graduated players and outcomes
 */
import { useState, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  AlertTriangle,
  GraduationCap,
  ChevronRight,
  Search,
  Filter,
  Target,
  Award,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Types & mock data                                                           */
/* -------------------------------------------------------------------------- */

type Trend = "up" | "flat" | "down";

type AthleteRow = {
  id: string;
  name: string;
  ageGroup: "15U" | "17U";
  seasonsInProgram: number;
  ballHandling: Trend;
  shooting: Trend;
  defense: Trend;
  attendance: Trend;
  idpActive: boolean;
};

const ATHLETES: AthleteRow[] = [
  { id: "a1", name: "Malik Henderson",    ageGroup: "17U", seasonsInProgram: 4, ballHandling: "up",   shooting: "up",   defense: "up",   attendance: "up",   idpActive: true  },
  { id: "a2", name: "Jordan Okafor",      ageGroup: "17U", seasonsInProgram: 3, ballHandling: "up",   shooting: "flat", defense: "up",   attendance: "up",   idpActive: true  },
  { id: "a3", name: "Darius Webb",        ageGroup: "17U", seasonsInProgram: 2, ballHandling: "flat", shooting: "up",   defense: "flat", attendance: "flat", idpActive: true  },
  { id: "a4", name: "Tyrese Morgan",      ageGroup: "15U", seasonsInProgram: 3, ballHandling: "up",   shooting: "up",   defense: "flat", attendance: "up",   idpActive: true  },
  { id: "a5", name: "Caleb Washington",   ageGroup: "15U", seasonsInProgram: 2, ballHandling: "flat", shooting: "flat", defense: "up",   attendance: "flat", idpActive: false },
  { id: "a6", name: "Marcus T.",          ageGroup: "17U", seasonsInProgram: 2, ballHandling: "down", shooting: "flat", defense: "down", attendance: "down", idpActive: true  },
  { id: "a7", name: "Jaylen P.",          ageGroup: "15U", seasonsInProgram: 1, ballHandling: "down", shooting: "down", defense: "flat", attendance: "down", idpActive: false },
  { id: "a8", name: "DeShawn M.",         ageGroup: "15U", seasonsInProgram: 2, ballHandling: "flat", shooting: "flat", defense: "flat", attendance: "down", idpActive: true  },
];

type SpotlightAthlete = {
  id: string;
  name: string;
  initials: string;
  ageGroup: string;
  seasonsInProgram: number;
  achievement: string;
  parentEngagement: "high" | "medium" | "low";
  reEnrolled: boolean;
  spotlight: "tenure" | "improved" | "at-risk";
  skillSparklines: {
    label: string;
    season1: number[];
    season2: number[];
    color: string;
  }[];
};

const SPOTLIGHT_ATHLETES: SpotlightAthlete[] = [
  {
    id: "s1",
    name: "Malik Henderson",
    initials: "MH",
    ageGroup: "17U",
    seasonsInProgram: 4,
    achievement: "Ball handling improved 2 full levels across 4 seasons — program's longest active tenure",
    parentEngagement: "high",
    reEnrolled: true,
    spotlight: "tenure",
    skillSparklines: [
      { label: "Ball Handling", season1: [2.1, 2.3, 2.6, 2.8, 3.0, 3.2], season2: [3.2, 3.4, 3.5, 3.7, 3.9, 4.1], color: PRIMARY },
      { label: "Shooting",      season1: [1.8, 2.0, 2.2, 2.3, 2.5, 2.6], season2: [2.6, 2.8, 3.0, 3.2, 3.4, 3.5], color: SUCCESS },
    ],
  },
  {
    id: "s2",
    name: "Tyrese Morgan",
    initials: "TM",
    ageGroup: "15U",
    seasonsInProgram: 3,
    achievement: "Shooting improved 2 full levels in 2 seasons — highest skill velocity in 15U cohort",
    parentEngagement: "high",
    reEnrolled: true,
    spotlight: "improved",
    skillSparklines: [
      { label: "Shooting",      season1: [1.5, 1.7, 1.9, 2.1, 2.4, 2.7], season2: [2.7, 3.0, 3.2, 3.4, 3.6, 3.7], color: SUCCESS },
      { label: "Ball Handling", season1: [2.0, 2.1, 2.3, 2.4, 2.5, 2.6], season2: [2.6, 2.7, 2.8, 3.0, 3.1, 3.2], color: PRIMARY },
    ],
  },
  {
    id: "s3",
    name: "Marcus T.",
    initials: "MT",
    ageGroup: "17U",
    seasonsInProgram: 2,
    achievement: "Skill velocity plateau for 6 weeks — engagement and attendance declining",
    parentEngagement: "low",
    reEnrolled: false,
    spotlight: "at-risk",
    skillSparklines: [
      { label: "Ball Handling", season1: [2.5, 2.7, 2.9, 3.1, 3.3, 3.4], season2: [3.4, 3.4, 3.3, 3.3, 3.2, 3.2], color: DANGER  },
      { label: "Defense",       season1: [1.8, 2.0, 2.2, 2.3, 2.5, 2.6], season2: [2.6, 2.6, 2.5, 2.4, 2.3, 2.3], color: WARNING },
    ],
  },
];

type AdvancementCandidate = {
  id: string;
  name: string;
  initials: string;
  currentGroup: "15U";
  readinessScore: number;
  skillVelocity: "high" | "medium" | "low";
  attendanceRate: number;
  coachRecommendation: "strong" | "conditional" | "not-ready";
  coachName: string;
  coachabilityFlags: string[];
};

const ADVANCEMENT_CANDIDATES: AdvancementCandidate[] = [
  {
    id: "ac1",
    name: "Tyrese Morgan",
    initials: "TM",
    currentGroup: "15U",
    readinessScore: 88,
    skillVelocity: "high",
    attendanceRate: 94,
    coachRecommendation: "strong",
    coachName: "Coach Williams",
    coachabilityFlags: ["Responds well to feedback", "Self-directed between sessions"],
  },
  {
    id: "ac2",
    name: "Caleb Washington",
    initials: "CW",
    currentGroup: "15U",
    readinessScore: 67,
    skillVelocity: "medium",
    attendanceRate: 81,
    coachRecommendation: "conditional",
    coachName: "Coach Williams",
    coachabilityFlags: ["Consistent effort", "Needs more consistency in games"],
  },
];

type Alumni = {
  id: string;
  name: string;
  initials: string;
  yearsInProgram: number;
  positions: string[];
  finalSkillTier: string;
  outcome?: string;
  graduatedSeason: string;
};

const ALUMNI: Alumni[] = [
  { id: "al1", name: "Deon Barnes",    initials: "DB", yearsInProgram: 4, positions: ["Point Guard", "Shooting Guard"], finalSkillTier: "Elite",       outcome: "Playing AAU at national level",          graduatedSeason: "Spring 2025" },
  { id: "al2", name: "Ray Sutton",     initials: "RS", yearsInProgram: 3, positions: ["Small Forward"],                 finalSkillTier: "Development", outcome: "Playing JV at Barnegat High School",      graduatedSeason: "Spring 2025" },
  { id: "al3", name: "Chris Odum",     initials: "CO", yearsInProgram: 2, positions: ["Center"],                        finalSkillTier: "Foundation",  outcome: undefined,                                graduatedSeason: "Fall 2024"   },
  { id: "al4", name: "Jamari Fields",  initials: "JF", yearsInProgram: 4, positions: ["Point Guard"],                   finalSkillTier: "Elite",       outcome: "Committed to Rutgers Prep HS program",   graduatedSeason: "Spring 2024" },
];

/* -------------------------------------------------------------------------- */
/* SVG sparklines                                                              */
/* -------------------------------------------------------------------------- */

function SeasonSparkline({
  season1,
  season2,
  color,
  label,
}: {
  season1: number[];
  season2: number[];
  color: string;
  label: string;
}) {
  const w = 200;
  const h = 50;
  const pad = 4;
  const allVals = [...season1, ...season2];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;

  function toPoints(vals: number[]): [number, number][] {
    return vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      const y = (h - pad) - ((v - min) / range) * (h - pad * 2) + pad;
      return [x, y];
    });
  }

  const pts1 = toPoints(season1);
  const pts2 = toPoints(season2);
  const season2Color = color === DANGER ? "oklch(0.55 0.02 260)" : color;

  function lineStr(pts: [number, number][]) {
    return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }

  // Midpoint separator
  const midX = (pts1[pts1.length - 1][0] + pts2[0][0]) / 2;

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible" style={{ maxWidth: w }}>
        {/* Season separator */}
        <line x1={midX} y1={pad} x2={midX} y2={h - pad} stroke="oklch(0.55 0.02 260 / 0.18)" strokeWidth="1" strokeDasharray="2 2" />

        {/* Season 1 line */}
        <polyline points={lineStr(pts1)} stroke="oklch(0.55 0.02 260 / 0.40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Season 2 line */}
        <polyline points={lineStr(pts2)} stroke={season2Color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* End dot */}
        {(() => {
          const [lx, ly] = pts2[pts2.length - 1];
          return <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="3" fill={season2Color} />;
        })()}
      </svg>
      <div className="flex gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-px" style={{ background: "oklch(0.55 0.02 260 / 0.40)" }} />Prior season</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-px" style={{ background: season2Color }} />Current</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Trend arrow component                                                       */
/* -------------------------------------------------------------------------- */

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === "up")   return <ArrowUp   className="w-3.5 h-3.5" style={{ color: SUCCESS }} />;
  if (trend === "down") return <ArrowDown className="w-3.5 h-3.5" style={{ color: DANGER  }} />;
  return <Minus className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.02 260)" }} />;
}

/* -------------------------------------------------------------------------- */
/* Section 1: Multi-Season Development Table                                  */
/* -------------------------------------------------------------------------- */

type SortKey = "name" | "ageGroup" | "seasonsInProgram" | "attendance";

function MultiSeasonTable({ searchQuery, ageFilter }: { searchQuery: string; ageFilter: string }) {
  const [sortKey, setSortKey] = useState<SortKey>("seasonsInProgram");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    return ATHLETES.filter(a => {
      const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAge = !ageFilter || ageFilter === "all" || a.ageGroup === ageFilter;
      return matchSearch && matchAge;
    });
  }, [searchQuery, ageFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "name":             list.sort((a, b) => dir * a.name.localeCompare(b.name)); break;
      case "ageGroup":         list.sort((a, b) => dir * a.ageGroup.localeCompare(b.ageGroup)); break;
      case "seasonsInProgram": list.sort((a, b) => dir * (a.seasonsInProgram - b.seasonsInProgram)); break;
      case "attendance":       list.sort((a, b) => {
        const order: Trend[] = ["up", "flat", "down"];
        return dir * (order.indexOf(a.attendance) - order.indexOf(b.attendance));
      }); break;
    }
    return list;
  }, [filtered, sortKey, sortDir]);

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button
        onClick={() => handleSort(col)}
        className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-0.5 transition-colors"
        style={{ color: active ? PRIMARY : "oklch(0.55 0.02 260)" }}
      >
        {label}
        {active && (sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="hidden md:grid gap-3 px-4 py-2.5 border-b border-border"
        style={{ gridTemplateColumns: "1fr 80px 80px 90px 80px 80px 90px 70px 80px" }}
      >
        <SortBtn col="name" label="Athlete" />
        <SortBtn col="ageGroup" label="Group" />
        <SortBtn col="seasonsInProgram" label="Seasons" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ball HDL</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shooting</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Defense</span>
        <SortBtn col="attendance" label="Attendance" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">IDP</span>
        <span />
      </div>

      {/* Rows */}
      {sorted.map((a) => (
        <div key={a.id} className="border-b border-border last:border-0">
          {/* Desktop row */}
          <div
            className="hidden md:grid gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
            style={{ gridTemplateColumns: "1fr 80px 80px 90px 80px 80px 90px 70px 80px", minHeight: 52 }}
          >
            <span className="text-[13px] font-semibold text-foreground">{a.name}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold self-center"
              style={{ background: `${PRIMARY}14`, color: PRIMARY }}
            >
              {a.ageGroup}
            </span>
            <span className="text-[13px] font-mono text-foreground">{a.seasonsInProgram}</span>
            <span className="flex items-center gap-1"><TrendArrow trend={a.ballHandling} /></span>
            <span className="flex items-center gap-1"><TrendArrow trend={a.shooting} /></span>
            <span className="flex items-center gap-1"><TrendArrow trend={a.defense} /></span>
            <span className="flex items-center gap-1"><TrendArrow trend={a.attendance} /></span>
            <span>
              {a.idpActive
                ? <CheckCircle2 className="w-4 h-4" style={{ color: SUCCESS }} />
                : <span className="text-[11px] text-muted-foreground">—</span>
              }
            </span>
            <Link href={`/app/player`} asChild>
              <a
                className="text-[12px] font-medium flex items-center gap-0.5"
                style={{ color: PRIMARY }}
              >
                Profile <ChevronRight className="w-3 h-3" />
              </a>
            </Link>
          </div>

          {/* Mobile card */}
          <div className="md:hidden p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold text-foreground">{a.name}</div>
                <div className="text-[11px] text-muted-foreground">{a.ageGroup} · {a.seasonsInProgram} season{a.seasonsInProgram !== 1 ? "s" : ""}</div>
              </div>
              {a.idpActive && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: SUCCESS }} />}
            </div>
            <div className="grid grid-cols-4 gap-2 text-[12px]">
              {[
                { label: "Ball", trend: a.ballHandling },
                { label: "Shot", trend: a.shooting },
                { label: "Def",  trend: a.defense },
                { label: "Att",  trend: a.attendance },
              ].map(({ label, trend }) => (
                <div key={label} className="flex flex-col items-center gap-0.5">
                  <TrendArrow trend={trend} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {sorted.length === 0 && (
        <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
          No athletes match your filters.
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 2: Retention Spotlight                                              */
/* -------------------------------------------------------------------------- */

const SPOTLIGHT_CONFIG = {
  tenure:   { label: "Longest Tenure",  color: PRIMARY, icon: <Star    className="w-3.5 h-3.5" /> },
  improved: { label: "Most Improved",   color: SUCCESS, icon: <TrendingUp className="w-3.5 h-3.5" /> },
  "at-risk":{ label: "Churn Risk",      color: DANGER,  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
} as const;

function RetentionSpotlight() {
  const engagementColor = (eng: SpotlightAthlete["parentEngagement"]) => {
    if (eng === "high")   return SUCCESS;
    if (eng === "medium") return WARNING;
    return DANGER;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[15px] font-bold text-foreground">Retention Spotlight</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SPOTLIGHT_ATHLETES.map((athlete) => {
          const cfg = SPOTLIGHT_CONFIG[athlete.spotlight];
          return (
            <div key={athlete.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: `${cfg.color}14`, color: cfg.color, border: `1.5px solid ${cfg.color}28` }}
                  >
                    {athlete.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">{athlete.name}</div>
                    <div className="text-[11px] text-muted-foreground">{athlete.ageGroup}</div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0"
                  style={{ background: `${cfg.color}14`, color: cfg.color }}
                >
                  {cfg.icon}
                  {cfg.label}
                </div>
              </div>

              {/* Seasons badge */}
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                >
                  {athlete.seasonsInProgram} Season{athlete.seasonsInProgram !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Sparklines */}
              <div className="space-y-3">
                {athlete.skillSparklines.map((s) => (
                  <SeasonSparkline
                    key={s.label}
                    label={s.label}
                    season1={s.season1}
                    season2={s.season2}
                    color={s.color}
                  />
                ))}
              </div>

              {/* Achievement */}
              <div
                className="rounded-lg p-3 text-[12px] leading-snug"
                style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}
              >
                {athlete.achievement}
              </div>

              {/* Footer metadata */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Parent engagement:</span>
                  <span className="font-semibold" style={{ color: engagementColor(athlete.parentEngagement) }}>
                    {athlete.parentEngagement.charAt(0).toUpperCase() + athlete.parentEngagement.slice(1)}
                  </span>
                </div>
                {athlete.reEnrolled
                  ? <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: `${SUCCESS}14`, color: SUCCESS }}>Re-enrolled</span>
                  : <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: `${WARNING}14`, color: WARNING }}>Not re-enrolled</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 3: Age Progression View                                            */
/* -------------------------------------------------------------------------- */

const READINESS_SCORE_COLOR = (score: number) => {
  if (score >= 80) return SUCCESS;
  if (score >= 60) return WARNING;
  return DANGER;
};

const REC_CONFIG = {
  strong:      { label: "Strong recommend",     color: SUCCESS },
  conditional: { label: "Conditional advance",  color: WARNING },
  "not-ready": { label: "Not yet ready",         color: DANGER  },
} as const;

function AgeProgressionView() {
  function handleAdvancement(name: string) {
    toast.success(`Advancement recommendation submitted for ${name}`);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[15px] font-bold text-foreground">Age Progression — 15U → 17U Candidates</h2>
      </div>

      <div className="text-[13px] text-muted-foreground">
        Players showing readiness signals for advancement based on skill velocity, attendance, coachability, and coach recommendation.
      </div>

      <div className="space-y-3">
        {ADVANCEMENT_CANDIDATES.map((candidate) => {
          const recCfg = REC_CONFIG[candidate.coachRecommendation];
          const readColor = READINESS_SCORE_COLOR(candidate.readinessScore);
          return (
            <div key={candidate.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Identity */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: `${PRIMARY}14`, color: PRIMARY }}
                  >
                    {candidate.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-foreground">{candidate.name}</div>
                    <div className="text-[11px] text-muted-foreground">{candidate.currentGroup} · Att. {candidate.attendanceRate}%</div>
                  </div>
                </div>

                {/* Readiness score */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[28px] font-bold font-mono leading-none" style={{ color: readColor }}>
                      {candidate.readinessScore}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Readiness</div>
                  </div>

                  {/* Coach recommendation badge */}
                  <span
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap"
                    style={{ background: `${recCfg.color}14`, color: recCfg.color }}
                  >
                    {recCfg.label}
                  </span>

                  {/* Action */}
                  {candidate.coachRecommendation !== "not-ready" && (
                    <button
                      onClick={() => handleAdvancement(candidate.name)}
                      className="rounded-lg px-3 py-2 text-[12px] font-semibold border border-border hover:border-[oklch(0.72_0.18_290_/_0.4)] transition-all shrink-0"
                      style={{ minHeight: 36 }}
                    >
                      Recommend
                    </button>
                  )}
                </div>
              </div>

              {/* Coachability flags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {candidate.coachabilityFlags.map((flag, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-1 text-[11px]"
                    style={{ background: "oklch(0.55 0.02 260 / 0.07)", color: "oklch(0.65 0.02 260)" }}
                  >
                    {flag}
                  </span>
                ))}
                <span className="text-[11px] text-muted-foreground self-center ml-1">· Rec by {candidate.coachName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Section 4: Program Alumni                                                  */
/* -------------------------------------------------------------------------- */

const TIER_COLOR: Record<string, string> = {
  Elite:       PRIMARY,
  Development: SUCCESS,
  Foundation:  WARNING,
};

function ProgramAlumni() {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
        <h2 className="text-[15px] font-bold text-foreground">Program Alumni</h2>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: `${PRIMARY}14`, color: PRIMARY }}
        >
          {ALUMNI.length} graduated
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {ALUMNI.map((alum) => {
            const tierColor = TIER_COLOR[alum.finalSkillTier] ?? "oklch(0.55 0.02 260)";
            return (
              <div key={alum.id} className="px-4 py-3 flex items-center gap-4" style={{ minHeight: 60 }}>
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0"
                  style={{ background: "oklch(0.55 0.02 260 / 0.08)", color: "oklch(0.65 0.02 260)" }}
                >
                  {alum.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-foreground">{alum.name}</span>
                    <span className="text-[11px] text-muted-foreground">{alum.yearsInProgram} yr · {alum.graduatedSeason}</span>
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {alum.positions.join(", ")}
                    {alum.outcome && (
                      <span className="ml-2 text-foreground">· {alum.outcome}</span>
                    )}
                  </div>
                </div>

                {/* Tier badge */}
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
                  style={{ background: `${tierColor}14`, color: tierColor }}
                >
                  {alum.finalSkillTier}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Main export                                                                 */
/* -------------------------------------------------------------------------- */

export default function RosterIntelligencePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ageFilter, setAgeFilter]     = useState<string>("all");

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <PageHeader
          eyebrow="Director · Roster Intelligence"
          title="Multi-Season Athlete Intelligence"
          subtitle="Development trajectories, retention signals, and age progression across seasons."
        />

        {/* Header controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search athlete…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[oklch(0.72_0.18_290_/_0.5)] transition-colors"
            />
          </div>

          {/* Age group filter */}
          <div className="flex gap-1.5">
            {["all", "15U", "17U"].map(val => (
              <button
                key={val}
                onClick={() => setAgeFilter(val)}
                className="rounded-lg px-3 py-2 text-[12px] font-medium border transition-all"
                style={{
                  minHeight: 40,
                  background: ageFilter === val ? `${PRIMARY}14` : undefined,
                  color: ageFilter === val ? PRIMARY : "oklch(0.55 0.02 260)",
                  borderColor: ageFilter === val ? `${PRIMARY}40` : "oklch(0.55 0.02 260 / 0.20)",
                }}
              >
                {val === "all" ? "All Ages" : val}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
            <h2 className="text-[15px] font-bold text-foreground">Multi-Season Development Table</h2>
            <span className="text-[12px] text-muted-foreground">Last 3 seasons</span>
          </div>
          <MultiSeasonTable searchQuery={searchQuery} ageFilter={ageFilter} />
        </section>

        <RetentionSpotlight />
        <AgeProgressionView />
        <ProgramAlumni />
      </div>
    </AppShell>
  );
}
