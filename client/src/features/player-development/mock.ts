/* --- Types --- */

export type PlayerIDPStatus = "thriving" | "stale" | "restricted" | "missing-data" | "deadline-approaching";

export type EvidenceType = "film_clip" | "drill_result" | "wod_completion" | "coach_note" | "readiness_signal" | "assessment";

export type GoalStatus = "active" | "achieved" | "paused" | "dropped";

export type GoalRisk = "on-track" | "at-risk" | "overdue";

export type RecommendationType = "assign_drill" | "assign_film" | "schedule_checkin" | "modify_wod" | "add_coach_note";

export interface SkillArea {
  id: string;
  name: string;
  category: "offense" | "defense" | "physical";
  description: string;
}

export interface SkillRubricLevel {
  level: number;
  label: string;
  description: string;
}

export interface DevelopmentProfile {
  playerId: string;
  playerName: string;
  position: string;
  classYear: number;
  gradYear: number;
  status: PlayerIDPStatus;
  primaryGoalIds: string[];
  lastActivityDate: string;
  lastAssessmentDate: string;
  overallProgress: number;
  vdvStatus: "verified" | "in-progress" | "not-started";
  coachId: string;
  coachName: string;
}

export interface BaselineAssessment {
  id: string;
  playerId: string;
  date: string;
  coachId: string;
  coachName: string;
  scores: Record<string, number>;
  notes: string;
  filmClipIds: string[];
}

export interface DevelopmentGoal {
  id: string;
  playerId: string;
  skillAreaId: string;
  title: string;
  description: string;
  targetScore: number;
  baselineScore: number;
  currentScore: number;
  targetDate: string;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  status: GoalStatus;
  nextAction: string;
  confidence: "high" | "medium" | "low";
  evidenceIds: string[];
  prescriptionIds: string[];
}

export interface DevelopmentEvidence {
  id: string;
  playerId: string;
  goalId?: string;
  type: EvidenceType;
  date: string;
  title: string;
  summary: string;
  coachId?: string;
  coachName?: string;
  filmClipId?: string;
  aiConfidence?: number;
  drillName?: string;
  reps?: string;
  completionPct?: number;
  sentiment?: "positive" | "neutral" | "concern";
  score?: number;
  readinessStatus?: "READY" | "FLAGGED" | "RESTRICTED" | "UNKNOWN";
}

export interface FilmClipEvidence {
  id: string;
  title: string;
  duration: number;
  linkedGoalId?: string;
  annotations: string[];
  aiTags: string[];
  aiConfidence: number;
}

export interface DrillPrescription {
  id: string;
  playerId: string;
  goalId: string;
  drillName: string;
  reps: string;
  frequency: string;
  prescribedBy: string;
  prescribedAt: string;
  dueDate?: string;
  status: "active" | "completed" | "skipped";
  completionRate: number;
}

export interface DevelopmentRecommendation {
  type: RecommendationType;
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  actionLabel: string;
  actionHref: string;
  goalId?: string;
}

/* --- Skill Areas --- */

export const SKILL_AREAS: SkillArea[] = [
  {
    id: "sa-bh",
    name: "Ball Handling",
    category: "offense",
    description: "Ability to dribble with control, change direction, and protect the ball under pressure.",
  },
  {
    id: "sa-sh",
    name: "Shooting",
    category: "offense",
    description: "Consistency and mechanics of jump shots, catch-and-shoot, and off-the-dribble attempts.",
  },
  {
    id: "sa-fi",
    name: "Finishing",
    category: "offense",
    description: "Ability to convert at the rim with both hands through contact and against defenders.",
  },
  {
    id: "sa-cv",
    name: "Court Vision",
    category: "offense",
    description: "Reading the defense, making on-time passes, and creating scoring opportunities for teammates.",
  },
  {
    id: "sa-de",
    name: "Defense",
    category: "defense",
    description: "On-ball and help-side positioning, closeouts, and ability to contest shots effectively.",
  },
  {
    id: "sa-re",
    name: "Rebounding",
    category: "physical",
    description: "Boxing out, tracking the ball off the glass, and converting second-chance opportunities.",
  },
  {
    id: "sa-ss",
    name: "Screen Setting",
    category: "offense",
    description: "Setting legal, physical screens at the correct angle to free teammates.",
  },
  {
    id: "sa-ob",
    name: "Off-Ball Movement",
    category: "offense",
    description: "Cutting, relocating, and reading the ball handler to create open looks away from the ball.",
  },
];

/* --- Skill Rubric --- */

export const SKILL_RUBRIC: SkillRubricLevel[] = [
  { level: 1, label: "Beginner", description: "Fundamental mechanics are absent; skill requires full coaching support to execute." },
  { level: 2, label: "Beginner", description: "Occasional correct execution in isolated drills, but no consistency or transfer to live play." },
  { level: 3, label: "Developing", description: "Demonstrates the basic pattern in controlled settings with moderate coaching cues." },
  { level: 4, label: "Developing", description: "Executes reliably in drills; beginning to show the skill in low-pressure game situations." },
  { level: 5, label: "Capable", description: "Consistent in practice; applies the skill in games against average competition." },
  { level: 6, label: "Capable", description: "Solid in most game situations; lapses occur under high pressure or elite opposition." },
  { level: 7, label: "Proficient", description: "Reliable and efficient in competitive settings; minimal coaching reminders needed." },
  { level: 8, label: "Proficient", description: "High-level execution in contested situations; peers and opponents notice the skill." },
  { level: 9, label: "Advanced", description: "Near-elite execution; can weaponize the skill as a consistent advantage in games." },
  { level: 10, label: "Elite", description: "Exceptional, consistent mastery that separates the player at any level of competition." },
];

/* --- Development Profiles --- */

export const DEVELOPMENT_PROFILES: DevelopmentProfile[] = [
  {
    playerId: "a_2",
    playerName: "Marcus Williams",
    position: "PG",
    classYear: 2026,
    gradYear: 2026,
    status: "thriving",
    primaryGoalIds: ["goal-marcus-bh", "goal-marcus-cv", "goal-marcus-de"],
    lastActivityDate: "2026-05-16",
    lastAssessmentDate: "2026-04-28",
    overallProgress: 78,
    vdvStatus: "verified",
    coachId: "coach-1",
    coachName: "Coach Rivera",
  },
  {
    playerId: "a_1",
    playerName: "Jalen Carter",
    position: "SG",
    classYear: 2027,
    gradYear: 2027,
    status: "deadline-approaching",
    primaryGoalIds: ["goal-jalen-shooting", "goal-jalen-finishing"],
    lastActivityDate: "2026-05-14",
    lastAssessmentDate: "2026-04-20",
    overallProgress: 52,
    vdvStatus: "in-progress",
    coachId: "coach-1",
    coachName: "Coach Rivera",
  },
  {
    playerId: "a_4",
    playerName: "Tyrese Brooks",
    position: "SF",
    classYear: 2026,
    gradYear: 2026,
    status: "stale",
    primaryGoalIds: ["goal-tyrese-de", "goal-tyrese-ob"],
    lastActivityDate: "2026-05-08",
    lastAssessmentDate: "2026-04-15",
    overallProgress: 41,
    vdvStatus: "in-progress",
    coachId: "coach-2",
    coachName: "Coach Mitchell",
  },
  {
    playerId: "a_5",
    playerName: "Isaiah Moore",
    position: "PF",
    classYear: 2027,
    gradYear: 2027,
    status: "restricted",
    primaryGoalIds: ["goal-isaiah-re"],
    lastActivityDate: "2026-05-10",
    lastAssessmentDate: "2026-04-10",
    overallProgress: 18,
    vdvStatus: "not-started",
    coachId: "coach-2",
    coachName: "Coach Mitchell",
  },
  {
    playerId: "a_7",
    playerName: "Miles Thompson",
    position: "PG",
    classYear: 2028,
    gradYear: 2028,
    status: "missing-data",
    primaryGoalIds: [],
    lastActivityDate: "2026-04-02",
    lastAssessmentDate: "",
    overallProgress: 0,
    vdvStatus: "not-started",
    coachId: "coach-1",
    coachName: "Coach Rivera",
  },
];

/* --- Development Goals --- */

export const DEVELOPMENT_GOALS: DevelopmentGoal[] = [
  {
    id: "goal-marcus-bh",
    playerId: "a_2",
    skillAreaId: "sa-bh",
    title: "Elite Ball Handling Under Pressure",
    description: "Develop the ability to break down defenders off the dribble with both hands in pick-and-roll and isolation sets.",
    targetScore: 9,
    baselineScore: 7,
    currentScore: 8.5,
    targetDate: "2026-07-01",
    createdAt: "2026-03-01",
    ownerId: "coach-1",
    ownerName: "Coach Rivera",
    status: "active",
    nextAction: "Add 2 more film reviews showing dribble penetration to hit the 4-clip monthly target.",
    confidence: "high",
    evidenceIds: ["ev-marcus-film-1", "ev-marcus-drill-1", "ev-marcus-wod-1"],
    prescriptionIds: ["rx-marcus-bh-1", "rx-marcus-bh-2"],
  },
  {
    id: "goal-marcus-cv",
    playerId: "a_2",
    skillAreaId: "sa-cv",
    title: "Advanced Court Vision & Playmaking",
    description: "Read second-side defenders and deliver skip passes consistently in transition and half-court offense.",
    targetScore: 10,
    baselineScore: 8,
    currentScore: 9,
    targetDate: "2026-08-15",
    createdAt: "2026-03-01",
    ownerId: "coach-1",
    ownerName: "Coach Rivera",
    status: "active",
    nextAction: "Review skip-pass film from the last scrimmage and annotate decision timing.",
    confidence: "high",
    evidenceIds: ["ev-marcus-film-2", "ev-marcus-note-1"],
    prescriptionIds: [],
  },
  {
    id: "goal-marcus-de",
    playerId: "a_2",
    skillAreaId: "sa-de",
    title: "Lockdown On-Ball Defense",
    description: "Improve lateral quickness and closeout technique to limit opponent field-goal percentage.",
    targetScore: 8,
    baselineScore: 5,
    currentScore: 6.5,
    targetDate: "2026-06-30",
    createdAt: "2026-03-15",
    ownerId: "coach-1",
    ownerName: "Coach Rivera",
    status: "active",
    nextAction: "Complete 3 closeout defensive drills this week and log results.",
    confidence: "medium",
    evidenceIds: ["ev-marcus-drill-2", "ev-marcus-assess-1"],
    prescriptionIds: [],
  },
  {
    id: "goal-jalen-shooting",
    playerId: "a_1",
    skillAreaId: "sa-sh",
    title: "Consistent Mid-Range & Catch-and-Shoot",
    description: "Build shot reliability off screens and catch-and-shoot situations from three key zones.",
    targetScore: 8,
    baselineScore: 5,
    currentScore: 6,
    targetDate: "2026-05-21",
    createdAt: "2026-02-15",
    ownerId: "coach-1",
    ownerName: "Coach Rivera",
    status: "active",
    nextAction: "Schedule check-in before deadline — shot mechanics remain inconsistent under game pressure.",
    confidence: "low",
    evidenceIds: ["ev-jalen-film-1", "ev-jalen-note-1"],
    prescriptionIds: ["rx-jalen-sh-1"],
  },
  {
    id: "goal-jalen-finishing",
    playerId: "a_1",
    skillAreaId: "sa-fi",
    title: "Left-Hand Finishing at the Rim",
    description: "Develop a reliable left-hand finish through traffic on drives from the right side.",
    targetScore: 8,
    baselineScore: 6,
    currentScore: 7,
    targetDate: "2026-07-01",
    createdAt: "2026-03-01",
    ownerId: "coach-1",
    ownerName: "Coach Rivera",
    status: "active",
    nextAction: "Log weekly Mikan drill completions and track left-hand conversion rate.",
    confidence: "medium",
    evidenceIds: ["ev-jalen-wod-1"],
    prescriptionIds: [],
  },
  {
    id: "goal-tyrese-de",
    playerId: "a_4",
    skillAreaId: "sa-de",
    title: "Help-Side Rotations & Closeouts",
    description: "Read ball movement from the weak side and execute timely rotations to contest shots without fouling.",
    targetScore: 8,
    baselineScore: 6,
    currentScore: 6,
    targetDate: "2026-06-15",
    createdAt: "2026-03-10",
    ownerId: "coach-2",
    ownerName: "Coach Mitchell",
    status: "active",
    nextAction: "Resume drill prescriptions after coach re-engagement conversation.",
    confidence: "low",
    evidenceIds: ["ev-tyrese-film-1"],
    prescriptionIds: ["rx-tyrese-de-1"],
  },
  {
    id: "goal-tyrese-ob",
    playerId: "a_4",
    skillAreaId: "sa-ob",
    title: "Off-Ball Cuts & Relocations",
    description: "Improve reading of the ball handler to time back-cuts and corner relocations in motion offense.",
    targetScore: 7,
    baselineScore: 5,
    currentScore: 5.5,
    targetDate: "2026-07-01",
    createdAt: "2026-03-10",
    ownerId: "coach-2",
    ownerName: "Coach Mitchell",
    status: "active",
    nextAction: "Add a coach note documenting current state before the next practice.",
    confidence: "low",
    evidenceIds: ["ev-tyrese-note-1"],
    prescriptionIds: [],
  },
  {
    id: "goal-isaiah-re",
    playerId: "a_5",
    skillAreaId: "sa-re",
    title: "Defensive Rebounding & Box-Out Discipline",
    description: "Establish consistent box-out positioning and secure defensive rebounds against physical post players.",
    targetScore: 7,
    baselineScore: 4,
    currentScore: 4.5,
    targetDate: "2026-07-01",
    createdAt: "2026-03-20",
    ownerId: "coach-2",
    ownerName: "Coach Mitchell",
    status: "paused",
    nextAction: "Revisit goal timeline once medical clearance is received.",
    confidence: "low",
    evidenceIds: ["ev-isaiah-ready-1", "ev-isaiah-note-1"],
    prescriptionIds: [],
  },
];

/* --- Development Evidence --- */

export const DEVELOPMENT_EVIDENCE: DevelopmentEvidence[] = [
  // Marcus — Ball Handling goal
  {
    id: "ev-marcus-film-1",
    playerId: "a_2",
    goalId: "goal-marcus-bh",
    type: "film_clip",
    date: "2026-05-15",
    title: "Pick-and-Roll Dribble Penetration",
    summary: "Marcus reads the hedge defender and successfully turns the corner with his left hand in three consecutive possessions.",
    filmClipId: "fc-marcus-bh-1",
    aiConfidence: 0.91,
  },
  {
    id: "ev-marcus-drill-1",
    playerId: "a_2",
    goalId: "goal-marcus-bh",
    type: "drill_result",
    date: "2026-05-13",
    title: "Two-Ball Dribbling Series",
    summary: "Completed full two-ball combo series: 4 sets × 45 seconds, 0 drops. Personal best.",
    drillName: "Two-Ball Dribbling Series",
    reps: "4×45s",
    completionPct: 100,
  },
  {
    id: "ev-marcus-wod-1",
    playerId: "a_2",
    goalId: "goal-marcus-bh",
    type: "wod_completion",
    date: "2026-05-16",
    title: "Ball Handling WOD — Week 10",
    summary: "Full WOD completed: cone dribble, crossover series, and live 1-on-1 reps.",
    drillName: "Ball Handling WOD",
    completionPct: 100,
  },
  // Marcus — Court Vision goal
  {
    id: "ev-marcus-film-2",
    playerId: "a_2",
    goalId: "goal-marcus-cv",
    type: "film_clip",
    date: "2026-05-14",
    title: "Skip Pass Decision — Scrimmage Highlight",
    summary: "Marcus identifies the weak-side corner opening and delivers a skip pass for an open three on back-to-back possessions.",
    filmClipId: "fc-marcus-cv-1",
    aiConfidence: 0.88,
  },
  {
    id: "ev-marcus-note-1",
    playerId: "a_2",
    goalId: "goal-marcus-cv",
    type: "coach_note",
    date: "2026-05-12",
    title: "Post-Practice Vision Note",
    summary: "Marcus's second-side reads have improved dramatically. Proactive ball movement is becoming a consistent habit.",
    coachId: "coach-1",
    coachName: "Coach Rivera",
    sentiment: "positive",
  },
  // Marcus — Defense goal
  {
    id: "ev-marcus-drill-2",
    playerId: "a_2",
    goalId: "goal-marcus-de",
    type: "drill_result",
    date: "2026-05-15",
    title: "Closeout & Recover Drill",
    summary: "8/10 closeouts landed in contest position without fouling. Improvement from 6/10 last week.",
    drillName: "Closeout & Recover",
    reps: "10 reps",
    completionPct: 80,
  },
  {
    id: "ev-marcus-assess-1",
    playerId: "a_2",
    goalId: "goal-marcus-de",
    type: "assessment",
    date: "2026-04-28",
    title: "Mid-Season Defense Assessment",
    summary: "Lateral quickness and on-ball positioning rated 6.5/10. Improvement trajectory is on track toward target of 8.",
    score: 6.5,
    coachId: "coach-1",
    coachName: "Coach Rivera",
  },
  // Jalen — Shooting goal
  {
    id: "ev-jalen-film-1",
    playerId: "a_1",
    goalId: "goal-jalen-shooting",
    type: "film_clip",
    date: "2026-05-12",
    title: "Off-Screen Shooting — Mixed Results",
    summary: "Jalen shows inconsistent footwork on catch-and-shoot: 3 of 5 attempts had late foot alignment. AI flagged early.",
    filmClipId: "fc-jalen-sh-1",
    aiConfidence: 0.79,
  },
  {
    id: "ev-jalen-note-1",
    playerId: "a_1",
    goalId: "goal-jalen-shooting",
    type: "coach_note",
    date: "2026-05-14",
    title: "Shooting Mechanics Concern",
    summary: "Shot mechanics breaking down under game-speed pressure. Elbow flying out on pull-up jumpers. Needs immediate correction before deadline.",
    coachId: "coach-1",
    coachName: "Coach Rivera",
    sentiment: "concern",
  },
  // Jalen — Finishing goal
  {
    id: "ev-jalen-wod-1",
    playerId: "a_1",
    goalId: "goal-jalen-finishing",
    type: "wod_completion",
    date: "2026-05-10",
    title: "Finishing WOD — Mikan & Euro Series",
    summary: "Completed Mikan drill and euro-step finishing series. Left-hand conversion: 14/20 (70%).",
    drillName: "Mikan & Euro Finishing Series",
    completionPct: 85,
  },
  // Tyrese — stale, old evidence
  {
    id: "ev-tyrese-film-1",
    playerId: "a_4",
    goalId: "goal-tyrese-de",
    type: "film_clip",
    date: "2026-05-07",
    title: "Defensive Rotation Review",
    summary: "Slow help-side rotation on baseline drive in first half. Closeout technique adequate but late.",
    filmClipId: "fc-tyrese-de-1",
    aiConfidence: 0.72,
  },
  {
    id: "ev-tyrese-note-1",
    playerId: "a_4",
    goalId: "goal-tyrese-ob",
    type: "coach_note",
    date: "2026-05-08",
    title: "Off-Ball Activity Check-In",
    summary: "Tyrese is moving well off ball in early sets but stops cutting when the offense stalls. Needs re-engagement.",
    coachId: "coach-2",
    coachName: "Coach Mitchell",
    sentiment: "neutral",
  },
  // Isaiah — restricted
  {
    id: "ev-isaiah-ready-1",
    playerId: "a_5",
    goalId: "goal-isaiah-re",
    type: "readiness_signal",
    date: "2026-05-10",
    title: "Readiness Check — Restricted",
    summary: "Player flagged as RESTRICTED by training staff. Full-contact and high-impact activities suspended pending medical review.",
    readinessStatus: "RESTRICTED",
  },
  {
    id: "ev-isaiah-note-1",
    playerId: "a_5",
    goalId: "goal-isaiah-re",
    type: "coach_note",
    date: "2026-05-10",
    title: "Injury Update — Lower Body",
    summary: "Isaiah is dealing with a left knee contusion. Goal paused; WOD must be modified to non-impact activities only.",
    coachId: "coach-2",
    coachName: "Coach Mitchell",
    sentiment: "concern",
  },
];

/* --- Film Clips --- */

export const FILM_CLIPS: FilmClipEvidence[] = [
  {
    id: "fc-marcus-bh-1",
    title: "Pick-and-Roll Dribble Penetration",
    duration: 48,
    linkedGoalId: "goal-marcus-bh",
    annotations: ["Left-hand turn at top of key", "Defender over-committed on hedge"],
    aiTags: ["left-hand drive", "pick-and-roll", "defender hedge", "lane penetration"],
    aiConfidence: 0.91,
  },
  {
    id: "fc-marcus-cv-1",
    title: "Skip Pass Decision — Scrimmage Highlight",
    duration: 35,
    linkedGoalId: "goal-marcus-cv",
    annotations: ["Eyes stay up on drive", "Early recognition of skip-pass window"],
    aiTags: ["skip pass", "weak-side read", "open three", "court vision"],
    aiConfidence: 0.88,
  },
  {
    id: "fc-jalen-sh-1",
    title: "Off-Screen Shooting — Mixed Results",
    duration: 62,
    linkedGoalId: "goal-jalen-shooting",
    annotations: ["Elbow out on 2nd and 4th attempt", "Footwork late on curl action"],
    aiTags: ["catch-and-shoot", "off-screen", "elbow alignment", "curl action", "inconsistent footwork"],
    aiConfidence: 0.79,
  },
  {
    id: "fc-tyrese-de-1",
    title: "Defensive Rotation Review",
    duration: 41,
    linkedGoalId: "goal-tyrese-de",
    annotations: ["Late rotation on baseline cut", "Closeout footwork solid but timing off"],
    aiTags: ["closeout defense", "help-side rotation", "baseline drive", "late rotation"],
    aiConfidence: 0.72,
  },
];

/* --- Drill Prescriptions --- */

export const DRILL_PRESCRIPTIONS: DrillPrescription[] = [
  {
    id: "rx-marcus-bh-1",
    playerId: "a_2",
    goalId: "goal-marcus-bh",
    drillName: "Cone Dribble Attack Series",
    reps: "4 sets × 45s",
    frequency: "3x / week",
    prescribedBy: "coach-1",
    prescribedAt: "2026-04-01",
    dueDate: "2026-07-01",
    status: "active",
    completionRate: 0.87,
  },
  {
    id: "rx-marcus-bh-2",
    playerId: "a_2",
    goalId: "goal-marcus-bh",
    drillName: "Two-Ball Dribbling Series",
    reps: "4 sets × 45s",
    frequency: "2x / week",
    prescribedBy: "coach-1",
    prescribedAt: "2026-04-01",
    dueDate: "2026-07-01",
    status: "active",
    completionRate: 0.92,
  },
  {
    id: "rx-jalen-sh-1",
    playerId: "a_1",
    goalId: "goal-jalen-shooting",
    drillName: "Catch-and-Shoot Footwork Drill",
    reps: "5 zones × 10 reps",
    frequency: "4x / week",
    prescribedBy: "coach-1",
    prescribedAt: "2026-04-15",
    dueDate: "2026-05-21",
    status: "active",
    completionRate: 0.55,
  },
  {
    id: "rx-tyrese-de-1",
    playerId: "a_4",
    goalId: "goal-tyrese-de",
    drillName: "Closeout & Recover Circuit",
    reps: "3 sets × 10 reps",
    frequency: "3x / week",
    prescribedBy: "coach-2",
    prescribedAt: "2026-04-10",
    dueDate: "2026-06-15",
    status: "skipped",
    completionRate: 0.2,
  },
];

/* --- Recommendations --- */

export const DEVELOPMENT_RECOMMENDATIONS: DevelopmentRecommendation[] = [
  {
    type: "assign_film",
    priority: "medium",
    title: "Add Film Evidence for Ball Handling Goal",
    reason: "Ball Handling goal needs film evidence — 2 film reviews in last 30 days, below target of 4.",
    actionLabel: "Upload Film Clip",
    actionHref: "/app/coach/film/upload",
    goalId: "goal-marcus-bh",
  },
  {
    type: "schedule_checkin",
    priority: "high",
    title: "Schedule Check-In Before Shooting Deadline",
    reason: "Shooting goal deadline is in 4 days and confidence is low. A face-to-face check-in will surface blockers.",
    actionLabel: "Open Goal",
    actionHref: "/app/coach/players/a_1/idp/goals/goal-jalen-shooting",
    goalId: "goal-jalen-shooting",
  },
  {
    type: "add_coach_note",
    priority: "high",
    title: "Re-Engage Tyrese with a Coach Note",
    reason: "No IDP activity in 9 days. Add a coach note to re-engage and document current state.",
    actionLabel: "Go to IDP",
    actionHref: "/app/coach/players/a_4/idp",
  },
  {
    type: "modify_wod",
    priority: "medium",
    title: "Modify Isaiah's WOD for Restriction",
    reason: "Player is restricted. Modify WOD to remove high-impact activities.",
    actionLabel: "Open WOD Planner",
    actionHref: "/app/coach/wod-planner",
  },
  {
    type: "assign_drill",
    priority: "high",
    title: "Start Miles's Development with a Skill Drill",
    reason: "Player has no baseline assessment or goals. Start with a skill drill prescription to build history.",
    actionLabel: "Browse Drill Library",
    actionHref: "/app/coach/drill-library",
  },
];

const _RECOMMENDATION_MAP: Record<string, DevelopmentRecommendation> = {
  a_2: DEVELOPMENT_RECOMMENDATIONS[0],
  a_1: DEVELOPMENT_RECOMMENDATIONS[1],
  a_4: DEVELOPMENT_RECOMMENDATIONS[2],
  a_5: DEVELOPMENT_RECOMMENDATIONS[3],
  a_7: DEVELOPMENT_RECOMMENDATIONS[4],
};

export function getRecommendation(playerId: string): DevelopmentRecommendation | null {
  return _RECOMMENDATION_MAP[playerId] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Player Development Hub mock data
// Added for the Hub / Today experience slice.
// Used by usePlayerHub() until GET /api/player/hub is implemented.
// ─────────────────────────────────────────────────────────────────────────────
import type { PlayerHubData } from "./types";

export const MOCK_HUB_DATA: PlayerHubData = {
  player: {
    firstName: "Marcus",
    name:      "Marcus Davis",
    position:  "PG",
    team:      "Barnegat Varsity",
    gradYear:  2026,
  },

  season: {
    week:            8,
    totalWeeks:      20,
    seasonLabel:     "2024–25",
    streakDays:      14,
    completedDrills: 47,
    totalDrills:     60,
  },

  checkedInToday: false,

  focusAreas: [
    {
      id:            "fa1",
      priority:      1,
      category:      "Finishing",
      subSkill:      "Contact Layup",
      emoji:         "🏀",
      currentScore:  5,
      targetScore:   7,
      progressPct:   28,
      deadline:      "Jun 15",
      status:        "active",
      coachNote:     "You're making progress — keep attacking the rim in live reps. The Mikan drill is showing up.",
      coachInitials: "CW",
      todayDrill:    "Mikan drill · 5 sets of 10",
      dueToday:      true,
      linkedClip:    { title: "Missed and-1 vs. Toms River @ 1:23", href: "/app/film/clips/c2" },
    },
    {
      id:            "fa2",
      priority:      2,
      category:      "Shooting",
      subSkill:      "Off Dribble",
      emoji:         "🎯",
      currentScore:  6,
      targetScore:   8,
      progressPct:   15,
      deadline:      "Jul 1",
      status:        "active",
      coachNote:     "Your DHO reads are getting sharper. Focus on the 1-2 step rhythm this week.",
      coachInitials: "CW",
      todayDrill:    "Pull-up off DHO · 50 reps each side",
      dueToday:      false,
      linkedClip:    null,
    },
    {
      id:            "fa3",
      priority:      3,
      category:      "Ball Handling",
      subSkill:      "Weak Hand",
      emoji:         "✋",
      currentScore:  6,
      targetScore:   8,
      progressPct:   40,
      deadline:      "Jul 15",
      status:        "active",
      coachNote:     "Great improvement. Left-only 3-cone milestone hit — nice work.",
      coachInitials: "CW",
      todayDrill:    "Left-only dribble warmup · 10 minutes",
      dueToday:      true,
      linkedClip:    null,
    },
  ],

  recentFeedback: [
    {
      id:            "f1",
      date:          "May 5",
      coachName:     "Coach Williams",
      coachInitials: "CW",
      type:          "monthly_review",
      text:          "Strong session. Your weak hand has made real strides since March. Contact finishing is lagging but the Mikan drill work is showing up in practice.",
      linkedClip:    null,
    },
    {
      id:            "f2",
      date:          "May 2",
      coachName:     "Coach Williams",
      coachInitials: "CW",
      type:          "film_note",
      text:          "Watch your footwork on this play. You're fading instead of attacking — going left and drawing the foul is the right read here.",
      linkedClip:    { title: "Missed and-1 vs. Toms River @ 0:47", href: "/app/film/clips/c2" },
    },
    {
      id:            "f3",
      date:          "Apr 28",
      coachName:     "Coach Williams",
      coachInitials: "CW",
      type:          "film_note",
      text:          "Great DHO read here. This is exactly the instinct we're building. Bank this feeling.",
      linkedClip:    { title: "DHO read vs. LBI @ 2:13", href: "/app/film/clips/c4" },
    },
  ],

  coachActions: [
    {
      id:            "ca1",
      actionType:    "request_reupload",
      status:        "open",
      issueCategory: "Finishing",
      coachNote:     "Record this contact layup again — drive through the contact instead of fading. Submit within 48h.",
      sessionTitle:  "Barnegat vs. Toms River",
      timestamp:     "1:23",
      createdAt:     "2026-05-12",
    },
    {
      id:            "ca2",
      actionType:    "assign_clip",
      status:        "open",
      issueCategory: "Release",
      coachNote:     "Watch your thumb flick in this clip. Index finger last off the ball — this is the habit we need to break.",
      sessionTitle:  "Pull-Up Jumper Review",
      timestamp:     "0:37",
      createdAt:     "2026-05-10",
    },
    {
      id:            "ca3",
      actionType:    "recommend_drill",
      status:        "in_progress",
      issueCategory: "Balance",
      coachNote:     "Balance Board Jumpers — 3 sets of 8, chest stacked over your base. Daily.",
      sessionTitle:  "Pull-Up Jumper Review",
      timestamp:     "0:14",
      createdAt:     "2026-05-08",
    },
  ],
};
