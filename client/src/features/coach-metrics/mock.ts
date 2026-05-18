/**
 * Coach Behavioral Metrics & Impact Reporting — mock data.
 *
 * Used by:
 *   CoachingDataMirrorPage  (/app/coach/data-mirror)
 *   CoachingImpactReportPage (/app/coach/impact-report)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BehavioralMetric = {
  id: string;
  label: string;
  description: string;
  value: number;
  unit: string;              // "per week", "%", "days", "per review"
  benchmark: number;          // what development-level coaches average
  benchmarkLabel: string;     // "Development coaches avg: 3.1"
  trend: number;              // delta vs last 30 days
  status: "strong" | "developing" | "lagging";
  insight: string;            // one-sentence AI observation
  moduleRecommendationId?: string;  // which module to suggest if lagging
};

export type CoachEffectivenessBreakdown = {
  overallScore: number;           // 0-100
  components: {
    label: string;
    weight: number;               // 0-1, weights sum to 1
    score: number;                // 0-100
    contribution: number;         // weight × score
  }[];
};

export type OutcomeCorrelation = {
  coachBehavior: string;          // "Completed 'Milestone Design' module in January"
  playerOutcome: string;          // "IDP milestone specificity improved 40%"
  confidenceLevel: "strong" | "moderate" | "weak";
  timeLag: string;                // "Improvement visible within 3 weeks"
};

export type SeasonComparison = {
  metricLabel: string;
  currentValue: number | string;
  priorValue: number | string;
  unit: string;
  delta: number;                  // percentage change
  direction: "up" | "down";
  isPositive: boolean;            // "up" isn't always positive (e.g., at-risk count)
};

export type CoachingImpactReport = {
  coachName: string;
  season: string;
  generatedAt: string;
  seasonComparisons: SeasonComparison[];
  attributedLearning: OutcomeCorrelation[];
  laggingAreas: { metric: string; description: string; suggestedModule: string }[];
  playerOutcomeHighlight: string;
  overallSummary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Behavioral Metrics — Coach Marcus, Spring 2026
// ─────────────────────────────────────────────────────────────────────────────

export const coachBehavioralMetrics: BehavioralMetric[] = [
  {
    id: "observation_freq",
    label: "Observation Frequency",
    description: "How often you log a structured observation for each player per week.",
    value: 1.8,
    unit: "per week",
    benchmark: 3.1,
    benchmarkLabel: "Development coaches avg: 3.1",
    trend: -0.3,
    status: "lagging",
    insight:
      "Your observation rate has dropped since adding a 3rd team. Players in your 15U group are plateauing.",
    moduleRecommendationId: "course_ai_film",
  },
  {
    id: "film_review_depth",
    label: "Film Review Depth",
    description: "Average number of timestamped annotations left per film review session.",
    value: 2.4,
    unit: "per review",
    benchmark: 3.8,
    benchmarkLabel: "Development coaches avg: 3.8",
    trend: 0.6,
    status: "developing",
    insight:
      "Improving since you completed the Timestamp Film Feedback module 3 weeks ago.",
    moduleRecommendationId: "course_ai_film",
  },
  {
    id: "idp_quality",
    label: "IDP Quality Score",
    description: "Composite score measuring milestone specificity, goal clarity, and update frequency.",
    value: 74,
    unit: "%",
    benchmark: 80,
    benchmarkLabel: "Development coaches avg: 80%",
    trend: 8,
    status: "developing",
    insight:
      "Milestone specificity improved significantly after January. Goal clarity is now your strength.",
    moduleRecommendationId: "course_ipd",
  },
  {
    id: "practice_plan_quality",
    label: "Practice Plan Quality",
    description: "Rubric score across structure, drill variety, competitive reps, and post-session reflection.",
    value: 3.6,
    unit: "/ 5.0",
    benchmark: 4.1,
    benchmarkLabel: "Development coaches avg: 4.1",
    trend: 0.2,
    status: "developing",
    insight:
      "Competitive reps are your biggest gap — only 1 of your last 8 practice plans had live application blocks.",
    moduleRecommendationId: "course_practice",
  },
  {
    id: "at_risk_response",
    label: "At-Risk Response Time",
    description: "Days from first at-risk flag to logged intervention or resolution action.",
    value: 3.1,
    unit: "days",
    benchmark: 2.4,
    benchmarkLabel: "Development coaches avg: 2.4 days",
    trend: -1.1,
    status: "developing",
    insight:
      "Response time improved from 6.4 days. Tyler Brooks intervention worked — he's back on track.",
    moduleRecommendationId: "course_communication",
  },
  {
    id: "parent_comm",
    label: "Parent Communication Rate",
    description: "Percentage of families who received a personalized update in the last 30 days.",
    value: 82,
    unit: "%",
    benchmark: 75,
    benchmarkLabel: "Development coaches avg: 75%",
    trend: 5,
    status: "strong",
    insight:
      "You're above benchmark. Parents in your program have a 94% announcement read rate.",
  },
  {
    id: "wod_completion",
    label: "WOD Completion Rate",
    description: "Percentage of assigned workouts your players completed in the last 30 days.",
    value: 78,
    unit: "%",
    benchmark: 72,
    benchmarkLabel: "Development coaches avg: 72%",
    trend: 6,
    status: "strong",
    insight:
      "Your players complete more WODs than average — likely linked to your post-session messaging pattern.",
  },
  {
    id: "player_retention",
    label: "Player Retention Rate",
    description: "Percentage of players who re-enrolled season over season.",
    value: 88,
    unit: "%",
    benchmark: 81,
    benchmarkLabel: "Development coaches avg: 81%",
    trend: 9,
    status: "strong",
    insight:
      "Up 9pp year-over-year. Your early at-risk interventions are the primary driver.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Effectiveness Breakdown
// ─────────────────────────────────────────────────────────────────────────────

export const coachEffectivenessBreakdown: CoachEffectivenessBreakdown = {
  overallScore: 71,
  components: [
    { label: "IDP Completion Rate",    weight: 0.25, score: 74, contribution: 18.5 },
    { label: "Avg Player Skill Velocity", weight: 0.20, score: 68, contribution: 13.6 },
    { label: "Film Review Rate",       weight: 0.15, score: 82, contribution: 12.3 },
    { label: "Observation Frequency",  weight: 0.15, score: 58, contribution: 8.7  },
    { label: "Player Retention Rate",  weight: 0.15, score: 88, contribution: 13.2 },
    { label: "Parent Engagement Rate", weight: 0.10, score: 82, contribution: 8.2  },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Spring 2026 Impact Report
// ─────────────────────────────────────────────────────────────────────────────

export const springImpactReport: CoachingImpactReport = {
  coachName: "Marcus Williams",
  season: "Spring 2026",
  generatedAt: "May 15, 2026",

  seasonComparisons: [
    {
      metricLabel: "Player Retention Rate",
      currentValue: "88%",
      priorValue: "79%",
      unit: "%",
      delta: 11,
      direction: "up",
      isPositive: true,
    },
    {
      metricLabel: "IDP Quality Score",
      currentValue: "74%",
      priorValue: "51%",
      unit: "%",
      delta: 45,
      direction: "up",
      isPositive: true,
    },
    {
      metricLabel: "Film Annotation Density",
      currentValue: "2.4",
      priorValue: "1.4",
      unit: "per review",
      delta: 71,
      direction: "up",
      isPositive: true,
    },
    {
      metricLabel: "WOD Completion Rate",
      currentValue: "78%",
      priorValue: "65%",
      unit: "%",
      delta: 20,
      direction: "up",
      isPositive: true,
    },
    {
      metricLabel: "At-Risk Response Time",
      currentValue: "3.1",
      priorValue: "6.4",
      unit: "days",
      delta: -52,
      direction: "down",
      isPositive: true,
    },
    {
      metricLabel: "Observation Frequency",
      currentValue: "1.8",
      priorValue: "2.2",
      unit: "per week",
      delta: -18,
      direction: "down",
      isPositive: false,
    },
    {
      metricLabel: "Parent Communication Rate",
      currentValue: "82%",
      priorValue: "68%",
      unit: "%",
      delta: 21,
      direction: "up",
      isPositive: true,
    },
    {
      metricLabel: "Practice Plan Quality",
      currentValue: "3.6",
      priorValue: "3.1",
      unit: "/ 5.0",
      delta: 16,
      direction: "up",
      isPositive: true,
    },
  ],

  attributedLearning: [
    {
      coachBehavior: "Completed 'Building Individual Player Development Plans' in January",
      playerOutcome: "IDP milestone specificity improved 40% — players can now explain their own goals",
      confidenceLevel: "strong",
      timeLag: "Improvement visible within 3 weeks of course completion",
    },
    {
      coachBehavior: "Completed 'Using AI Film Analysis as a Coaching Tool' in February",
      playerOutcome: "Annotation density increased from 1.4 to 3.6 per review session",
      confidenceLevel: "moderate",
      timeLag: "Improvement visible within 4 weeks",
    },
    {
      coachBehavior: "Implemented weekly parent communication cadence starting March",
      playerOutcome: "Parent read rate climbed to 94% — parent-initiated coaching interruptions dropped 60%",
      confidenceLevel: "moderate",
      timeLag: "Pattern change visible within 2 weeks",
    },
    {
      coachBehavior: "Started using the at-risk flagging workflow consistently in April",
      playerOutcome: "Average response time fell from 6.4 to 3.1 days — 2 players moved off at-risk list",
      confidenceLevel: "strong",
      timeLag: "Tyler Brooks resolved within 3 weeks of first intervention",
    },
  ],

  laggingAreas: [
    {
      metric: "Observation Frequency",
      description:
        "Your observation rate dropped from 2.2 to 1.8/week after adding a 3rd team in March. Players in the 15U group have the flattest skill velocity on your roster.",
      suggestedModule: "course_ai_film",
    },
    {
      metric: "Competitive Reps in Practice",
      description:
        "Only 1 of your last 8 practice plans included a live application block. Players are improving in drills but showing slower game transfer.",
      suggestedModule: "course_practice",
    },
  ],

  playerOutcomeHighlight:
    "Malik Henderson improved 1.5 skill levels in ball handling this season — from a 2.5 (structured drill with passive resistance) to a 4.0 (consistent execution in small-sided games). His left-hand finishing was his IDP focus area from Day 1.",

  overallSummary:
    "Spring 2026 was your strongest development season by the numbers. Three of your four primary metrics improved year-over-year, and your player retention rate hit 88% — 7 points above the development coach benchmark. The connection between your January coursework on IDP design and the measurable improvement in plan quality is the clearest evidence the education system is working.\n\nThe season wasn't without friction. Adding a third team in March put real pressure on your observation frequency, and that showed up in the 15U group's slower skill velocity. You managed the at-risk workflow better than any prior season, but the response time still sits above the benchmark — that's the area to tighten in the fall.\n\nGoing into Fall 2026, the highest-leverage focus is straightforward: protect your observation rate across all three teams and add competitive reps to your practice plans. The development infrastructure you've built this season is solid. Now it needs consistent input to compound.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Monthly Behavioral Trend — 6 months (Dec–May) for sparklines
// ─────────────────────────────────────────────────────────────────────────────

export type TrendPoint = { month: string; value: number };

export type MonthlyBehavioralTrend = {
  metricId: string;
  data: TrendPoint[];
};

export const monthlyBehavioralTrend: MonthlyBehavioralTrend[] = [
  {
    metricId: "observation_freq",
    data: [
      { month: "Dec", value: 2.3 },
      { month: "Jan", value: 2.5 },
      { month: "Feb", value: 2.6 },
      { month: "Mar", value: 2.0 },
      { month: "Apr", value: 1.9 },
      { month: "May", value: 1.8 },
    ],
  },
  {
    metricId: "film_review_depth",
    data: [
      { month: "Dec", value: 1.4 },
      { month: "Jan", value: 1.6 },
      { month: "Feb", value: 1.8 },
      { month: "Mar", value: 2.1 },
      { month: "Apr", value: 2.3 },
      { month: "May", value: 2.4 },
    ],
  },
  {
    metricId: "idp_quality",
    data: [
      { month: "Dec", value: 54 },
      { month: "Jan", value: 58 },
      { month: "Feb", value: 65 },
      { month: "Mar", value: 70 },
      { month: "Apr", value: 73 },
      { month: "May", value: 74 },
    ],
  },
  {
    metricId: "practice_plan_quality",
    data: [
      { month: "Dec", value: 3.1 },
      { month: "Jan", value: 3.2 },
      { month: "Feb", value: 3.3 },
      { month: "Mar", value: 3.4 },
      { month: "Apr", value: 3.5 },
      { month: "May", value: 3.6 },
    ],
  },
  {
    metricId: "at_risk_response",
    data: [
      { month: "Dec", value: 6.4 },
      { month: "Jan", value: 5.8 },
      { month: "Feb", value: 4.9 },
      { month: "Mar", value: 4.1 },
      { month: "Apr", value: 3.4 },
      { month: "May", value: 3.1 },
    ],
  },
  {
    metricId: "parent_comm",
    data: [
      { month: "Dec", value: 68 },
      { month: "Jan", value: 71 },
      { month: "Feb", value: 74 },
      { month: "Mar", value: 78 },
      { month: "Apr", value: 80 },
      { month: "May", value: 82 },
    ],
  },
  {
    metricId: "wod_completion",
    data: [
      { month: "Dec", value: 65 },
      { month: "Jan", value: 68 },
      { month: "Feb", value: 70 },
      { month: "Mar", value: 73 },
      { month: "Apr", value: 76 },
      { month: "May", value: 78 },
    ],
  },
  {
    metricId: "player_retention",
    data: [
      { month: "Dec", value: 79 },
      { month: "Jan", value: 80 },
      { month: "Feb", value: 82 },
      { month: "Mar", value: 84 },
      { month: "Apr", value: 86 },
      { month: "May", value: 88 },
    ],
  },
];

/** Look up the trend data for a given metric ID. */
export function getMetricTrend(metricId: string): TrendPoint[] {
  return monthlyBehavioralTrend.find((t) => t.metricId === metricId)?.data ?? [];
}
