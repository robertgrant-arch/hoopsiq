/**
 * features/workout-log/hooks.ts
 *
 * Data hooks for the Workout, Habits, and Progression Tracking slice.
 *
 * useWorkoutHistory()  — 30-day unified DayRecord array (API → mock fallback)
 * useStreakData()       — derived from history cache, no separate fetch
 * useSubmitCheckin()   — wires POST /api/readiness (already implemented server-side)
 * useSelfLog()         — local state for player self-logged work sessions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import type {
  DayRecord,
  StreakData,
  SelfLogEntry,
  SelfLogInput,
  ServerCheckinPayload,
} from "./types";
import {
  MOCK_30_DAY_HISTORY,
  MOCK_SELF_LOGS,
  computeStreakData,
} from "./mock";
import { nanoid } from "nanoid";

// ── Query keys ────────────────────────────────────────────────────────────

const KEYS = {
  history: ["workout-history"] as const,
};

// ── Workout history ───────────────────────────────────────────────────────

/**
 * Returns a unified 30-day DayRecord array.
 *
 * Currently falls back to MOCK_30_DAY_HISTORY.
 *
 * When wired:
 *   - GET /api/readiness/player/me     → check-in records
 *   - GET /api/wods/history?days=30    → WOD completion records
 *   Merge by date into DayRecord[].
 */
export function useWorkoutHistory(days = 30) {
  return useQuery<DayRecord[]>({
    queryKey: KEYS.history,
    queryFn: async () => {
      try {
        const [readiness] = await Promise.all([
          apiGet<any[]>(`/readiness/player/me?days=${days}`),
        ]);
        if (Array.isArray(readiness) && readiness.length > 0) {
          // TODO: merge readiness + WOD history into DayRecord[] when
          // GET /api/wods/history exists. For now return mock.
        }
        return MOCK_30_DAY_HISTORY;
      } catch {
        return MOCK_30_DAY_HISTORY;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Streak (derived) ──────────────────────────────────────────────────────

/** Derived from cached history — no network call. */
export function useStreakData(): StreakData {
  const { data: history = MOCK_30_DAY_HISTORY } = useWorkoutHistory();
  return computeStreakData(history);
}

// ── Check-in submission (wires the real server endpoint) ─────────────────

/**
 * Submits a daily readiness check-in to POST /api/readiness.
 *
 * Maps the form's 1–5 scale to the server's 1–10 scale:
 *   fatigue  = (6 - energy) * 2   (energy inverted)
 *   sleep    = sleep * 2
 *   soreness = soreness * 2
 *   mood     = (6 - stress) * 2   (stress inverted)
 *
 * On success: invalidates workout-history cache so streak updates.
 * On failure: falls back silently (optimistic update in page still shows submitted).
 */
export function useSubmitCheckin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      soreness:      1 | 2 | 3 | 4 | 5;
      sleep:         1 | 2 | 3 | 4 | 5;
      energy:        1 | 2 | 3 | 4 | 5;
      stress:        1 | 2 | 3 | 4 | 5;
      note?:         string;
    }) => {
      const payload: ServerCheckinPayload = {
        fatigue:  (6 - input.energy)  * 2,
        sleep:    input.sleep          * 2,
        soreness: input.soreness       * 2,
        mood:     (6 - input.stress)   * 2,
        note:     input.note,
      };
      try {
        await apiPost("/readiness", payload);
      } catch {
        // Graceful — optimistic submit state in page is not rolled back
      }
    },

    onSuccess: () => {
      // Stale the history so streak recalculates on next view
      qc.invalidateQueries({ queryKey: KEYS.history });
    },
  });
}

// ── Self-log (local state, no server endpoint yet) ────────────────────────

/**
 * Manages player-logged extra work sessions.
 *
 * State is in-memory for the session. When POST /api/player/self-log is
 * implemented, replace local state with a useMutation + cache invalidation.
 *
 * Returns:
 *  - selfLogs: all entries (mock + locally added)
 *  - addEntry: log a new self-work session
 *  - removeEntry: delete a local entry
 */
export function useSelfLog() {
  // Initialise from mock data; in production, seed from API
  const [localEntries, setLocalEntries] = useState<SelfLogEntry[]>(() => [...MOCK_SELF_LOGS]);

  const addEntry = useCallback((input: SelfLogInput) => {
    const today = new Date().toISOString().slice(0, 10);
    const entry: SelfLogEntry = {
      id:              `sl-local-${nanoid(6)}`,
      title:           input.title,
      category:        input.category,
      durationMinutes: input.durationMinutes,
      notes:           input.notes,
      loggedAt:        new Date().toISOString(),
      date:            today,
    };
    setLocalEntries((prev) => [entry, ...prev]);
    // TODO: apiPost("/player/self-log", input) when endpoint exists
    return entry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setLocalEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { selfLogs: localEntries, addEntry, removeEntry };
}
