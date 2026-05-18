/**
 * usePlayback — animates a play across phase transitions.
 *
 * **Path-driven**: every phase's `paths` array describes what *physically*
 * happens during that phase. During phase N's animation slot, each path's
 * relevant token(s) are interpolated along the actual path geometry
 * (quadratic bezier for the curved arrows, polyline for free-form cuts).
 * Tokens not involved in any path stay at their phase-N position.
 *
 * Why this matters:
 *   - A PASS path stores [passer.x, passer.y, cx, cy, receiver.x, receiver.y].
 *     The ball follows that exact curve from passer to receiver, not a
 *     straight line between phase snapshots.
 *   - A CUT path stores [x0,y0, x1,y1, ..., xN,yN]. The cutter follows
 *     every segment, so a back-cut actually traces the back-cut.
 *   - A SCREEN path stores [screener.x, screener.y, screen_x, screen_y].
 *     The screener walks to the screen point and stops.
 *
 * Phase 0 with paths animates too (no "previous phase" required) — t goes
 * 0→1 over the phase, and tokens move from path-start to path-end.
 *
 * Stable across tab blur/focus:
 *   - RAF delta is clamped (max ~64 ms) so a long background freeze never
 *     fast-forwards to the end.
 *   - document.visibilitychange cancels the loop when hidden and resets
 *     timing on resume.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PathType,
  Play,
  PlayPath,
  PlayPhase,
  PlayToken,
} from "./schema";

export type PlaybackState = {
  isPlaying: boolean;
  /** Continuous global cursor in [0, totalSegments]. */
  cursor: number;
  /** Interpolated tokens for the current render frame. */
  tokens: PlayToken[];
  /** Current segment index (which phase is being animated). */
  segmentIndex: number;
};

const SEGMENT_DURATION_MS = 1400;
/** Hard ceiling on per-frame elapsed time. Anything bigger is treated as a
 *  resume from background and the timer reference is reset. */
const MAX_FRAME_DELTA_MS = 64;

/* -------------------------------------------------------------------------- */
/* Path geometry                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Evaluate a flat [x,y,...] path at parameter t ∈ [0,1].
 *   - length 4: straight line segment, lerp.
 *   - length 6: quadratic bezier B(t) = (1-t)²P0 + 2(1-t)t·P1 + t²·P2.
 *   - length 8+: polyline, parameterized by total arc length so motion
 *     is constant-speed regardless of segment density.
 */
function pointAlongPath(
  points: number[],
  t: number,
): { x: number; y: number } {
  if (points.length < 4) return { x: points[0] ?? 0, y: points[1] ?? 0 };
  const safeT = t < 0 ? 0 : t > 1 ? 1 : t;

  if (points.length === 4) {
    // line segment
    const x0 = points[0],
      y0 = points[1],
      x1 = points[2],
      y1 = points[3];
    return { x: x0 + (x1 - x0) * safeT, y: y0 + (y1 - y0) * safeT };
  }

  if (points.length === 6) {
    // quadratic bezier
    const x0 = points[0],
      y0 = points[1];
    const cx = points[2],
      cy = points[3];
    const x1 = points[4],
      y1 = points[5];
    const u = 1 - safeT;
    const x = u * u * x0 + 2 * u * safeT * cx + safeT * safeT * x1;
    const y = u * u * y0 + 2 * u * safeT * cy + safeT * safeT * y1;
    return { x, y };
  }

  // Polyline (length 8+, even). Walk by cumulative arc length.
  const segLens: number[] = [];
  let total = 0;
  for (let i = 2; i + 1 < points.length; i += 2) {
    const dx = points[i] - points[i - 2];
    const dy = points[i + 1] - points[i - 1];
    const d = Math.hypot(dx, dy);
    segLens.push(d);
    total += d;
  }
  if (total === 0) {
    return { x: points[0], y: points[1] };
  }
  const target = total * safeT;
  let walked = 0;
  for (let s = 0; s < segLens.length; s++) {
    const start = s * 2; // index of x0 of this segment
    const end = (s + 1) * 2; // index of x1 of this segment
    const len = segLens[s];
    if (walked + len >= target) {
      const local = len === 0 ? 0 : (target - walked) / len;
      const x0 = points[start],
        y0 = points[start + 1];
      const x1 = points[end],
        y1 = points[end + 1];
      return { x: x0 + (x1 - x0) * local, y: y0 + (y1 - y0) * local };
    }
    walked += len;
  }
  // Numerical fall-through: return last point.
  return {
    x: points[points.length - 2],
    y: points[points.length - 1],
  };
}

/* -------------------------------------------------------------------------- */
/* Path → moving tokens                                                       */
/* -------------------------------------------------------------------------- */

/**
 * For a given path, return the IDs of tokens whose position is driven by
 * this path during animation. Returns an empty array if the path has no
 * attribution (the path is then rendered statically only).
 */
function tokensMovingAlong(
  path: PlayPath,
  tokens: PlayToken[],
): string[] {
  const ball = tokens.find((t) => t.type === "BALL")?.id;
  switch (path.type as PathType) {
    case "CUT":
      return path.startTokenId ? [path.startTokenId] : [];
    case "DRIBBLE":
      return [
        ...(path.startTokenId ? [path.startTokenId] : []),
        ...(ball ? [ball] : []),
      ];
    case "PASS":
      return ball ? [ball] : [];
    case "HANDOFF":
      return [
        ...(path.startTokenId ? [path.startTokenId] : []),
        ...(path.endTokenId ? [path.endTokenId] : []),
        ...(ball ? [ball] : []),
      ];
    case "SCREEN":
      return path.startTokenId ? [path.startTokenId] : [];
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Frame composition                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Compute the visible token positions during phase N's animation at param t.
 *
 * Default: tokens hold their phase-N position (which already reflects the
 * end-state of phase N's actions thanks to applyActionEffectsToPhase in the
 * store). Tokens identified as "movers" along any of phase N's paths are
 * overridden with their position at parameter t along that path.
 *
 * If `t === 0`, tokens are at the path *start* (the before-action state).
 * If `t === 1`, tokens land at the path end, which equals their phase-N
 * end-state — animation and static display agree at the boundary.
 */
function tokensAtFrame(phase: PlayPhase, t: number): PlayToken[] {
  // Defensive: if no paths, just return phase tokens.
  if (!phase.paths.length) return phase.tokens;
  const out = phase.tokens.map((tk) => ({ ...tk }));

  for (const path of phase.paths) {
    const movers = tokensMovingAlong(path, phase.tokens);
    if (movers.length === 0) continue;
    const pt = pointAlongPath(path.points, t);
    for (const id of movers) {
      const idx = out.findIndex((tk) => tk.id === id);
      if (idx >= 0) out[idx] = { ...out[idx], x: pt.x, y: pt.y };
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export type UsePlaybackOpts = {
  /** Multiplier on the base SEGMENT_DURATION_MS. 1 = normal speed. */
  speed?: number;
  /** When true, reaching the end restarts at phase 0 instead of stopping. */
  loop?: boolean;
};

export function usePlayback(
  play: Play | undefined,
  opts: UsePlaybackOpts = {},
): PlaybackState & {
  play: () => void;
  pause: () => void;
  reset: () => void;
  setCursor: (c: number) => void;
} {
  const speed = Math.max(0.1, opts.speed ?? 1);
  const loop = !!opts.loop;
  const [isPlaying, setPlaying] = useState(false);
  const [cursor, setCursorState] = useState(0);
  const cursorRef = useRef(0);
  cursorRef.current = cursor;
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Each phase gets its own animation slot (path-driven). If there are no
  // paths, the phase still occupies a slot but renders statically.
  const segments = play?.phases.length ?? 0;

  /* ---------- visibility ---------- */
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "hidden") {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTsRef.current = null;
      } else {
        lastTsRef.current = null;
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ---------- main loop ---------- */
  useEffect(() => {
    if (!isPlaying || !play || segments < 1) return;
    let cancelled = false;

    function tick(ts: number) {
      if (cancelled || document.hidden) {
        rafRef.current = null;
        lastTsRef.current = null;
        return;
      }
      const last = lastTsRef.current;
      let dt = last == null ? 0 : ts - last;
      if (dt > MAX_FRAME_DELTA_MS) dt = 0;
      lastTsRef.current = ts;
      const segMs = SEGMENT_DURATION_MS / speed;
      const next = cursorRef.current + dt / segMs;
      if (next >= segments) {
        if (loop && segments > 0) {
          // Loop: reset to start and keep playing.
          cursorRef.current = 0;
          setCursorState(0);
        } else {
          cursorRef.current = segments;
          setCursorState(segments);
          setPlaying(false);
          lastTsRef.current = null;
          rafRef.current = null;
          return;
        }
      } else {
        cursorRef.current = next;
        setCursorState(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying, play, segments, speed, loop]);

  const segmentIndex = useMemo(
    () => Math.min(Math.max(0, segments - 1), Math.max(0, Math.floor(cursor))),
    [cursor, segments],
  );
  const t = cursor - segmentIndex;

  const tokens = useMemo<PlayToken[]>(() => {
    if (!play?.phases.length) return [];
    if (segments <= 0) return play.phases[0].tokens;
    if (cursor >= segments) {
      // Past-end: show last phase's end state.
      return play.phases[segments - 1].tokens;
    }
    return tokensAtFrame(play.phases[segmentIndex], t);
  }, [play, segments, cursor, segmentIndex, t]);

  return {
    isPlaying,
    cursor,
    tokens,
    segmentIndex,
    play: () => {
      // Restart from top if we're past the last segment.
      if (cursorRef.current >= segments) {
        cursorRef.current = 0;
        setCursorState(0);
      }
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    reset: () => {
      setPlaying(false);
      cursorRef.current = 0;
      setCursorState(0);
    },
    setCursor: (c) => {
      const safe = Number.isFinite(c) ? Math.max(0, Math.min(segments, c)) : 0;
      cursorRef.current = safe;
      setCursorState(safe);
    },
  };
}
