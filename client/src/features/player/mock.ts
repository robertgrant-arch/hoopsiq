// Mock data for the Athlete portal — assignments, schedule, availability.
// This extends the existing player data already spread across PlayerPages.tsx.

/* -------------------------------------------------------------------------- */
/* Assignments                                                                  */
/* -------------------------------------------------------------------------- */

export type AssignmentType =
  | "drill"
  | "film_review"
  | "quiz"
  | "conditioning"
  | "check_in"
  | "note"
  | "scout_team";

export type AssignmentStatus = "open" | "in_progress" | "submitted" | "graded";

export type PlayerAssignment = {
  id: string;
  type: AssignmentType;
  title: string;
  description: string;
  assignedBy: string;
  assignedByRole: "coach" | "expert";
  dueDate: string; // ISO date
  status: AssignmentStatus;
  priority: "normal" | "high";
  linkedClipId?: string;
  linkedDrillId?: string;
  completedAt?: string;
  coachFeedback?: string;
  xpReward: number;
};

export const mockPlayerAssignments: PlayerAssignment[] = [
  {
    id: "pa_1",
    type: "film_review",
    title: "Watch vs. Barnegat — defensive breakdowns",
    description: "Review your defensive rotations from minutes 14-28 of the second half. Pay attention to your positioning on the high ball screen coverage.",
    assignedBy: "Coach Grant",
    assignedByRole: "coach",
    dueDate: "2026-05-18",
    status: "open",
    priority: "high",
    linkedClipId: "clip_barn_def",
    xpReward: 150,
  },
  {
    id: "pa_2",
    type: "drill",
    title: "Mikan Drill — 5×10 sets",
    description: "Complete 5 sets of 10 Mikan drill reps. Record and upload your best set for coach review.",
    assignedBy: "Coach Grant",
    assignedByRole: "coach",
    dueDate: "2026-05-17",
    status: "in_progress",
    priority: "normal",
    xpReward: 100,
  },
  {
    id: "pa_3",
    type: "quiz",
    title: "Westbury Eagle — Plays Quiz",
    description: "Study the 4 Westbury base sets and complete the quiz. Minimum passing score: 80%.",
    assignedBy: "Coach Grant",
    assignedByRole: "coach",
    dueDate: "2026-05-20",
    status: "open",
    priority: "high",
    xpReward: 200,
  },
  {
    id: "pa_4",
    type: "conditioning",
    title: "Active Recovery + Stretch Protocol",
    description: "30-min yoga / mobility session from the 'Recovery' playlist. Log completion in the app.",
    assignedBy: "Coach Grant",
    assignedByRole: "coach",
    dueDate: "2026-05-16",
    status: "submitted",
    priority: "normal",
    completedAt: "2026-05-15T08:30:00Z",
    xpReward: 75,
  },
  {
    id: "pa_5",
    type: "film_review",
    title: "Study — Barnegat post entry breakdown",
    description: "Two possessions from the Barnegat game where post entries were contested. Coach has tagged timestamps.",
    assignedBy: "Coach Grant",
    assignedByRole: "coach",
    dueDate: "2026-05-14",
    status: "graded",
    priority: "normal",
    completedAt: "2026-05-13T19:00:00Z",
    coachFeedback: "Good effort reviewing. Make sure you recognize the stagger action — see timestamp 4:20 in your response.",
    xpReward: 150,
  },
  {
    id: "pa_6",
    type: "check_in",
    title: "Daily wellness check-in",
    description: "Log your fatigue, sleep, and soreness rating for today.",
    assignedBy: "Coach Grant",
    assignedByRole: "coach",
    dueDate: "2026-05-15",
    status: "submitted",
    priority: "normal",
    completedAt: "2026-05-15T07:15:00Z",
    xpReward: 25,
  },
  {
    id: "pa_7",
    type: "scout_team",
    title: "Scout Team — Run #5 Marcus Hill (Westbury)",
    description:
      "You are running Marcus Hill in Thursday's scout team practice. Study his tendencies below and simulate them at full speed. Focus on: initiating the PnR at the top of the key, attacking right with the pull-up mid-range on Ice coverage, and pushing pace immediately after any made basket. Watch the 3 clips attached to the Westbury scout report before practice.",
    assignedBy: "Coach Grant",
    assignedByRole: "coach",
    dueDate: "2026-05-21",
    status: "open",
    priority: "high",
    xpReward: 175,
  },
];

/* -------------------------------------------------------------------------- */
/* Team schedule (shared with parent portal)                                    */
/* -------------------------------------------------------------------------- */

export { mockScheduleEvents } from "../parent/mock";
export type { ScheduleEvent } from "../parent/mock";

/* -------------------------------------------------------------------------- */
/* Availability / RSVP                                                          */
/* -------------------------------------------------------------------------- */

export type AvailabilityEntry = {
  eventId: string;
  status: "available" | "unavailable" | "maybe";
  note?: string;
  submittedAt: string;
};

// Simulates already-submitted availability responses
export const mockAvailability: Record<string, AvailabilityEntry> = {
  evt_1: { eventId: "evt_1", status: "available", submittedAt: "2026-05-13T10:00:00Z" },
  evt_3: { eventId: "evt_3", status: "available", submittedAt: "2026-05-13T10:00:00Z" },
  evt_6: { eventId: "evt_6", status: "available", submittedAt: "2026-05-14T09:00:00Z" },
};
