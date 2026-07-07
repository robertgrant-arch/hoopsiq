/**
 * Film Room v2 — demo-mode data. Served by the hooks when IS_DEMO (no real
 * auth). Times are relative to "now" so the demo always looks live.
 */

import type {
  AttentionCounts, AssignmentDetail, Clip, FilmSummary, QueueRow, RosterPlayer,
} from "./types";

const now = () => Date.now();
const daysAgo = (d: number) => new Date(now() - d * 86_400_000).toISOString();
const daysAhead = (d: number) => new Date(now() + d * 86_400_000).toISOString();

export const MOCK_ROSTER: RosterPlayer[] = [
  { id: "p_moore",   name: "Isaiah Moore",   position: "PF", jersey: "23" },
  { id: "p_hayes",   name: "Devin Hayes",    position: "SG", jersey: "5" },
  { id: "p_jenkins", name: "Khalil Jenkins", position: "SG", jersey: "11" },
  { id: "p_davis",   name: "Marcus Davis",   position: "PG", jersey: "1" },
  { id: "p_brown",   name: "Tyler Brown",    position: "SF", jersey: "34" },
  { id: "p_reed",    name: "Nathan Reed",    position: "C",  jersey: "44" },
];

export const MOCK_FILMS: FilmSummary[] = [
  {
    id: "f_oakhill", title: "vs Oak Hill Academy", kind: "game", status: "ready",
    opponent: "Oak Hill Academy", playedAt: daysAgo(2), durationSeconds: 6442,
    playbackId: null, clipCount: 6, sentCount: 9, unwatchedCount: 3, overdueCount: 1,
  },
  {
    id: "f_practice", title: "Tuesday practice — shell drill", kind: "practice", status: "ready",
    opponent: null, playedAt: daysAgo(1), durationSeconds: 3120,
    playbackId: null, clipCount: 2, sentCount: 2, unwatchedCount: 1, overdueCount: 0,
  },
  {
    id: "f_lakewood", title: "vs Lakewood", kind: "game", status: "ready",
    opponent: "Lakewood", playedAt: daysAgo(6), durationSeconds: 6120,
    playbackId: null, clipCount: 0, sentCount: 0, unwatchedCount: 0, overdueCount: 0,
  },
  {
    id: "f_skills", title: "Guard group — closeout reps", kind: "skill_rep", status: "processing",
    opponent: null, playedAt: daysAgo(0), durationSeconds: null,
    playbackId: null, clipCount: 0, sentCount: 0, unwatchedCount: 0, overdueCount: 0,
  },
];

export const MOCK_CLIPS: Record<string, Clip[]> = {
  f_oakhill: [
    {
      id: "c1", sessionId: "f_oakhill", source: "coach", status: "assigned",
      startMs: 1_418_000, endMs: 1_432_500, title: "Late closeout — weak side",
      note: "Watch your feet on the closeout — you're flat. Short choppy steps, high hand.",
      noteSource: "coach", categories: ["defense", "closeout"], priority: "high",
      lockedAt: daysAgo(1), playerIds: ["p_moore"], createdAt: daysAgo(1),
    },
    {
      id: "c2", sessionId: "f_oakhill", source: "coach", status: "assigned",
      startMs: 2_052_000, endMs: 2_061_000, title: "Spacing on the lift",
      note: "Great lift to the slot here — this is exactly the spacing we drew up.",
      noteSource: "coach", categories: ["offense", "spacing"], priority: "normal",
      lockedAt: daysAgo(1), playerIds: ["p_hayes", "p_davis"], createdAt: daysAgo(1),
    },
    {
      id: "c3", sessionId: "f_oakhill", source: "coach", status: "approved",
      startMs: 3_125_000, endMs: 3_140_000, title: "Transition floor balance",
      note: "Two on the rim, nobody back. Who's the safety here?",
      noteSource: "coach", categories: ["transition"], priority: "normal",
      lockedAt: null, playerIds: ["p_brown", "p_reed"], createdAt: daysAgo(1),
    },
    {
      id: "c4", sessionId: "f_oakhill", source: "ai_accepted", status: "draft",
      startMs: 4_410_000, endMs: 4_422_000, title: "Clip @ 73:30",
      note: "", noteSource: "coach", categories: [], priority: "normal",
      lockedAt: null, playerIds: [], createdAt: daysAgo(0),
    },
  ],
  f_practice: [
    {
      id: "c6", sessionId: "f_practice", source: "coach", status: "assigned",
      startMs: 610_000, endMs: 640_000, title: "Shell drill — help rotation",
      note: "This is the rotation speed we need every rep.",
      noteSource: "coach", categories: ["defense"], priority: "normal",
      lockedAt: daysAgo(0), playerIds: ["p_jenkins"], createdAt: daysAgo(0),
    },
  ],
  f_lakewood: [],
  f_skills: [],
};

export const MOCK_ATTENTION: AttentionCounts = {
  readyToClip: 1, readyToSend: 1, awaitingPlayers: 4, overdue: 1,
};

export const MOCK_QUEUE: QueueRow[] = [
  {
    id: "ap1", status: "watched", overdue: true,
    player: { id: "p_moore", name: "Isaiah Moore", position: "PF" },
    clip: { id: "c1", title: "Late closeout — weak side", startMs: 1_418_000, endMs: 1_432_500,
      categories: ["defense", "closeout"], priority: "high", sessionId: "f_oakhill" },
    sessionTitle: "vs Oak Hill Academy", assignedBy: "coach",
    dueAt: daysAgo(1), requireResponse: true, responsePrompt: "What do you see?",
    sentAt: daysAgo(2), openedAt: daysAgo(1), watchedAt: daysAgo(1), watchPct: 94,
    respondedAt: null, completedAt: null, reviewRequested: false, nudgeCount: 1,
  },
  {
    id: "ap2", status: "responded", overdue: false,
    player: { id: "p_hayes", name: "Devin Hayes", position: "SG" },
    clip: { id: "c2", title: "Spacing on the lift", startMs: 2_052_000, endMs: 2_061_000,
      categories: ["offense", "spacing"], priority: "normal", sessionId: "f_oakhill" },
    sessionTitle: "vs Oak Hill Academy", assignedBy: "coach",
    dueAt: daysAhead(1), requireResponse: true, responsePrompt: "What do you see?",
    sentAt: daysAgo(2), openedAt: daysAgo(1), watchedAt: daysAgo(1), watchPct: 100,
    respondedAt: daysAgo(0), completedAt: null, reviewRequested: false, nudgeCount: 0,
  },
  {
    id: "ap3", status: "assigned", overdue: false,
    player: { id: "p_davis", name: "Marcus Davis", position: "PG" },
    clip: { id: "c2", title: "Spacing on the lift", startMs: 2_052_000, endMs: 2_061_000,
      categories: ["offense", "spacing"], priority: "normal", sessionId: "f_oakhill" },
    sessionTitle: "vs Oak Hill Academy", assignedBy: "coach",
    dueAt: daysAhead(1), requireResponse: true, responsePrompt: null,
    sentAt: daysAgo(2), openedAt: null, watchedAt: null, watchPct: 0,
    respondedAt: null, completedAt: null, reviewRequested: false, nudgeCount: 0,
  },
  {
    id: "ap4", status: "opened", overdue: false,
    player: { id: "p_jenkins", name: "Khalil Jenkins", position: "SG" },
    clip: { id: "c6", title: "Shell drill — help rotation", startMs: 610_000, endMs: 640_000,
      categories: ["defense"], priority: "normal", sessionId: "f_practice" },
    sessionTitle: "Tuesday practice — shell drill", assignedBy: "coach",
    dueAt: daysAhead(2), requireResponse: false, responsePrompt: null,
    sentAt: daysAgo(0), openedAt: daysAgo(0), watchedAt: null, watchPct: 40,
    respondedAt: null, completedAt: null, reviewRequested: true, nudgeCount: 0,
  },
  {
    id: "ap5", status: "completed", overdue: false,
    player: { id: "p_brown", name: "Tyler Brown", position: "SF" },
    clip: { id: "c_old", title: "Baseline drift 3", startMs: 100_000, endMs: 111_000,
      categories: ["offense"], priority: "normal", sessionId: "f_lakewood" },
    sessionTitle: "vs Lakewood", assignedBy: "coach",
    dueAt: daysAgo(3), requireResponse: true, responsePrompt: "What do you see?",
    sentAt: daysAgo(5), openedAt: daysAgo(4), watchedAt: daysAgo(4), watchPct: 100,
    respondedAt: daysAgo(4), completedAt: daysAgo(3), reviewRequested: false, nudgeCount: 0,
  },
];

export function mockAssignmentDetail(id: string): AssignmentDetail | null {
  const row = MOCK_QUEUE.find((r) => r.id === id);
  if (!row) return null;
  const clip = Object.values(MOCK_CLIPS).flat().find((c) => c.id === row.clip.id) ?? {
    ...row.clip,
    sessionId: row.clip.sessionId,
    source: "coach" as const,
    status: "assigned" as const,
    note: "Watch the first action.",
    noteSource: "coach" as const,
    lockedAt: null,
    playerIds: [row.player.id],
    createdAt: row.sentAt ?? new Date().toISOString(),
  };
  return {
    ...row,
    clip,
    session: { id: row.clip.sessionId, title: row.sessionTitle, kind: "game" },
    reviews: row.respondedAt
      ? [{ id: "r1", kind: "text", textBody: "I stopped moving my feet and reached. Next rep I'll stay low and chop.", confidence: null, createdAt: row.respondedAt }]
      : [],
    followups: row.nudgeCount
      ? [{ id: "fu1", kind: "nudge", body: null, meta: {}, authorUserId: "coach", createdAt: row.sentAt ?? new Date().toISOString() }]
      : [],
    events: [
      { id: 1, actorKind: "coach", action: "sent", detail: {}, createdAt: row.sentAt ?? new Date().toISOString() },
      ...(row.openedAt ? [{ id: 2, actorKind: "player", action: "opened", detail: {}, createdAt: row.openedAt }] : []),
      ...(row.watchedAt ? [{ id: 3, actorKind: "player", action: "watched", detail: { pct: row.watchPct }, createdAt: row.watchedAt }] : []),
      ...(row.respondedAt ? [{ id: 4, actorKind: "player", action: "responded", detail: {}, createdAt: row.respondedAt }] : []),
    ],
  };
}
