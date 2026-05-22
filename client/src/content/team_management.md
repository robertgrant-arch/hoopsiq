# HoopsIQ: Team Management & Entitlement Engine

This document details the `(team)` route group and the core B2B2C growth loop of HoopsIQ: the **50%-off athlete discount engine**. It covers the organizational hierarchy, the complete invitation workflow, entitlement edge cases, and Stripe integration.

## 1. Domain & Entitlement Model Walkthrough

The Team Management module bridges the B2B Coach/Org experience with the B2C Player experience.

*   **The Hierarchy:** `Organization` (e.g., "Texas Elite AAU") → `Team` (e.g., "16U Boys") → `TeamMembership` (e.g., Athlete, Assistant Coach).
*   **The B2B Transaction:** An `Organization` purchases a `Team Pro` subscription (seat-based, e.g., 5 teams, 15 coaches).
*   **The Entitlement Trigger:** When an athlete accepts an `Invitation` to a `Team` that belongs to an `Organization` with an active `Team Pro` subscription, the system provisions a `DiscountGrant`.
*   **The B2C Transaction:** The athlete (or their parent) signs up for the `Player Core` subscription. At checkout, the `DiscountGrant` applies a Stripe Coupon, reducing the price by 50% for as long as the grant remains valid.

## 2. Role Workflows

The flow of team creation and roster building follows a strict top-down hierarchy.

1.  **Org Admin:** Creates the `Organization`, purchases the `Team Pro` subscription (defining the max number of teams/coaches), creates the `Team` entities, and assigns `TEAM_ADMIN` (Head Coach) roles.
2.  **Team Admin (Head Coach):** Logs into Coach HQ, selects their team, and uses `/(coach)/roster` to invite `ASSISTANT_COACH`es, `TRAINER`s, and `ATHLETE`s via email or shareable link.
3.  **Athlete:** Receives the invite. If under 13, forwards to a parent. If 13+, clicks the link, creates an account, and lands in the `(player)` app with the `TEAM_DISCOUNT_50` entitlement active.
4.  **Parent:** Can initiate the flow by linking to an existing child athlete, or by creating the child's account during the invite acceptance flow. Receives the `parent-observer` role.

## 3. Invite Flow UX

The invitation flow is the critical conversion moment where an athlete enters the HoopsIQ ecosystem.

*   **Delivery:** Email with a clear, branded call-to-action ("Coach Smith invited you to join Texas Elite 16U on HoopsIQ"). Includes a secure magic link (`/team/accept/[token]`).
*   **Deep-Link Landing (`/team/accept/[token]`):**
    *   *Unauthenticated:* Prompts Clerk Sign-Up/Sign-In. The token is stored in a secure cookie to survive the auth redirect.
    *   *Authenticated:* Shows a confirmation dialog: "Accept invitation to join Texas Elite 16U as an Athlete?"
*   **First-Run Experience:** Upon acceptance, the athlete is routed to `/player/onboarding` to set their position, height, and goals. The UI explicitly celebrates the discount: "Because you play for Texas Elite, your Player Core subscription is 50% off."

## 4. Entitlement Status UI

Transparency is crucial for both coaches and athletes regarding billing and discounts.

*   **Athlete View (`/(player)/settings/billing`):**
    *   A prominent banner: "✅ **50% Team Discount Active**"
    *   Subtext: "Provided by Texas Elite 16U. Valid as long as you remain on the active roster."
*   **Coach View (`/(coach)/roster`):**
    *   The `RosterTable` includes a "Discount Status" column (Active, Pending Invite, Inactive).
    *   Clicking the status opens a popover showing the `AuditLog` trail (e.g., "Granted on May 14, 2026 via invitation from Coach Smith").
*   **Org Admin View (`/(team)/orgs/[orgId]/billing`):**
    *   Shows total athlete discounts currently subsidized by the organization's subscription.

## 5. Discount Application Edge Cases

The `EntitlementService` must gracefully handle complex real-world scenarios to prevent revenue leakage and maintain trust.

*   **Coach Subscription Paused/Canceled:**
    *   *Trigger:* Stripe webhook `customer.subscription.deleted` or `customer.subscription.paused` for the Org.
    *   *Action:* The `EntitlementService` queries all `DiscountGrant`s tied to that Org's `SubscriptionId` and marks them `status: REVOKED`. It then iterates through all affected athletes, removes the Stripe Coupon from their active `Player Core` subscriptions (causing the next invoice to bill at 100%), and forces a Clerk token refresh to remove the JWT claim.
*   **Athlete Removed Mid-Cycle:**
    *   *Trigger:* Coach clicks "Remove from Roster".
    *   *Action:* The specific athlete's `DiscountGrant` is revoked. The Stripe Coupon is removed from their subscription immediately. Their current billing cycle remains unchanged, but the *next* renewal will be at full price.
*   **Athlete on Multiple Rosters:**
    *   *Scenario:* An athlete plays for both a High School team and an AAU team, both using HoopsIQ.
    *   *Action:* The athlete receives two distinct `DiscountGrant` records. The `EntitlementService` ensures only **one** 50% Stripe Coupon is applied to their checkout. If one team cancels, the system falls back to the second active grant, ensuring the athlete retains the discount.
*   **Transfer Between Orgs:**
    *   *Action:* Handled as a "Remove" from Org A (revoking Grant A) and an "Accept Invite" to Org B (provisioning Grant B).

## 6. Example Billing Handling with Stripe

The discount is implemented using Stripe Coupons, not price overrides, to maintain clean reporting.

*   **Coupon Strategy:** A permanent, 50%-off Stripe Coupon (e.g., `TEAM_LINKED_50`) is created in the Stripe Dashboard.
*   **Checkout Injection:** When an athlete initiates checkout, `EntitlementService.getCheckoutPrice(userId)` checks for an active `DiscountGrant`. If found, the Stripe Checkout Session is created with `discounts: [{ coupon: 'TEAM_LINKED_50' }]`.
*   **Webhook Idempotency:** All Stripe webhook handlers (e.g., for revoking discounts on org cancellation) must be idempotent. They check if the `DiscountGrant` is already `REVOKED` before attempting to call the Stripe API to remove the coupon, preventing race conditions and API rate limits.
*   **Proration:** If an athlete upgrades from a monthly to an annual plan while the discount is active, Stripe natively handles the proration, applying the 50% discount to the new annual total.

## 7. Auditability & The Parent Loop-In

B2B software requires strict audit trails for compliance and dispute resolution.

*   **AuditLog Entries:** Every state change in the entitlement engine creates an `AuditLog` record:
    *   `action: ENTITLEMENT_GRANTED`, `actorId: SYSTEM`, `targetId: athlete_123`, `metadata: { reason: "Joined roster team_456" }`
    *   `action: ENTITLEMENT_REVOKED`, `actorId: coach_789`, `targetId: athlete_123`, `metadata: { reason: "Removed from roster" }`
*   **Parent Observer View:**
    *   Parents access `/(parent)/dashboard`. They cannot modify the roster or the discount status, but they have a dedicated "Billing" tab showing exactly why they are receiving a discount (or why it was removed), linking back to the specific team and coach.

## 8. Org Admin Tools

The `/(team)` route group serves the `ORG_ADMIN`. This is a higher-level view than the Coach HQ.

*   **Seat Counts & Quotas:** The dashboard displays current usage vs. limits defined by the Stripe subscription (e.g., "Active Teams: 3/5", "Active Coaches: 8/15").
*   **SSO Placeholder:** A dedicated settings panel for configuring SAML/SSO (via Clerk Organizations), crucial for large public school districts.
*   **Global Roster Search:** Org Admins can search for any athlete across all teams within their organization to resolve disputes or handle transfers.

## 9. High-Fidelity Next.js Scaffolding

Below is the foundational code for the `(team)` route group, establishing the Org Admin dashboard and the critical invitation acceptance flow.

### `src/app/(app)/(team)/layout.tsx`

```tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { OrgSidebar } from "@/components/team/org-sidebar";
import { Policy } from "@/lib/auth/policy";

export default async function TeamLayout({ children }: { children: ReactNode }) {
  const { sessionClaims } = auth();
  
  // Defense-in-depth: Ensure user is an ORG_ADMIN
  if (!Policy.isOrgAdmin(sessionClaims)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-zinc-950">
        <OrgSidebar />
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### `src/app/(app)/(team)/orgs/[orgId]/page.tsx`

```tsx
import { Suspense } from "react";
import { TeamListTable } from "@/components/team/team-list-table";
import { SeatUsageWidget } from "@/components/team/seat-usage-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function OrgDashboardPage({ params }: { params: { orgId: string } }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 uppercase tracking-tight">Organization Overview</h1>
          <p className="text-muted-foreground">Manage teams, coaches, and billing.</p>
        </div>
        <Button className="shadow-glow-primary">
          <PlusIcon className="mr-2 h-4 w-4" /> Create Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SeatUsageWidget type="teams" orgId={params.orgId} />
        <SeatUsageWidget type="coaches" orgId={params.orgId} />
        <SeatUsageWidget type="discounted_athletes" orgId={params.orgId} />
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-xl uppercase mb-4 border-b border-border pb-2">Active Teams</h2>
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
          <TeamListTable orgId={params.orgId} />
        </Suspense>
      </div>
    </div>
  );
}
```

### `src/app/(app)/(team)/accept/[token]/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EntitlementService } from "@/lib/services/entitlement-service";

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  const { userId } = auth();
  
  // 1. Unauthenticated users are handled by middleware (storing token in cookie, redirecting to sign-in)
  if (!userId) redirect(`/sign-in?redirect_url=/team/accept/${params.token}`);

  // 2. Validate Token
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { team: { include: { organization: true } } }
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Invalid or Expired Link</h2>
          <p className="text-muted-foreground mb-6">Please ask your coach to resend the invitation.</p>
          <Button variant="outline" asChild><a href="/dashboard">Return Home</a></Button>
        </Card>
      </div>
    );
  }

  // 3. Render Acceptance UI (Server Component)
  // The actual form submission calls a Server Action to execute the transaction
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="p-8 max-w-md w-full border-white/10 bg-black shadow-glow-primary">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary mb-4">
            <span className="font-heading text-2xl">TE</span>
          </div>
          <h1 className="font-heading text-2xl uppercase tracking-tight text-white">Join {invitation.team.name}</h1>
          <p className="text-muted-foreground mt-2">
            You've been invited to join the roster as an {invitation.role}.
          </p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-md mb-8 border border-white/5">
          <p className="text-sm text-center text-emerald-400 font-medium">
            🎁 Bonus: Joining this roster unlocks a 50% lifetime discount on your Player Core subscription.
          </p>
        </div>

        <form action={async () => {
          "use server";
          // Server Action: Execute the join transaction and trigger entitlement
          await EntitlementService.acceptInvitationAndGrantDiscount(userId, invitation.id);
          redirect("/player/onboarding");
        }}>
          <Button type="submit" size="lg" className="w-full font-heading text-lg">
            Accept Invitation
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

## 10. Discount Rule Pseudocode (`EntitlementService`)

This service encapsulates the complex business logic for the 50%-off engine.

```typescript
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";

export class EntitlementService {
  
  /**
   * Executes the transaction to join a roster and provision the discount.
   */
  static async acceptInvitationAndGrantDiscount(userId: string, invitationId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Mark invite accepted
      const invite = await tx.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
        include: { team: { include: { organization: true } } }
      });

      // 2. Create TeamMembership
      await tx.teamMembership.create({
        data: { userId, teamId: invite.teamId, role: invite.role }
      });

      // 3. Evaluate Discount Eligibility
      const orgSubscription = await tx.subscription.findFirst({
        where: { organizationId: invite.team.organizationId, status: "ACTIVE" }
      });

      if (orgSubscription) {
        // 4. Provision DiscountGrant
        await tx.discountGrant.create({
          data: {
            userId,
            sourceType: "TEAM_ROSTER",
            sourceId: invite.teamId,
            status: "ACTIVE"
          }
        });

        // 5. Audit Log
        await tx.auditLog.create({
          data: {
            action: "ENTITLEMENT_GRANTED",
            actorId: "SYSTEM",
            targetId: userId,
            metadata: { reason: `Joined team ${invite.teamId}` }
          }
        });

        // 6. Update Clerk JWT Claims asynchronously (Outbox pattern or direct)
        await this.forceTokenRefresh(userId, ["TEAM_DISCOUNT_50"]);
      }
    });
  }

  /**
   * Called via Stripe Webhook when an Org cancels their Team Pro plan.
   */
  static async handleOrgCancellation(organizationId: string) {
    // 1. Find all active grants tied to this org's teams
    const grants = await prisma.discountGrant.findMany({
      where: {
        sourceType: "TEAM_ROSTER",
        status: "ACTIVE",
        team: { organizationId } // Assuming relation traversal
      }
    });

    for (const grant of grants) {
      // 2. Revoke grant
      await prisma.discountGrant.update({
        where: { id: grant.id },
        data: { status: "REVOKED" }
      });

      // 3. Remove Stripe Coupon from athlete's subscription
      const userSub = await prisma.subscription.findFirst({ where: { userId: grant.userId } });
      if (userSub?.stripeSubscriptionId) {
        await stripe.subscriptions.update(userSub.stripeSubscriptionId, {
          discounts: "" // Removes all discounts
        });
      }

      // 4. Audit Log & JWT Refresh
      await prisma.auditLog.create({
        data: { action: "ENTITLEMENT_REVOKED", actorId: "SYSTEM", targetId: grant.userId }
      });
      await this.forceTokenRefresh(grant.userId, []); // Remove claim
    }
  }
}
```
