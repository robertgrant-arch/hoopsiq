/**
 * Announcements mock data.
 * Used by: CoachAnnouncementsPage, ParentAnnouncementsPage, ParentDashboard,
 *          PlayerDashboard, AppShell badge counts.
 */

export type AnnouncementAudience = "all" | "players" | "parents" | "coaches";
export type AnnouncementPriority = "normal" | "urgent";

export type Announcement = {
  id: string;
  orgId: string;
  authorId: string;
  authorName: string;
  authorRole: "coach" | "admin";
  title: string;
  body: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  pinned: boolean;
  createdAt: string;
  /** IDs of users who have read this announcement. */
  readBy: string[];
  /** Total recipients for this audience (used to compute read %). */
  recipientCount: number;
  /** Optional CTA link shown at the bottom of the announcement. */
  ctaLabel?: string;
  ctaHref?: string;
};

export const announcements: Announcement[] = [
  {
    id: "ann_001",
    orgId: "org_barnegat",
    authorId: "coach_1",
    authorName: "Coach Marcus",
    authorRole: "coach",
    title: "Practice moved — Thursday 5:30 PM at Barnegat HS Gym B",
    body: "Due to the varsity game running late, we're moving from Gym A to Gym B this Thursday. Same time, different door — enter from the south parking lot. Please confirm you received this.",
    audience: "all",
    priority: "urgent",
    pinned: true,
    createdAt: "2026-05-15T08:14:00Z",
    readBy: ["p_malik", "p_cam", "p_jaylen", "parent_malik", "parent_cam"],
    recipientCount: 18,
  },
  {
    id: "ann_002",
    orgId: "org_barnegat",
    authorId: "coach_1",
    authorName: "Coach Marcus",
    authorRole: "coach",
    title: "Oak Hill game — Saturday 11 AM, dress code and arrival time",
    body: "Arrive at Oak Hill HS no later than 10:15 AM. Full warmup starts at 10:30. Dress code: full team warmups over game jersey. No earrings, no hoodies during warmup. Parents — bleacher section is left side only, Oak Hill side is reserved.\n\nFocus: we are going to press early. Conditioning drills from Thursday are the blueprint. Trust your reads.",
    audience: "all",
    priority: "normal",
    pinned: true,
    createdAt: "2026-05-14T17:02:00Z",
    readBy: ["p_malik", "p_cam", "p_jaylen", "p_noah", "p_tyler", "parent_malik", "parent_cam", "parent_jaylen"],
    recipientCount: 18,
  },
  {
    id: "ann_003",
    orgId: "org_barnegat",
    authorId: "coach_1",
    authorName: "Coach Marcus",
    authorRole: "coach",
    title: "WOD submissions — all players due by Friday midnight",
    body: "Three players still haven't submitted this week's film or WOD log. You know who you are. Friday midnight is the hard cutoff — no submission means no full practice reps Saturday. Not a punishment, a data issue: we can't coach what we can't see.\n\nFor those who are current: keep it up. Malik and Noah's submissions this week were outstanding.",
    audience: "players",
    priority: "urgent",
    pinned: false,
    createdAt: "2026-05-14T09:45:00Z",
    readBy: ["p_malik", "p_noah", "p_tyler", "p_brandon"],
    recipientCount: 12,
  },
  {
    id: "ann_004",
    orgId: "org_barnegat",
    authorId: "coach_1",
    authorName: "Coach Marcus",
    authorRole: "coach",
    title: "Spring season balance due — June 1st",
    body: "Families with outstanding balances will receive a separate email from our admin team. If you enrolled on a payment plan, your next installment processes automatically on June 1st. Reach out to admin@barnegat.hoopsos.io with any billing questions — do not DM coaches about payments.",
    audience: "parents",
    priority: "normal",
    pinned: false,
    createdAt: "2026-05-12T14:30:00Z",
    readBy: ["parent_malik", "parent_cam", "parent_jaylen", "parent_noah"],
    recipientCount: 10,
  },
  {
    id: "ann_005",
    orgId: "org_barnegat",
    authorId: "coach_1",
    authorName: "Coach Marcus",
    authorRole: "coach",
    title: "End-of-season showcase — June 14th, Barnegat HS Main Gym",
    body: "We're hosting an end-of-season showcase scrimmage open to families, prospective players, and recruiting staff. June 14th, 1–4 PM. Each player will receive individual stat sheets and a development summary to share with coaches.\n\nPlayers: dress sharp. This is a visibility event.",
    audience: "all",
    priority: "normal",
    pinned: false,
    createdAt: "2026-05-10T11:00:00Z",
    readBy: ["p_malik", "p_cam", "p_jaylen", "p_noah", "p_tyler", "parent_malik"],
    recipientCount: 18,
  },
  {
    id: "ann_006",
    orgId: "org_barnegat",
    authorId: "coach_1",
    authorName: "Coach Marcus",
    authorRole: "coach",
    title: "Summer program registration opens Monday",
    body: "Summer individual training slots are limited to 16 players. Early bird pricing applies until May 31st — families on the current roster get priority access starting Monday at 9 AM. Full schedule and pricing is in the Membership section.",
    audience: "parents",
    priority: "normal",
    pinned: false,
    createdAt: "2026-05-09T08:00:00Z",
    readBy: ["parent_malik", "parent_cam"],
    recipientCount: 10,
    ctaLabel: "View summer program",
    ctaHref: "/app/club/memberships",
  },
];

/** Returns the unread count for a given user ID. */
export function getUnreadCount(userId: string): number {
  return announcements.filter((a) => !a.readBy.includes(userId)).length;
}

/** Returns announcements formatted for a given audience (includes "all"). */
export function getAnnouncementsForAudience(audience: AnnouncementAudience): Announcement[] {
  return announcements.filter(
    (a) => a.audience === "all" || a.audience === audience
  );
}
