// Mock data for the admin club operations layer.
// Used in demo mode; production uses /api/admin/* endpoints.

// ── Seasons ───────────────────────────────────────────────────────────────────

export type Season = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "open" | "active" | "completed" | "archived";
  description?: string;
  startsAt?: string;
  endsAt?: string;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  maxRoster?: number;
  createdAt: string;
};

export const mockSeasons: Season[] = [
  {
    id: "season_fall_2025",
    name: "Fall 2025 AAU",
    slug: "fall-2025-aau",
    status: "active",
    description: "Fall travel season — 15U and 17U divisions",
    startsAt: "2025-09-01",
    endsAt: "2025-11-30",
    registrationOpensAt: "2025-07-01",
    registrationClosesAt: "2025-08-20",
    maxRoster: 120,
    createdAt: "2025-06-15",
  },
  {
    id: "season_winter_2026",
    name: "Winter 2026 Academy",
    slug: "winter-2026-academy",
    status: "open",
    description: "Indoor development program — all age groups",
    startsAt: "2026-01-06",
    endsAt: "2026-03-28",
    registrationOpensAt: "2025-11-01",
    registrationClosesAt: "2025-12-20",
    maxRoster: 80,
    createdAt: "2025-10-01",
  },
];

// ── Teams ─────────────────────────────────────────────────────────────────────

export type Team = {
  id: string;
  seasonId?: string;
  name: string;
  ageGroup: string;
  gender: string;
  headCoachUserId?: string;
  headCoachName?: string; // denormalised for display
  colorPrimary?: string;
  rosterCount: number;
  isActive: boolean;
};

export const mockTeams: Team[] = [
  {
    id: "team_17u_boys",
    seasonId: "season_fall_2025",
    name: "17U Boys Varsity",
    ageGroup: "u17",
    gender: "boys",
    headCoachName: "Coach Grant",
    colorPrimary: "#6d28d9",
    rosterCount: 14,
    isActive: true,
  },
  {
    id: "team_15u_boys",
    seasonId: "season_fall_2025",
    name: "15U Boys",
    ageGroup: "u15",
    gender: "boys",
    headCoachName: "Coach Davis",
    colorPrimary: "#0891b2",
    rosterCount: 12,
    isActive: true,
  },
  {
    id: "team_13u_girls",
    seasonId: "season_fall_2025",
    name: "13U Girls",
    ageGroup: "u13",
    gender: "girls",
    headCoachName: "Coach Williams",
    colorPrimary: "#be185d",
    rosterCount: 10,
    isActive: true,
  },
  {
    id: "team_academy_dev",
    seasonId: "season_winter_2026",
    name: "Academy Development",
    ageGroup: "other",
    gender: "co_ed",
    headCoachName: "Coach Grant",
    colorPrimary: "#15803d",
    rosterCount: 22,
    isActive: true,
  },
];

// ── Membership Plans ──────────────────────────────────────────────────────────

export type MembershipPlan = {
  id: string;
  seasonId?: string;
  seasonName?: string;
  name: string;
  description?: string;
  type: "season" | "monthly" | "annual" | "drop_in" | "tournament" | "custom";
  status: "draft" | "active" | "archived";
  priceAmount: number; // cents
  allowsPaymentPlan: boolean;
  installmentCount?: number;
  depositAmount: number;
  earlyBirdAmount?: number;
  earlyBirdDeadline?: string;
  maxEnrollment?: number;
  enrollmentCount: number; // current active registrations
};

export const mockMembershipPlans: MembershipPlan[] = [
  {
    id: "plan_fall_17u",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    name: "17U Fall Season — Full",
    description: "Includes all games, tournaments, and weekly practices",
    type: "season",
    status: "active",
    priceAmount: 75000, // $750
    allowsPaymentPlan: true,
    installmentCount: 3,
    depositAmount: 25000,
    earlyBirdAmount: 5000,
    earlyBirdDeadline: "2025-07-31",
    maxEnrollment: 15,
    enrollmentCount: 14,
  },
  {
    id: "plan_fall_15u",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    name: "15U Fall Season — Full",
    type: "season",
    status: "active",
    priceAmount: 65000, // $650
    allowsPaymentPlan: true,
    installmentCount: 3,
    depositAmount: 20000,
    maxEnrollment: 14,
    enrollmentCount: 12,
  },
  {
    id: "plan_academy_monthly",
    seasonId: "season_winter_2026",
    seasonName: "Winter 2026 Academy",
    name: "Academy Training — Monthly",
    description: "Month-to-month development training, 3x per week",
    type: "monthly",
    status: "active",
    priceAmount: 15000, // $150/mo
    allowsPaymentPlan: false,
    depositAmount: 0,
    maxEnrollment: 25,
    enrollmentCount: 22,
  },
  {
    id: "plan_summer_camp",
    name: "Summer Skills Camp 2025",
    description: "5-day intensive skills camp, all positions",
    type: "drop_in",
    status: "archived",
    priceAmount: 30000,
    allowsPaymentPlan: false,
    depositAmount: 0,
    maxEnrollment: 40,
    enrollmentCount: 40,
  },
];

// ── Registrations ─────────────────────────────────────────────────────────────

export type Registration = {
  id: string;
  seasonId?: string;
  seasonName?: string;
  planId?: string;
  planName?: string;
  teamId?: string;
  teamName?: string;
  playerId: string;
  playerName: string;
  guardianName?: string;
  guardianEmail?: string;
  status: "pending" | "waitlisted" | "accepted" | "active" | "cancelled" | "denied" | "incomplete";
  effectiveAmount: number; // cents
  discountAmount: number;
  adminNotes?: string;
  submittedAt: string;
  acceptedAt?: string;
  formsComplete: boolean;
  invoiceStatus?: "draft" | "open" | "paid" | "partial" | "overdue" | "void";
  invoiceId?: string;
};

export const mockRegistrations: Registration[] = [
  {
    id: "reg_001",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    planId: "plan_fall_17u",
    planName: "17U Fall Season — Full",
    teamId: "team_17u_boys",
    teamName: "17U Boys Varsity",
    playerId: "u_athlete_1",
    playerName: "Jalen Carter",
    guardianName: "Marcus Carter",
    guardianEmail: "marcus@email.com",
    status: "active",
    effectiveAmount: 75000,
    discountAmount: 5000,
    submittedAt: "2025-07-12T10:00:00Z",
    acceptedAt: "2025-07-14T09:00:00Z",
    formsComplete: true,
    invoiceStatus: "paid",
    invoiceId: "inv_001",
  },
  {
    id: "reg_002",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    planId: "plan_fall_15u",
    planName: "15U Fall Season — Full",
    teamId: "team_15u_boys",
    teamName: "15U Boys",
    playerId: "u_athlete_2",
    playerName: "Devon Miles",
    guardianName: "Sarah Miles",
    guardianEmail: "sarah.miles@email.com",
    status: "pending",
    effectiveAmount: 65000,
    discountAmount: 0,
    submittedAt: "2025-07-20T14:30:00Z",
    formsComplete: false,
  },
  {
    id: "reg_003",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    planId: "plan_fall_15u",
    planName: "15U Fall Season — Full",
    teamId: "team_15u_boys",
    teamName: "15U Boys",
    playerId: "u_athlete_3",
    playerName: "Malik Thompson",
    guardianName: "James Thompson",
    guardianEmail: "james.t@email.com",
    status: "accepted",
    effectiveAmount: 65000,
    discountAmount: 0,
    submittedAt: "2025-07-18T11:00:00Z",
    acceptedAt: "2025-07-19T10:00:00Z",
    formsComplete: true,
    invoiceStatus: "open",
    invoiceId: "inv_002",
  },
  {
    id: "reg_004",
    seasonId: "season_winter_2026",
    seasonName: "Winter 2026 Academy",
    planId: "plan_academy_monthly",
    planName: "Academy Training — Monthly",
    teamId: "team_academy_dev",
    teamName: "Academy Development",
    playerId: "u_athlete_4",
    playerName: "Amir Washington",
    guardianName: "Denise Washington",
    guardianEmail: "denise.w@email.com",
    status: "pending",
    effectiveAmount: 15000,
    discountAmount: 0,
    submittedAt: "2025-11-05T16:00:00Z",
    formsComplete: false,
  },
  {
    id: "reg_005",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    planId: "plan_fall_17u",
    planName: "17U Fall Season — Full",
    teamId: "team_17u_boys",
    teamName: "17U Boys Varsity",
    playerId: "u_athlete_5",
    playerName: "Cam Bradley",
    guardianName: "Kim Bradley",
    guardianEmail: "kim.b@email.com",
    status: "waitlisted",
    effectiveAmount: 75000,
    discountAmount: 0,
    submittedAt: "2025-08-15T09:00:00Z",
    formsComplete: false,
    adminNotes: "Strong tryout. Waitlisted due to roster cap.",
  },
];

// ── Invoices ──────────────────────────────────────────────────────────────────

export type Invoice = {
  id: string;
  invoiceNumber: string;
  seasonId?: string;
  seasonName?: string;
  registrationId?: string;
  playerId: string;
  playerName: string;
  guardianName?: string;
  status: "draft" | "open" | "paid" | "partial" | "overdue" | "void" | "refunded" | "write_off";
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate?: string;
  issuedAt?: string;
  paidAt?: string;
  memo?: string;
};

export const mockInvoices: Invoice[] = [
  {
    id: "inv_001",
    invoiceNumber: "INV-2025-0001",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    registrationId: "reg_001",
    playerId: "u_athlete_1",
    playerName: "Jalen Carter",
    guardianName: "Marcus Carter",
    status: "paid",
    subtotal: 75000,
    discountAmount: 5000,
    totalAmount: 70000,
    amountPaid: 70000,
    amountDue: 0,
    dueDate: "2025-08-01",
    issuedAt: "2025-07-14",
    paidAt: "2025-07-28",
    memo: "17U Fall Season — Full (early bird)",
  },
  {
    id: "inv_002",
    invoiceNumber: "INV-2025-0002",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    registrationId: "reg_003",
    playerId: "u_athlete_3",
    playerName: "Malik Thompson",
    guardianName: "James Thompson",
    status: "open",
    subtotal: 65000,
    discountAmount: 0,
    totalAmount: 65000,
    amountPaid: 0,
    amountDue: 65000,
    dueDate: "2025-08-20",
    issuedAt: "2025-07-19",
    memo: "15U Fall Season — Full",
  },
  {
    id: "inv_003",
    invoiceNumber: "INV-2025-0003",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    playerId: "u_athlete_6",
    playerName: "Xavier Reeves",
    guardianName: "Patricia Reeves",
    status: "overdue",
    subtotal: 65000,
    discountAmount: 0,
    totalAmount: 65000,
    amountPaid: 21700,
    amountDue: 43300,
    dueDate: "2025-07-15",
    issuedAt: "2025-06-20",
    memo: "15U Fall Season — Payment Plan (2 of 3 missed)",
  },
  {
    id: "inv_004",
    invoiceNumber: "INV-2025-0004",
    seasonId: "season_fall_2025",
    seasonName: "Fall 2025 AAU",
    playerId: "u_athlete_7",
    playerName: "Jordan Lee",
    guardianName: "Michael Lee",
    status: "partial",
    subtotal: 75000,
    discountAmount: 0,
    totalAmount: 75000,
    amountPaid: 25000,
    amountDue: 50000,
    dueDate: "2025-09-01",
    issuedAt: "2025-07-14",
    memo: "17U Fall Season — Payment Plan (1 of 3 paid)",
  },
];

// ── Admin Overview (pre-computed summary) ─────────────────────────────────────

export const mockAdminOverview = {
  registrations: {
    total: 48,
    pending: 5,
    active: 36,
    waitlisted: 3,
    accepted: 4,
  },
  billing: {
    totalBilled: 316500000,   // $316,500 in cents
    totalCollected: 248200000, // $248,200
    totalOutstanding: 68300000, // $68,300
    overdueCount: 4,
    openCount: 12,
    paidCount: 32,
  },
  teams: {
    count: 4,
  },
  roster: {
    totalPlayers: 58,
  },
  waivers: {
    templateCount: 5,
    requiredCount: 3,
  },
  alerts: {
    pendingRegistrations: 5,
    overdueInvoices: 4,
    overdueAmount: 17320000, // $173,200 in cents
  },
  attendance: {
    rate: 87,         // percent
    eventCount: 24,
  },
  compliance: {
    compliant: 51,
    incomplete: 7,
    total: 58,
  },
};
