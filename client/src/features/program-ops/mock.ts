/**
 * Program Operations Foundation — mock data.
 *
 * Covers:
 *  - Organization → Programs → Teams → Rosters
 *  - Multi-team coach model with program switcher context
 *  - Segmented announcements with per-team/role delivery lists
 *  - Roster import types (CSV parse + preview)
 *  - Extended event types: travel, meeting
 *  - Tournament weekend groups (multiple games in one event)
 *
 * Acceptance criteria baked in:
 *  ✓ Coach belongs to multiple teams → program switcher changes dashboard data
 *  ✓ Tournament has 3 pool-play games + locations + readiness reminders
 *  ✓ Announcement targets "Varsity parents" → only Varsity guardian recipients
 */

/* ─── Organisation ──────────────────────────────────────────────────────────── */

export type OrgType = "high_school" | "aau" | "academy" | "club";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  city: string;
  state: string;
  logoInitials: string;
  primaryHue: number;   // OKLCH hue angle
}

export const ORGANIZATION: Organization = {
  id: "org_barnegat",
  name: "Barnegat Basketball",
  type: "high_school",
  city: "Barnegat",
  state: "NJ",
  logoInitials: "BB",
  primaryHue: 220,
};

/* ─── Program levels ────────────────────────────────────────────────────────── */

export type ProgramLevel =
  | "varsity"
  | "jv"
  | "freshman"
  | "aau_17u"
  | "aau_15u"
  | "aau_13u";

export const PROGRAM_LEVEL_LABEL: Record<ProgramLevel, string> = {
  varsity:    "Varsity",
  jv:         "JV",
  freshman:   "Freshman",
  aau_17u:    "AAU 17U",
  aau_15u:    "AAU 15U",
  aau_13u:    "AAU 13U",
};

export const PROGRAM_LEVEL_AGE: Record<ProgramLevel, string> = {
  varsity:    "Grades 9–12",
  jv:         "Grades 9–10",
  freshman:   "Grade 9",
  aau_17u:    "17 & Under",
  aau_15u:    "15 & Under",
  aau_13u:    "13 & Under",
};

/* ─── Program entity ─────────────────────────────────────────────────────────── */

export interface ProgramRoster {
  playerId: string;
  playerName: string;
  initials: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  jerseyNumber: number;
  grade: string;
  ageGroup: string;
  status: "active" | "trial" | "injured" | "inactive";
  availability: "available" | "limited" | "unavailable";
  paymentStatus: "paid" | "partial" | "overdue";
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

export interface Program {
  id: string;
  orgId: string;
  name: string;
  level: ProgramLevel;
  season: string;
  record: { wins: number; losses: number };
  rosterCount: number;
  coachIds: string[];
  roster: ProgramRoster[];
  nextGame?: { opponent: string; date: string; time: string; location: string };
  nextPractice?: { date: string; time: string; location: string };
  pendingAlerts: number;
  paymentHealth: number;   // 0–1 (fraction paid in full)
  attendanceRate: number;  // 0–1
  notes?: string;
}

export const PROGRAMS: Program[] = [
  // ── Varsity ────────────────────────────────────────────────────────────────
  {
    id: "prog_varsity",
    orgId: "org_barnegat",
    name: "Varsity Boys",
    level: "varsity",
    season: "2025–26",
    record: { wins: 14, losses: 6 },
    rosterCount: 12,
    coachIds: ["coach_grant", "coach_martinez"],
    paymentHealth: 0.83,
    attendanceRate: 0.91,
    pendingAlerts: 3,
    nextGame: {
      opponent: "Toms River North",
      date: "Fri May 22",
      time: "7:00 PM",
      location: "Away — TRN Gymnasium",
    },
    nextPractice: {
      date: "Wed May 20",
      time: "3:30 PM",
      location: "Main Gym",
    },
    roster: [
      { playerId: "a_1",  playerName: "Jalen Carter",    initials: "JC", position: "PG", jerseyNumber: 3,  grade: "11", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Sandra Carter",    parentEmail: "scarter@email.com",   parentPhone: "(609) 555-0101" },
      { playerId: "a_2",  playerName: "Marcus Williams", initials: "MW", position: "SG", jerseyNumber: 12, grade: "12", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Robert Williams",  parentEmail: "rwilliams@email.com", parentPhone: "(609) 555-0102" },
      { playerId: "a_3",  playerName: "DeAndre Johnson", initials: "DJ", position: "SF", jerseyNumber: 23, grade: "10", ageGroup: "17U", status: "active",  availability: "limited",     paymentStatus: "overdue", parentName: "Tamara Johnson",   parentEmail: "tjohnson@email.com",  parentPhone: "(609) 555-0103" },
      { playerId: "a_4",  playerName: "Tyrese Brooks",   initials: "TB", position: "PF", jerseyNumber: 34, grade: "11", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Cassandra Brooks", parentEmail: "cbrooks@email.com",   parentPhone: "(609) 555-0104" },
      { playerId: "a_5",  playerName: "Isaiah Moore",    initials: "IM", position: "C",  jerseyNumber: 44, grade: "12", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "partial", parentName: "Denise Moore",     parentEmail: "dmoore@email.com",    parentPhone: "(609) 555-0105" },
      { playerId: "a_6",  playerName: "Khalil Jenkins",  initials: "KJ", position: "PG", jerseyNumber: 5,  grade: "10", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Michael Jenkins",  parentEmail: "mjenkins@email.com",  parentPhone: "(609) 555-0106" },
      { playerId: "a_7",  playerName: "Miles Thompson",  initials: "MT", position: "SG", jerseyNumber: 11, grade: "11", ageGroup: "17U", status: "injured", availability: "unavailable", paymentStatus: "paid",    parentName: "Gina Thompson",    parentEmail: "gthompson@email.com", parentPhone: "(609) 555-0107" },
      { playerId: "a_8",  playerName: "Jordan Davis",    initials: "JD", position: "SF", jerseyNumber: 22, grade: "12", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Monica Davis",     parentEmail: "mdavis@email.com",    parentPhone: "(609) 555-0108" },
      { playerId: "a_9",  playerName: "Darius Grant",    initials: "DG", position: "PF", jerseyNumber: 32, grade: "11", ageGroup: "17U", status: "active",  availability: "limited",     paymentStatus: "overdue", parentName: "Felicia Grant",    parentEmail: "fgrant@email.com",    parentPhone: "(609) 555-0109" },
      { playerId: "a_10", playerName: "Tre Simmons",     initials: "TS", position: "C",  jerseyNumber: 50, grade: "10", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Claudette Simmons",parentEmail: "csimmons@email.com",  parentPhone: "(609) 555-0110" },
      { playerId: "a_11", playerName: "Devin Hayes",     initials: "DH", position: "PG", jerseyNumber: 1,  grade: "11", ageGroup: "17U", status: "active",  availability: "available",   paymentStatus: "paid",    parentName: "Sandra Hayes",     parentEmail: "shayes@email.com",    parentPhone: "(609) 555-0111" },
      { playerId: "a_12", playerName: "Elijah Thompson", initials: "ET", position: "SG", jerseyNumber: 21, grade: "10", ageGroup: "17U", status: "trial",   availability: "available",   paymentStatus: "paid",    parentName: "Marcus Thompson",  parentEmail: "mthompson@email.com", parentPhone: "(609) 555-0112" },
    ],
  },
  // ── JV ─────────────────────────────────────────────────────────────────────
  {
    id: "prog_jv",
    orgId: "org_barnegat",
    name: "JV Boys",
    level: "jv",
    season: "2025–26",
    record: { wins: 9, losses: 8 },
    rosterCount: 10,
    coachIds: ["coach_martinez", "coach_johnson"],
    paymentHealth: 0.90,
    attendanceRate: 0.87,
    pendingAlerts: 1,
    nextGame: {
      opponent: "Lacey Township",
      date: "Thu May 21",
      time: "4:30 PM",
      location: "Home — Main Gym",
    },
    nextPractice: {
      date: "Tue May 19",
      time: "3:00 PM",
      location: "Aux Gym",
    },
    roster: [
      { playerId: "jv_1",  playerName: "Brendan Cole",    initials: "BC", position: "PG", jerseyNumber: 4,  grade: "9",  ageGroup: "15U", status: "active", availability: "available",   paymentStatus: "paid",    parentName: "Paul Cole",       parentEmail: "pcole@email.com",    parentPhone: "(609) 555-0201" },
      { playerId: "jv_2",  playerName: "Marcus Reed",     initials: "MR", position: "SG", jerseyNumber: 10, grade: "10", ageGroup: "15U", status: "active", availability: "available",   paymentStatus: "paid",    parentName: "Sandra Reed",     parentEmail: "sreed@email.com",    parentPhone: "(609) 555-0202" },
      { playerId: "jv_3",  playerName: "Damon Price",     initials: "DP", position: "SF", jerseyNumber: 20, grade: "9",  ageGroup: "15U", status: "active", availability: "limited",     paymentStatus: "overdue", parentName: "Tonya Price",     parentEmail: "tprice@email.com",   parentPhone: "(609) 555-0203" },
      { playerId: "jv_4",  playerName: "Tyler Owens",     initials: "TO", position: "PF", jerseyNumber: 31, grade: "10", ageGroup: "15U", status: "active", availability: "available",   paymentStatus: "paid",    parentName: "Richard Owens",   parentEmail: "rowens@email.com",   parentPhone: "(609) 555-0204" },
      { playerId: "jv_5",  playerName: "Zach Patterson",  initials: "ZP", position: "C",  jerseyNumber: 42, grade: "9",  ageGroup: "15U", status: "active", availability: "available",   paymentStatus: "paid",    parentName: "Marie Patterson", parentEmail: "mpatterson@email.com",parentPhone: "(609) 555-0205" },
      { playerId: "jv_6",  playerName: "Devon Harris",    initials: "DH", position: "PG", jerseyNumber: 2,  grade: "9",  ageGroup: "15U", status: "active", availability: "available",   paymentStatus: "partial", parentName: "Cheryl Harris",   parentEmail: "charris@email.com",  parentPhone: "(609) 555-0206" },
      { playerId: "jv_7",  playerName: "Nate Foster",     initials: "NF", position: "SG", jerseyNumber: 14, grade: "10", ageGroup: "15U", status: "trial",  availability: "available",   paymentStatus: "paid",    parentName: "Brian Foster",    parentEmail: "bfoster@email.com",  parentPhone: "(609) 555-0207" },
      { playerId: "jv_8",  playerName: "Aaron Bell",      initials: "AB", position: "SF", jerseyNumber: 24, grade: "9",  ageGroup: "15U", status: "active", availability: "available",   paymentStatus: "paid",    parentName: "Keisha Bell",     parentEmail: "kbell@email.com",    parentPhone: "(609) 555-0208" },
      { playerId: "jv_9",  playerName: "Carlos Rivera",   initials: "CR", position: "PF", jerseyNumber: 35, grade: "10", ageGroup: "15U", status: "active", availability: "available",   paymentStatus: "paid",    parentName: "Ana Rivera",      parentEmail: "arivera@email.com",  parentPhone: "(609) 555-0209" },
      { playerId: "jv_10", playerName: "Eli Shaw",        initials: "ES", position: "C",  jerseyNumber: 45, grade: "9",  ageGroup: "15U", status: "active", availability: "limited",     paymentStatus: "paid",    parentName: "Donna Shaw",      parentEmail: "dshaw@email.com",    parentPhone: "(609) 555-0210" },
    ],
  },
  // ── Freshman ────────────────────────────────────────────────────────────────
  {
    id: "prog_freshman",
    orgId: "org_barnegat",
    name: "Freshman Boys",
    level: "freshman",
    season: "2025–26",
    record: { wins: 6, losses: 10 },
    rosterCount: 8,
    coachIds: ["coach_johnson"],
    paymentHealth: 0.95,
    attendanceRate: 0.82,
    pendingAlerts: 0,
    nextPractice: {
      date: "Mon May 18",
      time: "3:00 PM",
      location: "Aux Gym",
    },
    roster: [
      { playerId: "fr_1", playerName: "Kofi Adams",    initials: "KA", position: "PG", jerseyNumber: 3,  grade: "9", ageGroup: "14U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Grace Adams",   parentEmail: "gadams@email.com",  parentPhone: "(609) 555-0301" },
      { playerId: "fr_2", playerName: "Drew Martin",   initials: "DM", position: "SG", jerseyNumber: 10, grade: "9", ageGroup: "14U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Teresa Martin", parentEmail: "tmartin@email.com", parentPhone: "(609) 555-0302" },
      { playerId: "fr_3", playerName: "Noah Banks",    initials: "NB", position: "SF", jerseyNumber: 21, grade: "9", ageGroup: "14U", status: "active", availability: "limited",   paymentStatus: "paid",    parentName: "Henry Banks",   parentEmail: "hbanks@email.com",  parentPhone: "(609) 555-0303" },
      { playerId: "fr_4", playerName: "Troy Simms",    initials: "TS", position: "PF", jerseyNumber: 32, grade: "9", ageGroup: "14U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Marcy Simms",   parentEmail: "msimms@email.com",  parentPhone: "(609) 555-0304" },
      { playerId: "fr_5", playerName: "Jerome Clay",   initials: "JC", position: "C",  jerseyNumber: 43, grade: "9", ageGroup: "14U", status: "trial",  availability: "available", paymentStatus: "partial", parentName: "Diana Clay",    parentEmail: "dclay@email.com",   parentPhone: "(609) 555-0305" },
      { playerId: "fr_6", playerName: "Levi Cruz",     initials: "LC", position: "SG", jerseyNumber: 15, grade: "9", ageGroup: "14U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Isabel Cruz",   parentEmail: "icruz@email.com",   parentPhone: "(609) 555-0306" },
      { playerId: "fr_7", playerName: "Ethan West",    initials: "EW", position: "PF", jerseyNumber: 30, grade: "9", ageGroup: "14U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Beverly West",  parentEmail: "bwest@email.com",   parentPhone: "(609) 555-0307" },
      { playerId: "fr_8", playerName: "Jaylen Ford",   initials: "JF", position: "C",  jerseyNumber: 40, grade: "9", ageGroup: "14U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Alice Ford",    parentEmail: "aford@email.com",   parentPhone: "(609) 555-0308" },
    ],
  },
  // ── AAU 17U ─────────────────────────────────────────────────────────────────
  {
    id: "prog_aau_17u",
    orgId: "org_barnegat",
    name: "AAU 17U Elite",
    level: "aau_17u",
    season: "Spring 2026",
    record: { wins: 11, losses: 4 },
    rosterCount: 10,
    coachIds: ["coach_grant"],
    paymentHealth: 0.70,
    attendanceRate: 0.88,
    pendingAlerts: 5,
    nextGame: {
      opponent: "South Jersey Heat",
      date: "Sat May 30",
      time: "10:00 AM",
      location: "South Texas Showcase — Court B",
    },
    nextPractice: {
      date: "Fri May 22",
      time: "5:00 PM",
      location: "Training Center",
    },
    roster: [
      { playerId: "a_1",  playerName: "Jalen Carter",    initials: "JC", position: "PG", jerseyNumber: 3,  grade: "11", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Sandra Carter",   parentEmail: "scarter@email.com",  parentPhone: "(609) 555-0101" },
      { playerId: "a_2",  playerName: "Marcus Williams", initials: "MW", position: "SG", jerseyNumber: 12, grade: "12", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "partial", parentName: "Robert Williams", parentEmail: "rwilliams@email.com",parentPhone: "(609) 555-0102" },
      { playerId: "a_4",  playerName: "Tyrese Brooks",   initials: "TB", position: "PF", jerseyNumber: 34, grade: "11", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "overdue", parentName: "Cassandra Brooks",parentEmail: "cbrooks@email.com",  parentPhone: "(609) 555-0104" },
      { playerId: "a_5",  playerName: "Isaiah Moore",    initials: "IM", position: "C",  jerseyNumber: 44, grade: "12", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "overdue", parentName: "Denise Moore",    parentEmail: "dmoore@email.com",   parentPhone: "(609) 555-0105" },
      { playerId: "a_8",  playerName: "Jordan Davis",    initials: "JD", position: "SF", jerseyNumber: 22, grade: "12", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Monica Davis",    parentEmail: "mdavis@email.com",   parentPhone: "(609) 555-0108" },
      { playerId: "aau_1", playerName: "Deon Morris",    initials: "DM", position: "PG", jerseyNumber: 7,  grade: "11", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Patricia Morris", parentEmail: "pmorris@email.com",  parentPhone: "(201) 555-0401" },
      { playerId: "aau_2", playerName: "Cam Fletcher",   initials: "CF", position: "SG", jerseyNumber: 13, grade: "11", ageGroup: "17U", status: "active", availability: "limited",   paymentStatus: "overdue", parentName: "James Fletcher",  parentEmail: "jfletcher@email.com",parentPhone: "(201) 555-0402" },
      { playerId: "aau_3", playerName: "Quincy Holt",    initials: "QH", position: "SF", jerseyNumber: 25, grade: "10", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Renee Holt",      parentEmail: "rholt@email.com",    parentPhone: "(201) 555-0403" },
      { playerId: "aau_4", playerName: "Brent Lowe",     initials: "BL", position: "PF", jerseyNumber: 33, grade: "11", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Sharon Lowe",     parentEmail: "slowe@email.com",    parentPhone: "(201) 555-0404" },
      { playerId: "aau_5", playerName: "Terrell Nash",   initials: "TN", position: "C",  jerseyNumber: 41, grade: "11", ageGroup: "17U", status: "active", availability: "available", paymentStatus: "paid",    parentName: "Lena Nash",       parentEmail: "lnash@email.com",    parentPhone: "(201) 555-0405" },
    ],
  },
];

/** Active coach — belongs to Varsity + AAU 17U */
export const ACTIVE_COACH = {
  id: "coach_grant",
  name: "Coach Grant",
  programIds: ["prog_varsity", "prog_aau_17u"],
};

/** The program this coach manages full admin on (both) */
export function getCoachPrograms(): Program[] {
  return PROGRAMS.filter((p) => ACTIVE_COACH.programIds.includes(p.id));
}

export function getProgramById(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

/* ─── Broadcast recipients ───────────────────────────────────────────────────── */

export type RecipientRole = "player" | "parent" | "coach";

export type BroadcastTargetRole =
  | "all"
  | "players"
  | "parents"
  | "coaches";

export interface BroadcastRecipient {
  id: string;
  name: string;
  role: RecipientRole;
  programId: string;
  programLevel: ProgramLevel;
  email: string;
  phone: string;
  preferredChannel: "app" | "email" | "sms";
  /** True when this recipient would receive a targeted broadcast */
  included: boolean;
}

/** Build the full recipient list for a program, then filter by role. */
export function buildRecipientList(
  programId: string,
  targetRole: BroadcastTargetRole,
): BroadcastRecipient[] {
  const prog = getProgramById(programId);
  if (!prog) return [];

  const results: BroadcastRecipient[] = [];

  // Players
  if (targetRole === "all" || targetRole === "players") {
    prog.roster.forEach((p) => {
      results.push({
        id: `r_player_${p.playerId}`,
        name: p.playerName,
        role: "player",
        programId: prog.id,
        programLevel: prog.level,
        email: p.parentEmail, // players receive via parent email in demo
        phone: p.parentPhone,
        preferredChannel: "app",
        included: true,
      });
    });
  }

  // Parents / guardians
  if (targetRole === "all" || targetRole === "parents") {
    prog.roster.forEach((p) => {
      results.push({
        id: `r_parent_${p.playerId}`,
        name: p.parentName,
        role: "parent",
        programId: prog.id,
        programLevel: prog.level,
        email: p.parentEmail,
        phone: p.parentPhone,
        preferredChannel: "email",
        included: true,
      });
    });
  }

  // Coaches
  if (targetRole === "all" || targetRole === "coaches") {
    prog.coachIds.forEach((cId, i) => {
      results.push({
        id: `r_coach_${cId}`,
        name: ["Coach Grant", "Coach Martinez", "Coach Johnson"][i] ?? cId,
        role: "coach",
        programId: prog.id,
        programLevel: prog.level,
        email: `${cId}@barnegat.edu`,
        phone: "(609) 555-0000",
        preferredChannel: "app",
        included: true,
      });
    });
  }

  return results;
}

/* ─── Segmented announcements ────────────────────────────────────────────────── */

export type AnnouncementChannel = "app" | "email" | "sms" | "all";
export type AnnouncementStatus = "draft" | "scheduled" | "sent";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorName: string;
  programId: string;
  programLevel: ProgramLevel;
  targetRole: BroadcastTargetRole;
  channel: AnnouncementChannel;
  status: AnnouncementStatus;
  scheduledFor?: string;
  sentAt?: string;
  recipientCount: number;
  readCount: number;
  createdAt: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann_1",
    title: "Game Day Transportation — Friday vs. TRN",
    body: "Bus departs from main entrance at 5:45 PM sharp. Players must be in uniform and ready by 5:30. Parents picking up after the game should meet at the north parking lot entrance.",
    authorName: "Coach Grant",
    programId: "prog_varsity",
    programLevel: "varsity",
    targetRole: "all",
    channel: "all",
    status: "sent",
    sentAt: "2026-05-18T10:00:00Z",
    recipientCount: 34,
    readCount: 29,
    createdAt: "2026-05-18T09:45:00Z",
  },
  {
    id: "ann_2",
    title: "Tuition Balance Reminder — Action Required",
    body: "Three families have an outstanding balance for the Spring 2026 season. Payment is due by May 25 or your player may not participate in the South Texas Showcase tournament.",
    authorName: "Coach Grant",
    programId: "prog_varsity",
    programLevel: "varsity",
    targetRole: "parents",
    channel: "email",
    status: "sent",
    sentAt: "2026-05-16T14:00:00Z",
    recipientCount: 12,
    readCount: 10,
    createdAt: "2026-05-16T13:50:00Z",
  },
  {
    id: "ann_3",
    title: "Practice Schedule Change — May 20",
    body: "Wednesday's practice is moved to the Aux Gym (Rm 114) due to a floor refinishing in the Main Gym. Same time: 3:30 PM. Please bring your extra gear.",
    authorName: "Coach Martinez",
    programId: "prog_jv",
    programLevel: "jv",
    targetRole: "all",
    channel: "app",
    status: "sent",
    sentAt: "2026-05-17T16:30:00Z",
    recipientCount: 22,
    readCount: 19,
    createdAt: "2026-05-17T16:15:00Z",
  },
  {
    id: "ann_4",
    title: "South Texas Showcase — Packing & Logistics",
    body: "Depart Friday May 29 at 7 AM from school. Two sets of uniforms required. Full packing list and hotel info attached. First game Saturday 10 AM — mandatory team film session Friday night at 8 PM.",
    authorName: "Coach Grant",
    programId: "prog_aau_17u",
    programLevel: "aau_17u",
    targetRole: "all",
    channel: "all",
    status: "draft",
    recipientCount: 0,
    readCount: 0,
    createdAt: "2026-05-18T08:00:00Z",
  },
];

/* ─── Roster import ──────────────────────────────────────────────────────────── */

export type ImportSource = "csv_paste" | "csv_file" | "manual";
export type ImportStatus = "idle" | "parsing" | "preview" | "importing" | "done" | "error";

export interface ImportedPlayer {
  name: string;
  position: string;
  jerseyNumber: string;
  grade: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  /** Parse validation */
  valid: boolean;
  errors: string[];
}

/** Sample CSV text pre-filled in the paste box so coaches can see the format */
export const SAMPLE_CSV = `Name,Position,Jersey #,Grade,Parent Name,Parent Email,Parent Phone
Kofi Adams,PG,3,9,Grace Adams,gadams@email.com,(609) 555-0301
Marcus Reed,SG,10,10,Sandra Reed,sreed@email.com,(609) 555-0202
Quincy Holt,SF,25,10,Renee Holt,rholt@email.com,(201) 555-0403
Tyler Owens,PF,31,10,Richard Owens,rowens@email.com,(609) 555-0204
Eli Shaw,C,45,9,Donna Shaw,dshaw@email.com,(609) 555-0210
Deon Morris,PG,7,11,Patricia Morris,pmorris@email.com,(201) 555-0401
,SG,,10,,,
Invalid Row,INVALID,99,A,,,`;

/** Parse a raw CSV string into ImportedPlayer rows */
export function parseRosterCsv(raw: string): ImportedPlayer[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const [_header, ...rows] = lines;
  const validPositions = ["PG", "SG", "SF", "PF", "C", "G", "F"];

  return rows.map((line) => {
    const [name, position, jerseyNumber, grade, parentName, parentEmail, parentPhone] = line
      .split(",")
      .map((v) => v.trim());

    const errors: string[] = [];
    if (!name) errors.push("Name required");
    if (!position || !validPositions.includes(position)) errors.push("Invalid position");
    if (!jerseyNumber || isNaN(Number(jerseyNumber))) errors.push("Jersey number must be numeric");
    if (!grade) errors.push("Grade required");

    return {
      name: name ?? "",
      position: position ?? "",
      jerseyNumber: jerseyNumber ?? "",
      grade: grade ?? "",
      parentName: parentName ?? "",
      parentEmail: parentEmail ?? "",
      parentPhone: parentPhone ?? "",
      valid: errors.length === 0,
      errors,
    };
  });
}

/* ─── Extended event types ───────────────────────────────────────────────────── */

export type ProgramEventType =
  | "practice"
  | "game"
  | "tournament"
  | "travel"
  | "meeting"
  | "optional";

export const PROGRAM_EVENT_TYPE_LABEL: Record<ProgramEventType, string> = {
  practice:   "Practice",
  game:       "Game",
  tournament: "Tournament",
  travel:     "Travel",
  meeting:    "Meeting",
  optional:   "Optional",
};

export type RsvpStatus = "yes" | "no" | "maybe" | "pending";
export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "unrecorded";

export interface ProgramEvent {
  id: string;
  programId: string;
  type: ProgramEventType;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  location: string;
  description?: string;
  /** For tournament/multi-game events */
  tournamentGroupId?: string;
  rsvpRequired: boolean;
  rsvpDeadline?: string;
  rsvps: Record<string, RsvpStatus>;            // playerId → status
  attendance: Record<string, AttendanceStatus>; // playerId → status
  notes?: string;
}

/* ─── Tournament weekend group ───────────────────────────────────────────────── */

export interface TournamentGame {
  id: string;
  roundLabel: string; // "Pool Play — Game 1", "Semifinal", etc.
  time: string;
  court: string;
  location: string;
  opponent: string;
  result: "win" | "loss" | "upcoming";
  score?: string;
  readinessReminders: string[];
}

export interface TournamentWeekend {
  id: string;
  programId: string;
  name: string;
  venue: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  hotel?: { name: string; address: string; checkIn: string; checkOut: string; groupCode: string };
  transport?: { departureTime: string; departureLocation: string; returnTime: string };
  games: TournamentGame[];
  packingReminders: string[];
  emergencyContact: { name: string; phone: string };
}

/** South Texas Showcase — 3 pool games + logistics — satisfies AC #2 */
export const SOUTH_TEXAS_SHOWCASE: TournamentWeekend = {
  id: "tourn_southtx_2026",
  programId: "prog_aau_17u",
  name: "South Texas Showcase 2026",
  venue: "Lone Star Sports Complex",
  city: "San Antonio",
  state: "TX",
  startDate: "2026-05-30",
  endDate: "2026-06-01",
  hotel: {
    name: "Marriott San Antonio",
    address: "889 E Market St, San Antonio, TX 78205",
    checkIn:  "2026-05-29",
    checkOut: "2026-06-01",
    groupCode: "HOOPSOS26",
  },
  transport: {
    departureTime: "2026-05-29T07:00:00",
    departureLocation: "Barnegat HS — North Parking Lot",
    returnTime: "2026-06-01T18:00:00",
  },
  games: [
    {
      id: "tg_1",
      roundLabel: "Pool Play — Game 1",
      time: "Sat May 30 · 10:00 AM",
      court: "Court B",
      location: "Lone Star Sports Complex",
      opponent: "South Jersey Heat",
      result: "upcoming",
      readinessReminders: [
        "Arrive at court 30 min early — 9:30 AM sharp",
        "Full uniform check before warm-up",
        "Hydrate tonight — heat index expected 95°F",
        "Scout report for South Jersey Heat must be reviewed",
      ],
    },
    {
      id: "tg_2",
      roundLabel: "Pool Play — Game 2",
      time: "Sat May 30 · 2:30 PM",
      court: "Court A",
      location: "Lone Star Sports Complex",
      opponent: "Oak Hill Academy TX",
      result: "upcoming",
      readinessReminders: [
        "2-hour rest window between games — ice legs",
        "Nutrition: team meal at 12:30 PM in lobby",
        "Film session for Oak Hill at 1:15 PM in Room 204",
      ],
    },
    {
      id: "tg_3",
      roundLabel: "Pool Play — Game 3",
      time: "Sun May 31 · 9:00 AM",
      court: "Court C",
      location: "Lone Star Sports Complex",
      opponent: "Houston Prime",
      result: "upcoming",
      readinessReminders: [
        "Breakfast provided at 7:30 AM — mandatory attendance",
        "Film review at 8:15 AM in team room",
        "Win this game to guarantee bracket seeding",
      ],
    },
  ],
  packingReminders: [
    "Two full sets of uniforms (home + away)",
    "Practice gear for Thursday workout",
    "Shooting shoes + game shoes",
    "Recovery tools: foam roller, bands, ice packs",
    "Snacks + electrolyte packets",
    "Travel documents + insurance card",
    "Team-issued warm-up jacket",
  ],
  emergencyContact: { name: "Coach Grant", phone: "(609) 555-9000" },
};

/* ─── Program events (schedule sample) ──────────────────────────────────────── */

export const PROGRAM_EVENTS: ProgramEvent[] = [
  {
    id: "evt_p_1",
    programId: "prog_varsity",
    type: "practice",
    title: "Regular Practice",
    date: "2026-05-20",
    time: "3:30 PM",
    endTime: "5:15 PM",
    location: "Main Gym",
    rsvpRequired: true,
    rsvpDeadline: "2026-05-19",
    rsvps: { a_1: "yes", a_2: "yes", a_3: "maybe", a_4: "yes", a_5: "yes", a_6: "yes", a_7: "no", a_8: "yes", a_9: "maybe", a_10: "yes", a_11: "yes", a_12: "pending" },
    attendance: {},
  },
  {
    id: "evt_g_1",
    programId: "prog_varsity",
    type: "game",
    title: "vs. Toms River North",
    date: "2026-05-22",
    time: "7:00 PM",
    location: "TRN Gymnasium — Away",
    rsvpRequired: true,
    rsvpDeadline: "2026-05-21",
    rsvps: { a_1: "yes", a_2: "yes", a_3: "yes", a_4: "yes", a_5: "yes", a_6: "yes", a_7: "no", a_8: "yes", a_9: "pending", a_10: "yes", a_11: "yes", a_12: "yes" },
    attendance: {},
  },
  {
    id: "evt_t_1",
    programId: "prog_varsity",
    type: "travel",
    title: "Travel to South Texas Showcase",
    date: "2026-05-29",
    time: "7:00 AM",
    location: "Barnegat HS — North Parking Lot",
    description: "Team bus departs for San Antonio. Arrive with luggage by 6:45 AM.",
    rsvpRequired: false,
    rsvps: {},
    attendance: {},
  },
  {
    id: "evt_m_1",
    programId: "prog_varsity",
    type: "meeting",
    title: "Parent Information Meeting — Showcase",
    date: "2026-05-19",
    time: "6:30 PM",
    location: "Media Center — Room 118",
    description: "All Varsity parents required. We'll cover travel logistics, hotel info, tournament schedule, and payment deadlines.",
    rsvpRequired: true,
    rsvpDeadline: "2026-05-18",
    rsvps: {},
    attendance: {},
  },
];
