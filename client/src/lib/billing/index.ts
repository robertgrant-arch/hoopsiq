/**
 * Billing feature — public entry point.
 *
 * Pages and components should import from here, not from individual
 * billing internals. This keeps the internal module structure flexible
 * and prevents accidental coupling to implementation details.
 *
 * Internal modules (catalog, entitlements, webhooks) are not re-exported
 * here by default. Features that genuinely need them (e.g. BillingAdmin dev
 * tool) may import them directly and should note this in a comment.
 */

// ── Service (Stripe operations) ────────────────────────────────────────────
export {
  createCheckout,
  openPortal,
  cancelAtPeriodEnd,
  resumeSubscription,
  pauseSubscription,
  addSeat,
  removeSeat,
  swapSeat,
  refundInvoice,
  onRosterJoin,
  onRosterRemove,
  consumeAICredit,
  refillAICredits,
  type CheckoutInput,
  type CheckoutResult,
} from "./service";

// ── Store (Zustand state) ──────────────────────────────────────────────────
export { useBillingStore } from "./store";

// ── Analytics (KPI computation) ───────────────────────────────────────────
export { computeKPIs } from "./analytics";

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  ProductTier,
  Cadence,
  Product,
  Price,
  SubscriptionStatus,
  Subscription,
  Seat,
  Invoice,
  EntitlementKind,
  Entitlement,
  CoachLinkEntitlement,
  WebhookEvent,
  Coupon,
  PayoutAccount,
  AuditAction,
} from "./types";

// ── Catalog helpers (needed by pricing/seat UI) ────────────────────────────
export { findProduct, findPrice, formatCents, pricesForProduct } from "./catalog";
export type { Product, Price } from "./types";

// ── Entitlements (needed by admin tool) ───────────────────────────────────
export { grantEntitlement, revokeEntitlement, expireGrandfathers, grantCoachLink, revokeCoachLink } from "./entitlements";

// ── Webhook simulator (BillingAdmin dev tool only) ────────────────────────
export { dispatchWebhook } from "./webhooks";
export type { SimulatedEvent } from "./webhooks";
