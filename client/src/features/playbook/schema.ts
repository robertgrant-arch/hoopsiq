/**
 * Playbook domain schema (zod) — canonical runtime contracts.
 *
 * This file is the single source of truth for the shape of plays, phases,
 * tokens, paths, versions, and editor state. Every persistence read and
 * every saveVersion call must round-trip through these schemas.
 *
 * Backward compatibility:
 *   - Token type names (OFFENSE/DEFENSE/BALL/CONE) are kept uppercase to
 *     match the existing mock data and rendered components.
 *   - Path type names (PASS/DRIBBLE/CUT/SCREEN/HANDOFF) are kept uppercase.
 *   - Optional fields (`locked`, `role`, `teamSide`, `controlX`, `controlY`,
 *     `label`, `thumbnailDataUrl`) are additive — older snapshots without
 *     them remain valid.
 */
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const courtTypeSchema = z.enum(["HALF", "FULL"]);
export const tokenTypeSchema = z.enum(["OFFENSE", "DEFENSE", "BALL", "CONE"]);
export const pathTypeSchema = z.enum(["PASS", "DRIBBLE", "CUT", "SCREEN", "HANDOFF"]);
export const phaseLabelSchema = z.enum([
  "ENTRY",
  "TRIGGER",
  "READ_1",
  "READ_2",
  "COUNTER",
  "SAFETY",
]);
export const teamSideSchema = z.enum(["HOME", "AWAY", "NEUTRAL"]);
export const playCategorySchema = z.enum([
  "PRIMARY",
  "SLOB",
  "BLOB",
  "ATO",
  "MOTION",
  "ZONE_OFFENSE",
  "PRESS_BREAK",
]);

/**
 * Semantic cut variants. Stored on PlayPath as `cutStyle` for any path
 * with type === "CUT". Used by the action layer + auto-quiz generator.
 */
export const cutStyleSchema = z.enum([
  "STRAIGHT",
  "CURVE",
  "VCUT",
  "LCUT",
  "BACKDOOR",
  "FLARE",
]);

/**
 * Pass quality. Stored on PlayPath as `passType` for paths with type === "PASS".
 *   CHEST   — direct chest pass (default).
 *   BOUNCE  — bounce pass (dotted rendering).
 *   LOB     — high lob (curve emphasized).
 *   SKIP    — long skip pass across the court.
 */
export const passTypeSchema = z.enum(["CHEST", "BOUNCE", "LOB", "SKIP"]);

/**
 * Player role on the floor (basketball position). Optional on PlayToken;
 * unset means "no specific role assigned."
 */
export const roleSchema = z.enum(["PG", "SG", "SF", "PF", "C"]);

/* -------------------------------------------------------------------------- */
/* Domain                                                                     */
/* -------------------------------------------------------------------------- */

const finite = z.number().finite();

export const playTokenSchema = z.object({
  id: z.string().min(1),
  type: tokenTypeSchema,
  label: z.string(),
  x: finite,
  y: finite,
  locked: z.boolean().optional(),
  /** Optional basketball position label. Was previously a freeform string;
   *  kept loose here for backward-compat with any existing data, but the
   *  UI exposes only the canonical `roleSchema` values. */
  role: z.string().optional(),
  teamSide: teamSideSchema.optional(),
});

export const playPathSchema = z.object({
  id: z.string().min(1),
  type: pathTypeSchema,
  startTokenId: z.string().optional(),
  endTokenId: z.string().optional(),
  /** For SCREEN paths: id of the player benefiting from the screen ("for whom"). */
  screenedForTokenId: z.string().optional(),
  /** Flat [x1,y1,(cx,cy),x2,y2]. Min 4 (linear) or 6 (quadratic). */
  points: z.array(finite).min(4),
  controlX: finite.optional(),
  controlY: finite.optional(),
  label: z.string().optional(),
  locked: z.boolean().optional(),
  /** Only meaningful when type === "CUT". Defaults to STRAIGHT if absent. */
  cutStyle: cutStyleSchema.optional(),
  /** Only meaningful when type === "PASS". Defaults to CHEST if absent. */
  passType: passTypeSchema.optional(),
});

export const playPhaseSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  phase: phaseLabelSchema,
  notes: z.string(),
  tokens: z.array(playTokenSchema),
  paths: z.array(playPathSchema),
  thumbnailDataUrl: z.string().optional(),
});

export const playSchema = z.object({
  id: z.string().min(1),
  playbookId: z.string().min(1),
  title: z.string(),
  description: z.string(),
  courtType: courtTypeSchema,
  category: playCategorySchema,
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  versionLabel: z.string(),
  phases: z.array(playPhaseSchema).min(1),
});

export const playVersionSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  savedAt: z.string(),
  authorName: z.string(),
  snapshot: playSchema,
});

/* -------------------------------------------------------------------------- */
/* Editor types                                                               */
/* -------------------------------------------------------------------------- */

export const editorModeSchema = z.enum([
  "IDLE",
  "SELECT",
  "DRAG_TOKEN",
  "DRAW_PATH",
  "PAN",
  "PRESENT",
  "ADD_OFFENSE",
  "ADD_DEFENSE",
  "ADD_BALL",
  "ADD_CONE",
  "DRAW_PASS",
  "DRAW_DRIBBLE",
  "DRAW_CUT",
  "DRAW_SCREEN",
  "DRAW_HANDOFF",
]);

export const selectionStateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("token"), tokenId: z.string().min(1) }),
  z.object({ kind: z.literal("path"), pathId: z.string().min(1) }),
]);

export const pendingPathDraftSchema = z.object({
  pathType: pathTypeSchema,
  fromTokenId: z.string().min(1),
  /** Live cursor position in court coords for ghost line preview. */
  cursorX: finite,
  cursorY: finite,
});

export const undoEntrySchema = z.object({
  id: z.string().min(1),
  ts: z.number().int().nonnegative(),
  /** Stable label for telemetry & QA. */
  label: z.string(),
  playId: z.string().min(1),
  /** Snapshot of the play *before* the mutation. */
  before: playSchema,
});

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Persisted store shape (subset of full store state). The runtime store has
 * additional ephemeral fields (editorMode, pendingPathDraft, undo/redo stacks,
 * transient selection) that we DO NOT persist — they reset to safe defaults
 * on hydration so a stale draft can never wedge the canvas.
 */
export const persistedPlaybookSchema = z.object({
  schemaVersion: z.literal(2),
  plays: z.array(playSchema),
  versionHistory: z.record(z.string(), z.array(playVersionSchema)),
  selectedPlayId: z.string().nullable(),
  selectedPhaseId: z.string().nullable(),
  authorName: z.string().nullable(),
});

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type CourtType = z.infer<typeof courtTypeSchema>;
export type TokenType = z.infer<typeof tokenTypeSchema>;
export type PathType = z.infer<typeof pathTypeSchema>;
export type PhaseLabel = z.infer<typeof phaseLabelSchema>;
export type TeamSide = z.infer<typeof teamSideSchema>;
export type CutStyle = z.infer<typeof cutStyleSchema>;
export type PassType = z.infer<typeof passTypeSchema>;
export type Role = z.infer<typeof roleSchema>;
export type PlayCategory = z.infer<typeof playCategorySchema>;
export type PlayToken = z.infer<typeof playTokenSchema>;
export type PlayPath = z.infer<typeof playPathSchema>;
export type PlayPhase = z.infer<typeof playPhaseSchema>;
export type Play = z.infer<typeof playSchema>;
export type PlayVersion = z.infer<typeof playVersionSchema>;
export type EditorMode = z.infer<typeof editorModeSchema>;
export type SelectionState = z.infer<typeof selectionStateSchema>;
export type PendingPathDraft = z.infer<typeof pendingPathDraftSchema>;
export type UndoEntry = z.infer<typeof undoEntrySchema>;
export type PersistedPlaybook = z.infer<typeof persistedPlaybookSchema>;

/* -------------------------------------------------------------------------- */
/* Safe parse helpers                                                         */
/* -------------------------------------------------------------------------- */

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: z.ZodError };

export function safeParsePlay(value: unknown): ParseResult<Play> {
  const r = playSchema.safeParse(value);
  return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
}

export function safeParsePlaySnapshot(value: unknown): ParseResult<Play> {
  return safeParsePlay(value);
}

export function safeParsePersistedPlaybook(
  value: unknown,
): ParseResult<PersistedPlaybook> {
  const r = persistedPlaybookSchema.safeParse(value);
  return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
}

export function safeParsePlayVersion(value: unknown): ParseResult<PlayVersion> {
  const r = playVersionSchema.safeParse(value);
  return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
}

/** Throw-on-failure variant for tests / dev-time assertions. */
export function assertPlaySnapshot(value: unknown): asserts value is Play {
  const r = safeParsePlay(value);
  if (!r.ok) {
    throw new Error(
      `Invalid play snapshot: ${r.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
}
