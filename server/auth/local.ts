/**
 * First-party authentication (replaces Clerk SSO for interactive sign-in).
 *
 * - Passwords: Node crypto.scrypt (N=16384, r=8, p=1), constant-time compare.
 * - Sessions: stateless HMAC-SHA256 tokens `v1.<payloadB64>.<sigB64>` carrying
 *   { uid, exp }. Secret comes from AUTH_SECRET, falling back to a digest of
 *   DATABASE_URL so tokens survive restarts without extra configuration.
 * - Bootstrap: on startup, ensures the app_users table, the default org, and
 *   the master admin exist. Admin credentials come from ADMIN_EMAIL /
 *   ADMIN_PASSWORD_HASH env when set; otherwise the committed defaults below
 *   (hash only — the plaintext password is never stored in the repo).
 */

import crypto from "node:crypto";
import type { Request } from "express";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@shared/db";
import { appUsers, orgMembers, orgs, type AppUser } from "@shared/db";

// ── Password hashing ───────────────────────────────────────────────────────────

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, nStr, rStr, pStr, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ── Session tokens ─────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function tokenSecret(): Buffer {
  if (process.env.AUTH_SECRET) {
    return Buffer.from(process.env.AUTH_SECRET, "utf8");
  }
  const dbUrl = process.env.DATABASE_URL ?? "hoopsiq-dev-secret";
  return crypto.createHash("sha256").update(`hoopsiq-auth:${dbUrl}`).digest();
}

function sign(payloadB64: string): string {
  return crypto
    .createHmac("sha256", tokenSecret())
    .update(payloadB64)
    .digest("base64url");
}

export function issueToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS }),
  ).toString("base64url");
  return `v1.${payload}.${sign(payload)}`;
}

export function verifyToken(token: string): { userId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const [, payloadB64, sig] = parts;
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return { userId: payload.uid };
  } catch {
    return null;
  }
}

/** Reads the local session from the Authorization header. Null when absent/invalid. */
export function localAuth(req: Request): { userId: string } | null {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer v1.")) return null;
  return verifyToken(header.slice("Bearer ".length));
}

/** Loads the active AppUser for a local session, or null. */
export async function localUser(req: Request): Promise<AppUser | null> {
  const session = localAuth(req);
  if (!session) return null;
  const db = getDb();
  const [user] = await db
    .select()
    .from(appUsers)
    .where(and(eq(appUsers.id, session.userId), isNull(appUsers.deletedAt)))
    .limit(1);
  if (!user || !user.active) return null;
  return user;
}

// ── Login rate limiting (in-memory, per email) ────────────────────────────────

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export function loginRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = attempts.get(email);
  if (!entry || entry.resetAt < now) {
    attempts.set(email, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export function clearLoginAttempts(email: string): void {
  attempts.delete(email);
}

// ── Bootstrap: table, default org, master admin ───────────────────────────────

const DEFAULT_ORG_SLUG = "hoopsiq";
const DEFAULT_ADMIN_EMAIL = "robert.grant@selectquote.com";
// scrypt hash of the master admin's initial password (plaintext never committed).
const DEFAULT_ADMIN_HASH =
  "scrypt$16384$8$1$izi438A3dwRM/BIMBUMqZg==$/kX/oF3c8kCditTbWHUHUHa7SKxwc4oLcYuhIllFRSiOmgS6EIjL/8vVMKUF1R0DPbUi+pHVJxHC1k32CgAJ8w==";

/** Last bootstrap outcome — surfaced via /health for production diagnostics. */
export const bootstrapStatus: { ran: boolean; ok: boolean; step: string; error: string | null } = {
  ran: false,
  ok: false,
  step: "not-started",
  error: null,
};

export async function bootstrapLocalAuth(): Promise<void> {
  bootstrapStatus.ran = true;
  bootstrapStatus.ok = false;
  bootstrapStatus.error = null;
  try {
    await runBootstrap();
    bootstrapStatus.ok = true;
    bootstrapStatus.step = "done";
  } catch (e) {
    bootstrapStatus.error = e instanceof Error ? e.message : String(e);
    throw e;
  }
}

/** The admin email the bootstrap seeds — used by login's self-heal path. */
export function bootstrapAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).toLowerCase();
}

async function runBootstrap(): Promise<void> {
  const db = getDb();

  // Bring the database fully up to date first — production Neon had never
  // had migrations applied, so no schema tables existed at all.
  bootstrapStatus.step = "migrations";
  const { runMigrations } = await import("../db/migrate");
  const { applied } = await runMigrations();
  if (applied.length) console.log(`[db] ${applied.length} migrations applied`);

  bootstrapStatus.step = "create-table";

  // Defensive table creation so auth works even if the migration pipeline
  // hasn't run (mirrors shared/db/migrations/0017_app_users.sql).
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL,
      name text NOT NULL,
      password_hash text,
      portal_role text NOT NULL DEFAULT 'ATHLETE',
      active boolean NOT NULL DEFAULT true,
      must_change_password boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )
  `);
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_unique ON app_users (email)`,
  );

  // Default org
  bootstrapStatus.step = "default-org";
  let [org] = await db
    .select()
    .from(orgs)
    .where(and(eq(orgs.slug, DEFAULT_ORG_SLUG), isNull(orgs.deletedAt)))
    .limit(1);
  if (!org) {
    [org] = await db
      .insert(orgs)
      .values({ slug: DEFAULT_ORG_SLUG, name: "HoopsIQ" })
      .onConflictDoNothing()
      .returning();
    if (!org) {
      [org] = await db.select().from(orgs).where(eq(orgs.slug, DEFAULT_ORG_SLUG)).limit(1);
    }
  }

  // Master admin
  bootstrapStatus.step = "master-admin";
  const adminEmail = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH ?? DEFAULT_ADMIN_HASH;
  let [admin] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, adminEmail))
    .limit(1);
  if (!admin) {
    [admin] = await db
      .insert(appUsers)
      .values({
        email: adminEmail,
        name: "Robert Grant",
        passwordHash: adminHash,
        portalRole: "SUPER_ADMIN",
        active: true,
      })
      .onConflictDoNothing()
      .returning();
  }

  // Org membership (owner) so tenant-scoped API routes authorize the admin.
  bootstrapStatus.step = "org-membership";
  if (org && admin) {
    await db
      .insert(orgMembers)
      .values({ orgId: org.id, userId: admin.id, role: "owner" })
      .onConflictDoNothing();
  }

  console.log(`[auth] local auth ready (admin: ${adminEmail})`);
}
