# HoopsIQ: Internal Admin & Back-Office System

This document details the `(admin)` route group, the central command center for HoopsIQ staff. It provides the tooling necessary to support users, moderate content, manage the Expert Marketplace, and oversee platform health, all while maintaining strict auditability.

## 1. Admin IA & Route Map

The admin surface is isolated within the `(admin)` route group, featuring a dense, data-heavy layout optimized for desktop use.

*   `/(admin)` - The operational dashboard (high-level metrics, pending queues).
*   `/(admin)/users` - Global user search (by email, name, or Stripe ID).
*   `/(admin)/users/[id]` - The 360-degree user view (entitlements, teams, support notes, impersonation entry point).
*   `/(admin)/orgs` & `/(admin)/orgs/[id]` - Organization and team hierarchy management.
*   `/(admin)/subscriptions` & `/(admin)/entitlements` - Billing state inspection and manual discount overrides.
*   `/(admin)/experts` - The Expert Marketplace verification queue (KYC review, profile approval).
*   `/(admin)/payouts` - Stripe Connect payout review and manual hold triggers.
*   `/(admin)/refunds` - Refund processing and chargeback evidence packaging.
*   `/(admin)/moderation` - The flagged content queue (videos, comments, profiles).
*   `/(admin)/events` - Live event ops (cancel, reschedule, bulk refund attendees).
*   `/(admin)/audit` - Global, filterable view of the `AuditLog` table.
*   `/(admin)/jobs` - AI worker monitoring and manual job replay.
*   `/(admin)/flags` - Feature flag toggles (e.g., enabling a new AI model for 10% of users).
*   `/(admin)/catalog` - Plan and price catalog management (mapping Stripe Lookup Keys).

## 2. Permissions Model & Auditability

Access to the `(admin)` routes is strictly gated by the `sessionClaims.globalRole === 'SUPER_ADMIN'` JWT claim.

*   **Zero-Trust Actions:** Every destructive or mutating action taken within the admin panel (e.g., issuing a refund, suspending a user, manually granting an entitlement) requires a justification note.
*   **Immutable Audit Trail:** Every action writes a record to the `AuditLog` table. The schema enforces that the `actorId` is the admin's `userId`, the `targetId` is the affected entity, and the `reason` is captured in the `metadata` JSON.
*   **Impersonation Constraints:** Impersonation tokens have a hard 1-hour Time-To-Live (TTL). The `AuditLog` captures both the `IMPERSONATION_START` and `IMPERSONATION_END` events.

## 3. Operational Tooling Requirements

To support efficient back-office workflows, the admin UI components must adhere to specific standards:

*   **Search & Filter:** All data tables (Users, Orgs, AuditLog) must support server-side pagination, full-text search (via Prisma or Algolia), and multi-column filtering (e.g., "Status: ACTIVE" + "Plan: TEAM_PRO").
*   **Export:** Critical tables (Payouts, Refunds, AuditLog) must offer a "Export to CSV" function for external reporting or compliance audits.
*   **Bulk Actions:** The Live Events and Moderation queues require bulk selection (checkboxes) to apply actions simultaneously (e.g., "Cancel Event & Refund All 50 Attendees").
*   **Dry-Run Mode:** Destructive bulk actions must present a confirmation modal detailing exactly what will happen (e.g., "This will issue $450 in refunds and send 50 emails. Proceed?") before executing the transaction.

## 4. Schema Support Requirements

The admin system relies heavily on the foundational schema (Prompt 3), specifically:

*   `AuditLog`: The backbone of admin accountability (`id`, `action`, `actorId`, `targetId`, `metadata`, `createdAt`).
*   `SupportNote`: A simple table linked to `User` or `Organization` for internal staff communication (`id`, `targetId`, `authorId`, `content`, `createdAt`).
*   `FlaggedContent`: Tracks user-reported or AI-flagged items (`id`, `reporterId`, `targetType: VIDEO | COMMENT | PROFILE`, `targetId`, `reason`, `status: PENDING | REVIEWED | DISMISSED`).
*   `ModerationAction`: Records the outcome of a review (`id`, `flagId`, `adminId`, `actionTaken: WARN | SUSPEND | BAN | DELETE`, `appealStatus`).

## 5. Impersonation UX & Security

Impersonation is a high-risk capability necessary for troubleshooting complex user states (e.g., "Why can't I see my team's film?"). HoopsIQ implements it with extreme visibility.

*   **The Entry Point:** From `/(admin)/users/[id]`, the admin clicks "Impersonate User." A modal demands a reason (e.g., "Zendesk Ticket #1234").
*   **The Token:** The system generates a Clerk impersonation token with a strict 1-hour expiration. The `AuditLog` records `IMPERSONATION_START` with the provided reason.
*   **The Red Banner:** While impersonating, the entire HoopsIQ application (Player App, Coach HQ) renders a persistent, un-dismissible red banner at the top of the viewport: "⚠️ You are impersonating [User Name]. All actions are logged. Time remaining: 59:59."
*   **Force-End:** The banner contains a prominent "End Impersonation" button. Clicking it, or allowing the timer to expire, immediately revokes the token, redirects the admin back to `/(admin)/users/[id]`, and logs `IMPERSONATION_END`.

## 6. Refund & Chargeback Workflow

The `/(admin)/refunds` surface centralizes the financial dispute resolution process.

*   **Refund Processing:** Admins can issue full or partial refunds directly from the Stripe `Charge` record. The UI enforces the 14-day policy (Section 8 of the Billing spec), displaying the user's total video watch time and AI job count alongside the refund button. If the user exceeds the limits, the refund button is disabled, requiring a "Manager Override" toggle to proceed.
*   **Chargeback Evidence Packaging:** When a `charge.dispute.created` webhook fires, the system automatically aggregates evidence. The admin UI displays this packet (login history, `FilmWatchEvent` logs, IP address, signed Terms of Service timestamp) before the admin clicks "Submit Evidence to Stripe." This workflow turns a tedious manual task into a one-click defense against friendly fraud.

## 7. Moderation Queue & Flagged Content

The `/(admin)/moderation` surface is the frontline defense for community health, handling user reports and automated AI flags (e.g., inappropriate language in chat, explicit video uploads).

*   **The Queue:** A prioritized list of `FlaggedContent` items. High-severity flags (e.g., "Child Safety") are pinned to the top.
*   **Content Preview:** The UI renders the flagged asset directly in the admin panel. For a video, it plays the Mux asset; for a comment, it shows the surrounding thread context.
*   **Action Buttons:** The admin selects from a predefined list of actions: "Dismiss Flag" (false positive), "Delete Content & Warn User," "Suspend User (7 Days)," or "Permanent Ban."
*   **The Appeal Trail:** If an action is taken, the user receives an automated email (via Resend) explaining the violation. If the user appeals, the ticket is routed back to the moderation queue with an `appealStatus: PENDING` flag, requiring review by a different admin.

## 8. High-Fidelity Next.js Scaffolding

Below is the foundational code for the Admin system, focusing on the route structure, permissions, and the impersonation entry point.

### `src/app/(admin)/layout.tsx` (The Gated Shell)

```tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopNav } from "@/components/admin/admin-top-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { sessionClaims } = auth();

  // Strict RBAC: Only SUPER_ADMIN can access these routes
  if (sessionClaims?.globalRole !== "SUPER_ADMIN") {
    redirect("/"); // Or a dedicated 403 page
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopNav />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### `src/app/(admin)/users/[id]/page.tsx` (The 360-Degree User View)

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserHeader } from "@/components/admin/user-header";
import { EntitlementsCard } from "@/components/admin/entitlements-card";
import { TeamsCard } from "@/components/admin/teams-card";
import { SupportNotesList } from "@/components/admin/support-notes-list";
import { ImpersonationButton } from "@/components/admin/impersonation-button";

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      subscriptions: true,
      discountGrants: true,
      teamMemberships: { include: { team: { include: { organization: true } } } },
      supportNotes: { orderBy: { createdAt: "desc" }, include: { author: true } }
    }
  });

  if (!user) notFound();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <UserHeader user={user} />
        {/* The Impersonation Entry Point */}
        <ImpersonationButton userId={user.id} userName={user.profile?.firstName || user.email} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <EntitlementsCard subscriptions={user.subscriptions} grants={user.discountGrants} />
          <TeamsCard memberships={user.teamMemberships} />
        </div>
        <div>
          <SupportNotesList notes={user.supportNotes} targetUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
```

### `src/components/admin/impersonation-button.tsx` (The Impersonation Flow)

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { logImpersonationStart } from "@/app/actions/admin";

export function ImpersonationButton({ userId, userName }: { userId: string, userName: string }) {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!isLoaded || !reason.trim()) return;
    setIsLoading(true);

    try {
      // 1. Log the action (Server Action)
      await logImpersonationStart(userId, reason);

      // 2. Request the impersonation ticket from Clerk
      const ticket = await signIn.create({
        strategy: "ticket",
        ticket: await getImpersonationTicket(userId) // Custom backend route calling clerkClient.signInTokens.createSignInToken
      });

      if (ticket.status === "complete") {
        toast.success(`Now impersonating ${userName}`);
        router.push("/"); // Redirect to the main app, where the red banner will appear
      } else {
        throw new Error("Failed to complete impersonation");
      }
    } catch (error) {
      toast.error("Impersonation failed. Check logs.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Impersonate User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impersonate {userName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This action grants you full access to this user's account for 1 hour. All actions taken during this session are strictly audited.
          </p>
          <Textarea 
            placeholder="Reason for impersonation (e.g., Zendesk Ticket #1234)..." 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <Button 
            className="w-full" 
            onClick={handleImpersonate} 
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? "Starting Session..." : "Start Impersonation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stub for the backend call to get the Clerk ticket
async function getImpersonationTicket(targetUserId: string) {
  const res = await fetch("/api/admin/impersonate", {
    method: "POST",
    body: JSON.stringify({ targetUserId })
  });
  const data = await res.json();
  return data.token;
}
```
