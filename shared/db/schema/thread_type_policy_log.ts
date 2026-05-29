import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

/**
 * Append-only audit log for thread-type policy classification decisions.
 *
 * One row is written for every thread creation attempt processed by the
 * classifyThreadType() policy engine — both allowed and blocked.
 * Rows are never deleted.
 *
 * This table is intentionally separate from messaging_policy_log (slice 1),
 * which records guardian-copy enforcement.  Together the two tables give a
 * complete audit trail:
 *
 *   messaging_policy_log      → "were the right guardians included?"
 *   thread_type_policy_log    → "was this a structurally safe thread type?"
 *
 * orgSettingsSnapshot
 * ───────────────────
 * The org's messaging settings at the time of the decision are stored inline
 * so that the outcome can be replayed and understood even if the org later
 * changes its policy configuration.
 */
export const threadTypePolicyLog = pgTable("thread_type_policy_log", {
  id:                     text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:                  text("org_id").notNull(),
  senderId:               text("sender_id").notNull(),
  threadId:               text("thread_id"),                 // null when blocked
  requestedType:          text("requested_type"),            // caller-supplied type (if any)
  classifiedType:         text("classified_type"),           // policy engine output
  senderRole:             text("sender_role").notNull(),
  hasMinorRecipients:     boolean("has_minor_recipients").notNull().default(false),
  hasGuardianRecipients:  boolean("has_guardian_recipients").notNull().default(false),
  isTeamThread:           boolean("is_team_thread").notNull().default(false),
  secondAdultPresent:     boolean("second_adult_present").notNull().default(false),
  allowed:                boolean("allowed").notNull().default(true),
  blockedReason:          text("blocked_reason"),
  blockedCode:            text("blocked_code"),
  badges:                 text("badges").array().notNull().default([]),
  orgSettingsSnapshot:    jsonb("org_settings_snapshot").notNull().default({}),
  createdAt:              timestamp("created_at").defaultNow().notNull(),
});

export type ThreadTypePolicyLog    = typeof threadTypePolicyLog.$inferSelect;
export type NewThreadTypePolicyLog = typeof threadTypePolicyLog.$inferInsert;
