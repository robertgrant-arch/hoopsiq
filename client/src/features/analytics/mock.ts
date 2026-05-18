/**
 * Development velocity and program analytics mock data.
 * Used by: ClubAnalyticsPage (/app/club/analytics)
 */

export type DevelopmentTrend = "improving" | "plateauing" | "declining" | "new";

export type PlayerVelocityRecord = {
  playerId: string;
  playerName: string;
  ageGroup: string;
  position: string;
  gradYear: number;
  /** Average skill-level improvement per 4 weeks (0–1 scale where 0.5 = half a level). */
  skillVelocity: number;
  /** WOD submissions / WODs assigned in last 30 days. */
  wodCompletionRate: number;
  /** Total coach-verified film observations in last 30 days. */
  filmObservations: number;
  /** Practice attendance rate in last 30 days. */
  attendanceRate: number;
  /** Active IDP goals. */
  idpGoals: number;
  /** IDP goals on-track or achieved. */
  idpOnTrack: number;
  trend: DevelopmentTrend;
  /** True if engagement metrics suggest churn risk. */
  atRisk: boolean;
  riskReason?: string;
};

export type SkillGroupMetric = {
  skill: string;
  avgLevel: number;
  improving: number;   // player count
  plateauing: number;
  declining: number;
};

export type ProgramHealthCard = {
  label: string;
  value: string;
  subtitle: string;
  trend?: number;   // +/- percent vs last period
  status: "good" | "warning" | "critical" | "neutral";
};

export type MonthlySnapshot = {
  month: string; // "Jan", "Feb", …
  avgReadiness: number;
  wodCompletionRate: number;
  filmObservations: number;
  activeIdpGoals: number;
};

// ─── Player velocity table ────────────────────────────────────────────────────

export const playerVelocity: PlayerVelocityRecord[] = [
  {
    playerId: "p10", playerName: "Malik Henderson", ageGroup: "17U", position: "PG", gradYear: 2027,
    skillVelocity: 0.62, wodCompletionRate: 0.91, filmObservations: 14, attendanceRate: 0.95,
    idpGoals: 3, idpOnTrack: 3, trend: "improving", atRisk: false,
  },
  {
    playerId: "p6", playerName: "Jaylen Scott", ageGroup: "17U", position: "SG", gradYear: 2027,
    skillVelocity: 0.55, wodCompletionRate: 0.83, filmObservations: 11, attendanceRate: 0.90,
    idpGoals: 3, idpOnTrack: 2, trend: "improving", atRisk: false,
  },
  {
    playerId: "p8", playerName: "Noah Rivera", ageGroup: "17U", position: "SF", gradYear: 2026,
    skillVelocity: 0.48, wodCompletionRate: 0.75, filmObservations: 8, attendanceRate: 0.85,
    idpGoals: 2, idpOnTrack: 1, trend: "plateauing", atRisk: false,
    riskReason: "IDP goal approaching deadline with no milestone progress",
  },
  {
    playerId: "p3", playerName: "Tyler Brooks", ageGroup: "17U", position: "PF", gradYear: 2027,
    skillVelocity: 0.21, wodCompletionRate: 0.42, filmObservations: 3, attendanceRate: 0.70,
    idpGoals: 2, idpOnTrack: 0, trend: "declining", atRisk: true,
    riskReason: "No IDP activity in 9 days, low WOD completion, attendance declining",
  },
  {
    playerId: "p7", playerName: "Cam Porter", ageGroup: "17U", position: "C", gradYear: 2027,
    skillVelocity: 0.38, wodCompletionRate: 0.67, filmObservations: 7, attendanceRate: 0.80,
    idpGoals: 3, idpOnTrack: 2, trend: "improving", atRisk: false,
  },
  {
    playerId: "p12", playerName: "Brandon Lee", ageGroup: "15U", position: "PG", gradYear: 2029,
    skillVelocity: 0.71, wodCompletionRate: 0.95, filmObservations: 12, attendanceRate: 1.00,
    idpGoals: 2, idpOnTrack: 2, trend: "improving", atRisk: false,
  },
  {
    playerId: "p4", playerName: "Marcus Webb", ageGroup: "15U", position: "SG", gradYear: 2029,
    skillVelocity: 0.44, wodCompletionRate: 0.71, filmObservations: 6, attendanceRate: 0.88,
    idpGoals: 2, idpOnTrack: 1, trend: "plateauing", atRisk: false,
  },
  {
    playerId: "p5", playerName: "Isaiah Grant", ageGroup: "15U", position: "SF", gradYear: 2029,
    skillVelocity: 0.58, wodCompletionRate: 0.87, filmObservations: 9, attendanceRate: 0.92,
    idpGoals: 3, idpOnTrack: 3, trend: "improving", atRisk: false,
  },
  {
    playerId: "p9", playerName: "DeShawn Morris", ageGroup: "15U", position: "PF", gradYear: 2030,
    skillVelocity: 0.33, wodCompletionRate: 0.58, filmObservations: 4, attendanceRate: 0.75,
    idpGoals: 2, idpOnTrack: 1, trend: "plateauing", atRisk: true,
    riskReason: "No skill log in 7 days, film submission rate low",
  },
  {
    playerId: "p11", playerName: "Jalen King", ageGroup: "15U", position: "C", gradYear: 2030,
    skillVelocity: 0.66, wodCompletionRate: 0.89, filmObservations: 10, attendanceRate: 0.96,
    idpGoals: 2, idpOnTrack: 2, trend: "improving", atRisk: false,
  },
  {
    playerId: "p2", playerName: "Andre Miles", ageGroup: "13U", position: "PG", gradYear: 2031,
    skillVelocity: 0.80, wodCompletionRate: 0.93, filmObservations: 8, attendanceRate: 0.98,
    idpGoals: 2, idpOnTrack: 2, trend: "improving", atRisk: false,
  },
];

// ─── Skill group breakdown ────────────────────────────────────────────────────

export const skillGroupMetrics: SkillGroupMetric[] = [
  { skill: "Ball Handling",  avgLevel: 3.2, improving: 7, plateauing: 3, declining: 1 },
  { skill: "Shooting",       avgLevel: 2.9, improving: 5, plateauing: 4, declining: 2 },
  { skill: "Finishing",      avgLevel: 3.5, improving: 8, plateauing: 2, declining: 1 },
  { skill: "Defense",        avgLevel: 2.6, improving: 4, plateauing: 5, declining: 2 },
  { skill: "Footwork",       avgLevel: 3.0, improving: 6, plateauing: 3, declining: 2 },
  { skill: "IQ & Reads",     avgLevel: 2.4, improving: 3, plateauing: 6, declining: 2 },
];

// ─── Program health cards ─────────────────────────────────────────────────────

export const programHealthCards: ProgramHealthCard[] = [
  {
    label: "Avg WOD Completion",
    value: "78%",
    subtitle: "Last 30 days · 11 active players",
    trend: +6,
    status: "good",
  },
  {
    label: "At-Risk Players",
    value: "2",
    subtitle: "Tyler Brooks, DeShawn Morris",
    trend: 0,
    status: "warning",
  },
  {
    label: "Film Observations",
    value: "92",
    subtitle: "Coach-verified this month",
    trend: +14,
    status: "good",
  },
  {
    label: "IDP Goals On-Track",
    value: "73%",
    subtitle: "19 of 26 active goals",
    trend: -4,
    status: "warning",
  },
  {
    label: "Avg Attendance",
    value: "87%",
    subtitle: "Last 8 practices",
    trend: +2,
    status: "good",
  },
  {
    label: "Avg Readiness Score",
    value: "74",
    subtitle: "Team average today",
    trend: -3,
    status: "neutral",
  },
];

// ─── Monthly trend data ───────────────────────────────────────────────────────

export const monthlySnapshots: MonthlySnapshot[] = [
  { month: "Dec", avgReadiness: 71, wodCompletionRate: 68, filmObservations: 54, activeIdpGoals: 14 },
  { month: "Jan", avgReadiness: 73, wodCompletionRate: 72, filmObservations: 61, activeIdpGoals: 18 },
  { month: "Feb", avgReadiness: 76, wodCompletionRate: 77, filmObservations: 74, activeIdpGoals: 22 },
  { month: "Mar", avgReadiness: 74, wodCompletionRate: 75, filmObservations: 80, activeIdpGoals: 24 },
  { month: "Apr", avgReadiness: 78, wodCompletionRate: 80, filmObservations: 88, activeIdpGoals: 26 },
  { month: "May", avgReadiness: 74, wodCompletionRate: 78, filmObservations: 92, activeIdpGoals: 26 },
];

// ─── Age group breakdown ──────────────────────────────────────────────────────

export type AgeGroupSummary = {
  ageGroup: string;
  playerCount: number;
  avgVelocity: number;
  avgCompletion: number;
  atRiskCount: number;
};

export const ageGroupSummaries: AgeGroupSummary[] = [
  { ageGroup: "17U", playerCount: 5, avgVelocity: 0.45, avgCompletion: 0.72, atRiskCount: 1 },
  { ageGroup: "15U", playerCount: 4, avgVelocity: 0.55, avgCompletion: 0.81, atRiskCount: 1 },
  { ageGroup: "13U", playerCount: 2, avgVelocity: 0.80, avgCompletion: 0.93, atRiskCount: 0 },
];
