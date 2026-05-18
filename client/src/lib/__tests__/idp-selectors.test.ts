/**
 * idp-selectors.test.ts
 *
 * Tests for all IDP selector functions. All tests use a fixed asOf date
 * (2026-05-17T12:00:00Z) so results are deterministic and independent of
 * when the suite runs.
 */

import { describe, it, expect } from "vitest";
import {
  computeGoalProgress,
  isPlayerStale,
  daysSinceActivity,
  daysUntilDeadline,
  goalRisk,
  groupEvidenceByWeek,
  weekLabel,
  computeRecommendation,
  filterEvidenceForGoal,
  getSkillAreaScore,
} from "../idp-selectors";
import type {
  DevelopmentGoal,
  DevelopmentEvidence,
  DevelopmentProfile,
  DrillPrescription,
} from "../mock/player-development";

/* ------------------------------------------------------------------ */
/* Fixtures                                                             */
/* ------------------------------------------------------------------ */

const AS_OF = "2026-05-17T12:00:00Z";

function makeGoal(overrides: Partial<DevelopmentGoal> = {}): DevelopmentGoal {
  return {
    id: "g1",
    playerId: "p1",
    skillAreaId: "sa-bh",
    title: "Test Goal",
    description: "",
    targetScore: 9,
    baselineScore: 6,
    currentScore: 7.5,
    targetDate: "2026-07-01",
    createdAt: "2026-03-01",
    ownerId: "c1",
    ownerName: "Coach Test",
    status: "active",
    nextAction: "Keep drilling",
    confidence: "medium",
    evidenceIds: [],
    prescriptionIds: [],
    ...overrides,
  };
}

function makeProfile(overrides: Partial<DevelopmentProfile> = {}): DevelopmentProfile {
  return {
    playerId: "p1",
    playerName: "Test Player",
    position: "PG",
    classYear: 2026,
    gradYear: 2026,
    status: "thriving",
    primaryGoalIds: ["g1"],
    lastActivityDate: "2026-05-16",
    lastAssessmentDate: "2026-04-28",
    overallProgress: 60,
    vdvStatus: "in-progress",
    coachId: "c1",
    coachName: "Coach Test",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<DevelopmentEvidence> = {}): DevelopmentEvidence {
  return {
    id: "ev1",
    playerId: "p1",
    type: "coach_note",
    date: "2026-05-15",
    title: "Test Note",
    summary: "Summary text",
    ...overrides,
  };
}

function makePrescription(overrides: Partial<DrillPrescription> = {}): DrillPrescription {
  return {
    id: "rx1",
    playerId: "p1",
    goalId: "g1",
    drillName: "Test Drill",
    reps: "3×10",
    frequency: "3x / week",
    prescribedBy: "c1",
    prescribedAt: "2026-04-01",
    status: "active",
    completionRate: 0.8,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* computeGoalProgress                                                  */
/* ------------------------------------------------------------------ */

describe("computeGoalProgress", () => {
  it("returns correct percentage for partial progress", () => {
    const goal = makeGoal({ baselineScore: 5, currentScore: 7, targetScore: 9 });
    // (7-5)/(9-5) = 2/4 = 50%
    expect(computeGoalProgress(goal)).toBe(50);
  });

  it("returns 100 when currentScore equals targetScore", () => {
    const goal = makeGoal({ baselineScore: 5, currentScore: 9, targetScore: 9 });
    expect(computeGoalProgress(goal)).toBe(100);
  });

  it("returns 100 when range is zero (baseline === target)", () => {
    const goal = makeGoal({ baselineScore: 7, currentScore: 7, targetScore: 7 });
    expect(computeGoalProgress(goal)).toBe(100);
  });

  it("clamps to 0 when currentScore is below baseline", () => {
    const goal = makeGoal({ baselineScore: 6, currentScore: 5, targetScore: 9 });
    expect(computeGoalProgress(goal)).toBe(0);
  });

  it("clamps to 100 when currentScore exceeds target", () => {
    const goal = makeGoal({ baselineScore: 5, currentScore: 10, targetScore: 9 });
    expect(computeGoalProgress(goal)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    // (6.5-5)/(9-5) = 1.5/4 = 37.5 → rounds to 38
    const goal = makeGoal({ baselineScore: 5, currentScore: 6.5, targetScore: 9 });
    expect(computeGoalProgress(goal)).toBe(38);
  });
});

/* ------------------------------------------------------------------ */
/* daysSinceActivity & isPlayerStale                                    */
/* ------------------------------------------------------------------ */

describe("daysSinceActivity", () => {
  it("returns 1 for yesterday", () => {
    expect(daysSinceActivity("2026-05-16", AS_OF)).toBe(1);
  });

  it("returns 0 for same day", () => {
    expect(daysSinceActivity("2026-05-17", AS_OF)).toBe(0);
  });

  it("returns 9 for 9 days ago", () => {
    expect(daysSinceActivity("2026-05-08", AS_OF)).toBe(9);
  });

  it("returns 45 for a month and a half ago", () => {
    expect(daysSinceActivity("2026-04-02", AS_OF)).toBe(45);
  });
});

describe("isPlayerStale", () => {
  it("returns false when activity was 6 days ago", () => {
    expect(isPlayerStale("2026-05-11", AS_OF)).toBe(false);
  });

  it("returns true when activity was exactly 7 days ago", () => {
    expect(isPlayerStale("2026-05-10", AS_OF)).toBe(true);
  });

  it("returns true when activity was 9 days ago", () => {
    expect(isPlayerStale("2026-05-08", AS_OF)).toBe(true);
  });

  it("returns false when active today", () => {
    expect(isPlayerStale("2026-05-17", AS_OF)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* daysUntilDeadline                                                    */
/* ------------------------------------------------------------------ */

describe("daysUntilDeadline", () => {
  it("returns positive number for a future deadline", () => {
    // Jul 1 is ~45 days from May 17
    const days = daysUntilDeadline("2026-07-01", AS_OF);
    expect(days).toBeGreaterThan(40);
    expect(days).toBeLessThan(50);
  });

  it("returns negative for a past deadline", () => {
    expect(daysUntilDeadline("2026-05-01", AS_OF)).toBeLessThan(0);
  });

  it("returns 4 for 4 days away (May 21)", () => {
    const days = daysUntilDeadline("2026-05-21", AS_OF);
    expect(days).toBe(4);
  });
});

/* ------------------------------------------------------------------ */
/* goalRisk                                                             */
/* ------------------------------------------------------------------ */

describe("goalRisk", () => {
  it("returns on-track for a goal well within deadline", () => {
    const goal = makeGoal({ targetDate: "2026-07-01", confidence: "high" });
    expect(goalRisk(goal, AS_OF)).toBe("on-track");
  });

  it("returns at-risk when deadline is in 4 days with low confidence", () => {
    const goal = makeGoal({ targetDate: "2026-05-21", confidence: "low" });
    expect(goalRisk(goal, AS_OF)).toBe("at-risk");
  });

  it("returns at-risk when deadline is in 4 days even with high confidence", () => {
    const goal = makeGoal({ targetDate: "2026-05-21", confidence: "high" });
    expect(goalRisk(goal, AS_OF)).toBe("at-risk");
  });

  it("returns at-risk for 10 days out with low confidence", () => {
    const goal = makeGoal({ targetDate: "2026-05-27", confidence: "low" });
    expect(goalRisk(goal, AS_OF)).toBe("at-risk");
  });

  it("returns on-track for 10 days out with medium confidence", () => {
    const goal = makeGoal({ targetDate: "2026-05-27", confidence: "medium" });
    expect(goalRisk(goal, AS_OF)).toBe("on-track");
  });

  it("returns overdue for a past deadline", () => {
    const goal = makeGoal({ targetDate: "2026-05-10" });
    expect(goalRisk(goal, AS_OF)).toBe("overdue");
  });

  it("returns on-track for a paused goal regardless of deadline", () => {
    const goal = makeGoal({ targetDate: "2026-05-10", status: "paused" });
    expect(goalRisk(goal, AS_OF)).toBe("on-track");
  });

  it("returns on-track for an achieved goal", () => {
    const goal = makeGoal({ targetDate: "2026-05-01", status: "achieved" });
    expect(goalRisk(goal, AS_OF)).toBe("on-track");
  });
});

/* ------------------------------------------------------------------ */
/* groupEvidenceByWeek                                                  */
/* ------------------------------------------------------------------ */

describe("groupEvidenceByWeek", () => {
  const items: DevelopmentEvidence[] = [
    makeEvidence({ id: "e1", date: "2026-05-15" }), // Friday → week of May 11
    makeEvidence({ id: "e2", date: "2026-05-14" }), // Thursday → week of May 11
    makeEvidence({ id: "e3", date: "2026-05-07" }), // Thursday → week of May 4
    makeEvidence({ id: "e4", date: "2026-05-16" }), // Saturday → week of May 11
  ];

  it("groups items into the correct number of week buckets", () => {
    const groups = groupEvidenceByWeek(items);
    expect(groups.size).toBe(2);
  });

  it("puts three May 11-week items in one bucket", () => {
    const groups = groupEvidenceByWeek(items);
    const keys = Array.from(groups.keys());
    // Most recent week first
    const recentBucket = groups.get(keys[0])!;
    expect(recentBucket).toHaveLength(3);
  });

  it("sorts most-recent week first", () => {
    const groups = groupEvidenceByWeek(items);
    const keys = Array.from(groups.keys());
    // ISO date strings sort lexicographically — more recent key is lexicographically greater
    expect(keys[0].localeCompare(keys[1])).toBeGreaterThan(0);
  });

  it("sorts items within a bucket most-recent-first", () => {
    const groups = groupEvidenceByWeek(items);
    const keys = Array.from(groups.keys());
    const bucket = groups.get(keys[0])!;
    // ISO date strings: later date is lexicographically greater or equal
    expect(bucket[0].date.localeCompare(bucket[1].date)).toBeGreaterThanOrEqual(0);
  });

  it("returns an empty Map for empty input", () => {
    expect(groupEvidenceByWeek([]).size).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* weekLabel                                                            */
/* ------------------------------------------------------------------ */

describe("weekLabel", () => {
  it("formats a Monday ISO date as a readable label", () => {
    expect(weekLabel("2026-05-11")).toBe("Week of May 11");
  });

  it("formats the first of a month correctly", () => {
    expect(weekLabel("2026-06-01")).toBe("Week of June 1");
  });
});

/* ------------------------------------------------------------------ */
/* filterEvidenceForGoal                                                */
/* ------------------------------------------------------------------ */

describe("filterEvidenceForGoal", () => {
  const evidence: DevelopmentEvidence[] = [
    makeEvidence({ id: "e1", goalId: "goal-A", date: "2026-05-10" }),
    makeEvidence({ id: "e2", goalId: "goal-B", date: "2026-05-12" }),
    makeEvidence({ id: "e3", goalId: "goal-A", date: "2026-05-15" }),
    makeEvidence({ id: "e4", date: "2026-05-14" }), // no goalId
  ];

  it("returns only items matching the goalId", () => {
    const result = filterEvidenceForGoal(evidence, "goal-A");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.goalId === "goal-A")).toBe(true);
  });

  it("returns items sorted most-recent-first", () => {
    const result = filterEvidenceForGoal(evidence, "goal-A");
    expect(result[0].date).toBe("2026-05-15");
    expect(result[1].date).toBe("2026-05-10");
  });

  it("returns empty array when no match", () => {
    expect(filterEvidenceForGoal(evidence, "goal-Z")).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* getSkillAreaScore                                                    */
/* ------------------------------------------------------------------ */

describe("getSkillAreaScore", () => {
  const goals: DevelopmentGoal[] = [
    makeGoal({ id: "g1", skillAreaId: "sa-bh", status: "active", baselineScore: 6, currentScore: 7.5, targetScore: 9, createdAt: "2026-03-01" }),
    makeGoal({ id: "g2", skillAreaId: "sa-bh", status: "active", baselineScore: 5, currentScore: 6, targetScore: 8, createdAt: "2026-01-01" }),
    makeGoal({ id: "g3", skillAreaId: "sa-sh", status: "active", baselineScore: 5, currentScore: 6, targetScore: 8, createdAt: "2026-02-01" }),
    makeGoal({ id: "g4", skillAreaId: "sa-de", status: "paused", baselineScore: 4, currentScore: 5, targetScore: 8, createdAt: "2026-03-01" }),
  ];

  it("returns the most recently created goal scores for a skill area", () => {
    const result = getSkillAreaScore(goals, "sa-bh");
    expect(result).toEqual({ baseline: 6, current: 7.5, target: 9 }); // g1 is newer than g2
  });

  it("returns scores for a skill area with one goal", () => {
    const result = getSkillAreaScore(goals, "sa-sh");
    expect(result).toEqual({ baseline: 5, current: 6, target: 8 });
  });

  it("returns null for a skill area with no active goals", () => {
    expect(getSkillAreaScore(goals, "sa-de")).toBeNull(); // paused, not active
  });

  it("returns null for a skill area with no goals at all", () => {
    expect(getSkillAreaScore(goals, "sa-re")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* computeRecommendation                                                */
/* ------------------------------------------------------------------ */

describe("computeRecommendation", () => {
  it("returns assign_drill for missing-data player", () => {
    const profile = makeProfile({ status: "missing-data" });
    const rec = computeRecommendation(profile, [], [], [], AS_OF);
    expect(rec.type).toBe("assign_drill");
    expect(rec.priority).toBe("high");
  });

  it("returns modify_wod for restricted player", () => {
    const profile = makeProfile({ status: "restricted" });
    const rec = computeRecommendation(profile, [], [], [], AS_OF);
    expect(rec.type).toBe("modify_wod");
    expect(rec.priority).toBe("medium");
  });

  it("returns schedule_checkin for overdue goal", () => {
    const profile = makeProfile({ status: "thriving" });
    const overdueGoal = makeGoal({ targetDate: "2026-05-01", confidence: "medium" });
    const rec = computeRecommendation(profile, [overdueGoal], [], [], AS_OF);
    expect(rec.type).toBe("schedule_checkin");
    expect(rec.priority).toBe("high");
    expect(rec.goalId).toBe(overdueGoal.id);
  });

  it("returns schedule_checkin when deadline is 4 days away with low confidence", () => {
    const profile = makeProfile({ status: "thriving" });
    const urgentGoal = makeGoal({ targetDate: "2026-05-21", confidence: "low" });
    const rec = computeRecommendation(profile, [urgentGoal], [], [], AS_OF);
    expect(rec.type).toBe("schedule_checkin");
    expect(rec.priority).toBe("high");
    expect(rec.reason).toContain("4");
  });

  it("returns add_coach_note for stale player (9 days inactive)", () => {
    const profile = makeProfile({ status: "stale", lastActivityDate: "2026-05-08" });
    const rec = computeRecommendation(profile, [], [], [], AS_OF);
    expect(rec.type).toBe("add_coach_note");
    expect(rec.priority).toBe("high");
    expect(rec.reason).toContain("9");
  });

  it("returns modify_wod when a prescription has low completion rate", () => {
    const profile = makeProfile({ status: "thriving" });
    const rx = makePrescription({ status: "active", completionRate: 0.3 });
    const rec = computeRecommendation(profile, [], [], [rx], AS_OF);
    expect(rec.type).toBe("modify_wod");
    expect(rec.priority).toBe("medium");
  });

  it("returns assign_film as fallback for healthy, active player", () => {
    const profile = makeProfile({ status: "thriving" });
    const goal = makeGoal({ targetDate: "2026-08-01", confidence: "high" });
    const rx = makePrescription({ status: "active", completionRate: 0.9 });
    const rec = computeRecommendation(profile, [goal], [], [rx], AS_OF);
    expect(rec.type).toBe("assign_film");
    expect(rec.priority).toBe("low");
  });

  it("prefers overdue over stale when both apply", () => {
    const profile = makeProfile({ status: "stale", lastActivityDate: "2026-05-08" });
    const overdueGoal = makeGoal({ targetDate: "2026-05-10", confidence: "high" });
    const rec = computeRecommendation(profile, [overdueGoal], [], [], AS_OF);
    expect(rec.type).toBe("schedule_checkin"); // overdue takes priority over stale
  });

  it("includes correct actionHref for schedule_checkin", () => {
    const profile = makeProfile({ playerId: "a_1" });
    const goal = makeGoal({ id: "goal-x", targetDate: "2026-05-01" });
    const rec = computeRecommendation(profile, [goal], [], [], AS_OF);
    expect(rec.actionHref).toBe("/app/coach/players/a_1/idp/goals/goal-x");
  });
});
