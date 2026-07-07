/**
 * Film Room v2 — unique-seconds watch accumulator.
 *
 * Tracks which whole seconds of a clip segment the player has actually seen
 * (a Set of floor(second) indices) and derives a watch percentage from the
 * unique count. Rewatching a second never double-counts — the spec's ≥90%
 * "watched" threshold is based on unique coverage, not playtime.
 *
 * Pure logic lives in `createWatchAccumulator` (unit-testable, no React);
 * `useWatchAccumulator` is the thin hook wrapper used by the clip viewer.
 */

import { useCallback, useMemo, useRef, useState } from "react";

/** Number of countable second-buckets in a segment (last partial second counts). */
export function totalSecondsFor(durationMs: number): number {
  return Math.max(1, Math.ceil(durationMs / 1000));
}

/** Percentage of unique seconds watched, clamped to 0–100. */
export function computePct(uniqueSeconds: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, (uniqueSeconds / totalSeconds) * 100));
}

export interface WatchAccumulator {
  /** Current watch percentage (0–100). */
  readonly pct: number;
  /** Count of unique seconds seen so far. */
  readonly uniqueCount: number;
  /**
   * Record that a given playback second was seen. Fractional input is
   * floored; out-of-range indices are ignored. Returns the new pct.
   */
  markSecond(second: number): number;
  /** Clear all progress. */
  reset(): void;
}

export function createWatchAccumulator(durationMs: number): WatchAccumulator {
  const total = totalSecondsFor(durationMs);
  const seen = new Set<number>();
  return {
    get pct() {
      return computePct(seen.size, total);
    },
    get uniqueCount() {
      return seen.size;
    },
    markSecond(second: number) {
      const s = Math.floor(second);
      if (Number.isFinite(s) && s >= 0 && s < total) seen.add(s);
      return computePct(seen.size, total);
    },
    reset() {
      seen.clear();
    },
  };
}

/**
 * React wrapper: `{ pct, markSecond, reset }` where `pct` is reactive state
 * so the viewer re-renders as coverage grows.
 */
export function useWatchAccumulator(durationMs: number) {
  const acc = useMemo(() => createWatchAccumulator(durationMs), [durationMs]);
  const accRef = useRef(acc);
  accRef.current = acc;

  const [pct, setPct] = useState(0);

  const markSecond = useCallback((second: number) => {
    const next = accRef.current.markSecond(second);
    setPct((prev) => (next !== prev ? next : prev));
  }, []);

  const reset = useCallback(() => {
    accRef.current.reset();
    setPct(0);
  }, []);

  return { pct, markSecond, reset };
}
