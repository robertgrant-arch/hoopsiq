/**
 * Billing Store — Zustand + persist
 * --------------------------------------------------------------------------
 * Single source of truth for the in-memory billing/entitlements demo. Mirrors
 * the Postgres-backed store described in Prompt 16 §11 (Subscription,
 * Entitlement, CoachLinkEntitlement, Seat, Invoice, WebhookEvent, Coupon,
 * PayoutAccount, AuditEntry, AICreditMeter).
 *
 * The shape of the store + the way it's mutated via service methods (see
 * `./service.ts`) is exactly what the production system would do — only
 * difference is in production these are Prisma queries, here they are array
 * mutations.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AICreditMeter,
  AuditEntry,
  CoachLinkEntitlement,
  Entitlement,
  Invoice,
  PayoutAccount,
  Seat,
  Subscription,
  WebhookEvent,
} from "./types";

const nowIso = () => new Date().toISOString();

const cycleEnd = (start: Date, monthly = true): string => {
  const d = new Date(start);
  if (monthly) d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

/* ------------------------------------------------------------------ */
/* Seed data                                                          */
/* ------------------------------------------------------------------ */

const seedStart = new Date();
seedStart.setDate(seedStart.getDate() - 14); // 14 days into a 30-day cycle

const seedSubscriptions: Subscription[] = [
  // Coach Marcus Reed has Coach Pro
  {
    id: "sub_coach_reed",
    stripeSubscriptionId: "sub_HoopReedCoach",
    customerId: "u_coach_1",
    productId: "prod_coach_pro",
    priceId: "price_coach_pro_monthly",
    currentPeriodStart: seedStart.toISOString(),
    currentPeriodEnd: cycleEnd(seedStart),
    cancelAtPeriodEnd: false,
    status: "ACTIVE",
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
  // Westbury HS has Team Pro with 22 seats (2 over the included 20)
  {
    id: "sub_team_westbury",
    stripeSubscriptionId: "sub_HoopWestburyTeam",
    customerId: "u_team_admin_1",
    productId: "prod_team_pro",
    priceId: "price_team_pro_monthly",
    currentPeriodStart: seedStart.toISOString(),
    currentPeriodEnd: cycleEnd(seedStart),
    cancelAtPeriodEnd: false,
    status: "ACTIVE",
    seatCount: 22,
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
  // Player Jalen Carter has Player Solo with COACH50 applied
  {
    id: "sub_player_carter",
    stripeSubscriptionId: "sub_HoopCarterPlayer",
    customerId: "u_athlete_1",
    productId: "prod_player_solo",
    priceId: "price_player_solo_monthly",
    currentPeriodStart: seedStart.toISOString(),
    currentPeriodEnd: cycleEnd(seedStart),
    cancelAtPeriodEnd: false,
    status: "ACTIVE",
    couponCode: "COACH50",
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
  // Player Maya Lopez — past_due, in dunning grace
  {
    id: "sub_player_lopez",
    stripeSubscriptionId: "sub_HoopLopezPlayer",
    customerId: "u_player_lopez",
    productId: "prod_player_solo",
    priceId: "price_player_solo_monthly",
    currentPeriodStart: seedStart.toISOString(),
    currentPeriodEnd: cycleEnd(seedStart),
    cancelAtPeriodEnd: false,
    status: "PAST_DUE",
    couponCode: "COACH50",
    dunning: {
      failedPaymentAt: nowIso(),
      graceUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      attempts: 1,
    },
    createdAt: seedStart.toISOString(),
    updatedAt: nowIso(),
  },
];

const seedSeats: Seat[] = Array.from({ length: 22 }, (_, i) => ({
  id: `seat_west_${i + 1}`,
  subscriptionId: "sub_team_westbury",
  occupantUserId: i < 20 ? `u_player_west_${i + 1}` : undefined,
  status: i < 20 ? ("ASSIGNED" as const) : ("VACANT" as const),
  claimedAt: i < 20 ? seedStart.toISOString() : undefined,
}));

const seedEntitlements: Entitlement[] = [
  {
    id: "ent_reed_coachpro",
    userId: "u_coach_1",
    kind: "COACH_PRO",
    subscriptionId: "sub_coach_reed",
    state: "active",
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
  {
    id: "ent_carter_premium",
    userId: "u_athlete_1",
    kind: "PLAYER_PREMIUM",
    subscriptionId: "sub_player_carter",
    state: "active",
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
  {
    id: "ent_lopez_premium",
    userId: "u_player_lopez",
    kind: "PLAYER_PREMIUM",
    subscriptionId: "sub_player_lopez",
    state: "active",
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
];

const seedCoachLinks: CoachLinkEntitlement[] = [
  {
    id: "link_carter_reed",
    playerUserId: "u_athlete_1",
    source: { kind: "COACH_PRO", coachUserId: "u_coach_1" },
    status: "ACTIVE",
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
  {
    id: "link_lopez_reed",
    playerUserId: "u_player_lopez",
    source: { kind: "COACH_PRO", coachUserId: "u_coach_1" },
    status: "ACTIVE",
    createdAt: seedStart.toISOString(),
    updatedAt: seedStart.toISOString(),
  },
];

const seedInvoices: Invoice[] = [
  {
    id: "inv_reed_jan",
    stripeInvoiceId: "in_HoopReedJan",
    subscriptionId: "sub_coach_reed",
    customerId: "u_coach_1",
    amountDue: 4900,
    amountPaid: 4900,
    status: "PAID",
    appliedCoupons: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "inv_west_jan",
    stripeInvoiceId: "in_HoopWestburyJan",
    subscriptionId: "sub_team_westbury",
    customerId: "u_team_admin_1",
    amountDue: 9900 + 2 * 2900,
    amountPaid: 9900 + 2 * 2900,
    status: "PAID",
    appliedCoupons: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "inv_carter_jan",
    stripeInvoiceId: "in_HoopCarterJan",
    subscriptionId: "sub_player_carter",
    customerId: "u_athlete_1",
    amountDue: 950, // 50% off via COACH50
    amountPaid: 950,
    status: "PAID",
    appliedCoupons: ["COACH50"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "inv_lopez_failed",
    stripeInvoiceId: "in_HoopLopezFailed",
    subscriptionId: "sub_player_lopez",
    customerId: "u_player_lopez",
    amountDue: 950,
    amountPaid: 0,
    status: "OPEN",
    appliedCoupons: ["COACH50"],
    createdAt: nowIso(),
  },
];

const seedPayouts: PayoutAccount[] = [
  {
    id: "po_jay",
    expertUserId: "u_expert_1",
    stripeAccountId: "acct_HoopJayWilliams",
    status: "ENABLED",
    payoutsEnabled: true,
    detailsSubmitted: true,
    requirements: [],
    lifetimeGrossCents: 24500_00,
    lifetimePlatformFeeCents: 24500_00 * 0.15,
    lifetimeNetCents: 24500_00 * 0.85,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: nowIso(),
  },
  {
    id: "po_sue",
    expertUserId: "u_expert_2",
    stripeAccountId: "acct_HoopSueBird",
    status: "ENABLED",
    payoutsEnabled: true,
    detailsSubmitted: true,
    requirements: [],
    lifetimeGrossCents: 41200_00,
    lifetimePlatformFeeCents: 41200_00 * 0.15,
    lifetimeNetCents: 41200_00 * 0.85,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: nowIso(),
  },
];

const seedAICredits: AICreditMeter[] = [
  {
    userId: "u_athlete_1",
    balance: 23,
    totalConsumed: 27,
    lastRefilledAt: seedStart.toISOString(),
  },
  {
    userId: "u_player_lopez",
    balance: 5,
    totalConsumed: 45,
    lastRefilledAt: seedStart.toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export interface BillingState {
  subscriptions: Subscription[];
  seats: Seat[];
  invoices: Invoice[];
  entitlements: Entitlement[];
  coachLinks: CoachLinkEntitlement[];
  webhookEvents: WebhookEvent[];
  payouts: PayoutAccount[];
  audit: AuditEntry[];
  aiCredits: AICreditMeter[];

  // Generic mutators (preferred path is service.ts, which uses these).
  setSubscriptions: (xs: Subscription[]) => void;
  setSeats: (xs: Seat[]) => void;
  setInvoices: (xs: Invoice[]) => void;
  setEntitlements: (xs: Entitlement[]) => void;
  setCoachLinks: (xs: CoachLinkEntitlement[]) => void;
  setWebhookEvents: (xs: WebhookEvent[]) => void;
  setPayouts: (xs: PayoutAccount[]) => void;
  setAudit: (xs: AuditEntry[]) => void;
  setAICredits: (xs: AICreditMeter[]) => void;

  /** Wipe everything back to seed (demo helper). */
  reset: () => void;
}

const initialState = (): Omit<
  BillingState,
  | "setSubscriptions"
  | "setSeats"
  | "setInvoices"
  | "setEntitlements"
  | "setCoachLinks"
  | "setWebhookEvents"
  | "setPayouts"
  | "setAudit"
  | "setAICredits"
  | "reset"
> => ({
  subscriptions: seedSubscriptions,
  seats: seedSeats,
  invoices: seedInvoices,
  entitlements: seedEntitlements,
  coachLinks: seedCoachLinks,
  webhookEvents: [],
  payouts: seedPayouts,
  audit: [],
  aiCredits: seedAICredits,
});

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      ...initialState(),
      setSubscriptions: (xs) => set({ subscriptions: xs }),
      setSeats: (xs) => set({ seats: xs }),
      setInvoices: (xs) => set({ invoices: xs }),
      setEntitlements: (xs) => set({ entitlements: xs }),
      setCoachLinks: (xs) => set({ coachLinks: xs }),
      setWebhookEvents: (xs) => set({ webhookEvents: xs }),
      setPayouts: (xs) => set({ payouts: xs }),
      setAudit: (xs) => set({ audit: xs }),
      setAICredits: (xs) => set({ aiCredits: xs }),
      reset: () => set(initialState()),
    }),
    { name: "hoopsiq.billing.v2" },
  ),
);
