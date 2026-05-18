/**
 * core-development.ts
 * Shared typed mock data for player development, assessment, milestones,
 * coach records, and recruiter activity. Used across all new experience pages.
 */

/* -------------------------------------------------------------------------- */
/* Skills                                                                       */
/* -------------------------------------------------------------------------- */

export type SkillKey =
  | "Ball Handling"
  | "Shooting"
  | "Finishing"
  | "Court Vision"
  | "Defense"
  | "Rebounding"
  | "Screen Setting"
  | "Off-Ball Movement";

export const SKILL_KEYS: SkillKey[] = [
  "Ball Handling",
  "Shooting",
  "Finishing",
  "Court Vision",
  "Defense",
  "Rebounding",
  "Screen Setting",
  "Off-Ball Movement",
];

export interface SkillScore {
  skill: SkillKey;
  score: number; // 1–10
  prev: number;
  delta: number;
  percentile: number;
  velocity: number; // points per 30-day window
}

/* -------------------------------------------------------------------------- */
/* Current player                                                               */
/* -------------------------------------------------------------------------- */

export interface PlayerRecord {
  id: string;
  name: string;
  firstName: string;
  position: string;
  gradYear: number;
  teamName: string;
  coachName: string;
  coachId: string;
  avatarInitials: string;
  vdvStatus: "verified" | "in-progress" | "not-started";
  vdvCycle: number; // which VDV cycle (1-based)
  joinedDate: string;
}

export const CURRENT_PLAYER: PlayerRecord = {
  id: "player-001",
  name: "Marcus Johnson",
  firstName: "Marcus",
  position: "Point Guard",
  gradYear: 2026,
  teamName: "Elite Select 17U",
  coachName: "Coach Rivera",
  coachId: "coach-001",
  avatarInitials: "MJ",
  vdvStatus: "verified",
  vdvCycle: 3,
  joinedDate: "2024-09-01",
};

/* -------------------------------------------------------------------------- */
/* Assessment history                                                           */
/* -------------------------------------------------------------------------- */

export interface Assessment {
  id: string;
  date: string;
  coachId: string;
  coachName: string;
  skills: SkillScore[];
  note: string;
  filmClipIds: string[];
  vdvContributing: boolean;
}

export const CURRENT_SKILLS: SkillScore[] = [
  { skill: "Ball Handling",     score: 8, prev: 6, delta: 2, percentile: 84, velocity: 0.8 },
  { skill: "Shooting",          score: 7, prev: 6, delta: 1, percentile: 71, velocity: 0.4 },
  { skill: "Finishing",         score: 7, prev: 5, delta: 2, percentile: 68, velocity: 0.7 },
  { skill: "Court Vision",      score: 9, prev: 7, delta: 2, percentile: 91, velocity: 0.9 },
  { skill: "Defense",           score: 6, prev: 5, delta: 1, percentile: 55, velocity: 0.3 },
  { skill: "Rebounding",        score: 5, prev: 4, delta: 1, percentile: 42, velocity: 0.2 },
  { skill: "Screen Setting",    score: 6, prev: 5, delta: 1, percentile: 48, velocity: 0.3 },
  { skill: "Off-Ball Movement", score: 7, prev: 6, delta: 1, percentile: 63, velocity: 0.5 },
];

export const ASSESSMENT_HISTORY: Assessment[] = [
  {
    id: "a-001",
    date: "2026-05-01",
    coachId: "coach-001",
    coachName: "Coach Rivera",
    skills: CURRENT_SKILLS,
    note: "Marcus showed elite change-of-direction in the 5-on-5 sets. His left-hand finish off the dribble penetration is now automatic — saw it 4× in 10 minutes. Court vision continues to be a separator; his skip pass to the corner found shooters a half-second before the defense rotated.",
    filmClipIds: ["clip-101", "clip-102", "clip-104"],
    vdvContributing: true,
  },
  {
    id: "a-002",
    date: "2026-02-15",
    coachId: "coach-001",
    coachName: "Coach Rivera",
    skills: [
      { skill: "Ball Handling",     score: 6, prev: 5, delta: 1, percentile: 65, velocity: 0.4 },
      { skill: "Shooting",          score: 6, prev: 5, delta: 1, percentile: 60, velocity: 0.3 },
      { skill: "Finishing",         score: 5, prev: 4, delta: 1, percentile: 50, velocity: 0.4 },
      { skill: "Court Vision",      score: 7, prev: 6, delta: 1, percentile: 78, velocity: 0.5 },
      { skill: "Defense",           score: 5, prev: 4, delta: 1, percentile: 44, velocity: 0.2 },
      { skill: "Rebounding",        score: 4, prev: 4, delta: 0, percentile: 38, velocity: 0.0 },
      { skill: "Screen Setting",    score: 5, prev: 5, delta: 0, percentile: 40, velocity: 0.1 },
      { skill: "Off-Ball Movement", score: 6, prev: 5, delta: 1, percentile: 55, velocity: 0.3 },
    ],
    note: "Good improvement on ball handling under pressure in 1-on-1 series. Still need more reps on catch-and-shoot off screens — two misses due to rhythm timing, not mechanics.",
    filmClipIds: ["clip-090"],
    vdvContributing: true,
  },
  {
    id: "a-003",
    date: "2025-11-20",
    coachId: "coach-001",
    coachName: "Coach Rivera",
    skills: [
      { skill: "Ball Handling",     score: 5, prev: 5, delta: 0, percentile: 52, velocity: 0.2 },
      { skill: "Shooting",          score: 5, prev: 5, delta: 0, percentile: 50, velocity: 0.1 },
      { skill: "Finishing",         score: 4, prev: 4, delta: 0, percentile: 40, velocity: 0.2 },
      { skill: "Court Vision",      score: 6, prev: 6, delta: 0, percentile: 68, velocity: 0.3 },
      { skill: "Defense",           score: 4, prev: 4, delta: 0, percentile: 38, velocity: 0.1 },
      { skill: "Rebounding",        score: 4, prev: 4, delta: 0, percentile: 35, velocity: 0.0 },
      { skill: "Screen Setting",    score: 5, prev: 5, delta: 0, percentile: 38, velocity: 0.0 },
      { skill: "Off-Ball Movement", score: 5, prev: 5, delta: 0, percentile: 47, velocity: 0.2 },
    ],
    note: "Baseline assessment at season start. Marcus shows natural instincts — court vision is already above average. Focus areas for the season: finishing at the rim and defensive footwork.",
    filmClipIds: [],
    vdvContributing: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Milestones                                                                   */
/* -------------------------------------------------------------------------- */

export type MilestoneStatus = "earned" | "upcoming";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: "development" | "performance" | "leadership" | "academic" | "recruiting";
  status: MilestoneStatus;
  earnedDate?: string;
  verifier?: string;
  criteria: string;
  progress?: number; // 0–100 for upcoming milestones
  icon: string; // emoji or identifier
}

export const PLAYER_MILESTONES: Milestone[] = [
  {
    id: "m-001",
    title: "VDV Verified",
    description: "Coach-verified improvement across 2+ assessment cycles in a 90-day window.",
    category: "development",
    status: "earned",
    earnedDate: "2026-05-01",
    verifier: "Coach Rivera",
    criteria: "2+ assessment cycles with positive delta, within 90 days",
    icon: "shield-check",
  },
  {
    id: "m-002",
    title: "Elite Ball Handler",
    description: "Ball handling score reached 8+ in a verified assessment.",
    category: "performance",
    status: "earned",
    earnedDate: "2026-05-01",
    verifier: "Coach Rivera",
    criteria: "Ball Handling ≥ 8 in a coach-verified assessment",
    icon: "basketball",
  },
  {
    id: "m-003",
    title: "Court Vision Elite",
    description: "Court vision score reached 9+ — top 10% of program players.",
    category: "performance",
    status: "earned",
    earnedDate: "2026-05-01",
    verifier: "Coach Rivera",
    criteria: "Court Vision ≥ 9, top 10th percentile within program",
    icon: "eye",
  },
  {
    id: "m-004",
    title: "3-Cycle Improver",
    description: "Showed positive skill delta in three consecutive assessment cycles.",
    category: "development",
    status: "earned",
    earnedDate: "2026-05-01",
    verifier: "Coach Rivera",
    criteria: "Positive delta in 3 consecutive coach assessments",
    icon: "trending-up",
  },
  {
    id: "m-005",
    title: "Film Student",
    description: "Completed 10+ film study sessions with coach annotations.",
    category: "development",
    status: "earned",
    earnedDate: "2026-03-15",
    verifier: "HoopsOS System",
    criteria: "10 film sessions with at least 1 coach annotation each",
    icon: "film",
  },
  {
    id: "m-006",
    title: "Full Season Complete",
    description: "Completed a full season with zero unexcused absences.",
    category: "leadership",
    status: "earned",
    earnedDate: "2026-04-30",
    verifier: "Coach Rivera",
    criteria: "100% attendance over a full 12-week season",
    icon: "calendar-check",
  },
  {
    id: "m-007",
    title: "Recruiter Spotlight",
    description: "Profile viewed by 10+ college coaches in a 30-day window.",
    category: "recruiting",
    status: "earned",
    earnedDate: "2026-04-18",
    verifier: "HoopsOS System",
    criteria: "≥10 unique college coach profile views in 30 days",
    icon: "university",
  },
  {
    id: "m-008",
    title: "IDP Goal Crusher",
    description: "Achieved all three IDP goals set at the start of the season.",
    category: "development",
    status: "earned",
    earnedDate: "2026-04-01",
    verifier: "Coach Rivera",
    criteria: "All 3 IDP goals marked complete by assigned coach",
    icon: "target",
  },
  // Upcoming
  {
    id: "m-009",
    title: "Defensive Stopper",
    description: "Defense score reaches 8+ in a verified assessment.",
    category: "performance",
    status: "upcoming",
    criteria: "Defense ≥ 8 in coach-verified assessment",
    progress: 60,
    icon: "shield",
  },
  {
    id: "m-010",
    title: "Scholarship Offer",
    description: "Receive a verified scholarship offer from any division program.",
    category: "recruiting",
    status: "upcoming",
    criteria: "Verified scholarship offer logged in HoopsOS recruiting module",
    progress: 40,
    icon: "award",
  },
  {
    id: "m-011",
    title: "Coach's Choice",
    description: "Recognized by coaching staff as player of the month.",
    category: "leadership",
    status: "upcoming",
    criteria: "Coach selects player for monthly recognition",
    progress: 20,
    icon: "star",
  },
];

/* -------------------------------------------------------------------------- */
/* Coach record                                                                 */
/* -------------------------------------------------------------------------- */

export interface CoachRecord {
  id: string;
  name: string;
  title: string;
  programName: string;
  seasons: number;
  playersCoached: number;
  vdvRate: number; // 0–1
  philosophy: string;
  observationQualityScore: number; // 0–100
}

export const CURRENT_COACH: CoachRecord = {
  id: "coach-001",
  name: "Coach Rivera",
  title: "Head Coach",
  programName: "Elite Select Basketball",
  seasons: 4,
  playersCoached: 94,
  vdvRate: 0.71,
  philosophy:
    "I believe every player has a ceiling they haven't touched yet. My job is to give them specific, honest feedback — backed by film — so they can see exactly what to work on and why it matters. Development is a contract between coach and player.",
  observationQualityScore: 84,
};

/* -------------------------------------------------------------------------- */
/* Recruiter activity                                                           */
/* -------------------------------------------------------------------------- */

export type Division = "D1" | "D2" | "D3" | "NAIA" | "JUCO";

export interface RecruiterView {
  id: string;
  school: string;
  division: Division;
  coachName: string;
  date: string;
  contentViewed: string[];
  durationSeconds: number;
  status: "viewed" | "pending" | "access-requested";
}

export const RECRUITER_VIEWS: RecruiterView[] = [
  {
    id: "rv-001",
    school: "University of Michigan",
    division: "D1",
    coachName: "Coach Thompson",
    date: "2026-05-14",
    contentViewed: ["Development Resume", "Assessment History", "Film Highlights"],
    durationSeconds: 342,
    status: "viewed",
  },
  {
    id: "rv-002",
    school: "Duke University",
    division: "D1",
    coachName: "Coach Williams",
    date: "2026-05-12",
    contentViewed: ["Assessment History", "VDV Score"],
    durationSeconds: 187,
    status: "viewed",
  },
  {
    id: "rv-003",
    school: "Gonzaga University",
    division: "D1",
    coachName: "Coach Martinez",
    date: "2026-05-10",
    contentViewed: ["Development Resume", "Film Highlights", "IDP Goals", "Assessment History"],
    durationSeconds: 521,
    status: "access-requested",
  },
  {
    id: "rv-004",
    school: "Grand Valley State",
    division: "D2",
    coachName: "Coach Johnson",
    date: "2026-05-08",
    contentViewed: ["Assessment History", "VDV Score", "Film Highlights"],
    durationSeconds: 298,
    status: "viewed",
  },
  {
    id: "rv-005",
    school: "Dayton University",
    division: "D1",
    coachName: "Coach Lee",
    date: "2026-05-05",
    contentViewed: ["Development Resume"],
    durationSeconds: 94,
    status: "viewed",
  },
  {
    id: "rv-006",
    school: "Ferris State University",
    division: "D2",
    coachName: "Coach Brown",
    date: "2026-04-30",
    contentViewed: ["Assessment History", "IDP Goals"],
    durationSeconds: 156,
    status: "viewed",
  },
  {
    id: "rv-007",
    school: "Hope College",
    division: "D3",
    coachName: "Coach Davis",
    date: "2026-04-28",
    contentViewed: ["Development Resume", "Film Highlights"],
    durationSeconds: 203,
    status: "viewed",
  },
  {
    id: "rv-008",
    school: "Kalamazoo College",
    division: "D3",
    coachName: "Coach Wilson",
    date: "2026-04-25",
    contentViewed: ["Assessment History"],
    durationSeconds: 78,
    status: "viewed",
  },
  {
    id: "rv-009",
    school: "Indiana University",
    division: "D1",
    coachName: "Coach Garcia",
    date: "2026-04-22",
    contentViewed: ["Development Resume", "VDV Score", "Assessment History", "Film Highlights"],
    durationSeconds: 612,
    status: "access-requested",
  },
  {
    id: "rv-010",
    school: "Purdue University",
    division: "D1",
    coachName: "Coach Miller",
    date: "2026-04-18",
    contentViewed: ["Development Resume", "Assessment History"],
    durationSeconds: 245,
    status: "viewed",
  },
];
