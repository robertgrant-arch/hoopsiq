/**
 * Coaching Education mock data.
 *
 * Structured learning tracks for coaches. Each course has lessons that end
 * with a "Try it now" action that links to a real HoopsOS tool.
 * Used by: CoachLearnPage (/app/learn), CoursePage (/app/learn/courses/:id).
 */

export type CourseLevel = "foundation" | "intermediate" | "advanced";
export type CourseCategory =
  | "player_development"
  | "practice_design"
  | "offensive_systems"
  | "defensive_systems"
  | "communication"
  | "program_building"
  | "film_and_analysis";

export type LessonActionType =
  | "open_wod_builder"
  | "open_drill_library"
  | "open_practice_planner"
  | "open_film_queue"
  | "open_idp"
  | "open_readiness"
  | "none";

export type Lesson = {
  id: string;
  courseId: string;
  order: number;
  title: string;
  durationMin: number;
  /**
   * Lesson body in pseudo-markdown blocks.
   * Each block: { type: "p"|"h2"|"h3"|"quote"|"bullets"|"callout", content: string|string[] }
   */
  body: LessonBlock[];
  /** What the coach should do immediately after reading. */
  actionType: LessonActionType;
  actionLabel?: string;
  actionHref?: string;
};

export type LessonBlock =
  | { type: "p";       content: string }
  | { type: "h2";      content: string }
  | { type: "h3";      content: string }
  | { type: "quote";   content: string; attribution?: string }
  | { type: "bullets"; content: string[] }
  | { type: "callout"; content: string; variant?: "info" | "warning" | "tip" };

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: CourseCategory;
  level: CourseLevel;
  durationMin: number;
  description: string;
  tags: string[];
  lessons: Lesson[];
  /** If true, the coach has started this course (mock). */
  inProgress?: boolean;
  /** Number of lessons completed (mock). */
  completedLessons?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Courses
// ─────────────────────────────────────────────────────────────────────────────

export const courses: Course[] = [
  // ── COURSE 1: Individual Player Development ────────────────────────────────
  {
    id: "course_ipd",
    slug: "individual-player-development",
    title: "Building Individual Player Development Plans",
    subtitle: "Turn observations into a systematic development system every player can follow.",
    category: "player_development",
    level: "foundation",
    durationMin: 40,
    description:
      "Most youth coaches develop players reactively — they see a weakness in a game and drill it the next week. This course teaches a proactive, structured approach to development planning that connects film observations, daily WODs, and measurable milestones into a coherent system.",
    tags: ["IDP", "player development", "goal-setting", "coaching framework"],
    inProgress: true,
    completedLessons: 2,
    lessons: [
      {
        id: "ipd_l1",
        courseId: "course_ipd",
        order: 1,
        title: "Why most youth development is reactive and how to fix it",
        durationMin: 8,
        body: [
          { type: "p", content: "Most coaches develop players by instinct. You watch a game, you see three things that need to improve, and you drill those things the next week. This works — until it doesn't. It doesn't when a player plateaus. It doesn't when a parent asks you what their child has been working on for the past three months. It doesn't when a player has competing weaknesses and you're not sure which one to address first." },
          { type: "h2", content: "The problem with reactive coaching" },
          { type: "bullets", content: [
            "No prioritization: you address the loudest problem, not the most important one",
            "No continuity: each practice plan is independent, not building toward a goal",
            "No measurement: you don't know if the player improved — you feel like they did",
            "No player ownership: the player is a passenger in their own development",
          ]},
          { type: "h2", content: "What proactive development looks like" },
          { type: "p", content: "Proactive development starts with assessment — not a formal test, just an honest conversation between you and the player about where they are and where they want to go. From that conversation, you define 2–3 focus areas for the next 6–8 weeks. Every WOD, every practice block, every film observation either feeds into one of those areas or it doesn't. If it doesn't, it may not belong in this player's current plan." },
          { type: "quote", content: "The goal is not to make every player better at everything. The goal is to make this player meaningfully better at the two things that will unlock the next level of their game.", attribution: "Coach Development Principle #1" },
          { type: "callout", content: "Before the next lesson: write down the 2–3 most important development areas for one player on your roster. Don't overthink it — just the things that, if improved, would meaningfully change what that player can do.", variant: "tip" },
        ],
        actionType: "open_idp",
        actionLabel: "Open IDP for a player",
        actionHref: "/app/coach/players/p10/idp",
      },
      {
        id: "ipd_l2",
        courseId: "course_ipd",
        order: 2,
        title: "Setting goals that actually measure improvement",
        durationMin: 10,
        body: [
          { type: "p", content: "The most common mistake in youth player development is setting goals that are vague enough that you can never tell whether you hit them. 'Get better at ball handling' is not a goal. 'Be able to execute a live-speed crossover without a breakdown when attacked with ball pressure in a 1v1 setting' is a goal." },
          { type: "h2", content: "The three qualities of a useful development goal" },
          { type: "bullets", content: [
            "Observable: you can see it on film or in a live drill — not just 'feel' it",
            "Contextual: it specifies when and against what resistance it applies",
            "Timebounded: you have a date to check against, even if it's approximate",
          ]},
          { type: "h2", content: "Level-based framing" },
          { type: "p", content: "Instead of a pass/fail goal, use a 1–5 scale for each focus area. A level 2 player can execute the skill in a stationary, no-pressure setting. A level 3 player can execute it in a structured drill with passive resistance. A level 4 player executes it in a small-sided game. A level 5 player executes it in a live game situation without coaching." },
          { type: "callout", content: "Try rating one player's current level on two of their focus areas using the 1–5 scale, then set a target level and a date. That's your first real development goal.", variant: "tip" },
          { type: "h2", content: "Milestones: the checkpoints between current and target" },
          { type: "p", content: "A 6-week goal with no milestones is just a wish. Break the path into 2–3 observable checkpoints. For a player moving from Level 2 to Level 4 on left-hand finishing: milestone 1 (week 2) is clean Mikan drill at full speed; milestone 2 (week 4) is consistent Euro step left in the Chair Attack series; milestone 3 (week 6) is a left-hand finish under light contact in 1v1." },
        ],
        actionType: "open_idp",
        actionLabel: "Set a development goal",
        actionHref: "/app/coach/players/p10/idp",
      },
      {
        id: "ipd_l3",
        courseId: "course_ipd",
        order: 3,
        title: "Connecting WODs and film to the development plan",
        durationMin: 9,
        body: [
          { type: "p", content: "The IDP is only useful if it's alive — meaning the drills in the daily WOD and the observations from film are directly connected to the goals in the plan. If a coach writes a WOD that doesn't address any of the player's 3 focus areas, that WOD is either misassigned or the focus areas are wrong." },
          { type: "h2", content: "How to tag WOD blocks to IDP goals" },
          { type: "p", content: "In HoopsOS, every WOD block should trace back to a focus area on the player's IDP. When you build a WOD, ask: which of this player's goals does this block address? If you can't answer, it's either a warm-up/conditioning block (which is fine) or it shouldn't be in this player's plan." },
          { type: "h2", content: "Using film observations as IDP evidence" },
          { type: "p", content: "When you verify an AI observation or write a coaching action, you're generating evidence about a player's current level. This evidence should feed back into the IDP. If a film session reveals that the player's left-hand finishing is breaking down under contact — and that's a Level 3 goal — you have a data point that tells you whether to adjust the milestone or add more contact-specific reps." },
          { type: "callout", content: "After building a WOD this week, check each block against the player's IDP focus areas. Can you draw a line from every drill block to a specific goal? If not, adjust the WOD or update the plan.", variant: "tip" },
        ],
        actionType: "open_wod_builder",
        actionLabel: "Build a WOD linked to a player's IDP",
        actionHref: "/app/coach/wods",
      },
      {
        id: "ipd_l4",
        courseId: "course_ipd",
        order: 4,
        title: "Sharing the plan with the player and making them co-owners",
        durationMin: 7,
        body: [
          { type: "p", content: "The IDP belongs to the player, not the coach. The coach is the architect, but the player has to want to live in it. If the player doesn't know their own goals, doesn't understand why they're doing each drill, and doesn't have agency over the plan, the plan won't work no matter how well-designed it is." },
          { type: "h2", content: "The 10-minute plan walkthrough" },
          { type: "p", content: "Once a month, spend 10 minutes with each player going through their IDP. Show them where they are on each focus area, what the milestone they're working toward looks like, and what the next week's WOD is targeting. Ask them if the goals still feel right. Ask if the drills feel connected. Most players have never been asked these questions — the conversation itself is development." },
          { type: "h2", content: "What player ownership actually produces" },
          { type: "bullets", content: [
            "Higher WOD completion rates — players who understand why do the work even without surveillance",
            "Better film submissions — players who own their plan actively look for evidence of improvement",
            "Reduced parent friction — when a player can explain their own development, parents stop asking the coach",
            "Longer retention — players who feel invested in a program-level development system don't leave for a shinier gym",
          ]},
        ],
        actionType: "open_idp",
        actionLabel: "Share a player's IDP",
        actionHref: "/app/coach/players/p10/idp",
      },
    ],
  },

  // ── COURSE 2: Practice Design ─────────────────────────────────────────────
  {
    id: "course_practice",
    slug: "practice-design-that-develops-players",
    title: "Practice Design That Actually Develops Players",
    subtitle: "Stop running the same drills on autopilot. Build practice plans with intention.",
    category: "practice_design",
    level: "foundation",
    durationMin: 35,
    description:
      "A well-designed practice plan is not a list of drills — it's a sequenced learning experience. This course covers how to structure practice time, choose drills with purpose, manage intensity and cognitive load, and reflect on what actually happened vs. what you planned.",
    tags: ["practice planning", "drill selection", "time management", "reflection"],
    inProgress: false,
    completedLessons: 0,
    lessons: [
      {
        id: "prac_l1",
        courseId: "course_practice",
        order: 1,
        title: "The four phases of a well-structured practice",
        durationMin: 8,
        body: [
          { type: "p", content: "Every practice should move through four phases: Activation, Skill Building, Integration, and Competition or Reflection. Not every practice needs all four at the same depth, but skipping a phase entirely has predictable consequences." },
          { type: "h2", content: "Phase 1 — Activation (10–15%)" },
          { type: "p", content: "Dynamic warm-up, layup lines, partner passing. The goal is physical readiness, not skill acquisition. Coaches often make this too complex or too short. Short and consistent is better than clever and unreliable." },
          { type: "h2", content: "Phase 2 — Skill Building (30–40%)" },
          { type: "p", content: "Individual and small-group drill work targeting the session's focus areas. Low-to-medium defensive resistance. Players should have enough repetitions to ingrain the movement before adding complexity." },
          { type: "h2", content: "Phase 3 — Integration (25–35%)" },
          { type: "p", content: "Small-sided games and team sets where the skill is used in context. Constraints-led drills belong here. The player should encounter the problem the skill solves." },
          { type: "h2", content: "Phase 4 — Competition or Reflection (10–20%)" },
          { type: "p", content: "Live scrimmage, competitive drill, or film review. Some form of accountability and synthesis. Post-practice reflection captures what happened and feeds the next session's plan." },
        ],
        actionType: "open_practice_planner",
        actionLabel: "Build a practice plan",
        actionHref: "/app/coach/practice-plans",
      },
      {
        id: "prac_l2",
        courseId: "course_practice",
        order: 2,
        title: "Selecting drills that transfer to games",
        durationMin: 9,
        body: [
          { type: "p", content: "Not all drills are equal. A drill that looks spectacular in a gym often produces zero game transfer because it requires conditions that don't exist in games. The principle of representative learning says: the more a training environment resembles the game environment, the better the transfer." },
          { type: "h2", content: "The transfer spectrum" },
          { type: "bullets", content: [
            "Low transfer: stationary, no decision, no resistance (e.g., form shooting with no movement)",
            "Medium transfer: movement and decision, light resistance (e.g., pull-up reads off a screen)",
            "High transfer: game-speed, live defense, unpredictable reads (e.g., 1v1 with a 3-dribble cap)",
          ]},
          { type: "p", content: "You need all three levels in your rotation — but you probably need more high-transfer reps than you think. The research on constraints-led and representative learning is clear: game performance improves faster when training conditions closely resemble game conditions." },
          { type: "callout", content: "Look at your last three practice plans. What percentage of your drill blocks are high-transfer vs. stationary/no-defense? If it's under 30% high-transfer, shift one drill per practice up the spectrum.", variant: "tip" },
        ],
        actionType: "open_drill_library",
        actionLabel: "Browse high-transfer drills",
        actionHref: "/app/coach/drills",
      },
      {
        id: "prac_l3",
        courseId: "course_practice",
        order: 3,
        title: "Managing cognitive load — why players forget at game speed",
        durationMin: 9,
        body: [
          { type: "p", content: "Cognitive load is the amount of mental effort required to execute a skill. When cognitive load is too high, players freeze, revert to old habits, or make errors that have nothing to do with physical ability. Understanding load is the difference between coaching that sticks and coaching that sounds good at practice and disappears at game time." },
          { type: "h2", content: "Three types of cognitive load in practice" },
          { type: "bullets", content: [
            "Intrinsic load: the complexity of the skill itself — a behind-the-back dribble is higher intrinsic load than a chest pass",
            "Extraneous load: unnecessary complexity added by the drill format — too many instructions, too many cones, too many concurrent tasks",
            "Germane load: the mental effort that actually creates learning — reading a defender, making a decision, adjusting a finish",
          ]},
          { type: "p", content: "Your job is to minimize extraneous load (simplify the drill format) and maximize germane load (force decisions). A drill with 7 steps and a complex rotation pattern generates mostly extraneous load. A simple 1v1 with one constraint generates mostly germane load." },
          { type: "h2", content: "The one-cue rule" },
          { type: "p", content: "During a drill, give players one coaching cue at a time. Not three. Not 'eyes up, one foot, soft touch, now reverse it.' One. The player's brain can only act on one instruction while the body is executing. Cues should be short, sensory, and immediate — 'fingertips' not 'release the ball off your fingertips with a flicking motion from the wrist.'" },
        ],
        actionType: "none",
      },
      {
        id: "prac_l4",
        courseId: "course_practice",
        order: 4,
        title: "The post-practice reflection — why most coaches skip it and why you shouldn't",
        durationMin: 9,
        body: [
          { type: "p", content: "After practice ends, most coaches either go home or immediately start planning the next one. Neither habit creates learning for the coach. Post-practice reflection — even five minutes — is the highest-leverage coaching habit that almost nobody does consistently." },
          { type: "h2", content: "The four reflection questions" },
          { type: "bullets", content: [
            "What happened as planned? (not all of it should — be honest)",
            "What broke down and why? (drill design, player readiness, time management, your cues?)",
            "What surprised you? (good surprises are data too)",
            "What changes tomorrow or next week as a result?",
          ]},
          { type: "p", content: "These four questions take five minutes. The answers compound. After a season of consistent reflection, you have a detailed record of what works with your specific players, your gym, your schedule, and your own coaching tendencies. No clinic can give you that data — only your own practice does." },
          { type: "callout", content: "After your next practice, open the post-session reflection in your practice plan and spend five minutes on those four questions. It's the most important drill you'll run all day.", variant: "tip" },
        ],
        actionType: "open_practice_planner",
        actionLabel: "Open your practice plan",
        actionHref: "/app/coach/practice-plans",
      },
    ],
  },

  // ── COURSE 3: Understanding AI Film Analysis ──────────────────────────────
  {
    id: "course_ai_film",
    slug: "understanding-ai-film-analysis",
    title: "Using AI Film Analysis as a Coaching Tool",
    subtitle: "How to get the most out of HoopsOS AI observations — and how to know when to override them.",
    category: "film_and_analysis",
    level: "foundation",
    durationMin: 28,
    description:
      "AI film analysis is a tool, not a verdict. This course teaches you how to read AI observations critically, understand confidence scores, know when to verify vs. override, and use AI findings to build better WODs and coaching actions.",
    tags: ["AI", "film analysis", "coaching actions", "verification"],
    inProgress: false,
    completedLessons: 0,
    lessons: [
      {
        id: "film_l1",
        courseId: "course_ai_film",
        order: 1,
        title: "What the AI sees and what it can't see",
        durationMin: 7,
        body: [
          { type: "p", content: "HoopsOS's AI analyzes player clips and identifies technical observations — things like elbow alignment, footwork patterns, release timing, and head position. It works from video, which means it can only see what the camera angle captures. It cannot see game context, feel what the player was thinking, or account for what the coach told them before the clip." },
          { type: "h2", content: "What AI is good at" },
          { type: "bullets", content: [
            "Spotting consistent mechanical patterns across multiple clips (e.g., always short-arming under contact)",
            "Identifying the specific moment a breakdown occurred (timestamp-level precision)",
            "Flagging low-confidence observations for human review rather than guessing",
            "Generating volume — reviewing 20 clips in 2 minutes that would take a coach 40",
          ]},
          { type: "h2", content: "What AI cannot do" },
          { type: "bullets", content: [
            "Understand why the player made a choice (strategy vs. error)",
            "Account for fatigue, injury, or coach instruction that isn't visible",
            "Evaluate decision-making quality (it can see the action, not the read)",
            "Know whether a non-standard technique is a personal style or a flaw",
          ]},
          { type: "callout", content: "Think of AI observations as a first draft. Accurate, fast, and sometimes wrong in ways a human would immediately catch. Your job is to verify, contextualize, and decide.", variant: "info" },
        ],
        actionType: "open_film_queue",
        actionLabel: "Review your film queue",
        actionHref: "/app/coach/queue",
      },
      {
        id: "film_l2",
        courseId: "course_ai_film",
        order: 2,
        title: "Reading confidence scores and knowing when to verify",
        durationMin: 7,
        body: [
          { type: "p", content: "Every AI observation in HoopsOS comes with a confidence score. This score reflects how certain the model is that the observation is accurate. High confidence (above 80%) means the AI has seen clear, unambiguous evidence in the clip. Low confidence (below 50%) means the evidence was partial, the camera angle was poor, or the observation is inherently subjective." },
          { type: "h2", content: "How to use confidence scores in your review workflow" },
          { type: "bullets", content: [
            "High confidence + aligns with your observation → verify and create a coaching action",
            "High confidence + contradicts your observation → watch the clip yourself before deciding",
            "Low confidence → always watch the clip; don't let AI make the call",
            "Multiple low-confidence observations on the same mechanic → a pattern worth investigating manually",
          ]},
          { type: "p", content: "The goal is not to verify every observation — that defeats the purpose. The goal is to use confidence scores to decide where your attention is most needed. Batch high-confidence observations, spend time on the low-confidence ones." },
        ],
        actionType: "open_film_queue",
        actionLabel: "Review pending observations",
        actionHref: "/app/coach/queue",
      },
      {
        id: "film_l3",
        courseId: "course_ai_film",
        order: 3,
        title: "Turning observations into coaching actions and WODs",
        durationMin: 7,
        body: [
          { type: "p", content: "An AI observation that stays in the film queue is wasted data. The value is in what happens next: you verify it, you decide it's real, and then you do something about it. The response to an observation should be either a coaching action (a note, a task, a conversation) or a drill added to the player's next WOD." },
          { type: "h2", content: "The observation-to-action pipeline" },
          { type: "bullets", content: [
            "Verify the observation (watch the clip, confirm or override)",
            "Categorize it: mechanical, decision, conditioning, or mindset",
            "Create a coaching action: assign a drill, send a note, or schedule a conversation",
            "Tag the action to the player's IDP focus area",
            "The next WOD should include at least one drill that directly addresses the observation",
          ]},
          { type: "callout", content: "After your next film review session: for each verified observation, ask 'what drill would most directly address this specific breakdown?' Add that drill to the player's next WOD before closing the review tab.", variant: "tip" },
        ],
        actionType: "open_film_queue",
        actionLabel: "Start a review session",
        actionHref: "/app/coach/queue",
      },
      {
        id: "film_l4",
        courseId: "course_ai_film",
        order: 4,
        title: "Building a film review habit that fits your schedule",
        durationMin: 7,
        body: [
          { type: "p", content: "The biggest obstacle to good film review is time. Most coaches review film reactively — before a big game, when a player is struggling, or when a parent complains. This produces inconsistent data and puts the coach in a reactive rather than developmental posture." },
          { type: "h2", content: "The 20-minute weekly review ritual" },
          { type: "p", content: "Set aside 20 minutes the same time every week — Friday morning, Sunday evening, whatever is consistent. In those 20 minutes: (1) review the AI queue for that week, (2) verify the top 5–8 observations by confidence, (3) create coaching actions for the ones that matter, and (4) add any resulting drills to the upcoming week's WODs. That's it. Every week." },
          { type: "p", content: "Done consistently, this 20-minute ritual produces more development data in a season than most coaches generate in three seasons of reactive review. The compounding is in the consistency, not the depth of any single session." },
          { type: "callout", content: "Block 20 minutes on your calendar for the same time every week. Label it 'Film Review.' That calendar block is a coaching action.", variant: "tip" },
        ],
        actionType: "open_film_queue",
        actionLabel: "Open your film queue",
        actionHref: "/app/coach/queue",
      },
    ],
  },

  // ── COURSE 4: Communicating with Players and Parents ──────────────────────
  {
    id: "course_communication",
    slug: "communication-that-builds-trust",
    title: "Communication That Builds Trust",
    subtitle: "How to talk to players about development, and to parents about investment.",
    category: "communication",
    level: "intermediate",
    durationMin: 32,
    description:
      "The best development system in the world fails if the coach can't communicate clearly with players and families. This course covers how to give feedback that motivates, run productive parent conversations, set expectations, and build a communication culture where everyone feels informed.",
    tags: ["communication", "parent relations", "player feedback", "trust"],
    inProgress: false,
    completedLessons: 0,
    lessons: [
      {
        id: "comm_l1",
        courseId: "course_communication",
        order: 1,
        title: "The feedback gap: why what you say isn't what players hear",
        durationMin: 8,
        body: [
          { type: "p", content: "Coaches often think they're giving clear feedback, but players are interpreting something completely different. This happens because feedback at practice is delivered in a high-stress, fast-moving environment where players are also managing physical execution, social pressure, and fatigue. The cue that makes perfect sense to you is being processed by a brain that is already overloaded." },
          { type: "h2", content: "Feedback principles that stick" },
          { type: "bullets", content: [
            "One thing at a time: give one instruction, let it land, move on",
            "Positive framing: 'Stay low' lands better than 'Stop standing up'",
            "Physical demonstration: show it before you say it whenever possible",
            "Question over statement: 'What did you feel?' before 'Here's what I saw'",
            "Timing: the best moment for feedback is right before the next rep, not mid-rep",
          ]},
        ],
        actionType: "none",
      },
      {
        id: "comm_l2",
        courseId: "course_communication",
        order: 2,
        title: "Talking to players about their development plan",
        durationMin: 8,
        body: [
          { type: "p", content: "Most players have never had a coach sit down with them and talk specifically about their individual development — not their role on the team, not what they need to do for the team to win, but what they specifically need to develop to become a better player. This conversation is one of the highest-trust actions a coach can take." },
          { type: "h2", content: "The IDP conversation structure" },
          { type: "bullets", content: [
            "Start with what you've observed, not with what's wrong: 'I've been watching your film and I want to show you something I noticed.'",
            "Frame the focus area as an opportunity, not a problem: 'Your left hand is going to unlock a completely different offensive game for you.'",
            "Ask for their read: 'Does this feel like a real priority to you, or is there something else you think matters more right now?'",
            "Explain the plan: 'Here's what the next 6 weeks of your WODs are targeting and why.'",
            "Give them a milestone they can feel: 'By week 4, you should be able to do this drill clean at full speed.'",
          ]},
        ],
        actionType: "open_idp",
        actionLabel: "Open a player's IDP",
        actionHref: "/app/coach/players/p10/idp",
      },
      {
        id: "comm_l3",
        courseId: "course_communication",
        order: 3,
        title: "Parent conversations: showing the value without overpromising",
        durationMin: 8,
        body: [
          { type: "p", content: "Parents are paying for their child's development. Some are paying a lot. They want to know that the investment is producing something real — not just their kid having fun, but actually improving. The challenge is that improvement in a 14-year-old is often non-linear, hard to quantify, and emotionally complicated." },
          { type: "h2", content: "What parents actually want to know" },
          { type: "bullets", content: [
            "Is my kid getting better? (specific, not vague)",
            "Does the coach actually know my kid as an individual?",
            "Is the program organized and intentional, or chaotic?",
            "Am I getting my money's worth?",
          ]},
          { type: "p", content: "The best parent conversation starts with a specific observation about their child — not a general statement about the program. 'I've noticed that Malik's left-hand finishing has improved significantly over the last four weeks' hits differently than 'Malik is working hard.' The specific observation demonstrates that you're actually watching their child." },
          { type: "callout", content: "Before your next parent check-in, open that player's IDP and identify one specific, observable improvement from the last 3–4 weeks. Lead with that. It will change the tone of the entire conversation.", variant: "tip" },
        ],
        actionType: "none",
      },
      {
        id: "comm_l4",
        courseId: "course_communication",
        order: 4,
        title: "Building an announcement and communication cadence",
        durationMin: 8,
        body: [
          { type: "p", content: "Communication failures in youth programs almost always follow the same pattern: too much information all at once, followed by long silences, followed by a crisis that requires urgent communication that nobody saw. The antidote is a predictable cadence — consistent, expected, brief." },
          { type: "h2", content: "The weekly communication rhythm" },
          { type: "bullets", content: [
            "Monday: announce the week's practice schedule and any schedule changes",
            "Wednesday mid-week: one WOD submission reminder for players; one parent update if there's relevant news",
            "Friday: game-week details if applicable; development summary or individual player note",
          ]},
          { type: "p", content: "Three touchpoints a week is enough to keep families informed without flooding anyone's inbox. The key is predictability — when families know when to expect communication, they stop texting coaches at 11 PM asking about Thursday's practice." },
        ],
        actionType: "none",
      },
    ],
  },

  // ── COURSE 5: Defense Systems ─────────────────────────────────────────────
  {
    id: "course_defense",
    slug: "building-your-defensive-system",
    title: "Building a Defensive System That Scales",
    subtitle: "From individual positioning to team coverage — a systematic approach to defense at every level.",
    category: "defensive_systems",
    level: "intermediate",
    durationMin: 45,
    description:
      "Defense is where games are won in youth basketball, but it's the area most coaches spend the least structured time developing. This course covers individual defensive principles, man coverage, basic zone, PnR coverages, and how to practice defense so it transfers to games.",
    tags: ["defense", "man-to-man", "zone", "PnR", "shell drill"],
    inProgress: false,
    completedLessons: 0,
    lessons: [
      {
        id: "def_l1",
        courseId: "course_defense",
        order: 1,
        title: "The three defensive principles that underlie every system",
        durationMin: 9,
        body: [
          { type: "p", content: "Before you install a defensive system, every player needs to be able to answer three questions: Where is the ball? Where is my man? Where is the help? A player who can always answer these three questions correctly is a good defender. A player who can't is a liability regardless of how hard they're working." },
          { type: "h2", content: "Principle 1 — Ball pressure decides everything" },
          { type: "p", content: "The pressure on the ball determines how much time help defenders have to recover. High ball pressure forces quick decisions and bad passes. No ball pressure gives the offense all day to probe the defense. Your ball defenders set the tempo of the entire defensive system." },
          { type: "h2", content: "Principle 2 — Help position is a stance, not a reaction" },
          { type: "p", content: "Help-side defense is not something you do when something goes wrong — it's where you stand from the moment the ball moves. Off-ball defenders who wait to react to drives will always be late. Off-ball defenders who are pre-positioned in the help lane before the drive happens will be early." },
          { type: "h2", content: "Principle 3 — Communication is a defensive action" },
          { type: "p", content: "Screen calls, 'ball!' calls, 'dead!' calls — defensive communication is not optional decoration. It gives teammates time to adjust. A silent defense makes every defender an island. A communicating defense is a system." },
        ],
        actionType: "open_drill_library",
        actionLabel: "Browse defensive drills",
        actionHref: "/app/coach/drills",
      },
      {
        id: "def_l2",
        courseId: "course_defense",
        order: 2,
        title: "Running the shell drill with purpose",
        durationMin: 9,
        body: [
          { type: "p", content: "The 4-on-4 shell drill is the most important defensive teaching tool in basketball. But most coaches run it as a warm-up habit rather than a teaching moment, which means it produces warm-up results — comfortable-looking defense that breaks down in games." },
          { type: "h2", content: "How to run the shell drill as a learning exercise" },
          { type: "bullets", content: [
            "Start without live offense: coach passes to different spots and calls 'drive' or 'kick' — defenders respond",
            "Freeze-frame regularly: when a breakdown happens, stop and point to every defender's position",
            "Add offense gradually: passive → semi-live → live over 3 or 4 sessions",
            "Count clean possessions, not time: 'We need 3 consecutive clean stops before moving on'",
            "Debrief at the end: 'What broke down most? Where do we need to focus next session?'",
          ]},
          { type: "callout", content: "Run your shell drill at the start of your next two practices with these progressions. Note which breakdown happens most consistently — that's the coaching priority for the following week.", variant: "tip" },
        ],
        actionType: "open_drill_library",
        actionLabel: "Find the shell drill",
        actionHref: "/app/coach/drills",
      },
      {
        id: "def_l3",
        courseId: "course_defense",
        order: 3,
        title: "Installing PnR coverages — ICE, hedge, drop",
        durationMin: 9,
        body: [
          { type: "p", content: "Pick-and-roll coverage is the most important defensive concept in modern basketball and the one most under-taught at the youth level. There are three primary coverages: ICE (force baseline, big drops), Hedge (ball handler trapped at the screen, big recovers), and Drop (ball defender chases over, big stays home). Each has a context where it works best." },
          { type: "h2", content: "ICE coverage" },
          { type: "p", content: "Best for: sideline ball screens where you want to eliminate the top of the floor. Ball defender gets their hip in the path before the screen is set and forces the dribbler baseline. Big drops to the nail and cuts off the roll. Simple, consistent, good for youth athletes." },
          { type: "h2", content: "Hedge coverage" },
          { type: "p", content: "Best for: elite ball handlers who will kill a drop. Big jumps to the ball on the screen (hedging), trapping the dribbler momentarily. Ball defender chases over the top. High risk, high reward — requires an athletic big and disciplined communication." },
          { type: "h2", content: "Drop coverage" },
          { type: "p", content: "Best for: three-point shooters who don't pull up at the top. Big stays home in the paint, protecting the rim. Ball defender goes over or under the screen based on the scout. Low cognitive load — best for youth teams installing their first coverage." },
        ],
        actionType: "open_drill_library",
        actionLabel: "ICE coverage drill",
        actionHref: "/app/coach/drills",
      },
      {
        id: "def_l4",
        courseId: "course_defense",
        order: 4,
        title: "Scouting the opponent's offense and adjusting your coverage",
        durationMin: 9,
        body: [
          { type: "p", content: "Game preparation defense is not about changing your entire system — it's about adjusting 2–3 specific calls based on what this specific opponent does. Most youth teams have 2–3 actions they run repeatedly. If you can identify them on film and have a practiced response, you've won the preparation battle." },
          { type: "h2", content: "The scout-to-coverage workflow" },
          { type: "bullets", content: [
            "Watch 2–3 film clips of the opponent's primary PnR action",
            "Identify: who initiates it, from which side, and what they want (pull-up or roll)",
            "Select a coverage that neutralizes their primary action",
            "Walk through the coverage in practice at half-speed before Saturday",
            "Debrief after the game: did the coverage work? What did they counter with?",
          ]},
          { type: "callout", content: "Before your next game, open your scouting hub and clip 3 examples of the opponent's primary ball screen action. Use those clips in your pre-game walkthrough.", variant: "tip" },
        ],
        actionType: "open_film_queue",
        actionLabel: "Open scouting hub",
        actionHref: "/app/coach/scouting",
      },
    ],
  },

  // ── COURSE 6: Building a Development-First Program ────────────────────────
  {
    id: "course_program",
    slug: "building-a-development-first-program",
    title: "Building a Development-First Program",
    subtitle: "How to create a program culture where every decision is a development decision.",
    category: "program_building",
    level: "advanced",
    durationMin: 38,
    description:
      "Winning games and developing players are not opposites — but they require different decisions about time, personnel, and priorities. This course covers how to build a program philosophy, structure your staff, manage player expectations across age groups, and retain players year over year.",
    tags: ["program culture", "retention", "staff development", "long-term athlete development"],
    inProgress: false,
    completedLessons: 0,
    lessons: [
      {
        id: "prog_l1", courseId: "course_program", order: 1,
        title: "Defining your program's development philosophy in one sentence",
        durationMin: 9,
        body: [
          { type: "p", content: "A program philosophy is not a mission statement that lives on a website. It's the sentence that explains every decision you make — about playing time, drill selection, practice structure, and what you reward. If you can't say it in one sentence, you haven't found it yet." },
          { type: "h2", content: "Examples of real program philosophies" },
          { type: "bullets", content: [
            "'We develop players who make their teammates better, not just themselves.'",
            "'We create environments where failure is safe and decisions are practiced.'",
            "'We build players for the next level, not for this season's record.'",
            "'We develop the whole person through the discipline of basketball.'",
          ]},
          { type: "p", content: "Notice that none of these mention winning. That's not because winning doesn't matter — it's because when the philosophy is right, winning becomes a byproduct of the development process, not a substitute for it." },
        ],
        actionType: "none",
      },
      {
        id: "prog_l2", courseId: "course_program", order: 2,
        title: "Retention: why players leave programs and what stops it",
        durationMin: 10,
        body: [
          { type: "p", content: "Player attrition is the single most expensive problem a youth program faces. When a player leaves, you lose tuition, roster depth, institutional knowledge, and often a family who was your best referral source. Understanding why players leave is the first step to keeping them." },
          { type: "h2", content: "The real reasons players leave" },
          { type: "bullets", content: [
            "They don't feel seen as an individual — they feel like a roster spot",
            "They can't measure their own improvement — they feel stuck",
            "Their family doesn't see the value — they don't know what they're paying for",
            "They found a 'shinier' program that made bigger promises — even if the product is worse",
            "A conflict went unaddressed for too long",
          ]},
          { type: "h2", content: "What keeps players" },
          { type: "bullets", content: [
            "A coach who knows them as a player and as a person",
            "Visible, measurable improvement that they can point to",
            "A community — teammates they look forward to seeing",
            "A feeling that this program is investing in their future, not just this season",
          ]},
        ],
        actionType: "none",
      },
      {
        id: "prog_l3", courseId: "course_program", order: 3,
        title: "Long-term athlete development: what to prioritize at each age",
        durationMin: 10,
        body: [
          { type: "p", content: "The research on long-term athlete development (LTAD) is clear: the skills, cognitive patterns, and athletic capacities you develop at each age have different windows. Missing a window doesn't close the door — but it makes things harder later. Understanding LTAD helps you make the right development priorities for your specific age group." },
          { type: "h2", content: "U10–U12: Fundamentals and love of the game" },
          { type: "p", content: "This is not the age for complex offensive systems or specialized position training. This is the age for ball handling, passing, layups (both hands), spatial awareness, and decision-making. If a 10-year-old doesn't love playing basketball, no amount of tactical development will matter at 16." },
          { type: "h2", content: "U13–U15: Skill development and decision-making" },
          { type: "p", content: "Motor learning is highly efficient in this window. Players can acquire skills quickly but they need volume of good reps, not just volume of reps. This is the age to add shooting mechanics, 1v1 offensive reads, and small-sided competitive games. Position specialization can begin but shouldn't dominate." },
          { type: "h2", content: "U16–U18: Tactical sophistication and performance" },
          { type: "p", content: "Players in this window are physically and cognitively ready for complex systems, competitive pressure, and position-specific training. Film analysis becomes genuinely useful. Performance metrics matter. The development plan should be explicitly oriented toward the next level — whether that's high school varsity, college, or a competitive recreational career." },
        ],
        actionType: "none",
      },
      {
        id: "prog_l4", courseId: "course_program", order: 4,
        title: "Using HoopsOS as your program's development record",
        durationMin: 9,
        body: [
          { type: "p", content: "A development-first program needs a development record — a system that captures what players did, what they improved, what they struggled with, and how the coaching responded. Without a record, development is a feeling. With a record, it's evidence." },
          { type: "h2", content: "What your HoopsOS record contains" },
          { type: "bullets", content: [
            "Every WOD built and completed — dated, player-specific",
            "Every film observation — timestamped, AI-generated and coach-verified",
            "Every coaching action — the response to what was observed",
            "Every IDP goal and milestone — the formal development intent",
            "Readiness history — the physical context behind every training session",
          ]},
          { type: "p", content: "Collectively, this is the most complete player development record that exists for youth basketball. A player who goes through your program for 3 years has a verifiable, chronological history of their development. That's a recruiting asset, a trust asset with families, and a coaching reflection tool that no whiteboard or Excel spreadsheet can replicate." },
          { type: "callout", content: "At the end of this season, export or screenshot one player's full development history — WODs, film observations, IDP milestones. Show it to that player and their family. That's your program's value proposition made tangible.", variant: "tip" },
        ],
        actionType: "open_idp",
        actionLabel: "View a player's full history",
        actionHref: "/app/coach/players/p10/idp",
      },
    ],
  },
];

/** Look up a course by slug or id. */
export function getCourse(idOrSlug: string): Course | undefined {
  return courses.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  player_development: "Player Development",
  practice_design: "Practice Design",
  offensive_systems: "Offensive Systems",
  defensive_systems: "Defensive Systems",
  communication: "Communication",
  program_building: "Program Building",
  film_and_analysis: "Film & Analysis",
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
