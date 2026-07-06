// shared/db/schema/app_users.ts
// First-party auth users (replaces Clerk SSO). org_members.userId references
// app_users.id as text, keeping the existing tenancy layer unchanged.

import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** scrypt$N$r$p$saltB64$hashB64 — null once an account is soft-deleted */
    passwordHash: text("password_hash"),
    /** Client portal role: ATHLETE | COACH | TEAM_ADMIN | EXPERT | PARENT | SUPER_ADMIN */
    portalRole: text("portal_role").notNull().default("ATHLETE"),
    active: boolean("active").notNull().default(true),
    /** Force a password change on next sign-in (admin-issued temp passwords). */
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    emailUnique: uniqueIndex("app_users_email_unique").on(t.email),
  }),
);

export type AppUser = typeof appUsers.$inferSelect;
export type NewAppUser = typeof appUsers.$inferInsert;
