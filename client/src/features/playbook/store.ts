/**
 * Playbook Studio store (v2 — enterprise rewrite).
 *
 * Hardened, deterministic, schema-validated. Holds plays, version history,
 * editor mode, selection, pending path draft, undo/redo stacks, and author
 * identity. Persistence is best-effort: hydration is wrapped in try/catch
 * and a corrupt blob is dropped silently rather than crashing the editor.
 *
 * Maps to the production schema:
 *   PUT  /api/plays/:id                     (update meta)
 *   POST /api/plays/:id/phases              (insert phase)
 *   PUT  /api/plays/:id/phases/:phaseId     (update tokens/paths)
 *   POST /api/plays/:id/versions            (saveVersion)
 *
 * Public guarantees:
 *   - saveVersion validates the snapshot via zod before storing.
 *   - Every mutation that touches phase tokens/paths captures an undo entry.
 *   - Undo stack is capped at 50 entries.
 *   - Deleting a token cascade-deletes paths attached to that token.
 *   - At most one BALL token per phase (silent block on duplicate).
 *   - editorMode is ephemeral and resets on hydration to "SELECT".
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  allPlays,
  clonePhaseFromFormation,
} from "./mock";
import {
  safeParsePersistedPlaybook,
  safeParsePlaySnapshot,
  type CutStyle,
  type EditorMode,
  type PassType,
  type PendingPathDraft,
  type Play,
  type PlayPath,
  type PlayPhase,
  type PlayToken,
  type PlayVersion,
  type SelectionState,
  type UndoEntry,
} from "./schema";
import { actionFromPath } from "./actions";

const PERSIST_KEY = "hoopsiq-playbook";
const PERSIST_VERSION = 2;
const UNDO_CAP = 50;

/* -------------------------------------------------------------------------- */
/* Safe storage adapter                                                       */
/* -------------------------------------------------------------------------- */

/**
 * localStorage wrapper that NEVER throws. Sandboxed iframes, private mode,
 * quota-exceeded, and SSR all flow through silently. Without this guard a
 * single thrown getItem can crash the editor on mount.
 */
function makeSafeStorage(): StateStorage {
  return {
    getItem(name) {
      try {
        if (typeof window === "undefined") return null;
        return window.localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem(name, value) {
      try {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(name, value);
      } catch {
        /* quota / disabled storage — drop silently */
      }
    },
    removeItem(name) {
      try {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(name);
      } catch {
        /* noop */
      }
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type { PlayVersion };

type PlaybookState = {
  /* persisted */
  plays: Play[];
  versionHistory: Record<string, PlayVersion[]>;
  selectedPlayId: string | null;
  selectedPhaseId: string | null;
  authorName: string | null;

  /* ephemeral */
  selectedTokenId: string | null;
  selectedPathId: string | null;
  selection: SelectionState;
  editorMode: EditorMode;
  cutStyleSelection: CutStyle;
  passTypeSelection: PassType;
  snapEnabled: boolean;
  /** Playback speed multiplier (e.g. 0.5, 1, 2). */
  playbackSpeed: number;
  /** Whether playback loops back to phase 0 when it reaches the end. */
  playbackLoop: boolean;
  pendingPathDraft: PendingPathDraft | null;
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];

  /* identity */
  setAuthorName: (name: string | null) => void;

  /* selection */
  setSelectedPlay: (id: string | null) => void;
  setSelectedPhase: (id: string | null) => void;
  setSelectedToken: (id: string | null) => void;
  setSelectedPath: (id: string | null) => void;
  clearSelection: () => void;

  /* editor mode + draft */
  setEditorMode: (mode: EditorMode) => void;
  setCutStyleSelection: (style: CutStyle) => void;
  setPassTypeSelection: (type: PassType) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setPlaybackSpeed: (mult: number) => void;
  setPlaybackLoop: (enabled: boolean) => void;
  setPendingPathDraft: (draft: PendingPathDraft | null) => void;
  updatePendingPathDraftCursor: (x: number, y: number) => void;

  /* play CRUD */
  createPlay: (overrides?: Partial<Play>) => string;
  duplicatePlay: (id: string) => string;
  deletePlay: (id: string) => void;
  updatePlayMeta: (id: string, patch: Partial<Play>) => void;

  /* phases */
  addPhase: (playId: string, fromFormationId?: string) => string;
  duplicatePhase: (playId: string, phaseId: string) => string;
  deletePhase: (playId: string, phaseId: string) => void;
  updatePhase: (playId: string, phaseId: string, patch: Partial<PlayPhase>) => void;
  reorderPhase: (playId: string, fromIndex: number, toIndex: number) => void;

  /* tokens */
  addToken: (playId: string, phaseId: string, token: Omit<PlayToken, "id">) => string | null;
  updateToken: (playId: string, phaseId: string, tokenId: string, patch: Partial<PlayToken>) => void;
  removeToken: (playId: string, phaseId: string, tokenId: string) => void;

  /* paths */
  addPath: (playId: string, phaseId: string, path: Omit<PlayPath, "id">) => string | null;
  updatePath: (playId: string, phaseId: string, pathId: string, patch: Partial<PlayPath>) => void;
  removePath: (playId: string, phaseId: string, pathId: string) => void;

  /* versioning */
  saveVersion: (playId: string, label?: string) => boolean;
  restoreVersion: (playId: string, versionId: string) => boolean;

  /* undo / redo */
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;

  /* resets */
  resetAll: () => void;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function nowIso(): string {
  return new Date().toISOString();
}

function bumpUpdated(p: Play): Play {
  return { ...p, updatedAt: nowIso() };
}

function deepClone<T>(v: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(v);
    } catch {
      /* fall through to JSON */
    }
  }
  return JSON.parse(JSON.stringify(v)) as T;
}

function findPlayIndex(plays: Play[], id: string | null): number {
  if (!id) return -1;
  return plays.findIndex((p) => p.id === id);
}

function makeUndoEntry(label: string, play: Play): UndoEntry {
  return {
    id: `u_${nanoid(6)}`,
    ts: Date.now(),
    label,
    playId: play.id,
    before: deepClone(play),
  };
}

/** Push an entry to the stack with cap. */
function pushCapped(stack: UndoEntry[], entry: UndoEntry): UndoEntry[] {
  const next = [...stack, entry];
  return next.length > UNDO_CAP ? next.slice(next.length - UNDO_CAP) : next;
}

/** Update a play in place via callback. Returns next plays array. */
function mapPlay(plays: Play[], id: string, fn: (p: Play) => Play): Play[] {
  return plays.map((p) => (p.id === id ? fn(p) : p));
}

/** Update a phase in place via callback. */
function mapPhase(play: Play, phaseId: string, fn: (ph: PlayPhase) => PlayPhase): Play {
  return { ...play, phases: play.phases.map((ph) => (ph.id === phaseId ? fn(ph) : ph)) };
}

/**
 * Update a single token's position. Returns a new tokens array; if the token
 * doesn't exist in the array, the array is returned unchanged.
 */
function moveToken(
  tokens: PlayToken[],
  tokenId: string,
  x: number,
  y: number,
): PlayToken[] {
  return tokens.map((t) => (t.id === tokenId ? { ...t, x, y } : t));
}

/**
 * Propagate a single token-position change forward across subsequent phases.
 *
 * For each phase after the source phase, IF the token currently sits at
 * `oldPos` (i.e. the phase was inheriting that position), update it to
 * `newPos`. If the token is at a different position (explicit override
 * authored by the coach), STOP — that override and everything after it
 * is left alone. This matches user mental model: edits to phase N
 * automatically flow into phases N+1, N+2... until they hit a phase
 * where the coach deliberately chose a different layout.
 */
function propagateTokenForward(
  phases: PlayPhase[],
  startIndex: number,
  tokenId: string,
  oldPos: { x: number; y: number },
  newPos: { x: number; y: number },
): PlayPhase[] {
  if (oldPos.x === newPos.x && oldPos.y === newPos.y) return phases;
  const out = phases.slice();
  for (let i = startIndex + 1; i < out.length; i++) {
    const ph = out[i];
    const t = ph.tokens.find((x) => x.id === tokenId);
    if (!t) break; // token doesn't exist in this phase; stop
    if (t.x !== oldPos.x || t.y !== oldPos.y) break; // override — stop
    out[i] = { ...ph, tokens: moveToken(ph.tokens, tokenId, newPos.x, newPos.y) };
  }
  return out;
}

/**
 * Compute (oldTokens → newTokens) deltas as a list of token-id + old/new
 * position pairs. Only tokens that actually moved are returned.
 */
function tokenDeltas(
  oldTokens: PlayToken[],
  newTokens: PlayToken[],
): Array<{ id: string; oldPos: { x: number; y: number }; newPos: { x: number; y: number } }> {
  const deltas: Array<{
    id: string;
    oldPos: { x: number; y: number };
    newPos: { x: number; y: number };
  }> = [];
  for (const newT of newTokens) {
    const oldT = oldTokens.find((t) => t.id === newT.id);
    if (!oldT) continue;
    if (oldT.x === newT.x && oldT.y === newT.y) continue;
    deltas.push({
      id: newT.id,
      oldPos: { x: oldT.x, y: oldT.y },
      newPos: { x: newT.x, y: newT.y },
    });
  }
  return deltas;
}

/**
 * Apply the physical effect of a newly-committed path to the phase's tokens.
 *
 * Pass     → ball moves to receiver's current position.
 * Cut      → cutting player moves to the path endpoint.
 * Dribble  → dribbler AND the ball move to the path endpoint.
 * Handoff  → both participants AND the ball move to the handoff `at` point.
 * Screen   → screener moves to the screen `at` point (recipient is unchanged).
 *
 * This is what makes "draw a pass and the ball ends up at the receiver" work
 * across phases: subsequent phases inherit the updated end-state via the
 * existing `addPhase` clone-from-previous logic.
 */
function applyActionEffectsToPhase(
  phase: PlayPhase,
  committedPath: PlayPath,
): PlayPhase {
  const action = actionFromPath(committedPath);
  if (!action) return phase;

  const ball = phase.tokens.find((t) => t.type === "BALL");
  let next = phase.tokens;
  const pts = committedPath.points;
  const ex = pts[pts.length - 2];
  const ey = pts[pts.length - 1];

  switch (action.kind) {
    case "cut":
      next = moveToken(next, action.player, ex, ey);
      break;
    case "dribble":
      next = moveToken(next, action.player, ex, ey);
      if (ball) next = moveToken(next, ball.id, ex, ey);
      break;
    case "pass": {
      const receiver = phase.tokens.find((t) => t.id === action.to);
      if (receiver && ball) next = moveToken(next, ball.id, receiver.x, receiver.y);
      break;
    }
    case "handoff":
      next = moveToken(next, action.from, ex, ey);
      next = moveToken(next, action.to, ex, ey);
      if (ball) next = moveToken(next, ball.id, ex, ey);
      break;
    case "screen":
      if (action.screener) next = moveToken(next, action.screener, ex, ey);
      break;
  }
  return next === phase.tokens ? phase : { ...phase, tokens: next };
}

/* -------------------------------------------------------------------------- */
/* Initial state                                                              */
/* -------------------------------------------------------------------------- */

function buildInitial(): Pick<
  PlaybookState,
  | "plays"
  | "versionHistory"
  | "selectedPlayId"
  | "selectedPhaseId"
  | "authorName"
  | "selectedTokenId"
  | "selectedPathId"
  | "selection"
  | "editorMode"
  | "cutStyleSelection"
  | "passTypeSelection"
  | "snapEnabled"
  | "playbackSpeed"
  | "playbackLoop"
  | "pendingPathDraft"
  | "undoStack"
  | "redoStack"
> {
  const plays = deepClone(allPlays);
  return {
    plays,
    versionHistory: {},
    selectedPlayId: plays[0]?.id ?? null,
    selectedPhaseId: plays[0]?.phases[0]?.id ?? null,
    authorName: null,
    selectedTokenId: null,
    selectedPathId: null,
    selection: { kind: "none" },
    editorMode: "SELECT",
    cutStyleSelection: "STRAIGHT" as CutStyle,
    passTypeSelection: "CHEST" as PassType,
    snapEnabled: true,
    playbackSpeed: 1,
    playbackLoop: false,
    pendingPathDraft: null,
    undoStack: [],
    redoStack: [],
  };
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

export const usePlaybook = create<PlaybookState>()(
  persist(
    (set, get) => {
      /** Capture the *current* play for undo just before mutating it. */
      function captureUndo(label: string, playId: string) {
        const play = get().plays.find((p) => p.id === playId);
        if (!play) return;
        set({
          undoStack: pushCapped(get().undoStack, makeUndoEntry(label, play)),
          redoStack: [], // any new edit invalidates redo branch
        });
      }

      /** Replace one play in store with the provided next snapshot. */
      function replacePlay(playId: string, next: Play): void {
        set({ plays: mapPlay(get().plays, playId, () => bumpUpdated(next)) });
      }

      return {
        ...buildInitial(),

        /* ---------------- identity ---------------- */
        setAuthorName: (name) => set({ authorName: name?.trim() || null }),

        /* ---------------- selection --------------- */
        setSelectedPlay: (id) => {
          const play = id ? get().plays.find((p) => p.id === id) : null;
          set({
            selectedPlayId: id,
            selectedPhaseId: play?.phases[0]?.id ?? null,
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
          });
        },
        setSelectedPhase: (id) =>
          set({
            selectedPhaseId: id,
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
          }),
        setSelectedToken: (id) =>
          set({
            selectedTokenId: id,
            selectedPathId: null,
            selection: id ? { kind: "token", tokenId: id } : { kind: "none" },
          }),
        setSelectedPath: (id) =>
          set({
            selectedPathId: id,
            selectedTokenId: null,
            selection: id ? { kind: "path", pathId: id } : { kind: "none" },
          }),
        clearSelection: () =>
          set({
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
          }),

        /* ---------------- mode + draft ------------ */
        setEditorMode: (mode) => {
          // Switching modes always cancels any in-flight path draft so a stale
          // origin from PASS does not leak into CUT.
          set({ editorMode: mode, pendingPathDraft: null });
        },
        setCutStyleSelection: (style) => set({ cutStyleSelection: style }),
        setPassTypeSelection: (type) => set({ passTypeSelection: type }),
        setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
        setPlaybackSpeed: (mult) =>
          set({ playbackSpeed: Math.max(0.25, Math.min(4, mult)) }),
        setPlaybackLoop: (enabled) => set({ playbackLoop: enabled }),
        setPendingPathDraft: (draft) => set({ pendingPathDraft: draft }),
        updatePendingPathDraftCursor: (x, y) => {
          const cur = get().pendingPathDraft;
          if (!cur) return;
          if (cur.cursorX === x && cur.cursorY === y) return;
          set({ pendingPathDraft: { ...cur, cursorX: x, cursorY: y } });
        },

        /* ---------------- play CRUD --------------- */
        createPlay: (overrides = {}) => {
          const id = `play_${nanoid(6)}`;
          const now = nowIso();
          const phaseId = `ph_${nanoid(5)}`;
          const newPlay: Play = {
            id,
            playbookId: "pb_varsity",
            title: "Untitled Play",
            description: "",
            courtType: "HALF",
            category: "PRIMARY",
            tags: [],
            createdAt: now,
            updatedAt: now,
            versionLabel: "v0.1",
            phases: [
              {
                id: phaseId,
                order: 0,
                phase: "ENTRY",
                notes: "Starting alignment.",
                tokens: clonePhaseFromFormation("fmt_5out").tokens,
                paths: [],
              },
            ],
            ...overrides,
          };
          set({
            plays: [newPlay, ...get().plays],
            selectedPlayId: id,
            selectedPhaseId: newPlay.phases[0].id,
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
          });
          return id;
        },

        duplicatePlay: (id) => {
          const src = get().plays.find((p) => p.id === id);
          if (!src) return id;
          const newId = `play_${nanoid(6)}`;
          const now = nowIso();
          const copy: Play = {
            ...deepClone(src),
            id: newId,
            title: `${src.title} (copy)`,
            createdAt: now,
            updatedAt: now,
            phases: src.phases.map((ph) => ({
              ...deepClone(ph),
              id: `ph_${nanoid(5)}`,
            })),
          };
          set({
            plays: [copy, ...get().plays],
            selectedPlayId: newId,
            selectedPhaseId: copy.phases[0]?.id ?? null,
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
          });
          return newId;
        },

        deletePlay: (id) => {
          const next = get().plays.filter((p) => p.id !== id);
          const newSel = next[0] ?? null;
          // Drop versionHistory & undo entries that reference this play.
          const { [id]: _gone, ...remainingHistory } = get().versionHistory;
          void _gone;
          set({
            plays: next,
            versionHistory: remainingHistory,
            selectedPlayId: newSel?.id ?? null,
            selectedPhaseId: newSel?.phases[0]?.id ?? null,
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
            undoStack: get().undoStack.filter((u) => u.playId !== id),
            redoStack: get().redoStack.filter((u) => u.playId !== id),
          });
        },

        updatePlayMeta: (id, patch) => {
          captureUndo("update-play-meta", id);
          set({
            plays: mapPlay(get().plays, id, (p) => bumpUpdated({ ...p, ...patch })),
          });
        },

        /* ---------------- phases ------------------ */
        addPhase: (playId, fromFormationId) => {
          captureUndo("add-phase", playId);
          const phaseId = `ph_${nanoid(5)}`;
          set({
            plays: mapPlay(get().plays, playId, (p) => {
              const last = p.phases[p.phases.length - 1];
              const base = fromFormationId
                ? clonePhaseFromFormation(fromFormationId)
                : { tokens: deepClone(last?.tokens ?? []), paths: [] as PlayPath[] };
              const phase: PlayPhase = {
                id: phaseId,
                order: p.phases.length,
                phase: "READ_1",
                notes: "",
                tokens: base.tokens,
                paths: base.paths,
              };
              return bumpUpdated({ ...p, phases: [...p.phases, phase] });
            }),
            selectedPhaseId: phaseId,
          });
          return phaseId;
        },

        duplicatePhase: (playId, phaseId) => {
          captureUndo("duplicate-phase", playId);
          const newId = `ph_${nanoid(5)}`;
          set({
            plays: mapPlay(get().plays, playId, (p) => {
              const idx = p.phases.findIndex((ph) => ph.id === phaseId);
              if (idx === -1) return p;
              const src = p.phases[idx];
              const copy: PlayPhase = {
                ...deepClone(src),
                id: newId,
                order: idx + 1,
                notes: src.notes ? `${src.notes} (copy)` : "",
              };
              const phases = [...p.phases.slice(0, idx + 1), copy, ...p.phases.slice(idx + 1)].map(
                (ph, i) => ({ ...ph, order: i }),
              );
              return bumpUpdated({ ...p, phases });
            }),
            selectedPhaseId: newId,
          });
          return newId;
        },

        deletePhase: (playId, phaseId) => {
          const idx = get().plays.find((p) => p.id === playId)?.phases.findIndex(
            (ph) => ph.id === phaseId,
          );
          if (idx === undefined || idx === -1) return;
          captureUndo("delete-phase", playId);
          let nextSelectedPhase: string | null = null;
          set({
            plays: mapPlay(get().plays, playId, (p) => {
              if (p.phases.length <= 1) return p;
              const phases = p.phases
                .filter((ph) => ph.id !== phaseId)
                .map((ph, i) => ({ ...ph, order: i }));
              nextSelectedPhase = phases[Math.max(0, idx - 1)]?.id ?? null;
              return bumpUpdated({ ...p, phases });
            }),
          });
          if (nextSelectedPhase) {
            set({
              selectedPhaseId: nextSelectedPhase,
              selectedTokenId: null,
              selectedPathId: null,
              selection: { kind: "none" },
              pendingPathDraft: null,
            });
          }
        },

        updatePhase: (playId, phaseId, patch) => {
          captureUndo("update-phase", playId);
          set({
            plays: mapPlay(get().plays, playId, (p) =>
              bumpUpdated(mapPhase(p, phaseId, (ph) => ({ ...ph, ...patch }))),
            ),
          });
        },

        reorderPhase: (playId, fromIndex, toIndex) => {
          if (fromIndex === toIndex) return;
          captureUndo("reorder-phase", playId);
          set({
            plays: mapPlay(get().plays, playId, (p) => {
              const phases = [...p.phases];
              const [m] = phases.splice(fromIndex, 1);
              phases.splice(toIndex, 0, m);
              return bumpUpdated({ ...p, phases: phases.map((ph, i) => ({ ...ph, order: i })) });
            }),
          });
        },

        /* ---------------- tokens ------------------ */
        addToken: (playId, phaseId, token) => {
          // Single-ball guard: silently block duplicate BALL placement.
          if (token.type === "BALL") {
            const phase = get()
              .plays.find((p) => p.id === playId)
              ?.phases.find((ph) => ph.id === phaseId);
            if (phase?.tokens.some((t) => t.type === "BALL")) {
              return null;
            }
          }
          captureUndo("add-token", playId);
          const id = `tk_${nanoid(5)}`;
          set({
            plays: mapPlay(get().plays, playId, (p) =>
              bumpUpdated(
                mapPhase(p, phaseId, (ph) => ({
                  ...ph,
                  tokens: [...ph.tokens, { ...token, id }],
                })),
              ),
            ),
            selectedTokenId: id,
            selectedPathId: null,
            selection: { kind: "token", tokenId: id },
          });
          return id;
        },

        updateToken: (playId, phaseId, tokenId, patch) => {
          captureUndo("update-token", playId);
          set({
            plays: mapPlay(get().plays, playId, (p) => {
              const phaseIdx = p.phases.findIndex((ph) => ph.id === phaseId);
              if (phaseIdx === -1) return p;
              const oldPhase = p.phases[phaseIdx];
              const newTokens = oldPhase.tokens.map((t) =>
                t.id === tokenId ? { ...t, ...patch } : t,
              );
              const newPhase: PlayPhase = { ...oldPhase, tokens: newTokens };
              // Compute deltas and propagate forward only when an x/y change
              // happens — label-only or other-attr edits stay in this phase.
              const deltas = tokenDeltas(oldPhase.tokens, newTokens);
              let phases = p.phases.slice();
              phases[phaseIdx] = newPhase;
              for (const d of deltas) {
                phases = propagateTokenForward(
                  phases,
                  phaseIdx,
                  d.id,
                  d.oldPos,
                  d.newPos,
                );
              }
              return bumpUpdated({ ...p, phases });
            }),
          });
        },

        removeToken: (playId, phaseId, tokenId) => {
          captureUndo("remove-token", playId);
          set({
            plays: mapPlay(get().plays, playId, (p) =>
              bumpUpdated(
                // Cascade-delete attached paths.
                mapPhase(p, phaseId, (ph) => ({
                  ...ph,
                  tokens: ph.tokens.filter((t) => t.id !== tokenId),
                  paths: ph.paths.filter(
                    (pa) => pa.startTokenId !== tokenId && pa.endTokenId !== tokenId,
                  ),
                })),
              ),
            ),
            selectedTokenId: null,
            selection: { kind: "none" },
          });
        },

        /* ---------------- paths ------------------- */
        addPath: (playId, phaseId, path) => {
          // Defensive: block degenerate self-paths.
          if (
            path.startTokenId &&
            path.endTokenId &&
            path.startTokenId === path.endTokenId
          ) {
            return null;
          }
          captureUndo("add-path", playId);
          const id = `pa_${nanoid(5)}`;
          const committed: PlayPath = { ...path, id };
          set({
            plays: mapPlay(get().plays, playId, (p) => {
              const phaseIdx = p.phases.findIndex((ph) => ph.id === phaseId);
              if (phaseIdx === -1) return p;
              const oldPhase = p.phases[phaseIdx];
              // 1) Append the new path to the phase.
              const withPath: PlayPhase = {
                ...oldPhase,
                paths: [...oldPhase.paths, committed],
              };
              // 2) Apply the action's physical effect to the tokens.
              const newPhase = applyActionEffectsToPhase(withPath, committed);
              // 3) Compute which tokens moved.
              const deltas = tokenDeltas(oldPhase.tokens, newPhase.tokens);
              // 4) Replace the source phase, then propagate each delta forward.
              let phases = p.phases.slice();
              phases[phaseIdx] = newPhase;
              for (const d of deltas) {
                phases = propagateTokenForward(
                  phases,
                  phaseIdx,
                  d.id,
                  d.oldPos,
                  d.newPos,
                );
              }
              return bumpUpdated({ ...p, phases });
            }),
            selectedPathId: id,
            selectedTokenId: null,
            selection: { kind: "path", pathId: id },
          });
          return id;
        },

        updatePath: (playId, phaseId, pathId, patch) => {
          captureUndo("update-path", playId);
          set({
            plays: mapPlay(get().plays, playId, (p) =>
              bumpUpdated(
                mapPhase(p, phaseId, (ph) => ({
                  ...ph,
                  paths: ph.paths.map((pa) => (pa.id === pathId ? { ...pa, ...patch } : pa)),
                })),
              ),
            ),
          });
        },

        removePath: (playId, phaseId, pathId) => {
          captureUndo("remove-path", playId);
          set({
            plays: mapPlay(get().plays, playId, (p) =>
              bumpUpdated(
                mapPhase(p, phaseId, (ph) => ({
                  ...ph,
                  paths: ph.paths.filter((pa) => pa.id !== pathId),
                })),
              ),
            ),
            selectedPathId: null,
            selection: { kind: "none" },
          });
        },

        /* ---------------- versioning -------------- */
        saveVersion: (playId, label) => {
          const play = get().plays.find((p) => p.id === playId);
          if (!play) return false;
          const parsed = safeParsePlaySnapshot(play);
          if (!parsed.ok) {
            console.warn("[playbook] saveVersion blocked: snapshot failed validation", {
              issues: parsed.error.issues.slice(0, 5),
            });
            return false;
          }
          const author = get().authorName?.trim() || "Unknown coach";
          const v: PlayVersion = {
            id: `v_${nanoid(5)}`,
            label: label ?? `v${(get().versionHistory[playId]?.length ?? 0) + 1}`,
            savedAt: nowIso(),
            authorName: author,
            snapshot: deepClone(parsed.data),
          };
          set({
            versionHistory: {
              ...get().versionHistory,
              [playId]: [v, ...(get().versionHistory[playId] ?? [])],
            },
            plays: mapPlay(get().plays, playId, (p) =>
              bumpUpdated({ ...p, versionLabel: v.label }),
            ),
          });
          return true;
        },

        restoreVersion: (playId, versionId) => {
          const v = (get().versionHistory[playId] ?? []).find((x) => x.id === versionId);
          if (!v) return false;
          const parsed = safeParsePlaySnapshot(v.snapshot);
          if (!parsed.ok) {
            console.warn("[playbook] restoreVersion blocked: stored snapshot invalid", {
              issues: parsed.error.issues.slice(0, 5),
            });
            return false;
          }
          captureUndo("restore-version", playId);
          const restored = { ...parsed.data, updatedAt: nowIso() };
          replacePlay(playId, restored);
          set({
            selectedPhaseId: restored.phases[0]?.id ?? null,
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
          });
          return true;
        },

        /* ---------------- undo / redo ------------- */
        undo: () => {
          const stack = get().undoStack;
          if (stack.length === 0) return false;
          const entry = stack[stack.length - 1];
          const current = get().plays.find((p) => p.id === entry.playId);
          if (!current) {
            // Play no longer exists — drop entry and bail.
            set({ undoStack: stack.slice(0, -1) });
            return false;
          }
          const redoEntry: UndoEntry = {
            id: `r_${nanoid(6)}`,
            ts: Date.now(),
            label: entry.label,
            playId: entry.playId,
            before: deepClone(current),
          };
          replacePlay(entry.playId, entry.before);
          set({
            undoStack: stack.slice(0, -1),
            redoStack: pushCapped(get().redoStack, redoEntry),
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
          });
          return true;
        },
        redo: () => {
          const stack = get().redoStack;
          if (stack.length === 0) return false;
          const entry = stack[stack.length - 1];
          const current = get().plays.find((p) => p.id === entry.playId);
          if (!current) {
            set({ redoStack: stack.slice(0, -1) });
            return false;
          }
          const undoEntry: UndoEntry = {
            id: `u_${nanoid(6)}`,
            ts: Date.now(),
            label: entry.label,
            playId: entry.playId,
            before: deepClone(current),
          };
          replacePlay(entry.playId, entry.before);
          set({
            redoStack: stack.slice(0, -1),
            undoStack: pushCapped(get().undoStack, undoEntry),
            selectedTokenId: null,
            selectedPathId: null,
            selection: { kind: "none" },
            pendingPathDraft: null,
          });
          return true;
        },
        canUndo: () => get().undoStack.length > 0,
        canRedo: () => get().redoStack.length > 0,

        /* ---------------- resets ------------------ */
        resetAll: () => {
          set({
            ...buildInitial(),
          });
        },
      };
    },
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(makeSafeStorage),
      // Persist only the durable bits. Editor mode, draft, undo/redo, and
      // transient selection are intentionally NOT persisted.
      partialize: (state) => ({
        plays: state.plays,
        versionHistory: state.versionHistory,
        selectedPlayId: state.selectedPlayId,
        selectedPhaseId: state.selectedPhaseId,
        authorName: state.authorName,
      }),
      // Drop persisted blobs that fail schema validation rather than crash.
      merge: (persistedUnknown, current) => {
        const fallback = {
          ...current,
          // Always reset ephemeral on hydration.
          editorMode: "SELECT" as EditorMode,
          cutStyleSelection: "STRAIGHT" as CutStyle,
          passTypeSelection: "CHEST" as PassType,
          pendingPathDraft: null,
          undoStack: [],
          redoStack: [],
          selectedTokenId: null,
          selectedPathId: null,
          selection: { kind: "none" } as SelectionState,
        };
        if (!persistedUnknown || typeof persistedUnknown !== "object") return fallback;
        const candidate = {
          schemaVersion: PERSIST_VERSION,
          ...(persistedUnknown as Record<string, unknown>),
        };
        const parsed = safeParsePersistedPlaybook(candidate);
        if (!parsed.ok) {
          console.warn("[playbook] persisted store failed validation; using defaults", {
            issues: parsed.error.issues.slice(0, 5),
          });
          return fallback;
        }
        const data = parsed.data;
        // Re-bind selectedPhase if it points at a play that no longer exists.
        const safePlayId =
          data.plays.find((p) => p.id === data.selectedPlayId)?.id ??
          data.plays[0]?.id ??
          null;
        const safePhaseId =
          data.plays.find((p) => p.id === safePlayId)?.phases[0]?.id ??
          (safePlayId === data.selectedPlayId ? data.selectedPhaseId : null);
        return {
          ...fallback,
          plays: data.plays,
          versionHistory: data.versionHistory,
          selectedPlayId: safePlayId,
          selectedPhaseId: safePhaseId,
          authorName: data.authorName,
        };
      },
    },
  ),
);

export type { CourtType } from "./schema";
