/**
 * features/player-development/types.ts
 *
 * Hub-local types for the Player Development Hub / Today experience.
 * These are the canonical types for this slice; other slices that need
 * to reference IDP data should import from this slice's index.ts.
 */

export type LinkedClip = {
  title: string;
  href:  string;
};

export type FocusAreaStatus = "active" | "paused" | "completed";

/** A single IDP focus area, decorated with today's drill context. */
export type FocusArea = {
  id:            string;
  priority:      number;           // 1 = top, drives sort order
  category:      string;           // "Finishing", "Shooting", etc.
  subSkill:      string;           // "Contact Layup", "Off Dribble", etc.
  emoji:         string;
  currentScore:  number;           // 1–10
  targetScore:   number;           // 1–10, must be > currentScore
  progressPct:   number;           // 0–100 milestone progress
  deadline:      string;           // "Jun 15"
  status:        FocusAreaStatus;
  coachNote:     string;
  coachInitials: string;
  todayDrill:    string | null;    // drill description, null if none due today
  dueToday:      boolean;
  linkedClip:    LinkedClip | null;
};

export type FeedbackType = "film_note" | "monthly_review" | "observation" | "milestone";

/** A coach feedback entry — film note, monthly review, or observation. */
export type CoachFeedback = {
  id:            string;
  date:          string;           // "May 5"
  coachName:     string;
  coachInitials: string;
  type:          FeedbackType;
  text:          string;
  linkedClip:    LinkedClip | null;
};

/** Season-level progress metrics. */
export type SeasonStats = {
  week:            number;
  totalWeeks:      number;
  seasonLabel:     string;         // "2024–25"
  streakDays:      number;
  completedDrills: number;
  totalDrills:     number;
};

export type CoachActionType =
  | "assign_clip"
  | "recommend_drill"
  | "add_to_idp"
  | "add_to_wod"
  | "request_reupload";

export type CoachActionStatus = "open" | "in_progress" | "resolved";

/** A coaching action assigned to this player by a coach. */
export type CoachAction = {
  id:             string;
  actionType:     CoachActionType;
  status:         CoachActionStatus;
  issueCategory?: string;
  coachNote?:     string;
  sessionTitle?:  string;
  timestamp?:     string;          // "1:23"
  createdAt:      string;          // ISO date or "YYYY-MM-DD"
};

/**
 * The full data payload for the Player Development Hub.
 * Returned by GET /api/player/hub when that endpoint exists.
 * Until then, MOCK_HUB_DATA in mock.ts provides this shape.
 */
export type PlayerHubData = {
  player: {
    firstName: string;
    name:      string;
    position:  string;
    team:      string;
    gradYear:  number;
  };
  focusAreas:      FocusArea[];      // sorted by priority asc
  recentFeedback:  CoachFeedback[];  // sorted by date desc
  season:          SeasonStats;
  coachActions:    CoachAction[];
  checkedInToday:  boolean;
};
