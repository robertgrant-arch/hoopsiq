/**
 * features/workout-log/index.ts
 * Public entry point for the Workout, Habits, and Progression Tracking slice.
 */

export type {
  DayRecord,
  DayStatus,
  CheckInSummary,
  WodSummary,
  SelfLogEntry,
  SelfLogInput,
  SelfLogCategory,
  StreakData,
  ServerCheckinPayload,
} from "./types";

export { SELF_LOG_CATEGORY_META } from "./types";

export {
  useWorkoutHistory,
  useStreakData,
  useSubmitCheckin,
  useSelfLog,
} from "./hooks";

export {
  MOCK_30_DAY_HISTORY,
  MOCK_SELF_LOGS,
  computeStreakData,
  recentReadinessScores,
  totalXP,
  classifyDay,
} from "./mock";
