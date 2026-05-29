import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

/**
 * Human-authored compliance incident report.
 *
 * Any org member can file a safety_incident against a message, thread, user,
 * or a general athlete-welfare concern.  Unlike safety_flags (auto-generated
 * by the rule engine), these are deliberate reports that follow a formal
 * review workflow with an external-escalation path.
 *
 * subject_type     One of: message | thread | user | athlete_concern
 * subject_id       ID of the referenced object; null for athlete_concern or
 *                  when the reporter cannot identify a specific object.
 *
 * category         inappropriate_contact | policy_violation | grooming_concern
 *                  | harassment | boundary_violation | other
 *
 * evidence_snapshot  Optional supporting detail supplied at report time:
 *                    message body snapshots, matched rule references, etc.
 *
 * status lifecycle
 * ────────────────
 *   open               Submitted, awaiting admin review
 *   under_review       Admin has taken ownership; investigation in progress
 *   resolved           Closed internally; resolution_note should be present
 *   escalated_external Reported to an external body (governing org, authorities)
 */
export const safetyIncidents = pgTable("safety_incidents", {
  id:                text("id").primaryKey().$defaultFn(() => nanoid()),
  orgId:             text("org_id").notNull(),
  reporterId:        text("reporter_id").notNull(),
  reporterRole:      text("reporter_role").notNull(),
  subjectType:       text("subject_type").notNull(),
  subjectId:         text("subject_id"),
  category:          text("category").notNull(),
  severity:          text("severity").notNull().default("medium"),
  notes:             text("notes").notNull(),
  evidenceSnapshot:  jsonb("evidence_snapshot").notNull().default({}),
  status:            text("status").notNull().default("open"),
  resolvedBy:        text("resolved_by"),
  resolutionNote:    text("resolution_note"),
  resolvedAt:        timestamp("resolved_at", { withTimezone: true }),
  createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SafetyIncident    = typeof safetyIncidents.$inferSelect;
export type NewSafetyIncident = typeof safetyIncidents.$inferInsert;
