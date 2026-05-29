import { pgEnum, pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const threadTypeEnum = pgEnum("thread_type", [
  // ── Legacy types (pre-safety-policy) ────────────────────────────────────────
  // Kept for backward compatibility with existing threads.
  // New threads created by coaches/staff will use the approved types below.
  "broadcast",
  "dm",
  "parent_dm",
  "staff",
  // ── Policy-approved types (slice 2 / 0014_thread_type_policy migration) ─────
  // Each type carries explicit semantics about who is copied and why.
  // The server enforces that the correct type is selected based on the
  // participants and the org's messaging settings.
  "coach_to_parent",               // staff → guardian(s) only; no player recipient
  "coach_to_minor_with_guardian",  // staff → 1 minor + guardian(s)
  "coach_to_team_with_adult_copy", // staff → team (includes minors) + guardian(s)
  "staff_internal",                // staff → staff only; no athletes or guardians
]);

export const audienceModeEnum = pgEnum("audience_mode", [
  "players",
  "parents",
  "both",
  "individuals",
]);

export const recipientTypeEnum = pgEnum("recipient_type", [
  "player",
  "guardian",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
  "opted_out",
]);

export const messageThreads = pgTable("message_threads", {
  id:                     text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:                  text("org_id").notNull(),
  type:                   threadTypeEnum("type").notNull(),
  audienceMode:           audienceModeEnum("audience_mode"),
  title:                  text("title"),
  participantIds:         text("participant_ids").array().notNull().default([]),
  resolvedRecipientCount: integer("resolved_recipient_count").notNull().default(0),
  createdByUserId:        text("created_by_user_id").notNull(),
  lastMessageAt:          timestamp("last_message_at"),
  createdAt:              timestamp("created_at").defaultNow().notNull(),
  deletedAt:              timestamp("deleted_at"),
});

export const messages = pgTable("messages", {
  id:           text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:        text("org_id").notNull(),
  threadId:     text("thread_id").notNull(),
  senderUserId: text("sender_user_id").notNull(),
  body:         text("body").notNull(),
  readBy:       text("read_by").array().notNull().default([]),
  sentAt:       timestamp("sent_at").defaultNow().notNull(),
  /**
   * Quiet-hours queue marker (Layer 3).  When set, this message has been
   * stored in the DB but not yet delivered.  The Inngest quiet-hours release
   * function fires SMS / push notifications when scheduled_at <= now().
   * Null for immediately-delivered messages.
   */
  scheduledAt:  timestamp("scheduled_at", { withTimezone: true }),
  deletedAt:    timestamp("deleted_at"),
});

/**
 * One row per recipient per message.
 * Enables per-contact read state, SMS delivery tracking, and audit trail.
 * guardianId is null for player recipients.
 */
export const messageRecipients = pgTable("message_recipients", {
  id:             text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:          text("org_id").notNull(),
  threadId:       text("thread_id").notNull(),
  messageId:      text("message_id").notNull(),
  recipientType:  recipientTypeEnum("recipient_type").notNull(),
  playerId:       text("player_id").notNull(),
  guardianId:     text("guardian_id"),              // null for player recipients
  userId:         text("user_id"),                  // Clerk userId if they have an account
  contactEmail:   text("contact_email"),
  contactPhone:   text("contact_phone"),
  deliveryStatus: deliveryStatusEnum("delivery_status").notNull().default("pending"),
  readAt:         timestamp("read_at"),
  smsDeliveredAt: timestamp("sms_delivered_at"),
  smsStatus:      text("sms_status"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

export type MessageThread    = typeof messageThreads.$inferSelect;
export type NewMessageThread = typeof messageThreads.$inferInsert;
export type Message          = typeof messages.$inferSelect;
export type NewMessage       = typeof messages.$inferInsert;
export type MessageRecipient    = typeof messageRecipients.$inferSelect;
export type NewMessageRecipient = typeof messageRecipients.$inferInsert;
