/**
 * features/assessments/index.ts
 *
 * Public entry point for the Assessments → IDP slice.
 * Other slices may only import from this file.
 */

// ── Types ─────────────────────────────────────────────────────────────────
export type {
  AssessmentCategory,
  AssessmentScore,
  AssessmentGap,
  GapPriority,
  IDPFocusArea,
  IDPMilestone,
  FocusAreaStatus,
  SelfAssessmentInput,
  AssessmentSliceData,
} from "./types";

export { ALL_CATEGORIES, CATEGORY_META } from "./types";

// ── Hooks ─────────────────────────────────────────────────────────────────
export {
  useAssessmentData,
  useAssessmentGaps,
  useSelfAssessment,
  useCompleteMilestone,
} from "./hooks";

// ── Compute (exported for testing and cross-slice use) ────────────────────
export { computeGaps, recommendFocusAreas, applySelfAssessment } from "./mock";
