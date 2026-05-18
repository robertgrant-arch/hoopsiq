/* ==========================================================================
   HoopsOS Mock Data — powers every surface of the demo product.
   Everything here is deterministic and safe to render on the client.
   ========================================================================== */

// ------------------------------ Organizations ------------------------------
export const org = {
  id: "org_texas_elite",
  name: "Texas Elite Basketball",
  logoInitials: "TE",
  teams: [
    { id: "team_varsity", name: "Texas Elite Varsity", seasonLabel: "2025–2026" },
    { id: "team_jv", name: "Texas Elite JV", seasonLabel: "2025–2026" },
  ],
};

// ------------------------------ Roster ------------------------------
export type RosterAthlete = {
  id: string;
  name: string;
  initials: string;
  position: "PG" | "SG" | "SF" | "PF" | "C";
  height: string;
  classYear: number;
  level: number;
  xp: number;
  streak: number;
  lastActive: string;
  compliance: number; // 0-100 for today's WOD
  hasDiscount: boolean;
  isMinor: boolean;
  phone?: string;
  email?: string;
};

export const roster: RosterAthlete[] = [
  { id: "a_1",  name: "Jalen Carter",    initials: "JC", position: "SG", height: "6'4\"",  classYear: 2027, level: 7, xp: 2840, streak: 14, lastActive: "Today",  compliance: 100, hasDiscount: true,  isMinor: true,  phone: "(512) 555-0181", email: "jcarter@school.edu" },
  { id: "a_2",  name: "Marcus Williams", initials: "MW", position: "PG", height: "6'1\"",  classYear: 2026, level: 9, xp: 4120, streak: 28, lastActive: "Today",  compliance: 100, hasDiscount: true,  isMinor: false, phone: "(512) 555-0142", email: "m.williams@email.com" },
  { id: "a_3",  name: "DeAndre Johnson", initials: "DJ", position: "C",  height: "6'10\"", classYear: 2027, level: 5, xp: 1950, streak: 3,  lastActive: "Today",  compliance: 85,  hasDiscount: true,  isMinor: true,  phone: "(214) 555-0193", email: "djohnson@school.edu" },
  { id: "a_4",  name: "Tyrese Brooks",   initials: "TB", position: "SF", height: "6'6\"",  classYear: 2026, level: 8, xp: 3340, streak: 21, lastActive: "Today",  compliance: 92,  hasDiscount: true,  isMinor: false, phone: "(713) 555-0164", email: "tbrooks@email.com" },
  { id: "a_5",  name: "Isaiah Moore",    initials: "IM", position: "PF", height: "6'8\"",  classYear: 2027, level: 6, xp: 2120, streak: 0,  lastActive: "2d ago", compliance: 0,   hasDiscount: true,  isMinor: true,  phone: "(972) 555-0127", email: "imoore@school.edu" },
  { id: "a_6",  name: "Khalil Jenkins",  initials: "KJ", position: "SG", height: "6'3\"",  classYear: 2028, level: 4, xp: 1290, streak: 7,  lastActive: "Today",  compliance: 66,  hasDiscount: true,  isMinor: true,  phone: "(512) 555-0156", email: "kjenkins@school.edu" },
  { id: "a_7",  name: "Miles Thompson",  initials: "MT", position: "PG", height: "5'11\"", classYear: 2028, level: 3, xp: 890,  streak: 2,  lastActive: "Today",  compliance: 45,  hasDiscount: true,  isMinor: true,  phone: "(214) 555-0179", email: "mthompson@school.edu" },
  { id: "a_8",  name: "Xavier Reed",     initials: "XR", position: "SF", height: "6'5\"",  classYear: 2026, level: 7, xp: 2680, streak: 11, lastActive: "Today",  compliance: 100, hasDiscount: true,  isMinor: false, phone: "(512) 555-0103", email: "xreed@email.com" },
  { id: "a_9",  name: "Carter Lopez",    initials: "CL", position: "C",  height: "6'11\"", classYear: 2027, level: 6, xp: 2310, streak: 9,  lastActive: "Today",  compliance: 78,  hasDiscount: true,  isMinor: true,  phone: "(713) 555-0188", email: "clopez@school.edu" },
  { id: "a_10", name: "Amari Sullivan",  initials: "AS", position: "PF", height: "6'7\"",  classYear: 2026, level: 8, xp: 3560, streak: 19, lastActive: "Today",  compliance: 100, hasDiscount: true,  isMinor: false, phone: "(512) 555-0115", email: "asullivan@email.com" },
  { id: "a_11", name: "Devin Hayes",     initials: "DH", position: "SG", height: "6'2\"",  classYear: 2028, level: 5, xp: 1740, streak: 5,  lastActive: "1d ago", compliance: 0,   hasDiscount: true,  isMinor: true,  phone: "(972) 555-0137", email: "dhayes@school.edu" },
  { id: "a_12", name: "Elijah Foster",   initials: "EF", position: "PG", height: "6'0\"",  classYear: 2027, level: 6, xp: 2250, streak: 12, lastActive: "Today",  compliance: 100, hasDiscount: true,  isMinor: true,  phone: "(214) 555-0162", email: "efoster@school.edu" },
];

// ------------------------------ Parent / Guardian Contacts ------------------------------
export type ParentContact = {
  id: string;
  athleteId: string;
  name: string;
  initials: string;
  relationship: "Mother" | "Father" | "Guardian" | "Stepmother" | "Stepfather" | "Grandparent" | "Other";
  phone: string;
  email?: string;
  isPrimary: boolean;
  canReceiveMessages: boolean;
  notes?: string;
};

export const parentContacts: ParentContact[] = [
  // Jalen Carter (a_1) — minor
  { id: "p_1",  athleteId: "a_1",  name: "Denise Carter",    initials: "DC", relationship: "Mother",    phone: "(512) 555-0201", email: "dcarter@gmail.com",      isPrimary: true,  canReceiveMessages: true  },
  { id: "p_2",  athleteId: "a_1",  name: "Robert Carter",    initials: "RC", relationship: "Father",    phone: "(512) 555-0202", email: "rcarter@gmail.com",      isPrimary: false, canReceiveMessages: true  },
  // DeAndre Johnson (a_3) — minor
  { id: "p_3",  athleteId: "a_3",  name: "Tanya Johnson",    initials: "TJ", relationship: "Mother",    phone: "(214) 555-0203", email: "tjohnson@gmail.com",     isPrimary: true,  canReceiveMessages: true  },
  { id: "p_4",  athleteId: "a_3",  name: "Kevin Johnson",    initials: "KJ", relationship: "Father",    phone: "(214) 555-0204",                                  isPrimary: false, canReceiveMessages: false },
  // Isaiah Moore (a_5) — minor
  { id: "p_5",  athleteId: "a_5",  name: "Sandra Moore",     initials: "SM", relationship: "Mother",    phone: "(972) 555-0205", email: "smoore@email.com",       isPrimary: true,  canReceiveMessages: true  },
  // Khalil Jenkins (a_6) — minor
  { id: "p_6",  athleteId: "a_6",  name: "Patricia Jenkins", initials: "PJ", relationship: "Mother",    phone: "(512) 555-0206", email: "pjenkins@gmail.com",     isPrimary: true,  canReceiveMessages: true  },
  { id: "p_7",  athleteId: "a_6",  name: "Tony Jenkins",     initials: "TJ", relationship: "Father",    phone: "(512) 555-0207", email: "tjenkins@gmail.com",     isPrimary: false, canReceiveMessages: true  },
  // Miles Thompson (a_7) — minor
  { id: "p_8",  athleteId: "a_7",  name: "Cheryl Thompson",  initials: "CT", relationship: "Mother",    phone: "(214) 555-0208", email: "cthompson@email.com",    isPrimary: true,  canReceiveMessages: true  },
  { id: "p_9",  athleteId: "a_7",  name: "James Thompson",   initials: "JT", relationship: "Father",    phone: "(214) 555-0209",                                  isPrimary: false, canReceiveMessages: true  },
  // Carter Lopez (a_9) — minor
  { id: "p_10", athleteId: "a_9",  name: "Maria Lopez",      initials: "ML", relationship: "Mother",    phone: "(713) 555-0210", email: "mlopez@gmail.com",       isPrimary: true,  canReceiveMessages: true  },
  // Devin Hayes (a_11) — minor
  { id: "p_11", athleteId: "a_11", name: "Angela Hayes",     initials: "AH", relationship: "Guardian",  phone: "(972) 555-0211", email: "ahayes@email.com",       isPrimary: true,  canReceiveMessages: true,  notes: "Legal guardian" },
  // Elijah Foster (a_12) — minor
  { id: "p_12", athleteId: "a_12", name: "Lisa Foster",      initials: "LF", relationship: "Mother",    phone: "(214) 555-0212", email: "lfoster@gmail.com",      isPrimary: true,  canReceiveMessages: true  },
  { id: "p_13", athleteId: "a_12", name: "David Foster",     initials: "DF", relationship: "Father",    phone: "(214) 555-0213", email: "dfoster@gmail.com",      isPrimary: false, canReceiveMessages: true  },
];

// ------------------------------ Workouts ------------------------------
export type Drill = {
  id: string;
  name: string;
  category: string;
  sets: number;
  reps: string;
  duration: number;
  /** Plain-English description of what the drill is and how it's executed. */
  description?: string;
  /** Short coaching cues — each one should be actionable in a single sentence. */
  cues?: string[];
  /** Primary skill this drill develops — shown as a tag on the player card. */
  skillFocus?: string;
};

export type Workout = {
  id: string;
  title: string;
  category: "SHOOTING" | "HANDLES" | "CONDITIONING" | "DEFENSE" | "FOOTWORK";
  level: number;
  durationMin: number;
  xp: number;
  drills: Drill[];
  description: string;
};

export const todaysWod: Workout = {
  id: "w_today",
  title: "Pull-Up Shooter — Intermediate",
  category: "SHOOTING",
  level: 6,
  durationMin: 28,
  xp: 240,
  description: "Sharpen mid-range pull-ups off ball screens. Focus on balance, base, and one-motion release.",
  drills: [
    {
      id: "d_1",
      name: "Form Shooting",
      category: "SHOOTING",
      sets: 3,
      reps: "10 reps",
      duration: 4,
      skillFocus: "Shooting mechanics",
      description:
        "One-handed reps at 3–5 ft from the basket. Lock in your elbow alignment and follow-through before adding range.",
      cues: [
        "Elbow under the ball, wrist straight back",
        "Hold your follow-through until it swishes",
        "Square hips and shoulders to the basket before releasing",
      ],
    },
    {
      id: "d_2",
      name: "Elbow Pull-Ups",
      category: "SHOOTING",
      sets: 4,
      reps: "8 reps",
      duration: 6,
      skillFocus: "Mid-range pull-up",
      description:
        "Catch a pass at the elbow, one hard dribble right or left, gather, and rise into a pull-up. Land in balance. Alternate sides each set.",
      cues: [
        "Attack the gap before pulling up — don't telegraph",
        "Stay low on the gather, don't rise early",
        "One-motion: gather → rise → release",
      ],
    },
    {
      id: "d_3",
      name: "Screen Escape Jumpers",
      category: "SHOOTING",
      sets: 3,
      reps: "12 reps",
      duration: 8,
      skillFocus: "Off-screen shooting",
      description:
        "Use a stationary chair as a screen. Curl tight, catch on the move from a feeder, and shoot off one dribble or no dribble. Read the defense angle.",
      cues: [
        "Rub your shoulder on the screen — no gap for the defender",
        "Catch ready: hands up, hips open",
        "Shoot off the catch if open; one dribble left or right if not",
      ],
    },
    {
      id: "d_4",
      name: "Live Dribble Catch-Shoot",
      category: "SHOOTING",
      sets: 4,
      reps: "10 reps",
      duration: 6,
      skillFocus: "Rhythm catch-and-shoot",
      description:
        "Coach bounce-passes from the paint while you drive past a cone, stop, and catch on the move. Shoot with rhythm — no extra dribbles. Simulate a trail-three or kick-out scenario.",
      cues: [
        "See the ball early — hands ready before the pass arrives",
        "Stop under control; feet landing together on the catch",
        "Trust your shot — don't second-guess after you catch",
      ],
    },
    {
      id: "d_5",
      name: "Finishing Burst",
      category: "CONDITIONING",
      sets: 1,
      reps: "90s",
      duration: 4,
      skillFocus: "Conditioning · finishing under fatigue",
      description:
        "Continuous layup alternation for 90 seconds. Left, right, reverse. No rest — the goal is finishing when your legs are gone. Start from the block each rep.",
      cues: [
        "Jump off one foot — don't two-foot gather when tired",
        "Keep your eyes up, not down at the ball",
        "Slow down only if your form breaks — not before",
      ],
    },
  ],
};

export const skillTracks = [
  { id: "t_shooting", name: "Shooting", progress: 72, level: 7, icon: "🎯" },
  { id: "t_handles", name: "Ball Handling", progress: 58, level: 6, icon: "🌀" },
  { id: "t_defense", name: "Defense", progress: 41, level: 4, icon: "🛡️" },
  { id: "t_footwork", name: "Footwork", progress: 65, level: 6, icon: "👣" },
  { id: "t_iq", name: "Basketball IQ", progress: 34, level: 3, icon: "🧠" },
];

export const achievements = [
  { id: "ach_1", name: "First Blood", description: "Complete your first WOD", tier: "bronze", unlocked: true, unlockedAt: "3 months ago" },
  { id: "ach_2", name: "Shot Maker", description: "Complete 25 shooting workouts", tier: "silver", unlocked: true, unlockedAt: "5 weeks ago" },
  { id: "ach_3", name: "Iron Will", description: "14-day workout streak", tier: "gold", unlocked: true, unlockedAt: "Today" },
  { id: "ach_4", name: "Level Up", description: "Reach Level 10", tier: "gold", unlocked: false },
  { id: "ach_5", name: "Film Student", description: "Watch 100% of assigned film", tier: "silver", unlocked: true, unlockedAt: "2 weeks ago" },
  { id: "ach_6", name: "Iron Man", description: "100-day streak", tier: "platinum", unlocked: false },
];

// ------------------------------ Videos / AI Feedback ------------------------------
export type VideoUpload = {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  uploadedAt: string;
  status: "PROCESSING" | "READY" | "LOW_CONFIDENCE" | "COACH_REVIEWED";
  aiConfidence: number;
  issues: { timestamp: string; category: string; severity: "minor" | "major"; message: string; suggestedDrillIds: string[] }[];
  coachReview?: { coachName: string; verdict: string; comments: { t: string; text: string }[] };
  /** Number of open coaching actions spawned from this upload */
  openActionCount?: number;
};

export const athleteUploads: VideoUpload[] = [
  {
    id: "vid_1",
    title: "Pull-Up Jumper Reps — Drive 1",
    thumbnail: "hoops-bench-backboard",
    duration: "1:42",
    uploadedAt: "2 hours ago",
    status: "COACH_REVIEWED",
    aiConfidence: 0.89,
    openActionCount: 2,
    issues: [
      { timestamp: "0:14", category: "Balance", severity: "minor", message: "Slight forward lean at release. Keep chest stacked over base.", suggestedDrillIds: ["d_balance_1"] },
      { timestamp: "0:37", category: "Release", severity: "major", message: "Thumb flick visible — rotation is forced. Index finger should be last off the ball.", suggestedDrillIds: ["d_form_2", "d_hand_3"] },
      { timestamp: "1:09", category: "Footwork", severity: "minor", message: "Left foot drags on pivot. Plant firm before gather.", suggestedDrillIds: ["d_foot_1"] },
    ],
    coachReview: {
      coachName: "Coach Reed",
      verdict: "Real improvement on your base. Keep dialing in that release — less thumb, more index.",
      comments: [
        { t: "0:14", text: "Nice balance here, but chest is drifting. Core-stacked checkpoint before lift." },
        { t: "0:37", text: "This is the one. Rotate index-finger down, NOT thumb-across. Watch yourself in mirror tonight." },
      ],
    },
  },
  {
    id: "vid_2",
    title: "Handles — Cone Series",
    thumbnail: "basketball-dribble-practice",
    duration: "2:18",
    uploadedAt: "Yesterday",
    status: "READY",
    aiConfidence: 0.92,
    openActionCount: 1,
    issues: [
      { timestamp: "0:08", category: "Posture", severity: "minor", message: "Stand up a touch too tall on crossover. Stay low and wide.", suggestedDrillIds: ["d_handles_1"] },
      { timestamp: "0:45", category: "Change of Pace", severity: "major", message: "Speed is constant — defender can predict. Decelerate before bursting.", suggestedDrillIds: ["d_handles_2"] },
    ],
  },
  {
    id: "vid_3",
    title: "Defensive Slides — Session 4",
    thumbnail: "gym-floor-markings",
    duration: "1:04",
    uploadedAt: "3 days ago",
    status: "LOW_CONFIDENCE",
    aiConfidence: 0.54,
    issues: [
      { timestamp: "0:22", category: "Stance", severity: "minor", message: "Hands low. Active hands force more turnovers.", suggestedDrillIds: ["d_def_1"] },
    ],
  },
];

// ------------------------------ Film Room ------------------------------
export type FilmClip = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  assignedTo: "team" | "individual";
  dueIn: string;
  watchPercent: number;
  commentCount: number;
};

export const filmRoom = {
  id: "fr_varsity",
  teamId: "team_varsity",
  name: "Varsity Game Film",
  clips: [
    { id: "clip_1", title: "Q3 — Pick & Roll Coverage vs. Westbury", tag: "Defense", duration: "2:14", assignedTo: "team", dueIn: "in 2 days", watchPercent: 72, commentCount: 8 },
    { id: "clip_2", title: "Sideline Out of Bounds — Stagger", tag: "Offense / SLOB", duration: "0:48", assignedTo: "team", dueIn: "in 1 day", watchPercent: 41, commentCount: 4 },
    { id: "clip_3", title: "Transition Defense Breakdowns", tag: "Defense", duration: "3:22", assignedTo: "team", dueIn: "Due today", watchPercent: 25, commentCount: 2 },
    { id: "clip_4", title: "Carter's Closeout Technique", tag: "Individual · Jalen C", duration: "1:05", assignedTo: "individual", dueIn: "in 3 days", watchPercent: 0, commentCount: 1 },
    { id: "clip_5", title: "Second-Half Zone Attack", tag: "Offense", duration: "4:10", assignedTo: "team", dueIn: "in 5 days", watchPercent: 0, commentCount: 0 },
  ] as FilmClip[],
};

export const clipTimestampComments = [
  { id: "c_1", t: 14, author: "Coach Reed", role: "COACH", text: "Watch how Marcus hedges too hard — gives up a lob easy." },
  { id: "c_2", t: 38, author: "Coach Reed", role: "COACH", text: "This is the call — 'Ice' weak side. Everyone on this coverage." },
  { id: "c_3", t: 62, author: "Jalen Carter", role: "ATHLETE", text: "Should the tag come from the nail or the corner?" },
  { id: "c_4", t: 78, author: "Coach Reed", role: "COACH", text: "Great question Jalen — nail. We never tag from the corner in 4-out sets." },
];

// ------------------------------ Playbook / Plays ------------------------------
export type Token = { id: string; type: "OFFENSE" | "DEFENSE" | "BALL"; label: string; x: number; y: number };
export type Path = { id: string; type: "PASS" | "DRIBBLE" | "CUT" | "SCREEN"; from: { x: number; y: number }; to: { x: number; y: number } };
export type PlayFrame = { id: string; label: string; phase: "ENTRY" | "TRIGGER" | "READ_1" | "READ_2" | "COUNTER"; tokens: Token[]; paths: Path[]; note: string };

export const playbook = {
  id: "pb_varsity",
  name: "Varsity Playbook — 2025/26",
  plays: [
    { id: "play_1", name: "Horns Flex", tag: "Primary Set", updatedAt: "2 days ago", frameCount: 5 },
    { id: "play_2", name: "5-Out Motion Strong", tag: "Primary Set", updatedAt: "5 days ago", frameCount: 4 },
    { id: "play_3", name: "Chicago — Zipper Action", tag: "SLOB", updatedAt: "1 week ago", frameCount: 3 },
    { id: "play_4", name: "Box Set Cross", tag: "BLOB", updatedAt: "2 weeks ago", frameCount: 3 },
    { id: "play_5", name: "Stagger Away", tag: "ATO", updatedAt: "3 weeks ago", frameCount: 4 },
  ],
};

// Canonical "Horns Flex" play — drawable on the canvas
export const horsFlexFrames: PlayFrame[] = [
  {
    id: "f_1",
    label: "Frame 1 — Entry",
    phase: "ENTRY",
    note: "Point guard (O1) brings ball up. Bigs set high-post horns.",
    tokens: [
      { id: "o1", type: "OFFENSE", label: "1", x: 400, y: 500 },
      { id: "o2", type: "OFFENSE", label: "2", x: 180, y: 420 },
      { id: "o3", type: "OFFENSE", label: "3", x: 620, y: 420 },
      { id: "o4", type: "OFFENSE", label: "4", x: 300, y: 260 },
      { id: "o5", type: "OFFENSE", label: "5", x: 500, y: 260 },
      { id: "b", type: "BALL", label: "", x: 400, y: 500 },
    ],
    paths: [],
  },
  {
    id: "f_2",
    label: "Frame 2 — Trigger (Entry Pass)",
    phase: "TRIGGER",
    note: "O1 passes to O4 at high post. O1 cuts hard off O5 (flex cut).",
    tokens: [
      { id: "o1", type: "OFFENSE", label: "1", x: 400, y: 500 },
      { id: "o2", type: "OFFENSE", label: "2", x: 180, y: 420 },
      { id: "o3", type: "OFFENSE", label: "3", x: 620, y: 420 },
      { id: "o4", type: "OFFENSE", label: "4", x: 300, y: 260 },
      { id: "o5", type: "OFFENSE", label: "5", x: 500, y: 260 },
      { id: "b", type: "BALL", label: "", x: 300, y: 260 },
    ],
    paths: [
      { id: "p_1", type: "PASS", from: { x: 400, y: 500 }, to: { x: 300, y: 260 } },
      { id: "p_2", type: "CUT", from: { x: 400, y: 500 }, to: { x: 620, y: 340 } },
    ],
  },
  {
    id: "f_3",
    label: "Frame 3 — Read 1 (Corner Cut)",
    phase: "READ_1",
    note: "If O1 is open under rim — layup. If not, O5 screens down for O2.",
    tokens: [
      { id: "o1", type: "OFFENSE", label: "1", x: 620, y: 340 },
      { id: "o2", type: "OFFENSE", label: "2", x: 180, y: 420 },
      { id: "o3", type: "OFFENSE", label: "3", x: 620, y: 420 },
      { id: "o4", type: "OFFENSE", label: "4", x: 300, y: 260 },
      { id: "o5", type: "OFFENSE", label: "5", x: 260, y: 420 },
      { id: "b", type: "BALL", label: "", x: 300, y: 260 },
    ],
    paths: [
      { id: "p_3", type: "SCREEN", from: { x: 500, y: 260 }, to: { x: 260, y: 420 } },
      { id: "p_4", type: "CUT", from: { x: 180, y: 420 }, to: { x: 380, y: 400 } },
    ],
  },
  {
    id: "f_4",
    label: "Frame 4 — Read 2 (Skip)",
    phase: "READ_2",
    note: "O4 skips to O2 at top. Quick catch-shoot or attack closeout.",
    tokens: [
      { id: "o1", type: "OFFENSE", label: "1", x: 620, y: 340 },
      { id: "o2", type: "OFFENSE", label: "2", x: 380, y: 400 },
      { id: "o3", type: "OFFENSE", label: "3", x: 620, y: 420 },
      { id: "o4", type: "OFFENSE", label: "4", x: 300, y: 260 },
      { id: "o5", type: "OFFENSE", label: "5", x: 260, y: 420 },
      { id: "b", type: "BALL", label: "", x: 380, y: 400 },
    ],
    paths: [{ id: "p_5", type: "PASS", from: { x: 300, y: 260 }, to: { x: 380, y: 400 } }],
  },
  {
    id: "f_5",
    label: "Frame 5 — Counter (DHO)",
    phase: "COUNTER",
    note: "If O2 is denied, flow into dribble hand-off with O4 at elbow.",
    tokens: [
      { id: "o1", type: "OFFENSE", label: "1", x: 620, y: 340 },
      { id: "o2", type: "OFFENSE", label: "2", x: 340, y: 300 },
      { id: "o3", type: "OFFENSE", label: "3", x: 620, y: 420 },
      { id: "o4", type: "OFFENSE", label: "4", x: 300, y: 260 },
      { id: "o5", type: "OFFENSE", label: "5", x: 260, y: 420 },
      { id: "b", type: "BALL", label: "", x: 340, y: 300 },
    ],
    paths: [
      { id: "p_6", type: "DRIBBLE", from: { x: 300, y: 260 }, to: { x: 340, y: 300 } },
    ],
  },
];

// ------------------------------ Expert Marketplace ------------------------------
export type Expert = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  category: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  responseHrs: number;
  verified: boolean;
  bio: string;
  credentials: string[];
};

export const experts: Expert[] = [
  { id: "ex_1", slug: "chris-brickley", name: "Chris Brickley", initials: "CB", category: "Shooting & Footwork", tagline: "NBA's Most Requested Skill Coach", rating: 4.97, reviewCount: 142, responseHrs: 6, verified: true, bio: "I've worked with Kevin Durant, Carmelo Anthony, D'Angelo Russell, and over 50 NBA players. Let me show you the details the pros obsess over.", credentials: ["NBA Skill Coach since 2012", "Black Ops Basketball founder", "Featured — The Players' Tribune"] },
  { id: "ex_2", slug: "tasha-king", name: "Tasha King", initials: "TK", category: "Point Guard Development", tagline: "Former WNBA PG · Mental Game Specialist", rating: 4.91, reviewCount: 89, responseHrs: 12, verified: true, bio: "11-year WNBA vet. I specialize in the PG mindset — reads, pace control, and leadership under pressure.", credentials: ["11-year WNBA career", "2x All-Star", "M.Ed. Sports Psychology"] },
  { id: "ex_3", slug: "marcus-hunt", name: "Marcus Hunt", initials: "MH", category: "Big Man Post Skills", tagline: "Former NBA C · Footwork Obsessive", rating: 4.89, reviewCount: 63, responseHrs: 18, verified: true, bio: "Played 9 years in the NBA as a back-to-the-basket 5. Post footwork, counter moves, and modern stretch-5 reads.", credentials: ["9 NBA seasons", "Euroleague All-Star", "Certified Level III"] },
  { id: "ex_4", slug: "dre-washington", name: "Dre Washington", initials: "DW", category: "Guard Scoring", tagline: "G-League MVP · Scoring Specialist", rating: 4.95, reviewCount: 104, responseHrs: 8, verified: true, bio: "I've scored 40 in the NBA and 50 in the G-League. I'll teach you how to create your shot at any level.", credentials: ["G-League MVP 2022", "NBA Two-Way Contract", "Hustle University Ambassador"] },
  { id: "ex_5", slug: "coach-valdez", name: "Coach Valdez", initials: "CV", category: "Defense & Help Rotation", tagline: "D1 Head Coach · Elite Defensive Architect", rating: 4.88, reviewCount: 51, responseHrs: 24, verified: true, bio: "Top-5 defensive rating 4 of the last 5 seasons. I'll walk you through every coverage, tag, and rotation concept.", credentials: ["D1 Head Coach — 12 seasons", "NCAA Tournament 6x", "Naismith Coach Finalist"] },
  { id: "ex_6", slug: "jae-park", name: "Jae Park", initials: "JP", category: "Vertical & Athleticism", tagline: "Performance Coach · Vertical Jump Specialist", rating: 4.93, reviewCount: 78, responseHrs: 14, verified: true, bio: "I've added 10+ inches to over 200 athletes' verticals. Plyometrics, explosive strength, movement quality.", credentials: ["CSCS Certified", "10+ yr NBA/NFL consulting", "PhD Exercise Science"] },
];

export type ExpertOffer = {
  id: string;
  expertId: string;
  type: "ASYNC_REVIEW" | "ONE_ON_ONE" | "LIVE_CLASS" | "COURSE";
  title: string;
  description: string;
  publicPrice: number;
  memberPrice: number;
  durationLabel: string;
};

export const expertOffers: ExpertOffer[] = [
  { id: "of_1", expertId: "ex_1", type: "ASYNC_REVIEW", title: "Jumpshot Breakdown — 72-hour turnaround", description: "Send me a shooting clip. I'll deliver a 15-min frame-by-frame voiceover breakdown with corrections.", publicPrice: 249, memberPrice: 124, durationLabel: "~15 min report" },
  { id: "of_2", expertId: "ex_1", type: "ONE_ON_ONE", title: "1:1 Zoom Consult — 45 min", description: "Deep-dive Zoom call on any skill area. Bring film or just questions.", publicPrice: 499, memberPrice: 299, durationLabel: "45 min live" },
  { id: "of_3", expertId: "ex_1", type: "COURSE", title: "The Pro Shot Method (8-module course)", description: "My complete shooting framework — the same progression I use with NBA All-Stars.", publicPrice: 199, memberPrice: 99, durationLabel: "4 hr course" },
  { id: "of_4", expertId: "ex_2", type: "ASYNC_REVIEW", title: "PG IQ Film Review", description: "Send me 10–20 min of game film. I'll break down your reads, decision-making, and pace.", publicPrice: 199, memberPrice: 99, durationLabel: "~20 min report" },
  { id: "of_5", expertId: "ex_2", type: "LIVE_CLASS", title: "Mental Game Masterclass — Group Live", description: "Weekly live class covering film reads, pre-game routines, and leadership communication.", publicPrice: 49, memberPrice: 19, durationLabel: "60 min live · weekly" },
  { id: "of_6", expertId: "ex_3", type: "ONE_ON_ONE", title: "Post Footwork Consult — 30 min", description: "Teach you the Dream Shake, jump-hook counter, and Euro-step pivot sequence.", publicPrice: 399, memberPrice: 249, durationLabel: "30 min live" },
  { id: "of_7", expertId: "ex_4", type: "COURSE", title: "Scoring 1-on-1 (12 modules)", description: "Every move, counter, and read you need to be an unstoppable scorer.", publicPrice: 249, memberPrice: 129, durationLabel: "6 hr course" },
  { id: "of_8", expertId: "ex_5", type: "COURSE", title: "The Elite Defense System", description: "Full team defense curriculum — pick-and-roll, transition, help rotations.", publicPrice: 349, memberPrice: 179, durationLabel: "8 hr course" },
  { id: "of_9", expertId: "ex_6", type: "COURSE", title: "Vertical Jump Program — 12 weeks", description: "Periodized program. Most athletes add 4–8 inches in 12 weeks.", publicPrice: 179, memberPrice: 89, durationLabel: "12 week program" },
];

// ------------------------------ Courses / Learn ------------------------------
export type Course = {
  id: string;
  title: string;
  instructor: string;
  instructorInitials: string;
  category: string;
  tier: "INCLUDED" | "PREMIUM";
  lessonCount: number;
  totalMinutes: number;
  price?: number;
  progress?: number;
  hero: string;
  summary: string;
};

export const courses: Course[] = [
  { id: "c_1", title: "The Pro Shot Method", instructor: "Chris Brickley", instructorInitials: "CB", category: "Shooting", tier: "PREMIUM", lessonCount: 8, totalMinutes: 240, price: 99, progress: 37, hero: "amber-court", summary: "8-module framework used with NBA All-Stars. Form, rhythm, release, and live-dribble mechanics." },
  { id: "c_2", title: "Elite Defense Fundamentals", instructor: "Coach Valdez", instructorInitials: "CV", category: "Defense", tier: "INCLUDED", lessonCount: 12, totalMinutes: 360, progress: 12, hero: "navy-court", summary: "Individual stance, closeouts, and rotation principles — included with Player Core." },
  { id: "c_3", title: "PG Decision-Making", instructor: "Tasha King", instructorInitials: "TK", category: "IQ", tier: "PREMIUM", lessonCount: 10, totalMinutes: 300, price: 89, hero: "white-court", summary: "Reads, pace, communication. The intangibles that separate floor generals from game managers." },
  { id: "c_4", title: "Post Footwork Bible", instructor: "Marcus Hunt", instructorInitials: "MH", category: "Bigs", tier: "PREMIUM", lessonCount: 6, totalMinutes: 180, price: 69, hero: "dusk-court", summary: "Every pivot, counter, and Dream Shake variation from a 9-year NBA center." },
  { id: "c_5", title: "Intro to Ball Handling", instructor: "Dre Washington", instructorInitials: "DW", category: "Handles", tier: "INCLUDED", lessonCount: 14, totalMinutes: 420, hero: "amber-court", summary: "From chest pass to hesitation combo — the complete handles curriculum for Player Core members." },
  { id: "c_6", title: "Vertical Jump Program", instructor: "Jae Park", instructorInitials: "JP", category: "Performance", tier: "PREMIUM", lessonCount: 24, totalMinutes: 720, price: 149, hero: "navy-court", summary: "12-week periodized program. Add 4–8 inches. Tested on 200+ athletes." },
  { id: "c_7", title: "Leadership on the Floor", instructor: "Tasha King", instructorInitials: "TK", category: "Mental", tier: "PREMIUM", lessonCount: 5, totalMinutes: 120, price: 49, hero: "white-court", summary: "Culture, communication, and how to be the captain your team needs." },
  { id: "c_8", title: "Modern Stretch-5 Offense", instructor: "Marcus Hunt", instructorInitials: "MH", category: "Bigs", tier: "PREMIUM", lessonCount: 7, totalMinutes: 210, price: 79, hero: "dusk-court", summary: "How today's centers read screens, space the floor, and attack closeouts." },
];

// ------------------------------ Live Classes ------------------------------
export type LiveEvent = {
  id: string;
  title: string;
  instructor: string;
  instructorInitials: string;
  startsAt: string;
  startsInHours: number; // negative = past
  intensity: "LOW" | "MEDIUM" | "HIGH" | "ELITE";
  category: string;
  durationMin: number;
  memberPrice: number;
  publicPrice: number;
  registered: number;
  capacity: number;
  posterBg: string;
};

export const liveEvents: LiveEvent[] = [
  { id: "le_1", title: "LIVE SHOOTING WORKOUT — Set Shot Sharpening", instructor: "Chris Brickley", instructorInitials: "CB", startsAt: "Today · 7:00 PM CT", startsInHours: 3, intensity: "MEDIUM", category: "Shooting", durationMin: 45, memberPrice: 0, publicPrice: 29, registered: 312, capacity: 500, posterBg: "amber" },
  { id: "le_2", title: "PG Mental Game — Reading Defenses Live", instructor: "Tasha King", instructorInitials: "TK", startsAt: "Tomorrow · 6:30 PM CT", startsInHours: 28, intensity: "LOW", category: "IQ", durationMin: 60, memberPrice: 19, publicPrice: 49, registered: 187, capacity: 300, posterBg: "indigo" },
  { id: "le_3", title: "Big Man Footwork Lab", instructor: "Marcus Hunt", instructorInitials: "MH", startsAt: "Wed · 5:00 PM CT", startsInHours: 72, intensity: "HIGH", category: "Bigs", durationMin: 50, memberPrice: 14, publicPrice: 39, registered: 94, capacity: 200, posterBg: "teal" },
  { id: "le_4", title: "ELITE Conditioning — 45 min death session", instructor: "Jae Park", instructorInitials: "JP", startsAt: "Thu · 6:00 AM CT", startsInHours: 86, intensity: "ELITE", category: "Conditioning", durationMin: 45, memberPrice: 0, publicPrice: 29, registered: 428, capacity: 800, posterBg: "red" },
  { id: "le_5", title: "Defense Clinic — Pick and Roll Coverages", instructor: "Coach Valdez", instructorInitials: "CV", startsAt: "Fri · 7:00 PM CT", startsInHours: 116, intensity: "MEDIUM", category: "Defense", durationMin: 55, memberPrice: 19, publicPrice: 49, registered: 214, capacity: 400, posterBg: "navy" },
  { id: "le_6", title: "Scoring Moves Masterclass", instructor: "Dre Washington", instructorInitials: "DW", startsAt: "Sat · 11:00 AM CT", startsInHours: 144, intensity: "HIGH", category: "Scoring", durationMin: 60, memberPrice: 24, publicPrice: 59, registered: 267, capacity: 400, posterBg: "amber" },
];

// ------------------------------ Billing ------------------------------
export const plans = [
  { id: "p_player", name: "Player Core", monthly: 19.99, annual: 199, features: ["Daily WODs · adaptive", "Unlimited AI feedback", "Skill track progression", "10 film assignments / month", "Included courses library"] },
  { id: "p_coach", name: "Coach Core", monthly: 49.99, annual: 499, features: ["Unlimited athletes", "Coach HQ dashboards", "Telestration + video review", "Assignment composer", "Practice plan builder", "Org shared library"] },
  { id: "p_team", name: "Team Pro", monthly: 9.99, annual: 99, features: ["Everything in Coach Core", "Seat-based · 20 seat min", "Athletes get 50% off Player Core", "Film Room + playbook", "Compliance dashboards", "SSO-ready"], perSeat: true },
];

// ------------------------------ Notifications ------------------------------
export const notifications = [
  { id: "n_1", type: "COACH_COMMENT", title: "Coach Reed commented on your video", detail: "Pull-Up Jumper Reps — Drive 1 · 0:37", href: "/app/player/uploads/vid_1", createdAt: "12 min ago", read: false },
  { id: "n_2", type: "AI_READY", title: "AI feedback ready", detail: "Handles — Cone Series · 3 observations", href: "/app/player/uploads/vid_2", createdAt: "2 hours ago", read: false },
  { id: "n_3", type: "STREAK", title: "Streak protected 🔥", detail: "14-day streak extended. Keep the fire alive.", href: "/app/player", createdAt: "4 hours ago", read: false },
  { id: "n_4", type: "FILM_ASSIGNED", title: "Coach assigned new film", detail: "Q3 — Pick & Roll Coverage vs. Westbury · due in 2 days", href: "/app/player/film", createdAt: "Yesterday", read: true },
  { id: "n_5", type: "LIVE_REMINDER", title: "Live class starts in 3 hours", detail: "Set Shot Sharpening with Chris Brickley", href: "/app/live/le_1", createdAt: "Today", read: true },
  { id: "n_6", type: "DISCOUNT", title: "Team discount active — 50% off Player Core", detail: "Because you play for Texas Elite Varsity.", href: "/app/player/settings/billing", createdAt: "3 weeks ago", read: true },
];

// ------------------------------ Audit Log ------------------------------
export const auditLog = [
  { id: "al_1", actor: "Alex Rivera", actorRole: "SUPER_ADMIN", action: "IMPERSONATION_START", target: "Jalen Carter (u_athlete_1)", reason: "Zendesk #3841 — video upload not processing", ts: "14 min ago" },
  { id: "al_2", actor: "Alex Rivera", actorRole: "SUPER_ADMIN", action: "IMPERSONATION_END", target: "Jalen Carter (u_athlete_1)", reason: "Resolved — webhook redelivery fixed", ts: "8 min ago" },
  { id: "al_3", actor: "Stripe Webhook", actorRole: "SYSTEM", action: "SUBSCRIPTION_ACTIVATED", target: "Marcus Williams — player_core_monthly", reason: "invoice.paid", ts: "32 min ago" },
  { id: "al_4", actor: "Coach Reed", actorRole: "COACH", action: "ATHLETE_INVITED", target: "new_athlete@email · Texas Elite Varsity", reason: "Roster add", ts: "1 hour ago" },
  { id: "al_5", actor: "Entitlement Service", actorRole: "SYSTEM", action: "DISCOUNT_GRANTED", target: "Khalil Jenkins · TEAM_DISCOUNT_50", reason: "Joined roster — team_varsity", ts: "1 hour ago" },
  { id: "al_6", actor: "Alex Rivera", actorRole: "SUPER_ADMIN", action: "REFUND_ISSUED", target: "Booking bk_21 — $249", reason: "Expert no-show — Goodwill refund", ts: "3 hours ago" },
  { id: "al_7", actor: "Alex Rivera", actorRole: "SUPER_ADMIN", action: "EXPERT_VERIFIED", target: "Tasha King (ex_2)", reason: "Background check passed · Stripe Connect onboarded", ts: "Yesterday" },
  { id: "al_8", actor: "Diana Okafor", actorRole: "TEAM_ADMIN", action: "SEAT_COUNT_INCREASED", target: "Texas Elite — 20 → 25 seats", reason: "JV varsity callup", ts: "2 days ago" },
];

// ------------------------------ Moderation queue ------------------------------
export const moderationQueue = [
  { id: "mq_1", priority: "CHILD_SAFETY", type: "MESSAGE", content: "Flagged DM between adult expert and minor — parent not cc'd", reporter: "AutoFlag", age: "6 min ago" },
  { id: "mq_2", priority: "HIGH", type: "REVIEW", content: "1-star review contains profanity — 'Chris Brickley is a f***ing scammer'", reporter: "User report", age: "2 hours ago" },
  { id: "mq_3", priority: "MEDIUM", type: "EXPERT_APPLICATION", content: "Expert application — credentials unverified", reporter: "System", age: "Yesterday" },
  { id: "mq_4", priority: "LOW", type: "COMMENT", content: "Trash talk in film room comment thread", reporter: "User report", age: "2 days ago" },
];
