import { pgEnum, pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

/**
 * Enum that records the outcome of a single policy evaluation.
 *
 *   allowed                — message passed through with no intervention
 *   blocked                — message was rejected (minor has no guardian on file)
 *   guardian_auto_included — message was allowed but guardians were injected automatically
 */
export const policyActionEnum = pgEnum("policy_action", [
  "allowed",
  "blocked",
  "guardian_auto_included",
]);

/**
 * Append-only audit log for messaging guardian-copy policy decisions.
 *
 * One row is written for every call to enforceGuardianPolicy(), whether the
 * message was allowed, auto-corrected, or blocked.  Rows are never deleted.
 *
 * Column semantics
 * ─────────────────
 *   senderId           Clerk user ID of the person trying to send
 *   threadId           DB thread ID — null when the send was blocked (no thread created)
 *   minorPresent       True when at least one targeted player is classified as a minor
 *   guardiansAdded     Guardian IDs injected by policy (empty unless guardian_auto_included)
 *   participantsBefore Player (and already-resolved guardian) IDs before enforcement
 *   participantsAfter  Same list after injected guardian IDs are merged in
 *   blockedReason      Human-readable reason string, populated only when action = blocked
 */
export const messagingPolicyLog = pgTable("messaging_policy_log", {
  id:                  text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:               text("org_id").notNull(),
  senderId:            text("sender_id").notNull(),
  threadId:            text("thread_id"),
  minorPresent:        boolean("minor_present").notNull().default(false),
  guardiansAdded:      text("guardians_added").array().notNull().default([]),
  participantsBefore:  text("participants_before").array().notNull().default([]),
  participantsAfter:   text("participants_after").array().notNull().default([]),
  blockedReason:       text("blocked_reason"),
  action:              policyActionEnum("action").notNull().default("allowed"),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
});

export type MessagingPolicyLog    = typeof messagingPolicyLog.$inferSelect;
export type NewMessagingPolicyLog = typeof messagingPolicyLog.$inferInsert;
