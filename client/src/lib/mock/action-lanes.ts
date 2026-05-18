/* --- Types --- */

export type LaneId =
  | "availability"
  | "readiness"
  | "attendance"
  | "development"
  | "film"
  | "prep"
  | "comms";

export type Severity = "critical" | "high" | "medium" | "low";

export type IssueSource =
  | "health_checkin"
  | "wearable"
  | "coach"
  | "system"
  | "parent"
  | "film_ai"
  | "idp";

export type ActionType =
  | "resolve"
  | "snooze"
  | "message"
  | "modify_wod"
  | "assign_film"
  | "add_note"
  | "open_idp";

export type DayType = "practice" | "game" | "tournament" | "off";

export interface LaneIssue {
  id: string;
  laneId: LaneId;
  playerId: string;
  playerName: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  initials: string;
  severity: Severity;
  reason: string;
  detail: string;
  source: IssueSource;
  lastUpdated: string;
  recommendedAction: ActionType;
  recommendedActionLabel: string;
}

export interface LaneMeta {
  id: LaneId;
  title: string;
  priority: Record<DayType, number>;
}

/* --- Lane Metadata --- */

export const LANE_META: LaneMeta[] = [
  {
    id: "availability",
    title: "Availability",
    priority: { practice: 1, game: 1, tournament: 1, off: 2 },
  },
  {
    id: "readiness",
    title: "Readiness",
    priority: { practice: 2, game: 3, tournament: 4, off: 4 },
  },
  {
    id: "attendance",
    title: "Attendance",
    priority: { practice: 3, game: 4, tournament: 3, off: 3 },
  },
  {
    id: "development",
    title: "Development",
    priority: { practice: 5, game: 7, tournament: 7, off: 1 },
  },
  {
    id: "film",
    title: "Film",
    priority: { practice: 6, game: 6, tournament: 6, off: 5 },
  },
  {
    id: "prep",
    title: "Prep",
    priority: { practice: 4, game: 2, tournament: 2, off: 7 },
  },
  {
    id: "comms",
    title: "Comms",
    priority: { practice: 7, game: 5, tournament: 5, off: 6 },
  },
];

/* --- Lane Priority Order --- */

export const LANE_PRIORITY_ORDER: Record<DayType, LaneId[]> = (() => {
  const dayTypes: DayType[] = ["practice", "game", "tournament", "off"];
  const result = {} as Record<DayType, LaneId[]>;
  for (const day of dayTypes) {
    result[day] = [...LANE_META]
      .sort((a, b) => a.priority[day] - b.priority[day])
      .map((lane) => lane.id);
  }
  return result;
})();

/* --- Helper --- */

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function getTopSeverity(issues: LaneIssue[]): Severity {
  return issues.reduce<Severity>((top, issue) => {
    return SEVERITY_RANK[issue.severity] > SEVERITY_RANK[top]
      ? issue.severity
      : top;
  }, "low");
}

/* --- Mock Issues --- */

export const MOCK_ISSUES: LaneIssue[] = [
  // DeAndre Johnson — 3 readiness (AC1)
  {
    id: "iss-dj-1",
    laneId: "readiness",
    playerId: "a_3",
    playerName: "DeAndre Johnson",
    position: "C",
    initials: "DJ",
    severity: "high",
    reason: "High soreness reported",
    detail: "Soreness score 8/10 on today's check-in. Last 3 days trend upward.",
    source: "health_checkin",
    lastUpdated: "2026-05-17T08:14:00Z",
    recommendedAction: "modify_wod",
    recommendedActionLabel: "Modify WOD",
  },
  {
    id: "iss-dj-2",
    laneId: "readiness",
    playerId: "a_3",
    playerName: "DeAndre Johnson",
    position: "C",
    initials: "DJ",
    severity: "high",
    reason: "Workload overload",
    detail: "7-day load is 142% of rolling average. Monitor acute/chronic ratio.",
    source: "wearable",
    lastUpdated: "2026-05-17T07:45:00Z",
    recommendedAction: "modify_wod",
    recommendedActionLabel: "Modify WOD",
  },
  {
    id: "iss-dj-3",
    laneId: "readiness",
    playerId: "a_3",
    playerName: "DeAndre Johnson",
    position: "C",
    initials: "DJ",
    severity: "high",
    reason: "Low recovery score",
    detail: "Wearable HRV recovery at 34% — lowest this month.",
    source: "wearable",
    lastUpdated: "2026-05-17T06:30:00Z",
    recommendedAction: "modify_wod",
    recommendedActionLabel: "Modify WOD",
  },

  // Isaiah Moore — availability (CRITICAL) + readiness (MEDIUM)
  {
    id: "iss-im-1",
    laneId: "availability",
    playerId: "a_5",
    playerName: "Isaiah Moore",
    position: "SF",
    initials: "IM",
    severity: "critical",
    reason: "Active restriction",
    detail: "Player restricted from full-contact activity. Medical clearance required before return.",
    source: "coach",
    lastUpdated: "2026-05-16T14:20:00Z",
    recommendedAction: "resolve",
    recommendedActionLabel: "Resolve",
  },
  {
    id: "iss-im-2",
    laneId: "readiness",
    playerId: "a_5",
    playerName: "Isaiah Moore",
    position: "SF",
    initials: "IM",
    severity: "medium",
    reason: "Missed WOD today",
    detail: "Isaiah has no WOD completion for today despite being on modified protocol.",
    source: "system",
    lastUpdated: "2026-05-17T09:00:00Z",
    recommendedAction: "modify_wod",
    recommendedActionLabel: "Modify WOD",
  },

  // Miles Thompson — attendance (MEDIUM) + development (MEDIUM)
  {
    id: "iss-mt-1",
    laneId: "attendance",
    playerId: "a_7",
    playerName: "Miles Thompson",
    position: "SG",
    initials: "MT",
    severity: "medium",
    reason: "Check-in not submitted",
    detail: "No check-in received today. Last active 2 days ago.",
    source: "system",
    lastUpdated: "2026-05-17T09:05:00Z",
    recommendedAction: "message",
    recommendedActionLabel: "Message Player",
  },
  {
    id: "iss-mt-2",
    laneId: "development",
    playerId: "a_7",
    playerName: "Miles Thompson",
    position: "SG",
    initials: "MT",
    severity: "medium",
    reason: "No IDP goals set",
    detail: "Player has no baseline assessment or development goals. 45 days since joining.",
    source: "idp",
    lastUpdated: "2026-05-15T10:00:00Z",
    recommendedAction: "open_idp",
    recommendedActionLabel: "Open IDP",
  },

  // Khalil Jenkins — attendance (MEDIUM) + film (LOW)
  {
    id: "iss-kj-1",
    laneId: "attendance",
    playerId: "a_6",
    playerName: "Khalil Jenkins",
    position: "PG",
    initials: "KJ",
    severity: "medium",
    reason: "Partial check-in",
    detail: "Check-in submitted but pain/soreness fields left blank.",
    source: "health_checkin",
    lastUpdated: "2026-05-17T08:50:00Z",
    recommendedAction: "message",
    recommendedActionLabel: "Message Player",
  },
  {
    id: "iss-kj-2",
    laneId: "film",
    playerId: "a_6",
    playerName: "Khalil Jenkins",
    position: "PG",
    initials: "KJ",
    severity: "low",
    reason: "2 clips pending review",
    detail: "Khalil has 2 unreviewed film clips tagged for feedback — oldest is 5 days old.",
    source: "film_ai",
    lastUpdated: "2026-05-15T11:30:00Z",
    recommendedAction: "assign_film",
    recommendedActionLabel: "Assign Film",
  },

  // Devin Hayes — attendance (MEDIUM) + comms (MEDIUM)
  {
    id: "iss-dh-1",
    laneId: "attendance",
    playerId: "a_11",
    playerName: "Devin Hayes",
    position: "PF",
    initials: "DH",
    severity: "medium",
    reason: "Absent yesterday",
    detail: "Devin was absent without excuse yesterday. Third absence this month.",
    source: "system",
    lastUpdated: "2026-05-16T18:00:00Z",
    recommendedAction: "message",
    recommendedActionLabel: "Message Player",
  },
  {
    id: "iss-dh-2",
    laneId: "comms",
    playerId: "a_11",
    playerName: "Devin Hayes",
    position: "PF",
    initials: "DH",
    severity: "medium",
    reason: "Parent message unanswered",
    detail: "Parent Sandra Hayes sent a message 2 days ago about playing time. No coach reply yet.",
    source: "parent",
    lastUpdated: "2026-05-15T16:42:00Z",
    recommendedAction: "message",
    recommendedActionLabel: "Reply to Parent",
  },

  // Jalen Carter — development (HIGH) + prep (LOW)
  {
    id: "iss-jc-1",
    laneId: "development",
    playerId: "a_1",
    playerName: "Jalen Carter",
    position: "PG",
    initials: "JC",
    severity: "high",
    reason: "Goal deadline in 4 days",
    detail: "Shooting goal target date is May 21 with LOW confidence. 40% progress toward target.",
    source: "idp",
    lastUpdated: "2026-05-17T07:00:00Z",
    recommendedAction: "open_idp",
    recommendedActionLabel: "Open IDP",
  },
  {
    id: "iss-jc-2",
    laneId: "prep",
    playerId: "a_1",
    playerName: "Jalen Carter",
    position: "PG",
    initials: "JC",
    severity: "low",
    reason: "Scouting assignment incomplete",
    detail: "Jalen was assigned to review Oak Hill game film before Saturday. Not started.",
    source: "coach",
    lastUpdated: "2026-05-16T09:15:00Z",
    recommendedAction: "assign_film",
    recommendedActionLabel: "Assign Film",
  },

  // Tyrese Brooks — development (HIGH)
  {
    id: "iss-tb-1",
    laneId: "development",
    playerId: "a_4",
    playerName: "Tyrese Brooks",
    position: "SG",
    initials: "TB",
    severity: "high",
    reason: "IDP stale — 9 days",
    detail: "No development activity logged in 9 days. Two active goals are drifting.",
    source: "idp",
    lastUpdated: "2026-05-15T08:00:00Z",
    recommendedAction: "add_note",
    recommendedActionLabel: "Add Note",
  },

  // Marcus Williams — prep (LOW)
  {
    id: "iss-mw-1",
    laneId: "prep",
    playerId: "a_2",
    playerName: "Marcus Williams",
    position: "SF",
    initials: "MW",
    severity: "low",
    reason: "Practice plan not finalized",
    detail: "Marcus is team captain. Practice plan for Thursday hasn't been reviewed by player leadership.",
    source: "coach",
    lastUpdated: "2026-05-16T15:00:00Z",
    recommendedAction: "add_note",
    recommendedActionLabel: "Add Note",
  },
];
