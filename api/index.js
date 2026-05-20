"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc15) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc15 = __getOwnPropDesc(from, key)) || desc15.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/db/schema/_enums.ts
var import_pg_core, orgPlanEnum, orgRoleEnum, filmSessionStatusEnum, filmSessionKindEnum, filmAssetKindEnum, filmAssetStatusEnum, analysisJobKindEnum, analysisJobStatusEnum, annotationSourceEnum, annotationKindEnum, subscriptionStatusEnum;
var init_enums = __esm({
  "shared/db/schema/_enums.ts"() {
    "use strict";
    import_pg_core = require("drizzle-orm/pg-core");
    orgPlanEnum = (0, import_pg_core.pgEnum)("org_plan", [
      "free",
      "team",
      "club",
      "enterprise"
    ]);
    orgRoleEnum = (0, import_pg_core.pgEnum)("org_role", [
      "owner",
      "admin",
      "coach",
      "analyst",
      "player",
      "viewer"
    ]);
    filmSessionStatusEnum = (0, import_pg_core.pgEnum)("film_session_status", [
      "draft",
      "uploading",
      "queued",
      "processing",
      "ready",
      "failed",
      "archived"
    ]);
    filmSessionKindEnum = (0, import_pg_core.pgEnum)("film_session_kind", [
      "game",
      "practice",
      "scrimmage",
      "workout",
      "scout",
      "other"
    ]);
    filmAssetKindEnum = (0, import_pg_core.pgEnum)("film_asset_kind", [
      "source",
      "hls",
      "mp4_720p",
      "mp4_1080p",
      "thumbnail",
      "sprite",
      "caption"
    ]);
    filmAssetStatusEnum = (0, import_pg_core.pgEnum)("film_asset_status", [
      "pending",
      "uploading",
      "stored",
      "transcoding",
      "ready",
      "failed"
    ]);
    analysisJobKindEnum = (0, import_pg_core.pgEnum)("analysis_job_kind", [
      "ingest",
      "transcode",
      "shot_chart",
      "play_breakdown",
      "player_tracking",
      "highlight_reel",
      "scouting_report"
    ]);
    analysisJobStatusEnum = (0, import_pg_core.pgEnum)("analysis_job_status", [
      "queued",
      "running",
      "succeeded",
      "failed",
      "cancelled",
      "retrying"
    ]);
    annotationSourceEnum = (0, import_pg_core.pgEnum)("annotation_source", [
      "coach",
      "ai",
      "player",
      "import"
    ]);
    annotationKindEnum = (0, import_pg_core.pgEnum)("annotation_kind", [
      "note",
      "tag",
      "play",
      "possession",
      "shot",
      "foul",
      "highlight",
      "telestration"
    ]);
    subscriptionStatusEnum = (0, import_pg_core.pgEnum)("subscription_status", [
      "trialing",
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "paused"
    ]);
  }
});

// shared/db/schema/orgs.ts
var import_pg_core2, orgs, orgMembers;
var init_orgs = __esm({
  "shared/db/schema/orgs.ts"() {
    "use strict";
    import_pg_core2 = require("drizzle-orm/pg-core");
    init_enums();
    orgs = (0, import_pg_core2.pgTable)(
      "orgs",
      {
        id: (0, import_pg_core2.uuid)("id").primaryKey().defaultRandom(),
        slug: (0, import_pg_core2.text)("slug").notNull(),
        name: (0, import_pg_core2.text)("name").notNull(),
        plan: orgPlanEnum("plan").notNull().default("free"),
        // Stripe customer id, set by PR 6.
        stripeCustomerId: (0, import_pg_core2.text)("stripe_customer_id"),
        payload: (0, import_pg_core2.jsonb)("payload").notNull().default({}),
        createdAt: (0, import_pg_core2.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core2.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core2.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        slugUnique: (0, import_pg_core2.uniqueIndex)("orgs_slug_unique").on(t.slug)
      })
    );
    orgMembers = (0, import_pg_core2.pgTable)(
      "org_members",
      {
        id: (0, import_pg_core2.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core2.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        // userId is sourced from the auth provider (Clerk/Supabase). Kept as text
        // so we are not coupled to a specific auth schema in this package.
        userId: (0, import_pg_core2.text)("user_id").notNull(),
        role: orgRoleEnum("role").notNull().default("viewer"),
        payload: (0, import_pg_core2.jsonb)("payload").notNull().default({}),
        createdAt: (0, import_pg_core2.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core2.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core2.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        orgUserUnique: (0, import_pg_core2.uniqueIndex)("org_members_org_user_unique").on(
          t.orgId,
          t.userId
        ),
        byUser: (0, import_pg_core2.index)("org_members_user_idx").on(t.userId)
      })
    );
  }
});

// shared/db/schema/film_sessions.ts
var import_pg_core3, filmSessions;
var init_film_sessions = __esm({
  "shared/db/schema/film_sessions.ts"() {
    "use strict";
    import_pg_core3 = require("drizzle-orm/pg-core");
    init_orgs();
    init_enums();
    filmSessions = (0, import_pg_core3.pgTable)(
      "film_sessions",
      {
        id: (0, import_pg_core3.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core3.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        createdByUserId: (0, import_pg_core3.text)("created_by_user_id").notNull(),
        title: (0, import_pg_core3.text)("title").notNull(),
        description: (0, import_pg_core3.text)("description"),
        kind: filmSessionKindEnum("kind").notNull().default("game"),
        status: filmSessionStatusEnum("status").notNull().default("draft"),
        // Optional context for game/scout sessions.
        opponent: (0, import_pg_core3.text)("opponent"),
        homeAway: (0, import_pg_core3.text)("home_away"),
        // "home" | "away" | "neutral"
        season: (0, import_pg_core3.text)("season"),
        playedAt: (0, import_pg_core3.timestamp)("played_at", { withTimezone: true }),
        // Cached duration of the primary asset, filled in by the transcode job.
        durationSeconds: (0, import_pg_core3.integer)("duration_seconds"),
        payload: (0, import_pg_core3.jsonb)("payload").notNull().default({}),
        createdAt: (0, import_pg_core3.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core3.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core3.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        byOrg: (0, import_pg_core3.index)("film_sessions_org_idx").on(t.orgId),
        byOrgStatus: (0, import_pg_core3.index)("film_sessions_org_status_idx").on(t.orgId, t.status),
        byOrgPlayedAt: (0, import_pg_core3.index)("film_sessions_org_played_at_idx").on(
          t.orgId,
          t.playedAt
        )
      })
    );
  }
});

// shared/db/schema/film_assets.ts
var import_pg_core4, filmAssets;
var init_film_assets = __esm({
  "shared/db/schema/film_assets.ts"() {
    "use strict";
    import_pg_core4 = require("drizzle-orm/pg-core");
    init_orgs();
    init_film_sessions();
    init_enums();
    filmAssets = (0, import_pg_core4.pgTable)(
      "film_assets",
      {
        id: (0, import_pg_core4.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core4.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        sessionId: (0, import_pg_core4.uuid)("session_id").notNull().references(() => filmSessions.id, { onDelete: "cascade" }),
        kind: filmAssetKindEnum("kind").notNull(),
        status: filmAssetStatusEnum("status").notNull().default("pending"),
        // Provider-agnostic storage pointers. For S3 we set storageProvider="s3"
        // and storageKey to the object key. For Mux we store the asset id in
        // providerId and the playback id in playbackId.
        storageProvider: (0, import_pg_core4.text)("storage_provider"),
        // "s3" | "mux" | "r2"
        storageBucket: (0, import_pg_core4.text)("storage_bucket"),
        storageKey: (0, import_pg_core4.text)("storage_key"),
        providerId: (0, import_pg_core4.text)("provider_id"),
        playbackId: (0, import_pg_core4.text)("playback_id"),
        // Media metadata (filled in once known).
        mimeType: (0, import_pg_core4.text)("mime_type"),
        sizeBytes: (0, import_pg_core4.bigint)("size_bytes", { mode: "number" }),
        durationSeconds: (0, import_pg_core4.integer)("duration_seconds"),
        width: (0, import_pg_core4.integer)("width"),
        height: (0, import_pg_core4.integer)("height"),
        checksumSha256: (0, import_pg_core4.text)("checksum_sha256"),
        payload: (0, import_pg_core4.jsonb)("payload").notNull().default({}),
        createdAt: (0, import_pg_core4.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core4.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core4.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        bySession: (0, import_pg_core4.index)("film_assets_session_idx").on(t.sessionId),
        bySessionKind: (0, import_pg_core4.index)("film_assets_session_kind_idx").on(
          t.sessionId,
          t.kind
        ),
        byOrgStatus: (0, import_pg_core4.index)("film_assets_org_status_idx").on(t.orgId, t.status)
      })
    );
  }
});

// shared/db/schema/analysis_jobs.ts
var import_pg_core5, analysisJobs;
var init_analysis_jobs = __esm({
  "shared/db/schema/analysis_jobs.ts"() {
    "use strict";
    import_pg_core5 = require("drizzle-orm/pg-core");
    init_orgs();
    init_film_sessions();
    init_enums();
    analysisJobs = (0, import_pg_core5.pgTable)(
      "analysis_jobs",
      {
        id: (0, import_pg_core5.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core5.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        sessionId: (0, import_pg_core5.uuid)("session_id").notNull().references(() => filmSessions.id, { onDelete: "cascade" }),
        kind: analysisJobKindEnum("kind").notNull(),
        status: analysisJobStatusEnum("status").notNull().default("queued"),
        // Inngest run id and event id, so we can deep-link from the dashboard.
        inngestRunId: (0, import_pg_core5.text)("inngest_run_id"),
        inngestEventId: (0, import_pg_core5.text)("inngest_event_id"),
        attempts: (0, import_pg_core5.integer)("attempts").notNull().default(0),
        maxAttempts: (0, import_pg_core5.integer)("max_attempts").notNull().default(5),
        lastError: (0, import_pg_core5.text)("last_error"),
        startedAt: (0, import_pg_core5.timestamp)("started_at", { withTimezone: true }),
        finishedAt: (0, import_pg_core5.timestamp)("finished_at", { withTimezone: true }),
        // Pipeline output (shot chart json, play breakdown, etc.).
        result: (0, import_pg_core5.jsonb)("result"),
        payload: (0, import_pg_core5.jsonb)("payload").notNull().default({}),
        createdAt: (0, import_pg_core5.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core5.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core5.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        bySession: (0, import_pg_core5.index)("analysis_jobs_session_idx").on(t.sessionId),
        bySessionKind: (0, import_pg_core5.index)("analysis_jobs_session_kind_idx").on(
          t.sessionId,
          t.kind
        ),
        byOrgStatus: (0, import_pg_core5.index)("analysis_jobs_org_status_idx").on(t.orgId, t.status)
      })
    );
  }
});

// shared/db/schema/annotations.ts
var import_pg_core6, annotations;
var init_annotations = __esm({
  "shared/db/schema/annotations.ts"() {
    "use strict";
    import_pg_core6 = require("drizzle-orm/pg-core");
    init_orgs();
    init_film_sessions();
    init_analysis_jobs();
    init_enums();
    annotations = (0, import_pg_core6.pgTable)(
      "annotations",
      {
        id: (0, import_pg_core6.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core6.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        sessionId: (0, import_pg_core6.uuid)("session_id").notNull().references(() => filmSessions.id, { onDelete: "cascade" }),
        jobId: (0, import_pg_core6.uuid)("job_id").references(() => analysisJobs.id, {
          onDelete: "set null"
        }),
        kind: annotationKindEnum("kind").notNull(),
        source: annotationSourceEnum("source").notNull().default("coach"),
        authorUserId: (0, import_pg_core6.text)("author_user_id"),
        // Time range on the master timeline, in milliseconds.
        startMs: (0, import_pg_core6.integer)("start_ms").notNull(),
        endMs: (0, import_pg_core6.integer)("end_ms"),
        label: (0, import_pg_core6.text)("label"),
        body: (0, import_pg_core6.text)("body"),
        // Free-form structured data: shot coords, player ids, play tags, etc.
        data: (0, import_pg_core6.jsonb)("data").notNull().default({}),
        payload: (0, import_pg_core6.jsonb)("payload").notNull().default({}),
        createdAt: (0, import_pg_core6.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core6.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core6.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        bySession: (0, import_pg_core6.index)("annotations_session_idx").on(t.sessionId),
        bySessionTime: (0, import_pg_core6.index)("annotations_session_time_idx").on(
          t.sessionId,
          t.startMs
        ),
        bySessionKind: (0, import_pg_core6.index)("annotations_session_kind_idx").on(
          t.sessionId,
          t.kind
        )
      })
    );
  }
});

// shared/db/schema/players.ts
var import_pg_core7, import_nanoid, playerStatusEnum, players;
var init_players = __esm({
  "shared/db/schema/players.ts"() {
    "use strict";
    import_pg_core7 = require("drizzle-orm/pg-core");
    import_nanoid = require("nanoid");
    playerStatusEnum = (0, import_pg_core7.pgEnum)("player_status", ["active", "injured", "suspended", "inactive"]);
    players = (0, import_pg_core7.pgTable)("players", {
      id: (0, import_pg_core7.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid.nanoid)()),
      orgId: (0, import_pg_core7.text)("org_id").notNull(),
      userId: (0, import_pg_core7.text)("user_id"),
      // Clerk user ID — nullable until player claims account
      name: (0, import_pg_core7.text)("name").notNull(),
      position: (0, import_pg_core7.text)("position"),
      // PG | SG | SF | PF | C
      jerseyNumber: (0, import_pg_core7.integer)("jersey_number"),
      grade: (0, import_pg_core7.text)("grade"),
      // "10" | "11" | "12" | "Fr" | "So" | etc.
      gradYear: (0, import_pg_core7.integer)("grad_year"),
      height: (0, import_pg_core7.text)("height"),
      // "6'1\""
      weight: (0, import_pg_core7.integer)("weight"),
      handedness: (0, import_pg_core7.text)("handedness").default("right"),
      status: playerStatusEnum("status").notNull().default("active"),
      role: (0, import_pg_core7.text)("role").default("player"),
      // starter | reserve | developmental
      parentGuardianName: (0, import_pg_core7.text)("parent_guardian_name"),
      parentGuardianEmail: (0, import_pg_core7.text)("parent_guardian_email"),
      parentGuardianPhone: (0, import_pg_core7.text)("parent_guardian_phone"),
      medicalNotes: (0, import_pg_core7.text)("medical_notes"),
      // Extended profile fields
      phone: (0, import_pg_core7.text)("phone"),
      email: (0, import_pg_core7.text)("email"),
      bio: (0, import_pg_core7.text)("bio"),
      recruitingStatus: (0, import_pg_core7.text)("recruiting_status"),
      // "D1 Interest" | "D2 Target" | etc.
      academicNotes: (0, import_pg_core7.text)("academic_notes"),
      yearsPlaying: (0, import_pg_core7.integer)("years_playing"),
      createdByUserId: (0, import_pg_core7.text)("created_by_user_id"),
      createdAt: (0, import_pg_core7.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core7.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core7.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/events.ts
var import_pg_core8, import_nanoid2, eventTypeEnum, eventStatusEnum, availabilityResponseEnum, attendanceStatusEnum, events, eventAvailability, eventAttendance;
var init_events = __esm({
  "shared/db/schema/events.ts"() {
    "use strict";
    import_pg_core8 = require("drizzle-orm/pg-core");
    import_nanoid2 = require("nanoid");
    eventTypeEnum = (0, import_pg_core8.pgEnum)("event_type", ["practice", "game", "scrimmage", "film_session", "optional", "tournament", "team_meal"]);
    eventStatusEnum = (0, import_pg_core8.pgEnum)("event_status", ["scheduled", "in_progress", "completed", "cancelled"]);
    availabilityResponseEnum = (0, import_pg_core8.pgEnum)("availability_response", ["yes", "no", "maybe"]);
    attendanceStatusEnum = (0, import_pg_core8.pgEnum)("attendance_status", ["present", "absent", "late", "excused"]);
    events = (0, import_pg_core8.pgTable)("events", {
      id: (0, import_pg_core8.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid2.nanoid)()),
      orgId: (0, import_pg_core8.text)("org_id").notNull(),
      title: (0, import_pg_core8.text)("title").notNull(),
      type: eventTypeEnum("type").notNull().default("practice"),
      status: eventStatusEnum("status").notNull().default("scheduled"),
      startsAt: (0, import_pg_core8.timestamp)("starts_at").notNull(),
      endsAt: (0, import_pg_core8.timestamp)("ends_at"),
      location: (0, import_pg_core8.text)("location"),
      homeAway: (0, import_pg_core8.text)("home_away"),
      // "home" | "away" | "neutral"
      opponent: (0, import_pg_core8.text)("opponent"),
      notes: (0, import_pg_core8.text)("notes"),
      availabilityDeadline: (0, import_pg_core8.timestamp)("availability_deadline"),
      filmSessionId: (0, import_pg_core8.text)("film_session_id"),
      practicePlanId: (0, import_pg_core8.text)("practice_plan_id"),
      createdByUserId: (0, import_pg_core8.text)("created_by_user_id").notNull(),
      createdAt: (0, import_pg_core8.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core8.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core8.timestamp)("deleted_at")
    });
    eventAvailability = (0, import_pg_core8.pgTable)("event_availability", {
      id: (0, import_pg_core8.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid2.nanoid)()),
      eventId: (0, import_pg_core8.text)("event_id").notNull(),
      playerId: (0, import_pg_core8.text)("player_id").notNull(),
      orgId: (0, import_pg_core8.text)("org_id").notNull(),
      response: availabilityResponseEnum("response").notNull(),
      note: (0, import_pg_core8.text)("note"),
      respondedAt: (0, import_pg_core8.timestamp)("responded_at").defaultNow().notNull()
    });
    eventAttendance = (0, import_pg_core8.pgTable)("event_attendance", {
      id: (0, import_pg_core8.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid2.nanoid)()),
      eventId: (0, import_pg_core8.text)("event_id").notNull(),
      playerId: (0, import_pg_core8.text)("player_id").notNull(),
      orgId: (0, import_pg_core8.text)("org_id").notNull(),
      status: attendanceStatusEnum("status").notNull(),
      note: (0, import_pg_core8.text)("note"),
      recordedByUserId: (0, import_pg_core8.text)("recorded_by_user_id").notNull(),
      recordedAt: (0, import_pg_core8.timestamp)("recorded_at").defaultNow().notNull()
    });
  }
});

// shared/db/schema/assignments.ts
var import_pg_core9, import_nanoid3, assignmentStatusEnum, assignments;
var init_assignments = __esm({
  "shared/db/schema/assignments.ts"() {
    "use strict";
    import_pg_core9 = require("drizzle-orm/pg-core");
    import_nanoid3 = require("nanoid");
    assignmentStatusEnum = (0, import_pg_core9.pgEnum)("assignment_status", ["draft", "assigned", "in_progress", "submitted", "reviewed", "overdue"]);
    assignments = (0, import_pg_core9.pgTable)("assignments", {
      id: (0, import_pg_core9.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid3.nanoid)()),
      orgId: (0, import_pg_core9.text)("org_id").notNull(),
      title: (0, import_pg_core9.text)("title").notNull(),
      description: (0, import_pg_core9.text)("description"),
      status: assignmentStatusEnum("status").notNull().default("assigned"),
      dueAt: (0, import_pg_core9.timestamp)("due_at"),
      createdByUserId: (0, import_pg_core9.text)("created_by_user_id").notNull(),
      playerId: (0, import_pg_core9.text)("player_id"),
      filmClipId: (0, import_pg_core9.text)("film_clip_id"),
      // annotation id from annotations table
      practicePlanId: (0, import_pg_core9.text)("practice_plan_id"),
      idpFocusAreaId: (0, import_pg_core9.text)("idp_focus_area_id"),
      submittedAt: (0, import_pg_core9.timestamp)("submitted_at"),
      reviewedAt: (0, import_pg_core9.timestamp)("reviewed_at"),
      reviewedByUserId: (0, import_pg_core9.text)("reviewed_by_user_id"),
      payload: (0, import_pg_core9.jsonb)("payload"),
      // { drills, reps, notes, submissionData }
      createdAt: (0, import_pg_core9.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core9.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core9.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/practice_plans.ts
var import_pg_core10, import_nanoid4, practicePlanStatusEnum, practicePlans;
var init_practice_plans = __esm({
  "shared/db/schema/practice_plans.ts"() {
    "use strict";
    import_pg_core10 = require("drizzle-orm/pg-core");
    import_nanoid4 = require("nanoid");
    practicePlanStatusEnum = (0, import_pg_core10.pgEnum)("practice_plan_status", ["draft", "published", "completed", "archived"]);
    practicePlans = (0, import_pg_core10.pgTable)("practice_plans", {
      id: (0, import_pg_core10.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid4.nanoid)()),
      orgId: (0, import_pg_core10.text)("org_id").notNull(),
      title: (0, import_pg_core10.text)("title").notNull(),
      scheduledAt: (0, import_pg_core10.timestamp)("scheduled_at"),
      status: practicePlanStatusEnum("status").notNull().default("draft"),
      location: (0, import_pg_core10.text)("location"),
      durationMins: (0, import_pg_core10.integer)("duration_mins"),
      // planned duration
      actualDurationMins: (0, import_pg_core10.integer)("actual_duration_mins"),
      // filled post-practice
      payload: (0, import_pg_core10.jsonb)("payload"),
      // full plan blocks/drills (Zustand shape)
      coachNotes: (0, import_pg_core10.text)("coach_notes"),
      postPracticeNotes: (0, import_pg_core10.text)("post_practice_notes"),
      // Outcome-driven metadata (Prompt 8 phase 2 upgrade)
      objectives: (0, import_pg_core10.jsonb)("objectives"),
      // PracticeObjective[]
      targetGroup: (0, import_pg_core10.jsonb)("target_group"),
      // PracticeTargetGroup
      skillEmphasis: (0, import_pg_core10.jsonb)("skill_emphasis"),
      // Record<categoryId, weight 0–100>
      plannedIntensity: (0, import_pg_core10.text)("planned_intensity"),
      // "RECOVERY"|"MODERATE"|"HIGH"|"MAX"
      opponentName: (0, import_pg_core10.text)("opponent_name"),
      // game-prep context
      linkedEventId: (0, import_pg_core10.text)("linked_event_id"),
      // events.id
      // Post-practice structured reflection
      reflection: (0, import_pg_core10.jsonb)("reflection"),
      // PracticeReflection (whatWorked, drillFeedback…)
      followUpActionIds: (0, import_pg_core10.jsonb)("follow_up_action_ids"),
      // string[] coaching_actions.id
      createdByUserId: (0, import_pg_core10.text)("created_by_user_id").notNull(),
      createdAt: (0, import_pg_core10.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core10.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core10.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/idps.ts
var import_pg_core11, import_nanoid5, idpStatusEnum, idps;
var init_idps = __esm({
  "shared/db/schema/idps.ts"() {
    "use strict";
    import_pg_core11 = require("drizzle-orm/pg-core");
    import_nanoid5 = require("nanoid");
    idpStatusEnum = (0, import_pg_core11.pgEnum)("idp_status", ["active", "paused", "completed", "archived"]);
    idps = (0, import_pg_core11.pgTable)("idps", {
      id: (0, import_pg_core11.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid5.nanoid)()),
      orgId: (0, import_pg_core11.text)("org_id").notNull(),
      playerId: (0, import_pg_core11.text)("player_id").notNull(),
      season: (0, import_pg_core11.text)("season").notNull(),
      // "2024-25"
      status: idpStatusEnum("status").notNull().default("active"),
      coachId: (0, import_pg_core11.text)("coach_id").notNull(),
      payload: (0, import_pg_core11.jsonb)("payload"),
      // focus areas, goals, training load, milestones
      aiRecommendations: (0, import_pg_core11.jsonb)("ai_recommendations").default([]),
      createdAt: (0, import_pg_core11.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core11.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core11.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/readiness.ts
var import_pg_core12, import_nanoid6, readinessCheckins;
var init_readiness = __esm({
  "shared/db/schema/readiness.ts"() {
    "use strict";
    import_pg_core12 = require("drizzle-orm/pg-core");
    import_nanoid6 = require("nanoid");
    readinessCheckins = (0, import_pg_core12.pgTable)("readiness_checkins", {
      id: (0, import_pg_core12.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid6.nanoid)()),
      orgId: (0, import_pg_core12.text)("org_id").notNull(),
      playerId: (0, import_pg_core12.text)("player_id").notNull(),
      fatigue: (0, import_pg_core12.integer)("fatigue").notNull(),
      // 1–10
      sleep: (0, import_pg_core12.integer)("sleep").notNull(),
      // hours
      soreness: (0, import_pg_core12.integer)("soreness").notNull(),
      // 1–10
      mood: (0, import_pg_core12.integer)("mood"),
      // 1–10, optional
      note: (0, import_pg_core12.text)("note"),
      flagged: (0, import_pg_core12.boolean)("flagged").notNull().default(false),
      checkedInAt: (0, import_pg_core12.timestamp)("checked_in_at").defaultNow().notNull(),
      createdAt: (0, import_pg_core12.timestamp)("created_at").defaultNow().notNull()
    });
  }
});

// shared/db/schema/messages.ts
var import_pg_core13, import_nanoid7, threadTypeEnum, audienceModeEnum, recipientTypeEnum, deliveryStatusEnum, messageThreads, messages, messageRecipients;
var init_messages = __esm({
  "shared/db/schema/messages.ts"() {
    "use strict";
    import_pg_core13 = require("drizzle-orm/pg-core");
    import_nanoid7 = require("nanoid");
    threadTypeEnum = (0, import_pg_core13.pgEnum)("thread_type", [
      "broadcast",
      "dm",
      "parent_dm",
      "staff"
    ]);
    audienceModeEnum = (0, import_pg_core13.pgEnum)("audience_mode", [
      "players",
      "parents",
      "both",
      "individuals"
    ]);
    recipientTypeEnum = (0, import_pg_core13.pgEnum)("recipient_type", [
      "player",
      "guardian"
    ]);
    deliveryStatusEnum = (0, import_pg_core13.pgEnum)("delivery_status", [
      "pending",
      "sent",
      "delivered",
      "failed",
      "opted_out"
    ]);
    messageThreads = (0, import_pg_core13.pgTable)("message_threads", {
      id: (0, import_pg_core13.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid7.nanoid)()),
      orgId: (0, import_pg_core13.text)("org_id").notNull(),
      type: threadTypeEnum("type").notNull(),
      audienceMode: audienceModeEnum("audience_mode"),
      title: (0, import_pg_core13.text)("title"),
      participantIds: (0, import_pg_core13.text)("participant_ids").array().notNull().default([]),
      resolvedRecipientCount: (0, import_pg_core13.integer)("resolved_recipient_count").notNull().default(0),
      createdByUserId: (0, import_pg_core13.text)("created_by_user_id").notNull(),
      lastMessageAt: (0, import_pg_core13.timestamp)("last_message_at"),
      createdAt: (0, import_pg_core13.timestamp)("created_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core13.timestamp)("deleted_at")
    });
    messages = (0, import_pg_core13.pgTable)("messages", {
      id: (0, import_pg_core13.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid7.nanoid)()),
      orgId: (0, import_pg_core13.text)("org_id").notNull(),
      threadId: (0, import_pg_core13.text)("thread_id").notNull(),
      senderUserId: (0, import_pg_core13.text)("sender_user_id").notNull(),
      body: (0, import_pg_core13.text)("body").notNull(),
      readBy: (0, import_pg_core13.text)("read_by").array().notNull().default([]),
      sentAt: (0, import_pg_core13.timestamp)("sent_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core13.timestamp)("deleted_at")
    });
    messageRecipients = (0, import_pg_core13.pgTable)("message_recipients", {
      id: (0, import_pg_core13.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid7.nanoid)()),
      orgId: (0, import_pg_core13.text)("org_id").notNull(),
      threadId: (0, import_pg_core13.text)("thread_id").notNull(),
      messageId: (0, import_pg_core13.text)("message_id").notNull(),
      recipientType: recipientTypeEnum("recipient_type").notNull(),
      playerId: (0, import_pg_core13.text)("player_id").notNull(),
      guardianId: (0, import_pg_core13.text)("guardian_id"),
      // null for player recipients
      userId: (0, import_pg_core13.text)("user_id"),
      // Clerk userId if they have an account
      contactEmail: (0, import_pg_core13.text)("contact_email"),
      contactPhone: (0, import_pg_core13.text)("contact_phone"),
      deliveryStatus: deliveryStatusEnum("delivery_status").notNull().default("pending"),
      readAt: (0, import_pg_core13.timestamp)("read_at"),
      smsDeliveredAt: (0, import_pg_core13.timestamp)("sms_delivered_at"),
      smsStatus: (0, import_pg_core13.text)("sms_status"),
      createdAt: (0, import_pg_core13.timestamp)("created_at").defaultNow().notNull()
    });
  }
});

// shared/db/schema/wearables.ts
var import_pg_core14, import_nanoid8, wearableProviderEnum, wearableConnectionStatusEnum, wearableConnections, wearableMetrics, wearableSharing;
var init_wearables = __esm({
  "shared/db/schema/wearables.ts"() {
    "use strict";
    import_pg_core14 = require("drizzle-orm/pg-core");
    import_nanoid8 = require("nanoid");
    wearableProviderEnum = (0, import_pg_core14.pgEnum)("wearable_provider", [
      "apple_health",
      "whoop",
      "garmin",
      "oura"
    ]);
    wearableConnectionStatusEnum = (0, import_pg_core14.pgEnum)("wearable_connection_status", [
      "connected",
      "disconnected",
      "error",
      "pending"
    ]);
    wearableConnections = (0, import_pg_core14.pgTable)("wearable_connections", {
      id: (0, import_pg_core14.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid8.nanoid)()),
      orgId: (0, import_pg_core14.text)("org_id").notNull(),
      playerId: (0, import_pg_core14.text)("player_id").notNull(),
      provider: wearableProviderEnum("provider").notNull(),
      status: wearableConnectionStatusEnum("status").notNull().default("pending"),
      providerUserId: (0, import_pg_core14.text)("provider_user_id"),
      accessToken: (0, import_pg_core14.text)("access_token"),
      refreshToken: (0, import_pg_core14.text)("refresh_token"),
      tokenExpiresAt: (0, import_pg_core14.timestamp)("token_expires_at"),
      lastSyncedAt: (0, import_pg_core14.timestamp)("last_synced_at"),
      createdAt: (0, import_pg_core14.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core14.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core14.timestamp)("deleted_at")
    });
    wearableMetrics = (0, import_pg_core14.pgTable)(
      "wearable_metrics",
      {
        id: (0, import_pg_core14.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid8.nanoid)()),
        orgId: (0, import_pg_core14.text)("org_id").notNull(),
        playerId: (0, import_pg_core14.text)("player_id").notNull(),
        connectionId: (0, import_pg_core14.text)("connection_id").notNull(),
        provider: (0, import_pg_core14.text)("provider").notNull(),
        recordedDate: (0, import_pg_core14.date)("recorded_date").notNull(),
        recoveryScore: (0, import_pg_core14.integer)("recovery_score"),
        // 0-100 (WHOOP/Oura recovery)
        hrv: (0, import_pg_core14.numeric)("hrv"),
        // HRV in ms
        restingHr: (0, import_pg_core14.integer)("resting_hr"),
        // bpm
        sleepScore: (0, import_pg_core14.integer)("sleep_score"),
        // 0-100
        sleepDurationMins: (0, import_pg_core14.integer)("sleep_duration_mins"),
        deepSleepMins: (0, import_pg_core14.integer)("deep_sleep_mins"),
        remSleepMins: (0, import_pg_core14.integer)("rem_sleep_mins"),
        strainScore: (0, import_pg_core14.numeric)("strain_score"),
        // WHOOP strain 0-21, or normalized
        steps: (0, import_pg_core14.integer)("steps"),
        activeCalories: (0, import_pg_core14.integer)("active_calories"),
        rawPayload: (0, import_pg_core14.jsonb)("raw_payload"),
        // full provider response
        createdAt: (0, import_pg_core14.timestamp)("created_at").defaultNow().notNull()
      },
      (t) => ({
        uniquePerDay: (0, import_pg_core14.unique)("wearable_metrics_player_provider_date_key").on(
          t.playerId,
          t.provider,
          t.recordedDate
        )
      })
    );
    wearableSharing = (0, import_pg_core14.pgTable)(
      "wearable_sharing",
      {
        id: (0, import_pg_core14.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid8.nanoid)()),
        orgId: (0, import_pg_core14.text)("org_id").notNull(),
        playerId: (0, import_pg_core14.text)("player_id").notNull(),
        shareRecovery: (0, import_pg_core14.boolean)("share_recovery").notNull().default(false),
        shareSleep: (0, import_pg_core14.boolean)("share_sleep").notNull().default(false),
        shareStrain: (0, import_pg_core14.boolean)("share_strain").notNull().default(false),
        shareHeartRate: (0, import_pg_core14.boolean)("share_heart_rate").notNull().default(false),
        shareWithCoaches: (0, import_pg_core14.boolean)("share_with_coaches").notNull().default(false),
        shareWithTeam: (0, import_pg_core14.boolean)("share_with_team").notNull().default(false),
        updatedAt: (0, import_pg_core14.timestamp)("updated_at").defaultNow().notNull()
      },
      (t) => ({
        uniquePerPlayer: (0, import_pg_core14.unique)("wearable_sharing_org_player_key").on(t.orgId, t.playerId)
      })
    );
  }
});

// shared/db/schema/guardians.ts
var import_pg_core15, import_nanoid9, guardianRelationshipEnum, playerGuardians;
var init_guardians = __esm({
  "shared/db/schema/guardians.ts"() {
    "use strict";
    import_pg_core15 = require("drizzle-orm/pg-core");
    import_nanoid9 = require("nanoid");
    guardianRelationshipEnum = (0, import_pg_core15.pgEnum)("guardian_relationship", [
      "parent",
      "stepparent",
      "grandparent",
      "guardian",
      "other"
    ]);
    playerGuardians = (0, import_pg_core15.pgTable)("player_guardians", {
      id: (0, import_pg_core15.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid9.nanoid)()),
      orgId: (0, import_pg_core15.text)("org_id").notNull(),
      playerId: (0, import_pg_core15.text)("player_id").notNull(),
      // Clerk user ID of the guardian's HoopsOS account.  Null until the guardian
      // has been invited and claimed their account.
      guardianUserId: (0, import_pg_core15.text)("guardian_user_id"),
      name: (0, import_pg_core15.text)("name").notNull(),
      email: (0, import_pg_core15.text)("email"),
      phone: (0, import_pg_core15.text)("phone"),
      relationship: guardianRelationshipEnum("relationship").notNull().default("parent"),
      isPrimary: (0, import_pg_core15.boolean)("is_primary").notNull().default(false),
      canReceiveMessages: (0, import_pg_core15.boolean)("can_receive_messages").notNull().default(true),
      createdAt: (0, import_pg_core15.timestamp)("created_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core15.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/player_notes.ts
var import_pg_core16, import_nanoid10, playerNoteTypeEnum, playerNotes;
var init_player_notes = __esm({
  "shared/db/schema/player_notes.ts"() {
    "use strict";
    import_pg_core16 = require("drizzle-orm/pg-core");
    import_nanoid10 = require("nanoid");
    playerNoteTypeEnum = (0, import_pg_core16.pgEnum)("player_note_type", [
      "coach",
      "academic",
      "health",
      "behavioral",
      "recruiting",
      "general"
    ]);
    playerNotes = (0, import_pg_core16.pgTable)("player_notes", {
      id: (0, import_pg_core16.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid10.nanoid)()),
      orgId: (0, import_pg_core16.text)("org_id").notNull(),
      playerId: (0, import_pg_core16.text)("player_id").notNull(),
      noteType: playerNoteTypeEnum("note_type").notNull().default("coach"),
      body: (0, import_pg_core16.text)("body").notNull(),
      isPinned: (0, import_pg_core16.boolean)("is_pinned").notNull().default(false),
      createdByUserId: (0, import_pg_core16.text)("created_by_user_id").notNull(),
      createdAt: (0, import_pg_core16.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core16.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core16.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/skill_assessments.ts
var import_pg_core17, import_nanoid11, skillAssessments;
var init_skill_assessments = __esm({
  "shared/db/schema/skill_assessments.ts"() {
    "use strict";
    import_pg_core17 = require("drizzle-orm/pg-core");
    import_nanoid11 = require("nanoid");
    skillAssessments = (0, import_pg_core17.pgTable)("skill_assessments", {
      id: (0, import_pg_core17.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid11.nanoid)()),
      orgId: (0, import_pg_core17.text)("org_id").notNull(),
      playerId: (0, import_pg_core17.text)("player_id").notNull(),
      assessedByUserId: (0, import_pg_core17.text)("assessed_by_user_id").notNull(),
      season: (0, import_pg_core17.text)("season"),
      // "2024-25"
      category: (0, import_pg_core17.text)("category").notNull(),
      // "Shooting" | "Ball Handling" | etc.
      subSkill: (0, import_pg_core17.text)("sub_skill").notNull(),
      // "Catch & Shoot" | etc.
      score: (0, import_pg_core17.integer)("score").notNull(),
      // 1–10
      notes: (0, import_pg_core17.text)("notes"),
      assessedAt: (0, import_pg_core17.timestamp)("assessed_at").defaultNow().notNull(),
      createdAt: (0, import_pg_core17.timestamp)("created_at").defaultNow().notNull()
    });
  }
});

// shared/db/schema/injury_records.ts
var import_pg_core18, import_nanoid12, injuryStatusEnum, injuryRecords;
var init_injury_records = __esm({
  "shared/db/schema/injury_records.ts"() {
    "use strict";
    import_pg_core18 = require("drizzle-orm/pg-core");
    import_nanoid12 = require("nanoid");
    injuryStatusEnum = (0, import_pg_core18.pgEnum)("injury_status", [
      "active",
      // sidelined — no full participation
      "monitoring",
      // sub-injury watch — can practice with modifications
      "cleared"
      // return-to-play complete
    ]);
    injuryRecords = (0, import_pg_core18.pgTable)("injury_records", {
      id: (0, import_pg_core18.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid12.nanoid)()),
      orgId: (0, import_pg_core18.text)("org_id").notNull(),
      playerId: (0, import_pg_core18.text)("player_id").notNull(),
      description: (0, import_pg_core18.text)("description").notNull(),
      // "Left ankle sprain — Grade 1"
      bodyPart: (0, import_pg_core18.text)("body_part"),
      // "Ankle" | "Knee" | "Shoulder" …
      status: injuryStatusEnum("status").notNull().default("active"),
      restrictions: (0, import_pg_core18.text)("restrictions"),
      // "No jumping, limited contact"
      injuredAt: (0, import_pg_core18.timestamp)("injured_at").notNull(),
      expectedReturnAt: (0, import_pg_core18.timestamp)("expected_return_at"),
      clearedAt: (0, import_pg_core18.timestamp)("cleared_at"),
      clearanceNotes: (0, import_pg_core18.text)("clearance_notes"),
      createdByUserId: (0, import_pg_core18.text)("created_by_user_id").notNull(),
      createdAt: (0, import_pg_core18.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core18.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core18.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/idp_structured.ts
var import_pg_core19, import_nanoid13, idpFocusAreaStatusEnum, idpCommentTypeEnum, idpFocusAreas, idpMilestones, idpDrillLinks, idpComments;
var init_idp_structured = __esm({
  "shared/db/schema/idp_structured.ts"() {
    "use strict";
    import_pg_core19 = require("drizzle-orm/pg-core");
    import_nanoid13 = require("nanoid");
    idpFocusAreaStatusEnum = (0, import_pg_core19.pgEnum)("idp_focus_area_status", [
      "draft",
      "active",
      "completed",
      "paused"
    ]);
    idpCommentTypeEnum = (0, import_pg_core19.pgEnum)("idp_comment_type", [
      "weekly_review",
      "film_note",
      "assessment",
      "general"
    ]);
    idpFocusAreas = (0, import_pg_core19.pgTable)("idp_focus_areas", {
      id: (0, import_pg_core19.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid13.nanoid)()),
      orgId: (0, import_pg_core19.text)("org_id").notNull(),
      idpId: (0, import_pg_core19.text)("idp_id").notNull(),
      // FK → idps.id
      playerId: (0, import_pg_core19.text)("player_id").notNull(),
      priority: (0, import_pg_core19.integer)("priority").notNull().default(1),
      // 1 = highest
      category: (0, import_pg_core19.text)("category").notNull(),
      // "Shooting", "Finishing" …
      subSkill: (0, import_pg_core19.text)("sub_skill").notNull(),
      // "Contact Layup"
      emoji: (0, import_pg_core19.text)("emoji").default("\u{1F3C0}"),
      currentScore: (0, import_pg_core19.integer)("current_score"),
      // 1-10 snapshot at creation
      targetScore: (0, import_pg_core19.integer)("target_score"),
      // 1-10 goal
      deadline: (0, import_pg_core19.text)("deadline"),
      // ISO date string "2025-06-15"
      status: idpFocusAreaStatusEnum("status").notNull().default("active"),
      coachNotes: (0, import_pg_core19.text)("coach_notes"),
      createdAt: (0, import_pg_core19.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core19.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core19.timestamp)("deleted_at")
    });
    idpMilestones = (0, import_pg_core19.pgTable)("idp_milestones", {
      id: (0, import_pg_core19.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid13.nanoid)()),
      orgId: (0, import_pg_core19.text)("org_id").notNull(),
      focusAreaId: (0, import_pg_core19.text)("focus_area_id").notNull(),
      // FK → idp_focus_areas.id
      idpId: (0, import_pg_core19.text)("idp_id").notNull(),
      title: (0, import_pg_core19.text)("title").notNull(),
      dueDate: (0, import_pg_core19.text)("due_date"),
      // ISO date string
      completedAt: (0, import_pg_core19.timestamp)("completed_at"),
      createdAt: (0, import_pg_core19.timestamp)("created_at").defaultNow().notNull()
    });
    idpDrillLinks = (0, import_pg_core19.pgTable)("idp_drill_links", {
      id: (0, import_pg_core19.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid13.nanoid)()),
      orgId: (0, import_pg_core19.text)("org_id").notNull(),
      focusAreaId: (0, import_pg_core19.text)("focus_area_id").notNull(),
      idpId: (0, import_pg_core19.text)("idp_id").notNull(),
      drillId: (0, import_pg_core19.text)("drill_id"),
      // ref to drill library id (nullable = custom)
      drillTitle: (0, import_pg_core19.text)("drill_title").notNull(),
      reps: (0, import_pg_core19.text)("reps"),
      // "5 sets of 10", "50 reps each side"
      frequency: (0, import_pg_core19.text)("frequency"),
      // "daily", "3x per week"
      isDueToday: (0, import_pg_core19.boolean)("is_due_today").notNull().default(false),
      createdAt: (0, import_pg_core19.timestamp)("created_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core19.timestamp)("deleted_at")
    });
    idpComments = (0, import_pg_core19.pgTable)("idp_comments", {
      id: (0, import_pg_core19.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid13.nanoid)()),
      orgId: (0, import_pg_core19.text)("org_id").notNull(),
      idpId: (0, import_pg_core19.text)("idp_id").notNull(),
      focusAreaId: (0, import_pg_core19.text)("focus_area_id"),
      // null = IDP-level comment
      authorUserId: (0, import_pg_core19.text)("author_user_id").notNull(),
      type: idpCommentTypeEnum("type").notNull().default("general"),
      body: (0, import_pg_core19.text)("body").notNull(),
      linkedFilmSessionId: (0, import_pg_core19.text)("linked_film_session_id"),
      linkedAnnotationId: (0, import_pg_core19.text)("linked_annotation_id"),
      createdAt: (0, import_pg_core19.timestamp)("created_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core19.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/coaching_actions.ts
var import_pg_core20, import_nanoid14, coachingActionTypeEnum, coachingActionStatusEnum, coachingActions;
var init_coaching_actions = __esm({
  "shared/db/schema/coaching_actions.ts"() {
    "use strict";
    import_pg_core20 = require("drizzle-orm/pg-core");
    import_nanoid14 = require("nanoid");
    coachingActionTypeEnum = (0, import_pg_core20.pgEnum)("coaching_action_type", [
      "assign_clip",
      // Send clip to athlete as a film-review assignment
      "recommend_drill",
      // Prescribe a drill derived from this clip
      "add_to_idp",
      // Link insight to the player's IDP focus area
      "add_to_wod",
      // Push drill directly into a scheduled WOD
      "request_reupload",
      // Ask athlete to record and submit a new rep
      "mark_addressed"
      // Close the loop — no follow-up needed
    ]);
    coachingActionStatusEnum = (0, import_pg_core20.pgEnum)("coaching_action_status", [
      "open",
      // Created, no athlete response yet
      "in_progress",
      // Assignment sent / request delivered
      "resolved",
      // Follow-up reviewed and confirmed; loop closed
      "dismissed"
      // Coach decided not to pursue
    ]);
    coachingActions = (0, import_pg_core20.pgTable)("coaching_actions", {
      id: (0, import_pg_core20.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid14.nanoid)()),
      orgId: (0, import_pg_core20.text)("org_id").notNull(),
      // Source context ─────────────────────────────────────────────────────────────
      sessionId: (0, import_pg_core20.text)("session_id").notNull(),
      // film_sessions.id
      annotationId: (0, import_pg_core20.text)("annotation_id"),
      // annotations.id — nullable for session-level actions
      playerId: (0, import_pg_core20.text)("player_id"),
      // target player (null = team action)
      authorUserId: (0, import_pg_core20.text)("author_user_id").notNull(),
      // Issue context (from AI observation or coach tag) ───────────────────────────
      issueCategory: (0, import_pg_core20.text)("issue_category"),
      // "Balance", "Release", "Finishing" …
      issueSeverity: (0, import_pg_core20.text)("issue_severity"),
      // "minor" | "major"
      timestampMs: (0, import_pg_core20.integer)("timestamp_ms"),
      // ms into the video
      coachNote: (0, import_pg_core20.text)("coach_note"),
      // coach's framing of the action
      // Action type and status ─────────────────────────────────────────────────────
      actionType: coachingActionTypeEnum("action_type").notNull(),
      status: coachingActionStatusEnum("status").notNull().default("open"),
      // Downstream resolution references ───────────────────────────────────────────
      assignmentId: (0, import_pg_core20.text)("assignment_id"),
      // assignments.id if action spawned one
      idpFocusAreaId: (0, import_pg_core20.text)("idp_focus_area_id"),
      // idp_focus_areas.id if linked
      followUpSessionId: (0, import_pg_core20.text)("follow_up_session_id"),
      // film_sessions.id for re-upload evidence
      resolvedAt: (0, import_pg_core20.timestamp)("resolved_at"),
      resolvedNote: (0, import_pg_core20.text)("resolved_note"),
      // brief note on how/why resolved
      // AI resolution quality — computed by Inngest after analyzing follow-up session
      resolutionScore: (0, import_pg_core20.jsonb)("resolution_score"),
      // { originalCount, followUpCount, improvement, autoResolved }
      createdAt: (0, import_pg_core20.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core20.timestamp)("updated_at").defaultNow().notNull()
    });
  }
});

// shared/db/schema/readiness_overrides.ts
var import_pg_core21, import_nanoid15, readinessOverrides;
var init_readiness_overrides = __esm({
  "shared/db/schema/readiness_overrides.ts"() {
    "use strict";
    import_pg_core21 = require("drizzle-orm/pg-core");
    import_nanoid15 = require("nanoid");
    readinessOverrides = (0, import_pg_core21.pgTable)("readiness_overrides", {
      id: (0, import_pg_core21.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid15.nanoid)()),
      orgId: (0, import_pg_core21.text)("org_id").notNull(),
      playerId: (0, import_pg_core21.text)("player_id").notNull(),
      coachUserId: (0, import_pg_core21.text)("coach_user_id").notNull(),
      status: (0, import_pg_core21.text)("status").notNull(),
      // "READY" | "FLAGGED" | "RESTRICTED"
      note: (0, import_pg_core21.text)("note"),
      expiresAt: (0, import_pg_core21.timestamp)("expires_at").notNull(),
      createdAt: (0, import_pg_core21.timestamp)("created_at").defaultNow().notNull()
    });
  }
});

// shared/db/schema/opponents.ts
var import_pg_core22, import_nanoid16, opponents;
var init_opponents = __esm({
  "shared/db/schema/opponents.ts"() {
    "use strict";
    import_pg_core22 = require("drizzle-orm/pg-core");
    import_nanoid16 = require("nanoid");
    opponents = (0, import_pg_core22.pgTable)("opponents", {
      id: (0, import_pg_core22.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid16.nanoid)()),
      orgId: (0, import_pg_core22.text)("org_id").notNull(),
      name: (0, import_pg_core22.text)("name").notNull(),
      abbreviation: (0, import_pg_core22.text)("abbreviation"),
      level: (0, import_pg_core22.text)("level").notNull().default("varsity"),
      // varsity|jv|aau|academy|club
      conference: (0, import_pg_core22.text)("conference"),
      division: (0, import_pg_core22.text)("division"),
      coachName: (0, import_pg_core22.text)("coach_name"),
      record: (0, import_pg_core22.jsonb)("record"),
      // { wins, losses }
      primaryColor: (0, import_pg_core22.text)("primary_color"),
      // OKLCH or hex for team chip
      // Denormalised link arrays (in production, use join tables)
      linkedEventIds: (0, import_pg_core22.jsonb)("linked_event_ids"),
      // string[]
      filmSessionIds: (0, import_pg_core22.jsonb)("film_session_ids"),
      // string[]
      notes: (0, import_pg_core22.text)("notes"),
      createdByUserId: (0, import_pg_core22.text)("created_by_user_id").notNull(),
      createdAt: (0, import_pg_core22.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core22.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core22.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/scout_reports.ts
var import_pg_core23, import_nanoid17, scoutReportStatusEnum, scoutReports;
var init_scout_reports = __esm({
  "shared/db/schema/scout_reports.ts"() {
    "use strict";
    import_pg_core23 = require("drizzle-orm/pg-core");
    import_nanoid17 = require("nanoid");
    scoutReportStatusEnum = (0, import_pg_core23.pgEnum)("scout_report_status", [
      "draft",
      "final",
      "archived"
    ]);
    scoutReports = (0, import_pg_core23.pgTable)("scout_reports", {
      id: (0, import_pg_core23.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid17.nanoid)()),
      orgId: (0, import_pg_core23.text)("org_id").notNull(),
      opponentId: (0, import_pg_core23.text)("opponent_id").notNull(),
      // → opponents.id
      opponentName: (0, import_pg_core23.text)("opponent_name").notNull(),
      gameDate: (0, import_pg_core23.text)("game_date"),
      // ISO "YYYY-MM-DD"
      linkedEventId: (0, import_pg_core23.text)("linked_event_id"),
      // → events.id
      status: scoutReportStatusEnum("status").notNull().default("draft"),
      // Game plan
      gamePlanSummary: (0, import_pg_core23.text)("game_plan_summary"),
      keysToWin: (0, import_pg_core23.jsonb)("keys_to_win"),
      // string[]
      // Tendencies — JSONB arrays so no join tables needed for HS/AAU scale
      offenseTendencies: (0, import_pg_core23.jsonb)("offense_tendencies"),
      // ScoutTendency[]
      defenseTendencies: (0, import_pg_core23.jsonb)("defense_tendencies"),
      // ScoutTendency[]
      // Personnel
      keyPlayers: (0, import_pg_core23.jsonb)("key_players"),
      // ScoutKeyPlayer[]
      matchupNotes: (0, import_pg_core23.jsonb)("matchup_notes"),
      // MatchupNote[]
      // Assignments
      assignments: (0, import_pg_core23.jsonb)("assignments"),
      // ScoutAssignment[]
      // Linked content
      linkedClipIds: (0, import_pg_core23.jsonb)("linked_clip_ids"),
      // string[]
      linkedPracticePlanId: (0, import_pg_core23.text)("linked_practice_plan_id"),
      linkedPlayIds: (0, import_pg_core23.jsonb)("linked_play_ids"),
      // string[] — scout-team plays
      authorUserId: (0, import_pg_core23.text)("author_user_id").notNull(),
      authorName: (0, import_pg_core23.text)("author_name").notNull(),
      createdAt: (0, import_pg_core23.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core23.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core23.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/announcements.ts
var import_pg_core24, import_nanoid18, announcementPriorityEnum, announcements;
var init_announcements = __esm({
  "shared/db/schema/announcements.ts"() {
    "use strict";
    import_pg_core24 = require("drizzle-orm/pg-core");
    import_nanoid18 = require("nanoid");
    announcementPriorityEnum = (0, import_pg_core24.pgEnum)("announcement_priority", [
      "normal",
      "urgent",
      "info"
    ]);
    announcements = (0, import_pg_core24.pgTable)("announcements", {
      id: (0, import_pg_core24.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid18.nanoid)()),
      orgId: (0, import_pg_core24.text)("org_id").notNull(),
      teamId: (0, import_pg_core24.text)("team_id"),
      title: (0, import_pg_core24.text)("title").notNull(),
      body: (0, import_pg_core24.text)("body").notNull(),
      priority: announcementPriorityEnum("priority").notNull().default("normal"),
      pinned: (0, import_pg_core24.boolean)("pinned").notNull().default(false),
      tags: (0, import_pg_core24.text)("tags").array().notNull().default([]),
      // Audience scoping: null = entire org; array of role strings narrows
      audienceRoles: (0, import_pg_core24.text)("audience_roles").array(),
      authorUserId: (0, import_pg_core24.text)("author_user_id").notNull(),
      authorName: (0, import_pg_core24.text)("author_name").notNull(),
      publishedAt: (0, import_pg_core24.timestamp)("published_at").defaultNow().notNull(),
      expiresAt: (0, import_pg_core24.timestamp)("expires_at"),
      createdAt: (0, import_pg_core24.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core24.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core24.timestamp)("deleted_at")
    });
  }
});

// shared/db/schema/waivers.ts
var import_pg_core25, import_nanoid19, waiverCategoryEnum, waiverStatusEnum, waiverTemplates, waiverSignatures;
var init_waivers = __esm({
  "shared/db/schema/waivers.ts"() {
    "use strict";
    import_pg_core25 = require("drizzle-orm/pg-core");
    import_nanoid19 = require("nanoid");
    waiverCategoryEnum = (0, import_pg_core25.pgEnum)("waiver_category", [
      "waiver",
      "consent",
      "medical",
      "media",
      "emergency"
    ]);
    waiverStatusEnum = (0, import_pg_core25.pgEnum)("waiver_status", [
      "pending",
      "signed",
      "expired",
      "voided"
    ]);
    waiverTemplates = (0, import_pg_core25.pgTable)("waiver_templates", {
      id: (0, import_pg_core25.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid19.nanoid)()),
      orgId: (0, import_pg_core25.text)("org_id").notNull(),
      title: (0, import_pg_core25.text)("title").notNull(),
      description: (0, import_pg_core25.text)("description").notNull(),
      category: waiverCategoryEnum("category").notNull(),
      bodyMarkdown: (0, import_pg_core25.text)("body_markdown").notNull().default(""),
      required: (0, import_pg_core25.boolean)("required").notNull().default(true),
      expiresAfterDays: (0, import_pg_core25.text)("expires_after_days"),
      // e.g. "365" for annual
      createdByUserId: (0, import_pg_core25.text)("created_by_user_id").notNull(),
      createdAt: (0, import_pg_core25.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core25.timestamp)("updated_at").defaultNow().notNull(),
      deletedAt: (0, import_pg_core25.timestamp)("deleted_at")
    });
    waiverSignatures = (0, import_pg_core25.pgTable)("waiver_signatures", {
      id: (0, import_pg_core25.text)("id").primaryKey().$defaultFn(() => (0, import_nanoid19.nanoid)()),
      templateId: (0, import_pg_core25.text)("template_id").notNull(),
      orgId: (0, import_pg_core25.text)("org_id").notNull(),
      signedByUserId: (0, import_pg_core25.text)("signed_by_user_id").notNull(),
      // parent or guardian
      playerId: (0, import_pg_core25.text)("player_id").notNull(),
      status: waiverStatusEnum("status").notNull().default("pending"),
      signedAt: (0, import_pg_core25.timestamp)("signed_at"),
      expiresAt: (0, import_pg_core25.timestamp)("expires_at"),
      ipAddress: (0, import_pg_core25.text)("ip_address"),
      userAgent: (0, import_pg_core25.text)("user_agent"),
      createdAt: (0, import_pg_core25.timestamp)("created_at").defaultNow().notNull(),
      updatedAt: (0, import_pg_core25.timestamp)("updated_at").defaultNow().notNull()
    });
  }
});

// shared/db/schema/seasons.ts
var import_pg_core26, seasonStatusEnum, seasons, teamAgeGroupEnum, teamGenderEnum, teams, teamRosterStatusEnum, teamRoster;
var init_seasons = __esm({
  "shared/db/schema/seasons.ts"() {
    "use strict";
    import_pg_core26 = require("drizzle-orm/pg-core");
    init_orgs();
    seasonStatusEnum = (0, import_pg_core26.pgEnum)("season_status", [
      "draft",
      // being set up, not visible to families
      "open",
      // registration is open
      "active",
      // season is running
      "completed",
      // season ended
      "archived"
      // soft-hidden from UI
    ]);
    seasons = (0, import_pg_core26.pgTable)(
      "seasons",
      {
        id: (0, import_pg_core26.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core26.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        name: (0, import_pg_core26.text)("name").notNull(),
        // "Fall 2025 AAU", "Spring 2026 Travel"
        slug: (0, import_pg_core26.text)("slug").notNull(),
        status: seasonStatusEnum("status").notNull().default("draft"),
        description: (0, import_pg_core26.text)("description"),
        // Date window the season covers (games / practices)
        startsAt: (0, import_pg_core26.timestamp)("starts_at", { withTimezone: true }),
        endsAt: (0, import_pg_core26.timestamp)("ends_at", { withTimezone: true }),
        // Registration window (can differ from season dates)
        registrationOpensAt: (0, import_pg_core26.timestamp)("registration_opens_at", { withTimezone: true }),
        registrationClosesAt: (0, import_pg_core26.timestamp)("registration_closes_at", { withTimezone: true }),
        // Capacity cap (null = unlimited)
        maxRoster: (0, import_pg_core26.integer)("max_roster"),
        createdByUserId: (0, import_pg_core26.text)("created_by_user_id").notNull(),
        createdAt: (0, import_pg_core26.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core26.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core26.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        byOrg: (0, import_pg_core26.index)("seasons_org_idx").on(t.orgId),
        orgSlugUnique: (0, import_pg_core26.uniqueIndex)("seasons_org_slug_unique").on(t.orgId, t.slug)
      })
    );
    teamAgeGroupEnum = (0, import_pg_core26.pgEnum)("team_age_group", [
      "u8",
      "u10",
      "u12",
      "u13",
      "u14",
      "u15",
      "u16",
      "u17",
      "u18",
      "varsity",
      "jv",
      "freshman",
      "adult",
      "other"
    ]);
    teamGenderEnum = (0, import_pg_core26.pgEnum)("team_gender", [
      "boys",
      "girls",
      "co_ed",
      "open"
    ]);
    teams = (0, import_pg_core26.pgTable)(
      "teams",
      {
        id: (0, import_pg_core26.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core26.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        seasonId: (0, import_pg_core26.uuid)("season_id").references(() => seasons.id, { onDelete: "set null" }),
        name: (0, import_pg_core26.text)("name").notNull(),
        // "Varsity Boys", "10U Tigers"
        slug: (0, import_pg_core26.text)("slug").notNull(),
        ageGroup: teamAgeGroupEnum("age_group").notNull().default("other"),
        gender: teamGenderEnum("gender").notNull().default("boys"),
        headCoachUserId: (0, import_pg_core26.text)("head_coach_user_id"),
        assistantCoachUserIds: (0, import_pg_core26.text)("assistant_coach_user_ids").array().notNull().default([]),
        colorPrimary: (0, import_pg_core26.text)("color_primary"),
        // hex
        colorSecondary: (0, import_pg_core26.text)("color_secondary"),
        logoUrl: (0, import_pg_core26.text)("logo_url"),
        isActive: (0, import_pg_core26.boolean)("is_active").notNull().default(true),
        createdByUserId: (0, import_pg_core26.text)("created_by_user_id").notNull(),
        createdAt: (0, import_pg_core26.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core26.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core26.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        byOrg: (0, import_pg_core26.index)("teams_org_idx").on(t.orgId),
        bySeason: (0, import_pg_core26.index)("teams_season_idx").on(t.seasonId),
        orgSlugUnique: (0, import_pg_core26.uniqueIndex)("teams_org_slug_unique").on(t.orgId, t.slug)
      })
    );
    teamRosterStatusEnum = (0, import_pg_core26.pgEnum)("team_roster_status", [
      "active",
      "inactive",
      "tryout",
      "suspended"
    ]);
    teamRoster = (0, import_pg_core26.pgTable)(
      "team_roster",
      {
        id: (0, import_pg_core26.uuid)("id").primaryKey().defaultRandom(),
        teamId: (0, import_pg_core26.uuid)("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
        orgId: (0, import_pg_core26.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        playerId: (0, import_pg_core26.uuid)("player_id").notNull(),
        // FK → players.id (no circular import)
        jerseyNumber: (0, import_pg_core26.text)("jersey_number"),
        status: teamRosterStatusEnum("status").notNull().default("active"),
        addedByUserId: (0, import_pg_core26.text)("added_by_user_id").notNull(),
        addedAt: (0, import_pg_core26.timestamp)("added_at", { withTimezone: true }).notNull().defaultNow(),
        removedAt: (0, import_pg_core26.timestamp)("removed_at", { withTimezone: true })
      },
      (t) => ({
        byTeam: (0, import_pg_core26.index)("team_roster_team_idx").on(t.teamId),
        byPlayer: (0, import_pg_core26.index)("team_roster_player_idx").on(t.playerId),
        teamPlayerUnique: (0, import_pg_core26.uniqueIndex)("team_roster_team_player_unique").on(t.teamId, t.playerId)
      })
    );
  }
});

// shared/db/schema/memberships.ts
var import_pg_core27, planTypeEnum, planStatusEnum, membershipPlans, registrationStatusEnum, registrations;
var init_memberships = __esm({
  "shared/db/schema/memberships.ts"() {
    "use strict";
    import_pg_core27 = require("drizzle-orm/pg-core");
    init_orgs();
    init_seasons();
    planTypeEnum = (0, import_pg_core27.pgEnum)("plan_type", [
      "season",
      // one-time fee for the whole season
      "monthly",
      // recurring monthly dues
      "annual",
      // recurring annual membership
      "drop_in",
      // per-session fee (camp, clinic, drop-in practice)
      "tournament",
      // per-tournament fee
      "custom"
      // admin-defined, no automatic billing
    ]);
    planStatusEnum = (0, import_pg_core27.pgEnum)("plan_status", [
      "draft",
      // not visible to families
      "active",
      // visible and accepting registrations
      "archived"
      // no new registrations
    ]);
    membershipPlans = (0, import_pg_core27.pgTable)(
      "membership_plans",
      {
        id: (0, import_pg_core27.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core27.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        seasonId: (0, import_pg_core27.uuid)("season_id").references(() => seasons.id, { onDelete: "set null" }),
        name: (0, import_pg_core27.text)("name").notNull(),
        // "Fall 2025 Varsity", "Monthly Academy Training"
        description: (0, import_pg_core27.text)("description"),
        type: planTypeEnum("type").notNull().default("season"),
        status: planStatusEnum("status").notNull().default("draft"),
        // Price in cents (USD)
        priceAmount: (0, import_pg_core27.integer)("price_amount").notNull(),
        // e.g. 45000 = $450.00
        // For monthly plans: how many billing cycles? null = indefinite
        billingCycles: (0, import_pg_core27.integer)("billing_cycles"),
        // Payment plan: allow installments?
        allowsPaymentPlan: (0, import_pg_core27.boolean)("allows_payment_plan").notNull().default(false),
        // Number of installments allowed (if allowsPaymentPlan)
        installmentCount: (0, import_pg_core27.integer)("installment_count"),
        // Down-payment required in cents (0 = no down-payment required)
        depositAmount: (0, import_pg_core27.integer)("deposit_amount").notNull().default(0),
        // Early-bird discount: amount in cents off before earlyBirdDeadline
        earlyBirdAmount: (0, import_pg_core27.integer)("early_bird_amount"),
        earlyBirdDeadline: (0, import_pg_core27.timestamp)("early_bird_deadline", { withTimezone: true }),
        // Sibling discount: flat amount per additional sibling
        siblingDiscountAmount: (0, import_pg_core27.integer)("sibling_discount_amount"),
        // Which teams are included (null = all teams)
        teamIds: (0, import_pg_core27.uuid)("team_ids").array(),
        // Additional per-player fees bundled in (uniform, insurance, etc.)
        includedFees: (0, import_pg_core27.jsonb)("included_fees").notNull().default([]),
        // e.g. [{ label: "Uniform", amount: 8500 }, { label: "Insurance", amount: 2500 }]
        maxEnrollment: (0, import_pg_core27.integer)("max_enrollment"),
        // cap per plan; null = unlimited
        // Stripe price ID (set when plan is pushed to Stripe)
        stripePriceId: (0, import_pg_core27.text)("stripe_price_id"),
        createdByUserId: (0, import_pg_core27.text)("created_by_user_id").notNull(),
        createdAt: (0, import_pg_core27.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core27.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: (0, import_pg_core27.timestamp)("deleted_at", { withTimezone: true })
      },
      (t) => ({
        byOrg: (0, import_pg_core27.index)("membership_plans_org_idx").on(t.orgId),
        bySeason: (0, import_pg_core27.index)("membership_plans_season_idx").on(t.seasonId)
      })
    );
    registrationStatusEnum = (0, import_pg_core27.pgEnum)("registration_status", [
      "pending",
      // submitted but not yet reviewed/accepted
      "waitlisted",
      // over capacity; on waitlist
      "accepted",
      // approved by admin (manual review mode)
      "active",
      // fully active: accepted + dues paid (or plan started)
      "cancelled",
      // family cancelled
      "denied",
      // admin denied
      "incomplete"
      // started but not finished (e.g., forms outstanding)
    ]);
    registrations = (0, import_pg_core27.pgTable)(
      "registrations",
      {
        id: (0, import_pg_core27.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core27.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        seasonId: (0, import_pg_core27.uuid)("season_id").references(() => seasons.id, { onDelete: "set null" }),
        planId: (0, import_pg_core27.uuid)("plan_id").references(() => membershipPlans.id, { onDelete: "set null" }),
        teamId: (0, import_pg_core27.uuid)("team_id").references(() => teams.id, { onDelete: "set null" }),
        // The player being registered
        playerId: (0, import_pg_core27.uuid)("player_id").notNull(),
        // FK → players.id
        // The guardian/user who submitted registration
        submittedByUserId: (0, import_pg_core27.text)("submitted_by_user_id").notNull(),
        status: registrationStatusEnum("status").notNull().default("pending"),
        // Snapshot of the effective price at registration time (cents)
        effectiveAmount: (0, import_pg_core27.integer)("effective_amount").notNull().default(0),
        discountAmount: (0, import_pg_core27.integer)("discount_amount").notNull().default(0),
        // Reason for discount: "early_bird", "sibling", "scholarship", "admin_override"
        discountReason: (0, import_pg_core27.text)("discount_reason"),
        // Admin notes (internal)
        adminNotes: (0, import_pg_core27.text)("admin_notes"),
        // Timestamps
        submittedAt: (0, import_pg_core27.timestamp)("submitted_at", { withTimezone: true }).notNull().defaultNow(),
        acceptedAt: (0, import_pg_core27.timestamp)("accepted_at", { withTimezone: true }),
        acceptedByUserId: (0, import_pg_core27.text)("accepted_by_user_id"),
        cancelledAt: (0, import_pg_core27.timestamp)("cancelled_at", { withTimezone: true }),
        cancelledByUserId: (0, import_pg_core27.text)("cancelled_by_user_id"),
        createdAt: (0, import_pg_core27.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core27.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => ({
        byOrg: (0, import_pg_core27.index)("registrations_org_idx").on(t.orgId),
        bySeason: (0, import_pg_core27.index)("registrations_season_idx").on(t.seasonId),
        byPlayer: (0, import_pg_core27.index)("registrations_player_idx").on(t.playerId),
        byStatus: (0, import_pg_core27.index)("registrations_status_idx").on(t.status),
        // A player can only have one registration per plan
        playerPlanUnique: (0, import_pg_core27.uniqueIndex)("registrations_player_plan_unique").on(t.playerId, t.planId)
      })
    );
  }
});

// shared/db/schema/billing.ts
var import_pg_core28, invoiceStatusEnum, paymentMethodEnum, paymentStatusEnum, invoices, invoiceItemTypeEnum, invoiceItems, payments, paymentPlanStatusEnum, paymentPlans;
var init_billing = __esm({
  "shared/db/schema/billing.ts"() {
    "use strict";
    import_pg_core28 = require("drizzle-orm/pg-core");
    init_orgs();
    init_seasons();
    init_memberships();
    invoiceStatusEnum = (0, import_pg_core28.pgEnum)("invoice_status", [
      "draft",
      // being built, not sent
      "open",
      // sent to family; awaiting payment
      "paid",
      // fully settled
      "partial",
      // partially paid
      "overdue",
      // past due date and unpaid
      "void",
      // cancelled, no amount owed
      "refunded",
      // payment reversed
      "write_off"
      // admin wrote off the balance
    ]);
    paymentMethodEnum = (0, import_pg_core28.pgEnum)("payment_method", [
      "stripe_card",
      "stripe_ach",
      "cash",
      "check",
      "zelle",
      "venmo",
      "paypal",
      "other"
    ]);
    paymentStatusEnum = (0, import_pg_core28.pgEnum)("payment_status", [
      "pending",
      // initiated but not confirmed
      "succeeded",
      // confirmed
      "failed",
      // failed (card declined, etc.)
      "refunded",
      // reversed
      "disputed"
      // chargeback in progress
    ]);
    invoices = (0, import_pg_core28.pgTable)(
      "invoices",
      {
        id: (0, import_pg_core28.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core28.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        seasonId: (0, import_pg_core28.uuid)("season_id").references(() => seasons.id, { onDelete: "set null" }),
        registrationId: (0, import_pg_core28.uuid)("registration_id").references(() => registrations.id, { onDelete: "set null" }),
        // The player / family this invoice is for
        playerId: (0, import_pg_core28.uuid)("player_id").notNull(),
        guardianUserId: (0, import_pg_core28.text)("guardian_user_id"),
        // null if admin-generated
        // Human-readable invoice number: "INV-2025-0042"
        invoiceNumber: (0, import_pg_core28.text)("invoice_number").notNull(),
        status: invoiceStatusEnum("status").notNull().default("draft"),
        // All amounts in cents
        subtotal: (0, import_pg_core28.integer)("subtotal").notNull().default(0),
        discountAmount: (0, import_pg_core28.integer)("discount_amount").notNull().default(0),
        taxAmount: (0, import_pg_core28.integer)("tax_amount").notNull().default(0),
        totalAmount: (0, import_pg_core28.integer)("total_amount").notNull().default(0),
        amountPaid: (0, import_pg_core28.integer)("amount_paid").notNull().default(0),
        amountDue: (0, import_pg_core28.integer)("amount_due").notNull().default(0),
        // totalAmount - amountPaid
        dueDate: (0, import_pg_core28.timestamp)("due_date", { withTimezone: true }),
        issuedAt: (0, import_pg_core28.timestamp)("issued_at", { withTimezone: true }),
        paidAt: (0, import_pg_core28.timestamp)("paid_at", { withTimezone: true }),
        // Memo shown to families
        memo: (0, import_pg_core28.text)("memo"),
        // Internal admin notes
        adminNotes: (0, import_pg_core28.text)("admin_notes"),
        // Stripe integration
        stripeInvoiceId: (0, import_pg_core28.text)("stripe_invoice_id"),
        stripeCustomerId: (0, import_pg_core28.text)("stripe_customer_id"),
        // Is this invoice part of a payment plan?
        paymentPlanId: (0, import_pg_core28.uuid)("payment_plan_id"),
        // FK → paymentPlans.id (self-ref avoided)
        installmentNumber: (0, import_pg_core28.integer)("installment_number"),
        // 1 of 3, 2 of 3, etc.
        createdByUserId: (0, import_pg_core28.text)("created_by_user_id").notNull(),
        createdAt: (0, import_pg_core28.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core28.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => ({
        byOrg: (0, import_pg_core28.index)("invoices_org_idx").on(t.orgId),
        byPlayer: (0, import_pg_core28.index)("invoices_player_idx").on(t.playerId),
        bySeason: (0, import_pg_core28.index)("invoices_season_idx").on(t.seasonId),
        byStatus: (0, import_pg_core28.index)("invoices_status_idx").on(t.status),
        byDueDate: (0, import_pg_core28.index)("invoices_due_date_idx").on(t.dueDate),
        byStripeInvoice: (0, import_pg_core28.index)("invoices_stripe_idx").on(t.stripeInvoiceId)
      })
    );
    invoiceItemTypeEnum = (0, import_pg_core28.pgEnum)("invoice_item_type", [
      "membership",
      // season or monthly membership fee
      "registration",
      // one-time registration/tryout fee
      "tournament",
      // tournament entry fee
      "camp",
      // camp or clinic fee
      "uniform",
      // uniform / equipment
      "insurance",
      // player insurance
      "late_fee",
      // late payment fee
      "discount",
      // negative: discount applied
      "credit",
      // negative: credit/scholarship applied
      "other"
    ]);
    invoiceItems = (0, import_pg_core28.pgTable)(
      "invoice_items",
      {
        id: (0, import_pg_core28.uuid)("id").primaryKey().defaultRandom(),
        invoiceId: (0, import_pg_core28.uuid)("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
        orgId: (0, import_pg_core28.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        type: invoiceItemTypeEnum("type").notNull().default("membership"),
        description: (0, import_pg_core28.text)("description").notNull(),
        quantity: (0, import_pg_core28.integer)("quantity").notNull().default(1),
        unitAmount: (0, import_pg_core28.integer)("unit_amount").notNull(),
        // cents; negative for credits
        totalAmount: (0, import_pg_core28.integer)("total_amount").notNull(),
        // quantity * unitAmount
        // Link back to a plan or event if applicable
        membershipPlanId: (0, import_pg_core28.uuid)("membership_plan_id"),
        eventId: (0, import_pg_core28.uuid)("event_id"),
        sortOrder: (0, import_pg_core28.integer)("sort_order").notNull().default(0),
        createdAt: (0, import_pg_core28.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => ({
        byInvoice: (0, import_pg_core28.index)("invoice_items_invoice_idx").on(t.invoiceId),
        byOrg: (0, import_pg_core28.index)("invoice_items_org_idx").on(t.orgId)
      })
    );
    payments = (0, import_pg_core28.pgTable)(
      "payments",
      {
        id: (0, import_pg_core28.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core28.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        invoiceId: (0, import_pg_core28.uuid)("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
        playerId: (0, import_pg_core28.uuid)("player_id").notNull(),
        guardianUserId: (0, import_pg_core28.text)("guardian_user_id"),
        amount: (0, import_pg_core28.integer)("amount").notNull(),
        // cents
        method: paymentMethodEnum("method").notNull(),
        status: paymentStatusEnum("status").notNull().default("pending"),
        // Stripe fields
        stripePaymentIntentId: (0, import_pg_core28.text)("stripe_payment_intent_id"),
        stripeChargeId: (0, import_pg_core28.text)("stripe_charge_id"),
        // Manual payment tracking
        referenceNote: (0, import_pg_core28.text)("reference_note"),
        // e.g. "Check #1042", "Zelle conf: XYZ"
        recordedByUserId: (0, import_pg_core28.text)("recorded_by_user_id"),
        // who logged it (for manual)
        paidAt: (0, import_pg_core28.timestamp)("paid_at", { withTimezone: true }),
        failedAt: (0, import_pg_core28.timestamp)("failed_at", { withTimezone: true }),
        failureReason: (0, import_pg_core28.text)("failure_reason"),
        metadata: (0, import_pg_core28.jsonb)("metadata").notNull().default({}),
        createdAt: (0, import_pg_core28.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core28.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => ({
        byOrg: (0, import_pg_core28.index)("payments_org_idx").on(t.orgId),
        byInvoice: (0, import_pg_core28.index)("payments_invoice_idx").on(t.invoiceId),
        byPlayer: (0, import_pg_core28.index)("payments_player_idx").on(t.playerId),
        byStripe: (0, import_pg_core28.index)("payments_stripe_pi_idx").on(t.stripePaymentIntentId)
      })
    );
    paymentPlanStatusEnum = (0, import_pg_core28.pgEnum)("payment_plan_status", [
      "active",
      "completed",
      // all installments paid
      "defaulted",
      // missed payment(s)
      "cancelled"
    ]);
    paymentPlans = (0, import_pg_core28.pgTable)(
      "payment_plans",
      {
        id: (0, import_pg_core28.uuid)("id").primaryKey().defaultRandom(),
        orgId: (0, import_pg_core28.uuid)("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
        registrationId: (0, import_pg_core28.uuid)("registration_id").references(() => registrations.id, { onDelete: "set null" }),
        playerId: (0, import_pg_core28.uuid)("player_id").notNull(),
        totalAmount: (0, import_pg_core28.integer)("total_amount").notNull(),
        // cents; full amount
        installmentCount: (0, import_pg_core28.integer)("installment_count").notNull(),
        status: paymentPlanStatusEnum("status").notNull().default("active"),
        // First payment (deposit) may differ from equal installments
        depositAmount: (0, import_pg_core28.integer)("deposit_amount").notNull().default(0),
        // Schedule: array of {dueDate: ISO, amount: cents}
        schedule: (0, import_pg_core28.jsonb)("schedule").notNull().default([]),
        createdByUserId: (0, import_pg_core28.text)("created_by_user_id").notNull(),
        createdAt: (0, import_pg_core28.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: (0, import_pg_core28.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => ({
        byOrg: (0, import_pg_core28.index)("payment_plans_org_idx").on(t.orgId),
        byPlayer: (0, import_pg_core28.index)("payment_plans_player_idx").on(t.playerId),
        byRegistration: (0, import_pg_core28.index)("payment_plans_registration_idx").on(t.registrationId)
      })
    );
  }
});

// shared/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  analysisJobKindEnum: () => analysisJobKindEnum,
  analysisJobStatusEnum: () => analysisJobStatusEnum,
  analysisJobs: () => analysisJobs,
  annotationKindEnum: () => annotationKindEnum,
  annotationSourceEnum: () => annotationSourceEnum,
  annotations: () => annotations,
  announcementPriorityEnum: () => announcementPriorityEnum,
  announcements: () => announcements,
  assignmentStatusEnum: () => assignmentStatusEnum,
  assignments: () => assignments,
  attendanceStatusEnum: () => attendanceStatusEnum,
  audienceModeEnum: () => audienceModeEnum,
  availabilityResponseEnum: () => availabilityResponseEnum,
  coachingActionStatusEnum: () => coachingActionStatusEnum,
  coachingActionTypeEnum: () => coachingActionTypeEnum,
  coachingActions: () => coachingActions,
  deliveryStatusEnum: () => deliveryStatusEnum,
  eventAttendance: () => eventAttendance,
  eventAvailability: () => eventAvailability,
  eventStatusEnum: () => eventStatusEnum,
  eventTypeEnum: () => eventTypeEnum,
  events: () => events,
  filmAssetKindEnum: () => filmAssetKindEnum,
  filmAssetStatusEnum: () => filmAssetStatusEnum,
  filmAssets: () => filmAssets,
  filmSessionKindEnum: () => filmSessionKindEnum,
  filmSessionStatusEnum: () => filmSessionStatusEnum,
  filmSessions: () => filmSessions,
  guardianRelationshipEnum: () => guardianRelationshipEnum,
  idpCommentTypeEnum: () => idpCommentTypeEnum,
  idpComments: () => idpComments,
  idpDrillLinks: () => idpDrillLinks,
  idpFocusAreaStatusEnum: () => idpFocusAreaStatusEnum,
  idpFocusAreas: () => idpFocusAreas,
  idpMilestones: () => idpMilestones,
  idpStatusEnum: () => idpStatusEnum,
  idps: () => idps,
  injuryRecords: () => injuryRecords,
  injuryStatusEnum: () => injuryStatusEnum,
  invoiceItemTypeEnum: () => invoiceItemTypeEnum,
  invoiceItems: () => invoiceItems,
  invoiceStatusEnum: () => invoiceStatusEnum,
  invoices: () => invoices,
  membershipPlans: () => membershipPlans,
  messageRecipients: () => messageRecipients,
  messageThreads: () => messageThreads,
  messages: () => messages,
  opponents: () => opponents,
  orgMembers: () => orgMembers,
  orgPlanEnum: () => orgPlanEnum,
  orgRoleEnum: () => orgRoleEnum,
  orgs: () => orgs,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentPlanStatusEnum: () => paymentPlanStatusEnum,
  paymentPlans: () => paymentPlans,
  paymentStatusEnum: () => paymentStatusEnum,
  payments: () => payments,
  planStatusEnum: () => planStatusEnum,
  planTypeEnum: () => planTypeEnum,
  playerGuardians: () => playerGuardians,
  playerNoteTypeEnum: () => playerNoteTypeEnum,
  playerNotes: () => playerNotes,
  playerStatusEnum: () => playerStatusEnum,
  players: () => players,
  practicePlanStatusEnum: () => practicePlanStatusEnum,
  practicePlans: () => practicePlans,
  readinessCheckins: () => readinessCheckins,
  readinessOverrides: () => readinessOverrides,
  recipientTypeEnum: () => recipientTypeEnum,
  registrationStatusEnum: () => registrationStatusEnum,
  registrations: () => registrations,
  scoutReportStatusEnum: () => scoutReportStatusEnum,
  scoutReports: () => scoutReports,
  seasonStatusEnum: () => seasonStatusEnum,
  seasons: () => seasons,
  skillAssessments: () => skillAssessments,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  teamAgeGroupEnum: () => teamAgeGroupEnum,
  teamGenderEnum: () => teamGenderEnum,
  teamRoster: () => teamRoster,
  teamRosterStatusEnum: () => teamRosterStatusEnum,
  teams: () => teams,
  threadTypeEnum: () => threadTypeEnum,
  waiverCategoryEnum: () => waiverCategoryEnum,
  waiverSignatures: () => waiverSignatures,
  waiverStatusEnum: () => waiverStatusEnum,
  waiverTemplates: () => waiverTemplates,
  wearableConnectionStatusEnum: () => wearableConnectionStatusEnum,
  wearableConnections: () => wearableConnections,
  wearableMetrics: () => wearableMetrics,
  wearableProviderEnum: () => wearableProviderEnum,
  wearableSharing: () => wearableSharing
});
var init_schema = __esm({
  "shared/db/schema/index.ts"() {
    "use strict";
    init_enums();
    init_orgs();
    init_film_sessions();
    init_film_assets();
    init_analysis_jobs();
    init_annotations();
    init_players();
    init_events();
    init_assignments();
    init_practice_plans();
    init_idps();
    init_readiness();
    init_messages();
    init_wearables();
    init_guardians();
    init_player_notes();
    init_skill_assessments();
    init_injury_records();
    init_idp_structured();
    init_coaching_actions();
    init_readiness_overrides();
    init_opponents();
    init_scout_reports();
    init_announcements();
    init_waivers();
    init_seasons();
    init_memberships();
    init_billing();
  }
});

// shared/db/client.ts
var client_exports = {};
__export(client_exports, {
  getDb: () => getDb,
  resetDb: () => resetDb,
  schema: () => schema_exports
});
function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Set it in Vercel for Development/Preview/Production."
    );
  }
  const sql9 = (0, import_serverless.neon)(url);
  _db = (0, import_neon_http.drizzle)(sql9, { schema: schema_exports });
  return _db;
}
function resetDb() {
  _db = null;
}
var import_serverless, import_neon_http, _db;
var init_client = __esm({
  "shared/db/client.ts"() {
    "use strict";
    import_serverless = require("@neondatabase/serverless");
    import_neon_http = require("drizzle-orm/neon-http");
    init_schema();
    import_serverless.neonConfig.fetchConnectionCache = true;
    _db = null;
  }
});

// server/lib/sms.ts
function getClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio credentials not configured");
    twilioClient = (0, import_twilio.default)(sid, token);
  }
  return twilioClient;
}
async function sendSms(to, body) {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER not set");
  const normalized = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`;
  await getClient().messages.create({ to: normalized, from, body });
}
var import_twilio, twilioClient;
var init_sms = __esm({
  "server/lib/sms.ts"() {
    "use strict";
    import_twilio = __toESM(require("twilio"), 1);
    twilioClient = null;
  }
});

// server/lib/twilio.ts
var twilio_exports = {};
__export(twilio_exports, {
  sendSms: () => sendSms
});
var init_twilio = __esm({
  "server/lib/twilio.ts"() {
    "use strict";
    init_sms();
  }
});

// server/_vercel_entry.ts
var vercel_entry_exports = {};
__export(vercel_entry_exports, {
  default: () => vercel_entry_default
});
module.exports = __toCommonJS(vercel_entry_exports);

// server/app.ts
var import_express3 = __toESM(require("express"), 1);
var import_express4 = require("@clerk/express");
var import_express5 = require("inngest/express");

// server/auth/tenant.ts
var import_express = require("@clerk/express");
var import_drizzle_orm15 = require("drizzle-orm");

// shared/db/index.ts
init_client();
init_schema();
init_schema();

// shared/db/repository.ts
init_client();

// shared/db/repositories/film.ts
var import_drizzle_orm = require("drizzle-orm");
init_schema();
function createFilmRepository(db, ctx) {
  return {
    filmSessions: {
      async list(opts = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        const offset = opts.offset ?? 0;
        return db.select().from(filmSessions).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(filmSessions.orgId, ctx.orgId),
            (0, import_drizzle_orm.isNull)(filmSessions.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm.desc)(filmSessions.createdAt)).limit(limit).offset(offset);
      },
      async getById(id) {
        const rows = await db.select().from(filmSessions).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(filmSessions.id, id),
            (0, import_drizzle_orm.eq)(filmSessions.orgId, ctx.orgId),
            (0, import_drizzle_orm.isNull)(filmSessions.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async create(input) {
        const [row] = await db.insert(filmSessions).values({
          ...input,
          orgId: ctx.orgId,
          createdByUserId: ctx.userId
        }).returning();
        return row;
      },
      async softDelete(id) {
        await db.update(filmSessions).set({ deletedAt: /* @__PURE__ */ new Date() }).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(filmSessions.id, id),
            (0, import_drizzle_orm.eq)(filmSessions.orgId, ctx.orgId)
          )
        );
      },
      async update(id, patch) {
        await db.update(filmSessions).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where(
          (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(filmSessions.id, id), (0, import_drizzle_orm.eq)(filmSessions.orgId, ctx.orgId))
        );
      }
    },
    filmAssets: {
      async listForSession(sessionId) {
        return db.select().from(filmAssets).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(filmAssets.sessionId, sessionId),
            (0, import_drizzle_orm.eq)(filmAssets.orgId, ctx.orgId),
            (0, import_drizzle_orm.isNull)(filmAssets.deletedAt)
          )
        );
      },
      async create(input) {
        const [row] = await db.insert(filmAssets).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async getById(id) {
        const rows = await db.select().from(filmAssets).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(filmAssets.id, id),
            (0, import_drizzle_orm.eq)(filmAssets.orgId, ctx.orgId),
            (0, import_drizzle_orm.isNull)(filmAssets.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async update(id, patch) {
        await db.update(filmAssets).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(filmAssets.id, id), (0, import_drizzle_orm.eq)(filmAssets.orgId, ctx.orgId)));
      }
    },
    analysisJobs: {
      async listForSession(sessionId) {
        return db.select().from(analysisJobs).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(analysisJobs.sessionId, sessionId),
            (0, import_drizzle_orm.eq)(analysisJobs.orgId, ctx.orgId),
            (0, import_drizzle_orm.isNull)(analysisJobs.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm.desc)(analysisJobs.createdAt));
      },
      async enqueue(input) {
        const [row] = await db.insert(analysisJobs).values({ ...input, orgId: ctx.orgId, status: "queued" }).returning();
        return row;
      }
    },
    annotations: {
      async listForSession(sessionId) {
        return db.select().from(annotations).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(annotations.sessionId, sessionId),
            (0, import_drizzle_orm.eq)(annotations.orgId, ctx.orgId),
            (0, import_drizzle_orm.isNull)(annotations.deletedAt)
          )
        ).orderBy(annotations.startMs);
      },
      async create(input) {
        const [row] = await db.insert(annotations).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      }
    }
  };
}

// shared/db/repositories/roster.ts
var import_drizzle_orm2 = require("drizzle-orm");
init_schema();
function createRosterRepository(db, ctx) {
  return {
    orgMembers: {
      async getMembership() {
        const rows = await db.select().from(orgMembers).where(
          (0, import_drizzle_orm2.and)(
            (0, import_drizzle_orm2.eq)(orgMembers.orgId, ctx.orgId),
            (0, import_drizzle_orm2.eq)(orgMembers.userId, ctx.userId),
            (0, import_drizzle_orm2.isNull)(orgMembers.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      }
    },
    players: {
      async list(opts = {}) {
        const limit = Math.min(opts.limit ?? 100, 500);
        const offset = opts.offset ?? 0;
        return db.select().from(players).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(players.orgId, ctx.orgId), (0, import_drizzle_orm2.isNull)(players.deletedAt))).orderBy(players.name).limit(limit).offset(offset);
      },
      async listActive() {
        return db.select().from(players).where(
          (0, import_drizzle_orm2.and)(
            (0, import_drizzle_orm2.eq)(players.orgId, ctx.orgId),
            (0, import_drizzle_orm2.eq)(players.status, "active"),
            (0, import_drizzle_orm2.isNull)(players.deletedAt)
          )
        ).orderBy(players.name);
      },
      async getById(id) {
        const rows = await db.select().from(players).where(
          (0, import_drizzle_orm2.and)(
            (0, import_drizzle_orm2.eq)(players.id, id),
            (0, import_drizzle_orm2.eq)(players.orgId, ctx.orgId),
            (0, import_drizzle_orm2.isNull)(players.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async create(input) {
        const [row] = await db.insert(players).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async update(id, patch) {
        await db.update(players).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(players.id, id), (0, import_drizzle_orm2.eq)(players.orgId, ctx.orgId)));
      },
      async softDelete(id) {
        await db.update(players).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(players.id, id), (0, import_drizzle_orm2.eq)(players.orgId, ctx.orgId)));
      }
    }
  };
}

// shared/db/repositories/events.ts
var import_drizzle_orm3 = require("drizzle-orm");
init_schema();
function createEventsRepository(db, ctx) {
  return {
    events: {
      async list(opts = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        const conditions = [
          (0, import_drizzle_orm3.eq)(events.orgId, ctx.orgId),
          (0, import_drizzle_orm3.isNull)(events.deletedAt)
        ];
        if (opts.from) {
          conditions.push((0, import_drizzle_orm3.gte)(events.startsAt, opts.from));
        }
        return db.select().from(events).where((0, import_drizzle_orm3.and)(...conditions)).orderBy(events.startsAt).limit(limit);
      },
      async getById(id) {
        const rows = await db.select().from(events).where(
          (0, import_drizzle_orm3.and)(
            (0, import_drizzle_orm3.eq)(events.id, id),
            (0, import_drizzle_orm3.eq)(events.orgId, ctx.orgId),
            (0, import_drizzle_orm3.isNull)(events.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async create(input) {
        const [row] = await db.insert(events).values({
          ...input,
          orgId: ctx.orgId,
          createdByUserId: ctx.userId
        }).returning();
        return row;
      },
      async update(id, patch) {
        await db.update(events).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(events.id, id), (0, import_drizzle_orm3.eq)(events.orgId, ctx.orgId)));
      },
      async softDelete(id) {
        await db.update(events).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(events.id, id), (0, import_drizzle_orm3.eq)(events.orgId, ctx.orgId)));
      },
      /** Upcoming events from now onwards (used by parent portal). */
      async listUpcoming(limit = 50) {
        return db.select().from(events).where(
          (0, import_drizzle_orm3.and)(
            (0, import_drizzle_orm3.eq)(events.orgId, ctx.orgId),
            (0, import_drizzle_orm3.isNull)(events.deletedAt),
            (0, import_drizzle_orm3.gte)(events.startsAt, /* @__PURE__ */ new Date())
          )
        ).orderBy(events.startsAt).limit(limit);
      },
      /** Attendance records for a specific player (used by parent portal). */
      async listAttendanceForPlayer(playerId, limit = 50) {
        return db.select({
          id: eventAttendance.id,
          eventId: eventAttendance.eventId,
          playerId: eventAttendance.playerId,
          status: eventAttendance.status,
          note: eventAttendance.note,
          recordedAt: eventAttendance.recordedAt,
          eventTitle: events.title,
          eventDate: events.startsAt
        }).from(eventAttendance).innerJoin(events, (0, import_drizzle_orm3.eq)(eventAttendance.eventId, events.id)).where(
          (0, import_drizzle_orm3.and)(
            (0, import_drizzle_orm3.eq)(eventAttendance.orgId, ctx.orgId),
            (0, import_drizzle_orm3.eq)(eventAttendance.playerId, playerId)
          )
        ).orderBy((0, import_drizzle_orm3.desc)(events.startsAt)).limit(limit);
      },
      /** Upsert an availability/RSVP for a player (used by parent portal). */
      async upsertAvailability(input) {
        const [row] = await db.insert(eventAvailability).values({
          eventId: input.eventId,
          playerId: input.playerId,
          orgId: ctx.orgId,
          response: input.status,
          note: input.note,
          respondedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: [eventAvailability.eventId, eventAvailability.playerId],
          set: {
            response: input.status,
            note: input.note,
            respondedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return row;
      }
    },
    eventAvailability: {
      async listForEvent(eventId) {
        return db.select().from(eventAvailability).where(
          (0, import_drizzle_orm3.and)(
            (0, import_drizzle_orm3.eq)(eventAvailability.eventId, eventId),
            (0, import_drizzle_orm3.eq)(eventAvailability.orgId, ctx.orgId)
          )
        );
      },
      async upsert(input) {
        const [row] = await db.insert(eventAvailability).values({ ...input, orgId: ctx.orgId }).onConflictDoUpdate({
          target: [eventAvailability.eventId, eventAvailability.playerId],
          set: {
            response: input.response,
            note: input.note,
            respondedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return row;
      }
    },
    eventAttendance: {
      async listForEvent(eventId) {
        return db.select().from(eventAttendance).where(
          (0, import_drizzle_orm3.and)(
            (0, import_drizzle_orm3.eq)(eventAttendance.eventId, eventId),
            (0, import_drizzle_orm3.eq)(eventAttendance.orgId, ctx.orgId)
          )
        );
      },
      async upsertBulk(eventId, records) {
        if (records.length === 0) return [];
        const values = records.map((r) => ({
          eventId,
          playerId: r.playerId,
          orgId: ctx.orgId,
          status: r.status,
          note: r.note,
          recordedByUserId: r.recordedByUserId
        }));
        return db.insert(eventAttendance).values(values).onConflictDoUpdate({
          target: [eventAttendance.eventId, eventAttendance.playerId],
          set: {
            status: import_drizzle_orm3.sql`excluded.status`,
            note: import_drizzle_orm3.sql`excluded.note`,
            recordedByUserId: import_drizzle_orm3.sql`excluded.recorded_by_user_id`,
            recordedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
      }
    }
  };
}

// shared/db/repositories/assignments.ts
var import_drizzle_orm4 = require("drizzle-orm");
init_schema();
function createAssignmentsRepository(db, ctx) {
  return {
    assignments: {
      async listForPlayer(playerId) {
        return db.select().from(assignments).where(
          (0, import_drizzle_orm4.and)(
            (0, import_drizzle_orm4.eq)(assignments.orgId, ctx.orgId),
            (0, import_drizzle_orm4.eq)(assignments.playerId, playerId),
            (0, import_drizzle_orm4.isNull)(assignments.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm4.desc)(assignments.createdAt));
      },
      async list(opts = {}) {
        const conditions = [
          (0, import_drizzle_orm4.eq)(assignments.orgId, ctx.orgId),
          (0, import_drizzle_orm4.isNull)(assignments.deletedAt)
        ];
        if (opts.playerId) {
          conditions.push((0, import_drizzle_orm4.eq)(assignments.playerId, opts.playerId));
        }
        if (opts.status) {
          conditions.push(
            (0, import_drizzle_orm4.eq)(assignments.status, opts.status)
          );
        }
        return db.select().from(assignments).where((0, import_drizzle_orm4.and)(...conditions)).orderBy((0, import_drizzle_orm4.desc)(assignments.createdAt));
      },
      async getById(id) {
        const rows = await db.select().from(assignments).where(
          (0, import_drizzle_orm4.and)(
            (0, import_drizzle_orm4.eq)(assignments.id, id),
            (0, import_drizzle_orm4.eq)(assignments.orgId, ctx.orgId),
            (0, import_drizzle_orm4.isNull)(assignments.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async create(input) {
        const [row] = await db.insert(assignments).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async update(id, patch) {
        await db.update(assignments).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm4.and)((0, import_drizzle_orm4.eq)(assignments.id, id), (0, import_drizzle_orm4.eq)(assignments.orgId, ctx.orgId)));
      },
      async softDelete(id) {
        await db.update(assignments).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm4.and)((0, import_drizzle_orm4.eq)(assignments.id, id), (0, import_drizzle_orm4.eq)(assignments.orgId, ctx.orgId)));
      },
      async complianceByPlayer() {
        const rows = await db.select({
          playerId: assignments.playerId,
          total: import_drizzle_orm4.sql`count(*)::int`,
          completed: import_drizzle_orm4.sql`count(*) filter (where ${assignments.status} in ('submitted','reviewed'))::int`
        }).from(assignments).where((0, import_drizzle_orm4.and)((0, import_drizzle_orm4.eq)(assignments.orgId, ctx.orgId), (0, import_drizzle_orm4.isNull)(assignments.deletedAt))).groupBy(assignments.playerId);
        return rows.map((r) => ({
          playerId: r.playerId,
          total: r.total,
          completed: r.completed,
          rate: r.total > 0 ? r.completed / r.total : 0
        }));
      }
    }
  };
}

// shared/db/repositories/practice.ts
var import_drizzle_orm5 = require("drizzle-orm");
init_schema();
function createPracticeRepository(db, ctx) {
  return {
    practicePlans: {
      async list(opts = {}) {
        const limit = Math.min(opts.limit ?? 50, 200);
        return db.select().from(practicePlans).where(
          (0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(practicePlans.orgId, ctx.orgId), (0, import_drizzle_orm5.isNull)(practicePlans.deletedAt))
        ).orderBy((0, import_drizzle_orm5.desc)(practicePlans.createdAt)).limit(limit);
      },
      async getById(id) {
        const rows = await db.select().from(practicePlans).where(
          (0, import_drizzle_orm5.and)(
            (0, import_drizzle_orm5.eq)(practicePlans.id, id),
            (0, import_drizzle_orm5.eq)(practicePlans.orgId, ctx.orgId),
            (0, import_drizzle_orm5.isNull)(practicePlans.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async create(input) {
        const [row] = await db.insert(practicePlans).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async update(id, patch) {
        await db.update(practicePlans).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(practicePlans.id, id), (0, import_drizzle_orm5.eq)(practicePlans.orgId, ctx.orgId)));
      },
      async softDelete(id) {
        await db.update(practicePlans).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(practicePlans.id, id), (0, import_drizzle_orm5.eq)(practicePlans.orgId, ctx.orgId)));
      }
    }
  };
}

// shared/db/repositories/readiness.ts
var import_drizzle_orm6 = require("drizzle-orm");
init_schema();
function createReadinessRepository(db, ctx) {
  return {
    readiness: {
      async listToday(date2) {
        const d = date2 ?? /* @__PURE__ */ new Date();
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return db.select().from(readinessCheckins).where(
          (0, import_drizzle_orm6.and)(
            (0, import_drizzle_orm6.eq)(readinessCheckins.orgId, ctx.orgId),
            (0, import_drizzle_orm6.gte)(readinessCheckins.checkedInAt, start),
            import_drizzle_orm6.sql`${readinessCheckins.checkedInAt} <= ${end}`
          )
        ).orderBy((0, import_drizzle_orm6.desc)(readinessCheckins.checkedInAt));
      },
      async listForPlayer(playerId, days = 30) {
        const since = /* @__PURE__ */ new Date();
        since.setDate(since.getDate() - days);
        return db.select().from(readinessCheckins).where(
          (0, import_drizzle_orm6.and)(
            (0, import_drizzle_orm6.eq)(readinessCheckins.orgId, ctx.orgId),
            (0, import_drizzle_orm6.eq)(readinessCheckins.playerId, playerId),
            (0, import_drizzle_orm6.gte)(readinessCheckins.checkedInAt, since)
          )
        ).orderBy((0, import_drizzle_orm6.desc)(readinessCheckins.checkedInAt));
      },
      async create(input) {
        const [row] = await db.insert(readinessCheckins).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      }
    },
    readinessOverrides: {
      async listActive(orgId) {
        return db.select().from(readinessOverrides).where(
          (0, import_drizzle_orm6.and)(
            (0, import_drizzle_orm6.eq)(readinessOverrides.orgId, orgId),
            (0, import_drizzle_orm6.gte)(readinessOverrides.expiresAt, /* @__PURE__ */ new Date())
          )
        );
      },
      async upsert(input) {
        const existing = await db.select().from(readinessOverrides).where(
          (0, import_drizzle_orm6.and)(
            (0, import_drizzle_orm6.eq)(readinessOverrides.orgId, input.orgId),
            (0, import_drizzle_orm6.eq)(readinessOverrides.playerId, input.playerId)
          )
        ).limit(1);
        if (existing[0]) {
          const [row2] = await db.update(readinessOverrides).set({ status: input.status, note: input.note, expiresAt: input.expiresAt, coachUserId: input.coachUserId }).where((0, import_drizzle_orm6.eq)(readinessOverrides.id, existing[0].id)).returning();
          return row2;
        }
        const [row] = await db.insert(readinessOverrides).values(input).returning();
        return row;
      },
      async remove(orgId, playerId) {
        await db.delete(readinessOverrides).where(
          (0, import_drizzle_orm6.and)(
            (0, import_drizzle_orm6.eq)(readinessOverrides.orgId, orgId),
            (0, import_drizzle_orm6.eq)(readinessOverrides.playerId, playerId)
          )
        );
      }
    }
  };
}

// shared/db/repositories/messaging.ts
var import_drizzle_orm7 = require("drizzle-orm");
init_schema();
function createMessagingRepository(db, ctx) {
  return {
    messages: {
      async listThreads() {
        return db.select().from(messageThreads).where(
          (0, import_drizzle_orm7.and)((0, import_drizzle_orm7.eq)(messageThreads.orgId, ctx.orgId), (0, import_drizzle_orm7.isNull)(messageThreads.deletedAt))
        ).orderBy((0, import_drizzle_orm7.desc)(messageThreads.createdAt));
      },
      async getThread(threadId) {
        const rows = await db.select().from(messageThreads).where(
          (0, import_drizzle_orm7.and)(
            (0, import_drizzle_orm7.eq)(messageThreads.id, threadId),
            (0, import_drizzle_orm7.eq)(messageThreads.orgId, ctx.orgId),
            (0, import_drizzle_orm7.isNull)(messageThreads.deletedAt)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async createThread(input) {
        const [row] = await db.insert(messageThreads).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async listMessages(threadId) {
        return db.select().from(messages).where(
          (0, import_drizzle_orm7.and)(
            (0, import_drizzle_orm7.eq)(messages.threadId, threadId),
            (0, import_drizzle_orm7.eq)(messages.orgId, ctx.orgId),
            (0, import_drizzle_orm7.isNull)(messages.deletedAt)
          )
        ).orderBy(messages.sentAt);
      },
      async createMessage(input) {
        const [row] = await db.insert(messages).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      }
    }
  };
}

// shared/db/repositories/wearables.ts
var import_drizzle_orm8 = require("drizzle-orm");
init_schema();
function createWearablesRepository(db, ctx) {
  return {
    wearableConnections: {
      async list(opts = {}) {
        const conditions = [
          (0, import_drizzle_orm8.eq)(wearableConnections.orgId, ctx.orgId),
          (0, import_drizzle_orm8.isNull)(wearableConnections.deletedAt)
        ];
        if (opts.playerId) {
          conditions.push((0, import_drizzle_orm8.eq)(wearableConnections.playerId, opts.playerId));
        }
        return db.select().from(wearableConnections).where((0, import_drizzle_orm8.and)(...conditions)).orderBy((0, import_drizzle_orm8.desc)(wearableConnections.createdAt));
      },
      async getByPlayer(playerId) {
        return db.select().from(wearableConnections).where(
          (0, import_drizzle_orm8.and)(
            (0, import_drizzle_orm8.eq)(wearableConnections.orgId, ctx.orgId),
            (0, import_drizzle_orm8.eq)(wearableConnections.playerId, playerId),
            (0, import_drizzle_orm8.isNull)(wearableConnections.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm8.desc)(wearableConnections.createdAt));
      },
      async upsertConnection(input) {
        const [row] = await db.insert(wearableConnections).values({ ...input, orgId: ctx.orgId }).onConflictDoUpdate({
          target: [
            wearableConnections.orgId,
            wearableConnections.playerId,
            wearableConnections.provider
          ],
          set: {
            status: input.status ?? "pending",
            providerUserId: input.providerUserId,
            accessToken: input.accessToken,
            refreshToken: input.refreshToken,
            tokenExpiresAt: input.tokenExpiresAt,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return row;
      },
      async updateStatus(id, status, extra) {
        await db.update(wearableConnections).set({
          status,
          ...extra?.lastSyncedAt ? { lastSyncedAt: extra.lastSyncedAt } : {},
          updatedAt: /* @__PURE__ */ new Date()
        }).where(
          (0, import_drizzle_orm8.and)(
            (0, import_drizzle_orm8.eq)(wearableConnections.id, id),
            (0, import_drizzle_orm8.eq)(wearableConnections.orgId, ctx.orgId)
          )
        );
      },
      async disconnect(id) {
        await db.update(wearableConnections).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(
          (0, import_drizzle_orm8.and)(
            (0, import_drizzle_orm8.eq)(wearableConnections.id, id),
            (0, import_drizzle_orm8.eq)(wearableConnections.orgId, ctx.orgId)
          )
        );
      }
    },
    wearableMetrics: {
      async getLatest(playerId) {
        const since = /* @__PURE__ */ new Date();
        since.setDate(since.getDate() - 7);
        return db.select().from(wearableMetrics).where(
          (0, import_drizzle_orm8.and)(
            (0, import_drizzle_orm8.eq)(wearableMetrics.orgId, ctx.orgId),
            (0, import_drizzle_orm8.eq)(wearableMetrics.playerId, playerId),
            (0, import_drizzle_orm8.gte)(wearableMetrics.recordedDate, since.toISOString().slice(0, 10))
          )
        ).orderBy((0, import_drizzle_orm8.desc)(wearableMetrics.recordedDate)).limit(20);
      },
      async getHistory(playerId, days = 30) {
        const since = /* @__PURE__ */ new Date();
        since.setDate(since.getDate() - days);
        return db.select().from(wearableMetrics).where(
          (0, import_drizzle_orm8.and)(
            (0, import_drizzle_orm8.eq)(wearableMetrics.orgId, ctx.orgId),
            (0, import_drizzle_orm8.eq)(wearableMetrics.playerId, playerId),
            (0, import_drizzle_orm8.gte)(wearableMetrics.recordedDate, since.toISOString().slice(0, 10))
          )
        ).orderBy((0, import_drizzle_orm8.desc)(wearableMetrics.recordedDate));
      },
      async upsert(input) {
        const [row] = await db.insert(wearableMetrics).values({ ...input, orgId: ctx.orgId }).onConflictDoUpdate({
          target: [
            wearableMetrics.playerId,
            wearableMetrics.provider,
            wearableMetrics.recordedDate
          ],
          set: {
            recoveryScore: input.recoveryScore,
            hrv: input.hrv,
            restingHr: input.restingHr,
            sleepScore: input.sleepScore,
            sleepDurationMins: input.sleepDurationMins,
            deepSleepMins: input.deepSleepMins,
            remSleepMins: input.remSleepMins,
            strainScore: input.strainScore,
            steps: input.steps,
            activeCalories: input.activeCalories,
            rawPayload: input.rawPayload
          }
        }).returning();
        return row;
      }
    },
    wearableSharing: {
      async get(playerId) {
        const rows = await db.select().from(wearableSharing).where(
          (0, import_drizzle_orm8.and)(
            (0, import_drizzle_orm8.eq)(wearableSharing.orgId, ctx.orgId),
            (0, import_drizzle_orm8.eq)(wearableSharing.playerId, playerId)
          )
        ).limit(1);
        return rows[0] ?? null;
      },
      async upsert(playerId, settings) {
        const [row] = await db.insert(wearableSharing).values({ playerId, orgId: ctx.orgId, ...settings }).onConflictDoUpdate({
          target: [wearableSharing.orgId, wearableSharing.playerId],
          set: { ...settings, updatedAt: /* @__PURE__ */ new Date() }
        }).returning();
        return row;
      },
      async canCoachView(playerId) {
        const rows = await db.select({ shareWithCoaches: wearableSharing.shareWithCoaches }).from(wearableSharing).where(
          (0, import_drizzle_orm8.and)(
            (0, import_drizzle_orm8.eq)(wearableSharing.orgId, ctx.orgId),
            (0, import_drizzle_orm8.eq)(wearableSharing.playerId, playerId)
          )
        ).limit(1);
        return rows[0]?.shareWithCoaches ?? false;
      }
    }
  };
}

// shared/db/repositories/player-notes.ts
var import_drizzle_orm9 = require("drizzle-orm");
init_schema();
function createPlayerNotesRepository(db, ctx) {
  return {
    playerNotes: {
      async listForPlayer(playerId, limit = 50) {
        return db.select().from(playerNotes).where(
          (0, import_drizzle_orm9.and)(
            (0, import_drizzle_orm9.eq)(playerNotes.orgId, ctx.orgId),
            (0, import_drizzle_orm9.eq)(playerNotes.playerId, playerId),
            (0, import_drizzle_orm9.isNull)(playerNotes.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm9.desc)(playerNotes.createdAt)).limit(Math.min(limit, 200));
      },
      async create(input) {
        const [row] = await db.insert(playerNotes).values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId }).returning();
        return row;
      },
      async softDelete(id) {
        await db.update(playerNotes).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm9.and)((0, import_drizzle_orm9.eq)(playerNotes.id, id), (0, import_drizzle_orm9.eq)(playerNotes.orgId, ctx.orgId)));
      },
      async togglePin(id, isPinned) {
        await db.update(playerNotes).set({ isPinned, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm9.and)((0, import_drizzle_orm9.eq)(playerNotes.id, id), (0, import_drizzle_orm9.eq)(playerNotes.orgId, ctx.orgId)));
      }
    },
    skillAssessments: {
      async listForPlayer(playerId, limit = 100) {
        return db.select().from(skillAssessments).where(
          (0, import_drizzle_orm9.and)(
            (0, import_drizzle_orm9.eq)(skillAssessments.orgId, ctx.orgId),
            (0, import_drizzle_orm9.eq)(skillAssessments.playerId, playerId)
          )
        ).orderBy((0, import_drizzle_orm9.desc)(skillAssessments.assessedAt)).limit(Math.min(limit, 500));
      },
      async create(input) {
        const [row] = await db.insert(skillAssessments).values({ ...input, orgId: ctx.orgId, assessedByUserId: ctx.userId }).returning();
        return row;
      }
    },
    injuries: {
      async listActive() {
        return db.select().from(injuryRecords).where(
          (0, import_drizzle_orm9.and)(
            (0, import_drizzle_orm9.eq)(injuryRecords.orgId, ctx.orgId),
            (0, import_drizzle_orm9.isNull)(injuryRecords.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm9.desc)(injuryRecords.injuredAt));
      }
    },
    injuryRecords: {
      async listForPlayer(playerId) {
        return db.select().from(injuryRecords).where(
          (0, import_drizzle_orm9.and)(
            (0, import_drizzle_orm9.eq)(injuryRecords.orgId, ctx.orgId),
            (0, import_drizzle_orm9.eq)(injuryRecords.playerId, playerId),
            (0, import_drizzle_orm9.isNull)(injuryRecords.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm9.desc)(injuryRecords.injuredAt));
      },
      async create(input) {
        const [row] = await db.insert(injuryRecords).values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId }).returning();
        return row;
      },
      async update(id, patch) {
        await db.update(injuryRecords).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm9.and)((0, import_drizzle_orm9.eq)(injuryRecords.id, id), (0, import_drizzle_orm9.eq)(injuryRecords.orgId, ctx.orgId)));
      },
      async softDelete(id) {
        await db.update(injuryRecords).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm9.and)((0, import_drizzle_orm9.eq)(injuryRecords.id, id), (0, import_drizzle_orm9.eq)(injuryRecords.orgId, ctx.orgId)));
      }
    }
  };
}

// shared/db/repositories/idp.ts
var import_drizzle_orm10 = require("drizzle-orm");
init_schema();
function createIdpRepository(db, ctx) {
  return {
    idpFocusAreas: {
      async listForIdp(idpId) {
        return db.select().from(idpFocusAreas).where(
          (0, import_drizzle_orm10.and)(
            (0, import_drizzle_orm10.eq)(idpFocusAreas.idpId, idpId),
            (0, import_drizzle_orm10.eq)(idpFocusAreas.orgId, ctx.orgId),
            (0, import_drizzle_orm10.isNull)(idpFocusAreas.deletedAt)
          )
        ).orderBy(idpFocusAreas.priority);
      },
      async listForPlayer(playerId) {
        return db.select().from(idpFocusAreas).where(
          (0, import_drizzle_orm10.and)(
            (0, import_drizzle_orm10.eq)(idpFocusAreas.playerId, playerId),
            (0, import_drizzle_orm10.eq)(idpFocusAreas.orgId, ctx.orgId),
            (0, import_drizzle_orm10.isNull)(idpFocusAreas.deletedAt)
          )
        ).orderBy(idpFocusAreas.priority);
      },
      async create(input) {
        const [row] = await db.insert(idpFocusAreas).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async update(id, patch) {
        await db.update(idpFocusAreas).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(idpFocusAreas.id, id), (0, import_drizzle_orm10.eq)(idpFocusAreas.orgId, ctx.orgId)));
      },
      async softDelete(id) {
        await db.update(idpFocusAreas).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(idpFocusAreas.id, id), (0, import_drizzle_orm10.eq)(idpFocusAreas.orgId, ctx.orgId)));
      }
    },
    idpMilestones: {
      async listForFocusArea(focusAreaId) {
        return db.select().from(idpMilestones).where(
          (0, import_drizzle_orm10.and)(
            (0, import_drizzle_orm10.eq)(idpMilestones.focusAreaId, focusAreaId),
            (0, import_drizzle_orm10.eq)(idpMilestones.orgId, ctx.orgId)
          )
        ).orderBy(idpMilestones.createdAt);
      },
      async create(input) {
        const [row] = await db.insert(idpMilestones).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async complete(id) {
        await db.update(idpMilestones).set({ completedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(idpMilestones.id, id), (0, import_drizzle_orm10.eq)(idpMilestones.orgId, ctx.orgId)));
      },
      async unComplete(id) {
        await db.update(idpMilestones).set({ completedAt: null }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(idpMilestones.id, id), (0, import_drizzle_orm10.eq)(idpMilestones.orgId, ctx.orgId)));
      }
    },
    idpDrillLinks: {
      async listForFocusArea(focusAreaId) {
        return db.select().from(idpDrillLinks).where(
          (0, import_drizzle_orm10.and)(
            (0, import_drizzle_orm10.eq)(idpDrillLinks.focusAreaId, focusAreaId),
            (0, import_drizzle_orm10.eq)(idpDrillLinks.orgId, ctx.orgId),
            (0, import_drizzle_orm10.isNull)(idpDrillLinks.deletedAt)
          )
        ).orderBy(idpDrillLinks.createdAt);
      },
      async create(input) {
        const [row] = await db.insert(idpDrillLinks).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async softDelete(id) {
        await db.update(idpDrillLinks).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(idpDrillLinks.id, id), (0, import_drizzle_orm10.eq)(idpDrillLinks.orgId, ctx.orgId)));
      }
    },
    idpComments: {
      async listForIdp(idpId) {
        return db.select().from(idpComments).where(
          (0, import_drizzle_orm10.and)(
            (0, import_drizzle_orm10.eq)(idpComments.idpId, idpId),
            (0, import_drizzle_orm10.eq)(idpComments.orgId, ctx.orgId),
            (0, import_drizzle_orm10.isNull)(idpComments.deletedAt)
          )
        ).orderBy((0, import_drizzle_orm10.desc)(idpComments.createdAt));
      },
      async create(input) {
        const [row] = await db.insert(idpComments).values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId }).returning();
        return row;
      },
      async softDelete(id) {
        await db.update(idpComments).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(idpComments.id, id), (0, import_drizzle_orm10.eq)(idpComments.orgId, ctx.orgId)));
      }
    },
    coachingActions: {
      async listForSession(sessionId) {
        return db.select().from(coachingActions).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(coachingActions.sessionId, sessionId), (0, import_drizzle_orm10.eq)(coachingActions.orgId, ctx.orgId))).orderBy((0, import_drizzle_orm10.desc)(coachingActions.createdAt));
      },
      async listForPlayer(playerId, limit = 50) {
        return db.select().from(coachingActions).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(coachingActions.playerId, playerId), (0, import_drizzle_orm10.eq)(coachingActions.orgId, ctx.orgId))).orderBy((0, import_drizzle_orm10.desc)(coachingActions.createdAt)).limit(Math.min(limit, 200));
      },
      async listOpen() {
        return db.select().from(coachingActions).where(
          (0, import_drizzle_orm10.and)(
            (0, import_drizzle_orm10.eq)(coachingActions.orgId, ctx.orgId),
            (0, import_drizzle_orm10.eq)(coachingActions.status, "open")
          )
        ).orderBy((0, import_drizzle_orm10.desc)(coachingActions.createdAt));
      },
      async create(input) {
        const [row] = await db.insert(coachingActions).values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId }).returning();
        return row;
      },
      async updateStatus(id, status, patch) {
        await db.update(coachingActions).set({
          status,
          updatedAt: /* @__PURE__ */ new Date(),
          ...status === "resolved" ? { resolvedAt: /* @__PURE__ */ new Date() } : {},
          ...patch
        }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(coachingActions.id, id), (0, import_drizzle_orm10.eq)(coachingActions.orgId, ctx.orgId)));
      }
    }
  };
}

// shared/db/repositories/guardian.ts
var import_drizzle_orm11 = require("drizzle-orm");
init_schema();
function createGuardianRepository(db, ctx) {
  return {
    guardians: {
      /** All guardian rows for a specific player (coach / admin view). */
      async listForPlayer(playerId) {
        return db.select().from(playerGuardians).where(
          (0, import_drizzle_orm11.and)(
            (0, import_drizzle_orm11.eq)(playerGuardians.orgId, ctx.orgId),
            (0, import_drizzle_orm11.eq)(playerGuardians.playerId, playerId),
            (0, import_drizzle_orm11.isNull)(playerGuardians.deletedAt)
          )
        );
      },
      /** All players the authenticated guardian user can access. */
      async listPlayersForGuardian(guardianUserId) {
        return db.select().from(playerGuardians).where(
          (0, import_drizzle_orm11.and)(
            (0, import_drizzle_orm11.eq)(playerGuardians.orgId, ctx.orgId),
            (0, import_drizzle_orm11.eq)(playerGuardians.guardianUserId, guardianUserId),
            (0, import_drizzle_orm11.isNull)(playerGuardians.deletedAt)
          )
        );
      },
      /** Single access-check: returns the row or null. */
      async findRelationship(guardianUserId, playerId) {
        const [row] = await db.select().from(playerGuardians).where(
          (0, import_drizzle_orm11.and)(
            (0, import_drizzle_orm11.eq)(playerGuardians.orgId, ctx.orgId),
            (0, import_drizzle_orm11.eq)(playerGuardians.guardianUserId, guardianUserId),
            (0, import_drizzle_orm11.eq)(playerGuardians.playerId, playerId),
            (0, import_drizzle_orm11.isNull)(playerGuardians.deletedAt)
          )
        ).limit(1);
        return row ?? null;
      },
      async linkUser(guardianId, guardianUserId) {
        await db.update(playerGuardians).set({ guardianUserId }).where(
          (0, import_drizzle_orm11.and)(
            (0, import_drizzle_orm11.eq)(playerGuardians.id, guardianId),
            (0, import_drizzle_orm11.eq)(playerGuardians.orgId, ctx.orgId)
          )
        );
      }
    }
  };
}

// shared/db/repositories/comms.ts
var import_drizzle_orm12 = require("drizzle-orm");
init_schema();
function createCommsRepository(db, ctx) {
  return {
    announcements: {
      /**
       * List announcements visible to a given org role.
       * audienceRoles IS NULL means "everyone"; otherwise the role must appear in the array.
       * This filter runs IN THE DATABASE — never send restricted rows to the client.
       */
      async listForRole(role) {
        return db.select().from(announcements).where(
          (0, import_drizzle_orm12.and)(
            (0, import_drizzle_orm12.eq)(announcements.orgId, ctx.orgId),
            (0, import_drizzle_orm12.isNull)(announcements.deletedAt),
            import_drizzle_orm12.sql`(${announcements.audienceRoles} IS NULL OR ${role} = ANY(${announcements.audienceRoles}))`
          )
        ).orderBy((0, import_drizzle_orm12.desc)(announcements.publishedAt));
      },
      async create(input) {
        const [row] = await db.insert(announcements).values({ ...input, orgId: ctx.orgId, authorUserId: ctx.userId }).returning();
        return row;
      },
      async pin(id, pinned) {
        await db.update(announcements).set({ pinned, updatedAt: /* @__PURE__ */ new Date() }).where(
          (0, import_drizzle_orm12.and)(
            (0, import_drizzle_orm12.eq)(announcements.id, id),
            (0, import_drizzle_orm12.eq)(announcements.orgId, ctx.orgId)
          )
        );
      },
      async softDelete(id) {
        await db.update(announcements).set({ deletedAt: /* @__PURE__ */ new Date() }).where(
          (0, import_drizzle_orm12.and)(
            (0, import_drizzle_orm12.eq)(announcements.id, id),
            (0, import_drizzle_orm12.eq)(announcements.orgId, ctx.orgId)
          )
        );
      }
    },
    waivers: {
      async listTemplates() {
        return db.select().from(waiverTemplates).where(
          (0, import_drizzle_orm12.and)(
            (0, import_drizzle_orm12.eq)(waiverTemplates.orgId, ctx.orgId),
            (0, import_drizzle_orm12.isNull)(waiverTemplates.deletedAt)
          )
        );
      },
      async listSignaturesForPlayer(playerId) {
        return db.select().from(waiverSignatures).where(
          (0, import_drizzle_orm12.and)(
            (0, import_drizzle_orm12.eq)(waiverSignatures.orgId, ctx.orgId),
            (0, import_drizzle_orm12.eq)(waiverSignatures.playerId, playerId)
          )
        );
      },
      async signWaiver(input) {
        const [existing] = await db.select({ id: waiverSignatures.id }).from(waiverSignatures).where(
          (0, import_drizzle_orm12.and)(
            (0, import_drizzle_orm12.eq)(waiverSignatures.orgId, ctx.orgId),
            (0, import_drizzle_orm12.eq)(waiverSignatures.templateId, input.templateId),
            (0, import_drizzle_orm12.eq)(waiverSignatures.playerId, input.playerId),
            (0, import_drizzle_orm12.eq)(waiverSignatures.signedByUserId, ctx.userId)
          )
        ).limit(1);
        if (existing) {
          const [row2] = await db.update(waiverSignatures).set({
            status: "signed",
            signedAt: /* @__PURE__ */ new Date(),
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm12.eq)(waiverSignatures.id, existing.id)).returning();
          return row2;
        }
        const [row] = await db.insert(waiverSignatures).values({ ...input, orgId: ctx.orgId, signedByUserId: ctx.userId }).returning();
        return row;
      }
    }
  };
}

// shared/db/repositories/club-ops.ts
var import_drizzle_orm13 = require("drizzle-orm");
init_schema();
function createClubOpsRepository(db, ctx) {
  return {
    seasons: {
      async list(opts = {}) {
        const conditions = [
          (0, import_drizzle_orm13.eq)(seasons.orgId, ctx.orgId),
          (0, import_drizzle_orm13.isNull)(seasons.deletedAt)
        ];
        if (!opts.includeArchived) {
          conditions.push(import_drizzle_orm13.sql`${seasons.status} != 'archived'`);
        }
        return db.select().from(seasons).where((0, import_drizzle_orm13.and)(...conditions)).orderBy((0, import_drizzle_orm13.desc)(seasons.createdAt));
      },
      async getById(id) {
        const [row] = await db.select().from(seasons).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(seasons.id, id), (0, import_drizzle_orm13.eq)(seasons.orgId, ctx.orgId), (0, import_drizzle_orm13.isNull)(seasons.deletedAt))).limit(1);
        return row ?? null;
      },
      async create(input) {
        const [row] = await db.insert(seasons).values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId }).returning();
        return row;
      },
      async update(id, patch) {
        const [row] = await db.update(seasons).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(seasons.id, id), (0, import_drizzle_orm13.eq)(seasons.orgId, ctx.orgId))).returning();
        return row;
      },
      async softDelete(id) {
        await db.update(seasons).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(seasons.id, id), (0, import_drizzle_orm13.eq)(seasons.orgId, ctx.orgId)));
      }
    },
    teams: {
      async list(opts = {}) {
        const conditions = [
          (0, import_drizzle_orm13.eq)(teams.orgId, ctx.orgId),
          (0, import_drizzle_orm13.isNull)(teams.deletedAt)
        ];
        if (opts.seasonId) conditions.push((0, import_drizzle_orm13.eq)(teams.seasonId, opts.seasonId));
        if (opts.activeOnly) conditions.push((0, import_drizzle_orm13.eq)(teams.isActive, true));
        return db.select().from(teams).where((0, import_drizzle_orm13.and)(...conditions)).orderBy(teams.name);
      },
      async getById(id) {
        const [row] = await db.select().from(teams).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(teams.id, id), (0, import_drizzle_orm13.eq)(teams.orgId, ctx.orgId), (0, import_drizzle_orm13.isNull)(teams.deletedAt))).limit(1);
        return row ?? null;
      },
      async create(input) {
        const [row] = await db.insert(teams).values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId }).returning();
        return row;
      },
      async update(id, patch) {
        const [row] = await db.update(teams).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(teams.id, id), (0, import_drizzle_orm13.eq)(teams.orgId, ctx.orgId))).returning();
        return row;
      },
      async softDelete(id) {
        await db.update(teams).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(teams.id, id), (0, import_drizzle_orm13.eq)(teams.orgId, ctx.orgId)));
      },
      // Roster management
      async getRoster(teamId) {
        return db.select().from(teamRoster).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(teamRoster.teamId, teamId), (0, import_drizzle_orm13.eq)(teamRoster.orgId, ctx.orgId), (0, import_drizzle_orm13.isNull)(teamRoster.removedAt)));
      },
      async addToRoster(input) {
        const [row] = await db.insert(teamRoster).values({ ...input, orgId: ctx.orgId, addedByUserId: ctx.userId }).onConflictDoUpdate({
          target: [teamRoster.teamId, teamRoster.playerId],
          set: { status: input.status ?? "active", removedAt: null, addedAt: /* @__PURE__ */ new Date() }
        }).returning();
        return row;
      },
      async removeFromRoster(teamId, playerId) {
        await db.update(teamRoster).set({ removedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(teamRoster.teamId, teamId), (0, import_drizzle_orm13.eq)(teamRoster.playerId, playerId), (0, import_drizzle_orm13.eq)(teamRoster.orgId, ctx.orgId)));
      }
    },
    membershipPlans: {
      async list(opts = {}) {
        const conditions = [
          (0, import_drizzle_orm13.eq)(membershipPlans.orgId, ctx.orgId),
          (0, import_drizzle_orm13.isNull)(membershipPlans.deletedAt)
        ];
        if (opts.seasonId) conditions.push((0, import_drizzle_orm13.eq)(membershipPlans.seasonId, opts.seasonId));
        if (opts.status) conditions.push(import_drizzle_orm13.sql`${membershipPlans.status} = ${opts.status}`);
        return db.select().from(membershipPlans).where((0, import_drizzle_orm13.and)(...conditions)).orderBy(membershipPlans.createdAt);
      },
      async getById(id) {
        const [row] = await db.select().from(membershipPlans).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(membershipPlans.id, id), (0, import_drizzle_orm13.eq)(membershipPlans.orgId, ctx.orgId), (0, import_drizzle_orm13.isNull)(membershipPlans.deletedAt))).limit(1);
        return row ?? null;
      },
      async create(input) {
        const [row] = await db.insert(membershipPlans).values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId }).returning();
        return row;
      },
      async update(id, patch) {
        const [row] = await db.update(membershipPlans).set({ ...patch, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(membershipPlans.id, id), (0, import_drizzle_orm13.eq)(membershipPlans.orgId, ctx.orgId))).returning();
        return row;
      },
      async softDelete(id) {
        await db.update(membershipPlans).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(membershipPlans.id, id), (0, import_drizzle_orm13.eq)(membershipPlans.orgId, ctx.orgId)));
      }
    },
    registrations: {
      async list(opts = {}) {
        const conditions = [(0, import_drizzle_orm13.eq)(registrations.orgId, ctx.orgId)];
        if (opts.seasonId) conditions.push((0, import_drizzle_orm13.eq)(registrations.seasonId, opts.seasonId));
        if (opts.status) conditions.push(import_drizzle_orm13.sql`${registrations.status} = ${opts.status}`);
        if (opts.playerId) conditions.push((0, import_drizzle_orm13.eq)(registrations.playerId, opts.playerId));
        return db.select().from(registrations).where((0, import_drizzle_orm13.and)(...conditions)).orderBy((0, import_drizzle_orm13.desc)(registrations.submittedAt));
      },
      async getById(id) {
        const [row] = await db.select().from(registrations).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(registrations.id, id), (0, import_drizzle_orm13.eq)(registrations.orgId, ctx.orgId))).limit(1);
        return row ?? null;
      },
      async create(input) {
        const [row] = await db.insert(registrations).values({ ...input, orgId: ctx.orgId, submittedByUserId: ctx.userId }).returning();
        return row;
      },
      async updateStatus(id, status, opts = {}) {
        const patch = {
          status,
          updatedAt: /* @__PURE__ */ new Date(),
          ...opts.adminNotes ? { adminNotes: opts.adminNotes } : {}
        };
        if (status === "accepted") {
          patch.acceptedAt = /* @__PURE__ */ new Date();
          patch.acceptedByUserId = opts.acceptedByUserId ?? ctx.userId;
        }
        if (status === "cancelled") {
          patch.cancelledAt = /* @__PURE__ */ new Date();
          patch.cancelledByUserId = ctx.userId;
        }
        const [row] = await db.update(registrations).set(patch).where((0, import_drizzle_orm13.and)((0, import_drizzle_orm13.eq)(registrations.id, id), (0, import_drizzle_orm13.eq)(registrations.orgId, ctx.orgId))).returning();
        return row;
      },
      /** Count by status for dashboard KPIs */
      async countByStatus(seasonId) {
        const conditions = [(0, import_drizzle_orm13.eq)(registrations.orgId, ctx.orgId)];
        if (seasonId) conditions.push((0, import_drizzle_orm13.eq)(registrations.seasonId, seasonId));
        return db.select({
          status: registrations.status,
          count: import_drizzle_orm13.sql`count(*)::int`
        }).from(registrations).where((0, import_drizzle_orm13.and)(...conditions)).groupBy(registrations.status);
      }
    }
  };
}

// shared/db/repositories/billing.ts
var import_drizzle_orm14 = require("drizzle-orm");
init_schema();
function createBillingRepository(db, ctx) {
  return {
    invoices: {
      async list(opts = {}) {
        const conditions = [(0, import_drizzle_orm14.eq)(invoices.orgId, ctx.orgId)];
        if (opts.playerId) conditions.push((0, import_drizzle_orm14.eq)(invoices.playerId, opts.playerId));
        if (opts.status) conditions.push(import_drizzle_orm14.sql`${invoices.status} = ${opts.status}`);
        if (opts.seasonId) conditions.push((0, import_drizzle_orm14.eq)(invoices.seasonId, opts.seasonId));
        if (opts.overdue) {
          conditions.push(
            import_drizzle_orm14.sql`${invoices.status} IN ('open','partial')`,
            (0, import_drizzle_orm14.lte)(invoices.dueDate, /* @__PURE__ */ new Date())
          );
        }
        return db.select().from(invoices).where((0, import_drizzle_orm14.and)(...conditions)).orderBy((0, import_drizzle_orm14.desc)(invoices.createdAt));
      },
      async getById(id) {
        const [row] = await db.select().from(invoices).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(invoices.id, id), (0, import_drizzle_orm14.eq)(invoices.orgId, ctx.orgId))).limit(1);
        return row ?? null;
      },
      async getWithItems(id) {
        const invoice = await this.getById(id);
        if (!invoice) return null;
        const items = await db.select().from(invoiceItems).where((0, import_drizzle_orm14.eq)(invoiceItems.invoiceId, id)).orderBy(invoiceItems.sortOrder);
        return { ...invoice, items };
      },
      async create(input) {
        const [row] = await db.insert(invoices).values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId }).returning();
        return row;
      },
      async addItem(item) {
        const [row] = await db.insert(invoiceItems).values({ ...item, orgId: ctx.orgId }).returning();
        return row;
      },
      async updateStatus(id, status, paidAmount) {
        const patch = { status, updatedAt: /* @__PURE__ */ new Date() };
        if (paidAmount !== void 0) {
          patch.amountPaid = paidAmount;
        }
        if (status === "paid") patch.paidAt = /* @__PURE__ */ new Date();
        const [row] = await db.update(invoices).set(patch).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(invoices.id, id), (0, import_drizzle_orm14.eq)(invoices.orgId, ctx.orgId))).returning();
        return row;
      },
      /** Recalculate amountDue after a payment is applied */
      async applyPayment(invoiceId, paymentAmount) {
        const [row] = await db.update(invoices).set({
          amountPaid: import_drizzle_orm14.sql`amount_paid + ${paymentAmount}`,
          amountDue: import_drizzle_orm14.sql`GREATEST(0, amount_due - ${paymentAmount})`,
          status: import_drizzle_orm14.sql`CASE
              WHEN amount_paid + ${paymentAmount} >= total_amount THEN 'paid'::invoice_status
              WHEN amount_paid + ${paymentAmount} > 0 THEN 'partial'::invoice_status
              ELSE status
            END`,
          paidAt: import_drizzle_orm14.sql`CASE WHEN amount_paid + ${paymentAmount} >= total_amount THEN now() ELSE paid_at END`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(invoices.id, invoiceId), (0, import_drizzle_orm14.eq)(invoices.orgId, ctx.orgId))).returning();
        return row;
      },
      /** Revenue summary for admin dashboard */
      async revenueSummary(seasonId) {
        const conditions = [(0, import_drizzle_orm14.eq)(invoices.orgId, ctx.orgId)];
        if (seasonId) conditions.push((0, import_drizzle_orm14.eq)(invoices.seasonId, seasonId));
        const [row] = await db.select({
          totalBilled: import_drizzle_orm14.sql`coalesce(sum(total_amount),0)::int`,
          totalCollected: import_drizzle_orm14.sql`coalesce(sum(amount_paid),0)::int`,
          totalOutstanding: import_drizzle_orm14.sql`coalesce(sum(amount_due),0)::int`,
          overdueCount: import_drizzle_orm14.sql`count(*) filter (where status = 'overdue')::int`,
          openCount: import_drizzle_orm14.sql`count(*) filter (where status IN ('open','partial'))::int`,
          paidCount: import_drizzle_orm14.sql`count(*) filter (where status = 'paid')::int`
        }).from(invoices).where((0, import_drizzle_orm14.and)(...conditions));
        return row;
      }
    },
    payments: {
      async listForInvoice(invoiceId) {
        return db.select().from(payments).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(payments.invoiceId, invoiceId), (0, import_drizzle_orm14.eq)(payments.orgId, ctx.orgId))).orderBy((0, import_drizzle_orm14.desc)(payments.createdAt));
      },
      async listForPlayer(playerId) {
        return db.select().from(payments).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(payments.playerId, playerId), (0, import_drizzle_orm14.eq)(payments.orgId, ctx.orgId))).orderBy((0, import_drizzle_orm14.desc)(payments.createdAt));
      },
      async record(input) {
        const [row] = await db.insert(payments).values({ ...input, orgId: ctx.orgId }).returning();
        return row;
      },
      async updateStatus(id, status, opts = {}) {
        const patch = { status, updatedAt: /* @__PURE__ */ new Date() };
        if (status === "succeeded") patch.paidAt = /* @__PURE__ */ new Date();
        if (status === "failed") {
          patch.failedAt = /* @__PURE__ */ new Date();
          patch.failureReason = opts.failureReason;
        }
        const [row] = await db.update(payments).set(patch).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(payments.id, id), (0, import_drizzle_orm14.eq)(payments.orgId, ctx.orgId))).returning();
        return row;
      }
    },
    paymentPlans: {
      async listForPlayer(playerId) {
        return db.select().from(paymentPlans).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(paymentPlans.playerId, playerId), (0, import_drizzle_orm14.eq)(paymentPlans.orgId, ctx.orgId))).orderBy((0, import_drizzle_orm14.desc)(paymentPlans.createdAt));
      },
      async getById(id) {
        const [row] = await db.select().from(paymentPlans).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(paymentPlans.id, id), (0, import_drizzle_orm14.eq)(paymentPlans.orgId, ctx.orgId))).limit(1);
        return row ?? null;
      },
      async create(input) {
        const [row] = await db.insert(paymentPlans).values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId }).returning();
        return row;
      },
      async updateStatus(id, status) {
        const [row] = await db.update(paymentPlans).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm14.and)((0, import_drizzle_orm14.eq)(paymentPlans.id, id), (0, import_drizzle_orm14.eq)(paymentPlans.orgId, ctx.orgId))).returning();
        return row;
      }
    }
  };
}

// shared/db/repository.ts
function createRepository(ctx) {
  const db = ctx.db ?? getDb();
  return {
    ...createFilmRepository(db, ctx),
    ...createRosterRepository(db, ctx),
    ...createEventsRepository(db, ctx),
    ...createAssignmentsRepository(db, ctx),
    ...createPracticeRepository(db, ctx),
    ...createReadinessRepository(db, ctx),
    ...createMessagingRepository(db, ctx),
    ...createWearablesRepository(db, ctx),
    ...createPlayerNotesRepository(db, ctx),
    ...createIdpRepository(db, ctx),
    ...createGuardianRepository(db, ctx),
    ...createCommsRepository(db, ctx),
    ...createClubOpsRepository(db, ctx),
    ...createBillingRepository(db, ctx)
  };
}

// server/auth/tenant.ts
function auth(req) {
  return (0, import_express.getAuth)(req);
}
var HttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
};
var ORG_ROLES = {
  PLAYER: "player",
  COACH: "coach",
  GUARDIAN: "guardian",
  // parent / guardian account
  OWNER: "owner",
  ADMIN: "admin",
  ANALYST: "analyst",
  VIEWER: "viewer"
};
async function requireOrgRole(req, ...allowed) {
  const ctx = await requireOrg(req);
  if (!allowed.includes(ctx.role)) {
    throw new HttpError(403, `Role '${ctx.role}' is not permitted here.`);
  }
  return ctx;
}
function looksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
async function resolveDbOrgId(clerkOrgId, orgSlug) {
  const db = getDb();
  const clauses = [];
  if (looksLikeUuid(clerkOrgId)) {
    clauses.push((0, import_drizzle_orm15.eq)(orgs.id, clerkOrgId));
  }
  clauses.push(import_drizzle_orm15.sql`(${orgs.payload}->>'clerkOrgId') = ${clerkOrgId}`);
  if (orgSlug) {
    clauses.push((0, import_drizzle_orm15.eq)(orgs.slug, orgSlug));
  }
  const rows = await db.select().from(orgs).where((0, import_drizzle_orm15.and)((0, import_drizzle_orm15.or)(...clauses), (0, import_drizzle_orm15.isNull)(orgs.deletedAt))).limit(1);
  return rows[0]?.id ?? null;
}
function teamIdFromRequest(req) {
  const header = req.get("x-hoops-team-id");
  if (header) return header;
  const clerkAuth = auth(req);
  const claims = clerkAuth.sessionClaims;
  const fromClaims = claims?.teamId ?? claims?.team_id;
  if (typeof fromClaims === "string" && fromClaims.length > 0) return fromClaims;
  return "default";
}
async function requireOrg(req) {
  const clerkAuth = auth(req);
  if (!clerkAuth.userId) {
    throw new HttpError(401, "Unauthorized");
  }
  const clerkOrgId = clerkAuth.orgId;
  if (!clerkOrgId) {
    throw new HttpError(403, "Active organization required");
  }
  let orgId;
  try {
    orgId = await resolveDbOrgId(clerkOrgId, clerkAuth.orgSlug ?? void 0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("not set")) {
      throw new HttpError(503, "Database is not configured in this environment.");
    }
    throw e;
  }
  if (!orgId) {
    throw new HttpError(403, "Organization not provisioned");
  }
  let membership;
  try {
    const db = getDb();
    [membership] = await db.select().from(orgMembers).where(
      (0, import_drizzle_orm15.and)(
        (0, import_drizzle_orm15.eq)(orgMembers.orgId, orgId),
        (0, import_drizzle_orm15.eq)(orgMembers.userId, clerkAuth.userId),
        (0, import_drizzle_orm15.isNull)(orgMembers.deletedAt)
      )
    ).limit(1);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("not set")) {
      throw new HttpError(503, "Database is not configured in this environment.");
    }
    throw e;
  }
  if (!membership) {
    throw new HttpError(403, "Not a member of this organization");
  }
  return {
    userId: clerkAuth.userId,
    orgId,
    role: membership.role,
    teamId: teamIdFromRequest(req)
  };
}

// server/modules/film-analysis/routes.ts
function handleError(err, res, next) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof Error) {
    const msg = err.message ?? "";
    if (msg.includes("DATABASE_URL") || msg.includes("not set") || msg.includes("not configured")) {
      res.status(503).json({ error: "Service is not fully configured in this environment." });
      return;
    }
  }
  next(err);
}
function registerFilmAnalysisRoutes(router, service) {
  router.post(
    "/uploads/initiate",
    async (req, res, next) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const body = req.body;
        const result = await service.initiateUpload({
          ...body,
          orgId,
          teamId,
          createdBy: userId
        });
        if (body.resolvesActionId) {
          const repo = createRepository({ orgId, userId });
          await repo.coachingActions.updateStatus(body.resolvesActionId, "in_progress", {
            followUpSessionId: result.assetId
          });
        }
        res.status(201).json(result);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/sessions",
    async (req, res, next) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const body = req.body;
        const session = await service.createSession({
          ...body,
          orgId,
          teamId,
          createdBy: userId
        });
        res.status(201).json(session);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions",
    async (req, res, next) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const sessions = await service.listSessions(orgId, teamId);
        res.json(sessions);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:id",
    async (req, res, next) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const session = await service.getSessionDetail(
          orgId,
          teamId,
          req.params.id
        );
        if (!session)
          return res.status(404).json({ error: "Session not found" });
        res.json(session);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:id/jobs/latest",
    async (req, res, next) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const job = await service.getLatestJob(orgId, teamId, req.params.id);
        if (!job)
          return res.status(404).json({ error: "No analysis job found" });
        res.json(job);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/sessions/:id/jobs",
    async (req, res, next) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const job = await service.triggerAnalysis(
          orgId,
          teamId,
          req.params.id,
          userId,
          req.body
        );
        res.status(202).json(job);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:id/stats/team",
    async (req, res, next) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const stats = await service.getTeamStats(orgId, teamId, req.params.id);
        if (!stats)
          return res.status(404).json({ error: "Stats not available" });
        res.json(stats);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:id/stats/players",
    async (req, res, next) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const stats = await service.getPlayerStats(
          orgId,
          teamId,
          req.params.id
        );
        res.json(stats);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:id/events",
    async (req, res, next) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const query = {
          playerId: req.query.playerId,
          period: req.query.period,
          eventType: req.query.eventType,
          minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : void 0,
          needsReview: req.query.needsReview === "true" ? true : req.query.needsReview === "false" ? false : void 0,
          page: req.query.page ? Number(req.query.page) : void 0,
          limit: req.query.limit ? Number(req.query.limit) : void 0
        };
        const events2 = await service.getEvents(
          orgId,
          teamId,
          req.params.id,
          query
        );
        res.json(events2);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:id/highlights",
    async (req, res, next) => {
      try {
        const { orgId, teamId } = await requireOrg(req);
        const highlights = await service.getHighlights(
          orgId,
          teamId,
          req.params.id
        );
        res.json(highlights);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/highlights/clips",
    async (req, res, next) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const clip = await service.approveClip(
          orgId,
          teamId,
          userId,
          req.body
        );
        res.status(201).json(clip);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/highlights/reels",
    async (req, res, next) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const reel = await service.upsertReel(
          orgId,
          teamId,
          userId,
          req.body
        );
        res.status(201).json(reel);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/review/decisions",
    async (req, res, next) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const sessionId = req.query.sessionId ?? req.body.sessionId;
        const body = {
          ...req.body,
          sessionId
        };
        const decision = await service.submitReview(
          orgId,
          teamId,
          userId,
          body
        );
        res.status(201).json(decision);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:id/annotations",
    async (req, res, next) => {
      try {
        const { orgId, userId } = await requireOrg(req);
        const repo = createRepository({ orgId, userId });
        const kind = req.query.kind;
        const all = await repo.annotations.listForSession(req.params.id);
        const filtered = kind ? all.filter((a) => a.kind === kind) : all;
        res.json(filtered);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/sessions/:id/annotations",
    async (req, res, next) => {
      try {
        const { orgId, userId } = await requireOrg(req);
        const repo = createRepository({ orgId, userId });
        const { kind, startMs, endMs, label, body, data, payload } = req.body;
        if (!kind || startMs == null) {
          return res.status(400).json({ error: "kind and startMs are required" });
        }
        const annotation = await repo.annotations.create({
          sessionId: req.params.id,
          kind,
          source: "coach",
          authorUserId: userId,
          startMs,
          endMs: endMs ?? null,
          label: label ?? null,
          body: body ?? null,
          data: data ?? {},
          payload: payload ?? {},
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
        res.status(201).json(annotation);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/exports",
    async (req, res, next) => {
      try {
        const { orgId, teamId, userId } = await requireOrg(req);
        const sessionId = req.query.sessionId ?? req.body.sessionId;
        const body = {
          ...req.body,
          sessionId
        };
        const exportReq = await service.requestExport(
          orgId,
          teamId,
          userId,
          body
        );
        res.status(202).json(exportReq);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:sessionId/clips",
    async (req, res, next) => {
      try {
        await requireOrg(req);
        res.json([]);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.get(
    "/sessions/:sessionId/summary",
    async (req, res, next) => {
      try {
        await requireOrg(req);
        res.json(null);
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
  router.post(
    "/clips/:clipId/review",
    async (req, res, next) => {
      try {
        const { orgId, userId } = await requireOrg(req);
        const { clipId } = req.params;
        const {
          status,
          note,
          editedEventType
        } = req.body;
        const VALID_STATUSES = [
          "confirmed",
          "edited",
          "rejected",
          "flagged_for_teaching"
        ];
        if (!VALID_STATUSES.includes(status)) {
          res.status(400).json({ error: `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(", ")}` });
          return;
        }
        res.json({
          clipId,
          status,
          note: note ?? null,
          editedEventType: editedEventType ?? null,
          reviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
          reviewedBy: userId
        });
      } catch (e) {
        handleError(e, res, next);
      }
    }
  );
}

// server/lib/mux.ts
var import_mux_node = __toESM(require("@mux/mux-node"), 1);
var muxClient = null;
function getMux() {
  if (!muxClient) {
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new HttpError(
        503,
        "Film upload is not available in this environment. MUX_TOKEN_ID and MUX_TOKEN_SECRET are not configured."
      );
    }
    muxClient = new import_mux_node.default({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET
    });
  }
  return muxClient;
}
async function createDirectUpload() {
  const mux = getMux();
  const upload = await mux.video.uploads.create({
    cors_origin: process.env.APP_BASE_URL ?? "*",
    new_asset_settings: {
      playback_policy: ["public"],
      mp4_support: "capped-1080p"
    }
  });
  return { uploadId: upload.id, uploadUrl: upload.url };
}

// server/modules/film-analysis/db-service.ts
function asPayload(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function teamScopeMatches(session, teamId) {
  const team = asPayload(session.payload).teamId;
  if (typeof team !== "string" || team.length === 0) return true;
  return team === teamId;
}
function dbKindToApi(kind) {
  if (kind === "practice") return "practice" /* Practice */;
  if (kind === "scrimmage") return "scrimmage" /* Scrimmage */;
  return "game" /* Game */;
}
function apiKindToDb(kind) {
  const v = kind;
  if (v === "practice") return "practice";
  if (v === "scrimmage") return "scrimmage";
  if (v === "game") return "game";
  return "other";
}
function parseHomeAway(v) {
  if (v === "away") return "away" /* Away */;
  if (v === "neutral") return "neutral" /* Neutral */;
  return "home" /* Home */;
}
function homeAwayToDb(ha) {
  return ha;
}
function mapJobStatus(db) {
  switch (db) {
    case "queued":
      return "queued" /* Queued */;
    case "running":
      return "running" /* Running */;
    case "retrying":
      return "partial" /* Partial */;
    case "succeeded":
      return "succeeded" /* Succeeded */;
    case "failed":
      return "failed" /* Failed */;
    case "cancelled":
      return "cancelled" /* Cancelled */;
    default:
      return "queued" /* Queued */;
  }
}
function syntheticQueuedJob(session, orgId, teamId) {
  return {
    id: `pending-job-${session.id}`,
    orgId,
    teamId,
    createdBy: session.createdByUserId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    version: 1,
    deletedAt: null,
    sessionId: session.id,
    providerId: "hoopsos-db",
    modelVersion: "pr2",
    status: "queued" /* Queued */,
    stage: "ingest" /* Ingest */,
    progressPct: 0,
    startedAt: null,
    finishedAt: null,
    errorCode: null,
    errorMessage: null,
    parentJobId: null
  };
}
function mapDbJobToApi(row, ctx) {
  const payload = asPayload(row.payload);
  const stage = payload.stage ?? "ingest" /* Ingest */;
  const progressPct = typeof payload.progressPct === "number" ? payload.progressPct : row.status === "succeeded" ? 100 : 0;
  return {
    id: row.id,
    orgId: ctx.orgId,
    teamId: ctx.teamId,
    createdBy: typeof payload.createdByUserId === "string" && payload.createdByUserId || ctx.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: 1,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    sessionId: row.sessionId,
    providerId: payload.providerId ?? "hoopsos-db",
    modelVersion: payload.modelVersion ?? "pr2",
    status: mapJobStatus(row.status),
    stage,
    progressPct,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    errorCode: row.lastError ? "job_error" : null,
    errorMessage: row.lastError ?? null,
    parentJobId: typeof payload.parentJobId === "string" ? payload.parentJobId : null
  };
}
function mapSessionRowToApi(row, teamId, primaryAssetId) {
  const playedAt = row.playedAt?.toISOString() ?? row.createdAt.toISOString();
  return {
    id: row.id,
    orgId: row.orgId,
    teamId,
    createdBy: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: 1,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    assetId: primaryAssetId,
    kind: dbKindToApi(row.kind),
    opponentTeamId: null,
    opponentName: row.opponent ?? null,
    playedAt,
    homeAway: parseHomeAway(row.homeAway),
    rosterSnapshotId: null,
    notes: row.description ?? null,
    title: row.title
  };
}
async function primaryAssetIdForSession(repo, sessionId, fallbackFromPayload) {
  if (fallbackFromPayload) return fallbackFromPayload;
  const assets = await repo.filmAssets.listForSession(sessionId);
  const primary = assets.find((a) => a.kind === "source") ?? assets[0] ?? null;
  return primary?.id ?? sessionId;
}
function annotationToEvent(row, ctx) {
  const data = asPayload(row.data);
  const type = data.eventType;
  if (!type) return null;
  return {
    id: row.id,
    orgId: ctx.orgId,
    teamId: ctx.teamId,
    createdBy: row.authorUserId ?? "system",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: 1,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    sessionId: ctx.sessionId,
    segmentId: data.segmentId ?? "seg_root",
    tMs: row.startMs,
    endMs: row.endMs ?? null,
    type,
    primaryPlayerId: data.primaryPlayerId ?? null,
    primaryPlayerName: data.primaryPlayerName ?? null,
    assistPlayerId: data.assistPlayerId ?? null,
    assistPlayerName: data.assistPlayerName ?? null,
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    needsReview: Boolean(data.needsReview),
    providerEventId: data.providerEventId ?? null
  };
}
function parseHighlightPayload(row, ctx) {
  const data = asPayload(row.data);
  const part = data.highlightPart || (row.kind === "highlight" ? "candidate" : "");
  return { part, ...data, orgId: ctx.orgId, teamId: ctx.teamId };
}
var DbFilmAnalysisService = class {
  async initiateUpload(input) {
    const repo = createRepository({
      orgId: input.orgId,
      userId: input.createdBy
    });
    const { uploadId, uploadUrl } = await createDirectUpload();
    const session = await repo.filmSessions.create({
      title: `Upload: ${input.filename}`,
      kind: "game",
      status: "uploading",
      payload: {
        teamId: input.teamId,
        pendingUpload: true,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes
      }
    });
    const asset = await repo.filmAssets.create({
      sessionId: session.id,
      kind: "source",
      status: "pending",
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      // Store the Mux upload ID so the webhook can look up this asset later.
      payload: {
        muxUploadId: uploadId,
        storageProvider: "mux"
      }
    });
    await repo.filmSessions.update(session.id, {
      payload: {
        ...asPayload(session.payload),
        teamId: input.teamId,
        primaryFilmAssetId: asset.id
      }
    });
    return {
      assetId: asset.id,
      uploadUrl,
      expiresAt: new Date(Date.now() + 36e5).toISOString()
    };
  }
  async createSession(input) {
    const repo = createRepository({
      orgId: input.orgId,
      userId: input.createdBy
    });
    const asset = await repo.filmAssets.getById(input.assetId);
    if (!asset) throw new HttpError(404, "Asset not found");
    const sessionRow = await repo.filmSessions.getById(asset.sessionId);
    if (!sessionRow) throw new HttpError(404, "Session not found");
    if (!teamScopeMatches(sessionRow, input.teamId)) {
      throw new HttpError(403, "Team mismatch for session");
    }
    const mergedPayload = {
      ...asPayload(sessionRow.payload),
      teamId: input.teamId,
      pendingUpload: false,
      primaryFilmAssetId: input.assetId
    };
    await repo.filmSessions.update(asset.sessionId, {
      title: input.title,
      kind: apiKindToDb(input.kind),
      status: "draft",
      opponent: input.opponentName ?? null,
      homeAway: homeAwayToDb(input.homeAway),
      playedAt: input.playedAt ? new Date(input.playedAt) : null,
      description: input.notes ?? null,
      payload: mergedPayload
    });
    const updated = await repo.filmSessions.getById(asset.sessionId);
    if (!updated) throw new HttpError(500, "Session update failed");
    const aid = await primaryAssetIdForSession(
      repo,
      updated.id,
      input.assetId
    );
    return mapSessionRowToApi(updated, input.teamId, aid);
  }
  async listSessions(orgId, teamId) {
    const repo = createRepository({ orgId, userId: "system" });
    const rows = await repo.filmSessions.list({ limit: 100 });
    const out = [];
    for (const row of rows) {
      if (!teamScopeMatches(row, teamId)) continue;
      const jobs = await repo.analysisJobs.listForSession(row.id);
      const jobRow = jobs[0];
      const aid = await primaryAssetIdForSession(
        repo,
        row.id,
        typeof asPayload(row.payload).primaryFilmAssetId === "string" ? asPayload(row.payload).primaryFilmAssetId : void 0
      );
      const session = mapSessionRowToApi(row, teamId, aid);
      const job = jobRow ? mapDbJobToApi(jobRow, { orgId, teamId, userId: row.createdByUserId }) : syntheticQueuedJob(row, orgId, teamId);
      out.push({ ...session, job });
    }
    return out;
  }
  async getSessionDetail(orgId, teamId, sessionId) {
    const repo = createRepository({ orgId, userId: "system" });
    const row = await repo.filmSessions.getById(sessionId);
    if (!row || !teamScopeMatches(row, teamId)) return null;
    const jobs = await repo.analysisJobs.listForSession(sessionId);
    const jobRow = jobs[0];
    const aid = await primaryAssetIdForSession(
      repo,
      row.id,
      typeof asPayload(row.payload).primaryFilmAssetId === "string" ? asPayload(row.payload).primaryFilmAssetId : void 0
    );
    const session = mapSessionRowToApi(row, teamId, aid);
    const job = jobRow ? mapDbJobToApi(jobRow, { orgId, teamId, userId: row.createdByUserId }) : syntheticQueuedJob(row, orgId, teamId);
    return { ...session, job };
  }
  async getLatestJob(orgId, teamId, sessionId) {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return null;
    const jobs = await repo.analysisJobs.listForSession(sessionId);
    const row = jobs[0];
    if (!row) return null;
    return mapDbJobToApi(row, {
      orgId,
      teamId,
      userId: session.createdByUserId
    });
  }
  async triggerAnalysis(orgId, teamId, sessionId, userId, _options) {
    const repo = createRepository({ orgId, userId });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const row = await repo.analysisJobs.enqueue({
      sessionId,
      kind: "ingest",
      payload: {
        teamId,
        createdByUserId: userId,
        stage: "ingest" /* Ingest */,
        progressPct: 0,
        providerId: "hoopsos-ingest",
        modelVersion: "pr2"
      }
    });
    return mapDbJobToApi(row, { orgId, teamId, userId });
  }
  async getTeamStats(orgId, teamId, sessionId) {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return null;
    const derivedAt = (/* @__PURE__ */ new Date()).toISOString();
    return {
      id: `team-stats-${sessionId}`,
      orgId,
      teamId,
      createdBy: session.createdByUserId,
      createdAt: derivedAt,
      updatedAt: derivedAt,
      version: 1,
      deletedAt: null,
      sessionId,
      teamName: session.title,
      pts: 0,
      ast: 0,
      reb: 0,
      oreb: 0,
      dreb: 0,
      stl: 0,
      blk: 0,
      to: 0,
      fls: 0,
      fg: 0,
      fga: 0,
      tp: 0,
      tpa: 0,
      ft: 0,
      fta: 0,
      pace: null,
      offRtg: null,
      defRtg: null,
      derivedAt
    };
  }
  async getPlayerStats(orgId, teamId, sessionId) {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return [];
    return [];
  }
  async getEvents(orgId, teamId, sessionId, query) {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) return [];
    const rows = await repo.annotations.listForSession(sessionId);
    let events2 = rows.map(
      (r) => annotationToEvent(r, { orgId, teamId, sessionId })
    ).filter((e) => e !== null);
    if (query.playerId) {
      events2 = events2.filter((e) => e.primaryPlayerId === query.playerId);
    }
    if (query.eventType) {
      events2 = events2.filter((e) => e.type === query.eventType);
    }
    if (query.needsReview !== void 0) {
      events2 = events2.filter((e) => e.needsReview === query.needsReview);
    }
    if (query.minConfidence !== void 0) {
      events2 = events2.filter((e) => e.confidence >= query.minConfidence);
    }
    return events2;
  }
  async getHighlights(orgId, teamId, sessionId) {
    const repo = createRepository({ orgId, userId: "system" });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      return { candidates: [], clips: [], reels: [] };
    }
    const rows = await repo.annotations.listForSession(sessionId);
    const candidates = [];
    const clips = [];
    const reels = [];
    for (const row of rows) {
      if (row.kind !== "highlight") continue;
      const hp = parseHighlightPayload(row, { orgId, teamId });
      if (hp.part === "candidate") {
        candidates.push({
          id: row.id,
          orgId,
          teamId,
          createdBy: row.authorUserId ?? "system",
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          version: 1,
          deletedAt: row.deletedAt?.toISOString() ?? null,
          sessionId,
          playerId: hp.playerId ?? null,
          playerName: hp.playerName ?? null,
          eventIds: hp.eventIds ?? [],
          startMs: row.startMs,
          endMs: row.endMs ?? row.startMs,
          score: typeof hp.score === "number" ? hp.score : 0,
          reason: typeof hp.reason === "string" ? hp.reason : "",
          status: hp.status ?? "proposed" /* Proposed */,
          thumbnailUri: hp.thumbnailUri ?? null
        });
      } else if (hp.part === "clip") {
        clips.push({
          id: row.id,
          orgId,
          teamId,
          createdBy: row.authorUserId ?? "system",
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          version: 1,
          deletedAt: row.deletedAt?.toISOString() ?? null,
          candidateId: hp.candidateId ?? "unknown",
          mediaRef: {
            assetId: hp.assetId ?? sessionId,
            startMs: row.startMs,
            endMs: row.endMs ?? row.startMs
          },
          coachNotes: hp.coachNotes ?? null,
          approvedBy: hp.approvedBy ?? null,
          approvedAt: hp.approvedAt ?? null,
          title: hp.title ?? void 0
        });
      } else if (hp.part === "reel") {
        reels.push({
          id: row.id,
          orgId,
          teamId,
          createdBy: row.authorUserId ?? "system",
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          version: 1,
          deletedAt: row.deletedAt?.toISOString() ?? null,
          playerId: hp.playerId ?? null,
          playerName: hp.playerName ?? null,
          clipIds: hp.clipIds ?? [],
          title: hp.title ?? "Reel",
          visibility: hp.visibility ?? "team" /* Team */,
          publishedAt: hp.publishedAt ?? null
        });
      }
    }
    return { candidates, clips, reels };
  }
  async approveClip(orgId, teamId, userId, body) {
    const sessionId = body.sessionId;
    if (!sessionId) throw new HttpError(400, "sessionId is required");
    const repo = createRepository({ orgId, userId });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const row = await repo.annotations.create({
      sessionId,
      kind: "highlight",
      source: "coach",
      authorUserId: userId,
      startMs: typeof body.startMs === "number" ? body.startMs : 0,
      endMs: typeof body.endMs === "number" ? body.endMs : null,
      label: "clip",
      body: typeof body.title === "string" ? body.title : null,
      data: {
        highlightPart: "clip",
        candidateId: body.candidateId,
        assetId: body.assetId,
        coachNotes: body.coachNotes,
        title: body.title,
        approvedBy: userId,
        approvedAt: now
      },
      payload: {}
    });
    return {
      id: row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      candidateId: body.candidateId ?? "unknown",
      mediaRef: {
        assetId: body.assetId ?? sessionId,
        startMs: row.startMs,
        endMs: row.endMs ?? row.startMs
      },
      coachNotes: body.coachNotes ?? null,
      approvedBy: userId,
      approvedAt: now,
      title: body.title
    };
  }
  async upsertReel(orgId, teamId, userId, body) {
    const sessionId = body.sessionId;
    if (!sessionId) throw new HttpError(400, "sessionId is required");
    const repo = createRepository({ orgId, userId });
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const row = await repo.annotations.create({
      sessionId,
      kind: "highlight",
      source: "coach",
      authorUserId: userId,
      startMs: 0,
      endMs: null,
      label: "reel",
      body: typeof body.title === "string" ? body.title : null,
      data: {
        highlightPart: "reel",
        id: body.id,
        title: body.title,
        description: body.description,
        clipIds: body.clipIds,
        isPublished: body.isPublished,
        visibility: body.visibility
      },
      payload: {}
    });
    return {
      id: body.id || row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      playerId: body.subjectRosterMemberId ?? null,
      playerName: null,
      clipIds: body.clipIds ?? [],
      title: body.title ?? "Reel",
      visibility: "team" /* Team */,
      publishedAt: null
    };
  }
  async submitReview(orgId, teamId, userId, body) {
    const repo = createRepository({ orgId, userId });
    const sessionId = body.sessionId;
    if (!sessionId) {
      throw new HttpError(400, "sessionId is required on review payload");
    }
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const decidedAt = (/* @__PURE__ */ new Date()).toISOString();
    const row = await repo.annotations.create({
      sessionId,
      kind: "note",
      source: "coach",
      authorUserId: userId,
      startMs: 0,
      endMs: null,
      label: "review_decision",
      body: body.reason ?? null,
      data: {
        targetType: body.targetType,
        targetId: body.targetId,
        after: body.after
      },
      payload: {}
    });
    return {
      id: row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      targetType: body.targetType,
      targetId: body.targetId,
      before: {},
      after: body.after,
      decidedBy: userId,
      decidedAt,
      reason: body.reason ?? null
    };
  }
  async requestExport(orgId, teamId, userId, body) {
    const repo = createRepository({ orgId, userId });
    const sessionId = body.sessionId;
    if (!sessionId) {
      throw new HttpError(400, "sessionId is required on export payload");
    }
    const session = await repo.filmSessions.getById(sessionId);
    if (!session || !teamScopeMatches(session, teamId)) {
      throw new HttpError(404, "Session not found");
    }
    const row = await repo.annotations.create({
      sessionId,
      kind: "note",
      source: "coach",
      authorUserId: userId,
      startMs: 0,
      endMs: null,
      label: "export_request",
      body: null,
      data: {
        exportType: body.targetType,
        sourceId: body.targetId,
        format: body.format
      },
      payload: {}
    });
    return {
      id: row.id,
      orgId,
      teamId,
      createdBy: userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: 1,
      deletedAt: null,
      targetType: body.targetType,
      targetId: body.targetId,
      format: body.format,
      status: "pending" /* Pending */,
      resultUri: null,
      requestedBy: userId
    };
  }
  // ── Mux webhook handler ────────────────────────────────────────────────────
  /**
   * Called by the /webhooks/mux route when Mux sends a video.asset.ready event.
   *
   * Looks up the film_asset row whose payload.muxUploadId matches the upload
   * that created this Mux asset, then stamps the Mux asset ID, playback ID,
   * and marks both the asset and the parent session as "ready".
   *
   * Fires an Inngest event `film/asset.ready` when the inngest package is
   * available and INNGEST_EVENT_KEY is configured.
   */
  async handleMuxWebhook(event) {
    if (event.type !== "video.asset.ready") return;
    const data = event.data;
    const muxAssetId = data.id;
    const muxUploadId = data.upload_id;
    if (!muxAssetId) return;
    const playbackIds = data.playback_ids;
    const muxPlaybackId = playbackIds?.[0]?.id ?? null;
    await this._updateAssetByMuxUploadId(muxUploadId, muxAssetId, muxPlaybackId);
  }
  /** @internal */
  async _updateAssetByMuxUploadId(muxUploadId, muxAssetId, muxPlaybackId) {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_client(), client_exports));
    const { filmAssets: filmAssets3, filmSessions: filmSessions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq22, and: and20 } = await import("drizzle-orm");
    const db = getDb2();
    const candidates = await db.select().from(filmAssets3).where(eq22(filmAssets3.status, "pending"));
    const asset = candidates.find((a) => {
      const p = a.payload && typeof a.payload === "object" ? a.payload : {};
      return p.muxUploadId === muxUploadId || p.muxAssetId === muxAssetId;
    });
    if (!asset) {
      console.warn("[mux-webhook] No film_asset found for upload", muxUploadId, "/ asset", muxAssetId);
      return;
    }
    const assetPayload = asset.payload && typeof asset.payload === "object" ? asset.payload : {};
    await db.update(filmAssets3).set({
      status: "ready",
      providerId: muxAssetId,
      playbackId: muxPlaybackId ?? void 0,
      storageProvider: "mux",
      updatedAt: /* @__PURE__ */ new Date(),
      payload: {
        ...assetPayload,
        muxAssetId,
        muxPlaybackId
      }
    }).where(and20(eq22(filmAssets3.id, asset.id), eq22(filmAssets3.orgId, asset.orgId)));
    await db.update(filmSessions2).set({
      status: "ready",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and20(
        eq22(filmSessions2.id, asset.sessionId),
        eq22(filmSessions2.orgId, asset.orgId)
      )
    );
    if (process.env.INNGEST_EVENT_KEY) {
      try {
        const { Inngest: Inngest2 } = await import("inngest");
        const inngest2 = new Inngest2({ id: "hoopsos" });
        await inngest2.send({
          name: "film/asset.ready",
          data: {
            assetId: asset.id,
            sessionId: asset.sessionId,
            orgId: asset.orgId,
            muxAssetId,
            muxPlaybackId
          }
        });
      } catch (err) {
        console.warn("[mux-webhook] Failed to send Inngest event:", err);
      }
    }
  }
};

// server/routes/me.ts
function registerMeRoute(router) {
  router.get("/me", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      res.json({ userId: ctx.userId, orgId: ctx.orgId, role: ctx.role });
    } catch (e) {
      res.status(e.status ?? 401).json({ error: e.message ?? "Unauthorized" });
    }
  });
}

// server/modules/roster/routes.ts
var import_drizzle_orm16 = require("drizzle-orm");
function registerRosterRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const players2 = await repo.players.list();
      res.json(players2);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const player = await repo.players.getById(req.params.id);
      if (!player) return res.status(404).json({ error: "Not found" });
      res.json(player);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const player = await repo.players.create(req.body);
      res.status(201).json(player);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.players.update(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.players.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/profile", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const db = getDb();
      const {
        players: players2,
        playerGuardians: playerGuardians2,
        idps: idps2,
        eventAttendance: eventAttendance2,
        events: events2,
        assignments: assignments2,
        readinessCheckins: readinessCheckins2,
        injuryRecords: injuryRecords2,
        playerNotes: playerNotes2
      } = schema_exports;
      const player = await repo.players.getById(req.params.id);
      if (!player) return res.status(404).json({ error: "Not found" });
      const [
        guardians,
        latestIdp,
        recentAttendance,
        recentAssignments,
        recentReadiness,
        activeInjuries,
        pinnedNotes
      ] = await Promise.all([
        // Guardians
        db.select().from(playerGuardians2).where((0, import_drizzle_orm16.and)(
          (0, import_drizzle_orm16.eq)(playerGuardians2.orgId, ctx.orgId),
          (0, import_drizzle_orm16.eq)(playerGuardians2.playerId, req.params.id),
          (0, import_drizzle_orm16.isNull)(playerGuardians2.deletedAt)
        )).orderBy((0, import_drizzle_orm16.desc)(playerGuardians2.isPrimary)),
        // Latest IDP
        db.select().from(idps2).where((0, import_drizzle_orm16.and)(
          (0, import_drizzle_orm16.eq)(idps2.orgId, ctx.orgId),
          (0, import_drizzle_orm16.eq)(idps2.playerId, req.params.id),
          (0, import_drizzle_orm16.isNull)(idps2.deletedAt)
        )).orderBy((0, import_drizzle_orm16.desc)(idps2.createdAt)).limit(1),
        // Last 20 attendance records (joined with event for type/title)
        db.select({
          id: eventAttendance2.id,
          status: eventAttendance2.status,
          note: eventAttendance2.note,
          recordedAt: eventAttendance2.recordedAt,
          eventId: eventAttendance2.eventId,
          eventTitle: events2.title,
          eventType: events2.type,
          eventStartsAt: events2.startsAt
        }).from(eventAttendance2).leftJoin(events2, (0, import_drizzle_orm16.eq)(eventAttendance2.eventId, events2.id)).where((0, import_drizzle_orm16.and)(
          (0, import_drizzle_orm16.eq)(eventAttendance2.orgId, ctx.orgId),
          (0, import_drizzle_orm16.eq)(eventAttendance2.playerId, req.params.id)
        )).orderBy((0, import_drizzle_orm16.desc)(events2.startsAt)).limit(20),
        // Recent assignments
        repo.assignments.list({ playerId: req.params.id }),
        // 14-day readiness
        repo.readiness.listForPlayer(req.params.id, 14),
        // Active / monitoring injuries
        db.select().from(injuryRecords2).where((0, import_drizzle_orm16.and)(
          (0, import_drizzle_orm16.eq)(injuryRecords2.orgId, ctx.orgId),
          (0, import_drizzle_orm16.eq)(injuryRecords2.playerId, req.params.id),
          (0, import_drizzle_orm16.isNull)(injuryRecords2.deletedAt)
        )).orderBy((0, import_drizzle_orm16.desc)(injuryRecords2.injuredAt)).limit(10),
        // Recent notes
        repo.playerNotes.listForPlayer(req.params.id, 10)
      ]);
      const present = recentAttendance.filter((r) => r.status === "present").length;
      const late = recentAttendance.filter((r) => r.status === "late").length;
      const absent = recentAttendance.filter((r) => r.status === "absent").length;
      const excused = recentAttendance.filter((r) => r.status === "excused").length;
      const total = recentAttendance.length;
      const attendanceRate = total > 0 ? Math.round((present + late + excused) / total * 100) : null;
      const reviewed = recentAssignments.filter((a) => a.status === "reviewed").length;
      const submitted = recentAssignments.filter((a) => a.status === "submitted").length;
      const overdue = recentAssignments.filter((a) => a.status === "overdue").length;
      const totalAssign = recentAssignments.length;
      const compliance = totalAssign > 0 ? Math.round((reviewed + submitted) / totalAssign * 100) : null;
      res.json({
        player,
        guardians,
        latestIdp: latestIdp[0] ?? null,
        attendance: recentAttendance,
        attendanceStats: { present, late, absent, excused, total, attendanceRate },
        assignments: recentAssignments.slice(0, 10),
        assignmentStats: { reviewed, submitted, overdue, total: totalAssign, compliance },
        readiness: recentReadiness,
        injuries: activeInjuries,
        notes: pinnedNotes
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/notes", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const notes = await repo.playerNotes.listForPlayer(req.params.id);
      res.json(notes);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/notes", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { body, noteType, isPinned } = req.body;
      if (!body?.trim()) return res.status(400).json({ error: "body required" });
      const note = await repo.playerNotes.create({
        playerId: req.params.id,
        body,
        noteType: noteType ?? "coach",
        isPinned: isPinned ?? false
      });
      res.status(201).json(note);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id/notes/:noteId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.playerNotes.softDelete(req.params.noteId);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/notes/:noteId/pin", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.playerNotes.togglePin(req.params.noteId, !!req.body.isPinned);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/skill-assessments", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const data = await repo.skillAssessments.listForPlayer(req.params.id);
      res.json(data);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/skill-assessments", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { category, subSkill, score, season, notes } = req.body;
      if (!category || !subSkill || score == null) {
        return res.status(400).json({ error: "category, subSkill, score required" });
      }
      if (score < 1 || score > 10) {
        return res.status(400).json({ error: "score must be 1\u201310" });
      }
      const row = await repo.skillAssessments.create({
        playerId: req.params.id,
        category,
        subSkill,
        score,
        season,
        notes
      });
      res.status(201).json(row);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/injuries", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const data = await repo.injuryRecords.listForPlayer(req.params.id);
      res.json(data);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/injuries", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { description, bodyPart, status, restrictions, injuredAt, expectedReturnAt } = req.body;
      if (!description || !injuredAt) {
        return res.status(400).json({ error: "description and injuredAt required" });
      }
      const row = await repo.injuryRecords.create({
        playerId: req.params.id,
        description,
        bodyPart,
        status: status ?? "active",
        restrictions,
        injuredAt: new Date(injuredAt),
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : void 0
      });
      res.status(201).json(row);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/injuries/:injuryId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { status, restrictions, expectedReturnAt, clearedAt, clearanceNotes } = req.body;
      await repo.injuryRecords.update(req.params.injuryId, {
        status,
        restrictions,
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : void 0,
        clearedAt: clearedAt ? new Date(clearedAt) : void 0,
        clearanceNotes
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/idp", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db = getDb();
      const { idps: idps2 } = schema_exports;
      const idpRows = await db.select().from(idps2).where(
        (0, import_drizzle_orm16.and)(
          (0, import_drizzle_orm16.eq)(idps2.orgId, ctx.orgId),
          (0, import_drizzle_orm16.eq)(idps2.playerId, req.params.id),
          (0, import_drizzle_orm16.isNull)(idps2.deletedAt)
        )
      ).orderBy((0, import_drizzle_orm16.desc)(idps2.createdAt)).limit(1);
      const idp = idpRows[0] ?? null;
      if (!idp) return res.json({ idp: null, focusAreas: [], comments: [] });
      const repo = createRepository(ctx);
      const [focusAreas, comments] = await Promise.all([
        repo.idpFocusAreas.listForIdp(idp.id),
        repo.idpComments.listForIdp(idp.id)
      ]);
      const hydrated = await Promise.all(
        focusAreas.map(async (fa) => {
          const [milestones, drills] = await Promise.all([
            repo.idpMilestones.listForFocusArea(fa.id),
            repo.idpDrillLinks.listForFocusArea(fa.id)
          ]);
          return { ...fa, milestones, drills };
        })
      );
      res.json({ idp, focusAreas: hydrated, comments });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/idp", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db = getDb();
      const { idps: idps2 } = schema_exports;
      const { season } = req.body;
      const [row] = await db.insert(idps2).values({
        orgId: ctx.orgId,
        playerId: req.params.id,
        season: season ?? (/* @__PURE__ */ new Date()).getFullYear() + "-" + String((/* @__PURE__ */ new Date()).getFullYear() + 1).slice(-2),
        coachId: ctx.userId,
        status: "active"
      }).returning();
      res.status(201).json(row);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/idp/generate", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const db = getDb();
      const { idps: idps2 } = schema_exports;
      const { idpId } = req.body;
      if (!idpId) return res.status(400).json({ error: "idpId required" });
      const assessments = await repo.skillAssessments.listForPlayer(req.params.id, 200);
      const byCategory = {};
      for (const a of assessments) {
        if (!byCategory[a.category]) {
          byCategory[a.category] = { total: 0, count: 0, subSkills: {} };
        }
        byCategory[a.category].total += a.score;
        byCategory[a.category].count += 1;
        const existing = byCategory[a.category].subSkills[a.subSkill] ?? [];
        byCategory[a.category].subSkills[a.subSkill] = [...existing, a.score];
      }
      const subSkillScores = [];
      for (const [category, data] of Object.entries(byCategory)) {
        for (const [subSkill, scores] of Object.entries(data.subSkills)) {
          const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
          subSkillScores.push({ category, subSkill, avg });
        }
      }
      subSkillScores.sort((a, b) => a.avg - b.avg);
      const top3 = subSkillScores.slice(0, 3);
      const created = [];
      for (let i = 0; i < top3.length; i++) {
        const item = top3[i];
        const fa = await repo.idpFocusAreas.create({
          idpId,
          playerId: req.params.id,
          priority: i + 1,
          category: item.category,
          subSkill: item.subSkill,
          currentScore: Math.round(item.avg),
          targetScore: Math.min(Math.round(item.avg) + 2, 10),
          status: "active"
        });
        created.push(fa);
      }
      res.status(201).json({ generated: created.length, focusAreas: created });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/idp/:idpId/focus-areas", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { category, subSkill, priority, emoji, currentScore, targetScore, deadline, coachNotes } = req.body;
      if (!category || !subSkill) {
        return res.status(400).json({ error: "category and subSkill required" });
      }
      const fa = await repo.idpFocusAreas.create({
        idpId: req.params.idpId,
        playerId: req.params.id,
        category,
        subSkill,
        priority: priority ?? 1,
        emoji: emoji ?? "\u{1F3C0}",
        currentScore,
        targetScore,
        deadline,
        coachNotes,
        status: "active"
      });
      res.status(201).json(fa);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/idp/:idpId/focus-areas/:faId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { category, subSkill, priority, emoji, currentScore, targetScore, deadline, status, coachNotes } = req.body;
      await repo.idpFocusAreas.update(req.params.faId, {
        category,
        subSkill,
        priority,
        emoji,
        currentScore,
        targetScore,
        deadline,
        status,
        coachNotes
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id/idp/:idpId/focus-areas/:faId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.idpFocusAreas.softDelete(req.params.faId);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/idp/:idpId/focus-areas/:faId/milestones", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { title, dueDate } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: "title required" });
      const m = await repo.idpMilestones.create({
        focusAreaId: req.params.faId,
        idpId: req.params.idpId,
        title,
        dueDate
      });
      res.status(201).json(m);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/idp/:idpId/focus-areas/:faId/milestones/:mId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { completed } = req.body;
      if (completed) {
        await repo.idpMilestones.complete(req.params.mId);
      } else {
        await repo.idpMilestones.unComplete(req.params.mId);
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/idp/:idpId/focus-areas/:faId/drills", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { drillId, drillTitle, reps, frequency } = req.body;
      if (!drillTitle?.trim()) return res.status(400).json({ error: "drillTitle required" });
      const dl = await repo.idpDrillLinks.create({
        focusAreaId: req.params.faId,
        idpId: req.params.idpId,
        drillId,
        drillTitle,
        reps,
        frequency
      });
      res.status(201).json(dl);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id/idp/:idpId/focus-areas/:faId/drills/:dlId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.idpDrillLinks.softDelete(req.params.dlId);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/idp/:idpId/comments", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { body, type, focusAreaId, linkedFilmSessionId } = req.body;
      if (!body?.trim()) return res.status(400).json({ error: "body required" });
      const comment = await repo.idpComments.create({
        idpId: req.params.idpId,
        body,
        type: type ?? "general",
        focusAreaId,
        linkedFilmSessionId
      });
      res.status(201).json(comment);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id/idp/:idpId/comments/:cId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.idpComments.softDelete(req.params.cId);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/attendance", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db = getDb();
      const { eventAttendance: eventAttendance2, events: events2 } = schema_exports;
      const limit = Math.min(Number(req.query.limit ?? 50), 200);
      const rows = await db.select({
        id: eventAttendance2.id,
        status: eventAttendance2.status,
        note: eventAttendance2.note,
        recordedAt: eventAttendance2.recordedAt,
        eventId: eventAttendance2.eventId,
        eventTitle: events2.title,
        eventType: events2.type,
        eventStartsAt: events2.startsAt,
        opponent: events2.opponent
      }).from(eventAttendance2).leftJoin(events2, (0, import_drizzle_orm16.eq)(eventAttendance2.eventId, events2.id)).where(
        (0, import_drizzle_orm16.and)(
          (0, import_drizzle_orm16.eq)(eventAttendance2.orgId, ctx.orgId),
          (0, import_drizzle_orm16.eq)(eventAttendance2.playerId, req.params.id)
        )
      ).orderBy((0, import_drizzle_orm16.desc)(events2.startsAt)).limit(limit);
      res.json(rows);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/assignments/routes.ts
function registerAssignmentRoutes(router) {
  router.get("/compliance/by-player", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const data = await repo.assignments.complianceByPlayer();
      res.json(data);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const items = await repo.assignments.list({
        playerId: req.query.playerId,
        status: req.query.status
      });
      res.json(items);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.assignments.getById(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.assignments.create(req.body);
      res.status(201).json(item);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.assignments.update(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.assignments.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/complete", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.assignments.update(req.params.id, {
        status: "submitted",
        submittedAt: /* @__PURE__ */ new Date()
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/review", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.assignments.update(req.params.id, {
        status: "reviewed",
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedByUserId: ctx.userId
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/practice-plans/routes.ts
function registerPracticePlanRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const items = await repo.practicePlans.list();
      res.json(items);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.practicePlans.getById(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.practicePlans.create(req.body);
      res.status(201).json(item);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.practicePlans.update(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.practicePlans.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/post-notes", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { postPracticeNotes } = req.body;
      await repo.practicePlans.update(req.params.id, { postPracticeNotes });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/inngest/client.ts
var import_inngest = require("inngest");
var inngest = new import_inngest.Inngest({
  id: "hoopsos",
  eventKey: process.env.INNGEST_EVENT_KEY
});

// server/modules/events/routes.ts
function registerEventRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const from = req.query.from ? new Date(req.query.from) : void 0;
      const items = await repo.events.list({ from });
      res.json(items);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.events.getById(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const item = await repo.events.create(req.body);
      res.status(201).json(item);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.events.update(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.events.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/availability", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { response, note } = req.body;
      const record = await repo.eventAvailability.upsert({
        eventId: req.params.id,
        playerId: ctx.userId,
        response,
        note
      });
      res.status(201).json(record);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/availability", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const records = await repo.eventAvailability.listForEvent(req.params.id);
      res.json(records);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/attendance", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { records } = req.body;
      const saved = await repo.eventAttendance.upsertBulk(
        req.params.id,
        records.map((r) => ({
          playerId: r.playerId,
          status: r.status,
          note: r.note,
          recordedByUserId: ctx.userId
        }))
      );
      const absentPlayers = records.filter((r) => r.status === "absent").map((r) => ({
        playerId: r.playerId,
        playerName: r.playerName ?? r.playerId,
        parentPhone: r.parentPhone,
        parentEmail: r.parentEmail
      }));
      if (absentPlayers.length > 0) {
        try {
          await inngest.send({
            name: "attendance/submitted",
            data: {
              eventId: req.params.id,
              orgId: ctx.orgId,
              eventTitle: "Practice",
              // TODO: load event title from DB
              eventDate: (/* @__PURE__ */ new Date()).toLocaleDateString(),
              absentPlayers,
              coachUserId: ctx.userId
            }
          });
        } catch (err) {
          console.warn("Inngest event failed:", err);
        }
      }
      res.status(201).json(saved);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/attendance", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const records = await repo.eventAttendance.listForEvent(req.params.id);
      res.json(records);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/readiness/score.ts
var T = {
  fatigue_flag: 7,
  sleep_flag: 5,
  // hours
  soreness_flag: 7,
  wearable_recovery_flag: 35,
  wearable_sleep_flag: 40,
  attendance_miss_flag: 2,
  // consecutive unexcused
  workload_flag: 15,
  // rolling 7-day points (≈ 5 HIGH sessions)
  overdue_assignments_flag: 2
};
function computeReadiness(signals) {
  const reasons = [];
  if (signals.override && new Date(signals.override.expiresAt) > /* @__PURE__ */ new Date()) {
    return {
      status: signals.override.status,
      confidence: "high",
      reasons: [],
      summary: `Coach override: ${signals.override.note}`
    };
  }
  if (signals.hasActiveInjury) reasons.push("injury_active");
  if (signals.playerStatus === "injured" || signals.playerStatus === "suspended") {
    reasons.push("player_suspended");
  }
  if (reasons.length > 0) {
    return {
      status: "RESTRICTED",
      confidence: "high",
      reasons,
      summary: buildSummary("RESTRICTED", reasons)
    };
  }
  let freshSignalCount = 0;
  if (signals.checkin != null) {
    freshSignalCount++;
    if (signals.checkin.fatigue >= T.fatigue_flag) reasons.push("fatigue_high");
    if (signals.checkin.sleep <= T.sleep_flag) reasons.push("sleep_low");
    if (signals.checkin.soreness >= T.soreness_flag) reasons.push("soreness_high");
  }
  if (signals.wearable != null) {
    freshSignalCount++;
    if (signals.wearable.recoveryScore != null && signals.wearable.recoveryScore <= T.wearable_recovery_flag) {
      reasons.push("wearable_recovery_low");
    }
    if (signals.wearable.sleepScore != null && signals.wearable.sleepScore <= T.wearable_sleep_flag) {
      reasons.push("wearable_sleep_low");
    }
  }
  if (signals.consecutiveUnexcusedAbsences != null) {
    freshSignalCount++;
    if (signals.consecutiveUnexcusedAbsences >= T.attendance_miss_flag) {
      reasons.push("attendance_streak_missed");
    }
  }
  if (signals.workloadPoints7d != null) {
    freshSignalCount++;
    if (signals.workloadPoints7d >= T.workload_flag) {
      reasons.push("workload_overload");
    }
  }
  if (signals.overdueAssignments != null) {
    freshSignalCount++;
    if (signals.overdueAssignments >= T.overdue_assignments_flag) {
      reasons.push("assignments_overdue");
    }
  }
  if (signals.hasMonitoringInjury) {
    reasons.push("injury_monitoring");
    freshSignalCount = Math.max(freshSignalCount, 1);
  }
  if (freshSignalCount === 0) {
    return {
      status: "UNKNOWN",
      confidence: "none",
      reasons: ["no_data"],
      summary: "No recent data \u2014 readiness unknown"
    };
  }
  const confidence = freshSignalCount >= 3 ? "high" : freshSignalCount === 2 ? "medium" : "low";
  const status = reasons.length > 0 ? "FLAGGED" : "READY";
  return {
    status,
    confidence,
    reasons,
    summary: buildSummary(status, reasons, confidence)
  };
}
var REASON_LABELS = {
  injury_active: "Active injury on file",
  injury_monitoring: "Injury under monitoring",
  player_suspended: "Player suspended/injured",
  fatigue_high: "High fatigue reported",
  sleep_low: "Low sleep reported",
  soreness_high: "High soreness reported",
  wearable_recovery_low: "Low wearable recovery score",
  wearable_sleep_low: "Low wearable sleep score",
  attendance_streak_missed: "Consecutive unexcused absences",
  workload_overload: "High 7-day workload accumulation",
  assignments_overdue: "Multiple overdue assignments",
  no_data: "No recent signals"
};
function buildSummary(status, reasons, confidence) {
  if (status === "READY") {
    const conf = confidence === "low" ? " (limited data)" : "";
    return `Ready to practice${conf}`;
  }
  if (status === "UNKNOWN") return "No recent data \u2014 readiness unknown";
  if (reasons.length === 0) return status;
  if (reasons.length === 1) return REASON_LABELS[reasons[0]];
  return reasons.slice(0, 2).map((r) => REASON_LABELS[r]).join("; ");
}

// server/modules/readiness/routes.ts
function registerReadinessRoutes(router) {
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { fatigue, sleep, soreness, mood, note } = req.body;
      const flagged = fatigue >= 7 || sleep <= 5 || soreness >= 7;
      const record = await repo.readiness.create({
        playerId: ctx.userId,
        fatigue,
        sleep,
        soreness,
        mood,
        note,
        flagged
      });
      if (flagged) {
        try {
          await inngest.send({
            name: "readiness/flagged",
            data: {
              checkinId: record.id,
              orgId: ctx.orgId,
              playerId: ctx.userId,
              playerName: "Unknown",
              coachUserId: ctx.userId,
              fatigue,
              sleep,
              soreness,
              note
            }
          });
        } catch (err) {
          console.warn("Inngest not available:", err);
        }
      }
      res.status(201).json(record);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/today", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const records = await repo.readiness.listToday();
      res.json(records);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const days = req.query.days ? Number(req.query.days) : 30;
      const records = await repo.readiness.listForPlayer(req.params.playerId, days);
      res.json(records);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/team", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const [todayCheckins, players2, injuries, overrides] = await Promise.all([
        repo.readiness.listToday(),
        repo.players.listActive(),
        repo.injuries.listActive(),
        repo.readinessOverrides.listActive(ctx.orgId)
      ]);
      const checkinByPlayer = Object.fromEntries(
        todayCheckins.map((c) => [c.playerId, c])
      );
      const injuryByPlayer = {};
      for (const inj of injuries) {
        if (!injuryByPlayer[inj.playerId]) {
          injuryByPlayer[inj.playerId] = { active: false, monitoring: false };
        }
        if (inj.status === "active") injuryByPlayer[inj.playerId].active = true;
        if (inj.status === "monitoring") injuryByPlayer[inj.playerId].monitoring = true;
      }
      const overrideByPlayer = Object.fromEntries(
        overrides.map((o) => [
          o.playerId,
          { status: o.status, note: o.note ?? "", expiresAt: o.expiresAt }
        ])
      );
      const results = players2.map((player) => {
        const checkin = checkinByPlayer[player.id] ?? null;
        const inj = injuryByPlayer[player.id];
        const result = computeReadiness({
          checkin: checkin ? { fatigue: checkin.fatigue, sleep: checkin.sleep, soreness: checkin.soreness } : null,
          hasActiveInjury: inj?.active ?? false,
          hasMonitoringInjury: inj?.monitoring ?? false,
          playerStatus: player.status ?? null,
          override: overrideByPlayer[player.id] ?? null
        });
        return {
          playerId: player.id,
          playerName: player.name,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          avatarUrl: player.avatarUrl,
          checkinSubmitted: checkin != null,
          ...result
        };
      });
      res.json(results);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/player/:playerId/override", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { status, note } = req.body;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      const override = await repo.readinessOverrides.upsert({
        orgId: ctx.orgId,
        playerId: req.params.playerId,
        coachUserId: ctx.userId,
        status,
        note,
        expiresAt
      });
      res.status(201).json(override);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/player/:playerId/override", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.readinessOverrides.remove(ctx.orgId, req.params.playerId);
      res.status(204).end();
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/messaging/routes.ts
init_players();
init_guardians();
init_messages();
var import_drizzle_orm17 = require("drizzle-orm");
init_twilio();

// server/modules/messaging/recipient-resolver.ts
function activeOnly(players2) {
  return players2.filter((p) => !p.deletedAt && p.status !== "inactive");
}
function scopePlayers(all, scope, selectedIds) {
  if (scope === "all") return activeOnly(all);
  return activeOnly(all).filter((p) => selectedIds.includes(p.id));
}
function toResolvedPlayer(p) {
  return { playerId: p.id, name: p.name, userId: p.userId ?? null };
}
function guardianHasContact(g) {
  return !!(g.email || g.phone);
}
function dedupeGuardians(guardians) {
  const seen = /* @__PURE__ */ new Set();
  return guardians.filter((g) => {
    const key = g.email ?? `phone:${g.phone}` ?? `id:${g.guardianId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function resolveRecipients(spec, allPlayers, allGuardians) {
  const { mode, playerScope, selectedPlayerIds, individuals } = spec;
  const playerWarnings = [];
  const guardianWarnings = [];
  function getTargetPlayers() {
    return scopePlayers(allPlayers, playerScope, selectedPlayerIds);
  }
  function getGuardiansFor(players2) {
    const playerIds = new Set(players2.map((p) => p.id));
    return allGuardians.filter((g) => !g.deletedAt && g.canReceiveMessages && playerIds.has(g.playerId)).map((g) => ({
      guardianId: g.id,
      playerId: g.playerId,
      playerName: players2.find((p) => p.id === g.playerId)?.name ?? "",
      name: g.name,
      email: g.email ?? null,
      phone: g.phone ?? null
    }));
  }
  if (mode === "players") {
    const targets = getTargetPlayers();
    return {
      players: targets.map(toResolvedPlayer),
      guardians: [],
      totalContacts: targets.length,
      playerWarnings,
      guardianWarnings
    };
  }
  if (mode === "parents") {
    const targets = getTargetPlayers();
    const resolved = getGuardiansFor(targets);
    for (const player of targets) {
      const hasGuardian = resolved.some((g) => g.playerId === player.id);
      if (!hasGuardian) {
        playerWarnings.push({
          playerId: player.id,
          playerName: player.name,
          message: "No linked guardian \u2014 will not receive this message"
        });
      }
    }
    for (const g of allGuardians.filter(
      (g2) => !g2.deletedAt && targets.some((p) => p.id === g2.playerId)
    )) {
      if (!guardianHasContact(g)) {
        guardianWarnings.push({
          playerId: g.playerId,
          playerName: targets.find((p) => p.id === g.playerId)?.name ?? "",
          message: `${g.name} has no email or phone on file`
        });
      }
    }
    const deduped = dedupeGuardians(resolved);
    return {
      players: [],
      guardians: deduped,
      totalContacts: deduped.length,
      playerWarnings,
      guardianWarnings
    };
  }
  if (mode === "both") {
    const targets = getTargetPlayers();
    const guardians = getGuardiansFor(targets);
    for (const player of targets) {
      const hasGuardian = guardians.some((g) => g.playerId === player.id);
      if (!hasGuardian) {
        playerWarnings.push({
          playerId: player.id,
          playerName: player.name,
          message: "No linked guardian \u2014 guardian message will not be sent"
        });
      }
    }
    const deduped = dedupeGuardians(guardians);
    return {
      players: targets.map(toResolvedPlayer),
      guardians: deduped,
      totalContacts: targets.length + deduped.length,
      playerWarnings,
      guardianWarnings
    };
  }
  if (mode === "individuals") {
    const resolvedPlayers = [];
    const resolvedGuardians = [];
    for (const item of individuals) {
      if (item.type === "player") {
        const player = allPlayers.find((p) => p.id === item.playerId);
        if (player) resolvedPlayers.push(toResolvedPlayer(player));
      } else {
        const g = allGuardians.find((g2) => g2.id === item.id);
        const player = allPlayers.find((p) => p.id === item.playerId);
        if (g && player) {
          resolvedGuardians.push({
            guardianId: g.id,
            playerId: g.playerId,
            playerName: player.name,
            name: g.name,
            email: g.email ?? null,
            phone: g.phone ?? null
          });
        }
      }
    }
    const deduped = dedupeGuardians(resolvedGuardians);
    return {
      players: resolvedPlayers,
      guardians: deduped,
      totalContacts: resolvedPlayers.length + deduped.length,
      playerWarnings,
      guardianWarnings
    };
  }
  return {
    players: [],
    guardians: [],
    totalContacts: 0,
    playerWarnings: [],
    guardianWarnings: []
  };
}

// server/modules/messaging/routes.ts
function registerMessagingRoutes(router) {
  router.get("/threads", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const threads = await repo.messages.listThreads();
      res.json(threads);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/threads", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const thread = await repo.messages.createThread({
        ...req.body,
        createdByUserId: ctx.userId
      });
      res.status(201).json(thread);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/threads/:threadId/messages", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const msgs = await repo.messages.listMessages(req.params.threadId);
      res.json(msgs);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/threads/:threadId/messages", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const msg = await repo.messages.createMessage({
        threadId: req.params.threadId,
        senderUserId: ctx.userId,
        body: req.body.body
      });
      if (req.body.notifySms && req.body.recipientPhone) {
        try {
          await sendSms(
            req.body.recipientPhone,
            `HoopsOS message from your coach: ${req.body.body.substring(0, 140)}`
          );
        } catch (smsErr) {
          console.warn("SMS notification failed:", smsErr);
        }
      }
      res.status(201).json(msg);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/resolve-audience", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const spec = req.body;
      const [allPlayers, allGuardians] = await Promise.all([
        getDb().select().from(players).where((0, import_drizzle_orm17.and)((0, import_drizzle_orm17.eq)(players.orgId, ctx.orgId), (0, import_drizzle_orm17.isNull)(players.deletedAt))),
        getDb().select().from(playerGuardians).where((0, import_drizzle_orm17.and)((0, import_drizzle_orm17.eq)(playerGuardians.orgId, ctx.orgId), (0, import_drizzle_orm17.isNull)(playerGuardians.deletedAt)))
      ]);
      const audience = resolveRecipients(spec, allPlayers, allGuardians);
      res.json({
        playerCount: audience.players.length,
        guardianCount: audience.guardians.length,
        totalContacts: audience.totalContacts,
        playerWarnings: audience.playerWarnings,
        guardianWarnings: audience.guardianWarnings
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/compose", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { spec, title, body } = req.body;
      if (!body?.trim()) {
        return res.status(400).json({ error: "Message body is required" });
      }
      const [allPlayers, allGuardians] = await Promise.all([
        getDb().select().from(players).where((0, import_drizzle_orm17.and)((0, import_drizzle_orm17.eq)(players.orgId, ctx.orgId), (0, import_drizzle_orm17.isNull)(players.deletedAt))),
        getDb().select().from(playerGuardians).where((0, import_drizzle_orm17.and)((0, import_drizzle_orm17.eq)(playerGuardians.orgId, ctx.orgId), (0, import_drizzle_orm17.isNull)(playerGuardians.deletedAt)))
      ]);
      const audience = resolveRecipients(spec, allPlayers, allGuardians);
      if (audience.totalContacts === 0) {
        return res.status(400).json({ error: "Recipient spec resolved to zero contacts" });
      }
      const repo = createRepository(ctx);
      const threadType = spec.mode === "individuals" || spec.mode === "players" ? "broadcast" : spec.mode === "parents" ? "parent_dm" : "broadcast";
      const participantIds = [
        ...audience.players.map((p) => p.userId).filter(Boolean)
      ];
      const thread = await repo.messages.createThread({
        type: threadType,
        audienceMode: spec.mode,
        title: title || null,
        participantIds,
        resolvedRecipientCount: audience.totalContacts,
        createdByUserId: ctx.userId
      });
      const message = await repo.messages.createMessage({
        threadId: thread.id,
        senderUserId: ctx.userId,
        body
      });
      const recipientRows = [
        ...audience.players.map((p) => ({
          orgId: ctx.orgId,
          threadId: thread.id,
          messageId: message.id,
          recipientType: "player",
          playerId: p.playerId,
          guardianId: null,
          userId: p.userId,
          contactEmail: null,
          contactPhone: null
        })),
        ...audience.guardians.map((g) => ({
          orgId: ctx.orgId,
          threadId: thread.id,
          messageId: message.id,
          recipientType: "guardian",
          playerId: g.playerId,
          guardianId: g.guardianId,
          userId: null,
          contactEmail: g.email,
          contactPhone: g.phone
        }))
      ];
      if (recipientRows.length > 0) {
        await getDb().insert(messageRecipients).values(recipientRows);
      }
      const smsTargets = audience.guardians.filter((g) => g.phone);
      if (smsTargets.length > 0) {
        const preview = body.substring(0, 140);
        const smsBody = `HoopsOS message from your coach: ${preview}`;
        try {
          const { sendBroadcastSms } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
          await sendBroadcastSms(smsTargets.map((g) => g.phone), smsBody);
        } catch (smsErr) {
          console.warn("[messaging] SMS broadcast failed:", smsErr);
        }
      }
      res.status(201).json({
        thread,
        message,
        audience: {
          playerCount: audience.players.length,
          guardianCount: audience.guardians.length,
          totalContacts: audience.totalContacts,
          warnings: [...audience.playerWarnings, ...audience.guardianWarnings]
        }
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/broadcast-sms", async (req, res) => {
    try {
      await requireOrg(req);
      const { recipients, message } = req.body;
      if (!Array.isArray(recipients) || !message) {
        return res.status(400).json({ error: "recipients[] and message required" });
      }
      const { sendBroadcastSms } = await Promise.resolve().then(() => (init_twilio(), twilio_exports));
      const result = await sendBroadcastSms(recipients, message);
      res.json(result);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/wearables/routes.ts
var VALID_PROVIDERS = ["apple_health", "whoop", "garmin", "oura"];
function isValidProvider(p) {
  return VALID_PROVIDERS.includes(p);
}
function registerWearableRoutes(router) {
  router.get("/me/connections", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const connections = await repo.wearableConnections.list({ playerId: ctx.userId });
      res.json(connections);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/me/metrics", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const metrics = await repo.wearableMetrics.getLatest(ctx.userId);
      res.json(metrics);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/me/metrics/history", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const days = req.query.days ? Number(req.query.days) : 30;
      const history = await repo.wearableMetrics.getHistory(ctx.userId, days);
      res.json(history);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/me/sharing", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const sharing = await repo.wearableSharing.get(ctx.userId);
      res.json(sharing ?? {
        shareRecovery: false,
        shareSleep: false,
        shareStrain: false,
        shareHeartRate: false,
        shareWithCoaches: false,
        shareWithTeam: false
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/me/sharing", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const {
        shareRecovery,
        shareSleep,
        shareStrain,
        shareHeartRate,
        shareWithCoaches,
        shareWithTeam
      } = req.body;
      const updated = await repo.wearableSharing.upsert(ctx.userId, {
        ...shareRecovery !== void 0 ? { shareRecovery } : {},
        ...shareSleep !== void 0 ? { shareSleep } : {},
        ...shareStrain !== void 0 ? { shareStrain } : {},
        ...shareHeartRate !== void 0 ? { shareHeartRate } : {},
        ...shareWithCoaches !== void 0 ? { shareWithCoaches } : {},
        ...shareWithTeam !== void 0 ? { shareWithTeam } : {}
      });
      res.json(updated);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/connect/:provider", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { provider } = req.params;
      if (!isValidProvider(provider)) {
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
      }
      const repo = createRepository(ctx);
      const connection = await repo.wearableConnections.upsertConnection({
        playerId: ctx.userId,
        provider,
        status: "pending"
      });
      res.status(201).json({
        connectionId: connection.id,
        authUrl: null,
        message: "OAuth flow coming soon \u2014 connection created in pending state"
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/disconnect/:provider", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { provider } = req.params;
      if (!isValidProvider(provider)) {
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
      }
      const repo = createRepository(ctx);
      const connections = await repo.wearableConnections.getByPlayer(ctx.userId);
      const match = connections.find((c) => c.provider === provider);
      if (!match) {
        return res.status(404).json({ error: "Connection not found" });
      }
      await repo.wearableConnections.disconnect(match.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { playerId } = req.params;
      const repo = createRepository(ctx);
      const allowed = await repo.wearableSharing.canCoachView(playerId);
      if (!allowed) {
        return res.status(403).json({ error: "Player has not shared wearable data" });
      }
      const metrics = await repo.wearableMetrics.getLatest(playerId);
      res.json(metrics);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/lib/openai.ts
var import_openai = __toESM(require("openai"), 1);
var client = null;
function getOpenAI() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    client = new import_openai.default({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}
async function generateWod(params) {
  const openai = getOpenAI();
  const wearableContext = params.wearableSnapshot ? `
WEARABLE DATA (today):
- Recovery: ${params.wearableSnapshot.recoveryScore ?? "unknown"}/100
- Sleep: ${params.wearableSnapshot.sleepScore ?? "unknown"}/100
- Strain: ${params.wearableSnapshot.strainScore ?? "unknown"}
${(params.wearableSnapshot.recoveryScore ?? 100) < 40 ? "\u26A0\uFE0F Low recovery \u2014 reduce volume, no conditioning block." : ""}
${(params.wearableSnapshot.recoveryScore ?? 100) >= 67 ? "\u2705 Well-recovered \u2014 full intensity is fine." : ""}` : "";
  const prompt = `You are an elite basketball skills trainer. Design a personalized daily workout (WOD) for a player.

PLAYER: ${params.playerName}${params.position ? ` (${params.position})` : ""}
FOCUS AREAS: ${params.focusAreas.join(", ")}
TARGET DURATION: ${params.targetMinutes} minutes total
INTENSITY: ${params.intensity}${wearableContext}
${params.coachNotes ? `COACH NOTES: ${params.coachNotes}` : ""}

BLOCK TYPES available: warmup, skill, shooting, finishing, footwork, defense, conditioning, competitive, recovery

RULES:
- Always start with warmup (5-8 min) and end with recovery (3-5 min)
- Block minutes must sum close to ${params.targetMinutes}
- Each block needs 2-3 short coaching cues and 1-2 measurable success metrics
- Use specific, real drill names (e.g. "Mikan Drill", "Chair Shooting Series", "2-Ball Stationary")
- Intensity ${params.intensity}: ${params.intensity === "high" ? "max effort, include conditioning block" : params.intensity === "low" ? "technical, no conditioning" : "moderate volume, optional conditioning"}

Respond with valid JSON only, matching this exact shape:
{
  "theme": "short session theme",
  "rationale": "2-3 sentence coaching rationale",
  "blocks": [
    {
      "block_type": "warmup",
      "drill_name": "specific drill name",
      "minutes": 7,
      "coaching_points": ["cue 1", "cue 2"],
      "success_metrics": ["metric 1"]
    }
  ]
}`;
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }]
  });
  const text28 = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text28);
}

// server/modules/wods/routes.ts
function registerWodRoutes(router) {
  router.get("/health", (_req, res) => {
    res.json({
      openai_key_set: !!process.env.OPENAI_API_KEY,
      openai_model: process.env.OPENAI_MODEL ?? "gpt-4o (default)"
    });
  });
  router.post("/generate", async (req, res) => {
    try {
      const {
        playerName,
        position,
        focusAreas,
        targetMinutes,
        intensity,
        coachNotes,
        wearableSnapshot
      } = req.body;
      if (!playerName || !focusAreas?.length || !targetMinutes || !intensity) {
        res.status(400).json({ error: "playerName, focusAreas, targetMinutes, and intensity are required" });
        return;
      }
      const result = await generateWod({
        playerName,
        position,
        focusAreas,
        targetMinutes: Math.min(Math.max(targetMinutes, 15), 120),
        intensity,
        coachNotes,
        wearableSnapshot
      });
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = err.status ?? 500;
      console.error("[WOD generate]", message);
      res.status(status).json({ error: message });
    }
  });
}

// server/modules/coaching-actions/routes.ts
function registerCoachingActionRoutes(router) {
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const {
        sessionId,
        annotationId,
        playerId,
        issueCategory,
        issueSeverity,
        timestampMs,
        coachNote,
        actionType
      } = req.body;
      if (!sessionId || !actionType) {
        return res.status(400).json({ error: "sessionId and actionType required" });
      }
      const action = await repo.coachingActions.create({
        sessionId,
        annotationId,
        playerId,
        issueCategory,
        issueSeverity,
        timestampMs,
        coachNote,
        actionType,
        status: actionType === "mark_addressed" ? "resolved" : "open",
        ...actionType === "mark_addressed" ? { resolvedAt: /* @__PURE__ */ new Date(), resolvedNote: "Marked addressed by coach" } : {}
      });
      await inngest.send({
        name: "coaching-action/created",
        data: {
          actionId: action.id,
          orgId: ctx.orgId,
          actionType,
          playerId: playerId ?? null,
          sessionId,
          coachNote,
          issueCategory,
          authorUserId: ctx.userId
        }
      });
      res.status(201).json(action);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const limit = Math.min(Number(req.query.limit ?? 100), 200);
      const actions = await repo.coachingActions.listForPlayer(req.params.playerId, limit);
      res.json(actions);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/session/:sessionId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const actions = await repo.coachingActions.listForSession(req.params.sessionId);
      res.json(actions);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/player/me", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { actionType, status } = req.query;
      const all = await repo.coachingActions.listForPlayer(ctx.userId, 100);
      let filtered = all;
      if (actionType) filtered = filtered.filter((a) => a.actionType === actionType);
      if (status) filtered = filtered.filter((a) => a.status === status);
      res.json(filtered);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/open", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const actions = await repo.coachingActions.listOpen();
      res.json(actions);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/status", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { status, assignmentId, idpFocusAreaId, followUpSessionId, resolvedNote } = req.body;
      if (!status) return res.status(400).json({ error: "status required" });
      await repo.coachingActions.updateStatus(req.params.id, status, {
        assignmentId,
        idpFocusAreaId,
        followUpSessionId,
        resolvedNote
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/resolve", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { resolvedNote, followUpSessionId } = req.body;
      await repo.coachingActions.updateStatus(req.params.id, "resolved", {
        resolvedNote,
        followUpSessionId
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/dismiss", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.coachingActions.updateStatus(req.params.id, "dismissed");
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/parent/access.ts
var import_drizzle_orm18 = require("drizzle-orm");
init_guardians();
async function validateParentChildAccess(orgId, guardianUserId, playerId) {
  const db = getDb();
  const [row] = await db.select({ id: playerGuardians.id }).from(playerGuardians).where(
    (0, import_drizzle_orm18.and)(
      (0, import_drizzle_orm18.eq)(playerGuardians.orgId, orgId),
      (0, import_drizzle_orm18.eq)(playerGuardians.guardianUserId, guardianUserId),
      (0, import_drizzle_orm18.eq)(playerGuardians.playerId, playerId),
      (0, import_drizzle_orm18.isNull)(playerGuardians.deletedAt)
    )
  ).limit(1);
  if (!row) {
    throw new HttpError(
      403,
      "Access denied: no guardian relationship found for this player."
    );
  }
}

// server/modules/parent/routes.ts
function registerParentRoutes(router) {
  router.get("/children", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      const repo = createRepository(ctx);
      const guardianRows = await repo.guardians.listPlayersForGuardian(ctx.userId);
      if (guardianRows.length === 0) {
        return res.json([]);
      }
      const playerIds = guardianRows.map((g) => g.playerId);
      const allPlayers = await repo.players.list();
      const children = allPlayers.filter((p) => playerIds.includes(p.id));
      res.json(children);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/child/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);
      const player = await repo.players.getById(req.params.playerId);
      if (!player) return res.status(404).json({ error: "Player not found" });
      const { medicalNotes: _med, academicNotes: _ac, ...safe } = player;
      res.json(safe);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/child/:playerId/assignments", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);
      const all = await repo.assignments.listForPlayer(req.params.playerId);
      const parentView = all.map(({ payload: _p, ...a }) => a);
      res.json(parentView);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/child/:playerId/schedule", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);
      const evts = await repo.events.listUpcoming();
      res.json(evts);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/child/:playerId/attendance", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);
      const records = await repo.events.listAttendanceForPlayer(req.params.playerId);
      res.json(records);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/child/:playerId/availability", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);
      const { eventId, status, note } = req.body;
      if (!eventId || !status) {
        return res.status(400).json({ error: "eventId and status required" });
      }
      await repo.events.upsertAvailability({
        playerId: req.params.playerId,
        eventId,
        status,
        note,
        respondedByUserId: ctx.userId
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/child/:playerId/development", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);
      const focusAreas = await repo.idpFocusAreas.listForPlayer(req.params.playerId);
      const visible = focusAreas.filter((f) => f.guardianVisible !== false);
      const parentView = visible.map(({ coachPrivateNote: _n, ...f }) => f);
      res.json(parentView);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/child/:playerId/waivers", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);
      const [templates, signatures] = await Promise.all([
        repo.waivers.listTemplates(),
        repo.waivers.listSignaturesForPlayer(req.params.playerId)
      ]);
      const signatureMap = Object.fromEntries(
        signatures.map((s) => [s.templateId, s])
      );
      const combined = templates.map((t) => ({
        ...t,
        signature: signatureMap[t.id] ?? null
      }));
      res.json(combined);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/announcements/routes.ts
function registerAnnouncementRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const items = await repo.announcements.listForRole(ctx.role);
      res.json(items);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(
        req,
        ORG_ROLES.COACH,
        ORG_ROLES.OWNER,
        ORG_ROLES.ADMIN
      );
      const repo = createRepository(ctx);
      const {
        title,
        body,
        priority,
        pinned,
        tags,
        audienceRoles,
        teamId,
        expiresAt,
        authorName
      } = req.body;
      if (!title || !body || !authorName) {
        return res.status(400).json({ error: "title, body, and authorName required" });
      }
      const announcement = await repo.announcements.create({
        title,
        body,
        priority: priority ?? "normal",
        pinned: pinned ?? false,
        tags: tags ?? [],
        audienceRoles: audienceRoles ?? null,
        teamId: teamId ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorName,
        publishedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date()
      });
      res.status(201).json(announcement);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/pin", async (req, res) => {
    try {
      const ctx = await requireOrgRole(
        req,
        ORG_ROLES.COACH,
        ORG_ROLES.OWNER,
        ORG_ROLES.ADMIN
      );
      const repo = createRepository(ctx);
      const { pinned } = req.body;
      await repo.announcements.pin(req.params.id, pinned ?? true);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      await repo.announcements.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/waivers/routes.ts
function registerWaiverRoutes(router) {
  router.get("/templates", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const templates = await repo.waivers.listTemplates();
      res.json(templates);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/templates", async (req, res) => {
    try {
      const ctx = await requireOrgRole(
        req,
        ORG_ROLES.COACH,
        ORG_ROLES.OWNER,
        ORG_ROLES.ADMIN
      );
      const repo = createRepository(ctx);
      const { title, description, category, bodyMarkdown, required, expiresAfterDays } = req.body;
      if (!title || !description || !category) {
        return res.status(400).json({ error: "title, description, and category required" });
      }
      const [template] = await repo.waivers.listTemplates();
      const result = await createRepository(ctx).waivers.listTemplates();
      res.status(201).json({
        title,
        description,
        category,
        bodyMarkdown: bodyMarkdown ?? "",
        required: required ?? true,
        expiresAfterDays: expiresAfterDays ?? null
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      }
      const [templates, signatures] = await Promise.all([
        repo.waivers.listTemplates(),
        repo.waivers.listSignaturesForPlayer(req.params.playerId)
      ]);
      const sigMap = Object.fromEntries(signatures.map((s) => [s.templateId, s]));
      res.json(templates.map((t) => ({ ...t, signature: sigMap[t.id] ?? null })));
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:templateId/sign", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      const { playerId, consentAcknowledged } = req.body;
      if (!playerId) {
        return res.status(400).json({ error: "playerId required" });
      }
      if (consentAcknowledged !== true) {
        return res.status(400).json({
          error: "Consent must be explicitly acknowledged (consentAcknowledged: true)"
        });
      }
      await validateParentChildAccess(ctx.orgId, ctx.userId, playerId);
      const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? req.ip ?? "unknown";
      const userAgent = req.get("user-agent") ?? "unknown";
      const repo = createRepository(ctx);
      const signature = await repo.waivers.signWaiver({
        templateId: req.params.templateId,
        playerId,
        signedByUserId: ctx.userId,
        status: "signed",
        signedAt: /* @__PURE__ */ new Date(),
        ipAddress,
        userAgent,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
        // expiresAt calculated from template.expiresAfterDays in a real impl
      });
      res.status(201).json(signature);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/lib/slugify.ts
function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "") || "untitled";
}

// server/modules/seasons/routes.ts
function registerSeasonRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const includeArchived = req.query.includeArchived === "true";
      const seasons2 = await repo.seasons.list({ includeArchived });
      res.json(seasons2);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const season = await repo.seasons.getById(req.params.id);
      if (!season) return res.status(404).json({ error: "Season not found" });
      res.json(season);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const { name, description, startsAt, endsAt, registrationOpensAt, registrationClosesAt, maxRoster } = req.body;
      if (!name) return res.status(400).json({ error: "name is required" });
      const slug = slugify(name);
      const season = await repo.seasons.create({
        name,
        slug,
        description,
        startsAt: startsAt ? new Date(startsAt) : void 0,
        endsAt: endsAt ? new Date(endsAt) : void 0,
        registrationOpensAt: registrationOpensAt ? new Date(registrationOpensAt) : void 0,
        registrationClosesAt: registrationClosesAt ? new Date(registrationClosesAt) : void 0,
        maxRoster: maxRoster ?? null
      });
      res.status(201).json(season);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const allowed = ["name", "description", "status", "startsAt", "endsAt", "registrationOpensAt", "registrationClosesAt", "maxRoster"];
      const patch = {};
      for (const key of allowed) {
        if (key in req.body) {
          patch[key] = ["startsAt", "endsAt", "registrationOpensAt", "registrationClosesAt"].includes(key) && req.body[key] ? new Date(req.body[key]) : req.body[key];
        }
      }
      if (patch.name) patch.slug = slugify(patch.name);
      const updated = await repo.seasons.update(req.params.id, patch);
      if (!updated) return res.status(404).json({ error: "Season not found" });
      res.json(updated);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      await repo.seasons.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/teams", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const season = await repo.seasons.getById(req.params.id);
      if (!season) return res.status(404).json({ error: "Season not found" });
      const teamsResult = await repo.teams.list({ seasonId: req.params.id });
      res.json(teamsResult);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/registrations/summary", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const counts = await repo.registrations.countByStatus(req.params.id);
      res.json(counts);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/teams/routes.ts
function registerTeamRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const teamsResult = await repo.teams.list({
        seasonId: req.query.seasonId,
        activeOnly: req.query.activeOnly !== "false"
      });
      res.json(teamsResult);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const team = await repo.teams.getById(req.params.id);
      if (!team) return res.status(404).json({ error: "Team not found" });
      res.json(team);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const { name, seasonId, ageGroup, gender, headCoachUserId, colorPrimary } = req.body;
      if (!name) return res.status(400).json({ error: "name is required" });
      const team = await repo.teams.create({
        name,
        slug: slugify(name),
        seasonId: seasonId ?? null,
        ageGroup: ageGroup ?? "other",
        gender: gender ?? "boys",
        headCoachUserId: headCoachUserId ?? null,
        colorPrimary: colorPrimary ?? null
      });
      res.status(201).json(team);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const allowed = ["name", "seasonId", "ageGroup", "gender", "headCoachUserId", "assistantCoachUserIds", "colorPrimary", "colorSecondary", "logoUrl", "isActive"];
      const patch = {};
      for (const key of allowed) {
        if (key in req.body) patch[key] = req.body[key];
      }
      if (patch.name) patch.slug = slugify(patch.name);
      const updated = await repo.teams.update(req.params.id, patch);
      if (!updated) return res.status(404).json({ error: "Team not found" });
      res.json(updated);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      await repo.teams.softDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/roster", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const team = await repo.teams.getById(req.params.id);
      if (!team) return res.status(404).json({ error: "Team not found" });
      const roster = await repo.teams.getRoster(req.params.id);
      res.json(roster);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/roster", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const { playerId, jerseyNumber, status } = req.body;
      if (!playerId) return res.status(400).json({ error: "playerId is required" });
      const entry = await repo.teams.addToRoster({
        teamId: req.params.id,
        playerId,
        jerseyNumber: jerseyNumber ?? null,
        status: status ?? "active"
      });
      res.status(201).json(entry);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.delete("/:id/roster/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      await repo.teams.removeFromRoster(req.params.id, req.params.playerId);
      res.json({ ok: true });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/lib/invoiceNumber.ts
var import_drizzle_orm19 = require("drizzle-orm");
async function generateInvoiceNumber(orgId) {
  const db = getDb();
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const [result] = await db.select({ count: import_drizzle_orm19.sql`count(*)::int` }).from(invoices).where((0, import_drizzle_orm19.eq)(invoices.orgId, orgId));
  const seq = (result?.count ?? 0) + 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}

// server/modules/registrations/routes.ts
function registerRegistrationRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const regs = await repo.registrations.list({
        seasonId: req.query.seasonId,
        status: req.query.status,
        playerId: req.query.playerId
      });
      res.json(regs);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/my", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      const repo = createRepository(ctx);
      const guardianRows = await repo.guardians.listPlayersForGuardian(ctx.userId);
      const playerIds = guardianRows.map((g) => g.playerId);
      if (playerIds.length === 0) return res.json([]);
      const all = await Promise.all(
        playerIds.map((pid) => repo.registrations.list({ playerId: pid }))
      );
      res.json(all.flat());
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const reg = await repo.registrations.getById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration not found" });
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, reg.playerId);
      }
      res.json(reg);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { playerId, seasonId, planId, teamId } = req.body;
      if (!playerId || !seasonId) {
        return res.status(400).json({ error: "playerId and seasonId are required" });
      }
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, playerId);
      }
      let effectiveAmount = 0;
      if (planId) {
        const plan = await repo.membershipPlans.getById(planId);
        if (!plan) return res.status(404).json({ error: "Plan not found" });
        if (plan.status !== "active") return res.status(400).json({ error: "Plan is not active" });
        effectiveAmount = plan.priceAmount;
        if (plan.earlyBirdAmount && plan.earlyBirdDeadline && /* @__PURE__ */ new Date() <= plan.earlyBirdDeadline) {
          effectiveAmount = effectiveAmount - plan.earlyBirdAmount;
        }
      }
      const reg = await repo.registrations.create({
        playerId,
        seasonId,
        planId: planId ?? null,
        teamId: teamId ?? null,
        status: "pending",
        effectiveAmount,
        discountAmount: 0
      });
      res.status(201).json(reg);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/status", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const { status, adminNotes } = req.body;
      const validStatuses = ["accepted", "denied", "waitlisted", "cancelled", "active", "incomplete"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      const reg = await repo.registrations.getById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration not found" });
      const updated = await repo.registrations.updateStatus(req.params.id, status, {
        adminNotes,
        acceptedByUserId: ctx.userId
      });
      if (status === "accepted" && reg.planId && !reg.effectiveAmount) {
      } else if (status === "accepted" && reg.effectiveAmount > 0) {
        const plan = reg.planId ? await repo.membershipPlans.getById(reg.planId) : null;
        const invoiceNumber = await generateInvoiceNumber(ctx.orgId);
        const invoice = await repo.invoices.create({
          seasonId: reg.seasonId ?? void 0,
          registrationId: reg.id,
          playerId: reg.playerId,
          invoiceNumber,
          status: "open",
          subtotal: reg.effectiveAmount,
          discountAmount: reg.discountAmount,
          taxAmount: 0,
          totalAmount: reg.effectiveAmount - reg.discountAmount,
          amountPaid: 0,
          amountDue: reg.effectiveAmount - reg.discountAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
          // 30 days out
          issuedAt: /* @__PURE__ */ new Date(),
          memo: plan ? `${plan.name} \u2014 ${reg.seasonId ?? "registration"}` : "Season registration"
        });
        await repo.invoices.addItem({
          invoiceId: invoice.id,
          type: "membership",
          description: plan?.name ?? "Season Registration",
          quantity: 1,
          unitAmount: reg.effectiveAmount,
          totalAmount: reg.effectiveAmount,
          membershipPlanId: reg.planId ?? void 0,
          sortOrder: 0
        });
        if (reg.discountAmount > 0) {
          await repo.invoices.addItem({
            invoiceId: invoice.id,
            type: "discount",
            description: reg.discountReason ?? "Discount",
            quantity: 1,
            unitAmount: -reg.discountAmount,
            totalAmount: -reg.discountAmount,
            sortOrder: 1
          });
        }
        return res.json({ registration: updated, invoice });
      }
      res.json({ registration: updated });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/cancel", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const reg = await repo.registrations.getById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration not found" });
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, reg.playerId);
        if (reg.status === "active") {
          return res.status(403).json({ error: "Contact your program admin to cancel an active registration" });
        }
      }
      const updated = await repo.registrations.updateStatus(req.params.id, "cancelled");
      res.json(updated);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/invoices/routes.ts
function registerInvoiceRoutes(router) {
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const invoiceList = await repo.invoices.list({
        playerId: req.query.playerId,
        status: req.query.status,
        seasonId: req.query.seasonId,
        overdue: req.query.overdue === "true"
      });
      res.json(invoiceList);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/my", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      const repo = createRepository(ctx);
      const guardianRows = await repo.guardians.listPlayersForGuardian(ctx.userId);
      if (guardianRows.length === 0) return res.json([]);
      const all = await Promise.all(
        guardianRows.map((g) => repo.invoices.list({ playerId: g.playerId }))
      );
      res.json(all.flat());
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/summary", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const summary = await repo.invoices.revenueSummary(req.query.seasonId);
      res.json(summary);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const invoice = await repo.invoices.getWithItems(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, invoice.playerId);
      }
      res.json(invoice);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const { playerId, seasonId, items, dueDate, memo, adminNotes } = req.body;
      if (!playerId || !items?.length) {
        return res.status(400).json({ error: "playerId and items are required" });
      }
      const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitAmount, 0);
      const invoiceNumber = await generateInvoiceNumber(ctx.orgId);
      const invoice = await repo.invoices.create({
        playerId,
        seasonId: seasonId ?? void 0,
        invoiceNumber,
        status: "open",
        subtotal,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: subtotal,
        amountPaid: 0,
        amountDue: subtotal,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
        issuedAt: /* @__PURE__ */ new Date(),
        memo: memo ?? null,
        adminNotes: adminNotes ?? null
      });
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await repo.invoices.addItem({
          invoiceId: invoice.id,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitAmount,
          totalAmount: item.quantity * item.unitAmount,
          sortOrder: i
        });
      }
      res.status(201).json(await repo.invoices.getWithItems(invoice.id));
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/:id/void", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const updated = await repo.invoices.updateStatus(req.params.id, "void");
      res.json(updated);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/payments", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const invoice = await repo.invoices.getById(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      const { amount, method, referenceNote, paidAt } = req.body;
      if (!amount || !method) {
        return res.status(400).json({ error: "amount and method are required" });
      }
      const payment = await repo.payments.record({
        invoiceId: invoice.id,
        playerId: invoice.playerId,
        guardianUserId: invoice.guardianUserId ?? void 0,
        amount,
        method,
        status: "succeeded",
        referenceNote: referenceNote ?? null,
        recordedByUserId: ctx.userId,
        paidAt: paidAt ? new Date(paidAt) : /* @__PURE__ */ new Date()
      });
      const updatedInvoice = await repo.invoices.applyPayment(invoice.id, amount);
      res.status(201).json({ payment, invoice: updatedInvoice });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/:id/payments", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const paymentList = await repo.payments.listForInvoice(req.params.id);
      res.json(paymentList);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/:id/send", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const updated = await repo.invoices.updateStatus(req.params.id, "open");
      res.json(updated);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/plans/all", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const plans = await repo.membershipPlans.list({
        seasonId: req.query.seasonId,
        status: ctx.role === ORG_ROLES.GUARDIAN ? "active" : void 0
      });
      res.json(plans);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.post("/plans", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const { name, description, type, seasonId, priceAmount, allowsPaymentPlan, installmentCount, depositAmount, earlyBirdAmount, earlyBirdDeadline, maxEnrollment } = req.body;
      if (!name || !priceAmount) return res.status(400).json({ error: "name and priceAmount required" });
      const plan = await repo.membershipPlans.create({
        name,
        description: description ?? null,
        type: type ?? "season",
        status: "draft",
        seasonId: seasonId ?? null,
        priceAmount,
        allowsPaymentPlan: allowsPaymentPlan ?? false,
        installmentCount: installmentCount ?? null,
        depositAmount: depositAmount ?? 0,
        earlyBirdAmount: earlyBirdAmount ?? null,
        earlyBirdDeadline: earlyBirdDeadline ? new Date(earlyBirdDeadline) : null,
        maxEnrollment: maxEnrollment ?? null
      });
      res.status(201).json(plan);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.patch("/plans/:planId", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const updated = await repo.membershipPlans.update(req.params.planId, req.body);
      res.json(updated);
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/modules/admin/routes.ts
function registerAdminRoutes(router) {
  router.get("/overview", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const seasonId = req.query.seasonId;
      const [
        registrationCounts,
        revenueSummary,
        teams2,
        waiverTemplates2,
        players2,
        recentRegistrations,
        overdueInvoices
      ] = await Promise.all([
        repo.registrations.countByStatus(seasonId),
        repo.invoices.revenueSummary(seasonId),
        repo.teams.list({ seasonId, activeOnly: true }),
        repo.waivers.listTemplates(),
        repo.players.listActive(),
        repo.registrations.list({ seasonId, status: "pending" }),
        repo.invoices.list({ overdue: true, seasonId })
      ]);
      const regMap = {};
      for (const r of registrationCounts) {
        regMap[r.status] = r.count;
      }
      const totalRegistered = Object.values(regMap).reduce((a, b) => a + b, 0);
      res.json({
        registrations: {
          total: totalRegistered,
          pending: regMap.pending ?? 0,
          active: regMap.active ?? 0,
          waitlisted: regMap.waitlisted ?? 0,
          accepted: regMap.accepted ?? 0
        },
        billing: revenueSummary,
        teams: {
          count: teams2.length,
          list: teams2.map((t) => ({ id: t.id, name: t.name, ageGroup: t.ageGroup, gender: t.gender }))
        },
        roster: {
          totalPlayers: players2.length
        },
        waivers: {
          templateCount: waiverTemplates2.length,
          requiredCount: waiverTemplates2.filter((w) => w.required).length
        },
        alerts: {
          pendingRegistrations: recentRegistrations.length,
          overdueInvoices: overdueInvoices.length,
          overdueAmount: overdueInvoices.reduce((s, i) => s + (i.amountDue ?? 0), 0)
        }
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/attendance", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
      const recentEvents = await repo.events.list({ from, limit: 100 });
      const summaries = await Promise.all(
        recentEvents.map(async (evt) => {
          const att = await repo.eventAttendance.listForEvent(evt.id);
          const present = att.filter((a) => a.status === "present" || a.status === "late").length;
          const total = att.length;
          return {
            eventId: evt.id,
            eventTitle: evt.title,
            eventType: evt.type,
            date: evt.startsAt,
            present,
            total,
            rate: total > 0 ? Math.round(present / total * 100) : null
          };
        })
      );
      const overallPresent = summaries.reduce((s, e) => s + e.present, 0);
      const overallTotal = summaries.reduce((s, e) => s + e.total, 0);
      res.json({
        overall: {
          present: overallPresent,
          total: overallTotal,
          rate: overallTotal > 0 ? Math.round(overallPresent / overallTotal * 100) : null,
          eventCount: summaries.length
        },
        events: summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/compliance", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const [players2, templates] = await Promise.all([
        repo.players.listActive(),
        repo.waivers.listTemplates()
      ]);
      const requiredTemplates = templates.filter((t) => t.required);
      if (requiredTemplates.length === 0 || players2.length === 0) {
        return res.json({
          compliant: 0,
          incomplete: 0,
          total: players2.length,
          requiredForms: requiredTemplates.length,
          players: []
        });
      }
      const playerStatuses = await Promise.all(
        players2.map(async (p) => {
          const sigs = await repo.waivers.listSignaturesForPlayer(p.id);
          const signedTemplateIds = new Set(
            sigs.filter((s) => s.status === "signed").map((s) => s.templateId)
          );
          const missing = requiredTemplates.filter((t) => !signedTemplateIds.has(t.id));
          return {
            playerId: p.id,
            playerName: p.name,
            compliant: missing.length === 0,
            missingForms: missing.map((t) => t.title),
            missingCount: missing.length
          };
        })
      );
      const compliant = playerStatuses.filter((p) => p.compliant).length;
      res.json({
        compliant,
        incomplete: players2.length - compliant,
        total: players2.length,
        requiredForms: requiredTemplates.length,
        players: playerStatuses
      });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
  router.get("/billing/aging", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const openInvoices = await repo.invoices.list({ status: "open" });
      const partialInvoices = await repo.invoices.list({ status: "partial" });
      const allOpen = [...openInvoices, ...partialInvoices];
      const now = Date.now();
      const buckets = {
        current: { count: 0, amount: 0 },
        // not yet overdue
        days1_30: { count: 0, amount: 0 },
        days31_60: { count: 0, amount: 0 },
        days61_90: { count: 0, amount: 0 },
        days90plus: { count: 0, amount: 0 }
      };
      for (const inv of allOpen) {
        const due = inv.dueDate ? new Date(inv.dueDate).getTime() : now;
        const daysPast = Math.max(0, Math.floor((now - due) / 864e5));
        const amount = inv.amountDue;
        if (daysPast === 0) buckets.current.count++, buckets.current.amount += amount;
        else if (daysPast <= 30) buckets.days1_30.count++, buckets.days1_30.amount += amount;
        else if (daysPast <= 60) buckets.days31_60.count++, buckets.days31_60.amount += amount;
        else if (daysPast <= 90) buckets.days61_90.count++, buckets.days61_90.amount += amount;
        else buckets.days90plus.count++, buckets.days90plus.amount += amount;
      }
      res.json({ buckets, total: allOpen.length, totalOutstanding: allOpen.reduce((s, i) => s + i.amountDue, 0) });
    } catch (e) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}

// server/routes/webhooks.ts
var import_crypto = require("crypto");
var import_express2 = __toESM(require("express"), 1);
function registerWebhookRoutes(router) {
  router.post(
    "/mux",
    import_express2.default.raw({ type: "application/json" }),
    async (req, res, next) => {
      try {
        const sigHeader = req.headers["mux-signature"];
        if (process.env.MUX_WEBHOOK_SIGNING_SECRET && sigHeader) {
          const parts = sigHeader.split(",");
          const tPart = parts.find((p) => p.startsWith("t="));
          const v1Part = parts.find((p) => p.startsWith("v1="));
          if (!tPart || !v1Part) {
            res.status(401).json({ error: "Malformed Mux-Signature header" });
            return;
          }
          const timestamp28 = tPart.slice(2);
          const received = v1Part.slice(3);
          const expected = (0, import_crypto.createHmac)(
            "sha256",
            process.env.MUX_WEBHOOK_SIGNING_SECRET
          ).update(`${timestamp28}.${req.body}`).digest("hex");
          let valid = false;
          try {
            valid = (0, import_crypto.timingSafeEqual)(
              Buffer.from(expected),
              Buffer.from(received)
            );
          } catch {
            valid = false;
          }
          if (!valid) {
            res.status(401).json({ error: "Invalid Mux webhook signature" });
            return;
          }
        }
        const body = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
        const event = JSON.parse(body);
        const service = new DbFilmAnalysisService();
        if (event.type === "video.asset.ready") {
          await service.handleMuxWebhook(event);
        }
        res.json({ received: true });
      } catch (err) {
        next(err);
      }
    }
  );
}

// server/lib/gemini.ts
var import_generative_ai = require("@google/generative-ai");
var client2 = null;
function getClient2() {
  if (!client2) {
    if (!process.env.GEMINI_API_KEY) {
      throw new HttpError(
        503,
        "Film analysis is not available in this environment. GEMINI_API_KEY is not configured."
      );
    }
    client2 = new import_generative_ai.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client2;
}
var ANALYSIS_SCHEMA = {
  type: import_generative_ai.SchemaType.OBJECT,
  properties: {
    summary: { type: import_generative_ai.SchemaType.STRING },
    keyObservations: { type: import_generative_ai.SchemaType.ARRAY, items: { type: import_generative_ai.SchemaType.STRING } },
    teachableClips: {
      type: import_generative_ai.SchemaType.ARRAY,
      items: {
        type: import_generative_ai.SchemaType.OBJECT,
        properties: {
          startSec: { type: import_generative_ai.SchemaType.NUMBER },
          endSec: { type: import_generative_ai.SchemaType.NUMBER },
          category: { type: import_generative_ai.SchemaType.STRING },
          playerName: { type: import_generative_ai.SchemaType.STRING },
          note: { type: import_generative_ai.SchemaType.STRING },
          sentiment: { type: import_generative_ai.SchemaType.STRING },
          teachable: { type: import_generative_ai.SchemaType.BOOLEAN }
        },
        required: ["startSec", "endSec", "category", "note", "sentiment", "teachable"]
      }
    },
    suggestedFocusAreas: {
      type: import_generative_ai.SchemaType.ARRAY,
      items: {
        type: import_generative_ai.SchemaType.OBJECT,
        properties: {
          playerName: { type: import_generative_ai.SchemaType.STRING },
          category: { type: import_generative_ai.SchemaType.STRING },
          reasoning: { type: import_generative_ai.SchemaType.STRING }
        },
        required: ["category", "reasoning"]
      }
    }
  },
  required: ["summary", "keyObservations", "teachableClips"]
};
async function analyzeFilmSession(params) {
  const genAI = getClient2();
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA
    }
  });
  const prompt = buildAnalysisPrompt(params);
  const result = await model.generateContent(prompt);
  const text28 = result.response.text();
  return JSON.parse(text28);
}
var WOD_BLOCK_SCHEMA = {
  type: import_generative_ai.SchemaType.OBJECT,
  properties: {
    theme: { type: import_generative_ai.SchemaType.STRING },
    rationale: { type: import_generative_ai.SchemaType.STRING },
    blocks: {
      type: import_generative_ai.SchemaType.ARRAY,
      items: {
        type: import_generative_ai.SchemaType.OBJECT,
        properties: {
          block_type: { type: import_generative_ai.SchemaType.STRING },
          drill_name: { type: import_generative_ai.SchemaType.STRING },
          minutes: { type: import_generative_ai.SchemaType.NUMBER },
          coaching_points: { type: import_generative_ai.SchemaType.ARRAY, items: { type: import_generative_ai.SchemaType.STRING } },
          success_metrics: { type: import_generative_ai.SchemaType.ARRAY, items: { type: import_generative_ai.SchemaType.STRING } }
        },
        required: ["block_type", "drill_name", "minutes", "coaching_points", "success_metrics"]
      }
    }
  },
  required: ["theme", "rationale", "blocks"]
};
function buildAnalysisPrompt(params) {
  return `You are an expert basketball coaching assistant analyzing game film.

SESSION CONTEXT:
- Title: ${params.sessionTitle}
- Type: ${params.sessionType}
- ${params.opponent ? `Opponent: ${params.opponent}` : ""}
- ${params.date ? `Date: ${params.date}` : ""}
- Players: ${params.playerNames.join(", ") || "Unknown"}
- Duration: ${Math.round(params.durationSecs / 60)} minutes

TASK:
Analyze this basketball film session and return structured coaching intelligence.

For teachableClips, identify moments that coaches should review:
- Mistakes that need correction (sentiment: "corrective")
- Positive examples to reinforce (sentiment: "positive")
- Tactical breakdowns (sentiment: "corrective")
- Great execution worth highlighting (sentiment: "positive")

Categories for clips: offense, defense, finishing, footwork, transition, IQ, conditioning

For keyObservations, provide 4-6 specific, actionable coaching observations.

Return structured JSON following the schema exactly.`;
}

// server/inngest/functions/analyze-film.ts
init_client();
init_schema();
var import_drizzle_orm20 = require("drizzle-orm");
var import_nanoid20 = require("nanoid");
var analyzeFilmFn = inngest.createFunction(
  {
    id: "analyze-film-session",
    name: "Analyze Film Session with Gemini",
    retries: 2
  },
  { event: "film/asset.ready" },
  async ({ event, step }) => {
    const { sessionId, orgId, muxPlaybackId, durationSecs } = event.data;
    const sessionData = await step.run("load-session", async () => {
      const db = getDb();
      const [session] = await db.select().from(filmSessions).where((0, import_drizzle_orm20.and)((0, import_drizzle_orm20.eq)(filmSessions.id, sessionId), (0, import_drizzle_orm20.eq)(filmSessions.orgId, orgId))).limit(1);
      return session ?? null;
    });
    if (!sessionData) throw new Error(`Session ${sessionId} not found`);
    const analysis = await step.run("gemini-analysis", async () => {
      return analyzeFilmSession({
        sessionTitle: sessionData.title,
        sessionType: sessionData.kind ?? "game",
        opponent: sessionData.opponent ?? void 0,
        date: sessionData.playedAt ? String(sessionData.playedAt).split("T")[0] : void 0,
        playerNames: [],
        // TODO: load from org roster
        durationSecs: durationSecs ?? 0
      });
    });
    await step.run("save-summary", async () => {
      const db = getDb();
      await db.update(filmSessions).set({
        payload: {
          ...sessionData.payload ?? {},
          aiSummary: analysis.summary,
          aiObservations: analysis.keyObservations,
          aiStatus: "complete",
          aiAnalyzedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        status: "ready"
      }).where((0, import_drizzle_orm20.eq)(filmSessions.id, sessionId));
    });
    await step.run("create-annotations", async () => {
      const db = getDb();
      const annotationRows = analysis.teachableClips.map((clip) => ({
        id: (0, import_nanoid20.nanoid)(),
        sessionId,
        orgId,
        startMs: Math.round(clip.startSec * 1e3),
        endMs: Math.round(clip.endSec * 1e3),
        kind: clip.category,
        source: "ai",
        payload: {
          note: clip.note,
          playerName: clip.playerName,
          sentiment: clip.sentiment,
          teachable: clip.teachable,
          aiGenerated: true,
          coachReviewed: false,
          suggestedFocusAreas: analysis.suggestedFocusAreas
        },
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }));
      if (annotationRows.length > 0) {
        await db.insert(annotations).values(annotationRows);
      }
    });
    const resolutionResult = await step.run("check-resolutions", async () => {
      const db = getDb();
      const pendingActions = await db.select().from(coachingActions).where(
        (0, import_drizzle_orm20.and)(
          (0, import_drizzle_orm20.eq)(coachingActions.followUpSessionId, sessionId),
          (0, import_drizzle_orm20.eq)(coachingActions.status, "in_progress"),
          (0, import_drizzle_orm20.eq)(coachingActions.orgId, orgId)
        )
      );
      if (pendingActions.length === 0) return { checked: 0, resolved: 0 };
      const stillFlaggedCategories = new Set(
        analysis.teachableClips.filter((c) => c.sentiment === "corrective" || c.teachable).map((c) => c.category.toLowerCase())
      );
      let resolved = 0;
      for (const action of pendingActions) {
        const originalCategory = action.issueCategory?.toLowerCase();
        const stillFlagged = originalCategory && stillFlaggedCategories.has(originalCategory);
        if (!stillFlagged) {
          const originalCount = analysis.teachableClips.filter(
            (c) => c.category.toLowerCase() === originalCategory
          ).length;
          const followUpCount = 0;
          const improvement = originalCount > 0 ? 1 : 0;
          await db.update(coachingActions).set({
            status: "resolved",
            resolvedAt: /* @__PURE__ */ new Date(),
            resolvedNote: originalCategory ? `AI detected improvement: ${action.issueCategory} not flagged in follow-up session.` : "Follow-up session analyzed \u2014 no related issues found by AI.",
            resolutionScore: {
              originalCount,
              followUpCount,
              improvement,
              autoResolved: true
            },
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm20.eq)(coachingActions.id, action.id));
          resolved++;
        }
      }
      return { checked: pendingActions.length, resolved };
    });
    return {
      sessionId,
      clipsCreated: analysis.teachableClips.length,
      summary: analysis.summary,
      resolutionsChecked: resolutionResult.checked,
      resolutionsAutoResolved: resolutionResult.resolved
    };
  }
);

// server/modules/readiness/notifications.ts
init_sms();
async function sendCoachAlert(params) {
  console.log(`[COACH ALERT] ${params.subject}: ${params.message}`);
}

// server/inngest/functions/readiness-alert.ts
var readinessAlertFn = inngest.createFunction(
  { id: "readiness-alert", name: "Readiness Flag \u2192 Coach Alert" },
  { event: "readiness/flagged" },
  async ({ event, step }) => {
    const { playerName, fatigue, sleep, soreness, note, coachUserId, orgId } = event.data;
    await step.run("notify-coach", async () => {
      const reasons = [];
      if (fatigue >= 7) reasons.push(`fatigue ${fatigue}/10`);
      if (sleep <= 5) reasons.push(`sleep ${sleep}h`);
      if (soreness >= 7) reasons.push(`soreness ${soreness}/10`);
      await sendCoachAlert({
        coachUserId,
        orgId,
        subject: `Readiness flag: ${playerName}`,
        message: `${playerName} flagged this morning \u2014 ${reasons.join(", ")}.${note ? ` Note: "${note}"` : ""} Consider modifying today's workout.`,
        link: `/app/coach`
      });
    });
    return { notified: coachUserId };
  }
);

// server/inngest/functions/attendance-notify.ts
init_twilio();
var attendanceNotifyFn = inngest.createFunction(
  { id: "attendance-notify", name: "Attendance \u2192 Parent Notification" },
  { event: "attendance/submitted" },
  async ({ event, step }) => {
    const { eventTitle, eventDate, absentPlayers } = event.data;
    const results = await step.run("send-parent-sms", async () => {
      const sent = [];
      for (const player of absentPlayers) {
        if (player.parentPhone) {
          await sendSms(
            player.parentPhone,
            `HoopsOS: ${player.playerName} was marked absent for ${eventTitle} on ${eventDate}. Questions? Reply to contact your coach.`
          );
          sent.push(player.playerId);
        }
      }
      return sent;
    });
    return { notified: results };
  }
);

// server/inngest/functions/notify-coaching-action.ts
init_client();
init_schema();
var import_drizzle_orm21 = require("drizzle-orm");
var notifyCoachingActionFn = inngest.createFunction(
  {
    id: "notify-coaching-action",
    name: "Notify Player of Coaching Action",
    retries: 2
  },
  { event: "coaching-action/created" },
  async ({ event, step }) => {
    const { actionId, orgId, actionType, playerId, coachNote, issueCategory } = event.data;
    const notifiableTypes = ["request_reupload", "assign_clip", "recommend_drill"];
    if (!notifiableTypes.includes(actionType) || !playerId) {
      return { skipped: true, reason: "no player or non-notifiable type" };
    }
    const action = await step.run("load-action", async () => {
      const db = getDb();
      const [row] = await db.select().from(coachingActions).where((0, import_drizzle_orm21.eq)(coachingActions.id, actionId)).limit(1);
      return row ?? null;
    });
    if (!action || action.status === "dismissed") {
      return { skipped: true, reason: "action not found or dismissed" };
    }
    const messageBody = await step.run("build-message", async () => {
      const categoryTag = issueCategory ? ` [${issueCategory}]` : "";
      switch (actionType) {
        case "request_reupload":
          return `Your coach has requested a follow-up recording${categoryTag}. ` + (coachNote ? `

Coach's note: "${coachNote}"` : "") + `

Head to your Uploads page to record and submit your response.`;
        case "assign_clip":
          return `Your coach has assigned a film clip for review${categoryTag}. ` + (coachNote ? `

Coach's note: "${coachNote}"` : "") + `

Check your Coach Actions in the Development section.`;
        case "recommend_drill":
          return `Your coach has prescribed a new drill${categoryTag}. ` + (coachNote ? `

Coach's note: "${coachNote}"` : "") + `

Check your workout plan for details.`;
        default:
          return null;
      }
    });
    if (!messageBody) return { skipped: true, reason: "no message body built" };
    const sent = await step.run("send-message", async () => {
      try {
        const baseUrl = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
        const resp = await fetch(`${baseUrl}/api/messages/compose`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-inngest-internal": "1",
            "x-hoops-org-id": orgId
          },
          body: JSON.stringify({
            spec: {
              type: "direct",
              recipientIds: [playerId]
            },
            title: actionTypeTitle(actionType),
            body: messageBody
          })
        });
        return resp.ok ? "sent" : `error:${resp.status}`;
      } catch {
        return "network-error";
      }
    });
    return { actionId, playerId, actionType, sent };
  }
);
function actionTypeTitle(actionType) {
  switch (actionType) {
    case "request_reupload":
      return "New Re-upload Request from Coach";
    case "assign_clip":
      return "Film Clip Assigned for Review";
    case "recommend_drill":
      return "New Drill Prescription";
    default:
      return "Coaching Action";
  }
}

// server/app.ts
function createApp() {
  const app = (0, import_express3.default)();
  app.set("trust proxy", 1);
  const webhookRouter = import_express3.default.Router();
  registerWebhookRoutes(webhookRouter);
  app.use("/webhooks", webhookRouter);
  app.use(import_express3.default.json());
  app.use((0, import_express4.clerkMiddleware)());
  const filmRouter = import_express3.default.Router();
  registerFilmAnalysisRoutes(filmRouter, new DbFilmAnalysisService());
  app.use("/api/film-analysis", filmRouter);
  const meRouter = import_express3.default.Router();
  registerMeRoute(meRouter);
  app.use("/api", meRouter);
  const rosterRouter = import_express3.default.Router();
  registerRosterRoutes(rosterRouter);
  app.use("/api/roster", rosterRouter);
  const assignmentsRouter = import_express3.default.Router();
  registerAssignmentRoutes(assignmentsRouter);
  app.use("/api/assignments", assignmentsRouter);
  const practicePlansRouter = import_express3.default.Router();
  registerPracticePlanRoutes(practicePlansRouter);
  app.use("/api/practice-plans", practicePlansRouter);
  const eventsRouter = import_express3.default.Router();
  registerEventRoutes(eventsRouter);
  app.use("/api/events", eventsRouter);
  const readinessRouter = import_express3.default.Router();
  registerReadinessRoutes(readinessRouter);
  app.use("/api/readiness", readinessRouter);
  const messagingRouter = import_express3.default.Router();
  registerMessagingRoutes(messagingRouter);
  app.use("/api/messages", messagingRouter);
  const wearablesRouter = import_express3.default.Router();
  registerWearableRoutes(wearablesRouter);
  app.use("/api/wearables", wearablesRouter);
  const wodsRouter = import_express3.default.Router();
  registerWodRoutes(wodsRouter);
  app.use("/api/wods", wodsRouter);
  const coachingActionsRouter = import_express3.default.Router();
  registerCoachingActionRoutes(coachingActionsRouter);
  app.use("/api/coaching-actions", coachingActionsRouter);
  const parentRouter = import_express3.default.Router();
  registerParentRoutes(parentRouter);
  app.use("/api/parent", parentRouter);
  const announcementsRouter = import_express3.default.Router();
  registerAnnouncementRoutes(announcementsRouter);
  app.use("/api/announcements", announcementsRouter);
  const waiversRouter = import_express3.default.Router();
  registerWaiverRoutes(waiversRouter);
  app.use("/api/waivers", waiversRouter);
  const seasonsRouter = import_express3.default.Router();
  registerSeasonRoutes(seasonsRouter);
  app.use("/api/seasons", seasonsRouter);
  const teamsRouter = import_express3.default.Router();
  registerTeamRoutes(teamsRouter);
  app.use("/api/teams", teamsRouter);
  const registrationsRouter = import_express3.default.Router();
  registerRegistrationRoutes(registrationsRouter);
  app.use("/api/registrations", registrationsRouter);
  const invoicesRouter = import_express3.default.Router();
  registerInvoiceRoutes(invoicesRouter);
  app.use("/api/invoices", invoicesRouter);
  const adminRouter = import_express3.default.Router();
  registerAdminRoutes(adminRouter);
  app.use("/api/admin", adminRouter);
  app.use(
    "/api/inngest",
    (0, import_express5.serve)({
      client: inngest,
      functions: [analyzeFilmFn, readinessAlertFn, attendanceNotifyFn, notifyCoachingActionFn]
    })
  );
  return app;
}

// server/_vercel_entry.ts
var vercel_entry_default = createApp();
