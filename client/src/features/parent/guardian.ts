/**
 * Guardian / Parent account model.
 *
 * Two mock guardian personas:
 *  - Sandra Hayes  — parent of ONE player (Devin Hayes, a_11)
 *  - Marcus & Lisa Thompson — parents of TWO players (Miles Thompson a_7,
 *    and younger sibling Dante Thompson a_12)
 *
 * Visibility controls let coaches decide per-player per-guardian which
 * data surfaces in the parent portal. Coach notes are private by default.
 *
 * Direct messages and announcement read receipts are modelled here so the
 * messages page and the announcements page can derive read/unread state
 * without hitting the server in demo mode.
 */

/* ─── Guardian account ───────────────────────────────────────────────────── */

export type Relationship = "mother" | "father" | "guardian" | "grandparent" | "other";

export interface GuardianAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  relationship: Relationship;
  /** IDs of roster athletes this guardian can access */
  linkedPlayerIds: string[];
  /** The guardian currently signed in to the demo session */
  isActiveDemo?: boolean;
}

export const GUARDIAN_ACCOUNTS: GuardianAccount[] = [
  {
    id: "g_1",
    name: "Sandra Hayes",
    email: "sandra.hayes@email.com",
    phone: "(713) 555-0142",
    relationship: "mother",
    linkedPlayerIds: ["a_11"],           // Devin Hayes only
    isActiveDemo: true,
  },
  {
    id: "g_2",
    name: "Marcus Thompson",
    email: "marcus.thompson@email.com",
    phone: "(832) 555-0277",
    relationship: "father",
    linkedPlayerIds: ["a_7", "a_12"],   // Miles Thompson + Dante Thompson
  },
];

/* ─── Player profiles (parent-safe shape) ───────────────────────────────── */

export interface GuardianPlayerProfile {
  id: string;               // roster id
  name: string;
  initials: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  jerseyNumber: string;
  team: string;
  gradYear: number;
  coachName: string;
  /** Current streak in days */
  streak: number;
  /** Overall readiness trend label — only shown if visibility allows */
  readinessTrend: "improving" | "stable" | "declining" | "restricted";
  /** Injury flag — only exposed if visibility allows */
  hasActiveInjuryFlag: boolean;
  injuryNote?: string;      // e.g. "Left knee — monitoring"
}

export const GUARDIAN_PLAYER_PROFILES: Record<string, GuardianPlayerProfile> = {
  a_11: {
    id: "a_11",
    name: "Devin Hayes",
    initials: "DH",
    position: "PF",
    jerseyNumber: "11",
    team: "Texas Elite Varsity",
    gradYear: 2027,
    coachName: "Coach Grant",
    streak: 4,
    readinessTrend: "stable",
    hasActiveInjuryFlag: false,
  },
  a_7: {
    id: "a_7",
    name: "Miles Thompson",
    initials: "MT",
    position: "SG",
    jerseyNumber: "7",
    team: "Texas Elite Varsity",
    gradYear: 2027,
    coachName: "Coach Grant",
    streak: 2,
    readinessTrend: "declining",
    hasActiveInjuryFlag: false,
  },
  a_12: {
    id: "a_12",
    name: "Dante Thompson",
    initials: "DT",
    position: "PG",
    jerseyNumber: "4",
    team: "Texas Elite JV",
    gradYear: 2029,
    coachName: "Coach Rivera",
    streak: 8,
    readinessTrend: "improving",
    hasActiveInjuryFlag: false,
  },
};

/* ─── Visibility controls ────────────────────────────────────────────────── */

/**
 * Coaches configure per-player per-guardian visibility.
 * Defaults: most info shown, coach notes hidden.
 */
export interface VisibilityControls {
  guardianId: string;
  playerId: string;
  /** Show daily readiness scores and 7-day trend */
  showReadiness: boolean;
  /** Surface active injury flags to guardian */
  showInjuryStatus: boolean;
  /** Show IDP goals, progress bars, and next milestones */
  showDevelopmentGoals: boolean;
  /**
   * Show coach-authored private notes.
   * DEFAULT: false — private notes never surface to guardians unless
   * a coach explicitly flips this on.
   */
  showCoachNotes: boolean;
  /** Show attendance record */
  showAttendance: boolean;
  /** Show film / drill assignments */
  showAssignments: boolean;
}

export const VISIBILITY_CONTROLS: VisibilityControls[] = [
  // Sandra Hayes → Devin Hayes
  {
    guardianId: "g_1",
    playerId: "a_11",
    showReadiness: true,
    showInjuryStatus: true,
    showDevelopmentGoals: true,
    showCoachNotes: false,       // private — coach has not enabled this
    showAttendance: true,
    showAssignments: false,
  },
  // Marcus Thompson → Miles Thompson
  {
    guardianId: "g_2",
    playerId: "a_7",
    showReadiness: true,
    showInjuryStatus: true,
    showDevelopmentGoals: true,
    showCoachNotes: false,
    showAttendance: true,
    showAssignments: true,
  },
  // Marcus Thompson → Dante Thompson
  {
    guardianId: "g_2",
    playerId: "a_12",
    showReadiness: false,        // JV coach hasn't enabled yet
    showInjuryStatus: true,
    showDevelopmentGoals: true,
    showCoachNotes: false,
    showAttendance: true,
    showAssignments: false,
  },
];

export function getVisibility(
  guardianId: string,
  playerId: string
): VisibilityControls {
  return (
    VISIBILITY_CONTROLS.find(
      (v) => v.guardianId === guardianId && v.playerId === playerId
    ) ?? {
      guardianId,
      playerId,
      showReadiness: false,
      showInjuryStatus: false,
      showDevelopmentGoals: false,
      showCoachNotes: false,
      showAttendance: false,
      showAssignments: false,
    }
  );
}

/* ─── Parent-visible development goals ──────────────────────────────────── */

export interface ParentGoalSummary {
  id: string;
  playerId: string;
  title: string;
  skillArea: string;
  /** 0–100 */
  progressPct: number;
  targetDate: string;
  /** Risk label shown to parents in friendly language */
  statusLabel: "On Track" | "Needs Attention" | "Great Progress" | "Deadline Soon";
  statusColor: "green" | "yellow" | "orange" | "purple";
  /** Parent-safe milestone description — no private coach tactical notes */
  nextMilestone: string;
  /**
   * Optional coach note shown ONLY if VisibilityControls.showCoachNotes = true.
   * This field must be filtered out before rendering to parents unless the
   * visibility flag is on.
   */
  privateCoachNote?: string;
}

export const PARENT_GOAL_SUMMARIES: ParentGoalSummary[] = [
  // Devin Hayes goals
  {
    id: "pg_dh_1",
    playerId: "a_11",
    title: "Post Footwork",
    skillArea: "Low Post",
    progressPct: 62,
    targetDate: "2026-06-15",
    statusLabel: "On Track",
    statusColor: "green",
    nextMilestone: "Complete 3 consecutive practices demonstrating drop-step consistency",
    privateCoachNote: "Devin's footwork has improved but he still telegraphs the baseline move — coach drill focus this week.",
  },
  {
    id: "pg_dh_2",
    playerId: "a_11",
    title: "Free Throw Shooting",
    skillArea: "Shooting",
    progressPct: 38,
    targetDate: "2026-05-31",
    statusLabel: "Needs Attention",
    statusColor: "yellow",
    nextMilestone: "Reach 65% FT% in a simulated pressure session",
    privateCoachNote: "Mental pressure situations are the root issue — added pre-shot routine work this week.",
  },
  // Miles Thompson goals
  {
    id: "pg_mt_1",
    playerId: "a_7",
    title: "Pull-Up Jumper",
    skillArea: "Shooting",
    progressPct: 48,
    targetDate: "2026-06-01",
    statusLabel: "Needs Attention",
    statusColor: "yellow",
    nextMilestone: "Log 5 IDP drill completions with form check",
    privateCoachNote: "Miles has skipped the last 3 WODs — no development activity logged in 9 days. Direct conversation needed.",
  },
  {
    id: "pg_mt_2",
    playerId: "a_7",
    title: "Court Vision",
    skillArea: "Playmaking",
    progressPct: 71,
    targetDate: "2026-07-01",
    statusLabel: "Great Progress",
    statusColor: "purple",
    nextMilestone: "Film review session to reinforce decision-making reads",
    privateCoachNote: "Best improvement on the roster this month. Feature in team film session.",
  },
  // Dante Thompson goals
  {
    id: "pg_dt_1",
    playerId: "a_12",
    title: "Ball Handling Under Pressure",
    skillArea: "Ball Handling",
    progressPct: 55,
    targetDate: "2026-06-30",
    statusLabel: "On Track",
    statusColor: "green",
    nextMilestone: "Complete stationary and live-dribble pressure drills at Level 3",
    privateCoachNote: "Dante is ahead of schedule for his age group — monitor for promotion to Varsity tryout.",
  },
];

/* ─── Announcement read receipts ────────────────────────────────────────── */

export interface AnnouncementReadReceipt {
  announcementId: string;
  guardianId: string;
  readAt: string; // ISO
}

/** Sandra Hayes has read ann_4 and ann_3 but NOT ann_1 (urgent) or ann_2 */
export const ANNOUNCEMENT_READ_RECEIPTS: AnnouncementReadReceipt[] = [
  { announcementId: "ann_3", guardianId: "g_1", readAt: "2026-05-11T14:22:00Z" },
  { announcementId: "ann_4", guardianId: "g_1", readAt: "2026-05-01T09:15:00Z" },
  { announcementId: "ann_1", guardianId: "g_2", readAt: "2026-05-13T16:00:00Z" },
  { announcementId: "ann_2", guardianId: "g_2", readAt: "2026-05-12T20:00:00Z" },
  { announcementId: "ann_3", guardianId: "g_2", readAt: "2026-05-11T19:00:00Z" },
  { announcementId: "ann_4", guardianId: "g_2", readAt: "2026-05-01T10:00:00Z" },
];

export function isAnnouncementRead(
  announcementId: string,
  guardianId: string
): boolean {
  return ANNOUNCEMENT_READ_RECEIPTS.some(
    (r) => r.announcementId === announcementId && r.guardianId === guardianId
  );
}

export function getReadAt(
  announcementId: string,
  guardianId: string
): string | null {
  return (
    ANNOUNCEMENT_READ_RECEIPTS.find(
      (r) => r.announcementId === announcementId && r.guardianId === guardianId
    )?.readAt ?? null
  );
}

/* ─── Direct messages ────────────────────────────────────────────────────── */

export type MessageType = "announcement" | "direct";
export type SenderRole = "coach" | "admin" | "guardian";

export interface DirectMessage {
  id: string;
  threadId: string;
  messageType: MessageType;
  from: { id: string; name: string; role: SenderRole };
  /** Recipient guardian id */
  toGuardianId: string;
  /** Optional: message is about a specific player */
  relatedPlayerId?: string;
  subject: string;
  body: string;
  sentAt: string;
  /** null = unread */
  readAt?: string;
  /** Whether the guardian has replied */
  hasReply?: boolean;
}

export interface MessageThread {
  threadId: string;
  subject: string;
  relatedPlayerId?: string;
  messages: DirectMessage[];
  lastMessageAt: string;
  isRead: boolean;
}

export const DIRECT_MESSAGES: DirectMessage[] = [
  // Sandra Hayes — unread message from Coach Grant about Devin
  {
    id: "dm_1",
    threadId: "thread_1",
    messageType: "direct",
    from: { id: "u_coach_1", name: "Coach Grant", role: "coach" },
    toGuardianId: "g_1",
    relatedPlayerId: "a_11",
    subject: "Quick update on Devin — playing time",
    body: "Hi Sandra, I wanted to reach out about Devin's playing time this week. We've been working on his conditioning and he's shown real improvement. I'd like to schedule a quick 10-minute call to align on his development plan. Does Thursday or Friday work for you?",
    sentAt: "2026-05-15T16:42:00Z",
    readAt: undefined,
  },
  // Sandra Hayes — older read thread
  {
    id: "dm_2",
    threadId: "thread_2",
    messageType: "direct",
    from: { id: "u_coach_1", name: "Coach Grant", role: "coach" },
    toGuardianId: "g_1",
    relatedPlayerId: "a_11",
    subject: "Devin's attendance — May 8th absence",
    body: "Hi Sandra, just following up on Devin's absence on May 8th. Please make sure he submits an absence request through the portal or let me know if there was an emergency. Third absence this month — wanted to flag it before it becomes a pattern.",
    sentAt: "2026-05-09T10:00:00Z",
    readAt: "2026-05-09T18:32:00Z",
  },
  {
    id: "dm_3",
    threadId: "thread_2",
    messageType: "direct",
    from: { id: "g_1", name: "Sandra Hayes", role: "guardian" },
    toGuardianId: "g_1", // self (sent by guardian)
    relatedPlayerId: "a_11",
    subject: "Re: Devin's attendance — May 8th absence",
    body: "Coach Grant, I'm sorry about that — Devin had a family commitment I forgot to submit. It won't happen again. We've talked about it at home. Thank you for the heads up.",
    sentAt: "2026-05-09T19:15:00Z",
    readAt: "2026-05-09T19:15:00Z",
    hasReply: true,
  },
  // Marcus Thompson threads
  {
    id: "dm_4",
    threadId: "thread_3",
    messageType: "direct",
    from: { id: "u_coach_1", name: "Coach Grant", role: "coach" },
    toGuardianId: "g_2",
    relatedPlayerId: "a_7",
    subject: "Miles — check-in and development goals",
    body: "Hi Marcus, Miles has some real upside but we need him logging more reps in the portal. He's missed a few WODs and his IDP hasn't been updated in 9 days. Let's talk about what's going on and how we can support him. Available for a call this week?",
    sentAt: "2026-05-16T11:00:00Z",
    readAt: undefined,
  },
  {
    id: "dm_5",
    threadId: "thread_4",
    messageType: "direct",
    from: { id: "u_coach_2", name: "Coach Rivera", role: "coach" },
    toGuardianId: "g_2",
    relatedPlayerId: "a_12",
    subject: "Great week from Dante!",
    body: "Just wanted to let you know Dante had an outstanding week. His ball-handling reps have been consistent and he's showing real coachability. Keep encouraging him to log his daily WODs — the habit is everything at this age.",
    sentAt: "2026-05-14T15:30:00Z",
    readAt: "2026-05-14T20:00:00Z",
  },
];

/** Group messages into threads for the inbox view */
export function getThreadsForGuardian(guardianId: string): MessageThread[] {
  const msgs = DIRECT_MESSAGES.filter(
    (m) => m.toGuardianId === guardianId
  );

  const threadMap = new Map<string, DirectMessage[]>();
  for (const m of msgs) {
    const existing = threadMap.get(m.threadId);
    if (existing) {
      existing.push(m);
    } else {
      threadMap.set(m.threadId, [m]);
    }
  }

  const threads: MessageThread[] = [];
  for (const [threadId, messages] of Array.from(threadMap.entries())) {
    const sorted = [...messages].sort((a, b) =>
      b.sentAt.localeCompare(a.sentAt)
    );
    threads.push({
      threadId,
      subject: sorted[0].subject,
      relatedPlayerId: sorted[0].relatedPlayerId,
      messages: sorted,
      lastMessageAt: sorted[0].sentAt,
      isRead: sorted.every((m) => !!m.readAt),
    });
  }

  return threads.sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt)
  );
}

/* ─── Active demo guardian (Sandra Hayes) ───────────────────────────────── */

export const ACTIVE_GUARDIAN = GUARDIAN_ACCOUNTS[0]; // Sandra Hayes
