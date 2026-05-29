import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

/**
 * Append-only audit log for Layer 3 quiet-hours policy decisions.
 *
 * One row per enforcement evaluation — written before the message is
 * delivered (or queued), and always written regardless of outcome.
 *
 * action_taken values
 * ────────────────────
 *   skipped        Policy does not apply (non-staff sender or no minors)
 *   allowed        Within the allowed window; message sent immediately
 *   queued         Outside window; message stored with scheduled_at set
 *   emergency_send Outside window but override accepted; sent immediately
 *
 * Emergency override details (reason + note) are stored here only — not
 * on the messages table — so that the message surface stays clean and
 * audit data is independently queryable.
 */
export const quietHoursLog = pgTable("quiet_hours_log", {
  id:                  text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:               text("org_id").notNull(),
  senderId:            text("sender_id").notNull(),
  threadId:            text("thread_id"),
  messageId:           text("message_id"),
  attemptedAt:         timestamp("attempted_at", { withTimezone: true }).notNull(),
  /** Human-readable local time in the org's timezone, e.g. "22:14 CST" */
  localOrgTime:        text("local_org_time").notNull(),
  /** Policy window string, e.g. "05:00–21:00" */
  policyWindow:        text("policy_window").notNull(),
  orgTimezone:         text("org_timezone").notNull(),
  actionTaken:         text("action_taken").notNull(),
  scheduledAt:         timestamp("scheduled_at", { withTimezone: true }),
  emergencyReason:     text("emergency_reason"),
  emergencyNote:       text("emergency_note"),
  hasMinorRecipients:  boolean("has_minor_recipients").notNull().default(false),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
});

export type QuietHoursLog    = typeof quietHoursLog.$inferSelect;
export type NewQuietHoursLog = typeof quietHoursLog.$inferInsert;
