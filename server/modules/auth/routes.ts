/**
 * /api/auth — first-party authentication and admin user management.
 *
 * Public:
 *   POST /auth/login              { email, password } → { token, user }
 *
 * Signed-in:
 *   GET    /auth/me               → { user }
 *   POST   /auth/change-password  { currentPassword, newPassword }
 *   DELETE /auth/me               → soft-delete own account (App Store 5.1.1(v))
 *
 * Admin (portalRole SUPER_ADMIN):
 *   GET    /auth/users            → { users }
 *   POST   /auth/users            { email, name, portalRole, password }
 *   PATCH  /auth/users/:id        { name?, portalRole?, active?, password? }
 *   DELETE /auth/users/:id        → soft-delete
 */

import type { Express, Request, Response } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@shared/db";
import { appUsers, orgMembers, orgs, type AppUser } from "@shared/db";
import {
  hashPassword,
  verifyPassword,
  issueToken,
  localUser,
  loginRateLimited,
  clearLoginAttempts,
} from "../../auth/local";

const PORTAL_ROLES = ["ATHLETE", "COACH", "TEAM_ADMIN", "EXPERT", "PARENT", "SUPER_ADMIN"] as const;
type PortalRole = (typeof PORTAL_ROLES)[number];

/** Maps portal roles onto org_members roles so tenant-scoped routes authorize correctly. */
const ORG_ROLE_FOR_PORTAL: Record<PortalRole, string> = {
  ATHLETE: "player",
  COACH: "coach",
  TEAM_ADMIN: "admin",
  EXPERT: "analyst",
  PARENT: "guardian",
  SUPER_ADMIN: "owner",
};

function publicUser(u: AppUser) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    portalRole: u.portalRole,
    active: u.active,
    mustChangePassword: u.mustChangePassword,
    createdAt: u.createdAt,
  };
}

async function requireAdmin(req: Request, res: Response): Promise<AppUser | null> {
  const user = await localUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  if (user.portalRole !== "SUPER_ADMIN") {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }
  return user;
}

async function ensureMembership(userId: string, portalRole: PortalRole): Promise<void> {
  const db = getDb();
  const [org] = await db
    .select()
    .from(orgs)
    .where(and(eq(orgs.slug, "hoopsiq"), isNull(orgs.deletedAt)))
    .limit(1);
  if (!org) return;
  await db
    .insert(orgMembers)
    .values({ orgId: org.id, userId, role: ORG_ROLE_FOR_PORTAL[portalRole] as any })
    .onConflictDoUpdate({
      target: [orgMembers.orgId, orgMembers.userId],
      set: { role: ORG_ROLE_FOR_PORTAL[portalRole] as any, deletedAt: null },
    });
}

export function registerAuthRoutes(app: Express): void {
  // ── Login ───────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = String(req.body?.email ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      if (loginRateLimited(email)) {
        return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
      }
      const db = getDb();
      const [user] = await db
        .select()
        .from(appUsers)
        .where(and(eq(appUsers.email, email), isNull(appUsers.deletedAt)))
        .limit(1);
      if (!user || !user.active || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      clearLoginAttempts(email);
      return res.json({ token: issueToken(user.id), user: publicUser(user) });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("DATABASE_URL")) {
        return res.status(503).json({ error: "Database is not configured." });
      }
      console.error("[auth] login failed:", e);
      return res.status(500).json({ error: "Sign-in failed" });
    }
  });

  // ── Current user ────────────────────────────────────────────────────────────
  app.get("/api/auth/me", async (req, res) => {
    const user = await localUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ user: publicUser(user) });
  });

  app.post("/api/auth/change-password", async (req, res) => {
    const user = await localUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const current = String(req.body?.currentPassword ?? "");
    const next = String(req.body?.newPassword ?? "");
    if (next.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    if (!user.passwordHash || !verifyPassword(current, user.passwordHash)) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const db = getDb();
    await db
      .update(appUsers)
      .set({ passwordHash: hashPassword(next), mustChangePassword: false, updatedAt: new Date() })
      .where(eq(appUsers.id, user.id));
    return res.json({ ok: true });
  });

  // Account self-deletion (required by App Store guideline 5.1.1(v)).
  app.delete("/api/auth/me", async (req, res) => {
    const user = await localUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const db = getDb();
    const now = new Date();
    await db
      .update(appUsers)
      .set({
        deletedAt: now,
        active: false,
        passwordHash: null,
        email: `deleted+${user.id}@deleted.hoopsiq.invalid`,
        name: "Deleted user",
        updatedAt: now,
      })
      .where(eq(appUsers.id, user.id));
    await db
      .update(orgMembers)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(orgMembers.userId, user.id));
    return res.json({ ok: true });
  });

  // ── Admin user management ───────────────────────────────────────────────────
  app.get("/api/auth/users", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const db = getDb();
    const users = await db
      .select()
      .from(appUsers)
      .where(isNull(appUsers.deletedAt))
      .orderBy(appUsers.createdAt);
    return res.json({ users: users.map(publicUser) });
  });

  app.post("/api/auth/users", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const name = String(req.body?.name ?? "").trim();
    const portalRole = String(req.body?.portalRole ?? "ATHLETE") as PortalRole;
    const password = String(req.body?.password ?? "");
    if (!email || !name) return res.status(400).json({ error: "Email and name are required" });
    if (!PORTAL_ROLES.includes(portalRole)) return res.status(400).json({ error: "Invalid role" });
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const db = getDb();
    const [existing] = await db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.email, email))
      .limit(1);
    if (existing) return res.status(409).json({ error: "A user with that email already exists" });
    const [user] = await db
      .insert(appUsers)
      .values({
        email,
        name,
        portalRole,
        passwordHash: hashPassword(password),
        mustChangePassword: true,
        active: true,
      })
      .returning();
    await ensureMembership(user.id, portalRole);
    return res.status(201).json({ user: publicUser(user) });
  });

  app.patch("/api/auth/users/:id", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = req.params.id;
    const db = getDb();
    const [target] = await db
      .select()
      .from(appUsers)
      .where(and(eq(appUsers.id, id), isNull(appUsers.deletedAt)))
      .limit(1);
    if (!target) return res.status(404).json({ error: "User not found" });

    const patch: Partial<typeof appUsers.$inferInsert> = { updatedAt: new Date() };
    if (typeof req.body?.name === "string" && req.body.name.trim()) patch.name = req.body.name.trim();
    if (typeof req.body?.active === "boolean") {
      if (target.id === admin.id && req.body.active === false) {
        return res.status(400).json({ error: "You cannot deactivate your own account" });
      }
      patch.active = req.body.active;
    }
    if (typeof req.body?.portalRole === "string") {
      if (!PORTAL_ROLES.includes(req.body.portalRole)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      if (target.id === admin.id && req.body.portalRole !== "SUPER_ADMIN") {
        return res.status(400).json({ error: "You cannot demote your own account" });
      }
      patch.portalRole = req.body.portalRole;
    }
    if (typeof req.body?.password === "string" && req.body.password.length > 0) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      patch.passwordHash = hashPassword(req.body.password);
      patch.mustChangePassword = target.id !== admin.id;
    }

    const [updated] = await db.update(appUsers).set(patch).where(eq(appUsers.id, id)).returning();
    if (patch.portalRole) await ensureMembership(id, patch.portalRole as PortalRole);
    return res.json({ user: publicUser(updated) });
  });

  app.delete("/api/auth/users/:id", async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = req.params.id;
    if (id === admin.id) {
      return res.status(400).json({ error: "You cannot delete your own account here" });
    }
    const db = getDb();
    const now = new Date();
    const [target] = await db
      .select()
      .from(appUsers)
      .where(and(eq(appUsers.id, id), isNull(appUsers.deletedAt)))
      .limit(1);
    if (!target) return res.status(404).json({ error: "User not found" });
    await db
      .update(appUsers)
      .set({
        deletedAt: now,
        active: false,
        passwordHash: null,
        email: `deleted+${id}@deleted.hoopsiq.invalid`,
        updatedAt: now,
      })
      .where(eq(appUsers.id, id));
    await db
      .update(orgMembers)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(orgMembers.userId, id));
    return res.json({ ok: true });
  });
}
