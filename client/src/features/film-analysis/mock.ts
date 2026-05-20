/**
 * features/film-analysis/mock.ts
 *
 * Realistic structured mock AnalysisClips for the film analysis slice.
 *
 * These demonstrate what correct bounded analysis looks like:
 *   - Observations are specific and visual, not interpretive
 *   - Inferences have evidence lists, not prose paragraphs
 *   - suggestedCoachNote is short and templated
 *   - No fabricated statistics ("12-15% lower", "81% vs 47%")
 *   - requiresReview is set honestly on low-confidence events
 *
 * Scope of this mock: Tier 1 and Tier 2 events only (shot attempts, drives,
 * turnovers, closeouts, on-ball defense) — the reliable detection surface.
 */

import type {
  AnalysisClip,
  SessionAnalysisSummary,
} from "./types";
import { buildSuggestedNote, confidenceTier } from "./types";

const SESSION = "session_001";

// Helper to build a clean timestamp string from ms
function fmt(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export const MOCK_ANALYSIS_CLIPS: AnalysisClip[] = [

  // ── 1. Shot missed — contact layup (Tier 1, high confidence) ─────────────
  {
    id:                  "clip_001",
    sessionId:           SESSION,
    startMs:             134_000,
    endMs:               138_000,
    timestamp:           "2:14",
    primaryPlayerId:     "player_marcus",
    primaryPlayerName:   "Marcus Davis",
    primaryPlayerJersey: "3",
    teamSide:            "home",

    observations: [
      {
        type:                "player_movement",
        description:         "Player #3 receives pass at right elbow and accelerates toward baseline",
        startMs:             134_000,
        endMs:               135_500,
        courtZone:           "midrange_right",
        playerTrackId:       "track_mock_a",
        detectionConfidence: 0.94,
      },
      {
        type:                "shot_attempt",
        description:         "Player #3 extends ball overhead from ~4 feet — contact layup posture",
        startMs:             135_500,
        endMs:               136_000,
        frameMs:             135_700,
        courtZone:           "paint_right",
        playerTrackId:       "track_mock_a",
        detectionConfidence: 0.96,
      },
      {
        type:                "ball_trajectory",
        description:         "Ball releases off player's right hand on a flattened arc toward near side of backboard",
        startMs:             136_000,
        endMs:               136_800,
        courtZone:           "paint_right",
        detectionConfidence: 0.91,
      },
      {
        type:                "rim_contact",
        description:         "Ball contacts front-left edge of rim and deflects out of bounds",
        startMs:             136_800,
        endMs:               137_200,
        frameMs:             136_900,
        courtZone:           "paint_right",
        detectionConfidence: 0.98,
      },
    ],

    inference: {
      eventType:    "shot_missed_2",
      subLabel:     "contact layup attempt",
      confidence:   0.93,
      tier:         "high",
      requiresReview: false,
      evidenceItems: [
        {
          type:        "shot_attempt",
          description: "Overhead ball extension detected at 2:14.7 — consistent with layup release posture",
          frameMs:     135_700,
          strength:    "strong",
        },
        {
          type:        "trajectory_analysis",
          description: "Ball arc from release to rim contact measured — short arc suggests flat release or rushed finish",
          strength:    "strong",
        },
        {
          type:        "rim_contact",
          description: "Rim impact detected at front-left edge — consistent with ball hitting the near side rather than banking",
          frameMs:     136_900,
          strength:    "strong",
        },
        {
          type:        "player_velocity",
          description: "Player velocity at release: approximately 6 mph — full-speed contact situation",
          strength:    "moderate",
        },
      ],
      alternatives: [
        { eventType: "and_one_attempt", confidence: 0.19 },
      ],
    },

    suggestedCoachNote:  buildSuggestedNote("shot_missed_2", "Marcus Davis", "paint_right", "2:14"),
    linkedSkillCategory: "finishing",
    coachDecision:       null,
  },

  // ── 2. Turnover — live ball (Tier 1, high confidence) ────────────────────
  {
    id:                  "clip_002",
    sessionId:           SESSION,
    startMs:             278_000,
    endMs:               281_500,
    timestamp:           "4:38",
    primaryPlayerId:     "player_marcus",
    primaryPlayerName:   "Marcus Davis",
    primaryPlayerJersey: "3",
    teamSide:            "home",

    observations: [
      {
        type:                "player_movement",
        description:         "Player #3 drives left from top of key against pressure defense",
        startMs:             278_000,
        endMs:               279_200,
        courtZone:           "half_court",
        playerTrackId:       "track_mock_a",
        detectionConfidence: 0.89,
      },
      {
        type:                "player_proximity",
        description:         "Opponent player detected within 0.5m of ball-handler during drive — defensive contact likely",
        startMs:             279_200,
        endMs:               279_800,
        frameMs:             279_500,
        detectionConfidence: 0.86,
      },
      {
        type:                "ball_position",
        description:         "Ball detected separating from player #3 at 4:39.5 — loose ball situation",
        startMs:             279_800,
        endMs:               280_200,
        frameMs:             279_900,
        courtZone:           "half_court",
        detectionConfidence: 0.92,
      },
      {
        type:                "possession_change",
        description:         "Opponent jersey #14 picks up loose ball — possession changes to away team",
        startMs:             280_200,
        endMs:               281_500,
        courtZone:           "half_court",
        detectionConfidence: 0.88,
      },
    ],

    inference: {
      eventType:    "turnover_live_ball",
      subLabel:     "strip/knock-away in half-court drive",
      confidence:   0.88,
      tier:         "high",
      requiresReview: false,
      evidenceItems: [
        {
          type:        "possession_state",
          description: "Confirmed possession change: home to away in half-court",
          strength:    "strong",
        },
        {
          type:        "frame_observation",
          description: "Ball visible leaving player #3's control without a shot attempt",
          frameMs:     279_900,
          strength:    "strong",
        },
        {
          type:        "proximity_check",
          description: "Defensive player within contact range — strip attempt is the likely cause",
          frameMs:     279_500,
          strength:    "moderate",
        },
      ],
      alternatives: [
        { eventType: "pass_completed", confidence: 0.07 },
      ],
    },

    suggestedCoachNote:  buildSuggestedNote("turnover_live_ball", "Marcus Davis", "half_court", "4:38"),
    linkedSkillCategory: "ball_handling",
    coachDecision:       null,
  },

  // ── 3. Closeout — medium confidence, requires review ─────────────────────
  {
    id:                  "clip_003",
    sessionId:           SESSION,
    startMs:             421_000,
    endMs:               424_500,
    timestamp:           "7:01",
    primaryPlayerId:     "player_james",
    primaryPlayerName:   "James Carter",
    primaryPlayerJersey: "11",
    teamSide:            "home",

    observations: [
      {
        type:                "player_movement",
        description:         "Player #11 moves rapidly from paint area toward three-point arc left — closing distance to shooter",
        startMs:             421_000,
        endMs:               422_800,
        courtZone:           "arc_left",
        playerTrackId:       "track_mock_b",
        detectionConfidence: 0.85,
      },
      {
        type:                "player_proximity",
        description:         "Player #11 closes to within 1.2m of opponent player at arc left as pass is received",
        startMs:             422_800,
        endMs:               423_500,
        frameMs:             423_000,
        courtZone:           "arc_left",
        detectionConfidence: 0.78,
      },
    ],

    inference: {
      eventType:    "closeout",
      confidence:   0.72,
      tier:         "medium",
      requiresReview: true,    // ← 72% confidence: coach must confirm
      evidenceItems: [
        {
          type:        "player_velocity",
          description: "High-velocity movement from paint toward arc detected — direction consistent with closeout",
          strength:    "moderate",
        },
        {
          type:        "proximity_check",
          description: "Arrival within contested-shot range of ball receiver",
          frameMs:     423_000,
          strength:    "moderate",
        },
        {
          type:        "zone_entry",
          description: "Player trajectory: paint → arc left, timed with opponent catch — rotation pattern",
          strength:    "weak",
        },
      ],
      alternatives: [
        { eventType: "help_rotation", confidence: 0.61 },  // close alternative — review required
      ],
    },

    suggestedCoachNote:  buildSuggestedNote("closeout", "James Carter", "arc_left", "7:01"),
    linkedSkillCategory: "defensive_habits",
    coachDecision:       null,
  },

  // ── 4. 3PT make (Tier 1, high confidence) ────────────────────────────────
  {
    id:                  "clip_004",
    sessionId:           SESSION,
    startMs:             553_000,
    endMs:               557_000,
    timestamp:           "9:13",
    primaryPlayerId:     "player_james",
    primaryPlayerName:   "James Carter",
    primaryPlayerJersey: "11",
    teamSide:            "home",

    observations: [
      {
        type:                "player_movement",
        description:         "Player #11 comes off screen to arc right, receives pass in set position",
        startMs:             553_000,
        endMs:               554_200,
        courtZone:           "arc_right",
        playerTrackId:       "track_mock_b",
        detectionConfidence: 0.91,
      },
      {
        type:                "shot_attempt",
        description:         "Player #11 releases catch-and-shoot — feet set, upward trajectory",
        startMs:             554_200,
        endMs:               554_700,
        frameMs:             554_400,
        courtZone:           "arc_right",
        playerTrackId:       "track_mock_b",
        detectionConfidence: 0.95,
      },
      {
        type:                "ball_trajectory",
        description:         "High-arc ball flight from arc-right zone toward basket — deep trajectory consistent with 3PT attempt",
        startMs:             554_700,
        endMs:               556_000,
        detectionConfidence: 0.97,
      },
      {
        type:                "rim_contact",
        description:         "Ball enters net — clean through / swish detected. No rim impact detected.",
        startMs:             556_000,
        endMs:               556_500,
        frameMs:             556_100,
        courtZone:           "paint_center",
        detectionConfidence: 0.98,
      },
    ],

    inference: {
      eventType:    "shot_made_3",
      subLabel:     "catch-and-shoot off screen",
      confidence:   0.96,
      tier:         "high",
      requiresReview: false,
      evidenceItems: [
        {
          type:        "zone_entry",
          description: "Shot released from arc-right zone — beyond 3PT line based on calibration",
          frameMs:     554_400,
          strength:    "strong",
        },
        {
          type:        "trajectory_analysis",
          description: "Ball arc trajectory and distance consistent with 3PT make — clean rim entry detected",
          strength:    "strong",
        },
        {
          type:        "rim_contact",
          description: "Net-swish detected — no rim impact, confirming clean make",
          frameMs:     556_100,
          strength:    "strong",
        },
      ],
    },

    suggestedCoachNote:  buildSuggestedNote("shot_made_3", "James Carter", "arc_right", "9:13"),
    linkedSkillCategory: "shooting",
    coachDecision:       {
      status:      "confirmed",
      reviewedAt:  "2026-05-03T14:22:00Z",
      reviewedBy:  "user_coach_001",
    },
  },

  // ── 5. Drive right — coach edited (Tier 2, medium confidence) ────────────
  {
    id:                  "clip_005",
    sessionId:           SESSION,
    startMs:             692_000,
    endMs:               695_500,
    timestamp:           "11:32",
    primaryPlayerId:     "player_marcus",
    primaryPlayerName:   "Marcus Davis",
    primaryPlayerJersey: "3",
    teamSide:            "home",

    observations: [
      {
        type:                "player_movement",
        description:         "Player #3 attacks from arc center toward paint on right side — body angled right",
        startMs:             692_000,
        endMs:               693_800,
        courtZone:           "midrange_right",
        playerTrackId:       "track_mock_a",
        detectionConfidence: 0.87,
      },
      {
        type:                "shot_attempt",
        description:         "Player #3 elevates inside paint with ball above head",
        startMs:             693_800,
        endMs:               694_300,
        frameMs:             694_000,
        courtZone:           "paint_right",
        detectionConfidence: 0.83,
      },
      {
        type:                "rim_contact",
        description:         "Ball contacts left side of rim and drops through net",
        startMs:             695_000,
        endMs:               695_500,
        frameMs:             695_100,
        courtZone:           "paint_center",
        detectionConfidence: 0.94,
      },
    ],

    inference: {
      eventType:    "drive_right",
      subLabel:     "right-side drive to finish",
      confidence:   0.81,
      tier:         "medium",
      requiresReview: false,
      evidenceItems: [
        {
          type:        "player_velocity",
          description: "High-velocity lateral movement from arc to paint measured — attack drive",
          strength:    "strong",
        },
        {
          type:        "zone_entry",
          description: "Right-side body angle on approach toward paint",
          strength:    "moderate",
        },
        {
          type:        "rim_contact",
          description: "Ball enters net — this drive resulted in a made basket",
          frameMs:     695_100,
          strength:    "strong",
        },
      ],
    },

    suggestedCoachNote:  "Good finish at 11:32 — Marcus Davis in Paint (R)",
    linkedSkillCategory: "finishing",
    coachDecision:       {
      status:          "edited",
      editedEventType: "shot_made_2",   // Coach clarified: this was logged as drive, was actually a made layup
      note:            "This is a made floater, not a drive. Good body control through contact.",
      reviewedAt:      "2026-05-03T14:25:00Z",
      reviewedBy:      "user_coach_001",
    },
  },

  // ── 6. On-ball defense — flagged for teaching ─────────────────────────────
  {
    id:                  "clip_006",
    sessionId:           SESSION,
    startMs:             831_000,
    endMs:               834_500,
    timestamp:           "13:51",
    primaryPlayerId:     "player_marcus",
    primaryPlayerName:   "Marcus Davis",
    primaryPlayerJersey: "3",
    teamSide:            "home",

    observations: [
      {
        type:                "player_movement",
        description:         "Player #3 guarding opponent ball-handler at top of key — lateral movement tracking ball",
        startMs:             831_000,
        endMs:               832_500,
        courtZone:           "arc_center",
        playerTrackId:       "track_mock_a",
        detectionConfidence: 0.82,
      },
      {
        type:                "player_proximity",
        description:         "Player #3 and ball-handler within 0.6m — on-ball defensive position",
        startMs:             832_500,
        endMs:               834_000,
        courtZone:           "arc_center",
        detectionConfidence: 0.79,
      },
      {
        type:                "player_movement",
        description:         "Player #3 loses lateral position — opponent attacks baseline after hesitation dribble",
        startMs:             833_000,
        endMs:               834_500,
        courtZone:           "midrange_right",
        playerTrackId:       "track_mock_a",
        detectionConfidence: 0.76,
      },
    ],

    inference: {
      eventType:    "on_ball_defense",
      confidence:   0.77,
      tier:         "medium",
      requiresReview: false,
      evidenceItems: [
        {
          type:        "proximity_check",
          description: "Player maintained on-ball proximity through 13:51–13:52",
          strength:    "moderate",
        },
        {
          type:        "player_velocity",
          description: "Lateral movement velocity drops at 13:53 — opponent accelerates past",
          strength:    "moderate",
        },
        {
          type:        "zone_entry",
          description: "Opponent zone entry: arc-center to midrange-right — beat off dribble",
          strength:    "strong",
        },
      ],
    },

    suggestedCoachNote:  buildSuggestedNote("on_ball_defense", "Marcus Davis", "arc_center", "13:51"),
    linkedSkillCategory: "defensive_habits",
    coachDecision:       {
      status:     "flagged_for_teaching",
      note:       "Watch his feet at 13:52 — weight shifts back before opponent moves. Teaching point on stance.",
      reviewedAt: "2026-05-03T14:28:00Z",
      reviewedBy: "user_coach_001",
    },
  },
];

// ── Session summary ────────────────────────────────────────────────────────────

export const MOCK_SESSION_SUMMARY: SessionAnalysisSummary = {
  sessionId:        SESSION,
  totalClips:       6,
  pendingReview:    2,   // clip_001, clip_002 (no coachDecision)
  confirmed:        1,   // clip_004
  requiresAttention:1,   // clip_003 (requiresReview = true)
  byEventType: {
    shot_missed_2:    1,
    turnover_live_ball: 1,
    closeout:         1,
    shot_made_3:      1,
    drive_right:      1,
    on_ball_defense:  1,
  },
  byPlayer: {
    player_marcus: 4,
    player_james:  2,
  },
  analysisVersion: "mock-v1",
  processedAt:     "2026-05-03T02:47:00Z",
};
