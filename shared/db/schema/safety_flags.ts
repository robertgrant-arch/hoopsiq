import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

/**
 * Immutable evidence record for every safety flag raised by the rule engine.
 *
 * One row per flagged message attempt (whether blocked or allowed).
 * Never modified after creation — the triage state lives in flag_review_items.
 *
 * body_snapshot   The original message text at detection time.  Preserved even
 *                 if the message is later edited or soft-deleted.
 *
 * matched_rules   JSONB array of { ruleId, category, severity, matchedText,
 *                 description } — one entry per rule that matched.
 *
 * message_id      Null when was_blocked = true (message never reached DB).
 *                 Set when the send was allowed despite a flag (medium/low).
 */
export const safetyFlags = pgTable("safety_flags", {
  id:                  text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:               text("org_id").notNull(),
  messageId:           text("message_id"),           // null if blocked
  threadId:            text("thread_id"),
  senderId:            text("sender_id").notNull(),
  senderRole:          text("sender_role").notNull(),
  bodySnapshot:        text("body_snapshot").notNull(),
  matchedRules:        jsonb("matched_rules").notNull().default([]),
  maxSeverity:         text("max_severity").notNull(),  // "low"|"medium"|"high"
  categories:          text("categories").array().notNull().default([]),
  wasBlocked:          boolean("was_blocked").notNull().default(false),
  hasMinorRecipients:  boolean("has_minor_recipients").notNull().default(false),
  threadType:          text("thread_type"),
  createdAt:           timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Mutable triage row linked 1:1 to a safety_flags row.
 *
 * Only high- and medium-severity flags get a review item.
 * Low-severity flags are logged (safety_flags row written) but not queued.
 *
 * status values
 * ─────────────
 *   open       New flag, needs admin attention (default)
 *   dismissed  Admin reviewed and determined no action required
 *   escalated  Admin flagged for further review / external reporting
 *
 * High-severity items are created with status = "escalated" to surface them
 * immediately.  Medium-severity items start as "open".
 */
export const flagReviewItems = pgTable("flag_review_items", {
  id:          text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:       text("org_id").notNull(),
  flagId:      text("flag_id").notNull(),
  status:      text("status").notNull().default("open"),
  reviewedBy:  text("reviewed_by"),
  reviewNote:  text("review_note"),
  reviewedAt:  timestamp("reviewed_at", { withTimezone: true }),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SafetyFlag       = typeof safetyFlags.$inferSelect;
export type NewSafetyFlag    = typeof safetyFlags.$inferInsert;
export type FlagReviewItem   = typeof flagReviewItems.$inferSelect;
export type NewFlagReviewItem = typeof flagReviewItems.$inferInsert;
