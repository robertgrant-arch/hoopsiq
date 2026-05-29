// shared/db/schema/index.ts
// Barrel export. Consumers should `import { schema } from "@shared/db"`
// (which re-exports from here) so the Drizzle client always sees every table.

export * from "./_enums";
export * from "./orgs";
export * from "./film_sessions";
export * from "./film_assets";
export * from "./analysis_jobs";
export * from "./annotations";
export * from "./players";
export * from "./events";
export * from "./assignments";
export * from "./practice_plans";
export * from "./idps";
export * from "./readiness";
export * from "./messages";
export * from "./wearables";
export * from "./guardians";
export * from "./player_notes";
export * from "./skill_assessments";
export * from "./injury_records";
export * from "./idp_structured";
export * from "./coaching_actions";
export * from "./readiness_overrides";
export * from "./opponents";
export * from "./scout_reports";
export * from "./announcements";
export * from "./waivers";
export * from "./seasons";
export * from "./memberships";
export * from "./billing";
export * from "./messaging_policy_log";
export * from "./thread_type_policy_log";
export * from "./quiet_hours_log";
export * from "./safety_flags";
export * from "./safety_incidents";
