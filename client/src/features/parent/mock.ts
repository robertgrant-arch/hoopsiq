// Mock data for the Parent portal.
// In production, these would come from the same APIs used by the athlete
// portal, gated server-side with viewAs=parentOf:{childId} scoping.

/* -------------------------------------------------------------------------- */
/* Child snapshot (read from athlete data, re-shaped for parent view)          */
/* -------------------------------------------------------------------------- */

export const mockChild = {
  id: "u_athlete_1",
  name: "Jalen Carter",
  position: "SG",
  team: "Texas Elite Varsity",
  gradYear: 2027,
  jerseyNumber: "23",
  coachName: "Coach Grant",
  level: 7,
  xp: 2840,
  streak: 14,
  avatarInitials: "JC",
};

/* -------------------------------------------------------------------------- */
/* Upcoming schedule (shared with athlete)                                      */
/* -------------------------------------------------------------------------- */

export type ScheduleEvent = {
  id: string;
  type: "practice" | "game" | "tournament" | "film" | "conditioning";
  title: string;
  date: string; // ISO
  startTime: string;
  endTime?: string;
  location: string;
  rsvpStatus: "going" | "not_going" | "maybe" | null;
  required: boolean;
  notes?: string;
};

export const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: "evt_1",
    type: "practice",
    title: "Varsity Practice",
    date: "2026-05-19",
    startTime: "4:00 PM",
    endTime: "6:00 PM",
    location: "Texas Elite Training Center",
    rsvpStatus: "going",
    required: true,
  },
  {
    id: "evt_2",
    type: "game",
    title: "vs. Westbury Eagles",
    date: "2026-05-22",
    startTime: "7:00 PM",
    location: "Westbury High School — Main Gym",
    rsvpStatus: null,
    required: true,
    notes: "Away game. Buses leave at 5:30 PM.",
  },
  {
    id: "evt_3",
    type: "practice",
    title: "Film & Shooting",
    date: "2026-05-21",
    startTime: "5:00 PM",
    endTime: "6:30 PM",
    location: "Texas Elite Training Center",
    rsvpStatus: "going",
    required: false,
  },
  {
    id: "evt_4",
    type: "tournament",
    title: "South Texas Showcase",
    date: "2026-05-30",
    startTime: "8:00 AM",
    endTime: "6:00 PM",
    location: "Alamo Dome — San Antonio",
    rsvpStatus: null,
    required: true,
    notes: "Hotel block available. Registration deadline May 25.",
  },
  {
    id: "evt_5",
    type: "conditioning",
    title: "Speed & Agility Clinic",
    date: "2026-06-02",
    startTime: "9:00 AM",
    endTime: "11:00 AM",
    location: "Texas Elite Training Center",
    rsvpStatus: null,
    required: false,
  },
  {
    id: "evt_6",
    type: "game",
    title: "vs. Neptune Trojans",
    date: "2026-06-05",
    startTime: "6:30 PM",
    location: "Texas Elite Training Center — Home",
    rsvpStatus: "going",
    required: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Attendance                                                                   */
/* -------------------------------------------------------------------------- */

export type AttendanceRecord = {
  id: string;
  eventTitle: string;
  date: string;
  type: "practice" | "game" | "tournament";
  attended: boolean;
  excused?: boolean;
  note?: string;
};

export const mockAttendance: AttendanceRecord[] = [
  { id: "a1", eventTitle: "Varsity Practice", date: "2026-05-12", type: "practice", attended: true },
  { id: "a2", eventTitle: "Varsity Practice", date: "2026-05-14", type: "practice", attended: true },
  { id: "a3", eventTitle: "vs. Barnegat Bengals", date: "2026-05-10", type: "game", attended: true },
  { id: "a4", eventTitle: "Varsity Practice", date: "2026-05-07", type: "practice", attended: false, excused: true, note: "School exam conflict — approved" },
  { id: "a5", eventTitle: "Varsity Practice", date: "2026-05-05", type: "practice", attended: true },
  { id: "a6", eventTitle: "Speed Clinic", date: "2026-05-03", type: "practice", attended: true },
  { id: "a7", eventTitle: "Varsity Practice", date: "2026-04-30", type: "practice", attended: true },
  { id: "a8", eventTitle: "vs. Westbury Eagles (scrimmage)", date: "2026-04-28", type: "game", attended: false, excused: false, note: "Unexcused absence" },
  { id: "a9", eventTitle: "Varsity Practice", date: "2026-04-26", type: "practice", attended: true },
  { id: "a10", eventTitle: "Varsity Practice", date: "2026-04-24", type: "practice", attended: true },
];

/* -------------------------------------------------------------------------- */
/* Billing & dues                                                               */
/* -------------------------------------------------------------------------- */

export type BillingLineItem = {
  id: string;
  description: string;
  amount: number; // in cents
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "upcoming";
  paidDate?: string;
  category: "subscription" | "tournament" | "equipment" | "camp" | "other";
};

export const mockBillingItems: BillingLineItem[] = [
  {
    id: "bil_1",
    description: "Player Core — May 2026",
    amount: 999,
    dueDate: "2026-05-15",
    status: "paid",
    paidDate: "2026-05-15",
    category: "subscription",
  },
  {
    id: "bil_2",
    description: "South Texas Showcase — Entry Fee",
    amount: 15000,
    dueDate: "2026-05-25",
    status: "pending",
    category: "tournament",
  },
  {
    id: "bil_3",
    description: "Player Core — June 2026",
    amount: 999,
    dueDate: "2026-06-15",
    status: "upcoming",
    category: "subscription",
  },
  {
    id: "bil_4",
    description: "Player Core — April 2026",
    amount: 999,
    dueDate: "2026-04-15",
    status: "paid",
    paidDate: "2026-04-15",
    category: "subscription",
  },
  {
    id: "bil_5",
    description: "Summer League Registration",
    amount: 30000,
    dueDate: "2026-07-01",
    status: "upcoming",
    category: "tournament",
  },
  {
    id: "bil_6",
    description: "Team Jersey + Shorts",
    amount: 8500,
    dueDate: "2026-04-01",
    status: "paid",
    paidDate: "2026-04-02",
    category: "equipment",
  },
];

/* -------------------------------------------------------------------------- */
/* Waivers & forms                                                              */
/* -------------------------------------------------------------------------- */

export type FormStatus = "signed" | "pending" | "expired" | "not_required";

export type WaiverForm = {
  id: string;
  title: string;
  description: string;
  category: "waiver" | "consent" | "medical" | "media" | "emergency";
  status: FormStatus;
  dueDate?: string;
  signedDate?: string;
  required: boolean;
  expiresAt?: string;
};

export const mockForms: WaiverForm[] = [
  {
    id: "frm_1",
    title: "Liability Waiver & Release",
    description: "Annual liability waiver covering all Texas Elite activities, travel, and events.",
    category: "waiver",
    status: "signed",
    signedDate: "2025-08-10",
    required: true,
    expiresAt: "2026-08-10",
  },
  {
    id: "frm_2",
    title: "Media & Photo Release",
    description: "Authorizes Texas Elite to use photos and video of your athlete in promotional materials.",
    category: "media",
    status: "signed",
    signedDate: "2025-08-10",
    required: false,
  },
  {
    id: "frm_3",
    title: "Emergency Medical Authorization",
    description: "Authorizes program staff to seek emergency medical care if a parent cannot be reached.",
    category: "medical",
    status: "signed",
    signedDate: "2025-08-10",
    required: true,
    expiresAt: "2026-08-10",
  },
  {
    id: "frm_4",
    title: "South Texas Showcase — Tournament Consent",
    description: "Required for participation in the South Texas Showcase (May 30 – June 1).",
    category: "consent",
    status: "pending",
    dueDate: "2026-05-23",
    required: true,
  },
  {
    id: "frm_5",
    title: "Physical Examination Confirmation",
    description: "Upload or confirm receipt of annual sports physical (within last 12 months).",
    category: "medical",
    status: "pending",
    dueDate: "2026-06-01",
    required: true,
  },
  {
    id: "frm_6",
    title: "Summer League Player Agreement",
    description: "Code of conduct, commitment expectations, and refund policy for 2026 Summer League.",
    category: "waiver",
    status: "not_required",
    required: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Org announcements                                                            */
/* -------------------------------------------------------------------------- */

export type Announcement = {
  id: string;
  title: string;
  body: string;
  author: string;
  authorRole: string;
  postedAt: string; // ISO
  priority: "normal" | "urgent" | "info";
  pinned: boolean;
  tags: string[];
};

export const mockAnnouncements: Announcement[] = [
  {
    id: "ann_1",
    title: "South Texas Showcase — Final Details",
    body: "We depart Saturday May 30 at 5:00 AM from the Training Center. Hotel check-in is 3 PM — book your room through the team link by May 20. All players must have tournament consent forms signed by May 23.",
    author: "Coach Grant",
    authorRole: "Head Coach",
    postedAt: "2026-05-13T10:30:00Z",
    priority: "urgent",
    pinned: true,
    tags: ["tournament", "travel"],
  },
  {
    id: "ann_2",
    title: "Updated Practice Schedule — Memorial Day Week",
    body: "Practice on May 25 is cancelled (Memorial Day). We will hold an optional shooting session May 26 at 9 AM. Regular schedule resumes May 27.",
    author: "Coach Grant",
    authorRole: "Head Coach",
    postedAt: "2026-05-12T14:00:00Z",
    priority: "normal",
    pinned: false,
    tags: ["schedule"],
  },
  {
    id: "ann_3",
    title: "Jersey Numbers & Sizing Due Friday",
    body: "Please submit jersey sizing preferences by Friday May 17 via the form below. Orders placed after May 17 may not arrive in time for the showcase.",
    author: "Diana Okafor",
    authorRole: "Program Director",
    postedAt: "2026-05-11T09:00:00Z",
    priority: "normal",
    pinned: false,
    tags: ["equipment"],
  },
  {
    id: "ann_4",
    title: "Welcome to HoopsOS Family Portal",
    body: "We're rolling out the new HoopsOS Family Portal this week. You can now track Jalen's schedule, sign forms, view billing, and get real-time updates from the coaching staff — all in one place.",
    author: "Diana Okafor",
    authorRole: "Program Director",
    postedAt: "2026-05-01T08:00:00Z",
    priority: "info",
    pinned: false,
    tags: ["platform"],
  },
];

/* -------------------------------------------------------------------------- */
/* Child development snapshot (high-level; coach controls visibility)          */
/* -------------------------------------------------------------------------- */

export type DevelopmentSummary = {
  focusArea: string;
  emoji: string;
  currentScore: number;
  targetScore: number;
  progressPct: number;
  coachNote: string;
};

export const mockDevelopmentSummary: DevelopmentSummary[] = [
  {
    focusArea: "Contact Layup",
    emoji: "🏀",
    currentScore: 5,
    targetScore: 7,
    progressPct: 28,
    coachNote: "Making real progress attacking the rim. Mikan drill is showing results.",
  },
  {
    focusArea: "On-Ball Defense",
    emoji: "🛡️",
    currentScore: 6,
    targetScore: 8,
    progressPct: 55,
    coachNote: "Footwork in close-outs has improved significantly this month.",
  },
  {
    focusArea: "3PT Shooting",
    emoji: "🎯",
    currentScore: 4,
    targetScore: 6,
    progressPct: 12,
    coachNote: "Consistent form but needs more reps off the catch-and-shoot.",
  },
];
