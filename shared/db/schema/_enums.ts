// shared/db/schema/_enums.ts
// Centralized pg enums for HoopsIQ film analysis + core domain.
// Keep all enum literals lower_snake_case so they line up with API contracts.

import { pgEnum } from "drizzle-orm/pg-core";

// --- Tenancy / orgs ---------------------------------------------------------
export const orgPlanEnum = pgEnum("org_plan", [
  "free",
  "team",
  "club",
  "enterprise",
]);

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "coach",
  "analyst",
  "player",
  "viewer",
]);

// --- Film sessions (a single uploaded game / practice / clip set) -----------
export const filmSessionStatusEnum = pgEnum("film_session_status", [
  "draft",
  "uploading",
  "queued",
  "processing",
  "ready",
  "failed",
  "archived",
]);

export const filmSessionKindEnum = pgEnum("film_session_kind", [
  "game",
  "practice",
  "scrimmage",
  "workout",
  "scout",
  "other",
]);

// --- Film assets (raw upload, transcoded renditions, thumbnails, etc.) ------
export const filmAssetKindEnum = pgEnum("film_asset_kind", [
  "source",
  "hls",
  "mp4_720p",
  "mp4_1080p",
  "thumbnail",
  "sprite",
  "caption",
]);

export const filmAssetStatusEnum = pgEnum("film_asset_status", [
  "pending",
  "uploading",
  "stored",
  "transcoding",
  "ready",
  "failed",
]);

// --- Analysis jobs (Inngest-driven AI/vision pipeline) ----------------------
export const analysisJobKindEnum = pgEnum("analysis_job_kind", [
  "ingest",
  "transcode",
  "shot_chart",
  "play_breakdown",
  "player_tracking",
  "highlight_reel",
  "scouting_report",
]);

export const analysisJobStatusEnum = pgEnum("analysis_job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "retrying",
]);

// --- Annotations (coach + AI generated) -------------------------------------
export const annotationSourceEnum = pgEnum("annotation_source", [
  "coach",
  "ai",
  "player",
  "import",
]);

export const annotationKindEnum = pgEnum("annotation_kind", [
  "note",
  "tag",
  "play",
  "possession",
  "shot",
  "foul",
  "highlight",
  "telestration",
]);

// --- Billing (Stripe-backed, PR 6) ------------------------------------------
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
]);
