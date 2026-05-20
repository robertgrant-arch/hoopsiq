/**
 * Clerk-backed tenancy for Express handlers.
 *
 * Requires `clerkMiddleware()` from `@clerk/express` ahead of routes that call
 * `requireOrg`. We read Clerk session claims via `auth(req)` (this module's
 * thin wrapper around `getAuth`, the Express equivalent of Next.js `auth()`).
 *
 * `orgId` returned here is always the HoopsOS Postgres `orgs.id` (UUID).
 * Map Clerk organization IDs by setting `orgs.payload.clerkOrgId` or by using
 * a Clerk org id that is itself a UUID matching `orgs.id`.
 */

import { getAuth } from "@clerk/express";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { getDb } from "@shared/db";
import { orgMembers, orgs } from "@shared/db";

/** Express equivalent of Clerk's `auth()` (reads the same session claims). */
export function auth(req: Request) {
  return getAuth(req);
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// ── Role constants ─────────────────────────────────────────────────────────────
// Keep in sync with orgMembers.role enum in DB schema.
export const ORG_ROLES = {
  PLAYER:   "player",
  COACH:    "coach",
  GUARDIAN: "guardian", // parent / guardian account
  OWNER:    "owner",
  ADMIN:    "admin",
  ANALYST:  "analyst",
  VIEWER:   "viewer",
} as const;

export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

/**
 * Express middleware factory that gates a route to the listed org roles.
 *
 * Usage (inline):
 *   router.get("/secret", requireRole("coach", "owner"), handler)
 *
 * Calls requireOrg internally — also enforces authentication and org membership.
 * Attaches ctx to res.locals.ctx so the handler can skip a second requireOrg call:
 *   const ctx = res.locals.ctx as RequireOrgResult;
 */
export function requireRole(...allowed: OrgRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = await requireOrg(req);
      if (!allowed.includes(ctx.role as OrgRole)) {
        return res.status(403).json({
          error: `Role '${ctx.role}' is not permitted. Required: ${allowed.join(", ")}`,
        });
      }
      res.locals.ctx = ctx;
      next();
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  };
}

/**
 * One-shot version of requireRole for use inside async handlers.
 * Returns ctx directly instead of going through middleware.
 *
 * Usage:
 *   const ctx = await requireOrgRole(req, "coach", "owner");
 */
export async function requireOrgRole(
  req: Request,
  ...allowed: OrgRole[]
): Promise<RequireOrgResult> {
  const ctx = await requireOrg(req);
  if (!allowed.includes(ctx.role as OrgRole)) {
    throw new HttpError(403, `Role '${ctx.role}' is not permitted here.`);
  }
  return ctx;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveDbOrgId(
  clerkOrgId: string,
  orgSlug: string | null | undefined,
): Promise<string | null> {
  const db = getDb();
  const clauses = [];
  if (looksLikeUuid(clerkOrgId)) {
    clauses.push(eq(orgs.id, clerkOrgId));
  }
  clauses.push(sql`(${orgs.payload}->>'clerkOrgId') = ${clerkOrgId}`);
  if (orgSlug) {
    clauses.push(eq(orgs.slug, orgSlug));
  }
  const rows = await db
    .select()
    .from(orgs)
    .where(and(or(...clauses), isNull(orgs.deletedAt)))
    .limit(1);
  return rows[0]?.id ?? null;
}

function teamIdFromRequest(req: Request): string {
  const header = req.get("x-hoops-team-id");
  if (header) return header;
  const clerkAuth = auth(req);
  const claims = clerkAuth.sessionClaims as
    | Record<string, unknown>
    | null
    | undefined;
  const fromClaims = claims?.teamId ?? claims?.team_id;
  if (typeof fromClaims === "string" && fromClaims.length > 0) return fromClaims;
  return "default";
}

export type RequireOrgResult = {
  userId: string;
  orgId: string;
  role: string;
  teamId: string;
};

/**
 * Resolves the active Clerk user, HoopsOS org UUID, and org_members.role.
 * @throws HttpError 401 when there is no signed-in user
 * @throws HttpError 403 when there is no Clerk org context or no DB org / membership
 */
export async function requireOrg(req: Request): Promise<RequireOrgResult> {
  const clerkAuth = auth(req);
  if (!clerkAuth.userId) {
    throw new HttpError(401, "Unauthorized");
  }
  const clerkOrgId = clerkAuth.orgId;
  if (!clerkOrgId) {
    throw new HttpError(403, "Active organization required");
  }

  let orgId: string | null;
  try {
    orgId = await resolveDbOrgId(clerkOrgId, clerkAuth.orgSlug ?? undefined);
  } catch (e) {
    // Convert DATABASE_URL / connection errors into a 503 so they become
    // proper JSON responses instead of Express's default 500 HTML page.
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("not set")) {
      throw new HttpError(503, "Database is not configured in this environment.");
    }
    throw e;
  }

  if (!orgId) {
    throw new HttpError(403, "Organization not provisioned");
  }

  let membership: typeof orgMembers.$inferSelect | undefined;
  try {
    const db = getDb();
    [membership] = await db
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, orgId),
          eq(orgMembers.userId, clerkAuth.userId),
          isNull(orgMembers.deletedAt),
        ),
      )
      .limit(1);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("not set")) {
      throw new HttpError(503, "Database is not configured in this environment.");
    }
    throw e;
  }

  if (!membership) {
    throw new HttpError(403, "Not a member of this organization");
  }

  return {
    userId: clerkAuth.userId,
    orgId,
    role: membership.role,
    teamId: teamIdFromRequest(req),
  };
}
