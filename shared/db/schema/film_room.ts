// shared/db/schema/film_room.ts
// Film Room v2 — coach-created clip assignments. Mirrors migration 0018.
// Source film = existing film_sessions; players.id is text (nanoid).

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  bigint,
} from "drizzle-orm/pg-core";
import { filmSessions } from "./film_sessions";

export const clipStatusV2Enum = pgEnum("clip_status_v2", [
  "suggested", "draft", "approved", "assigned", "archived",
]);
export const clipAssignmentStatusEnum = pgEnum("clip_assignment_status", [
  "draft", "assigned", "opened", "watched", "responded", "completed", "archived",
]);

export const clips = pgTable(
  "clips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    sessionId: uuid("session_id").notNull().references(() => filmSessions.id, { onDelete: "cascade" }),
    createdBy: text("created_by").notNull(),
    source: text("source").notNull().default("coach"),
    status: clipStatusV2Enum("status").notNull().default("draft"),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
    title: text("title").notNull().default(""),
    note: text("note").notNull().default(""),
    noteSource: text("note_source").notNull().default("coach"),
    categories: text("categories").array().notNull().default([]),
    priority: text("priority").notNull().default("normal"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    duplicateOf: uuid("duplicate_of"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    bySessionTime: index("clips_session_time_idx").on(t.sessionId, t.startMs),
    byOrgStatus: index("clips_org_status_idx").on(t.orgId, t.status),
  }),
);

export const clipPlayers = pgTable(
  "clip_players",
  {
    clipId: uuid("clip_id").notNull().references(() => clips.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.clipId, t.playerId] }),
    byPlayer: index("clip_players_player_idx").on(t.playerId),
  }),
);

export const clipAssignments = pgTable(
  "clip_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    clipId: uuid("clip_id").notNull().references(() => clips.id, { onDelete: "cascade" }),
    assignedBy: text("assigned_by").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    priority: text("priority").notNull().default("normal"),
    requireResponse: boolean("require_response").notNull().default(true),
    responsePrompt: text("response_prompt"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    byOrgSent: index("clip_assignments_org_idx").on(t.orgId, t.sentAt),
  }),
);

export const clipAssignmentPlayers = pgTable(
  "clip_assignment_players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    assignmentId: uuid("assignment_id").notNull().references(() => clipAssignments.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull(),
    status: clipAssignmentStatusEnum("status").notNull().default("assigned"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    watchedAt: timestamp("watched_at", { withTimezone: true }),
    watchPct: smallint("watch_pct").notNull().default(0),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: text("completed_by"),
    reviewRequested: boolean("review_requested").notNull().default(false),
    nudgeCount: smallint("nudge_count").notNull().default(0),
    lastNudgedAt: timestamp("last_nudged_at", { withTimezone: true }),
    archivedReason: text("archived_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("cap_assignment_player_unique").on(t.assignmentId, t.playerId),
    byOrgStatus: index("cap_org_status_idx").on(t.orgId, t.status),
    byPlayerState: index("cap_player_state_idx").on(t.playerId, t.status),
  }),
);

export const playerReviews = pgTable(
  "player_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    assignmentPlayerId: uuid("assignment_player_id").notNull()
      .references(() => clipAssignmentPlayers.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull(),
    kind: text("kind").notNull(),
    textBody: text("text_body"),
    choiceIndex: smallint("choice_index"),
    confidence: smallint("confidence"),
    clientCreatedAt: timestamp("client_created_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byAp: index("player_reviews_ap_idx").on(t.assignmentPlayerId, t.createdAt),
  }),
);

export const coachFollowups = pgTable(
  "coach_followups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    assignmentPlayerId: uuid("assignment_player_id").notNull()
      .references(() => clipAssignmentPlayers.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").notNull(),
    kind: text("kind").notNull(),
    body: text("body"),
    meta: jsonb("meta").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byAp: index("coach_followups_ap_idx").on(t.assignmentPlayerId, t.createdAt),
  }),
);

export const clipIdpLinks = pgTable(
  "clip_idp_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    clipId: uuid("clip_id").notNull().references(() => clips.id),
    assignmentPlayerId: uuid("assignment_player_id").references(() => clipAssignmentPlayers.id),
    playerId: text("player_id").notNull(),
    focusArea: text("focus_area").notNull(),
    note: text("note"),
    escalatedBy: text("escalated_by").notNull(),
    source: text("source").notNull().default("coach"),
    unlinkedAt: timestamp("unlinked_at", { withTimezone: true }),
    unlinkReason: text("unlink_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byPlayer: index("clip_idp_links_player_idx").on(t.playerId),
  }),
);

export const filmAuditEvents = pgTable(
  "film_audit_events",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    orgId: text("org_id").notNull(),
    actorId: text("actor_id"),
    actorKind: text("actor_kind").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    detail: jsonb("detail").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byEntity: index("film_audit_entity_idx").on(t.entityType, t.entityId, t.createdAt),
  }),
);

export type Clip = typeof clips.$inferSelect;
export type ClipAssignment = typeof clipAssignments.$inferSelect;
export type ClipAssignmentPlayer = typeof clipAssignmentPlayers.$inferSelect;
export type PlayerReview = typeof playerReviews.$inferSelect;
export type CoachFollowup = typeof coachFollowups.$inferSelect;
export type ClipIdpLink = typeof clipIdpLinks.$inferSelect;
