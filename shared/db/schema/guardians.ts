import { pgEnum, pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const guardianRelationshipEnum = pgEnum("guardian_relationship", [
  "parent",
  "stepparent",
  "grandparent",
  "guardian",
  "other",
]);

/**
 * One-to-many guardians per player.
 * Supersedes the flat parentGuardianName/Email/Phone fields on `players`,
 * which are kept for backward compatibility and populated from the primary record.
 *
 * SECURITY: guardianUserId is the Clerk user ID for the guardian's HoopsIQ
 * account.  Every /api/parent/* endpoint validates that the authenticated
 * user's Clerk userId appears in this table for the requested playerId before
 * returning any player data.  Without this check, any authenticated user could
 * enumerate another player's data by guessing a player ID.
 */
export const playerGuardians = pgTable("player_guardians", {
  id:             text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:          text("org_id").notNull(),
  playerId:       text("player_id").notNull(),
  // Clerk user ID of the guardian's HoopsIQ account.  Null until the guardian
  // has been invited and claimed their account.
  guardianUserId: text("guardian_user_id"),
  name:           text("name").notNull(),
  email:          text("email"),
  phone:          text("phone"),
  relationship:   guardianRelationshipEnum("relationship").notNull().default("parent"),
  isPrimary:      boolean("is_primary").notNull().default(false),
  canReceiveMessages: boolean("can_receive_messages").notNull().default(true),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  deletedAt:      timestamp("deleted_at"),
});

export type PlayerGuardian    = typeof playerGuardians.$inferSelect;
export type NewPlayerGuardian = typeof playerGuardians.$inferInsert;
