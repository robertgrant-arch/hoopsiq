import type {
  DevelopmentGoal,
  DevelopmentEvidence,
  DevelopmentProfile,
  DrillPrescription,
  DevelopmentRecommendation,
  GoalRisk,
} from "@/lib/mock/player-development";

/** Returns goal progress as a 0–100 integer based on score movement toward target. */
export function computeGoalProgress(goal: DevelopmentGoal): number {
  const range = goal.targetScore - goal.baselineScore;
  if (range === 0) return 100;
  const pct = ((goal.currentScore - goal.baselineScore) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/** Returns true when the player has had no activity for 7+ days relative to asOf. */
export function isPlayerStale(lastActivityDate: string, asOf: string = new Date().toISOString()): boolean {
  return daysSinceActivity(lastActivityDate, asOf) >= 7;
}

/** Returns the number of whole days elapsed since lastActivityDate. */
export function daysSinceActivity(lastActivityDate: string, asOf: string = new Date().toISOString()): number {
  const msPerDay = 86_400_000;
  const a = Math.floor(new Date(lastActivityDate).getTime() / msPerDay);
  const b = Math.floor(new Date(asOf).getTime() / msPerDay);
  return b - a;
}

/** Returns days until the targetDate (positive = future, negative = overdue). Uses Math.ceil so a same-day deadline is 0, tomorrow is 1. */
export function daysUntilDeadline(targetDate: string, asOf: string = new Date().toISOString()): number {
  const msPerDay = 86_400_000;
  const diff = new Date(targetDate).getTime() - new Date(asOf).getTime();
  return Math.ceil(diff / msPerDay);
}

/** Classifies an active goal as "overdue", "at-risk", or "on-track". */
export function goalRisk(goal: DevelopmentGoal, asOf: string = new Date().toISOString()): GoalRisk {
  if (goal.status !== "active") return "on-track";
  const days = daysUntilDeadline(goal.targetDate, asOf);
  if (days < 0) return "overdue";
  if (days < 7) return "at-risk";
  if (days < 14 && goal.confidence === "low") return "at-risk";
  return "on-track";
}

/** Returns the Monday ISO date string (YYYY-MM-DD) for the week containing the given date. */
function toWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return monday.toISOString().slice(0, 10);
}

/** Groups evidence into Map keyed by week-start (Monday), most-recent week first. */
export function groupEvidenceByWeek(evidence: DevelopmentEvidence[]): Map<string, DevelopmentEvidence[]> {
  const map = new Map<string, DevelopmentEvidence[]>();
  for (const ev of evidence) {
    const key = toWeekStart(ev.date);
    const bucket = map.get(key) ?? [];
    bucket.push(ev);
    map.set(key, bucket);
  }
  for (const bucket of Array.from(map.values())) {
    bucket.sort((a: DevelopmentEvidence, b: DevelopmentEvidence) => b.date.localeCompare(a.date));
  }
  return new Map(Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])));
}

/** Converts an ISO week-start like "2026-05-11" to a human label like "Week of May 11". */
export function weekLabel(isoWeekStart: string): string {
  const d = new Date(isoWeekStart + "T00:00:00Z");
  return `Week of ${d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}`;
}

const ACTION_LABELS: Record<DevelopmentRecommendation["type"], string> = {
  assign_drill: "Browse Drills",
  assign_film: "Upload Film",
  schedule_checkin: "Open Goal",
  modify_wod: "Open WOD Planner",
  add_coach_note: "Go to IDP",
};

/** Derives the highest-priority coaching recommendation from the player's current IDP state. */
export function computeRecommendation(
  profile: DevelopmentProfile,
  goals: DevelopmentGoal[],
  evidence: DevelopmentEvidence[],
  prescriptions: DrillPrescription[],
  asOf: string = new Date().toISOString(),
): DevelopmentRecommendation {
  const rec = (type: DevelopmentRecommendation["type"], priority: DevelopmentRecommendation["priority"], title: string, reason: string, href: string, goalId?: string): DevelopmentRecommendation =>
    ({ type, priority, title, reason, actionLabel: ACTION_LABELS[type], actionHref: href, goalId });

  if (profile.status === "missing-data")
    return rec("assign_drill", "high", "Assign a Drill", "No baseline or goals exist — start with a skill drill to build development history.", "/app/coach/drill-library");

  if (profile.status === "restricted")
    return rec("modify_wod", "medium", "Modify WOD", "Player is restricted from full-contact activity. Modify WOD to non-impact drills.", "/app/coach/wod-planner");

  const activeGoals = goals.filter((g) => g.status === "active");

  const overdueGoal = activeGoals.find((g) => goalRisk(g, asOf) === "overdue");
  if (overdueGoal)
    return rec("schedule_checkin", "high", "Review Overdue Goal", `Goal "${overdueGoal.title}" is past its target date.`, `/app/coach/players/${profile.playerId}/idp/goals/${overdueGoal.id}`, overdueGoal.id);

  const urgentGoal = activeGoals.find((g) => daysUntilDeadline(g.targetDate, asOf) < 5 && g.confidence === "low");
  if (urgentGoal) {
    const days = daysUntilDeadline(urgentGoal.targetDate, asOf);
    return rec("schedule_checkin", "high", "Deadline Approaching", `Goal "${urgentGoal.title}" has ${days} day(s) remaining and low confidence.`, `/app/coach/players/${profile.playerId}/idp/goals/${urgentGoal.id}`, urgentGoal.id);
  }

  if (profile.status === "stale") {
    const days = daysSinceActivity(profile.lastActivityDate, asOf);
    return rec("add_coach_note", "high", "Player Activity Stale", `No activity recorded in ${days} days — add a coach note to update development status.`, `/app/coach/players/${profile.playerId}/idp`);
  }

  const lowCompletionRx = prescriptions.find((p) => p.status === "active" && p.completionRate < 0.5);
  if (lowCompletionRx)
    return rec("modify_wod", "medium", "Low Drill Completion", "A drill prescription has low completion — consider simplifying or rescheduling.", "/app/coach/wod-planner", lowCompletionRx.goalId);

  return rec("assign_film", "low", "Add Film Evidence", "Add film evidence to strengthen development records.", "/app/coach/film/upload");
}

/** Returns evidence for a specific goal, sorted most-recent-first. */
export function filterEvidenceForGoal(evidence: DevelopmentEvidence[], goalId: string): DevelopmentEvidence[] {
  return evidence.filter((ev) => ev.goalId === goalId).sort((a, b) => b.date.localeCompare(a.date));
}

/** Returns the score triple for the most recently updated active goal matching a skill area, or null. */
export function getSkillAreaScore(goals: DevelopmentGoal[], skillAreaId: string): { baseline: number; current: number; target: number } | null {
  const matches = goals.filter((g) => g.status === "active" && g.skillAreaId === skillAreaId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (matches.length === 0) return null;
  const { baselineScore: baseline, currentScore: current, targetScore: target } = matches[0];
  return { baseline, current, target };
}
