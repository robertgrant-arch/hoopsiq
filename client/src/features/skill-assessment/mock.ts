/**
 * Skill Assessment mock data for HoopsOS.
 *
 * Defines the 8-category assessment protocol, level criteria,
 * and historical assessment records for the demo player roster.
 *
 * Used by: SkillAssessmentPage (coach), AssessmentHistoryPage (player)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillCategory =
  | "ball_handling"
  | "shooting"
  | "finishing"
  | "defense"
  | "footwork"
  | "iq_reads"
  | "athleticism"
  | "conditioning";

export type AssessmentType = "structured" | "coach_rated" | "game_performance";

export type LevelCriteria = {
  level: 1 | 2 | 3 | 4 | 5;
  label: "Foundational" | "Developing" | "Applied" | "Proficient" | "Elite";
  criteria: string[];
  typicalRange: string;
};

export type SkillProtocol = {
  category: SkillCategory;
  label: string;
  drillName: string;
  measurementMethod: string;
  timeRequired: number;
  videoRequired: boolean;
  levels: LevelCriteria[];
};

export type AssessmentResult = {
  category: SkillCategory;
  level: 1 | 2 | 3 | 4 | 5;
  score: number;
  priorLevel?: number;
  priorScore?: number;
  delta: number;
  notes?: string;
  evidenceFilmId?: string;
  verifiedByCoach: boolean;
};

export type SkillAssessment = {
  id: string;
  playerId: string;
  playerName: string;
  assessorId: string;
  assessorName: string;
  assessmentType: AssessmentType;
  season: string;
  week: number;
  assessedAt: string;
  results: AssessmentResult[];
  overallDelta: number;
  coachSummary?: string;
  parentVisible: boolean;
};

// ─── Label Maps ───────────────────────────────────────────────────────────────

export const LEVEL_LABELS: Record<number, string> = {
  1: "Foundational",
  2: "Developing",
  3: "Applied",
  4: "Proficient",
  5: "Elite",
};

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  ball_handling: "Ball Handling",
  shooting: "Shooting",
  finishing: "Finishing",
  defense: "Defense",
  footwork: "Footwork",
  iq_reads: "IQ & Reads",
  athleticism: "Athleticism",
  conditioning: "Conditioning",
};

// ─── Skill Protocols ──────────────────────────────────────────────────────────

export const skillProtocols: SkillProtocol[] = [
  {
    category: "ball_handling",
    label: "Ball Handling",
    drillName: "Cone Dribble Circuit",
    measurementMethod: "Timed (seconds to complete 5-cone weave, best of 3 attempts)",
    timeRequired: 8,
    videoRequired: false,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "Keeps eyes on the ball while dribbling",
          "Can dribble stationary with dominant hand only",
          "Loses control when attempting direction changes",
          "Unable to dribble at pace through a 5-cone weave",
        ],
        typicalRange: "10U–12U beginners, or players new to organized ball",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "Can dribble with both hands stationary at moderate pace",
          "Executes basic crossover without losing control",
          "Completes 5-cone weave >18 seconds with occasional drops",
          "Uses eyes-up dribble in straight lines, not under pressure",
        ],
        typicalRange: "12U–14U with 1–2 seasons of experience",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "Completes 5-cone weave in 13–17 seconds consistently",
          "Executes between-the-legs and behind-the-back moves at half speed",
          "Maintains handle while scanning the floor in open space",
          "Can change speeds with the dribble in isolation situations",
        ],
        typicalRange: "14U–16U with regular training; HS JV level",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "Completes 5-cone weave in 10–12 seconds with clean handles",
          "Uses combo moves (cross-behind, hesi-cross) under light defensive pressure",
          "Keeps eyes up and reads defenders while dribbling at game speed",
          "Can protect ball and navigate tight spaces against active defenders",
        ],
        typicalRange: "HS Varsity; travel 16U–17U competitive level",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "Completes 5-cone weave under 10 seconds with either hand",
          "Creates separation with advanced moves (snake, spin, hesitation cross) at full speed",
          "Reads and reacts to defensive positioning while in live dribble",
          "Breaks down on-ball defenders consistently in live game scenarios",
        ],
        typicalRange: "High-level HS / college prep; showcase-level prospects",
      },
    ],
  },
  {
    category: "shooting",
    label: "Shooting",
    drillName: "5-Spot Shooting Test",
    measurementMethod: "Conversion rate (makes / 25 attempts) across 5 spots; spot-up and off-movement",
    timeRequired: 10,
    videoRequired: false,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "Makes fewer than 5 of 25 spot-up attempts",
          "Inconsistent release point; elbow flares significantly",
          "No repeatable shooting motion established",
          "Off-balance on most shots; no base or leg involvement",
        ],
        typicalRange: "10U–12U, or players new to the shooting motion",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "Makes 5–10 of 25 spot-up attempts (20–40%)",
          "Beginning to develop a repeatable set point",
          "Can make paint-area shots with some consistency",
          "Shooting off a pass requires a slow gather before releasing",
        ],
        typicalRange: "12U–14U with some shooting instruction",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "Makes 10–16 of 25 spot-up attempts (40–64%)",
          "Consistent form on mid-range and 3-point spot-ups",
          "Can shoot off one dribble pull-up at moderate speed",
          "Form breaks down under defensive pressure or game fatigue",
        ],
        typicalRange: "14U–16U with regular shooting work; JV players",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "Makes 16–21 of 25 attempts (64–84%) across all 5 spots",
          "Consistent release and footwork on movement shots (DHO, curl)",
          "Shoots confidently off the dribble from mid-range",
          "Maintains form under moderate defensive contest",
        ],
        typicalRange: "HS Varsity shooter; competitive travel 16U–17U",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "Makes 21+ of 25 attempts (84%+) on spot-up test",
          "Hits contested 3s off movement with consistent mechanics",
          "Uses shot fakes and create-off-dribble with high release efficiency",
          "Replicates shooting form with identical results under live game pressure",
        ],
        typicalRange: "Elite HS / college prospect; D1-caliber shooting",
      },
    ],
  },
  {
    category: "finishing",
    label: "Finishing",
    drillName: "Layup Conversion Circuit",
    measurementMethod: "% of layups made (both hands) + floater conversion rate; 20 total attempts",
    timeRequired: 8,
    videoRequired: false,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "Converts standard right-hand layup at jogging pace 50% or less",
          "Cannot execute left-hand layup with correct footwork",
          "No awareness of body control or jump angle at the rim",
          "Drifts away from backboard on most attempts",
        ],
        typicalRange: "10U–12U; players first learning layup footwork",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "Converts dominant-hand layups at 60–70% at jogging pace",
          "Attempting weak-hand layups but footwork breaks down at speed",
          "Basic Mikan drill completed without misses on dominant side",
          "Cannot convert through contact or at high speed",
        ],
        typicalRange: "12U–14U with 1–2 seasons of rep work",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "Converts 70–80% on both-hand layup circuit at game pace",
          "Makes floater attempt from 6–10 ft. in open situations",
          "Adjusts body angle in air to avoid shot-blocking position",
          "Attacks basket off 1 or 2 dribbles from the wing consistently",
        ],
        typicalRange: "14U–16U; HS JV-level finishers",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "Converts 80–90% on full circuit including floaters",
          "Finishes through light contact with balance and body control",
          "Executes reverse layups and euro-step off live dribble",
          "Reads shot-blocker positioning before releasing in traffic",
        ],
        typicalRange: "HS Varsity; 16U–17U travel competitive level",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "Converts 90%+ on both-hands-plus-floater circuit",
          "Finishes through hard contact and draws fouls at a high rate",
          "Multiple finishing packages: scoop, tear-drop, reverse, euro-step",
          "Creates and converts in traffic against live defensive resistance",
        ],
        typicalRange: "Elite HS finishers; college-ready contact-finishers",
      },
    ],
  },
  {
    category: "defense",
    label: "Defense",
    drillName: "Closeout + On-Ball Defense",
    measurementMethod: "Coach-rated 1–5 on closeout technique, on-ball stance, and contest quality (live reps)",
    timeRequired: 12,
    videoRequired: true,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "Stands upright with minimal defensive stance",
          "Runs through shooter on closeouts without a high hand",
          "Cannot stay in front of ball handler for more than 1–2 dribbles",
          "No awareness of help-side positioning",
        ],
        typicalRange: "10U–12U; players new to structured defensive concepts",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "Assumes low defensive stance when reminded",
          "Closes out to 2–3 feet with hand up on catch",
          "Moves feet on ball handler but gets beaten by crossover",
          "Beginning to understand gap positioning vs. on-ball",
        ],
        typicalRange: "12U–14U with 1–2 seasons of defensive coaching",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "Maintains defensive stance for full possession without reminders",
          "Executes functional closeout: high hand, controlled approach",
          "Stays in front of average ball handlers for multiple dribbles",
          "Recovers to lane after helping on drives at moderate speed",
        ],
        typicalRange: "14U–16U competitive; JV-level defenders",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "Forces difficult shots on 70%+ of live 1-on-1 defensive reps",
          "Quick slide-step recovery on live crossovers with no drop step",
          "Closes out to contest without fouling or over-committing",
          "Active hands in passing lanes without gambling and leaving assignment",
        ],
        typicalRange: "HS Varsity-level defender; impactful on-ball stopper",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "Locks up above-average offensive players consistently in live reps",
          "Anticipates dribble direction and forces weak-side or out-of-bounds",
          "Takes charges and makes rotations without coach verbal cues",
          "Brings consistent defensive energy that changes opponent shot selection",
        ],
        typicalRange: "Elite HS defender; can guard multiple positions",
      },
    ],
  },
  {
    category: "footwork",
    label: "Footwork",
    drillName: "Pivot & Jab-Step Sequence",
    measurementMethod: "Coach-rated sequence: forward/reverse pivot, jab-step drive, screen navigation (5 reps each)",
    timeRequired: 10,
    videoRequired: true,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "Travels on most pivot attempts when pressured",
          "Cannot execute a clean jab step without losing balance",
          "Runs into screens rather than going over or under",
          "No established triple-threat stance",
        ],
        typicalRange: "10U–12U; players without footwork fundamentals training",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "Executes forward pivot without travel when moving slowly",
          "Jab step is shallow and doesn't create meaningful separation",
          "Recognizes screens but footwork reaction is slow",
          "Holds triple-threat when stationary; breaks down at game speed",
        ],
        typicalRange: "12U–14U with basic footwork coaching",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "Clean forward and reverse pivot in stationary and moving situations",
          "Jab-cross and jab-drive sequence executed without travel 80% of reps",
          "Navigates standard ball-screens using correct over/under technique",
          "Uses drop step in post with correct footwork on both sides",
        ],
        typicalRange: "14U–16U; JV-to-Varsity transition level",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "All pivot types (forward, reverse, hop step) executed under live pressure",
          "Jab-step creates measurable separation leading to scoring opportunities",
          "Fights through or goes under screens based on scouting report read",
          "Uses shot-fake footwork (pump-fake into drive) with legal pivot",
        ],
        typicalRange: "HS Varsity; footwork as a consistent offensive weapon",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "Advanced footwork (spin move, dream shake, hop-step) at full game speed",
          "Footwork arsenal creates high-percentage scoring in post and mid-range",
          "Navigates complex screen actions (flare, down, Spain) without defensive error",
          "Footwork advantages exploited consistently against D1-caliber athletes",
        ],
        typicalRange: "Elite HS / college-ready footwork; position-versatile",
      },
    ],
  },
  {
    category: "iq_reads",
    label: "IQ & Reads",
    drillName: "Pick-and-Roll Decision Film Review",
    measurementMethod: "Coach-rated from 10 tagged film clips: correct read (pass vs. pull vs. reject) + execution quality",
    timeRequired: 15,
    videoRequired: true,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "Reads primarily one option (usually drive) regardless of defense",
          "Cannot identify whether screener's defender dropped or hedged",
          "Off-ball movement is random; not reading the defense",
          "Frequent turnover from forcing decisions against misread coverage",
        ],
        typicalRange: "10U–12U; players learning basic offensive concepts",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "Identifies 2-option read (score vs. kick) in simple P&R situations",
          "Begins to recognize when roller is open at rim vs. when to pull back",
          "Off-ball cuts are predetermined rather than reading defender",
          "Makes correct read 40–55% of tagged P&R film possessions",
        ],
        typicalRange: "12U–14U with tactical coaching and film study",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "Correctly reads 3 P&R coverage types: drop, hedge, and switch",
          "Makes correct decision on 60–75% of tagged film possessions",
          "Identifies when to reject the screen vs. use it based on defender angle",
          "Off-ball movement shows anticipation of ball movement in half-court",
        ],
        typicalRange: "14U–16U with regular film study sessions",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "Correctly reads 5+ coverage types including ICE, blitz, and switch",
          "Makes correct decision and executes on 75–85% of tagged possessions",
          "Anticipates second-side rotations and swings ball ahead of rotation",
          "Proactively calls out coverages and sets up teammates off film study",
        ],
        typicalRange: "HS Varsity floor general; high-IQ point guard level",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "Reads and exploits all coverage types in real time at game speed",
          "Correct read and execution on 85%+ of tagged film possessions",
          "Creates advantage through pre-snap ball movement based on defensive alignment",
          "Teaches teammates positioning and reads during practice without prompting",
        ],
        typicalRange: "College-bound playmakers; elite HS floor generals",
      },
    ],
  },
  {
    category: "athleticism",
    label: "Athleticism",
    drillName: "Athletic Testing Battery",
    measurementMethod: "Vertical (reach at peak), lane agility time (NBAC protocol), 3/4-court sprint (seconds)",
    timeRequired: 20,
    videoRequired: false,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "Vertical jump under 16 inches",
          "Lane agility time over 14 seconds",
          "3/4-court sprint over 4.0 seconds",
          "Limited first-step quickness; slow lateral acceleration",
        ],
        typicalRange: "10U–12U; pre-development athletic baseline",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "Vertical jump 16–20 inches",
          "Lane agility time 13.0–14.0 seconds",
          "3/4-court sprint 3.7–4.0 seconds",
          "Noticeable first step but limited change-of-direction efficiency",
        ],
        typicalRange: "12U–14U in growth phase; early athletic development",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "Vertical jump 21–26 inches",
          "Lane agility time 11.5–13.0 seconds",
          "3/4-court sprint 3.4–3.7 seconds",
          "Good first step; consistent lateral quickness in closeout/recovery",
        ],
        typicalRange: "14U–16U; JV-to-Varsity athletic level",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "Vertical jump 27–32 inches",
          "Lane agility time 10.5–11.5 seconds",
          "3/4-court sprint 3.1–3.4 seconds",
          "Explosive first step; covers ground laterally at elite HS rate",
        ],
        typicalRange: "HS Varsity athlete; above-average for age group",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "Vertical jump 33+ inches",
          "Lane agility time under 10.5 seconds",
          "3/4-court sprint under 3.1 seconds",
          "Exceptional explosion and quickness; stands out at any level showcases",
        ],
        typicalRange: "Elite HS / college prospect; physical outlier",
      },
    ],
  },
  {
    category: "conditioning",
    label: "Conditioning",
    drillName: "Court Sprints + Mile Run",
    measurementMethod: "16 court-length sprints (total time in minutes) + timed 1-mile run",
    timeRequired: 15,
    videoRequired: false,
    levels: [
      {
        level: 1,
        label: "Foundational",
        criteria: [
          "16 court sprints completed in over 7:00 minutes total",
          "Mile run over 9:00",
          "Visibly winded after 2–3 possessions at full intensity",
          "Performance drops significantly in 3rd and 4th quarters",
        ],
        typicalRange: "10U–12U; players without structured conditioning",
      },
      {
        level: 2,
        label: "Developing",
        criteria: [
          "16 court sprints completed in 6:00–7:00 minutes",
          "Mile run 8:00–9:00",
          "Can sustain full effort for 1 full half; noticeable drop-off in 4th quarter",
          "Recovers between possessions with 30–45 seconds rest",
        ],
        typicalRange: "12U–14U with basic fitness training",
      },
      {
        level: 3,
        label: "Applied",
        criteria: [
          "16 court sprints completed in 5:00–6:00 minutes",
          "Mile run 7:00–8:00",
          "Sustains quality effort for 3 full quarters without fatigue-related errors",
          "Recovers between plays in 15–30 seconds during scrimmage",
        ],
        typicalRange: "14U–16U with regular conditioning work",
      },
      {
        level: 4,
        label: "Proficient",
        criteria: [
          "16 court sprints completed in 4:00–5:00 minutes",
          "Mile run 6:30–7:00",
          "Maintains skill execution and communication across all 4 quarters",
          "Recovers between plays in under 15 seconds; ready on every possession",
        ],
        typicalRange: "HS Varsity-level conditioning; in-season readiness",
      },
      {
        level: 5,
        label: "Elite",
        criteria: [
          "16 court sprints completed in under 4:00 minutes",
          "Mile run under 6:30",
          "No measurable performance decline across game length or double-headers",
          "Maintains explosive athleticism and decision quality in overtime situations",
        ],
        typicalRange: "Elite HS / college-ready conditioning; outlier fitness",
      },
    ],
  },
];

// ─── Player Assessment Records ────────────────────────────────────────────────

export const playerAssessments: SkillAssessment[] = [
  // ── Malik Henderson (p10) — 3 assessments, strong improving trend ──────────
  {
    id: "sa_p10_w04",
    playerId: "p10",
    playerName: "Malik Henderson",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 4,
    assessedAt: "2026-02-14T10:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 62, delta: 0, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 55, delta: 0, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 48, delta: 0, verifiedByCoach: true },
      { category: "defense", level: 2, score: 72, delta: 0, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 41, delta: 0, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 58, delta: 0, verifiedByCoach: true },
      { category: "athleticism", level: 4, score: 44, delta: 0, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 70, delta: 0, verifiedByCoach: true },
    ],
    overallDelta: 0,
    coachSummary: "Baseline assessment for 2025-26 season. Strong athleticism, needs IDP focus on finishing and footwork.",
    parentVisible: true,
  },
  {
    id: "sa_p10_w14",
    playerId: "p10",
    playerName: "Malik Henderson",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 14,
    assessedAt: "2026-04-03T10:00:00Z",
    results: [
      { category: "ball_handling", level: 4, score: 38, priorLevel: 3, priorScore: 62, delta: 76, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 74, priorLevel: 3, priorScore: 55, delta: 19, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 81, priorLevel: 3, priorScore: 48, delta: 33, verifiedByCoach: true },
      { category: "defense", level: 3, score: 44, priorLevel: 2, priorScore: 72, delta: 72, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 68, priorLevel: 3, priorScore: 41, delta: 27, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 77, priorLevel: 3, priorScore: 58, delta: 19, verifiedByCoach: true },
      { category: "athleticism", level: 4, score: 62, priorLevel: 4, priorScore: 44, delta: 18, verifiedByCoach: true },
      { category: "conditioning", level: 4, score: 31, priorLevel: 3, priorScore: 70, delta: 61, verifiedByCoach: true },
    ],
    overallDelta: 40.6,
    coachSummary: "Significant jump in ball handling — cone drill time dropped 2.1 seconds. Defense improved after zone rotations work. Finishing and conditioning both trending up. Malik is our most improved player this cycle.",
    parentVisible: true,
  },
  {
    id: "sa_p10_w20",
    playerId: "p10",
    playerName: "Malik Henderson",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 20,
    assessedAt: "2026-05-08T10:00:00Z",
    results: [
      { category: "ball_handling", level: 4, score: 71, priorLevel: 4, priorScore: 38, delta: 33, verifiedByCoach: true, notes: "Cone drill 11.2s both hands" },
      { category: "shooting", level: 4, score: 22, priorLevel: 3, priorScore: 74, delta: 48, verifiedByCoach: true },
      { category: "finishing", level: 4, score: 18, priorLevel: 3, priorScore: 81, delta: 37, verifiedByCoach: true, evidenceFilmId: "film_c14" },
      { category: "defense", level: 3, score: 59, priorLevel: 3, priorScore: 44, delta: 15, verifiedByCoach: true },
      { category: "footwork", level: 4, score: 12, priorLevel: 3, priorScore: 68, delta: 44, verifiedByCoach: true },
      { category: "iq_reads", level: 4, score: 8, priorLevel: 3, priorScore: 77, delta: 31, verifiedByCoach: true },
      { category: "athleticism", level: 4, score: 74, priorLevel: 4, priorScore: 62, delta: 12, verifiedByCoach: true },
      { category: "conditioning", level: 4, score: 55, priorLevel: 4, priorScore: 31, delta: 24, verifiedByCoach: true },
    ],
    overallDelta: 30.5,
    coachSummary: "Malik has broken into Level 4 territory in 5 categories. Shooting and footwork breakthroughs this week. Ready for showcase events. Focus area for post-season: IQ refinement on blitz coverage.",
    parentVisible: true,
  },

  // ── Jaylen Scott (p6) — 3 assessments, steady improvement ──────────────────
  {
    id: "sa_p6_w04",
    playerId: "p6",
    playerName: "Jaylen Scott",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 4,
    assessedAt: "2026-02-14T11:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 44, delta: 0, verifiedByCoach: true },
      { category: "shooting", level: 4, score: 31, delta: 0, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 55, delta: 0, verifiedByCoach: true },
      { category: "defense", level: 3, score: 38, delta: 0, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 60, delta: 0, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 42, delta: 0, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 78, delta: 0, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 55, delta: 0, verifiedByCoach: true },
    ],
    overallDelta: 0,
    coachSummary: "Baseline — strong shooter, needs on-ball defensive commitment. Good base for season.",
    parentVisible: true,
  },
  {
    id: "sa_p6_w14",
    playerId: "p6",
    playerName: "Jaylen Scott",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "game_performance",
    season: "2025-26",
    week: 14,
    assessedAt: "2026-04-04T09:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 58, priorLevel: 3, priorScore: 44, delta: 14, verifiedByCoach: true },
      { category: "shooting", level: 4, score: 51, priorLevel: 4, priorScore: 31, delta: 20, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 71, priorLevel: 3, priorScore: 55, delta: 16, verifiedByCoach: true },
      { category: "defense", level: 3, score: 55, priorLevel: 3, priorScore: 38, delta: 17, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 72, priorLevel: 3, priorScore: 60, delta: 12, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 61, priorLevel: 3, priorScore: 42, delta: 19, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 84, priorLevel: 3, priorScore: 78, delta: 6, verifiedByCoach: true },
      { category: "conditioning", level: 4, score: 18, priorLevel: 3, priorScore: 55, delta: 63, verifiedByCoach: true },
    ],
    overallDelta: 20.9,
    coachSummary: "Conditioning breakout — Jaylen's sprint times improved dramatically. Shooting and finishing solid. Defense still the gap to close for a Level 4 profile.",
    parentVisible: true,
  },
  {
    id: "sa_p6_w20",
    playerId: "p6",
    playerName: "Jaylen Scott",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 20,
    assessedAt: "2026-05-09T09:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 69, priorLevel: 3, priorScore: 58, delta: 11, verifiedByCoach: true },
      { category: "shooting", level: 4, score: 68, priorLevel: 4, priorScore: 51, delta: 17, verifiedByCoach: true },
      { category: "finishing", level: 4, score: 14, priorLevel: 3, priorScore: 71, delta: 43, verifiedByCoach: true },
      { category: "defense", level: 3, score: 66, priorLevel: 3, priorScore: 55, delta: 11, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 80, priorLevel: 3, priorScore: 72, delta: 8, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 75, priorLevel: 3, priorScore: 61, delta: 14, verifiedByCoach: true },
      { category: "athleticism", level: 4, score: 22, priorLevel: 3, priorScore: 84, delta: 38, verifiedByCoach: true },
      { category: "conditioning", level: 4, score: 35, priorLevel: 4, priorScore: 18, delta: 17, verifiedByCoach: true },
    ],
    overallDelta: 19.9,
    coachSummary: "Finishing and athleticism level-ups are huge. Jaylen's becoming a 4-category Level-4 player. Goal for summer: break shooting into Level 5 range.",
    parentVisible: true,
  },

  // ── Noah Rivera (p8) — 2 assessments, plateauing ────────────────────────────
  {
    id: "sa_p8_w04",
    playerId: "p8",
    playerName: "Noah Rivera",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 4,
    assessedAt: "2026-02-14T12:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 50, delta: 0, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 48, delta: 0, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 52, delta: 0, verifiedByCoach: true },
      { category: "defense", level: 3, score: 45, delta: 0, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 40, delta: 0, verifiedByCoach: true },
      { category: "iq_reads", level: 2, score: 80, delta: 0, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 55, delta: 0, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 48, delta: 0, verifiedByCoach: true },
    ],
    overallDelta: 0,
    coachSummary: "Solid all-around but no standout category. IQ is the gap — needs film study work.",
    parentVisible: true,
  },
  {
    id: "sa_p8_w20",
    playerId: "p8",
    playerName: "Noah Rivera",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 20,
    assessedAt: "2026-05-09T11:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 55, priorLevel: 3, priorScore: 50, delta: 5, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 51, priorLevel: 3, priorScore: 48, delta: 3, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 58, priorLevel: 3, priorScore: 52, delta: 6, verifiedByCoach: true },
      { category: "defense", level: 3, score: 48, priorLevel: 3, priorScore: 45, delta: 3, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 44, priorLevel: 3, priorScore: 40, delta: 4, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 21, priorLevel: 2, priorScore: 80, delta: 41, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 57, priorLevel: 3, priorScore: 55, delta: 2, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 52, priorLevel: 3, priorScore: 48, delta: 4, verifiedByCoach: true },
    ],
    overallDelta: 8.5,
    coachSummary: "IQ reads level-up is positive, but most categories plateauing within Level 3. Noah needs an IDP goal that pushes outside comfort zone. Physical tools are there — effort and study hours are the variable.",
    parentVisible: true,
  },

  // ── Tyler Brooks (p3) — 2 assessments, declining ────────────────────────────
  {
    id: "sa_p3_w04",
    playerId: "p3",
    playerName: "Tyler Brooks",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 4,
    assessedAt: "2026-02-15T10:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 41, delta: 0, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 38, delta: 0, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 60, delta: 0, verifiedByCoach: true },
      { category: "defense", level: 3, score: 55, delta: 0, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 48, delta: 0, verifiedByCoach: true },
      { category: "iq_reads", level: 2, score: 65, delta: 0, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 62, delta: 0, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 44, delta: 0, verifiedByCoach: true },
    ],
    overallDelta: 0,
    coachSummary: "Decent baseline. Finishing is the strength. Low attendance is a concern already — needs accountability structure.",
    parentVisible: true,
  },
  {
    id: "sa_p3_w20",
    playerId: "p3",
    playerName: "Tyler Brooks",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "coach_rated",
    season: "2025-26",
    week: 20,
    assessedAt: "2026-05-10T10:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 35, priorLevel: 3, priorScore: 41, delta: -6, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 28, priorLevel: 3, priorScore: 38, delta: -10, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 50, priorLevel: 3, priorScore: 60, delta: -10, verifiedByCoach: true },
      { category: "defense", level: 2, score: 70, priorLevel: 3, priorScore: 55, delta: -85, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 38, priorLevel: 3, priorScore: 48, delta: -10, verifiedByCoach: true },
      { category: "iq_reads", level: 2, score: 50, priorLevel: 2, priorScore: 65, delta: -15, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 44, priorLevel: 3, priorScore: 62, delta: -18, verifiedByCoach: true },
      { category: "conditioning", level: 2, score: 55, priorLevel: 3, priorScore: 44, delta: -89, verifiedByCoach: true },
    ],
    overallDelta: -30.4,
    coachSummary: "Declining across the board. Attendance issues have compounded — conditioning and defense regressions are significant. Recommending family check-in and re-establishing baseline commitments before next assessment.",
    parentVisible: false,
  },

  // ── Cam Porter (p7) — 2 assessments, slow improvement ───────────────────────
  {
    id: "sa_p7_w04",
    playerId: "p7",
    playerName: "Cam Porter",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 4,
    assessedAt: "2026-02-15T11:00:00Z",
    results: [
      { category: "ball_handling", level: 2, score: 70, delta: 0, verifiedByCoach: true },
      { category: "shooting", level: 2, score: 55, delta: 0, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 62, delta: 0, verifiedByCoach: true },
      { category: "defense", level: 3, score: 58, delta: 0, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 44, delta: 0, verifiedByCoach: true },
      { category: "iq_reads", level: 2, score: 45, delta: 0, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 50, delta: 0, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 60, delta: 0, verifiedByCoach: true },
    ],
    overallDelta: 0,
    coachSummary: "Big man baseline — finishing and defense are strong. Needs handle development for stretch-5 role.",
    parentVisible: true,
  },
  {
    id: "sa_p7_w20",
    playerId: "p7",
    playerName: "Cam Porter",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 20,
    assessedAt: "2026-05-10T11:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 18, priorLevel: 2, priorScore: 70, delta: 48, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 22, priorLevel: 2, priorScore: 55, delta: 67, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 75, priorLevel: 3, priorScore: 62, delta: 13, verifiedByCoach: true },
      { category: "defense", level: 3, score: 72, priorLevel: 3, priorScore: 58, delta: 14, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 55, priorLevel: 3, priorScore: 44, delta: 11, verifiedByCoach: true },
      { category: "iq_reads", level: 2, score: 60, priorLevel: 2, priorScore: 45, delta: 15, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 62, priorLevel: 3, priorScore: 50, delta: 12, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 68, priorLevel: 3, priorScore: 60, delta: 8, verifiedByCoach: true },
    ],
    overallDelta: 23.5,
    coachSummary: "Cam's handle work paid off — Level 3 in both ball handling and shooting. Steady improvement across the board. IQ reads still needs development for his playmaking role.",
    parentVisible: true,
  },

  // ── Brandon Lee (p12) — 3 assessments, strong progression ──────────────────
  {
    id: "sa_p12_w02",
    playerId: "p12",
    playerName: "Brandon Lee",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 2,
    assessedAt: "2026-02-01T09:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 55, delta: 0, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 60, delta: 0, verifiedByCoach: true },
      { category: "finishing", level: 2, score: 75, delta: 0, verifiedByCoach: true },
      { category: "defense", level: 2, score: 60, delta: 0, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 50, delta: 0, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 45, delta: 0, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 58, delta: 0, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 52, delta: 0, verifiedByCoach: true },
    ],
    overallDelta: 0,
    coachSummary: "Exceptional baseline for 15U — already showing Level 3 maturity in most categories. High ceiling. Priority: finishing and defense to reach Level 3 in all categories.",
    parentVisible: true,
  },
  {
    id: "sa_p12_w10",
    playerId: "p12",
    playerName: "Brandon Lee",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 10,
    assessedAt: "2026-03-14T09:00:00Z",
    results: [
      { category: "ball_handling", level: 3, score: 78, priorLevel: 3, priorScore: 55, delta: 23, verifiedByCoach: true },
      { category: "shooting", level: 3, score: 82, priorLevel: 3, priorScore: 60, delta: 22, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 30, priorLevel: 2, priorScore: 75, delta: 55, verifiedByCoach: true },
      { category: "defense", level: 3, score: 28, priorLevel: 2, priorScore: 60, delta: 68, verifiedByCoach: true },
      { category: "footwork", level: 3, score: 65, priorLevel: 3, priorScore: 50, delta: 15, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 62, priorLevel: 3, priorScore: 45, delta: 17, verifiedByCoach: true },
      { category: "athleticism", level: 3, score: 72, priorLevel: 3, priorScore: 58, delta: 14, verifiedByCoach: true },
      { category: "conditioning", level: 3, score: 68, priorLevel: 3, priorScore: 52, delta: 16, verifiedByCoach: true },
    ],
    overallDelta: 28.75,
    coachSummary: "Brandon leveled up finishing and defense to Level 3 — all 8 categories now at Level 3 or above. This is exceptional for a 15U player at week 10. Projecting Level 4 across 3+ categories by end of season.",
    parentVisible: true,
  },
  {
    id: "sa_p12_w20",
    playerId: "p12",
    playerName: "Brandon Lee",
    assessorId: "u_coach_1",
    assessorName: "Bob Grant",
    assessmentType: "structured",
    season: "2025-26",
    week: 20,
    assessedAt: "2026-05-10T09:00:00Z",
    results: [
      { category: "ball_handling", level: 4, score: 25, priorLevel: 3, priorScore: 78, delta: 47, verifiedByCoach: true },
      { category: "shooting", level: 4, score: 18, priorLevel: 3, priorScore: 82, delta: 36, verifiedByCoach: true },
      { category: "finishing", level: 3, score: 75, priorLevel: 3, priorScore: 30, delta: 45, verifiedByCoach: true },
      { category: "defense", level: 3, score: 60, priorLevel: 3, priorScore: 28, delta: 32, verifiedByCoach: true },
      { category: "footwork", level: 4, score: 14, priorLevel: 3, priorScore: 65, delta: 49, verifiedByCoach: true },
      { category: "iq_reads", level: 3, score: 80, priorLevel: 3, priorScore: 62, delta: 18, verifiedByCoach: true },
      { category: "athleticism", level: 4, score: 10, priorLevel: 3, priorScore: 72, delta: 38, verifiedByCoach: true },
      { category: "conditioning", level: 4, score: 20, priorLevel: 3, priorScore: 68, delta: 52, verifiedByCoach: true },
    ],
    overallDelta: 39.6,
    coachSummary: "Brandon is on a historic development trajectory for 15U. Five Level 4 categories at the end of his first full season. Recommending 17U program consideration for fall. Special player.",
    parentVisible: true,
  },
];

// ─── Latest Assessments Lookup ────────────────────────────────────────────────

export const latestAssessmentsByPlayer: Record<string, SkillAssessment> = {
  p10: playerAssessments.find((a) => a.id === "sa_p10_w20")!,
  p6: playerAssessments.find((a) => a.id === "sa_p6_w20")!,
  p8: playerAssessments.find((a) => a.id === "sa_p8_w20")!,
  p3: playerAssessments.find((a) => a.id === "sa_p3_w20")!,
  p7: playerAssessments.find((a) => a.id === "sa_p7_w20")!,
  p12: playerAssessments.find((a) => a.id === "sa_p12_w20")!,
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getAssessmentHistory(playerId: string): SkillAssessment[] {
  return playerAssessments
    .filter((a) => a.playerId === playerId)
    .sort((a, b) => new Date(a.assessedAt).getTime() - new Date(b.assessedAt).getTime());
}

export function getSkillDelta(playerId: string, category: SkillCategory): number {
  const latest = latestAssessmentsByPlayer[playerId];
  if (!latest) return 0;
  const result = latest.results.find((r) => r.category === category);
  return result?.delta ?? 0;
}

export function getLevelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? "Unknown";
}

export function getCategoryLabel(category: SkillCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}
