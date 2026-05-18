/**
 * Playbook Studio v3 store.
 *
 * Pure action-based persistence. Phases past index 0 carry only `actions`
 * — positions and ballHolder are derived by the resolver. Persistence is
 * keyed separately from the v2 store so the two systems can co-exist.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Action,
  Phase,
  Play,
  PlayerId,
} from "../../../../src/playbook/types";
import { resolvePlay } from "../../../../src/playbook/resolver";
import { v3Seeds } from "./seeds";

const PERSIST_KEY = "hoopsos-playbook-v3";
const PERSIST_VERSION = 1;

export type ToolMode =
  | "SELECT"
  | "DRAW_CUT"
  | "DRAW_DRIBBLE"
  | "DRAW_PASS"
  | "DRAW_SCREEN"
  | "DRAW_HANDOFF";

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
        /* noop */
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

function nextLabel(phases: Phase[]): string {
  const n = phases.length + 1;
  return `Phase ${String(n).padStart(2, "0")}`;
}

function deepClone<T>(v: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(v);
    } catch {
      /* fall through */
    }
  }
  return JSON.parse(JSON.stringify(v)) as T;
}

type Snapshot = {
  plays: Play[];
  selectedPlayId: string | null;
  selectedPhaseIndex: number;
};

type State = Snapshot & {
  /* ephemeral */
  toolMode: ToolMode;
  selectedPlayerId: PlayerId | null;
  pendingDraft:
    | null
    | {
        kind: "cut" | "dribble";
        player: PlayerId;
        path: { x: number; y: number }[];
      }
    | {
        kind: "pass-pick-to";
        from: PlayerId;
      }
    | {
        kind: "screen-pick-for";
        screener: PlayerId;
        at: { x: number; y: number };
      }
    | {
        kind: "handoff-pick-to";
        from: PlayerId;
        at: { x: number; y: number };
      };
  /* undo / redo */
  undoStack: Snapshot[];
  redoStack: Snapshot[];

  /* selection / mode */
  setToolMode: (mode: ToolMode) => void;
  setSelectedPlay: (id: string | null) => void;
  setSelectedPhaseIndex: (idx: number) => void;
  setSelectedPlayer: (id: PlayerId | null) => void;
  clearPendingDraft: () => void;
  setPendingDraft: (d: State["pendingDraft"]) => void;

  /* play CRUD */
  createPlay: () => string;
  updatePlayMeta: (id: string, patch: Partial<Pick<Play, "name" | "version" | "formation">>) => void;
  deletePlay: (id: string) => void;

  /* phases */
  addPhase: () => void;
  duplicatePhase: (phaseIndex: number) => void;
  deletePhase: (phaseIndex: number) => void;

  /* actions */
  addAction: (phaseIndex: number, action: Action) => void;
  removeLastAction: (phaseIndex: number) => void;

  /* undo / redo */
  undo: () => boolean;
  redo: () => boolean;

  /* hard reset */
  resetSeeds: () => void;
};

function snapshotOf(s: Snapshot): Snapshot {
  return {
    plays: deepClone(s.plays),
    selectedPlayId: s.selectedPlayId,
    selectedPhaseIndex: s.selectedPhaseIndex,
  };
}

function buildInitial(): Snapshot {
  return {
    plays: deepClone(v3Seeds),
    selectedPlayId: v3Seeds[0]?.id ?? null,
    selectedPhaseIndex: 0,
  };
}

export const useV3 = create<State>()(
  persist(
    (set, get) => {
      function pushUndo() {
        const cap = 50;
        const stack = [...get().undoStack, snapshotOf(get())];
        const next = stack.length > cap ? stack.slice(stack.length - cap) : stack;
        set({ undoStack: next, redoStack: [] });
      }

      return {
        ...buildInitial(),
        toolMode: "SELECT",
        selectedPlayerId: null,
        pendingDraft: null,
        undoStack: [],
        redoStack: [],

        setToolMode: (mode) =>
          set({ toolMode: mode, pendingDraft: null }),
        setSelectedPlay: (id) =>
          set({ selectedPlayId: id, selectedPhaseIndex: 0, pendingDraft: null, selectedPlayerId: null }),
        setSelectedPhaseIndex: (idx) =>
          set({ selectedPhaseIndex: Math.max(0, idx), pendingDraft: null, selectedPlayerId: null }),
        setSelectedPlayer: (id) => set({ selectedPlayerId: id }),
        clearPendingDraft: () => set({ pendingDraft: null }),
        setPendingDraft: (d) => set({ pendingDraft: d }),

        createPlay: () => {
          pushUndo();
          const id = `play_v3_${nanoid(6)}`;
          const newPlay: Play = {
            schema: "v2",
            id,
            name: "Untitled Play",
            version: "v0.1",
            phases: [
              {
                id: `ph_${nanoid(5)}`,
                label: "Phase 01",
                startPositions: {
                  "1": { x: 0.50, y: 0.95 },
                  "2": { x: 0.05, y: 0.65 },
                  "3": { x: 0.95, y: 0.65 },
                  "4": { x: 0.31, y: 0.80 },
                  "5": { x: 0.69, y: 0.80 },
                },
                ballHolder: "1",
                actions: [],
              },
            ],
          };
          set({
            plays: [newPlay, ...get().plays],
            selectedPlayId: id,
            selectedPhaseIndex: 0,
          });
          return id;
        },

        updatePlayMeta: (id, patch) => {
          pushUndo();
          set({
            plays: get().plays.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          });
        },

        deletePlay: (id) => {
          pushUndo();
          const next = get().plays.filter((p) => p.id !== id);
          set({
            plays: next,
            selectedPlayId: next[0]?.id ?? null,
            selectedPhaseIndex: 0,
          });
        },

        addPhase: () => {
          pushUndo();
          const id = get().selectedPlayId;
          if (!id) return;
          set({
            plays: get().plays.map((p) => {
              if (p.id !== id) return p;
              const newPhase: Phase = {
                id: `ph_${nanoid(5)}`,
                label: nextLabel(p.phases),
                actions: [],
                // explicitly NO startPositions, NO ballHolder
              };
              return { ...p, phases: [...p.phases, newPhase] };
            }),
            selectedPhaseIndex: get().plays.find((p) => p.id === id)?.phases.length ?? 0,
          });
        },

        duplicatePhase: (phaseIndex) => {
          pushUndo();
          const id = get().selectedPlayId;
          if (!id) return;
          set({
            plays: get().plays.map((p) => {
              if (p.id !== id) return p;
              const src = p.phases[phaseIndex];
              if (!src) return p;
              // Copy actions ONLY. Phase 0 may have startPositions, but the
              // duplicate is appended after phase 0, so it must not carry them.
              const dup: Phase = {
                id: `ph_${nanoid(5)}`,
                label: nextLabel(p.phases),
                actions: deepClone(src.actions),
              };
              return {
                ...p,
                phases: [...p.phases.slice(0, phaseIndex + 1), dup, ...p.phases.slice(phaseIndex + 1)],
              };
            }),
            selectedPhaseIndex: phaseIndex + 1,
          });
        },

        deletePhase: (phaseIndex) => {
          pushUndo();
          const id = get().selectedPlayId;
          if (!id) return;
          set({
            plays: get().plays.map((p) => {
              if (p.id !== id) return p;
              if (p.phases.length <= 1) return p;
              if (phaseIndex === 0) return p; // keep phase 0 — it carries startPositions
              return { ...p, phases: p.phases.filter((_, i) => i !== phaseIndex) };
            }),
            selectedPhaseIndex: Math.max(0, phaseIndex - 1),
          });
        },

        addAction: (phaseIndex, action) => {
          pushUndo();
          const id = get().selectedPlayId;
          if (!id) return;
          set({
            plays: get().plays.map((p) => {
              if (p.id !== id) return p;
              const phases = p.phases.map((ph, i) =>
                i === phaseIndex ? { ...ph, actions: [...ph.actions, action] } : ph,
              );
              return { ...p, phases };
            }),
            pendingDraft: null,
            selectedPlayerId: null,
          });
        },

        removeLastAction: (phaseIndex) => {
          pushUndo();
          const id = get().selectedPlayId;
          if (!id) return;
          set({
            plays: get().plays.map((p) => {
              if (p.id !== id) return p;
              const phases = p.phases.map((ph, i) =>
                i === phaseIndex ? { ...ph, actions: ph.actions.slice(0, -1) } : ph,
              );
              return { ...p, phases };
            }),
          });
        },

        undo: () => {
          const stack = get().undoStack;
          if (stack.length === 0) return false;
          const prev = stack[stack.length - 1];
          set({
            undoStack: stack.slice(0, -1),
            redoStack: [...get().redoStack, snapshotOf(get())].slice(-50),
            plays: prev.plays,
            selectedPlayId: prev.selectedPlayId,
            selectedPhaseIndex: prev.selectedPhaseIndex,
            pendingDraft: null,
            selectedPlayerId: null,
          });
          return true;
        },

        redo: () => {
          const stack = get().redoStack;
          if (stack.length === 0) return false;
          const nxt = stack[stack.length - 1];
          set({
            redoStack: stack.slice(0, -1),
            undoStack: [...get().undoStack, snapshotOf(get())].slice(-50),
            plays: nxt.plays,
            selectedPlayId: nxt.selectedPlayId,
            selectedPhaseIndex: nxt.selectedPhaseIndex,
            pendingDraft: null,
            selectedPlayerId: null,
          });
          return true;
        },

        resetSeeds: () => {
          set({
            ...buildInitial(),
            toolMode: "SELECT",
            selectedPlayerId: null,
            pendingDraft: null,
            undoStack: [],
            redoStack: [],
          });
        },
      };
    },
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(makeSafeStorage),
      partialize: (state) => ({
        plays: state.plays,
        selectedPlayId: state.selectedPlayId,
        selectedPhaseIndex: state.selectedPhaseIndex,
      }),
    },
  ),
);

/** Helper: derive the resolved frames for a play. */
export function framesFor(play: Play) {
  return resolvePlay(play);
}
