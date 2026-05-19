/**
 * features/growth-story/index.ts
 * Public entry point for the Growth Story slice.
 */

export type {
  SkillWin,
  WorkingOnItem,
  WeeklyMomentum,
  GrowthStoryData,
} from "./types";

export { useGrowthStory } from "./hooks";
export { MOCK_GROWTH_STORY, MOCK_WINS, MOCK_WORKING_ON, MOCK_WEEKLY_MOMENTUM } from "./mock";
