/**
 * analytics-kpi.ts — source of truth for all KPI dashboards.
 *
 * Used by:
 *   VDVCommandCenterPage   (/app/analytics/vdv)
 *   NorthStarDashboardPage (/app/analytics/north-star)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VDVDataPoint = {
  week: string;
  vdv: number;
  activePrograms: number;
  activePlayers: number;
};

export type ProgramCohort = {
  signupMonth: string;
  started: number;
  month1: number;
  month3: number;
  month6: number;
  month12: number;
  season2: number;
};

export type ActivationFunnelStep = {
  step: string;
  count: number;
  pct: number;
  dropoffReason?: string;
};

export type WeeklyVitalSign = {
  label: string;
  current: number;
  prior: number;
  unit: string;
  trend: "up" | "down" | "flat";
  isGood: (trend: "up" | "down" | "flat") => boolean;
};

export type ProgramQualityScore = {
  programId: string;
  programName: string;
  teamCount: number;
  assessmentDensity: number;
  verificationRate: number;
  filmCorroboration: number;
  idpCompletion: number;
  dataFreshness: number;
  composite: number;
  status: "green" | "amber" | "red";
  lastAssessedDaysAgo: number;
};

export type WarningSignal = {
  id: string;
  type:
    | "inflation"
    | "decoupling"
    | "director_ghost"
    | "staleness"
    | "single_coach"
    | "parent_optout";
  severity: "critical" | "warning" | "monitor";
  programId?: string;
  programName?: string;
  description: string;
  detectedAt: string;
  metric: string;
  threshold: string;
  actual: string;
  recommendedAction: string;
};

export type LeadingIndicator = {
  name: string;
  value: number;
  unit: string;
  target: number;
  vsLastWeek: number;
  predictiveStrength: "high" | "medium" | "low";
  whatItPredicts: string;
};

export type CohortRetentionRow = {
  cohort: string;
  month1: number;
  month3: number;
  month6: number;
  month12: number;
  season2: number;
  programCount: number;
};

export type EnterpriseMetric = {
  label: string;
  value: number | string;
  unit: string;
  trend: number;
  benchmark?: number;
  description: string;
};

export type ActivationSourceRow = {
  source: "self_serve" | "sales" | "referral" | "conference";
  programs: number;
  avgDaysToActivation: number;
  month12Retention: number;
  ndExamples?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const VDV_CURRENT: number = 61;
export const VDV_TARGET: number = 75;
export const VDV_YEAR1_TARGET: number = 45;
export const TOTAL_ACTIVE_PROGRAMS: number = 47;
export const TOTAL_ACTIVE_PLAYERS: number = 892;
export const TOTAL_ACTIVE_COACHES: number = 134;

// ─────────────────────────────────────────────────────────────────────────────
// VDV 16-week time series — trend from 48% to 61%
// ─────────────────────────────────────────────────────────────────────────────

export const vdvTimeSeries: VDVDataPoint[] = [
  { week: "W1",  vdv: 48, activePrograms: 31, activePlayers: 587 },
  { week: "W2",  vdv: 49, activePrograms: 32, activePlayers: 601 },
  { week: "W3",  vdv: 50, activePrograms: 33, activePlayers: 618 },
  { week: "W4",  vdv: 49, activePrograms: 33, activePlayers: 622 },
  { week: "W5",  vdv: 51, activePrograms: 35, activePlayers: 644 },
  { week: "W6",  vdv: 52, activePrograms: 36, activePlayers: 659 },
  { week: "W7",  vdv: 53, activePrograms: 37, activePlayers: 681 },
  { week: "W8",  vdv: 54, activePrograms: 38, activePlayers: 702 },
  { week: "W9",  vdv: 55, activePrograms: 39, activePlayers: 718 },
  { week: "W10", vdv: 56, activePrograms: 40, activePlayers: 739 },
  { week: "W11", vdv: 57, activePrograms: 41, activePlayers: 757 },
  { week: "W12", vdv: 57, activePrograms: 42, activePlayers: 773 },
  { week: "W13", vdv: 59, activePrograms: 43, activePlayers: 804 },
  { week: "W14", vdv: 60, activePrograms: 45, activePlayers: 831 },
  { week: "W15", vdv: 60, activePrograms: 46, activePlayers: 858 },
  { week: "W16", vdv: 61, activePrograms: 47, activePlayers: 892 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Program cohorts — 6 monthly cohorts with retention curves
// ─────────────────────────────────────────────────────────────────────────────

export const programCohorts: ProgramCohort[] = [
  { signupMonth: "Nov 2024", started: 8,  month1: 8,  month3: 7,  month6: 6,  month12: 5, season2: 4 },
  { signupMonth: "Dec 2024", started: 6,  month1: 6,  month3: 5,  month6: 4,  month12: 3, season2: 2 },
  { signupMonth: "Jan 2025", started: 12, month1: 11, month3: 10, month6: 8,  month12: 7, season2: 5 },
  { signupMonth: "Feb 2025", started: 9,  month1: 9,  month3: 8,  month6: 7,  month12: 5, season2: 3 },
  { signupMonth: "Mar 2025", started: 14, month1: 13, month3: 12, month6: 10, month12: 8, season2: 0 },
  { signupMonth: "Apr 2025", started: 11, month1: 11, month3: 10, month6: 8,  month12: 0, season2: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Activation funnel — 6 steps with drop-off
// ─────────────────────────────────────────────────────────────────────────────

export const activationFunnel: ActivationFunnelStep[] = [
  {
    step: "Account Created",
    count: 1240,
    pct: 100,
  },
  {
    step: "First Team Added",
    count: 961,
    pct: 78,
    dropoffReason: "Confusion around team roster import flow",
  },
  {
    step: "First Player Invited",
    count: 804,
    pct: 65,
    dropoffReason: "Director unfamiliar with parent email collection",
  },
  {
    step: "First Assessment Completed",
    count: 598,
    pct: 48,
    dropoffReason: "Coaches unsure of assessment cadence expectations",
  },
  {
    step: "IDP Goal Set",
    count: 423,
    pct: 34,
    dropoffReason: "IDP builder perceived as too complex at onboarding",
  },
  {
    step: "Fully Activated (VDV > 0)",
    count: 338,
    pct: 27,
    dropoffReason: "No film submitted within first 14 days",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Weekly vital signs — 8 key health indicators
// ─────────────────────────────────────────────────────────────────────────────

export const weeklyVitalSigns: WeeklyVitalSign[] = [
  {
    label: "Assessment Rate",
    current: 3.2,
    prior: 2.9,
    unit: "per player / week",
    trend: "up",
    isGood: (t) => t === "up",
  },
  {
    label: "Film Annotation Rate",
    current: 68,
    prior: 71,
    unit: "%",
    trend: "down",
    isGood: (t) => t === "up",
  },
  {
    label: "IDP Starts",
    current: 47,
    prior: 41,
    unit: "new goals",
    trend: "up",
    isGood: (t) => t === "up",
  },
  {
    label: "Parent Report Opens",
    current: 42,
    prior: 45,
    unit: "%",
    trend: "down",
    isGood: (t) => t === "up",
  },
  {
    label: "Recruiter Requests",
    current: 214,
    prior: 193,
    unit: "this week",
    trend: "up",
    isGood: (t) => t === "up",
  },
  {
    label: "Director Logins",
    current: 38,
    prior: 38,
    unit: "of 47 programs",
    trend: "flat",
    isGood: (t) => t !== "down",
  },
  {
    label: "Season Setups Started",
    current: 9,
    prior: 6,
    unit: "programs",
    trend: "up",
    isGood: (t) => t === "up",
  },
  {
    label: "Access Request Response Time",
    current: 4.1,
    prior: 5.8,
    unit: "hrs avg",
    trend: "down",
    isGood: (t) => t === "down",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Program quality scores — 12 programs with composite scoring
// ─────────────────────────────────────────────────────────────────────────────

export const programQualityScores: ProgramQualityScore[] = [
  {
    programId: "prog-01",
    programName: "Elite Select – Chicago",
    teamCount: 8,
    assessmentDensity: 91,
    verificationRate: 88,
    filmCorroboration: 76,
    idpCompletion: 84,
    dataFreshness: 95,
    composite: 87,
    status: "green",
    lastAssessedDaysAgo: 1,
  },
  {
    programId: "prog-02",
    programName: "Next Level Hoops – ATL",
    teamCount: 12,
    assessmentDensity: 84,
    verificationRate: 82,
    filmCorroboration: 71,
    idpCompletion: 79,
    dataFreshness: 88,
    composite: 81,
    status: "green",
    lastAssessedDaysAgo: 2,
  },
  {
    programId: "prog-03",
    programName: "Pinnacle AAU – Dallas",
    teamCount: 6,
    assessmentDensity: 78,
    verificationRate: 75,
    filmCorroboration: 63,
    idpCompletion: 71,
    dataFreshness: 82,
    composite: 74,
    status: "green",
    lastAssessedDaysAgo: 3,
  },
  {
    programId: "prog-04",
    programName: "Crossover Academy – NYC",
    teamCount: 10,
    assessmentDensity: 71,
    verificationRate: 68,
    filmCorroboration: 55,
    idpCompletion: 62,
    dataFreshness: 74,
    composite: 66,
    status: "amber",
    lastAssessedDaysAgo: 5,
  },
  {
    programId: "prog-05",
    programName: "Pro Path – LA",
    teamCount: 14,
    assessmentDensity: 68,
    verificationRate: 64,
    filmCorroboration: 52,
    idpCompletion: 58,
    dataFreshness: 70,
    composite: 62,
    status: "amber",
    lastAssessedDaysAgo: 4,
  },
  {
    programId: "prog-06",
    programName: "High Rise Basketball – Miami",
    teamCount: 5,
    assessmentDensity: 62,
    verificationRate: 59,
    filmCorroboration: 48,
    idpCompletion: 54,
    dataFreshness: 65,
    composite: 58,
    status: "amber",
    lastAssessedDaysAgo: 6,
  },
  {
    programId: "prog-07",
    programName: "Upside AAU – Denver",
    teamCount: 4,
    assessmentDensity: 58,
    verificationRate: 54,
    filmCorroboration: 41,
    idpCompletion: 49,
    dataFreshness: 60,
    composite: 52,
    status: "amber",
    lastAssessedDaysAgo: 8,
  },
  {
    programId: "prog-08",
    programName: "True Ballers – Phoenix",
    teamCount: 3,
    assessmentDensity: 44,
    verificationRate: 40,
    filmCorroboration: 28,
    idpCompletion: 35,
    dataFreshness: 41,
    composite: 38,
    status: "red",
    lastAssessedDaysAgo: 14,
  },
  {
    programId: "prog-09",
    programName: "Skyline Elite – Seattle",
    teamCount: 7,
    assessmentDensity: 51,
    verificationRate: 47,
    filmCorroboration: 33,
    idpCompletion: 44,
    dataFreshness: 55,
    composite: 46,
    status: "amber",
    lastAssessedDaysAgo: 9,
  },
  {
    programId: "prog-10",
    programName: "Drive & Kick – Houston",
    teamCount: 2,
    assessmentDensity: 38,
    verificationRate: 31,
    filmCorroboration: 18,
    idpCompletion: 27,
    dataFreshness: 30,
    composite: 29,
    status: "red",
    lastAssessedDaysAgo: 21,
  },
  {
    programId: "prog-11",
    programName: "Blueprint Hoops – Charlotte",
    teamCount: 9,
    assessmentDensity: 74,
    verificationRate: 71,
    filmCorroboration: 60,
    idpCompletion: 68,
    dataFreshness: 79,
    composite: 70,
    status: "amber",
    lastAssessedDaysAgo: 4,
  },
  {
    programId: "prog-12",
    programName: "Premier Path – Boston",
    teamCount: 11,
    assessmentDensity: 86,
    verificationRate: 84,
    filmCorroboration: 73,
    idpCompletion: 81,
    dataFreshness: 90,
    composite: 83,
    status: "green",
    lastAssessedDaysAgo: 2,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Warning signals — 5 active warnings across severity levels
// ─────────────────────────────────────────────────────────────────────────────

export const warningSignals: WarningSignal[] = [
  {
    id: "ws-01",
    type: "inflation",
    severity: "critical",
    programId: "prog-10",
    programName: "Drive & Kick – Houston",
    description:
      "Assessment scores increasing 14% week-over-week with no corresponding film corroboration. Possible rating inflation by single coach.",
    detectedAt: "2026-05-12",
    metric: "Assessment score growth vs. film verification delta",
    threshold: "< 10pp gap",
    actual: "31pp gap",
    recommendedAction:
      "Schedule calibration call with program director. Surface coach-level data in next QBR.",
  },
  {
    id: "ws-02",
    type: "director_ghost",
    severity: "critical",
    programId: "prog-08",
    programName: "True Ballers – Phoenix",
    description:
      "Program director has not logged in for 21 days. 3 coaches operating without director oversight. IDP approval queue has 14 unreviewed goals.",
    detectedAt: "2026-05-10",
    metric: "Director last login",
    threshold: "< 7 days",
    actual: "21 days",
    recommendedAction:
      "Trigger outreach sequence. Escalate to CS team if no login within 48 hours.",
  },
  {
    id: "ws-03",
    type: "decoupling",
    severity: "warning",
    programId: "prog-07",
    programName: "Upside AAU – Denver",
    description:
      "IDP goal completion rate dropped 18pp over 4 weeks while assessment density held steady. Goals may be disconnected from actual practice content.",
    detectedAt: "2026-05-14",
    metric: "IDP completion vs. assessment density correlation",
    threshold: "Correlation > 0.6",
    actual: "0.31 correlation",
    recommendedAction:
      "Review IDP goal quality with CS team. Suggest coach workshop on goal-to-drill alignment.",
  },
  {
    id: "ws-04",
    type: "staleness",
    severity: "warning",
    programId: "prog-09",
    programName: "Skyline Elite – Seattle",
    description:
      "7 of 9 active players have not had a skill assessment in 9+ days. Data is stale and VDV calculation will degrade if not resolved within 3 days.",
    detectedAt: "2026-05-15",
    metric: "Days since last assessment per player",
    threshold: "< 7 days",
    actual: "9–14 days for 78% of roster",
    recommendedAction:
      "Send automated nudge to coaching staff. Flag in weekly digest to program director.",
  },
  {
    id: "ws-05",
    type: "parent_optout",
    severity: "monitor",
    programId: "prog-04",
    programName: "Crossover Academy – NYC",
    description:
      "Parent report open rate declined from 71% to 38% over 6 weeks. Low parent engagement correlates with 2.4× higher player churn at month 6.",
    detectedAt: "2026-05-13",
    metric: "Parent report open rate",
    threshold: "> 55%",
    actual: "38%",
    recommendedAction:
      "A/B test subject lines for parent digest. Review send-time optimization for this timezone.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Leading indicators — 8 predictive metrics
// ─────────────────────────────────────────────────────────────────────────────

export const leadingIndicators: LeadingIndicator[] = [
  {
    name: "Week-2 Assessment Completion",
    value: 74,
    unit: "%",
    target: 85,
    vsLastWeek: +3,
    predictiveStrength: "high",
    whatItPredicts: "Programs completing ≥85% of Week-2 assessments show 2.1× better Month-6 retention",
  },
  {
    name: "Parent Report Open Rate",
    value: 42,
    unit: "%",
    target: 65,
    vsLastWeek: -3,
    predictiveStrength: "high",
    whatItPredicts: "Parent open rate <50% predicts 3× higher player churn at Month 6",
  },
  {
    name: "Film Clips per Assessment",
    value: 1.4,
    unit: "clips",
    target: 2.0,
    vsLastWeek: -0.1,
    predictiveStrength: "high",
    whatItPredicts: "Film corroboration predicts verified skill growth with 0.78 correlation",
  },
  {
    name: "IDP Goals with Milestones",
    value: 61,
    unit: "%",
    target: 75,
    vsLastWeek: +2,
    predictiveStrength: "medium",
    whatItPredicts: "Milestone-linked IDPs complete at 2.3× the rate of generic goals",
  },
  {
    name: "Director Weekly Logins",
    value: 81,
    unit: "% of programs",
    target: 90,
    vsLastWeek: 0,
    predictiveStrength: "medium",
    whatItPredicts: "Programs with active director engagement renew at 73% vs 44%",
  },
  {
    name: "Coach Education Module Completions",
    value: 2.1,
    unit: "per coach / month",
    target: 3.0,
    vsLastWeek: +0.2,
    predictiveStrength: "medium",
    whatItPredicts: "Coaches completing 3+ modules monthly produce 28% better VDV scores",
  },
  {
    name: "Recruiter Profile Views",
    value: 847,
    unit: "this week",
    target: 750,
    vsLastWeek: +54,
    predictiveStrength: "low",
    whatItPredicts: "Network activity drives director NPS and word-of-mouth referral rate",
  },
  {
    name: "Season Setup Lead Time",
    value: 34,
    unit: "days before start",
    target: 21,
    vsLastWeek: +3,
    predictiveStrength: "low",
    whatItPredicts: "Early season setup correlates with 18% higher coach activation rate",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cohort retention — 6 cohorts showing retention waterfall
// ─────────────────────────────────────────────────────────────────────────────

export const cohortRetention: CohortRetentionRow[] = [
  { cohort: "Nov 2024", month1: 100, month3: 88, month6: 75, month12: 63, season2: 50, programCount: 8  },
  { cohort: "Dec 2024", month1: 100, month3: 83, month6: 67, month12: 50, season2: 33, programCount: 6  },
  { cohort: "Jan 2025", month1: 100, month3: 92, month6: 83, month12: 75, season2: 42, programCount: 12 },
  { cohort: "Feb 2025", month1: 100, month3: 89, month6: 78, month12: 56, season2: 33, programCount: 9  },
  { cohort: "Mar 2025", month1: 100, month3: 93, month6: 86, month12: 0,  season2: 0,  programCount: 14 },
  { cohort: "Apr 2025", month1: 100, month3: 91, month6: 0,  month12: 0,  season2: 0,  programCount: 11 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise metrics — 10 expansion/monetization indicators
// ─────────────────────────────────────────────────────────────────────────────

export const enterpriseMetrics: EnterpriseMetric[] = [
  {
    label: "Net Dollar Retention",
    value: 112,
    unit: "%",
    trend: +4,
    benchmark: 110,
    description: "Revenue from existing programs after expansion and churn. Expansion driven by multi-team orgs adding age groups.",
  },
  {
    label: "Avg Teams per Organization",
    value: 2.4,
    unit: "teams",
    trend: +0.3,
    benchmark: 2.0,
    description: "Multi-team orgs are stickier, have higher NDR, and generate referrals at 1.8× the single-team rate.",
  },
  {
    label: "Referral Rate",
    value: 31,
    unit: "% of new programs",
    trend: +5,
    description: "Referrals from existing directors and coaches. Referral-sourced programs activate 38% faster.",
  },
  {
    label: "Average Contract Value",
    value: 8400,
    unit: "$ / year",
    trend: +12,
    benchmark: 7500,
    description: "ACV growth driven by elite tier upsells and additional seat additions mid-season.",
  },
  {
    label: "Logo Churn Rate",
    value: 6.2,
    unit: "% annual",
    trend: -1.4,
    benchmark: 8,
    description: "Down from 7.6% last quarter. Churn predominantly single-team programs in first 6 months.",
  },
  {
    label: "Time to First Value",
    value: 5.2,
    unit: "days",
    trend: -1.1,
    benchmark: 7,
    description: "Days from account creation to first VDV-contributing event. Target: <5 days.",
  },
  {
    label: "Multi-Season Player Records",
    value: 34,
    unit: "% of active players",
    trend: +8,
    description: "Players with 2+ seasons of verified data. Strong network effect driver and recruiter value signal.",
  },
  {
    label: "Seat Utilization",
    value: 87,
    unit: "%",
    trend: +3,
    description: "Percentage of provisioned player seats with at least one engagement event this season.",
  },
  {
    label: "Expansion Revenue Rate",
    value: 23,
    unit: "% of ARR",
    trend: +4,
    description: "ARR from upgrades and add-ons within existing accounts. Driven by elite tier migration.",
  },
  {
    label: "NPS — Program Directors",
    value: 58,
    unit: "score",
    trend: +6,
    benchmark: 45,
    description: "Net Promoter Score from bi-weekly director pulse. Detractors concentrated in programs with <60% VDV.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Activation sources — 4 acquisition channels with quality metrics
// ─────────────────────────────────────────────────────────────────────────────

export const activationSources: ActivationSourceRow[] = [
  {
    source: "self_serve",
    programs: 21,
    avgDaysToActivation: 8.4,
    month12Retention: 52,
    ndExamples: "Elite Select Chicago, Blueprint Hoops Charlotte",
  },
  {
    source: "sales",
    programs: 14,
    avgDaysToActivation: 4.1,
    month12Retention: 71,
    ndExamples: "Next Level Hoops ATL, Premier Path Boston",
  },
  {
    source: "referral",
    programs: 9,
    avgDaysToActivation: 5.8,
    month12Retention: 78,
    ndExamples: "Crossover Academy NYC, Pinnacle AAU Dallas",
  },
  {
    source: "conference",
    programs: 3,
    avgDaysToActivation: 11.2,
    month12Retention: 44,
    ndExamples: "Drive & Kick Houston",
  },
];
