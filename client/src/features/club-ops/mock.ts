// Complete plans catalog (the plans array in data.ts only has Team Pro; we keep the canonical three here).
export type Plan = {
  id: string;
  name: string;
  monthly: number;
  annual: number;
  perSeat?: boolean;
  features: string[];
  highlight?: string;
};

export const fullPlans: Plan[] = [
  {
    id: "p_player",
    name: "Player Core",
    monthly: 19.99,
    annual: 199,
    highlight: "For the athlete",
    features: [
      "Daily WODs — adaptive to your level",
      "Unlimited AI feedback on uploads",
      "Skill-track progression + XP",
      "10 film assignments / month",
      "Included courses library",
      "Member pricing on Expert Marketplace",
    ],
  },
  {
    id: "p_coach",
    name: "Coach Core",
    monthly: 49.99,
    annual: 499,
    highlight: "For the individual coach",
    features: [
      "Full Coach HQ — compliance, queue, reviews",
      "Playbook Studio + Film Room (up to 1 team)",
      "Assignment composer + practice plan builder",
      "Included coach education library",
      "Direct 1-on-1 messaging with athletes",
    ],
  },
  {
    id: "p_team",
    name: "Team Pro",
    monthly: 9.99,
    annual: 99,
    perSeat: true,
    highlight: "For programs & organizations",
    features: [
      "Everything in Coach Core — per seat",
      "Seat-based · 20 seat minimum",
      "Athletes automatically get 50% off Player Core",
      "Team Film Room + shared Playbook",
      "Compliance dashboards + analytics",
      "SSO + priority support",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Development Timeline types (used by DevelopmentTimelinePage)
// ─────────────────────────────────────────────────────────────────────────────

export type TimelineEvent = {
  id: string;
  date: string;                // ISO date
  type: "assessment" | "milestone" | "idp_goal" | "observation" | "film" | "achievement" | "season_start" | "season_end";
  title: string;
  description?: string;
  coachNote?: string;
  significance?: "high" | "normal";
};

export type PlayerSeasonSummary = {
  seasonId: string;
  seasonLabel: string;         // "2023-24"
  skillLevels: Record<string, number>;  // skill name → 1-5
  idpGoalsCompleted: number;
  idpGoalsTotal: number;
  wodCompletion: number;       // 0-1
  attendanceRate: number;      // 0-1
  coachSummary: string;
  milestone?: string;
};

export type PlayerSeasonArc = {
  playerId: string;
  playerName: string;
  seasons: PlayerSeasonSummary[];
};

const DEMO_SEASONS: PlayerSeasonSummary[] = [
  {
    seasonId: "2023-24",
    seasonLabel: "2023-24",
    skillLevels: { Shooting: 3, Finishing: 2, "Ball Handling": 3, Defense: 3, Footwork: 2 },
    idpGoalsCompleted: 3,
    idpGoalsTotal: 5,
    wodCompletion: 0.74,
    attendanceRate: 0.88,
    coachSummary: "Strong defensive improvements. Finishing and footwork are the next frontier — the foundation is there.",
    milestone: "First varsity start · March 2024",
  },
  {
    seasonId: "2024-25",
    seasonLabel: "2024-25",
    skillLevels: { Shooting: 4, Finishing: 3, "Ball Handling": 4, Defense: 4, Footwork: 3 },
    idpGoalsCompleted: 4,
    idpGoalsTotal: 5,
    wodCompletion: 0.86,
    attendanceRate: 0.94,
    coachSummary: "Remarkable growth across the board. Contact finishing is now a strength. Ball handling under pressure has improved significantly.",
    milestone: "IDP completion award · Season-end 2025",
  },
];

const DEMO_TIMELINE: TimelineEvent[] = [
  { id: "te1",  date: "2023-09-15", type: "season_start",  title: "Season 2023-24 begins", significance: "high" },
  { id: "te2",  date: "2023-10-04", type: "assessment",    title: "Fall skill assessment", description: "Baseline scores recorded across 5 categories." },
  { id: "te3",  date: "2023-10-18", type: "idp_goal",      title: "IDP created — 5 focus areas", description: "Coach set targets for Finishing, Footwork, and Ball Handling.", coachNote: "This player's instincts are elite. The physical tools need to catch up to the IQ." },
  { id: "te4",  date: "2024-01-22", type: "film",          title: "Film study — defensive sets", description: "Assigned 3 clips from Toms River game." },
  { id: "te5",  date: "2024-03-05", type: "milestone",     title: "First varsity start", significance: "high", coachNote: "Earned it." },
  { id: "te6",  date: "2024-05-10", type: "achievement",   title: "3 of 5 IDP goals completed", significance: "high" },
  { id: "te7",  date: "2024-09-01", type: "season_start",  title: "Season 2024-25 begins", significance: "high" },
  { id: "te8",  date: "2024-10-12", type: "assessment",    title: "Fall skill assessment", description: "Scores up across all categories from prior year." },
  { id: "te9",  date: "2025-01-14", type: "observation",   title: "Film note — contact finishing", coachNote: "The Mikan drill work is showing up in live reps. Keep attacking." },
  { id: "te10", date: "2025-04-28", type: "milestone",     title: "IDP milestone — Contact Finishing 5→7", significance: "high" },
  { id: "te11", date: "2025-06-01", type: "season_end",    title: "Season 2024-25 complete", significance: "high" },
];

export function getPlayerSeasonArc(playerId: string): PlayerSeasonArc {
  return { playerId, playerName: "Marcus Davis", seasons: DEMO_SEASONS };
}

export function getPlayerTimeline(playerId: string): TimelineEvent[] {
  return DEMO_TIMELINE;
}

// ─────────────────────────────────────────────────────────────────────────────
// Season management types (used by SeasonManagementPage)
// ─────────────────────────────────────────────────────────────────────────────

export type SeasonType = "fall" | "spring" | "summer" | "winter";

export type Season = {
  id: string;
  name: string;
  type: SeasonType;
  status: "active" | "upcoming" | "completed";
  startDate: string;   // ISO date
  endDate: string;
  playerCount: number;
  completionRate: number;  // 0-1
};

export const seasons: Season[] = [
  { id: "season_fall_2024",   name: "Fall 2024",   type: "fall",   status: "completed", startDate: "2024-09-01", endDate: "2024-12-20", playerCount: 42, completionRate: 0.88 },
  { id: "season_spring_2025", name: "Spring 2025", type: "spring", status: "completed", startDate: "2025-01-06", endDate: "2025-05-30", playerCount: 47, completionRate: 0.91 },
  { id: "season_fall_2025",   name: "Fall 2025",   type: "fall",   status: "active",    startDate: "2025-09-01", endDate: "2025-12-19", playerCount: 50, completionRate: 0.74 },
  { id: "season_spring_2026", name: "Spring 2026", type: "spring", status: "upcoming",  startDate: "2026-01-05", endDate: "2026-06-12", playerCount: 0,  completionRate: 0    },
];

export const currentSeason: Season = seasons.find((s) => s.status === "active")!;

type SeasonStats = {
  avgSkillDelta: number;
  avgWodCompletion: number;
  idpGoalsCompleted: number;
  idpGoalsTotal: number;
  playerRetentionRate: number;
};

type SeasonComparison = {
  seasonA: { name: string; stats: SeasonStats };
  seasonB: { name: string; stats: SeasonStats };
  deltas: {
    avgSkillDelta: number;
    avgWodCompletion: number;
    idpCompletionRate: number;
    playerRetentionRate: number;
  };
  summary: string;
};

export function getSeasonYearOverYear(seasonAId: string, seasonBId: string): SeasonComparison {
  const a = seasons.find((s) => s.id === seasonAId) ?? seasons[0];
  const b = seasons.find((s) => s.id === seasonBId) ?? seasons[1];
  const statsA: SeasonStats = { avgSkillDelta: 1.4, avgWodCompletion: 0.82, idpGoalsCompleted: 38, idpGoalsTotal: 47, playerRetentionRate: 0.87 };
  const statsB: SeasonStats = { avgSkillDelta: 1.8, avgWodCompletion: 0.86, idpGoalsCompleted: 43, idpGoalsTotal: 50, playerRetentionRate: 0.91 };
  return {
    seasonA: { name: a.name, stats: statsA },
    seasonB: { name: b.name, stats: statsB },
    deltas: {
      avgSkillDelta:      +(statsB.avgSkillDelta - statsA.avgSkillDelta).toFixed(2),
      avgWodCompletion:   +(statsB.avgWodCompletion - statsA.avgWodCompletion).toFixed(2),
      idpCompletionRate:  +((statsB.idpGoalsCompleted / statsB.idpGoalsTotal) - (statsA.idpGoalsCompleted / statsA.idpGoalsTotal)).toFixed(2),
      playerRetentionRate:+(statsB.playerRetentionRate - statsA.playerRetentionRate).toFixed(2),
    },
    summary: `${b.name} showed improvement over ${a.name} across all tracked development metrics.`,
  };
}
