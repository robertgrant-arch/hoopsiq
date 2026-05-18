/**
 * Action layer for v2 plays.
 *
 * Every PlayPath the user draws maps to a semantic Action — the basketball
 * intent of the line, not just its geometry. Actions are not persisted
 * separately; they're derived from `phase.paths + phase.tokens` on demand
 * via `phaseActions(phase)`.
 *
 * This unlocks downstream capabilities without changing the authoring UX:
 *   - Auto-generated quizzes (the existing PlayQuiz module can ask
 *     "what action just happened?" because we now know).
 *   - Semantic diff between plays.
 *   - AI-authoring (an LLM can emit Action[] and round-trip to paths).
 *   - Coach analytics ("which players miss the back-cut").
 */
import type {
  CutStyle,
  PlayPath,
  PlayPhase,
  PlayToken,
} from "./schema";

/* -------------------------------------------------------------------------- */
/* Action types                                                               */
/* -------------------------------------------------------------------------- */

export type CutAction = {
  kind: "cut";
  pathId: string;
  player: string; // PlayToken.id (offense/defense token)
  style: CutStyle;
  /** Flat [x,y,…] in stage coords matching PlayPath.points. */
  points: number[];
};

export type DribbleAction = {
  kind: "dribble";
  pathId: string;
  player: string;
  points: number[];
};

export type PassAction = {
  kind: "pass";
  pathId: string;
  from: string; // token id
  to: string; // token id
};

export type ScreenAction = {
  kind: "screen";
  pathId: string;
  /** Optional — v2 screens were authored without explicit attribution. */
  screener?: string;
  screenedFor?: string;
  /** End point of the screen line, in stage coords. */
  at: { x: number; y: number };
};

export type HandoffAction = {
  kind: "handoff";
  pathId: string;
  from: string;
  to: string;
  at: { x: number; y: number };
};

export type Action =
  | CutAction
  | DribbleAction
  | PassAction
  | ScreenAction
  | HandoffAction;

/* -------------------------------------------------------------------------- */
/* Derivation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Derive the semantic Action from a PlayPath. Returns null only when the
 * path is missing required attribution (e.g. a Pass with no startTokenId).
 *
 * v2 paths drawn via the existing canvas tools always have:
 *   - CUT / DRIBBLE: startTokenId set (the player whose path it is)
 *   - PASS / HANDOFF: both startTokenId and endTokenId set
 *   - SCREEN: optional attribution; we surface it when present.
 */
export function actionFromPath(path: PlayPath): Action | null {
  const last = path.points.length;
  const ex = path.points[last - 2];
  const ey = path.points[last - 1];

  switch (path.type) {
    case "CUT":
      if (!path.startTokenId) return null;
      return {
        kind: "cut",
        pathId: path.id,
        player: path.startTokenId,
        style: path.cutStyle ?? "STRAIGHT",
        points: path.points,
      };
    case "DRIBBLE":
      if (!path.startTokenId) return null;
      return {
        kind: "dribble",
        pathId: path.id,
        player: path.startTokenId,
        points: path.points,
      };
    case "PASS":
      if (!path.startTokenId || !path.endTokenId) return null;
      return {
        kind: "pass",
        pathId: path.id,
        from: path.startTokenId,
        to: path.endTokenId,
      };
    case "HANDOFF":
      if (!path.startTokenId || !path.endTokenId) return null;
      return {
        kind: "handoff",
        pathId: path.id,
        from: path.startTokenId,
        to: path.endTokenId,
        at: { x: ex, y: ey },
      };
    case "SCREEN":
      return {
        kind: "screen",
        pathId: path.id,
        screener: path.startTokenId,
        screenedFor: path.endTokenId,
        at: { x: ex, y: ey },
      };
  }
}

/** Compute all derivable actions for a phase, in path order. */
export function phaseActions(phase: PlayPhase): Action[] {
  const out: Action[] = [];
  for (const p of phase.paths) {
    const a = actionFromPath(p);
    if (a) out.push(a);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Human-readable description                                                 */
/* -------------------------------------------------------------------------- */

const CUT_STYLE_LABEL: Record<CutStyle, string> = {
  STRAIGHT: "straight cut",
  CURVE: "curl cut",
  VCUT: "V-cut",
  LCUT: "L-cut",
  BACKDOOR: "back-cut",
  FLARE: "flare cut",
};

function tokenLabel(tokens: PlayToken[], id: string | undefined): string {
  if (!id) return "?";
  const t = tokens.find((x) => x.id === id);
  if (!t) return id;
  return t.label || (t.type === "BALL" ? "ball" : id);
}

/**
 * Human-readable single-line description, e.g.
 *   "Player 4 — back-cut along 3 sample points"
 *   "Pass: 1 → 4"
 *   "Screen: 5 sets a screen for 1"
 */
export function describeAction(action: Action, tokens: PlayToken[]): string {
  switch (action.kind) {
    case "cut":
      return `${tokenLabel(tokens, action.player)} — ${
        CUT_STYLE_LABEL[action.style]
      }`;
    case "dribble":
      return `${tokenLabel(tokens, action.player)} — dribble`;
    case "pass":
      return `Pass: ${tokenLabel(tokens, action.from)} → ${tokenLabel(
        tokens,
        action.to,
      )}`;
    case "handoff":
      return `Handoff: ${tokenLabel(tokens, action.from)} → ${tokenLabel(
        tokens,
        action.to,
      )}`;
    case "screen": {
      const a = action.screener ? tokenLabel(tokens, action.screener) : "?";
      const b = action.screenedFor ? tokenLabel(tokens, action.screenedFor) : "?";
      if (action.screener && action.screenedFor) {
        return `Screen: ${a} sets screen for ${b}`;
      }
      return "Screen";
    }
  }
}

/** Lookup a derived action for a single path id within a phase. */
export function actionForPathId(
  phase: PlayPhase,
  pathId: string,
): Action | null {
  const path = phase.paths.find((p) => p.id === pathId);
  if (!path) return null;
  return actionFromPath(path);
}
