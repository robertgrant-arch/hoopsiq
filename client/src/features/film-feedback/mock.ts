/**
 * features/film-feedback/mock.ts
 *
 * Mock FilmRepPlan data for the Film Feedback → Rep Plan slice.
 *
 * These represent coaching_action rows that have been normalized on the client.
 * They are used while GET /api/coaching-actions/player/me is not yet returning
 * sufficient film context (session title, formatted timestamps).
 *
 * When the real endpoint is wired, replace this with the normalized output
 * of normalizeCoachingActions() below.
 */

import type { FilmRepPlan } from "./types";

export const MOCK_FILM_REP_PLANS: FilmRepPlan[] = [
  // 1. Drill prescription — in progress (player has started working on it)
  {
    id:          "ca-film-001",
    actionType:  "recommend_drill",
    status:      "in_progress",
    film: {
      sessionId:    "sess-barn-001",
      sessionTitle: "Barnegat vs. Toms River — Game Film",
      timestamp:    "1:23",
      clipHref:     "/app/film/inbox",
    },
    skillCategory: "Finishing",
    coachNote:
      "You're fading away instead of driving through the contact. The Mikan drill is the fix — do it daily until you feel the body control change. I want to see a re-upload in 48h.",
    drill: {
      title: "Mikan Drill",
      reps:  "5 sets of 10 · Daily",
    },
    createdAt: "2026-05-12T10:00:00Z",
  },

  // 2. Clip assignment — open (player hasn't started yet)
  {
    id:          "ca-film-002",
    actionType:  "assign_clip",
    status:      "assigned",
    film: {
      sessionId:    "sess-review-002",
      sessionTitle: "Pull-Up Jumper Review Session",
      timestamp:    "0:37",
      clipHref:     "/app/film/inbox",
    },
    skillCategory: "Release",
    coachNote:
      "Watch your thumb flick at the release point. You're getting backspin off your pinky instead of your index finger. This is the habit we need to break. Watch the clip 3× and tell me what you see.",
    drill: null,
    createdAt: "2026-05-10T09:00:00Z",
  },

  // 3. Re-upload request — open (player needs to record corrective rep)
  {
    id:          "ca-film-003",
    actionType:  "request_reupload",
    status:      "assigned",
    film: {
      sessionId:    "sess-barn-001",
      sessionTitle: "Barnegat vs. Toms River — Game Film",
      timestamp:    "0:47",
      clipHref:     "/app/film/inbox",
    },
    skillCategory: "Finishing",
    coachNote:
      "Record this contact layup again — drive through the contact instead of fading. Submit within 48h so we can compare side by side with this clip.",
    drill: null,
    createdAt: "2026-05-08T14:00:00Z",
  },

  // 4. Drill prescription — completed (player done, awaiting coach review)
  {
    id:          "ca-film-004",
    actionType:  "recommend_drill",
    status:      "completed",
    film: {
      sessionId:    "sess-def-003",
      sessionTitle: "Defensive Positioning — Practice Review",
      timestamp:    "3:15",
      clipHref:     "/app/film/inbox",
    },
    skillCategory: "Defensive Habits",
    coachNote:
      "Your closeout footwork is breaking down. Balance Board Jumpers will build the base you need. Do these before every practice session.",
    drill: {
      title: "Balance Board Jumpers",
      reps:  "3 sets of 8 · Pre-practice",
    },
    createdAt: "2026-05-01T11:00:00Z",
  },

  // 5. Drill prescription — coach reviewed (loop fully closed)
  {
    id:          "ca-film-005",
    actionType:  "recommend_drill",
    status:      "coach_reviewed",
    film: {
      sessionId:    "sess-lbi-004",
      sessionTitle: "DHO Read vs. LBI",
      timestamp:    "2:13",
      clipHref:     "/app/film/inbox",
    },
    skillCategory: "Ball Handling",
    coachNote:
      "Great DHO read. Pull-up off DHO drills are paying off. Keep building on this — 50 reps each side per session. This is exactly the instinct we're developing.",
    drill: {
      title: "Pull-Up off DHO",
      reps:  "50 reps each side",
    },
    createdAt: "2026-04-28T09:00:00Z",
  },
];

// ── Utility: normalize a raw coaching_action from the server ─────────────────
//
// Used by useFilmRepPlans() to convert server responses into FilmRepPlan shape.
// sessionTitle lookup is best-effort; falls back to "Film Session".

import type { CoachingAction } from "@shared/db/schema/coaching_actions";
import {
  mapServerStatus,
  parseDrillFromNote,
  formatTimestampMs,
  type FilmActionType,
} from "./types";

const COVERED_ACTION_TYPES: FilmActionType[] = [
  "recommend_drill",
  "assign_clip",
  "request_reupload",
];

export function isCoveredActionType(t: string): t is FilmActionType {
  return COVERED_ACTION_TYPES.includes(t as FilmActionType);
}

export function normalizeCoachingAction(
  action: CoachingAction,
  sessionTitle?: string,
): FilmRepPlan {
  const drill =
    action.actionType === "recommend_drill" && action.coachNote
      ? parseDrillFromNote(action.coachNote)
      : null;

  return {
    id:          action.id,
    actionType:  action.actionType as FilmActionType,
    status:      mapServerStatus(action.status, (action as any).resolvedNote),
    film: {
      sessionId:    action.sessionId,
      sessionTitle: sessionTitle ?? "Film Session",
      timestamp:    formatTimestampMs(action.timestampMs),
      clipHref:     "/app/film/inbox",   // TODO: deep-link once player clip viewer exists
    },
    skillCategory: action.issueCategory ?? "General",
    coachNote:     action.coachNote ?? "",
    drill,
    createdAt:     action.createdAt.toISOString(),
  };
}
