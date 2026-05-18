/**
 * Player Daily Check-In & WOD Loop — mock data.
 *
 * Extends the base readiness model with:
 *  - Stress score
 *  - Injury concern flag + affected area text
 *  - Availability declaration (full / limited / unavailable)
 *  - WOD completion states (not_started / in_progress / completed / skipped / modified_by_coach)
 *  - Coach alerts generated from check-in guardrails
 *  - Development evidence records produced when WOD is completed
 *
 * Coach side reads:
 *  - Injury concern → availability lane issue (source: "health_checkin")
 *  - Low sleep + high soreness → readiness lane issue (source: "health_checkin")
 *  - WOD completion → DevelopmentEvidence (type: "workout")
 */

import type { LaneIssue } from "@/lib/mock/action-lanes";
import type { DevelopmentEvidence } from "@/lib/mock/player-development";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Availability = "full" | "limited" | "unavailable";

export type WodState =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped"
  | "modified_by_coach";

export type SkipReason =
  | "injury"
  | "illness"
  | "personal"
  | "too_fatigued"
  | "coach_excused"
  | "other";

export interface ExtendedCheckin {
  id: string;
  playerId: string;
  date: string; // ISO yyyy-mm-dd
  /** 1 = no soreness, 5 = very sore */
  soreness: 1 | 2 | 3 | 4 | 5;
  /** 1 = terrible, 5 = great */
  sleep: 1 | 2 | 3 | 4 | 5;
  /** 1 = exhausted, 5 = fully charged */
  energy: 1 | 2 | 3 | 4 | 5;
  /** 1 = very calm, 5 = extremely stressed */
  stress: 1 | 2 | 3 | 4 | 5;
  /** True if player flagged a pain / injury concern */
  injuryConcern: boolean;
  /** Free text: which area / what happened */
  injuryArea?: string;
  /** Player's declared availability for today's session */
  availability: Availability;
  /** Optional free-text note */
  note?: string;
  /** 0–100 composite readiness score */
  readinessScore: number;
  /** Traffic-light flag */
  flag: "green" | "yellow" | "red" | "restricted";
  /** Guardrails triggered at submit time */
  triggeredGuardrails: GuardrailType[];
}

export type GuardrailType =
  | "low_sleep_high_soreness"    // sleep ≤ 2 AND soreness ≥ 4
  | "injury_concern"             // injuryConcern === true
  | "unavailable"                // availability === "unavailable"
  | "high_stress"                // stress === 5
  | "extreme_fatigue";           // soreness === 5 AND energy === 1

export interface WodCompletion {
  id: string;
  playerId: string;
  date: string; // ISO yyyy-mm-dd
  /** WOD title */
  wodTitle: string;
  /** WOD id from the workout catalog */
  wodId: string;
  state: WodState;
  /** Elapsed time in minutes if completed or in_progress */
  elapsedMinutes?: number;
  /** Total WOD duration in minutes */
  plannedMinutes: number;
  /** How many drills completed */
  drillsCompleted: number;
  drillsTotal: number;
  skipReason?: SkipReason;
  skipNote?: string;
  /** If coach modified — short description of what changed */
  coachModification?: string;
  /** XP awarded on completion */
  xpAwarded?: number;
  /** Whether completion was logged as IDP development evidence */
  evidenceId?: string;
}

// ─── Guardrail evaluator ─────────────────────────────────────────────────────

export function evaluateGuardrails(
  soreness: number,
  sleep: number,
  energy: number,
  stress: number,
  injuryConcern: boolean,
  availability: Availability
): GuardrailType[] {
  const triggered: GuardrailType[] = [];
  if (sleep <= 2 && soreness >= 4) triggered.push("low_sleep_high_soreness");
  if (injuryConcern) triggered.push("injury_concern");
  if (availability === "unavailable") triggered.push("unavailable");
  if (stress === 5) triggered.push("high_stress");
  if (soreness === 5 && energy === 1) triggered.push("extreme_fatigue");
  return triggered;
}

export const GUARDRAIL_MESSAGES: Record<GuardrailType, string> = {
  low_sleep_high_soreness:
    "⚠️ Low sleep + high soreness detected. Your coach has been notified and will review your session load.",
  injury_concern:
    "🚨 Injury concern flagged. Your coach will see this before practice — they may modify or excuse you.",
  unavailable:
    "You've marked yourself unavailable. Your coach has been notified.",
  high_stress:
    "High stress reported. Your coach will be aware — focus on recovery today.",
  extreme_fatigue:
    "Extreme fatigue detected. Rest may be the best training today.",
};

// ─── Coach alert builder ─────────────────────────────────────────────────────

/**
 * Converts a check-in's guardrails into `LaneIssue` records for the coach
 * action lanes. In production these would be persisted server-side.
 */
export function buildCoachAlerts(checkin: ExtendedCheckin): LaneIssue[] {
  const alerts: LaneIssue[] = [];
  const now = new Date().toISOString();

  if (checkin.triggeredGuardrails.includes("injury_concern")) {
    alerts.push({
      id: `alert-${checkin.id}-injury`,
      laneId: "availability",
      playerId: checkin.playerId,
      playerName: "Jalen Carter", // would be resolved from player profile
      position: "PG",
      initials: "JC",
      severity: "critical",
      reason: "Injury concern flagged",
      detail: checkin.injuryArea
        ? `Player reported pain in: ${checkin.injuryArea}. Flagged during today's check-in.`
        : "Player flagged an injury concern during today's check-in.",
      source: "health_checkin",
      lastUpdated: now,
      recommendedAction: "resolve",
      recommendedActionLabel: "Resolve",
    });
  }

  if (checkin.triggeredGuardrails.includes("low_sleep_high_soreness")) {
    alerts.push({
      id: `alert-${checkin.id}-readiness`,
      laneId: "readiness",
      playerId: checkin.playerId,
      playerName: "Jalen Carter",
      position: "PG",
      initials: "JC",
      severity: "high",
      reason: "Low sleep + high soreness",
      detail: `Check-in: Sleep ${checkin.sleep}/5 · Soreness ${checkin.soreness}/5. Readiness score ${checkin.readinessScore}.`,
      source: "health_checkin",
      lastUpdated: now,
      recommendedAction: "modify_wod",
      recommendedActionLabel: "Modify WOD",
    });
  }

  return alerts;
}

// ─── WOD evidence builder ─────────────────────────────────────────────────────

/**
 * Converts a completed WOD into a `DevelopmentEvidence` record for the
 * player IDP. In production this would be persisted server-side.
 */
export function buildWodEvidence(
  wod: WodCompletion,
  goalId: string
): DevelopmentEvidence {
  return {
    id: `ev-wod-${wod.id}`,
    playerId: wod.playerId,
    goalId,
    type: "wod_completion",
    date: wod.date,
    title: `Completed: ${wod.wodTitle}`,
    summary: `${wod.drillsCompleted}/${wod.drillsTotal} drills · ${wod.elapsedMinutes ?? wod.plannedMinutes} min`,
    completionPct: Math.round((wod.drillsCompleted / wod.drillsTotal) * 100),
  };
}

// ─── Mock: Jalen Carter's check-in history (last 7 days) ─────────────────────

export const myCheckinHistory: ExtendedCheckin[] = [
  {
    id: "eci-jc-1",
    playerId: "a_1",
    date: "2026-05-17",
    soreness: 2,
    sleep: 4,
    energy: 4,
    stress: 2,
    injuryConcern: false,
    availability: "full",
    readinessScore: 81,
    flag: "green",
    triggeredGuardrails: [],
  },
  {
    id: "eci-jc-2",
    playerId: "a_1",
    date: "2026-05-16",
    soreness: 3,
    sleep: 3,
    energy: 3,
    stress: 3,
    injuryConcern: false,
    availability: "full",
    readinessScore: 62,
    flag: "yellow",
    triggeredGuardrails: [],
  },
  {
    id: "eci-jc-3",
    playerId: "a_1",
    date: "2026-05-15",
    soreness: 4,
    sleep: 2,
    energy: 2,
    stress: 4,
    injuryConcern: true,
    injuryArea: "Left knee — sharp pain during cuts",
    availability: "limited",
    note: "Knee buckled a bit on practice cuts yesterday",
    readinessScore: 25,
    flag: "red",
    triggeredGuardrails: ["low_sleep_high_soreness", "injury_concern"],
  },
  {
    id: "eci-jc-4",
    playerId: "a_1",
    date: "2026-05-14",
    soreness: 1,
    sleep: 5,
    energy: 5,
    stress: 1,
    injuryConcern: false,
    availability: "full",
    readinessScore: 100,
    flag: "green",
    triggeredGuardrails: [],
  },
  {
    id: "eci-jc-5",
    playerId: "a_1",
    date: "2026-05-13",
    soreness: 2,
    sleep: 4,
    energy: 4,
    stress: 2,
    injuryConcern: false,
    availability: "full",
    readinessScore: 81,
    flag: "green",
    triggeredGuardrails: [],
  },
  {
    id: "eci-jc-6",
    playerId: "a_1",
    date: "2026-05-12",
    soreness: 1,
    sleep: 5,
    energy: 5,
    stress: 1,
    injuryConcern: false,
    availability: "full",
    readinessScore: 100,
    flag: "green",
    triggeredGuardrails: [],
  },
  {
    id: "eci-jc-7",
    playerId: "a_1",
    date: "2026-05-11",
    soreness: 3,
    sleep: 3,
    energy: 3,
    stress: 3,
    injuryConcern: false,
    availability: "full",
    readinessScore: 62,
    flag: "yellow",
    triggeredGuardrails: [],
  },
];

/** True = today's check-in is already submitted (flip to false to see the form) */
export const todayCheckinDone = false;

// ─── Mock: Jalen Carter's WOD history (last 7 days) ─────────────────────────

export const myWodHistory: WodCompletion[] = [
  {
    id: "wod-jc-1",
    playerId: "a_1",
    date: "2026-05-18",
    wodTitle: "Shooting Mechanics + Ball Handling",
    wodId: "wod_today",
    state: "not_started",
    plannedMinutes: 28,
    drillsCompleted: 0,
    drillsTotal: 5,
  },
  {
    id: "wod-jc-2",
    playerId: "a_1",
    date: "2026-05-17",
    wodTitle: "Off-Ball Movement + Screens",
    wodId: "wod_0517",
    state: "completed",
    elapsedMinutes: 31,
    plannedMinutes: 28,
    drillsCompleted: 5,
    drillsTotal: 5,
    xpAwarded: 240,
    evidenceId: "ev-wod-jc-2",
  },
  {
    id: "wod-jc-3",
    playerId: "a_1",
    date: "2026-05-16",
    wodTitle: "1v1 Finishing Package",
    wodId: "wod_0516",
    state: "modified_by_coach",
    elapsedMinutes: 22,
    plannedMinutes: 35,
    drillsCompleted: 3,
    drillsTotal: 6,
    coachModification: "Reduced intensity — knee soreness noted from check-in.",
    xpAwarded: 150,
  },
  {
    id: "wod-jc-4",
    playerId: "a_1",
    date: "2026-05-15",
    wodTitle: "Active Recovery + Mobility",
    wodId: "wod_0515",
    state: "skipped",
    plannedMinutes: 20,
    drillsCompleted: 0,
    drillsTotal: 4,
    skipReason: "injury",
    skipNote: "Knee pain — coach excused me from today's WOD.",
  },
  {
    id: "wod-jc-5",
    playerId: "a_1",
    date: "2026-05-14",
    wodTitle: "PG Skill Circuit",
    wodId: "wod_0514",
    state: "completed",
    elapsedMinutes: 27,
    plannedMinutes: 28,
    drillsCompleted: 5,
    drillsTotal: 5,
    xpAwarded: 240,
    evidenceId: "ev-wod-jc-5",
  },
  {
    id: "wod-jc-6",
    playerId: "a_1",
    date: "2026-05-13",
    wodTitle: "Shooting Mechanics + Ball Handling",
    wodId: "wod_0513",
    state: "completed",
    elapsedMinutes: 29,
    plannedMinutes: 28,
    drillsCompleted: 5,
    drillsTotal: 5,
    xpAwarded: 240,
    evidenceId: "ev-wod-jc-6",
  },
  {
    id: "wod-jc-7",
    playerId: "a_1",
    date: "2026-05-12",
    wodTitle: "Defensive Footwork Fundamentals",
    wodId: "wod_0512",
    state: "completed",
    elapsedMinutes: 28,
    plannedMinutes: 28,
    drillsCompleted: 5,
    drillsTotal: 5,
    xpAwarded: 240,
    evidenceId: "ev-wod-jc-7",
  },
];

/** Today's WOD record for Jalen Carter */
export const todayWodRecord = myWodHistory[0];

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  injury: "Injury / Pain",
  illness: "Illness",
  personal: "Personal reason",
  too_fatigued: "Too fatigued",
  coach_excused: "Coach excused",
  other: "Other",
};
