// =============================================================================
// server/modules/film-analysis/pipeline/MockPipelineAdapter.ts
// In-memory mock implementation of VideoPipelineAdapter for local development
// and integration tests. Simulates a 2-minute end-to-end pipeline with all
// 10 stages progressing realistically over wall-clock time.
//
// NEVER use this in production. The registry in PipelineAdapter.ts gates this
// behind VIDEO_PIPELINE_PROVIDER=mock.
// =============================================================================

import type { VideoPipelineAdapter } from "./PipelineAdapter";
import type {
  PipelineJobInput,
  PipelineStatusResponse,
  PipelineResults,
  PipelineJobStatusToken,
  PipelineStage,
  SegmentStatus,
} from "../../../../shared/film-analysis/types";

const STAGE_ORDER: PipelineStage[] = [
  "METADATA_EXTRACTION",
  "CALIBRATION",
  "PLAYER_DETECTION",
  "IDENTITY_TRACKING",
  "ROSTER_MAPPING",
  "POSSESSION_SEGMENTATION",
  "EVENT_CLASSIFICATION",
  "STAT_VALIDATION",
  "CLIP_BOUNDARY_GEN",
  "CONFIDENCE_SCORING",
];

interface MockJob {
  input: PipelineJobInput;
  startedAt: number;
  simulatedDurationMs: number;
  cancelled: boolean;
}

// Module-scoped store. Acceptable for the mock adapter; real adapters never
// hold per-job state in process memory.
const jobs = new Map<string, MockJob>();

export class MockPipelineAdapter implements VideoPipelineAdapter {
  async submitJob(input: PipelineJobInput): Promise<{ externalJobId: string }> {
    const externalJobId = `mock_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    jobs.set(externalJobId, {
      input,
      startedAt: Date.now(),
      simulatedDurationMs: 120_000, // 2 minute simulated run
      cancelled: false,
    });
    return { externalJobId };
  }

  async pollStatus(externalJobId: string): Promise<PipelineStatusResponse> {
    const job = jobs.get(externalJobId);
    if (!job) {
      throw new Error(`[MockPipelineAdapter] Unknown job: ${externalJobId}`);
    }

    if (job.cancelled) {
      return {
        externalJobId,
        status: "CANCELLED" satisfies PipelineJobStatusToken,
        progressPct: 0,
        currentStage: null,
        stageStatuses: {},
        estimatedCompletionMs: null,
      };
    }

    const elapsed = Date.now() - job.startedAt;
    const pct = Math.min(100, (elapsed / job.simulatedDurationMs) * 100);
    const stageIndex = Math.min(
      STAGE_ORDER.length - 1,
      Math.floor((pct / 100) * STAGE_ORDER.length)
    );
    const status: PipelineJobStatusToken = pct >= 100 ? "COMPLETE" : "RUNNING";

    const stageStatuses: Partial<Record<PipelineStage, SegmentStatus>> = {};
    STAGE_ORDER.forEach((stage, i) => {
      if (status === "COMPLETE") {
        stageStatuses[stage] = "COMPLETE";
      } else if (i < stageIndex) {
        stageStatuses[stage] = "COMPLETE";
      } else if (i === stageIndex) {
        stageStatuses[stage] = "RUNNING";
      } else {
        stageStatuses[stage] = "PENDING";
      }
    });

    return {
      externalJobId,
      status,
      progressPct: Math.round(pct),
      currentStage: status === "COMPLETE" ? null : STAGE_ORDER[stageIndex],
      stageStatuses,
      estimatedCompletionMs:
        status === "COMPLETE" ? null : job.simulatedDurationMs - elapsed,
    };
  }

  async fetchResults(externalJobId: string): Promise<PipelineResults> {
    const job = jobs.get(externalJobId);
    if (!job) {
      throw new Error(`[MockPipelineAdapter] Unknown job: ${externalJobId}`);
    }

    // Structured detected events — bounded event types, player attribution,
    // confidence scores. These feed into the AnalysisClip layer which adds
    // observations and evidence. Real adapters call the provider's results API
    // and normalize into this shape. The service layer persists to normalized
    // DB tables (TrackedPlayer, RosterLink, DetectedEvent, etc.).
    return {
      trackedPlayers: [
        {
          filmSessionId:       job.input.filmSessionId,
          analysisJobId:       job.input.analysisJobId,
          trackingId:          "track_mock_a",
          jerseyNumber:        "3",
          teamSide:            "HOME",
          detectionConfidence: 0.97,
          appearanceFrames:    42_000,
          thumbnailPath:       null,
        },
        {
          filmSessionId:       job.input.filmSessionId,
          analysisJobId:       job.input.analysisJobId,
          trackingId:          "track_mock_b",
          jerseyNumber:        "11",
          teamSide:            "HOME",
          detectionConfidence: 0.92,
          appearanceFrames:    38_500,
          thumbnailPath:       null,
        },
      ],
      rosterLinks: [],
      detectedEvents: [
        // Tier 1: shot_missed_2 — high confidence (ball trajectory + rim contact detectable)
        {
          analysisJobId:    job.input.analysisJobId,
          sessionId:        job.input.filmSessionId,
          segmentId:        "seg_q1",
          type:             "miss_2",      // maps to DetectedEventType.Miss2
          tMs:              134_000,
          endMs:            138_000,
          primaryTrackId:   "track_mock_a",
          confidence:       0.93,
          needsReview:      false,
          courtZone:        "paint_right",
          // Structured evidence attached at this level — consumers promote to AnalysisClip
          evidence: [
            { type: "shot_attempt",       description: "Overhead ball extension at 134.7s", frameMs: 134_700, strength: "strong" },
            { type: "trajectory_analysis",description: "Flat arc — short of rim center",                     strength: "strong" },
            { type: "rim_contact",        description: "Front-left rim impact, deflects out", frameMs: 136_900, strength: "strong" },
          ],
        },
        // Tier 1: turnover — live ball (possession change detectable)
        {
          analysisJobId:    job.input.analysisJobId,
          sessionId:        job.input.filmSessionId,
          segmentId:        "seg_q1",
          type:             "turnover",    // maps to DetectedEventType.Turnover
          tMs:              278_000,
          endMs:            281_500,
          primaryTrackId:   "track_mock_a",
          confidence:       0.88,
          needsReview:      false,
          courtZone:        "half_court",
          evidence: [
            { type: "possession_state", description: "Confirmed HOME→AWAY possession change",                strength: "strong" },
            { type: "frame_observation",description: "Ball visible leaving player control without shot",     frameMs: 279_900, strength: "strong" },
            { type: "proximity_check",  description: "Defender within contact range — strip likely cause",   frameMs: 279_500, strength: "moderate" },
          ],
        },
        // Tier 2: closeout — medium confidence, requires review (player movement interpretation)
        {
          analysisJobId:    job.input.analysisJobId,
          sessionId:        job.input.filmSessionId,
          segmentId:        "seg_q1",
          type:             "closeout",    // custom type — maps to AnalysisClip.inference.eventType
          tMs:              421_000,
          endMs:            424_500,
          primaryTrackId:   "track_mock_b",
          confidence:       0.72,
          needsReview:      true,          // ← below 0.85 threshold AND close alternative
          courtZone:        "arc_left",
          evidence: [
            { type: "player_velocity",  description: "High-velocity movement: paint → arc left",            strength: "moderate" },
            { type: "proximity_check",  description: "Arrival within contested-shot range of ball receiver", frameMs: 423_000, strength: "moderate" },
          ],
        },
        // Tier 1: make_3 — high confidence
        {
          analysisJobId:    job.input.analysisJobId,
          sessionId:        job.input.filmSessionId,
          segmentId:        "seg_q2",
          type:             "make_3",      // maps to DetectedEventType.Make3
          tMs:              553_000,
          endMs:            557_000,
          primaryTrackId:   "track_mock_b",
          confidence:       0.96,
          needsReview:      false,
          courtZone:        "arc_right",
          evidence: [
            { type: "zone_entry",         description: "Release point beyond 3PT line (calibrated)",        frameMs: 554_400, strength: "strong" },
            { type: "trajectory_analysis",description: "Deep-arc flight consistent with 3PT make",                             strength: "strong" },
            { type: "rim_contact",        description: "Net-swish — no rim impact detected",                frameMs: 556_100, strength: "strong" },
          ],
        },
      ],
      issues: [
        {
          analysisJobId: job.input.analysisJobId,
          entityType:    null,
          entityId:      null,
          issueCode:     "LOW_LIGHT_PERIOD",
          severity:      "INFO",
          message:       "Brief low-light segment near tipoff. Detection confidence reduced for ~12 seconds.",
        },
        {
          analysisJobId: job.input.analysisJobId,
          entityType:    null,
          entityId:      null,
          issueCode:     "COMPLEX_EVENTS_SUPPRESSED",
          severity:      "INFO",
          message:       "Off-ball reads, weak-side scheme decisions, and multi-possession patterns are not classified. These require aggregate analysis beyond this pipeline's reliable detection surface.",
        },
      ],
    };
  }

  async cancelJob(externalJobId: string): Promise<void> {
    const job = jobs.get(externalJobId);
    if (job) job.cancelled = true;
  }
}
