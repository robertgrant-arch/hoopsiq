// Canonical HoopsIQ documentation registry
// Defines the chapter tree, document metadata, and markdown content map.

import architectureMd from "../content/architecture.md?raw";
import iaRoutemapMd from "../content/ia_routemap.md?raw";
import schemaMd from "../content/schema.md?raw";
import authRbacMd from "../content/auth_rbac.md?raw";
import designSystemMd from "../content/design_system.md?raw";
import marketingSiteMd from "../content/marketing_site.md?raw";
import coachHqMd from "../content/coach_hq.md?raw";
import teamManagementMd from "../content/team_management.md?raw";
import aiFeedbackMd from "../content/ai_feedback.md?raw";
import marketplaceMd from "../content/marketplace.md?raw";
import liveClassesMd from "../content/live_classes.md?raw";
import filmRoomMd from "../content/film_room.md?raw";
import whiteboardMd from "../content/whiteboard.md?raw";
import learningMd from "../content/learning.md?raw";
import billingMd from "../content/billing.md?raw";
import notificationsMd from "../content/notifications.md?raw";
import adminMd from "../content/admin.md?raw";

export type DocEntry = {
  slug: string;
  prompt: string;
  title: string;
  shortTitle: string;
  summary: string;
  content: string;
  minutes: number;
};

export type DocChapter = {
  id: string;
  label: string;
  docs: DocEntry[];
};

function estimateMinutes(md: string): number {
  const words = md.split(/\s+/).length;
  return Math.max(3, Math.round(words / 220));
}

const D = (
  slug: string,
  prompt: string,
  title: string,
  shortTitle: string,
  summary: string,
  content: string
): DocEntry => ({
  slug,
  prompt,
  title,
  shortTitle,
  summary,
  content,
  minutes: estimateMinutes(content),
});

export const chapters: DocChapter[] = [
  {
    id: "foundation",
    label: "Foundation",
    docs: [
      D(
        "architecture",
        "01",
        "System Architecture & Scaffolding",
        "Architecture",
        "Modular monolith on Next.js App Router. Eight bounded modules, Mux for VOD, LiveKit for live, Stripe Billing + Connect, event-driven AI jobs.",
        architectureMd
      ),
      D(
        "ia-routemap",
        "02",
        "Information Architecture & Route Map",
        "IA & Routes",
        "Complete sitemap, Next.js App Router tree, role-based navigation, onboarding flows, and deep-link patterns for every product surface.",
        iaRoutemapMd
      ),
      D(
        "schema",
        "03",
        "Prisma Schema Deep-Dive",
        "Schema",
        "Production-grade Prisma schema across 11 domains — identity, org/team, billing, the 50%-off engine, workouts, video/AI, courses, live, playbooks, film, audit.",
        schemaMd
      ),
      D(
        "auth-rbac",
        "04",
        "Auth, RBAC & Multi-Tenancy",
        "Auth & RBAC",
        "Clerk-based authentication, JWT claim shape, 9-role permission matrix, parent–child linking, COPPA, invitations, impersonation, session strategy.",
        authRbacMd
      ),
      D(
        "design-system",
        "05",
        "Design System & Component Library",
        "Design System",
        "Brand direction, HSL tokens, Oswald + Inter + JetBrains Mono, spacing/radius/shadow/motion, component inventory, CVA examples, tailwind.config.ts.",
        designSystemMd
      ),
    ],
  },
  {
    id: "product",
    label: "Product Surfaces",
    docs: [
      D(
        "marketing-site",
        "06",
        "Marketing Site",
        "Marketing",
        "Messaging architecture, page-by-page wireframes with real copy, conversion strategy, SEO/JSON-LD, analytics & A/B plan, COPPA legal surface.",
        marketingSiteMd
      ),
      D(
        "coach-hq",
        "08",
        "Coach HQ — The Command Center",
        "Coach HQ",
        "Coach IA with parallel slots, compliance grid, review queue, telestration, assignment composer, practice plan builder, messaging, bookings.",
        coachHqMd
      ),
      D(
        "team-management",
        "09",
        "Team Management & the 50%-Off Engine",
        "Team Management",
        "Org/team hierarchy, invite flow, entitlement status UI, Stripe edge cases, parent observer, org admin tooling, EntitlementService pseudocode.",
        teamManagementMd
      ),
    ],
  },
  {
    id: "experiences",
    label: "Experiences",
    docs: [
      D(
        "ai-feedback",
        "10",
        "AI Feedback Architecture",
        "AI Feedback",
        "Intake → queue → worker → analysis store → notification → UI. Zod contracts, six UI states, human-in-the-loop escalation, worker stub, youth privacy.",
        aiFeedbackMd
      ),
      D(
        "live-classes",
        "12",
        "Live Classes Experience",
        "Live Classes",
        "Peloton × MasterClass hybrid. Discovery, countdown, LiveKit room, chat/reactions/Q&A, host controls, replay with chapter markers, attendance.",
        liveClassesMd
      ),
      D(
        "film-room",
        "13",
        "Film Room",
        "Film Room",
        "Team film rooms, clip tagging, assignments, telestration, anti-cheating watch-tracking, four quiz types, compliance heatmaps, Mux signed URLs.",
        filmRoomMd
      ),
      D(
        "whiteboard",
        "14",
        "Whiteboard & Playbook Studio",
        "Whiteboard",
        "Konva-based tactical canvas. PlayJSON schema, phase tagging, Zustand state, coach authoring + athlete study/test modes, keyboard shortcuts.",
        whiteboardMd
      ),
      D(
        "learning",
        "15",
        "Coach Education & Learning",
        "Learning",
        "Cinematic VOD library, INCLUDED vs PREMIUM tiers, three-tier progress model, bundle entitlements, paywall interstitials, marketplace flywheel.",
        learningMd
      ),
    ],
  },
  {
    id: "commerce",
    label: "Commerce & Growth",
    docs: [
      D(
        "marketplace",
        "11",
        "Expert Marketplace",
        "Marketplace",
        "MasterClass-level Expert profiles, offer catalog, Stripe Connect destination charges, verification, reviews, moderation, discovery.",
        marketplaceMd
      ),
      D(
        "billing",
        "16",
        "Billing, Packaging & Entitlements",
        "Billing",
        "Pricing architecture, Stripe product/price mapping with lookup keys, webhook idempotency, the 50% engine end-to-end, seat management, dunning.",
        billingMd
      ),
      D(
        "notifications",
        "17",
        "Notifications & Engagement",
        "Notifications",
        "Taxonomy (transactional/behavioral/engagement), channel matrix, Resend email, COPPA parent-in-the-loop, retention tactics, NotificationCenter.",
        notificationsMd
      ),
    ],
  },
  {
    id: "platform",
    label: "Platform Ops",
    docs: [
      D(
        "admin",
        "18",
        "Admin & Back-Office",
        "Admin",
        "15-surface admin shell, 1-hour impersonation with red banner, refund policy enforcement, chargeback evidence packaging, moderation queue.",
        adminMd
      ),
    ],
  },
];

export const allDocs: DocEntry[] = chapters.flatMap((c) => c.docs);

export function getDocBySlug(slug: string): DocEntry | undefined {
  return allDocs.find((d) => d.slug === slug);
}

export function getChapterForDoc(slug: string): DocChapter | undefined {
  return chapters.find((c) => c.docs.some((d) => d.slug === slug));
}

export function getNeighbors(slug: string): { prev?: DocEntry; next?: DocEntry } {
  const i = allDocs.findIndex((d) => d.slug === slug);
  return {
    prev: i > 0 ? allDocs[i - 1] : undefined,
    next: i >= 0 && i < allDocs.length - 1 ? allDocs[i + 1] : undefined,
  };
}
