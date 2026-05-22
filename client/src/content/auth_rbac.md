# HoopsIQ: Authentication, Authorization, and RBAC Deep-Dive

This document details the complete authentication, authorization, and Role-Based Access Control (RBAC) model for HoopsIQ. It builds upon the canonical `schema.prisma` and Information Architecture, ensuring secure multi-tenancy, parent-child data privacy, and robust expert marketplace operations.

## 1. Authentication Strategy

For HoopsIQ, **Clerk** is the recommended authentication provider over Auth.js. 

**Rationale for Clerk:**
*   **B2B/B2C Hybrid Support:** Clerk natively handles complex multi-tenant organization models (Organizations, Memberships, Roles) out of the box, which perfectly aligns with HoopsIQ's Org → Team structure.
*   **Custom JWT Claims:** Clerk allows seamless injection of custom claims (e.g., `userId`, `roles`, `entitlements`) directly into the session JWT, reducing database round-trips for middleware authorization.
*   **Drop-in UI & Security:** Clerk provides production-ready components for MFA, session management, and impersonation, accelerating time-to-market.

**Configuration Details:**
*   **Social Providers:** Google, Apple (critical for mobile-first athletes), and Facebook.
*   **Verification:** Email verification is mandatory for all roles to prevent spam and ensure notification delivery.
*   **MFA (Multi-Factor Authentication):** Optional for athletes and parents. **Mandatory** for `ORG_ADMIN`, `TEAM_ADMIN`, `EXPERT`, and `SUPER_ADMIN` to protect financial data, Stripe Connect payouts, and youth PII.
*   **JWT Claims Injected:**
    ```json
    {
      "userId": "cuid_123",
      "globalRole": "COACH",
      "orgs": { "org_456": "ORG_ADMIN" },
      "teams": { "team_789": "TEAM_ADMIN" },
      "entitlements": ["TEAM_DISCOUNT_50"]
    }
    ```

## 2. Permission Naming Strategy

Permissions in HoopsIQ follow a strict `verb.resource.scope` convention. This ensures clarity when evaluating policies at the data layer.

*   **Verb:** `create`, `read`, `update`, `delete`, `assign`, `review`, `telestrate`, `publish`, `watch`, `grade`, `invite`, `remove`, `refund`, `impersonate`.
*   **Resource:** The domain entity (e.g., `workout`, `film`, `video`, `payout`, `user`, `roster`).
*   **Scope:** The boundary of the permission (e.g., `self`, `team`, `org`, `global`).

*Examples:*
*   `film.assign.team`: Can assign film to athletes within their team.
*   `video.telestrate.assigned`: Can draw telestration on a video uploaded by an assigned athlete.
*   `payout.read.self`: Can view their own Stripe Connect payouts.

## 3. Complete RBAC Permission Matrix

The matrix below maps global and team-level roles to specific permissions across core resources.

### Global Roles
| Resource / Action | Unaffiliated Athlete | Unaffiliated Coach | Expert | Parent | Super Admin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VideoUpload** | `create.self`, `read.self` | `create.self`, `read.self` | `create.self`, `read.self` | `read.child` | `read.global`, `delete.global` |
| **CoachReview** | `read.self` | *None* | *None* | `read.child` | `read.global` |
| **ExpertReview** | `read.self` | `read.self` | `create.assigned`, `telestrate.assigned` | `read.child` | `read.global` |
| **Course** | `read.purchased` | `read.purchased` | `create.self`, `publish.self` | *None* | `update.global`, `delete.global` |
| **LiveEvent** | `read.registered` | `read.registered` | `create.self`, `publish.self` | *None* | `update.global`, `delete.global` |
| **Booking** | `create.self`, `read.self` | `create.self`, `read.self` | `read.assigned`, `update.assigned` | `read.child` | `read.global`, `refund.global` |
| **Payout** | *None* | *None* | `read.self` | *None* | `read.global` |
| **User** | `read.self`, `update.self` | `read.self`, `update.self` | `read.self`, `update.self` | `read.self`, `read.child` | `read.global`, `impersonate.global` |

### Organization & Team Roles
*(Note: Permissions apply only within the scope of the specific Org or Team the user belongs to)*

| Resource / Action | Org Admin | Team Admin (Head Coach) | Assistant Coach | Trainer | Athlete | Parent-Observer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Organization** | `update.org` | `read.org` | `read.org` | `read.org` | `read.org` | `read.org` |
| **Team/Roster** | `create.org`, `update.org` | `update.team`, `invite.team`, `remove.team` | `read.team` | `read.team` | `read.team` | `read.team` |
| **WorkoutAssignment** | `read.org` | `assign.team`, `read.team` | `assign.team`, `read.team` | `assign.team`, `read.team` | `read.self` | `read.child` |
| **VideoUpload** | `read.org` | `read.team` | `read.team` | `read.team` | `create.self`, `read.team` | `read.child` |
| **CoachReview** | `read.org` | `create.team`, `telestrate.team` | `create.team`, `telestrate.team` | `create.team`, `telestrate.team` | `read.self` | `read.child` |
| **Playbook/Play** | `read.org` | `create.team`, `update.team` | `create.team`, `update.team` | `read.team` | `read.team` | `read.team` |
| **FilmRoom/Clip** | `read.org` | `create.team`, `assign.team` | `create.team`, `assign.team` | `read.team` | `read.team`, `watch.team` | `read.child` |
| **Subscription** | `update.org` | `read.team` | *None* | *None* | `read.self` | `read.self` |
| **Entitlement** | `read.org` | `read.team` | *None* | *None* | `read.self` | `read.self` |

## 4. Parent-Child Account Linking & COPPA

To comply with COPPA (Children's Online Privacy Protection Act) and protect youth PII, HoopsIQ implements a strict parent-child linking model.

**The Linking Flow:**
1.  **Parent Initiation:** A parent creates a `ParentProfile` and initiates a link via `/(onboarding)/parent/link`. They enter their child's email or a unique invite code provided by the child's coach.
2.  **Consent Recording:** The parent must check a legally binding COPPA consent box, which is recorded in the `AuditLog` along with their IP address and timestamp.
3.  **Creation/Linking:**
    *   If the child doesn't exist, the parent provisions an `AthleteProfile` (under-13 flow).
    *   If the child exists, a `ParentLink` record is created (`parentId`, `childId`).
4.  **Observer Scope:** The parent receives the `parent-observer` role. They have read-only access to their child's schedule, assignments, film, and AI feedback. They cannot chat with coaches or upload film on the child's behalf.
5.  **Age Threshold Transfer:** When the `AthleteProfile.birthDate` indicates the child has turned 13 (or 18, depending on jurisdiction), the system automatically prompts the athlete to claim full ownership of their account. The parent remains linked as a billing contact but loses granular read access unless the athlete explicitly grants it.

**Youth Privacy (PII Minimization):**
*   When an expert reviews a video from an athlete under 13, the athlete's full name is anonymized (e.g., "Athlete A.").
*   Direct messaging between adults (Experts/Coaches) and minors is strictly disabled; all communication must occur in a `Thread` where the linked `Parent` is automatically included as a `MessageParticipant`.

## 5. Invitation & Acceptance Workflow

The invitation flow bridges the gap between unaffiliated users and team rosters, simultaneously triggering the 50%-off entitlement engine.

**Workflow Steps:**
1.  **Initiation:** A `TEAM_ADMIN` (Head Coach) invites an athlete via email (`/(team)/roster`).
2.  **Creation:** An `Invitation` record is created with `status: PENDING`, a unique secure token, the target `teamId`, the target `role` (`ATHLETE`), and an `expiresAt` (e.g., 7 days).
3.  **Delivery:** The athlete receives an email with a secure magic link (`/invite?token=XYZ`).
4.  **Acceptance & Roster Join:**
    *   The athlete clicks the link, authenticates (or signs up), and accepts the invite.
    *   The system verifies the token is valid and not expired.
    *   A `TeamMembership` record is created, officially adding the athlete to the roster.
5.  **Entitlement Trigger:** Upon successful `TeamMembership` creation, the `EntitlementService.evaluateTeamDiscount` is fired asynchronously. If the team has an active subscription, the 50%-off `DiscountGrant` is automatically provisioned for the athlete.
6.  **Resend/Revoke:** Coaches can view pending invitations. They can resend the email (generating a new token and extending expiration) or revoke it (setting `status: DECLINED` or deleting the record), which instantly invalidates the magic link.

## 6. Expert Verification Workflow

To maintain the premium quality of the HoopsIQ marketplace, experts undergo a rigorous verification process before they can monetize.

**Workflow Steps:**
1.  **Application:** A user signs up as an `EXPERT` and completes their `ExpertProfile` (bio, credentials, social links). Their profile is marked `isPublic: false` by default.
2.  **Admin Review:** A `SUPER_ADMIN` reviews the application in the back-office (`/(admin)/users`). They verify the expert's credentials and coaching history.
3.  **Approval & Stripe Onboarding:**
    *   Upon approval, the admin triggers an email inviting the expert to complete Stripe Connect onboarding.
    *   The expert connects their bank account, satisfying KYC/AML requirements.
    *   The `StripeConnectAccount` record is created, and `chargesEnabled` / `payoutsEnabled` become `true`.
4.  **Publishing Gates:** Only when an expert is verified **and** their Stripe Connect account is fully enabled can they toggle `isPublic: true` and begin publishing `Course`s, `LiveEvent`s, and `Availability` slots.

## 7. Resource Ownership Rules

Determining "who owns what" is crucial for data privacy and multi-tenancy boundaries.

*   **"My" Resources (Self):** Resources owned exclusively by the user. Examples: `AthleteProfile`, `VideoUpload` (where `privacy: PRIVATE`), `WorkoutCompletion`, `Booking`.
*   **"Team" Resources (Team):** Resources owned by the `Team` entity. Examples: `FilmRoom`, `Playbook` (where `teamId` is set), `WorkoutAssignment`, `Season`. Any member of the team with appropriate read/write permissions can access these.
*   **"Org" Resources (Org):** Resources owned by the `Organization` entity. Examples: The `Organization` itself, and by extension, all `Team`s underneath it. Only `ORG_ADMIN`s have full visibility across teams.
*   **Cross-Boundary Rules:**
    *   An athlete's `VideoUpload` (if marked `TEAM` privacy) is visible to all coaches on their active roster.
    *   A coach can **only** create a `CoachReview` for a `VideoUpload` if the uploader is an athlete on a team where the coach is a `TEAM_ADMIN` or `ASSISTANT_COACH`.
    *   A coach cannot see the private workouts or private film of an athlete they coach.

## 8. Server-Side Authorization Approach

HoopsIQ employs a "Defense in Depth" strategy. UI hiding is never the sole security gate.

1.  **Next.js Middleware (Route Protection):** The first line of defense. The middleware intercepts all requests, parses the Clerk JWT, and enforces broad route-group access.
    *   *Example:* If a user without the `EXPERT` global role attempts to access `/(marketplace)/*`, the middleware redirects them to the dashboard.
2.  **Server Action Guards (Action Protection):** Every Server Action must begin with a role and permission check before executing any business logic.
3.  **Data-Layer Policy Enforcement (Row-Level Checks):** The ultimate source of truth. Service methods must explicitly query the database to verify ownership or team membership before mutating records.

## 9. Policy Rule Examples (TypeScript)

Below is pseudocode demonstrating the policy engine using the injected JWT claims and database checks.

```typescript
import { prisma } from "@/lib/prisma";

// The Policy Engine
export class Policy {
  
  // Example 1: Can a coach assign film to a team?
  static canAssignFilm(userClaims: any, teamId: string): boolean {
    // Check if the user has a coaching role specifically for this team ID
    const roleInTeam = userClaims.teams?.[teamId];
    return roleInTeam === "TEAM_ADMIN" || roleInTeam === "ASSISTANT_COACH";
  }

  // Example 2: Can a coach review a specific video?
  static async canReviewVideo(userClaims: any, videoId: string): Promise<boolean> {
    const video = await prisma.videoUpload.findUnique({
      where: { id: videoId },
      select: { uploaderId: true, privacy: true }
    });

    if (!video) return false;
    if (video.uploaderId === userClaims.userId) return true; // Can review own video
    if (video.privacy === "PRIVATE") return false; // Cannot review private video

    // Check if the uploader and the coach share a team membership
    const sharedTeam = await prisma.teamMembership.findFirst({
      where: {
        userId: video.uploaderId,
        team: {
          memberships: {
            some: {
              userId: userClaims.userId,
              role: { in: ["TEAM_ADMIN", "ASSISTANT_COACH"] }
            }
          }
        }
      }
    });

    return !!sharedTeam;
  }

  // Example 3: Can a parent view a child's profile?
  static async canViewChild(parentId: string, childId: string): Promise<boolean> {
    const link = await prisma.parentLink.findUnique({
      where: { parentId_childId: { parentId, childId } }
    });
    return !!link;
  }

  // Example 4: Does an athlete have the 50% discount entitlement?
  static hasDiscountEntitlement(userClaims: any): boolean {
    // Entitlements are injected into the JWT for fast, synchronous checks
    return userClaims.entitlements?.includes("TEAM_DISCOUNT_50") ?? false;
  }
}
```

## 10. Admin Override & Impersonation

Super Admins require the ability to impersonate users to troubleshoot issues or verify bug reports.

*   **Implementation:** Clerk's native impersonation feature is used. An admin clicks "Impersonate" on a user profile in the back-office.
*   **Audit Trail:** The `AuditLog` strictly records the start and end of the impersonation session, logging the admin's ID, the target user's ID, and the timestamp.
*   **UX Banner:** While impersonating, a persistent, un-dismissible red banner appears at the top of the screen: *"You are currently impersonating [User Name]. Return to Admin."*
*   **Time Limits:** Impersonation tokens are strictly time-limited (e.g., 1 hour) and automatically expire.

## 11. Session & Token Strategy

*   **Session Management:** Clerk handles session lifecycle (refresh tokens, short-lived access tokens).
*   **Revocation on Roster Removal:** If a coach removes an athlete from a roster, a webhook is fired to Clerk to force a token refresh for that athlete. This ensures their JWT claims (specifically the `teams` object) are updated immediately, instantly revoking their access to team-specific resources like the `FilmRoom`.
*   **Subscription Cancellation:** If a team's subscription is canceled, the `EntitlementService` revokes the 50%-off `DiscountGrant`. A similar webhook forces a token refresh for all affected athletes, removing the `TEAM_DISCOUNT_50` entitlement claim from their active sessions, preventing them from checking out with the discount.
