# HoopsIQ: Billing, Packaging & Entitlement Engine

This document details the complete monetization architecture for HoopsIQ, bridging the product tiers (Player Core, Coach Core, Team Pro) with the underlying Stripe infrastructure and the proprietary 50%-off entitlement engine.

## 1. Pricing Model Architecture

HoopsIQ employs a hybrid B2C/B2B pricing model, designed to capture individual athletes while incentivizing organizational adoption.

*   **Player Core (B2C):** $19.99/month. Includes daily WODs, basic AI feedback (10 uploads/mo), and access to INCLUDED-tier courses.
*   **Coach Core (B2B/Prosumer):** $49.99/month or $499/year (16% discount). Includes Coach HQ, unlimited playbook authoring, and a single team roster (up to 15 players).
*   **Team Pro (B2B):** $9.99/seat/month or $99/seat/year. Minimum 20 seats. Includes org management, compliance dashboards, pooled AI quota, and SSO.
*   **Premium Add-Ons:** One-off purchases (Expert Reviews, Live Classes, Premium Course Bundles) utilizing dual-pricing (Member vs. Public price) to drive Core subscriptions.

## 2. Stripe Product & Price Mapping Strategy

We strictly separate the logical HoopsIQ `Plan` from the physical Stripe `Price` ID, mapping them via lookup keys to allow future pricing changes without code deploys.

| HoopsIQ Plan | Stripe Product | Stripe Price Type | Stripe Lookup Key |
| :--- | :--- | :--- | :--- |
| Player Core | `prod_player_core` | Flat rate, Recurring (Month) | `player_core_monthly` |
| Coach Core | `prod_coach_core` | Flat rate, Recurring (Month) | `coach_core_monthly` |
| Coach Core | `prod_coach_core` | Flat rate, Recurring (Year) | `coach_core_annual` |
| Team Pro | `prod_team_pro` | Per-seat, Recurring (Month) | `team_pro_seat_monthly` |
| Team Pro | `prod_team_pro` | Per-seat, Recurring (Year) | `team_pro_seat_annual` |

*   **Coupon vs. Price-Override Matrix:** For the 50% athlete discount, we use **Stripe Coupons** attached to the `Subscription` rather than creating a separate `$9.99` Price. This ensures MRR reporting in Stripe accurately reflects the discount, and allows us to revoke the coupon dynamically without changing the underlying subscription item.

## 3. Subscription Lifecycle & Webhook Handling

The system's source of truth for billing state is the Stripe Webhook handler. We employ a strict Outbox Pattern (via `DomainEvent`) to guarantee idempotency and replay-safety.

*   **Idempotency:** Every webhook handler first checks if `stripeEventId` exists in the `AuditLog`. If yes, it returns `200 OK` immediately (idempotent no-op).
*   **`checkout.session.completed`:** Provisions the initial `Subscription` record, sets `status: ACTIVE`, and mints the initial JWT entitlements.
*   **`invoice.paid`:** Extends the `currentPeriodEnd` date.
*   **`customer.subscription.updated`:** Handles upgrades/downgrades, seat count changes, and cancellations (setting `cancelAtPeriodEnd: true`).
*   **`customer.subscription.deleted`:** Hard revocation. Sets `status: CANCELED`, strips all entitlements, and triggers the `revokeTeamDiscount` cascade.
*   **`invoice.payment_failed`:** Triggers the Dunning UX (see Section 10).
*   **`charge.refunded`:** Logs the refund amount and optionally revokes access if it was a one-off purchase.

## 4. The 50%-Off Entitlement Engine End-to-End

The core growth loop of HoopsIQ is the 50% discount for athletes on an active roster. This engine requires precise synchronization between the `TeamMembership` lifecycle and the Stripe `Subscription` state.

1.  **Trigger (The Grant):** An athlete accepts an invitation to join a team (`TeamMembership` created). The `EntitlementService` verifies the team's parent organization has an active `COACH_CORE` or `TEAM_PRO` subscription. If true, it provisions a `DiscountGrant` record tied to the athlete's `userId`.
2.  **Redemption (The Checkout):** When the athlete attempts to purchase `Player Core`, the checkout session generator checks for an active `DiscountGrant`. If found, it injects a 50% off recurring Stripe Coupon into the `checkout.session.create` call.
3.  **Revocation (The Cascade):** Three events can trigger revocation:
    *   The athlete is removed from the roster.
    *   The coach's `COACH_CORE` subscription expires or is canceled.
    *   The organization's `TEAM_PRO` subscription expires.
4.  **Graceful Proration:** When revocation occurs, the `EntitlementService` calls the Stripe API to remove the coupon from the athlete's active subscription. The athlete receives an automated email explaining the change, and the next billing cycle will charge the full $19.99 rate. There is no mid-cycle clawback; the discount remains valid until the end of the current billing period.

## 5. Seat Management for Team Pro

The B2B `Team Pro` tier uses Stripe's per-seat pricing model.

*   **Seat Allocation:** The Org Admin purchases a specific quantity of seats (e.g., 50). This sets the `quantity` on the Stripe `SubscriptionItem`.
*   **Invite Quotas:** The application enforces a hard limit: `TeamMembership.count(where: { orgId }) <= SubscriptionItem.quantity`.
*   **Adding Seats:** If the admin needs to invite the 51st athlete, they must click "Add Seats" in the `/(team)/settings/billing` dashboard. This triggers a Stripe API call to update the `quantity` to 60 (sold in blocks of 10), generating an immediate prorated invoice for the remainder of the billing cycle.
*   **Swapping Seats:** Removing an athlete frees up a seat immediately. Inviting a new athlete consumes it without any billing event.

## 6. Premium Add-Ons & Monetization Types

HoopsIQ monetizes beyond the core subscription via the Expert Marketplace (Prompt 11) and the Learning Module (Prompt 15).

*   **One-Off Purchases:** Expert Async Reviews and Live Classes use standard Stripe Checkout Sessions (`mode: 'payment'`).
*   **Stripe Connect Destination Charges:** For Expert Marketplace transactions, HoopsIQ retains a 20% platform fee (`application_fee_amount`), while the remainder is automatically routed to the expert's connected account (`transfer_data.destination`).
*   **Gift Codes:** Team admins can purchase blocks of premium courses (e.g., 20 seats of "Advanced Pick & Roll"). The system generates 20 single-use alphanumeric codes stored in a `GiftCode` table, redeemable by athletes at checkout.

## 7. Tax, SCA, and PCI Compliance

HoopsIQ strictly minimizes PCI scope by relying entirely on Stripe-hosted surfaces.

*   **PCI Scope:** The application never touches raw credit card data. All payment collection occurs via Stripe Checkout or the Stripe Customer Portal.
*   **Tax Calculation:** Stripe Tax is enabled on all Checkout Sessions. The user's billing address is collected during checkout to automatically calculate and apply local sales tax or VAT, ensuring global compliance.
*   **SCA/3DS:** Strong Customer Authentication (SCA) for European customers is handled natively by Stripe Checkout, prompting for 3D Secure verification when required by the issuing bank.

## 8. Refunds & Chargeback Playbook

Handling refunds gracefully preserves the brand reputation, while fighting chargebacks aggressively protects revenue.

*   **Refund Policy:** HoopsIQ offers a strict 14-day money-back guarantee on annual Core subscriptions, provided the user has watched less than 30 minutes of premium video content and submitted zero AI feedback requests. Monthly subscriptions are non-refundable. Expert Marketplace reviews are refundable only if the expert fails to deliver within the promised SLA (e.g., 72 hours).
*   **Partial Refunds:** If a Team Pro organization drops from 50 to 30 seats mid-cycle, Stripe automatically calculates the prorated amount and applies it as a credit balance against the next invoice, rather than issuing a cash refund to the original payment method.
*   **Chargeback Playbook:** When a dispute (`charge.dispute.created`) is received, HoopsIQ automatically compiles an evidence packet. This includes the user's `AuditLog` of logins, the `FilmWatchEvent` telemetry proving they consumed the content, and the IP address/device fingerprint from the initial checkout. This packet is submitted to Stripe automatically via API to maximize the win rate against "friendly fraud."

## 9. Customer Portal & Subscription Management

To minimize support tickets, users self-manage their subscriptions via the Stripe Customer Portal.

*   **Portal Integration:** A "Manage Billing" button in the HoopsIQ settings (`/(player)/settings/billing`, `/(coach)/settings/billing`) generates a secure, short-lived portal session URL.
*   **Upgrade/Downgrade Flows:** Users can seamlessly upgrade from Monthly to Annual plans within the portal. Stripe handles the proration calculation automatically. Downgrades (e.g., Annual to Monthly) take effect at the end of the current billing cycle (`cancelAtPeriodEnd: true`).
*   **Pause/Resume:** Instead of outright cancellation, users are offered the option to pause their subscription for 1, 2, or 3 months. This retains their data (film history, playbooks) while temporarily halting billing.
*   **Cancellation Flow:** If a user insists on canceling, the portal presents a final retention offer (e.g., "Get 50% off your next 3 months"). If they decline, the subscription is marked to cancel at the end of the period, ensuring they receive the full value of what they've already paid for.

## 10. Dunning & Failed Payment UX

Involuntary churn (failed payments) is a massive revenue leak. HoopsIQ employs a multi-channel dunning strategy.

*   **Smart Retries:** Stripe's Smart Retries feature uses machine learning to retry failed cards at optimal times (e.g., immediately after payday).
*   **Grace Period:** When a payment fails (`invoice.payment_failed`), the user enters a 7-day grace period. Their `Subscription.status` remains `ACTIVE` in the database, but a prominent, un-dismissible red banner appears across all HoopsIQ surfaces: "Your payment method failed. Update your billing info to avoid losing access to your team's film room."
*   **Email Cadence:** Automated emails are sent on Day 1, Day 3, and Day 6 of the grace period, containing a direct link to the Stripe Customer Portal to update their card.
*   **Hard Revocation:** On Day 7, if the invoice remains unpaid, the subscription is marked `CANCELED`, and all premium entitlements are immediately revoked.

## 11. Billing Analytics (Admin Surface)

The `/(admin)/revenue` dashboard provides real-time visibility into the financial health of the platform, pulling data directly from Stripe via the API or a data warehouse sync (e.g., Stripe Data Pipeline to Snowflake).

*   **Key Metrics:** Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Average Revenue Per User (ARPU), and Customer Lifetime Value (LTV).
*   **Churn Tracking:** The dashboard differentiates between Gross Churn (total revenue lost) and Net Churn (revenue lost minus revenue gained from upgrades/expansion).
*   **Plan-Mix Analysis:** A pie chart visualizes the distribution of users across Player Core, Coach Core, and Team Pro, helping leadership identify which segments are driving growth.
*   **Add-On Performance:** A separate table tracks the GMV (Gross Merchandise Value) of the Expert Marketplace and the total sales volume of Premium Course Bundles, calculating HoopsIQ's take rate (the 20% platform fee).

## 12. High-Fidelity Next.js Scaffolding

Below is the foundational code for the billing engine, focusing on the webhook handler (the source of truth) and the Entitlement Service.

### `src/app/api/stripe/webhook/route.ts` (The Source of Truth)

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { EntitlementService } from "@/lib/services/entitlement-service";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Idempotency Check: Have we processed this event already?
  const existingLog = await prisma.auditLog.findUnique({
    where: { stripeEventId: event.id }
  });

  if (existingLog) {
    console.log(`[Webhook] Event ${event.id} already processed. Skipping.`);
    return new NextResponse("OK", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Handle initial subscription creation or one-off purchase
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // Trigger Dunning UX (email + in-app banner flag)
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Log the successful processing to ensure idempotency for future retries
    await prisma.auditLog.create({
      data: {
        stripeEventId: event.id,
        action: `STRIPE_WEBHOOK_${event.type}`,
        actorId: "SYSTEM",
        metadata: { status: "SUCCESS" }
      }
    });

    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    // Return 500 so Stripe retries the webhook later
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subRecord = await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "CANCELED", currentPeriodEnd: new Date(subscription.current_period_end * 1000) }
  });

  // If this was a Coach Core or Team Pro sub, we must revoke the 50% discount for all linked athletes
  if (subRecord.planId === "prod_coach_core" || subRecord.planId === "prod_team_pro") {
    await EntitlementService.revokeTeamDiscount(subRecord.userId);
  }
}
```

### `src/lib/services/entitlement-service.ts` (The 50% Engine)

```typescript
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";

export class EntitlementService {
  
  /**
   * Called when an athlete accepts a team invite.
   * Checks if the team is eligible, and if so, provisions the DiscountGrant.
   */
  static async evaluateTeamDiscount(userId: string, teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { organization: { include: { subscriptions: { where: { status: "ACTIVE" } } } } }
    });

    if (!team) return;

    // Check if the Org has an active Coach Core or Team Pro subscription
    const hasEligibleSub = team.organization.subscriptions.some(
      sub => sub.planId === "prod_coach_core" || sub.planId === "prod_team_pro"
    );

    if (hasEligibleSub) {
      // 1. Create the Grant in the DB
      await prisma.discountGrant.upsert({
        where: { userId },
        create: { userId, sourceTeamId: teamId, ruleId: "TEAM_DISCOUNT_50" },
        update: { sourceTeamId: teamId } // Update if they transferred teams
      });

      // 2. Update Clerk JWT claims so the UI knows immediately
      const user = await clerkClient.users.getUser(userId);
      const entitlements = (user.publicMetadata.entitlements as string[]) || [];
      if (!entitlements.includes("TEAM_DISCOUNT_50")) {
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: { entitlements: [...entitlements, "TEAM_DISCOUNT_50"] }
        });
      }

      // 3. Audit Log
      await prisma.auditLog.create({
        data: { action: "GRANT_DISCOUNT", actorId: "SYSTEM", targetId: userId, metadata: { teamId } }
      });
    }
  }

  /**
   * Called when a team sub cancels or an athlete is removed from the roster.
   * Strips the DB grant, the Stripe coupon, and the JWT claim.
   */
  static async revokeTeamDiscount(orgOwnerId: string) {
    // 1. Find all athletes who received a grant from this org's teams
    const grantsToRevoke = await prisma.discountGrant.findMany({
      where: { sourceTeam: { organization: { ownerId: orgOwnerId } } },
      include: { user: { include: { subscriptions: { where: { status: "ACTIVE", planId: "prod_player_core" } } } } }
    });

    for (const grant of grantsToRevoke) {
      // 2. Remove the Stripe Coupon from their active Player Core subscription
      const activeSub = grant.user.subscriptions[0];
      if (activeSub && activeSub.stripeSubscriptionId) {
        await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
          coupon: "" // Removing the coupon means the next invoice will be full price
        });
      }

      // 3. Delete the DB Grant
      await prisma.discountGrant.delete({ where: { id: grant.id } });

      // 4. Strip the JWT Claim
      const user = await clerkClient.users.getUser(grant.userId);
      const entitlements = (user.publicMetadata.entitlements as string[]) || [];
      await clerkClient.users.updateUserMetadata(grant.userId, {
        publicMetadata: { entitlements: entitlements.filter(e => e !== "TEAM_DISCOUNT_50") }
      });

      // 5. Audit Log
      await prisma.auditLog.create({
        data: { action: "REVOKE_DISCOUNT", actorId: "SYSTEM", targetId: grant.userId, metadata: { reason: "ORG_SUB_CANCELED" } }
      });
    }
  }
}
```

### `src/app/(app)/settings/billing/page.tsx` (Portal Redirect)

```tsx
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function BillingSettingsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const customer = await prisma.stripeCustomer.findUnique({ where: { userId } });

  // Server Action to generate the portal session
  async function createPortalSession() {
    "use server";
    if (!customer?.stripeCustomerId) throw new Error("No Stripe Customer found");
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });
    
    redirect(session.url);
  }

  return (
    <div className="max-w-2xl py-8">
      <h1 className="font-heading text-2xl uppercase mb-6">Billing & Plans</h1>
      
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6">
        <h3 className="font-medium text-lg mb-2">Manage Your Subscription</h3>
        <p className="text-zinc-600 mb-6">
          Update your payment method, download invoices, or change your plan.
        </p>
        
        {customer?.stripeCustomerId ? (
          <form action={createPortalSession}>
            <Button type="submit" className="shadow-glow-primary">
              Open Customer Portal
            </Button>
          </form>
        ) : (
          <p className="text-sm text-zinc-500 italic">No active billing history found.</p>
        )}
      </div>
    </div>
  );
}
```
