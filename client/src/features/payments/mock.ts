/**
 * payments.ts — shared types and mock data for the HoopsOS Payments module.
 * All amounts in cents. Dates ISO-8601 strings.
 */

/* ─── Enums / union types ───────────────────────────────────────────────────── */

export type PaymentStatus =
  | "paid"      // balance === 0, cleared
  | "partial"   // 0 < paid < owed, not overdue
  | "overdue"   // balance > 0 AND today > dueDate
  | "pending"   // issued, not yet due, no payment received
  | "waived"    // staff waived remaining balance
  | "plan";     // on approved installment plan, currently current

export type FeeType =
  | "season_dues"
  | "tournament"
  | "uniform"
  | "camp"
  | "travel"
  | "equipment"
  | "other";

export type FeeScope = "team" | "subgroup" | "individual";
export type FeeStructure = "one_time" | "installment" | "recurring";

export type TransactionMethod =
  | "card" | "ach" | "cash" | "check" | "manual" | "waiver" | "credit";

export type TransactionStatus = "completed" | "pending" | "failed" | "refunded";
export type ReminderChannel = "push" | "sms" | "in_app" | "email";
export type WaiverReason =
  | "scholarship" | "hardship" | "staff_family" | "error_correction" | "other";

/* ─── Fee Requests ─────────────────────────────────────────────────────────── */

export interface FeeRequest {
  id: string;
  name: string;
  description?: string;
  type: FeeType;
  structure: FeeStructure;
  scope: FeeScope;
  targetTeamIds: string[];
  targetPlayerIds?: string[];
  amountCents: number;
  dueDate: string;
  seasonId: string;
  installmentCount?: number;
  installmentIntervalDays?: number;
  createdBy: string;
  createdAt: string;
  status: "draft" | "active" | "archived";
  affectedCount: number;
}

/* ─── Payment Accounts ─────────────────────────────────────────────────────── */

export interface PaymentAccount {
  id: string;
  playerId: string;
  playerName: string;
  playerTeam: string;
  guardianId: string;
  guardianName: string;
  guardianPhone?: string;
  guardianEmail?: string;
  feeRequestId: string;
  feeName: string;
  feeType: FeeType;
  seasonId: string;
  totalOwedCents: number;
  totalPaidCents: number;
  totalWaivedCents: number;
  balanceCents: number;           // totalOwed - totalPaid - totalWaived
  status: PaymentStatus;
  dueDate: string;
  lastPaymentDate?: string;
  lastReminderSentAt?: string;
  reminderCount: number;
  planId?: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Line Items ───────────────────────────────────────────────────────────── */

export interface LineItem {
  id: string;
  accountId: string;
  description: string;
  amountCents: number;
  discountCents: number;
  waivedCents: number;
  netCents: number;               // amountCents - discountCents - waivedCents
}

/* ─── Installment Plans ────────────────────────────────────────────────────── */

export interface Installment {
  id: string;
  planId: string;
  sequenceNumber: number;
  amountCents: number;
  dueDate: string;
  paidDate?: string;
  status: "pending" | "paid" | "overdue" | "waived";
}

export interface PaymentPlan {
  id: string;
  accountId: string;
  installments: Installment[];
  totalAmountCents: number;
  amountPaidCents: number;
  status: "active" | "completed" | "overdue" | "cancelled";
  approvedBy: string;
  approvedAt: string;
}

/* ─── Transactions ─────────────────────────────────────────────────────────── */

export interface Transaction {
  id: string;
  accountId: string;
  installmentId?: string;
  amountCents: number;            // positive = payment, negative = refund
  method: TransactionMethod;
  status: TransactionStatus;
  processedAt: string;
  processedBy: string;
  externalRef?: string;
  notes?: string;
}

/* ─── Waivers ──────────────────────────────────────────────────────────────── */

export interface WaiverRecord {
  id: string;
  accountId: string;
  amountCents: number;
  reason: WaiverReason;
  reasonNote: string;
  approvedBy: string;
  approvedAt: string;
}

/* ─── Audit + Reminders ────────────────────────────────────────────────────── */

export interface AuditEvent {
  id: string;
  accountId: string;
  action: string;
  performedBy: string;
  performedAt: string;
  detail: string;
  previousValue?: string;
  newValue?: string;
}

export interface ReminderEvent {
  id: string;
  accountId: string;
  channel: ReminderChannel;
  sentAt: string;
  sentBy: string;
  status: "delivered" | "failed" | "pending";
  messagePreview: string;
}

/* ─── Dashboard aggregate ──────────────────────────────────────────────────── */

export interface PaymentStats {
  totalOutstandingCents: number;
  overdueCount: number;
  overdueAmountCents: number;
  dueThisWeekCount: number;
  dueThisWeekAmountCents: number;
  fullyPaidCount: number;
  partialCount: number;
  pendingCount: number;
  waivedCount: number;
  planCount: number;
  collectedMtdCents: number;
  totalAccountsCount: number;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

export function formatCents(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date("2026-05-16");
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function statusLabel(status: PaymentStatus): string {
  return {
    paid: "Paid",
    partial: "Partial",
    overdue: "Overdue",
    pending: "Pending",
    waived: "Waived",
    plan: "On Plan",
  }[status];
}

/* ─── Mock fee requests ────────────────────────────────────────────────────── */

export const MOCK_FEE_REQUESTS: FeeRequest[] = [
  {
    id: "fr-001",
    name: "Spring Season Dues 2026",
    description: "Full season program fee covering training, film, and coaching.",
    type: "season_dues",
    structure: "one_time",
    scope: "team",
    targetTeamIds: ["team-17u", "team-16u"],
    amountCents: 42500,
    dueDate: "2026-04-30",
    seasonId: "season-spring-2026",
    createdBy: "Coach Rivera",
    createdAt: "2026-02-01T09:00:00Z",
    status: "active",
    affectedCount: 28,
  },
  {
    id: "fr-002",
    name: "State Tournament Entry Fee",
    description: "IHSA State qualifier tournament entry.",
    type: "tournament",
    structure: "one_time",
    scope: "team",
    targetTeamIds: ["team-17u"],
    amountCents: 12500,
    dueDate: "2026-05-10",
    seasonId: "season-spring-2026",
    createdBy: "Coach Rivera",
    createdAt: "2026-04-15T10:00:00Z",
    status: "active",
    affectedCount: 15,
  },
  {
    id: "fr-003",
    name: "HoopsOS Elite Camp — July",
    description: "3-day residential skill development camp.",
    type: "camp",
    structure: "installment",
    scope: "team",
    targetTeamIds: ["team-17u", "team-16u"],
    amountCents: 35000,
    dueDate: "2026-06-15",
    seasonId: "season-summer-2026",
    installmentCount: 2,
    installmentIntervalDays: 30,
    createdBy: "Program Director",
    createdAt: "2026-04-20T09:00:00Z",
    status: "active",
    affectedCount: 24,
  },
];

/* ─── Mock payment accounts ────────────────────────────────────────────────── */

export const MOCK_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  // OVERDUE
  {
    id: "pa-001",
    playerId: "player-001",
    playerName: "Trevon Williams",
    playerTeam: "17U Gold",
    guardianId: "guardian-001",
    guardianName: "Kevin Williams",
    guardianPhone: "(214) 555-0101",
    guardianEmail: "k.williams@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 0,
    totalWaivedCents: 0,
    balanceCents: 42500,
    status: "overdue",
    dueDate: "2026-04-30",
    reminderCount: 2,
    lastReminderSentAt: "2026-05-10T09:00:00Z",
    internalNotes: "Parent contacted 5/10. Said will pay by end of month.",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-05-10T09:00:00Z",
  },
  {
    id: "pa-002",
    playerId: "player-002",
    playerName: "Jordan Thompson",
    playerTeam: "17U Gold",
    guardianId: "guardian-002",
    guardianName: "Marcus Thompson",
    guardianPhone: "(312) 555-0202",
    guardianEmail: "m.thompson@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 0,
    totalWaivedCents: 0,
    balanceCents: 42500,
    status: "overdue",
    dueDate: "2026-04-15",
    reminderCount: 3,
    lastReminderSentAt: "2026-05-08T14:00:00Z",
    internalNotes: "",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-05-08T14:00:00Z",
  },
  {
    id: "pa-003",
    playerId: "player-003",
    playerName: "DeShawn Carter",
    playerTeam: "17U Gold",
    guardianId: "guardian-003",
    guardianName: "Latoya Carter",
    guardianPhone: "(404) 555-0303",
    guardianEmail: "l.carter@email.com",
    feeRequestId: "fr-002",
    feeName: "State Tournament Entry Fee",
    feeType: "tournament",
    seasonId: "season-spring-2026",
    totalOwedCents: 12500,
    totalPaidCents: 0,
    totalWaivedCents: 0,
    balanceCents: 12500,
    status: "overdue",
    dueDate: "2026-05-10",
    reminderCount: 1,
    lastReminderSentAt: "2026-05-12T10:00:00Z",
    internalNotes: "",
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  },
  {
    id: "pa-004",
    playerId: "player-004",
    playerName: "Isaiah Reeves",
    playerTeam: "16U Blue",
    guardianId: "guardian-004",
    guardianName: "Diana Reeves",
    guardianPhone: "(713) 555-0404",
    guardianEmail: "d.reeves@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 20000,
    totalWaivedCents: 0,
    balanceCents: 22500,
    status: "overdue",
    dueDate: "2026-04-30",
    lastPaymentDate: "2026-03-15",
    reminderCount: 1,
    internalNotes: "Paid half in March. No response to follow-ups.",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-05-01T09:00:00Z",
  },
  {
    id: "pa-005",
    playerId: "player-005",
    playerName: "Caleb Morrison",
    playerTeam: "17U Gold",
    guardianId: "guardian-005",
    guardianName: "Brenda Morrison",
    guardianPhone: "(602) 555-0505",
    guardianEmail: "b.morrison@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 0,
    totalWaivedCents: 0,
    balanceCents: 42500,
    status: "overdue",
    dueDate: "2026-04-30",
    reminderCount: 2,
    lastReminderSentAt: "2026-05-07T11:00:00Z",
    internalNotes: "",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-05-07T11:00:00Z",
  },
  // PARTIAL
  {
    id: "pa-006",
    playerId: "player-006",
    playerName: "Ryan Davis",
    playerTeam: "17U Gold",
    guardianId: "guardian-006",
    guardianName: "Tyrone Davis",
    guardianPhone: "(312) 555-0606",
    guardianEmail: "t.davis@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 21250,
    totalWaivedCents: 0,
    balanceCents: 21250,
    status: "partial",
    dueDate: "2026-05-20",
    lastPaymentDate: "2026-04-28",
    reminderCount: 0,
    internalNotes: "On unofficial payment plan. Second half due May 20.",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-04-28T15:00:00Z",
  },
  {
    id: "pa-007",
    playerId: "player-007",
    playerName: "Darius Webb",
    playerTeam: "16U Blue",
    guardianId: "guardian-007",
    guardianName: "Shawn Webb",
    guardianPhone: "(718) 555-0707",
    guardianEmail: "s.webb@email.com",
    feeRequestId: "fr-003",
    feeName: "HoopsOS Elite Camp — July",
    feeType: "camp",
    seasonId: "season-summer-2026",
    totalOwedCents: 35000,
    totalPaidCents: 17500,
    totalWaivedCents: 0,
    balanceCents: 17500,
    status: "plan",
    dueDate: "2026-06-15",
    lastPaymentDate: "2026-05-01",
    planId: "plan-007",
    reminderCount: 0,
    internalNotes: "",
    createdAt: "2026-04-20T09:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  // PENDING
  {
    id: "pa-008",
    playerId: "player-008",
    playerName: "Marcus Johnson",
    playerTeam: "17U Gold",
    guardianId: "guardian-008",
    guardianName: "Keisha Johnson",
    guardianPhone: "(214) 555-0808",
    guardianEmail: "k.johnson@email.com",
    feeRequestId: "fr-003",
    feeName: "HoopsOS Elite Camp — July",
    feeType: "camp",
    seasonId: "season-summer-2026",
    totalOwedCents: 35000,
    totalPaidCents: 0,
    totalWaivedCents: 0,
    balanceCents: 35000,
    status: "pending",
    dueDate: "2026-06-15",
    reminderCount: 0,
    internalNotes: "",
    createdAt: "2026-04-20T09:00:00Z",
    updatedAt: "2026-04-20T09:00:00Z",
  },
  {
    id: "pa-009",
    playerId: "player-009",
    playerName: "Jaylen Foster",
    playerTeam: "16U Blue",
    guardianId: "guardian-009",
    guardianName: "Monica Foster",
    guardianPhone: "(504) 555-0909",
    guardianEmail: "m.foster@email.com",
    feeRequestId: "fr-002",
    feeName: "State Tournament Entry Fee",
    feeType: "tournament",
    seasonId: "season-spring-2026",
    totalOwedCents: 12500,
    totalPaidCents: 0,
    totalWaivedCents: 0,
    balanceCents: 12500,
    status: "pending",
    dueDate: "2026-05-25",
    reminderCount: 0,
    internalNotes: "",
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-04-15T10:00:00Z",
  },
  // PAID
  {
    id: "pa-010",
    playerId: "player-010",
    playerName: "Andre Martinez",
    playerTeam: "17U Gold",
    guardianId: "guardian-010",
    guardianName: "Luis Martinez",
    guardianPhone: "(305) 555-1010",
    guardianEmail: "l.martinez@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 42500,
    totalWaivedCents: 0,
    balanceCents: 0,
    status: "paid",
    dueDate: "2026-04-30",
    lastPaymentDate: "2026-03-10",
    reminderCount: 0,
    internalNotes: "",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-03-10T11:00:00Z",
  },
  {
    id: "pa-011",
    playerId: "player-011",
    playerName: "Kyle Simmons",
    playerTeam: "17U Gold",
    guardianId: "guardian-011",
    guardianName: "Patricia Simmons",
    guardianPhone: "(678) 555-1111",
    guardianEmail: "p.simmons@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 42500,
    totalWaivedCents: 0,
    balanceCents: 0,
    status: "paid",
    dueDate: "2026-04-30",
    lastPaymentDate: "2026-04-02",
    reminderCount: 0,
    internalNotes: "",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-04-02T09:00:00Z",
  },
  {
    id: "pa-012",
    playerId: "player-012",
    playerName: "Tyler Brown",
    playerTeam: "16U Blue",
    guardianId: "guardian-012",
    guardianName: "Sandra Brown",
    guardianPhone: "(317) 555-1212",
    guardianEmail: "s.brown@email.com",
    feeRequestId: "fr-001",
    feeName: "Spring Season Dues 2026",
    feeType: "season_dues",
    seasonId: "season-spring-2026",
    totalOwedCents: 42500,
    totalPaidCents: 0,
    totalWaivedCents: 42500,
    balanceCents: 0,
    status: "waived",
    dueDate: "2026-04-30",
    reminderCount: 0,
    internalNotes: "Financial hardship waiver approved by Director. Season 2026.",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-02-15T14:00:00Z",
  },
];

/* ─── Mock transactions ────────────────────────────────────────────────────── */

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-001",
    accountId: "pa-004",
    amountCents: 20000,
    method: "card",
    status: "completed",
    processedAt: "2026-03-15T14:22:00Z",
    processedBy: "System (online)",
    notes: "Visa ending 4242",
  },
  {
    id: "tx-002",
    accountId: "pa-006",
    amountCents: 21250,
    method: "check",
    status: "completed",
    processedAt: "2026-04-28T10:05:00Z",
    processedBy: "Coach Rivera",
    notes: "Check #1147, deposited April 28",
  },
  {
    id: "tx-003",
    accountId: "pa-007",
    amountCents: 17500,
    method: "card",
    status: "completed",
    processedAt: "2026-05-01T08:14:00Z",
    processedBy: "System (online)",
    notes: "Installment 1 of 2",
  },
  {
    id: "tx-004",
    accountId: "pa-010",
    amountCents: 42500,
    method: "ach",
    status: "completed",
    processedAt: "2026-03-10T11:30:00Z",
    processedBy: "System (online)",
    notes: "ACH bank transfer",
  },
  {
    id: "tx-005",
    accountId: "pa-011",
    amountCents: 42500,
    method: "card",
    status: "completed",
    processedAt: "2026-04-02T09:15:00Z",
    processedBy: "System (online)",
    notes: "Visa ending 8811",
  },
  {
    id: "tx-006",
    accountId: "pa-012",
    amountCents: 42500,
    method: "waiver",
    status: "completed",
    processedAt: "2026-02-15T14:00:00Z",
    processedBy: "Program Director",
    notes: "Financial hardship waiver",
  },
];

/* ─── Mock installment plan ────────────────────────────────────────────────── */

export const MOCK_PLANS: PaymentPlan[] = [
  {
    id: "plan-007",
    accountId: "pa-007",
    totalAmountCents: 35000,
    amountPaidCents: 17500,
    status: "active",
    approvedBy: "Program Director",
    approvedAt: "2026-04-22T10:00:00Z",
    installments: [
      {
        id: "inst-001",
        planId: "plan-007",
        sequenceNumber: 1,
        amountCents: 17500,
        dueDate: "2026-05-01",
        paidDate: "2026-05-01",
        status: "paid",
      },
      {
        id: "inst-002",
        planId: "plan-007",
        sequenceNumber: 2,
        amountCents: 17500,
        dueDate: "2026-06-01",
        status: "pending",
      },
    ],
  },
];

/* ─── Mock audit log ───────────────────────────────────────────────────────── */

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "ae-001",
    accountId: "pa-001",
    action: "reminder_sent",
    performedBy: "Coach Rivera",
    performedAt: "2026-05-10T09:00:00Z",
    detail: "Reminder sent via in-app message to Kevin Williams",
  },
  {
    id: "ae-002",
    accountId: "pa-001",
    action: "reminder_sent",
    performedBy: "Coach Rivera",
    performedAt: "2026-05-03T09:00:00Z",
    detail: "Reminder sent via SMS to (214) 555-0101",
  },
  {
    id: "ae-003",
    accountId: "pa-001",
    action: "note_added",
    performedBy: "Coach Rivera",
    performedAt: "2026-05-10T09:05:00Z",
    detail: "Note added: Parent contacted 5/10. Said will pay by end of month.",
  },
  {
    id: "ae-004",
    accountId: "pa-004",
    action: "payment_recorded",
    performedBy: "System (online)",
    performedAt: "2026-03-15T14:22:00Z",
    detail: "Payment of $200.00 received via Visa ending 4242",
  },
  {
    id: "ae-005",
    accountId: "pa-012",
    action: "waiver_applied",
    performedBy: "Program Director",
    performedAt: "2026-02-15T14:00:00Z",
    detail: "Full waiver of $425.00 applied — hardship",
    previousValue: "$425.00 balance",
    newValue: "$0.00 balance (waived)",
  },
];

/* ─── Computed dashboard stats from mock data ──────────────────────────────── */

export function computeStats(accounts: PaymentAccount[]): PaymentStats {
  const today = new Date("2026-05-16");
  const weekEnd = new Date("2026-05-23");

  return {
    totalOutstandingCents: accounts
      .filter(a => a.balanceCents > 0 && a.status !== "waived")
      .reduce((s, a) => s + a.balanceCents, 0),
    overdueCount: accounts.filter(a => a.status === "overdue").length,
    overdueAmountCents: accounts
      .filter(a => a.status === "overdue")
      .reduce((s, a) => s + a.balanceCents, 0),
    dueThisWeekCount: accounts.filter(a => {
      const d = new Date(a.dueDate);
      return d >= today && d <= weekEnd && a.status !== "paid" && a.status !== "waived";
    }).length,
    dueThisWeekAmountCents: accounts
      .filter(a => {
        const d = new Date(a.dueDate);
        return d >= today && d <= weekEnd && a.status !== "paid" && a.status !== "waived";
      })
      .reduce((s, a) => s + a.balanceCents, 0),
    fullyPaidCount: accounts.filter(a => a.status === "paid").length,
    partialCount: accounts.filter(a => a.status === "partial").length,
    pendingCount: accounts.filter(a => a.status === "pending").length,
    waivedCount: accounts.filter(a => a.status === "waived").length,
    planCount: accounts.filter(a => a.status === "plan").length,
    collectedMtdCents: MOCK_TRANSACTIONS
      .filter(t => t.status === "completed" && t.processedAt.startsWith("2026-05"))
      .reduce((s, t) => s + t.amountCents, 0),
    totalAccountsCount: accounts.length,
  };
}
