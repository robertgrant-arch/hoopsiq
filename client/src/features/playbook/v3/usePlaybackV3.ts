/**
 * Playbook v3 playback — RAF-driven phase animation using the action
 * resolver + tween() helper. Each phase advances `t: 0 → 1` over a fixed
 * duration. Visibility-stable (drops accumulated time on tab wake).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolvePlay } from "../../../../src/playbook/resolver";
import { tween } from "../../../../src/playbook/animate";
import type { Play, PlayerId, Vec2 } from "../../../../src/playbook/types";

const PHASE_DURATION_MS = 1400;
const MAX_FRAME_DELTA_MS = 64;

export type PlaybackV3 = {
  isPlaying: boolean;
  /** Current phase index being animated. */
  phaseIndex: number;
  /** Tween parameter within the current phase (0..1). */
  t: number;
  /** Interpolated positions for the current frame. */
  positions: Record<PlayerId, Vec2>;
  /** Ball holder at the current frame. */
  ballHolder: PlayerId | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (phaseIndex: number) => void;
};

export function usePlaybackV3(playArg: Play | undefined): PlaybackV3 {
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const phaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  tRef.current = t;
  phaseRef.current = phaseIndex;

  const frames = useMemo(() => (playArg ? resolvePlay(playArg) : []), [playArg]);
  const phaseCount = playArg?.phases.length ?? 0;

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
    if (!isPlaying || !playArg || phaseCount < 2) return;
    let cancelled = false;

    function loop(ts: number) {
      if (cancelled || document.hidden) {
        rafRef.current = null;
        lastTsRef.current = null;
        return;
      }
      const last = lastTsRef.current;
      let dt = last == null ? 0 : ts - last;
      if (dt > MAX_FRAME_DELTA_MS) dt = 0;
      lastTsRef.current = ts;

      const nextT = tRef.current + dt / PHASE_DURATION_MS;
      if (nextT >= 1) {
        // Advance phase. If this was the last phase, stop.
        const nextPhase = phaseRef.current + 1;
        if (nextPhase >= phaseCount) {
          tRef.current = 1;
          setT(1);
          setIsPlaying(false);
          rafRef.current = null;
          lastTsRef.current = null;
          return;
        }
        phaseRef.current = nextPhase;
        tRef.current = 0;
        setPhaseIndex(nextPhase);
        setT(0);
      } else {
        tRef.current = nextT;
        setT(nextT);
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying, playArg, phaseCount]);

  /* ---------- derived frame ---------- */
  const positions = useMemo<Record<PlayerId, Vec2>>(() => {
    if (!playArg || frames.length === 0) return {};
    const idx = Math.max(0, Math.min(phaseCount - 1, phaseIndex));
    if (idx === 0 && t === 0) return frames[0].positions;
    const phase = playArg.phases[idx];
    const prev = frames[idx];
    const next = frames[idx + 1] ?? frames[idx];
    return tween(prev, next, phase, t);
  }, [playArg, frames, phaseCount, phaseIndex, t]);

  const ballHolder = useMemo<PlayerId | null>(() => {
    if (!playArg || frames.length === 0) return null;
    const idx = Math.max(0, Math.min(phaseCount - 1, phaseIndex));
    return frames[idx + 1]?.ballHolder ?? frames[idx]?.ballHolder ?? null;
  }, [playArg, frames, phaseCount, phaseIndex]);

  const play = useCallback(() => {
    if (!playArg || phaseCount < 2) return;
    if (phaseRef.current >= phaseCount - 1 && tRef.current >= 1) {
      // restart from beginning
      phaseRef.current = 0;
      tRef.current = 0;
      setPhaseIndex(0);
      setT(0);
    }
    setIsPlaying(true);
  }, [playArg, phaseCount]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    phaseRef.current = 0;
    tRef.current = 0;
    setPhaseIndex(0);
    setT(0);
  }, []);

  const seek = useCallback(
    (idx: number) => {
      const safe = Math.max(0, Math.min(Math.max(0, phaseCount - 1), Math.floor(idx)));
      phaseRef.current = safe;
      tRef.current = 0;
      setPhaseIndex(safe);
      setT(0);
    },
    [phaseCount],
  );

  return { isPlaying, phaseIndex, t, positions, ballHolder, play, pause, stop, seek };
}
