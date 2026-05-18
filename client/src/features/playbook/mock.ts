/**
 * Playbook Studio mock data layer.
 *
 * Maps to the production schema in Prompt 3:
 *   model Playbook   { id, teamId, title, plays[] }
 *   model Play       { id, playbookId, title, description, phases[] }
 *   model PlayPhase  { id, playId, order, diagram }
 *   model PlayDiagram{ id, phaseId, data: Json }       (canvas data)
 *   model PlayQuiz   { id, playbookId, title, questions[] }
 *   model QuizQuestion { id, quizId, question, options, correctIdx }
 *
 * Coordinate space is the half-court Konva stage we draw the play on.
 * Stage size: 800 × 600. Top of stage = baseline / rim end. Bottom = half-court line.
 */

// Re-export the canonical domain types from the zod schema so we have ONE
// source of truth. Older imports of `@/lib/mock/playbook` keep working.
export type {
  CourtType,
  TokenType,
  PathType,
  PhaseLabel,
  TeamSide,
  PlayCategory,
  PlayToken,
  PlayPath,
  PlayPhase,
  Play,
  PlayVersion,
} from "./schema";

import type {
  Play,
  PlayPath,
  PlayPhase,
  PlayToken,
} from "./schema";

export type PlayMeta = Omit<Play, "phases">;

export type Playbook = {
  id: string;
  teamId: string;
  title: string;
  description: string;
  plays: PlayMeta[];
  quizzes: PlayQuizMeta[];
  updatedAt: string;
};

/* -------------------------------------------------------------------------- */
/* Formation library                                                           */
/* -------------------------------------------------------------------------- */

export type Formation = {
  id: string;
  name: string;
  description: string;
  tokens: PlayToken[];
};

const ball = (x: number, y: number): PlayToken => ({ id: "b", type: "BALL", label: "", x, y });
const off = (i: number, x: number, y: number): PlayToken => ({
  id: `o${i}`,
  type: "OFFENSE",
  label: String(i),
  x,
  y,
});

export const formations: Formation[] = [
  {
    id: "fmt_horns",
    name: "Horns",
    description: "Bigs at elbows, ball-handler at top, wings in corners.",
    tokens: [
      off(1, 400, 510),
      off(2, 120, 410),
      off(3, 680, 410),
      off(4, 320, 240),
      off(5, 480, 240),
      ball(400, 510),
    ],
  },
  {
    id: "fmt_5out",
    name: "5-Out (Spread)",
    description: "Five-out spacing. All five players above the arc.",
    tokens: [
      off(1, 400, 510),
      off(2, 120, 420),
      off(3, 680, 420),
      off(4, 200, 250),
      off(5, 600, 250),
      ball(400, 510),
    ],
  },
  {
    id: "fmt_4out_1in",
    name: "4-Out 1-In",
    description: "Four perimeter players, one big at short corner.",
    tokens: [
      off(1, 400, 510),
      off(2, 120, 420),
      off(3, 680, 420),
      off(4, 240, 260),
      off(5, 560, 140),
      ball(400, 510),
    ],
  },
  {
    id: "fmt_box",
    name: "Box (BLOB)",
    description: "Box set for baseline out-of-bounds.",
    tokens: [
      off(1, 270, 230),
      off(2, 530, 230),
      off(3, 270, 130),
      off(4, 530, 130),
      off(5, 400, 60),
      ball(400, 60),
    ],
  },
  {
    id: "fmt_1_3_1",
    name: "1-3-1 vs Zone",
    description: "1-3-1 alignment to attack 2-3 zones.",
    tokens: [
      off(1, 400, 510),
      off(2, 180, 360),
      off(3, 620, 360),
      off(4, 400, 280),
      off(5, 400, 130),
      ball(400, 510),
    ],
  },
];

export function clonePhaseFromFormation(formationId: string): { tokens: PlayToken[]; paths: PlayPath[] } {
  const f = formations.find((x) => x.id === formationId) ?? formations[0];
  return { tokens: JSON.parse(JSON.stringify(f.tokens)), paths: [] };
}

/* -------------------------------------------------------------------------- */
/* Authored plays                                                              */
/* -------------------------------------------------------------------------- */

const horsFlex: Play = {
  id: "play_horns_flex",
  playbookId: "pb_varsity",
  title: "Horns Flex",
  description: "Primary set out of horns. Flex cut for layup, stagger away as counter.",
  courtType: "HALF",
  category: "PRIMARY",
  tags: ["horns", "primary", "5-out finish"],
  createdAt: "2026-04-10T00:00:00Z",
  updatedAt: "2026-04-29T00:00:00Z",
  versionLabel: "v1.4 — added counter (DHO)",
  phases: [
    {
      id: "ph_1",
      order: 0,
      phase: "ENTRY",
      notes: "1 brings ball up. 4 and 5 step up to elbows. 2 and 3 spread to deep corners.",
      tokens: [
        off(1, 400, 510),
        off(2, 120, 410),
        off(3, 680, 410),
        off(4, 320, 240),
        off(5, 480, 240),
        ball(400, 510),
      ],
      paths: [],
    },
    {
      id: "ph_2",
      order: 1,
      phase: "TRIGGER",
      notes: "1 passes to 4 at the elbow. 1 cuts hard off 5 (flex screen). Look for layup.",
      tokens: [
        off(1, 400, 510),
        off(2, 120, 410),
        off(3, 680, 410),
        off(4, 320, 240),
        off(5, 480, 240),
        ball(320, 240),
      ],
      paths: [
        { id: "pp_1", type: "PASS", points: [400, 510, 360, 380, 320, 240], startTokenId: "o1", endTokenId: "o4" },
        { id: "pp_2", type: "CUT", points: [400, 510, 480, 380, 580, 250], startTokenId: "o1" },
        { id: "pp_3", type: "SCREEN", points: [480, 240, 540, 280] },
      ],
    },
    {
      id: "ph_3",
      order: 2,
      phase: "READ_1",
      notes: "If 1 is open at the rim — bounce pass for layup. 5 seals after the screen.",
      tokens: [
        off(1, 580, 250),
        off(2, 120, 410),
        off(3, 680, 410),
        off(4, 320, 240),
        off(5, 540, 280),
        ball(320, 240),
      ],
      paths: [{ id: "pp_4", type: "PASS", points: [320, 240, 460, 220, 580, 250], startTokenId: "o4", endTokenId: "o1" }],
    },
    {
      id: "ph_4",
      order: 3,
      phase: "READ_2",
      notes: "If 1 is denied, 5 down-screens for 2. Skip to 2 for catch-and-shoot.",
      tokens: [
        off(1, 580, 250),
        off(2, 280, 380),
        off(3, 680, 410),
        off(4, 320, 240),
        off(5, 220, 410),
        ball(320, 240),
      ],
      paths: [
        { id: "pp_5", type: "SCREEN", points: [480, 240, 220, 410] },
        { id: "pp_6", type: "CUT", points: [120, 410, 280, 380] },
        { id: "pp_7", type: "PASS", points: [320, 240, 320, 320, 280, 380], startTokenId: "o4", endTokenId: "o2" },
      ],
    },
    {
      id: "ph_5",
      order: 4,
      phase: "COUNTER",
      notes: "If 2 is denied — DHO with 4. 4 hands ball to 2 for downhill drive.",
      tokens: [
        off(1, 580, 250),
        off(2, 360, 280),
        off(3, 680, 410),
        off(4, 320, 240),
        off(5, 220, 410),
        ball(360, 280),
      ],
      paths: [{ id: "pp_8", type: "HANDOFF", points: [320, 240, 360, 280], startTokenId: "o4", endTokenId: "o2" }],
    },
  ],
};

const motionStrong: Play = {
  id: "play_motion_strong",
  playbookId: "pb_varsity",
  title: "5-Out Motion Strong",
  description: "Pass-cut-fill rules with strong-side back-cut emphasis.",
  courtType: "HALF",
  category: "MOTION",
  tags: ["5-out", "motion"],
  createdAt: "2026-04-12T00:00:00Z",
  updatedAt: "2026-04-25T00:00:00Z",
  versionLabel: "v1.1",
  phases: [
    {
      id: "ph_m1",
      order: 0,
      phase: "ENTRY",
      notes: "5-out spacing. 1 has the ball at the top.",
      tokens: [
        off(1, 400, 510),
        off(2, 120, 420),
        off(3, 680, 420),
        off(4, 200, 250),
        off(5, 600, 250),
        ball(400, 510),
      ],
      paths: [],
    },
    {
      id: "ph_m2",
      order: 1,
      phase: "TRIGGER",
      notes: "1 passes to 3 (wing). 1 cuts to opposite block. 4 fills the top.",
      tokens: [
        off(1, 400, 130),
        off(2, 120, 420),
        off(3, 680, 420),
        off(4, 400, 510),
        off(5, 600, 250),
        ball(680, 420),
      ],
      paths: [
        { id: "pm_1", type: "PASS", points: [400, 510, 540, 470, 680, 420], startTokenId: "o1", endTokenId: "o3" },
        { id: "pm_2", type: "CUT", points: [400, 510, 400, 320, 400, 130], startTokenId: "o1" },
        { id: "pm_3", type: "CUT", points: [200, 250, 400, 510], startTokenId: "o4" },
      ],
    },
    {
      id: "ph_m3",
      order: 2,
      phase: "READ_1",
      notes: "3 reverses to 4 at the top. 5 back-cuts as 4 looks his way.",
      tokens: [
        off(1, 400, 130),
        off(2, 120, 420),
        off(3, 680, 420),
        off(4, 400, 510),
        off(5, 480, 130),
        ball(400, 510),
      ],
      paths: [
        { id: "pm_4", type: "PASS", points: [680, 420, 540, 470, 400, 510], startTokenId: "o3", endTokenId: "o4" },
        { id: "pm_5", type: "CUT", points: [600, 250, 540, 190, 480, 130], startTokenId: "o5" },
      ],
    },
    {
      id: "ph_m4",
      order: 3,
      phase: "READ_2",
      notes: "If back-cut covered, 4 skips to 2 in opposite corner for shot.",
      tokens: [
        off(1, 400, 130),
        off(2, 120, 420),
        off(3, 680, 420),
        off(4, 400, 510),
        off(5, 480, 130),
        ball(120, 420),
      ],
      paths: [{ id: "pm_6", type: "PASS", points: [400, 510, 260, 480, 120, 420], startTokenId: "o4", endTokenId: "o2" }],
    },
  ],
};

const blobBox: Play = {
  id: "play_blob_box",
  playbookId: "pb_varsity",
  title: "BLOB — Box Cross",
  description: "Box set with cross-screen for shooter.",
  courtType: "HALF",
  category: "BLOB",
  tags: ["BLOB", "shooter"],
  createdAt: "2026-04-20T00:00:00Z",
  updatedAt: "2026-04-28T00:00:00Z",
  versionLabel: "v1.0",
  phases: [
    {
      id: "ph_b1",
      order: 0,
      phase: "ENTRY",
      notes: "Box alignment. 5 inbounds.",
      tokens: [off(1, 270, 230), off(2, 530, 230), off(3, 270, 130), off(4, 530, 130), off(5, 400, 60), ball(400, 60)],
      paths: [],
    },
    {
      id: "ph_b2",
      order: 1,
      phase: "TRIGGER",
      notes: "1 cross-screens for 2. 4 down-screens for 1 (Spain/Floppy mix).",
      tokens: [off(1, 530, 230), off(2, 270, 230), off(3, 270, 130), off(4, 530, 130), off(5, 400, 60), ball(400, 60)],
      paths: [
        { id: "pb_1", type: "SCREEN", points: [270, 230, 530, 230] },
        { id: "pb_2", type: "SCREEN", points: [530, 130, 530, 230] },
      ],
    },
    {
      id: "ph_b3",
      order: 2,
      phase: "READ_1",
      notes: "5 looks for 2 cutting to corner first. If covered, hits 1 popping to top.",
      tokens: [off(1, 530, 360), off(2, 100, 380), off(3, 270, 130), off(4, 530, 130), off(5, 400, 130), ball(100, 380)],
      paths: [
        { id: "pb_3", type: "CUT", points: [270, 230, 100, 380], startTokenId: "o2" },
        { id: "pb_4", type: "PASS", points: [400, 60, 250, 220, 100, 380], startTokenId: "o5", endTokenId: "o2" },
      ],
    },
  ],
};

export const allPlays: Play[] = [horsFlex, motionStrong, blobBox];

export const playbooks: Playbook[] = [
  {
    id: "pb_varsity",
    teamId: "team_varsity",
    title: "Varsity Playbook — 2025/26",
    description: "Primary sets, motion, BLOB/SLOB/ATO, zone offense.",
    updatedAt: "2026-04-29T18:00:00Z",
    plays: [
      ...allPlays,
      {
        id: "play_chicago",
        playbookId: "pb_varsity",
        title: "Chicago — Zipper Action",
        description: "Quick wing entry into zipper screen for a guard.",
        courtType: "HALF",
        category: "SLOB",
        tags: ["SLOB", "zipper"],
        createdAt: "2026-03-01T00:00:00Z",
        updatedAt: "2026-04-08T00:00:00Z",
        versionLabel: "v1.0",
      },
      {
        id: "play_stagger_away",
        playbookId: "pb_varsity",
        title: "Stagger Away (ATO)",
        description: "Stagger-screen action for shooter coming off baseline.",
        courtType: "HALF",
        category: "ATO",
        tags: ["ATO", "stagger"],
        createdAt: "2026-02-20T00:00:00Z",
        updatedAt: "2026-04-15T00:00:00Z",
        versionLabel: "v2.1",
      },
    ].map(({ phases: _omit, ...rest }: any) => rest as PlayMeta),
    quizzes: [],
  },
];

export function getPlay(id: string): Play | undefined {
  return allPlays.find((p) => p.id === id);
}

/* -------------------------------------------------------------------------- */
/* Play Quizzes                                                                */
/* -------------------------------------------------------------------------- */

export type QuizQuestionType = "IDENTIFY_ACTION" | "PREDICT_NEXT" | "PLACE_PLAYER" | "SEQUENCE";

export type QuizIdentifyAction = {
  id: string;
  type: "IDENTIFY_ACTION";
  prompt: string;
  playId: string;
  upToPhaseId: string;
  options: string[];
  correctIdx: number;
};

export type QuizPredictNext = {
  id: string;
  type: "PREDICT_NEXT";
  prompt: string;
  playId: string;
  upToPhaseId: string;
  options: string[];
  correctIdx: number;
};

export type QuizPlacePlayer = {
  id: string;
  type: "PLACE_PLAYER";
  prompt: string;
  playId: string;
  phaseId: string; // the target arrangement
  /** Which token IDs the athlete must place (others are pre-placed). */
  placeTokenIds: string[];
  /** Acceptable radius in stage pixels for a "correct" placement. */
  toleranceRadius: number;
};

export type QuizSequence = {
  id: string;
  type: "SEQUENCE";
  prompt: string;
  playId: string;
  /** Phases shuffled. Athlete must put them back in order. */
  phaseIds: string[];
};

export type QuizQuestion = QuizIdentifyAction | QuizPredictNext | QuizPlacePlayer | QuizSequence;

export type PlayQuizMeta = {
  id: string;
  playbookId: string;
  playId: string;
  title: string;
  description: string;
  passThreshold: number; // e.g. 0.8
  questions: QuizQuestion[];
};

export const playQuizzes: PlayQuizMeta[] = [
  {
    id: "quiz_horns_flex",
    playbookId: "pb_varsity",
    playId: "play_horns_flex",
    title: "Horns Flex — Reads",
    description: "Test the reads in our primary half-court set.",
    passThreshold: 0.8,
    questions: [
      {
        id: "q1",
        type: "IDENTIFY_ACTION",
        prompt: "What is the primary action after the entry pass to 4?",
        playId: "play_horns_flex",
        upToPhaseId: "ph_2",
        options: ["Flex cut for 1 off 5", "Pick-and-roll with 5", "DHO with 2", "Iso for 4"],
        correctIdx: 0,
      },
      {
        id: "q2",
        type: "PREDICT_NEXT",
        prompt: "If 1's flex cut is covered, what is the next read?",
        playId: "play_horns_flex",
        upToPhaseId: "ph_3",
        options: [
          "Stagger away for 2 (5 down-screens)",
          "Iso 4 vs his defender",
          "Reset to 1 at the top",
          "Lob to 5 in the post",
        ],
        correctIdx: 0,
      },
      {
        id: "q3",
        type: "PLACE_PLAYER",
        prompt: "After the entry pass, where do 2, 3, and 5 spot up? Drag them to position.",
        playId: "play_horns_flex",
        phaseId: "ph_2",
        placeTokenIds: ["o2", "o3", "o5"],
        toleranceRadius: 60,
      },
      {
        id: "q4",
        type: "SEQUENCE",
        prompt: "Put the phases of Horns Flex in the correct order.",
        playId: "play_horns_flex",
        phaseIds: ["ph_3", "ph_1", "ph_5", "ph_2", "ph_4"],
      },
    ],
  },
];

export function getQuiz(id: string): PlayQuizMeta | undefined {
  return playQuizzes.find((q) => q.id === id);
}
export function getQuizzesForPlay(playId: string): PlayQuizMeta[] {
  return playQuizzes.filter((q) => q.playId === playId);
}
