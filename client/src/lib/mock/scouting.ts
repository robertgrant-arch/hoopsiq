/**
 * Opponent Scouting domain model + mock data.
 *
 * Designed for high-school, AAU, and academy coaches. The model is
 * intentionally lightweight — no computer-vision extraction, no statistical
 * engine. Coaches enter tendencies manually; the system organises and
 * surfaces them at the right moment in the workflow.
 *
 * Production wiring:
 *   - Opponents stored in `opponents` table (org-scoped).
 *   - ScoutReport stored in `scout_reports` with JSONB for all arrays.
 *   - linkedEventId → events.id (game anchor).
 *   - linkedPracticePlanId → practice_plans.id.
 *   - linkedPlayIds → playbook plays tagged as "scout_team".
 *   - linkedClipIds → film_sessions clips.
 */

// ── Severity / threat scale ───────────────────────────────────────────────

export type ThreatLevel = 1 | 2 | 3 | 4 | 5;
export type Severity    = "low" | "medium" | "high" | "critical";

export type TendencyCategory =
  | "halfcourt_offense"
  | "transition_offense"
  | "special_situations"   // BLOB, SLOB, ATO, end-of-quarter
  | "halfcourt_defense"
  | "transition_defense"
  | "press"
  | "rebounding";

export const TENDENCY_CAT_LABEL: Record<TendencyCategory, string> = {
  halfcourt_offense:   "Half-Court Offense",
  transition_offense:  "Transition Offense",
  special_situations:  "Special Situations",
  halfcourt_defense:   "Half-Court Defense",
  transition_defense:  "Transition Defense",
  press:               "Press / Full-Court",
  rebounding:          "Rebounding",
};

export const SEVERITY_COLOR: Record<Severity, { text: string; bg: string; border: string }> = {
  low:      { text: "oklch(0.60 0.05 240)", bg: "oklch(0.60 0.05 240 / 0.08)", border: "oklch(0.60 0.05 240 / 0.2)" },
  medium:   { text: "oklch(0.65 0.17 75)",  bg: "oklch(0.72 0.17 75 / 0.08)",  border: "oklch(0.72 0.17 75 / 0.25)" },
  high:     { text: "oklch(0.65 0.18 35)",  bg: "oklch(0.68 0.20 35 / 0.1)",   border: "oklch(0.68 0.20 35 / 0.3)"  },
  critical: { text: "oklch(0.60 0.22 25)",  bg: "oklch(0.68 0.22 25 / 0.12)",  border: "oklch(0.68 0.22 25 / 0.35)" },
};

export type AssignmentTaskType =
  | "watch_film"
  | "prepare_clips"
  | "scout_team_prep"
  | "stat_breakdown"
  | "custom";

// ── Core types ─────────────────────────────────────────────────────────────

export interface ScoutTendency {
  id: string;
  category: TendencyCategory;
  title: string;
  description: string;
  severity: Severity;
  tags: string[];
  clipId?: string;
}

export interface ScoutKeyPlayer {
  id: string;
  name: string;
  jerseyNumber: string;
  position: "PG" | "SG" | "SF" | "PF" | "C" | "G" | "F";
  height?: string;
  threatLevel: ThreatLevel;
  strengths: string[];
  weaknesses: string[];
  goToMoves: string[];
  defensivePlan: string;
  defensiveAssignment?: string;
  clipId?: string;
  notes?: string;
}

export interface MatchupNote {
  id: string;
  ourPlayerName: string;
  theirPlayerName: string;
  theirJerseyNumber: string;
  coachNote: string;
  priority: "primary" | "secondary";
}

export interface ScoutAssignment {
  id: string;
  assigneeName: string;
  taskType: AssignmentTaskType;
  description: string;
  dueDate?: string;
  status: "open" | "in_progress" | "done";
}

export type ScoutReportStatus = "draft" | "final" | "archived";

export interface ScoutReport {
  id: string;
  opponentId: string;
  opponentName: string;
  gameDate?: string;
  linkedEventId?: string;
  status: ScoutReportStatus;

  gamePlanSummary: string;
  keysToWin: string[];

  offenseTendencies: ScoutTendency[];
  defenseTendencies: ScoutTendency[];

  keyPlayers: ScoutKeyPlayer[];
  matchupNotes: MatchupNote[];
  assignments: ScoutAssignment[];

  linkedClipIds: string[];
  linkedPracticePlanId?: string;
  linkedPlayIds: string[];

  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export type OpponentLevel = "varsity" | "jv" | "aau" | "academy" | "club";

export interface Opponent {
  id: string;
  name: string;
  abbreviation?: string;
  level: OpponentLevel;
  conference?: string;
  division?: string;
  coachName?: string;
  primaryColor?: string;          // OKLCH hue angle only — we construct full value
  record?: { wins: number; losses: number };
  linkedEventIds: string[];
  filmSessionIds: string[];
  notes?: string;
  scoutReportIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Colour helper ──────────────────────────────────────────────────────────
// Given a hue number, return the full OKLCH values for the team chip.
export function teamColor(hue: number) {
  return {
    text:   `oklch(0.35 0.18 ${hue})`,
    bg:     `oklch(0.94 0.06 ${hue})`,
    border: `oklch(0.80 0.12 ${hue})`,
    dot:    `oklch(0.55 0.20 ${hue})`,
  };
}

// ── Mock opponents ─────────────────────────────────────────────────────────

export const mockOpponents: Opponent[] = [
  {
    id: "opp_westbury",
    name: "Westbury Eagles",
    abbreviation: "WES",
    level: "varsity",
    conference: "Shore Conference",
    division: "A North",
    coachName: "Coach Sanders",
    primaryColor: "220",   // blue hue
    record: { wins: 14, losses: 5 },
    linkedEventIds: ["evt_game_westbury"],
    filmSessionIds: ["fs_westbury_1"],
    scoutReportIds: ["sr_westbury_1"],
    notes: "Annual rivalry game. Strong tradition, well-coached.",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z",
  },
  {
    id: "opp_barnegat",
    name: "Barnegat Bengals",
    abbreviation: "BAR",
    level: "varsity",
    conference: "Shore Conference",
    division: "A South",
    coachName: "Coach Ramos",
    primaryColor: "35",    // orange hue
    record: { wins: 11, losses: 8 },
    linkedEventIds: ["evt_game_barnegat"],
    filmSessionIds: ["fs_barnegat_1"],
    scoutReportIds: ["sr_barnegat_1"],
    notes: "Heavy zone team. Slow pace, grind-it-out style.",
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-05-08T09:00:00Z",
  },
  {
    id: "opp_neptune",
    name: "Neptune Trojans",
    abbreviation: "NEP",
    level: "varsity",
    conference: "Shore Conference",
    division: "B North",
    coachName: "Coach Davis",
    primaryColor: "150",   // green hue
    record: { wins: 9, losses: 10 },
    linkedEventIds: [],
    filmSessionIds: [],
    scoutReportIds: [],
    notes: "",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
  },
];

// ── Mock scout reports ─────────────────────────────────────────────────────

export const mockScoutReports: ScoutReport[] = [
  {
    id: "sr_westbury_1",
    opponentId: "opp_westbury",
    opponentName: "Westbury Eagles",
    gameDate: "2026-05-22",
    linkedEventId: "evt_game_westbury",
    status: "draft",

    gamePlanSummary:
      "Westbury is a well-disciplined team that runs their offense through their point guard (#5, Marcus Hill). They live in pick-and-roll coverage and shoot 38% from three on heavy volume. Defensively they play aggressive man-to-man with a lot of ball pressure — we will attack off the catch, not the dribble. We have a size advantage in the post that we need to exploit early to set the tone.",

    keysToWin: [
      "Limit #5 (Hill) to his left hand — he is a career 22% shooter going left",
      "Attack their aggressive on-ball pressure in transition — they give up easy run-outs",
      "Post early and often — they have no answer for our 4/5 in the low block",
      "Eliminate second-chance points — they are a top-5 offensive rebounding team",
      "Make them score in half-court — push pace and control tempo in the third",
    ],

    offenseTendencies: [
      {
        id: "ot_1",
        category: "halfcourt_offense",
        title: "Heavy pick-and-roll for #5",
        description:
          "Hill initiates nearly every possession with a ball-screen at the top of the key. He prefers the roll over the pop — their big (#44, Thomas) is an elite roller but a below-average shooter from outside 12 feet.",
        severity: "critical",
        tags: ["PnR", "#5 Hill", "#44 Thomas", "Primary Action"],
        clipId: "clip_1",
      },
      {
        id: "ot_2",
        category: "halfcourt_offense",
        title: "Stagger away off the ball for their shooters",
        description:
          "Off the ball, they run double staggers for #3 (Torres) and #23 (Webb) — both 38%+ three-point shooters. They time the stagger to Hill's drive — need a tag defender to take away the skip pass.",
        severity: "high",
        tags: ["Stagger", "Off-ball", "#3 Torres", "#23 Webb", "Three-point threat"],
      },
      {
        id: "ot_3",
        category: "transition_offense",
        title: "Push pace after made baskets",
        description:
          "They immediately push after any made basket, looking for the trailer three from #5 or the rim run from #44. They score 18+ transition points per game — we must sprint back.",
        severity: "high",
        tags: ["Transition", "Push pace", "Trailer 3"],
      },
      {
        id: "ot_4",
        category: "special_situations",
        title: "SLOB — Box screen into back cut",
        description:
          "Their most reliable SLOB play. #3 sets a cross screen, #5 follows with a back cut. We have seen this run 6+ times per game — do not give the back-cut baseline.",
        severity: "medium",
        tags: ["SLOB", "Box set", "Back cut", "Special"],
      },
      {
        id: "ot_5",
        category: "halfcourt_offense",
        title: "Dribble hand-off series from the elbow",
        description:
          "Secondary action — they run DHO at the elbow for their wings to create pull-up mid-range. Usually a counter when the PnR is covered.",
        severity: "medium",
        tags: ["DHO", "Elbow action", "Midrange"],
      },
    ],

    defenseTendencies: [
      {
        id: "dt_1",
        category: "halfcourt_defense",
        title: "Aggressive ball pressure — traps in corners",
        description:
          "They deny the first pass aggressively. If the ball gets to the corner they will pinch and trap. Attack before the trap sets or skip to the weak side.",
        severity: "high",
        tags: ["Ball pressure", "Corner trap", "Denial"],
      },
      {
        id: "dt_2",
        category: "halfcourt_defense",
        title: "Ice coverage on all ball screens",
        description:
          "Their base coverage is Ice — they push the ball handler toward the baseline and the big drops to protect the paint. Attack the mid-range the Ice gives up — their bigs are not good mid-range closeout defenders.",
        severity: "critical",
        tags: ["Ice", "Ball screen coverage", "Exploit mid-range"],
      },
      {
        id: "dt_3",
        category: "transition_defense",
        title: "Slow to get back — give up corner 3s",
        description:
          "When they turn the ball over, #44 and #33 are slow retreating. They consistently give up corner threes in transition. Look for Williams/Davis in the corner on fast breaks.",
        severity: "high",
        tags: ["Transition D", "Corner 3", "Exploit"],
      },
      {
        id: "dt_4",
        category: "rebounding",
        title: "Guards don't box out — crash the glass",
        description:
          "Their guards (especially #5 and #23) do not block out — they gamble for steals. Send our guards to the offensive glass; they will find room.",
        severity: "medium",
        tags: ["Offensive rebounding", "Guards crash", "Second chance"],
      },
    ],

    keyPlayers: [
      {
        id: "kp_1",
        name: "Marcus Hill",
        jerseyNumber: "5",
        position: "PG",
        height: "6'1\"",
        threatLevel: 5,
        strengths: ["Elite pick-and-roll operator", "High basketball IQ", "Good pull-up mid", "True floor general"],
        weaknesses: ["Goes left only 22% of the time", "Turnover prone vs. pressure", "Poor free throw shooter (58%)"],
        goToMoves: ["PnR top-of-key", "Curl into mid-range", "DHO at elbow"],
        defensivePlan: "Force left consistently. No middle drives. Ball pressure — make him think, not react. Trail on all catches.",
        defensiveAssignment: "Marcus Johnson",
        notes: "Their entire offense runs through him. Fatigue him early with full-court ball pressure in Q1.",
      },
      {
        id: "kp_2",
        name: "Darius Thomas",
        jerseyNumber: "44",
        position: "C",
        height: "6'7\"",
        threatLevel: 4,
        strengths: ["Exceptional roller", "Elite offensive rebounder", "Strong finisher in traffic"],
        weaknesses: ["No perimeter shooting", "Foul trouble magnet", "Slow laterally"],
        goToMoves: ["Rim run off PnR roll", "Drop step in post", "Slip screen"],
        defensivePlan: "Keep him off the glass — physical box out every trip. Do not let him slip screens. Invite the mid-range.",
        defensiveAssignment: "Jordan Davis",
      },
      {
        id: "kp_3",
        name: "Javier Torres",
        jerseyNumber: "3",
        position: "SG",
        height: "6'3\"",
        threatLevel: 3,
        strengths: ["38% three-point shooter", "Great off-ball mover", "High-IQ cutter"],
        weaknesses: ["Limited off-the-dribble creation", "Weak left hand", "Shrinks in big moments"],
        goToMoves: ["Curl off stagger", "Relocate to corner", "Backdoor cut"],
        defensivePlan: "Never lose him off ball. Deny the catch on stagger reads. Contest every three — he is a spot-up threat only.",
        defensiveAssignment: "DeShawn Williams",
      },
    ],

    matchupNotes: [
      {
        id: "mn_1",
        ourPlayerName: "Marcus Johnson",
        theirPlayerName: "Marcus Hill",
        theirJerseyNumber: "5",
        coachNote: "Force left — no middle. Apply ball pressure from tip-off. You have the length and quickness to make his night difficult. Do not let him set the pace.",
        priority: "primary",
      },
      {
        id: "mn_2",
        ourPlayerName: "Jordan Davis",
        theirPlayerName: "Darius Thomas",
        theirJerseyNumber: "44",
        coachNote: "Physical box-out every single possession. He is their engine on the glass. Make him earn everything in the post. Invite the 15-footer.",
        priority: "primary",
      },
      {
        id: "mn_3",
        ourPlayerName: "DeShawn Williams",
        theirPlayerName: "Javier Torres",
        theirJerseyNumber: "3",
        coachNote: "Never lose him off ball. Communicate stagger reads with the big. Contest every catch — he has little off-dribble game.",
        priority: "secondary",
      },
    ],

    assignments: [
      {
        id: "sa_1",
        assigneeName: "Coach Martinez",
        taskType: "watch_film",
        description: "Review all 4 Westbury games from the past 3 weeks. Log every possession they score off the PnR. Timestamp and export to shared folder.",
        dueDate: "2026-05-19",
        status: "in_progress",
      },
      {
        id: "sa_2",
        assigneeName: "Coach Thompson",
        taskType: "prepare_clips",
        description: "Cut a 12-clip package: 6 clips of Hill PnR, 3 clips of stagger action, 3 clips of their SLOB. Upload to Film Room playlist 'Westbury Scout'.",
        dueDate: "2026-05-20",
        status: "open",
      },
      {
        id: "sa_3",
        assigneeName: "Player: Trey Evans",
        taskType: "scout_team_prep",
        description: "Run #5 in scout team. Learn Hill's tendencies — how he sets up the PnR, his hesitation move, and when he attacks right vs left.",
        dueDate: "2026-05-21",
        status: "open",
      },
      {
        id: "sa_4",
        assigneeName: "Coach Williams",
        taskType: "stat_breakdown",
        description: "Pull Westbury's last 5 game box scores. Identify their pace, shot distribution (paint vs. mid vs. 3), and points-off-turnovers. Drop into scout packet.",
        dueDate: "2026-05-18",
        status: "done",
      },
    ],

    linkedClipIds: ["clip_1", "clip_2", "clip_3"],
    linkedPracticePlanId: "plan_1",
    linkedPlayIds: ["play_1", "play_3"],

    authorName: "Coach Williams",
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-05-14T16:30:00Z",
  },

  {
    id: "sr_barnegat_1",
    opponentId: "opp_barnegat",
    opponentName: "Barnegat Bengals",
    gameDate: "2026-05-08",
    status: "final",

    gamePlanSummary:
      "Barnegat is a physical, disciplined zone team. Their 2-3 zone stifles transition and controls pace. We must be patient, move the ball quickly around the perimeter, attack the gaps, and hit the seams. We won 58-49 — pace control was the key.",

    keysToWin: [
      "Attack zone gaps with skip passes — they are slow to rotate",
      "Crash the offensive glass — zone rebounding has natural gaps",
      "No heat-check threes — make them guard us in the half-court",
    ],

    offenseTendencies: [
      {
        id: "ot_b1",
        category: "halfcourt_offense",
        title: "Zone-based half-court control",
        description: "They never push pace. Everything is half-court. Their best play is a flare screen for #10 in the corner.",
        severity: "medium",
        tags: ["Zone", "Slow pace", "Flare screen"],
      },
    ],

    defenseTendencies: [
      {
        id: "dt_b1",
        category: "halfcourt_defense",
        title: "2-3 zone with extended guard pressure",
        description: "Their guards extend to the three-point line to take away the catch. The middle of the zone is soft — attack the high post.",
        severity: "high",
        tags: ["2-3 zone", "Extended pressure", "Attack middle"],
      },
    ],

    keyPlayers: [
      {
        id: "kp_b1",
        name: "Dontae Lewis",
        jerseyNumber: "10",
        position: "SF",
        height: "6'4\"",
        threatLevel: 4,
        strengths: ["Versatile scorer", "Good rebounder", "Physical defender"],
        weaknesses: ["Off the dribble average", "Below-average FT shooter"],
        goToMoves: ["Flare screen catch-and-shoot", "Post-up baseline"],
        defensivePlan: "Contest every catch. Do not give him a clean look from the corner.",
      },
    ],

    matchupNotes: [],
    assignments: [],
    linkedClipIds: [],
    linkedPlayIds: [],

    authorName: "Coach Williams",
    createdAt: "2026-04-30T10:00:00Z",
    updatedAt: "2026-05-08T20:00:00Z",
  },
];

// ── Upcoming games (derived from events) ──────────────────────────────────

export interface UpcomingGame {
  eventId: string;
  opponentId: string;
  opponentName: string;
  gameDate: string;         // "2026-05-22"
  homeAway: "home" | "away" | "neutral";
  location?: string;
  scoutReportId?: string;
  scoutReportStatus?: ScoutReportStatus;
}

export const mockUpcomingGames: UpcomingGame[] = [
  {
    eventId: "evt_game_westbury",
    opponentId: "opp_westbury",
    opponentName: "Westbury Eagles",
    gameDate: "2026-05-22",
    homeAway: "away",
    location: "Westbury High School",
    scoutReportId: "sr_westbury_1",
    scoutReportStatus: "draft",
  },
];

// ── Task type display ──────────────────────────────────────────────────────

export function statusMeta(s: ScoutReportStatus) {
  if (s === "final")    return { label: "Final",    color: "oklch(0.60 0.15 145)", bg: "oklch(0.75 0.18 150 / 0.1)", border: "oklch(0.75 0.18 150 / 0.3)" };
  if (s === "archived") return { label: "Archived", color: "oklch(0.55 0.04 240)", bg: "oklch(0.55 0.04 240 / 0.08)", border: "oklch(0.55 0.04 240 / 0.2)" };
  return { label: "Draft", color: "oklch(0.65 0.18 290)", bg: "oklch(0.65 0.18 290 / 0.1)", border: "oklch(0.65 0.18 290 / 0.3)" };
}

export const TASK_TYPE_LABEL: Record<AssignmentTaskType, string> = {
  watch_film:       "Watch film",
  prepare_clips:    "Prepare clips",
  scout_team_prep:  "Scout team prep",
  stat_breakdown:   "Stat breakdown",
  custom:           "Custom task",
};

// ── Scout team plays ───────────────────────────────────────────────────────

export type ScoutPlayCategory = "blob" | "slob" | "ato" | "halfcourt" | "transition";

export const SCOUT_PLAY_CAT_LABEL: Record<ScoutPlayCategory, string> = {
  blob:       "BLOB",
  slob:       "SLOB",
  ato:        "ATO",
  halfcourt:  "Half-Court Set",
  transition: "Transition",
};

export interface ScoutPlay {
  id: string;
  name: string;
  formation: string;
  category: ScoutPlayCategory;
  description: string;
  /** Why we run this — what opponent tendency it simulates. */
  simulatesNote: string;
  linkedPlayId?: string;          // v3 playbook play id
  opponentId: string;
}

export const mockScoutPlays: ScoutPlay[] = [
  {
    id: "sp_1",
    name: "Westbury PnR — Hill Action",
    formation: "5-out",
    category: "halfcourt",
    description: "Scout team runs the Hill PnR at the top-of-key with a roll from the 4. Defender on 1 practices Ice, big practices drop coverage and mid-range closeout.",
    simulatesNote: "Simulates #5 Hill's primary PnR action — critical to get reps in Ice coverage",
    linkedPlayId: "play_1",
    opponentId: "opp_westbury",
  },
  {
    id: "sp_2",
    name: "Westbury Stagger — Torres",
    formation: "4-out 1-in",
    category: "halfcourt",
    description: "Scout team runs double stagger for the 2 man (simulating Torres) off the ball. Defense practices tagging the skip and contesting the catch.",
    simulatesNote: "Simulates stagger action for #3 Torres — their second-best scoring option",
    opponentId: "opp_westbury",
  },
  {
    id: "sp_3",
    name: "Westbury SLOB Box — Back Cut",
    formation: "Box",
    category: "slob",
    description: "Scout team runs Westbury's box SLOB: cross screen followed by a back cut for the point guard. Defense must communicate and deny the back-cut baseline.",
    simulatesNote: "Their most reliable SLOB — runs 6+ times per game per film",
    opponentId: "opp_westbury",
  },
  {
    id: "sp_4",
    name: "Westbury Fast Break Push",
    formation: "5-out",
    category: "transition",
    description: "After any dead ball or make, scout team immediately pushes, looking for the trailer 3 from #5 and the rim run from #44. Defense must sprint back and stop the trailer.",
    simulatesNote: "They push hard after made baskets — 18+ transition pts/game",
    opponentId: "opp_westbury",
  },
];

// ── Opponent game history ─────────────────────────────────────────────────

export interface OpponentGameResult {
  id: string;
  opponentId: string;
  date: string;
  homeAway: "home" | "away" | "neutral";
  ourScore: number;
  theirScore: number;
  result: "W" | "L";
  notes?: string;
  filmSessionId?: string;
  scoutReportId?: string;
}

export const mockOpponentHistory: OpponentGameResult[] = [
  {
    id: "hist_w1",
    opponentId: "opp_westbury",
    date: "2026-01-15",
    homeAway: "home",
    ourScore: 62,
    theirScore: 58,
    result: "W",
    notes: "Won on a late free throw run. Hill had 22 but went 3-for-12 in the second half after we switched to face-guarding.",
    filmSessionId: "fs_westbury_1",
    scoutReportId: undefined,
  },
  {
    id: "hist_w2",
    opponentId: "opp_westbury",
    date: "2025-12-04",
    homeAway: "away",
    ourScore: 47,
    theirScore: 55,
    result: "L",
    notes: "Lost by 8 — gave up 14 transition points and 12 offensive rebounds. Thomas dominated the glass.",
    filmSessionId: undefined,
    scoutReportId: undefined,
  },
  {
    id: "hist_w3",
    opponentId: "opp_westbury",
    date: "2025-02-10",
    homeAway: "neutral",
    ourScore: 71,
    theirScore: 60,
    result: "W",
    notes: "Playoff win. Best defensive performance of the year vs them — held Hill to 11 points.",
  },
  {
    id: "hist_b1",
    opponentId: "opp_barnegat",
    date: "2026-05-08",
    homeAway: "away",
    ourScore: 58,
    theirScore: 49,
    result: "W",
    notes: "Zone attack worked well. Skipped into the gaps consistently. Lewis held to 12 pts.",
    filmSessionId: "fs_barnegat_1",
  },
  {
    id: "hist_b2",
    opponentId: "opp_barnegat",
    date: "2026-01-22",
    homeAway: "home",
    ourScore: 44,
    theirScore: 51,
    result: "L",
    notes: "Got stuck in their zone — took too many contested threes early. Need to be more patient.",
  },
];

// ── Generated practice blocks ─────────────────────────────────────────────

export type PracticeBlockFocus =
  | "ball_screen_defense"
  | "transition_stop"
  | "post_defense"
  | "perimeter_closeout"
  | "offensive_rebounding"
  | "zone_attack"
  | "press_break"
  | "special_situations"
  | "scout_team_reps"
  | "film_review";

export const PRACTICE_BLOCK_FOCUS_LABEL: Record<PracticeBlockFocus, string> = {
  ball_screen_defense:  "Ball-Screen Defense",
  transition_stop:      "Transition Stop",
  post_defense:         "Post Defense",
  perimeter_closeout:   "Perimeter Closeout",
  offensive_rebounding: "Offensive Rebounding",
  zone_attack:          "Zone Attack",
  press_break:          "Press Break",
  special_situations:   "Special Situations",
  scout_team_reps:      "Scout Team Reps",
  film_review:          "Film Review",
};

export interface GeneratedPracticeBlock {
  id: string;
  /** Which tendency drove this recommendation */
  sourceTendencyId: string;
  sourceTendencyTitle: string;
  sourceSide: "offense" | "defense";
  focus: PracticeBlockFocus;
  title: string;
  drill: string;
  rationale: string;
  suggestedMinutes: number;
  intensity: "low" | "medium" | "high";
  priority: number; // 1 = highest
  /** If true, add to practice plan is suggested */
  linkedPracticeAvailable: boolean;
}

/**
 * Map tendency severity to priority (critical → 1, high → 2, medium → 3, low → 4).
 */
function severityPriority(s: Severity): number {
  return { critical: 1, high: 2, medium: 3, low: 4 }[s] ?? 4;
}

/** Derive recommended defensive coverage drills from a scout report's tendencies. */
export function generatePracticeEmphasis(report: ScoutReport): GeneratedPracticeBlock[] {
  const blocks: GeneratedPracticeBlock[] = [];
  let idx = 0;

  const allTendencies = [
    ...report.offenseTendencies.map((t) => ({ ...t, side: "offense" as const })),
    ...report.defenseTendencies.map((t) => ({ ...t, side: "defense" as const })),
  ].sort((a, b) => severityPriority(a.severity) - severityPriority(b.severity));

  for (const t of allTendencies) {
    const base = {
      id: `pb_${++idx}`,
      sourceTendencyId: t.id,
      sourceTendencyTitle: t.title,
      sourceSide: t.side,
      priority: severityPriority(t.severity),
      linkedPracticeAvailable: true,
    };

    // Offense tendencies → defensive drill recommendations
    if (t.side === "offense") {
      if (t.category === "halfcourt_offense" && t.tags.some((g) => g.toLowerCase().includes("pnr") || g.toLowerCase().includes("pick"))) {
        blocks.push({
          ...base,
          focus: "ball_screen_defense",
          title: "Ice/Drop Ball-Screen Coverage",
          drill: "2-man Ice drill → 3v3 PnR shell → live 5-on-5 with PnR emphasis",
          rationale: `Opponent runs heavy PnR. "${t.title}" — defenders must master Ice and drop reads before game day.`,
          suggestedMinutes: 18,
          intensity: "high",
        });
      } else if (t.category === "transition_offense") {
        blocks.push({
          ...base,
          focus: "transition_stop",
          title: "Transition Sprint-Back + Stop Drill",
          drill: "Continuous 3v2 sprint drill → 5-on-0 transition stop shell",
          rationale: `"${t.title}" — they push pace and create easy run-outs. Defensive transition sprint-back must be automatic.`,
          suggestedMinutes: 12,
          intensity: "high",
        });
      } else if (t.category === "special_situations") {
        blocks.push({
          ...base,
          focus: "special_situations",
          title: "BLOB/SLOB Coverage Reps",
          drill: "Walk-through → live SLOB/BLOB coverage reps vs. scout team",
          rationale: `"${t.title}" — they run reliable OB sets. Reps at full speed before game day.`,
          suggestedMinutes: 10,
          intensity: "medium",
        });
      } else if (t.category === "halfcourt_offense") {
        blocks.push({
          ...base,
          focus: "perimeter_closeout",
          title: "Perimeter Closeout + Contest",
          drill: "Closeout 1-on-1 shell → 4-on-4 close-and-contest",
          rationale: `"${t.title}" — they generate three-point looks off off-ball movement. Closeout discipline is key.`,
          suggestedMinutes: 12,
          intensity: "medium",
        });
      } else if (t.category === "rebounding") {
        blocks.push({
          ...base,
          focus: "offensive_rebounding",
          title: "Offensive Crash + Box-Out Read",
          drill: "Box-out shell drill → live crash reads off shot attempts",
          rationale: `"${t.title}" — second-chance opportunities available when their guards don't box out.`,
          suggestedMinutes: 8,
          intensity: "medium",
        });
      }
    }

    // Defense tendencies → offensive exploitation drills
    if (t.side === "defense") {
      if (t.tags.some((g) => g.toLowerCase().includes("ice") || g.toLowerCase().includes("ball screen coverage"))) {
        blocks.push({
          ...base,
          focus: "ball_screen_defense",
          title: "Mid-Range Pull-Up Attack vs. Ice",
          drill: "PnR ball-handler mid-range pull-up drill → live 2-on-2 vs. Ice",
          rationale: `"${t.title}" — Ice gives up the mid-range. Our PG/wings must be ready to punish this gap.`,
          suggestedMinutes: 15,
          intensity: "high",
        });
      } else if (t.category === "transition_defense") {
        blocks.push({
          ...base,
          focus: "transition_stop",
          title: "Corner 3 Transition Spacings",
          drill: "3-man weave into corner-3 transition read → 5-on-0 spacing walkthrough",
          rationale: `"${t.title}" — they give up corner threes in transition. Spacing reads must be automatic.`,
          suggestedMinutes: 10,
          intensity: "medium",
        });
      } else if (t.category === "halfcourt_defense") {
        blocks.push({
          ...base,
          focus: "zone_attack",
          title: "Zone Gap Attack",
          drill: "5-on-0 zone skip drill → 5-on-5 vs. scout-team zone",
          rationale: `"${t.title}" — their coverage has a gap to exploit. Drill the skip pass and high-post attack.`,
          suggestedMinutes: 12,
          intensity: "medium",
        });
      } else if (t.category === "rebounding") {
        blocks.push({
          ...base,
          focus: "offensive_rebounding",
          title: "Guard Crash Off Miss",
          drill: "Live rebounding drill — guards crash weak-side on every shot",
          rationale: `"${t.title}" — their guards don't box out. Send our guards to the glass every trip.`,
          suggestedMinutes: 8,
          intensity: "medium",
        });
      }
    }
  }

  // Always add scout-team reps and film review if the report has key players
  if (report.keyPlayers.length > 0) {
    blocks.push({
      id: `pb_${++idx}`,
      sourceTendencyId: "scout_team",
      sourceTendencyTitle: "Scout team simulation",
      sourceSide: "offense",
      focus: "scout_team_reps",
      title: "Scout Team Live Reps",
      drill: "Scout team runs opponent's top 3 actions at full speed — defense responds",
      rationale: `With ${report.keyPlayers.length} key players identified, scout team reps make game-day reads automatic.`,
      suggestedMinutes: 20,
      intensity: "high",
      priority: 1,
      linkedPracticeAvailable: true,
    });
  }

  if (report.linkedClipIds.length > 0 || report.keysToWin.length > 0) {
    blocks.push({
      id: `pb_${++idx}`,
      sourceTendencyId: "film_review",
      sourceTendencyTitle: "Film review session",
      sourceSide: "defense",
      focus: "film_review",
      title: "Pre-Game Film Session",
      drill: "30-min team film: top clips of opponent's tendencies + keys to the game walk-through",
      rationale: "Mental preparation — make sure every player can identify the opponent's primary actions before tip-off.",
      suggestedMinutes: 30,
      intensity: "low",
      priority: 2,
      linkedPracticeAvailable: true,
    });
  }

  return blocks.slice(0, 8); // cap at 8 blocks
}

// ── Scout-team player roles ────────────────────────────────────────────────

export interface ScoutTeamRole {
  id: string;
  opponentId: string;
  opponentName: string;
  scoutReportId: string;
  playerId: string;
  playerName: string;
  /** Opponent player they simulate */
  simOpponentPlayer: string;
  simOpponentJersey: string;
  simOpponentPosition: string;
  tendenciesToSimulate: string[];
  practiceDate: string; // ISO
  notes?: string;
}

export const SCOUT_TEAM_ROLES: ScoutTeamRole[] = [
  {
    id: "str_1",
    opponentId: "opp_westbury",
    opponentName: "Westbury Eagles",
    scoutReportId: "sr_westbury_1",
    playerId: "a_5",
    playerName: "Isaiah Moore",
    simOpponentPlayer: "Marcus Hill",
    simOpponentJersey: "5",
    simOpponentPosition: "PG",
    tendenciesToSimulate: [
      "Initiate every possession with top-of-key PnR",
      "Attack right — pull up mid-range on Ice coverage",
      "Push pace immediately after any made basket",
      "DHO at the elbow as secondary action",
    ],
    practiceDate: "2026-05-21",
    notes: "Study Hill's film from last 3 games. Mirror his hesitation move and when he goes left vs. right.",
  },
  {
    id: "str_2",
    opponentId: "opp_westbury",
    opponentName: "Westbury Eagles",
    scoutReportId: "sr_westbury_1",
    playerId: "a_3",
    playerName: "DeAndre Johnson",
    simOpponentPlayer: "Javier Torres",
    simOpponentJersey: "3",
    simOpponentPosition: "SG",
    tendenciesToSimulate: [
      "Run double stagger reads off the ball",
      "Curl into the corner for catch-and-shoot threes",
      "Back-door cut on stagger when defender jumps",
    ],
    practiceDate: "2026-05-21",
    notes: "Torres is dangerous off the stagger. Run the action at full speed — defense needs live reads.",
  },
];

export function getScoutTeamRolesForPlayer(playerId: string): ScoutTeamRole[] {
  return SCOUT_TEAM_ROLES.filter((r) => r.playerId === playerId);
}

// ── AI tendency suggestions (simulated from film analysis) ────────────────

export interface AITendencySuggestion {
  id: string;
  side: "offense" | "defense";
  category: TendencyCategory;
  title: string;
  description: string;
  severity: Severity;
  tags: string[];
  confidence: number;             // 0–1
  sourceSummary: string;          // e.g. "Film analysis · 3 of 4 games"
  opponentId: string;
}

export const mockAISuggestions: AITendencySuggestion[] = [
  {
    id: "ai_1",
    side: "offense",
    opponentId: "opp_westbury",
    category: "halfcourt_offense",
    title: "High PnR frequency — 38% of possessions",
    description: "AI detected pick-and-roll actions initiated by #5 in 38% of all half-court possessions across 3 games. 71% of PnR actions involve #44 as the roller.",
    severity: "critical",
    tags: ["PnR", "#5 Hill", "#44 Thomas", "AI detected"],
    confidence: 0.91,
    sourceSummary: "Film analysis · 3 of 3 games · 47 possessions",
  },
  {
    id: "ai_2",
    side: "offense",
    opponentId: "opp_westbury",
    category: "transition_offense",
    title: "Pushes pace after 83% of made baskets",
    description: "AI detected that after a made basket, Westbury initiated a transition push within 3 seconds on 83% of possessions. Trailer 3 from the PG attempted in 41% of those pushes.",
    severity: "high",
    tags: ["Transition", "Made basket", "Trailer 3", "AI detected"],
    confidence: 0.87,
    sourceSummary: "Film analysis · 3 of 3 games · 62 transition possessions",
  },
  {
    id: "ai_3",
    side: "defense",
    opponentId: "opp_westbury",
    category: "halfcourt_defense",
    title: "Ice ball-screen coverage — 94% of ball screens",
    description: "AI identified Ice as their near-universal ball-screen coverage. The guard consistently pushes handlers baseline. Gap: mid-range pull-up between 12–16 feet is consistently open.",
    severity: "critical",
    tags: ["Ice", "Ball screen", "Mid-range gap", "AI detected"],
    confidence: 0.94,
    sourceSummary: "Film analysis · 3 of 3 games · 89 ball-screen possessions",
  },
  {
    id: "ai_4",
    side: "defense",
    opponentId: "opp_westbury",
    category: "rebounding",
    title: "Guards average 0.3 defensive rebounds per game",
    description: "AI tracked that Westbury's guards do not box out — they average 0.3 defensive rebounds per game combined. Offensive rebound opportunities available for our guards on every missed shot.",
    severity: "medium",
    tags: ["Rebounding", "Guard crash", "Opportunity", "AI detected"],
    confidence: 0.78,
    sourceSummary: "Film analysis · 3 of 3 games · box-score correlation",
  },
];
