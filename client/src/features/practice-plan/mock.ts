/**
 * Practice Plan + Drill Library mock data.
 *
 * Modeled to match the production Prisma schema in Prompt 3:
 *   model DrillCategory { id, name, drills }
 *   model Drill         { id, categoryId, title, description, videoUrl, durationSec }
 *
 * Plus a richer in-app `PracticePlan` model for the builder, which in production
 * would map to a `PracticePlan` table with `PracticePlanBlock` rows.
 */

export type DrillIntensity = "LOW" | "MEDIUM" | "HIGH" | "MAX";
export type DrillSurface = "HALF_COURT" | "FULL_COURT" | "BASELINE" | "STATIONARY";

export type DrillVisibility = "private" | "org" | "public";

export type Drill = {
  id: string;
  categoryId: string;
  title: string;
  /** Short plain-English description of how the drill is run. Required for new drills. */
  description: string;
  defaultDurationMin: number;
  intensity: DrillIntensity;
  surface: DrillSurface;
  minPlayers: number;
  maxPlayers: number;
  equipment: string[]; // e.g. ["Cones", "Chairs"]
  coachesNeeded: number;
  videoUrl?: string;
  tags: string[];
  /**
   * Primary skill or motor pattern this drill develops.
   * Keep short: "Weak-hand finishing", "Ball pressure defense", "Off-screen reads"
   */
  skillFocus?: string;
  /**
   * One-sentence coaching objective — why this drill is in the plan.
   * e.g. "Build right-hand layup consistency without looking at the ball."
   */
  objective?: string;
  /** Coaching points / cues. Bullet list rendered in the drill and WOD block. */
  coachingPoints?: string[];
  /**
   * Rep / format guidance shown to the player.
   * e.g. "3 sets × 10 reps each side", "90 sec continuous", "First to 21 wins"
   */
  repFormat?: string;
  /** Optional diagram or thumbnail image URL. */
  diagramUrl?: string;
  /** Ownership — set on custom drills authored by a coach. */
  ownerCoachId?: string;
  /** Org scoping for org-visible custom drills. */
  orgId?: string;
  /** True when authored by a coach; false / undefined for global library. */
  isCustom?: boolean;
  /** Visibility scope (only meaningful when isCustom). */
  visibility?: DrillVisibility;
  /** ISO timestamp — when the custom drill was created. */
  createdAt?: string;
  /** ISO timestamp — last edit. */
  updatedAt?: string;
};

export type DrillCategory = {
  id: string;
  name: string;
  color: string; // OKLCH for the swatch
  description: string;
};

export const drillCategories: DrillCategory[] = [
  {
    id: "cat_warmup",
    name: "Warm-up & Activation",
    color: "oklch(0.7 0.18 190)",
    description: "Dynamic mobility, layup lines, partner work to start practice.",
  },
  {
    id: "cat_shooting",
    name: "Shooting",
    color: "oklch(0.78 0.16 75)",
    description: "Form, catch-and-shoot, off-the-dribble, free throws.",
  },
  {
    id: "cat_handles",
    name: "Ball Handling",
    color: "oklch(0.7 0.16 280)",
    description: "Stationary, two-ball, full-court attack series.",
  },
  {
    id: "cat_finishing",
    name: "Finishing & Footwork",
    color: "oklch(0.72 0.18 320)",
    description: "Mikan, Euro, contact finishes, jump-stop reads.",
  },
  {
    id: "cat_decision",
    name: "Decision Games (SSG)",
    color: "oklch(0.76 0.14 240)",
    description: "Small-sided games and read-based drills for game transfer.",
  },
  {
    id: "cat_offense",
    name: "Team Offense",
    color: "oklch(0.72 0.17 50)",
    description: "Sets, motion, transition, BLOB / SLOB / ATO.",
  },
  {
    id: "cat_defense",
    name: "Team Defense",
    color: "oklch(0.7 0.18 25)",
    description: "Closeouts, shell, PnR coverage, zone, scrambles.",
  },
  {
    id: "cat_conditioning",
    name: "Conditioning",
    color: "oklch(0.72 0.2 30)",
    description: "Suicides, lane slides, gauntlet finishers.",
  },
  {
    id: "cat_film",
    name: "Film & Walk-through",
    color: "oklch(0.7 0.13 140)",
    description: "Scout review, opponent tendencies, half-speed walk-throughs.",
  },
];

export const drillLibrary: Drill[] = [
  // Warm-up
  {
    id: "drl_dyn_warmup",
    categoryId: "cat_warmup",
    title: "Dynamic Mobility Series",
    description: "High-knees → butt-kicks → walking lunges → lateral shuffle baseline-to-baseline. Two full trips, no jogging.",
    skillFocus: "Injury prevention · full-body activation",
    objective: "Elevate core temperature and open hip/ankle range before any high-intensity work.",
    repFormat: "2 full trips · ~8 min",
    defaultDurationMin: 8,
    intensity: "LOW",
    surface: "FULL_COURT",
    minPlayers: 1,
    maxPlayers: 25,
    equipment: [],
    coachesNeeded: 1,
    tags: ["mandatory", "injury-prevention"],
    coachingPoints: [
      "High-knees above the hip — don't just shuffle",
      "Arms pumping opposite to legs, not swinging across the body",
      "Lateral shuffle: stay low, don't cross feet",
    ],
  },
  {
    id: "drl_layup_lines",
    categoryId: "cat_warmup",
    title: "3-Line Layups",
    description: "Right-hand, left-hand, then reverse layups from each side. 30 makes per side before the group progresses.",
    skillFocus: "Layup fundamentals · both hands",
    objective: "Build consistent two-foot and one-foot layup mechanics before competitive reps.",
    repFormat: "30 makes per side (right, left, reverse)",
    defaultDurationMin: 7,
    intensity: "LOW",
    surface: "FULL_COURT",
    minPlayers: 9,
    maxPlayers: 18,
    equipment: ["3 Balls"],
    coachesNeeded: 1,
    tags: ["foundation"],
    coachingPoints: [
      "Jump off the inside foot (left foot for right-hand layup)",
      "Reach high, not far — get the ball over the rim",
      "Reverse: use the glass, don't aim for the corner",
    ],
  },
  {
    id: "drl_partner_passing",
    categoryId: "cat_warmup",
    title: "Partner Passing Progression",
    description: "Chest → bounce → overhead → behind-the-back. 10 reps each with both hands. Partners 12–15 ft apart.",
    skillFocus: "Passing footwork · hand positioning",
    objective: "Warm up wrists, forearms, and passing reads before skill work.",
    repFormat: "10 reps each pass type · both hands",
    defaultDurationMin: 5,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 2,
    maxPlayers: 24,
    equipment: ["1 Ball / Pair"],
    coachesNeeded: 1,
    tags: ["fundamentals"],
    coachingPoints: [
      "Step into every pass — don't throw from your heels",
      "Thumbs down on release, fingers point at the target",
      "Catch with two hands; absorb the ball, don't slap it",
    ],
  },

  // Shooting
  {
    id: "drl_form_shooting",
    categoryId: "cat_shooting",
    title: "Form Shooting Ladder",
    description: "5 reps from 5 spots at point-blank range (3–6 ft). Start one-handed, add guide hand, then full release. Track arc — the ball should hit the back of the rim.",
    skillFocus: "Shooting mechanics · arc",
    objective: "Isolate and ingrain the shooting motion before adding distance or defenders.",
    repFormat: "5 reps × 5 spots · 1-handed then full release",
    defaultDurationMin: 8,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 12,
    equipment: ["1 Ball / Player", "Spot Markers"],
    coachesNeeded: 2,
    tags: ["technique"],
    coachingPoints: [
      "Elbow aligned under the ball — not flared out",
      "Flick wrist, hold follow-through until it goes in",
      "Balance foot under shooting hip before you rise",
    ],
  },
  {
    id: "drl_shooting_circuit",
    categoryId: "cat_shooting",
    title: "5-Spot Catch & Shoot",
    description: "Off-the-pass at corner, wing, top, opposite wing, opposite corner. Must earn 10 makes per spot before rotating. Shooters self-rebound and pass back to the feeder.",
    skillFocus: "Catch-and-shoot · rhythm footwork",
    objective: "Build catch-and-shoot consistency from all five spots with proper footwork under mild pressure.",
    repFormat: "10 makes per spot (5 spots) · rotate when complete",
    defaultDurationMin: 12,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["3 Balls", "Rebounder"],
    coachesNeeded: 2,
    tags: ["primary"],
    coachingPoints: [
      "Catch ready — hands up and hips open before the pass",
      "Land with both feet at once; avoid the hop-and-settle",
      "Same shot every time — don't adjust mechanics based on makes",
    ],
  },
  {
    id: "drl_pnr_pull",
    categoryId: "cat_shooting",
    title: "PnR Pull-Up Reads",
    description: "Coach or stationary chair acts as screener. Ball handler reads: reject the screen for a pull-up at the elbow, or use it and attack the nail for a floater in the lane.",
    skillFocus: "Pick-and-roll reads · pull-up jumper",
    objective: "Train the player to make a pre-dribble decision off the screen before the defense adjusts.",
    repFormat: "5 reps reject · 5 reps use · alternate sides",
    defaultDurationMin: 10,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 2,
    maxPlayers: 6,
    equipment: ["2 Balls", "1 Chair"],
    coachesNeeded: 1,
    tags: ["guards"],
    coachingPoints: [
      "Read the screen before catching — don't wait until you have the ball",
      "On rejection: attack back-shoulder hard, pull up balanced",
      "On use: get downhill quickly, attack the paint gap",
    ],
  },
  {
    id: "drl_free_throws",
    categoryId: "cat_shooting",
    title: "50-In-A-Row Free Throws",
    description: "Pairs at 6 baskets. Aggregate team makes toward 50. If any pair misses, both run a suicide. Resets happen automatically — team must hit 50 total without a miss streak.",
    skillFocus: "Free throw pressure · team accountability",
    objective: "Simulate late-game pressure through consequence-based free throw shooting.",
    repFormat: "Team aggregate of 50 makes · miss = suicide for that pair",
    defaultDurationMin: 10,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 6,
    maxPlayers: 18,
    equipment: ["1 Ball / Pair"],
    coachesNeeded: 1,
    tags: ["pressure", "team"],
    coachingPoints: [
      "Same routine every rep — don't speed up under pressure",
      "Breathe out before you shoot, not during",
      "Eyes on the front rim, not the backboard",
    ],
  },
  {
    id: "drl_3pt_circuit",
    categoryId: "cat_shooting",
    title: "Beat-the-Pro Three-Point",
    description: "Shooter vs imaginary 'pro' who starts at 0. Shooter scores +1 per make, loses −2 per miss. First to +21 wins. If the pro hits +21 first (shooter misses too much), run a sprint.",
    skillFocus: "Three-point volume · pressure shooting",
    objective: "Build three-point shot volume reps with a self-regulating competitive structure.",
    repFormat: "First to +21 · miss = −2",
    defaultDurationMin: 8,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 3,
    maxPlayers: 9,
    equipment: ["3 Balls"],
    coachesNeeded: 1,
    tags: ["competitive"],
    coachingPoints: [
      "Stay in your shot — don't bail early if you've been missing",
      "Move to the next spot immediately after the shot",
      "Feeders: crisp passes to the hip, not the hands",
    ],
  },

  // Ball Handling
  {
    id: "drl_two_ball",
    categoryId: "cat_handles",
    title: "Two-Ball Stationary Series",
    description: "Both hands active: pound simultaneously → alternating → v-dribble → figure-8 around both legs. 30 sec per move at full speed. Eyes up the entire time.",
    skillFocus: "Weak-hand coordination · dribble tightness",
    objective: "Force both hands to work simultaneously, eliminating the dominant-hand tendency.",
    repFormat: "30 sec per move · 4 moves · repeat 2 rounds",
    defaultDurationMin: 6,
    intensity: "MEDIUM",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 20,
    equipment: ["2 Balls / Player"],
    coachesNeeded: 1,
    tags: ["guards", "foundation"],
    coachingPoints: [
      "Eyes up — if you look down, you start over",
      "Dribble waist-height max, not head-height",
      "Stay on the balls of your feet, slight forward lean",
    ],
  },
  {
    id: "drl_full_court_handles",
    categoryId: "cat_handles",
    title: "Full-Court 4-Move Attack",
    description: "Hesi → crossover → between-the-legs → behind-the-back on each full-court trip. Pull-up jumper at the far elbow. Repeat going back. Both directions.",
    skillFocus: "Change-of-direction at speed · pull-up reads",
    objective: "Chain four dribble moves at full speed and finish with a controlled pull-up — game-speed mechanics.",
    repFormat: "1 trip per move × 4 moves · both directions",
    defaultDurationMin: 8,
    intensity: "HIGH",
    surface: "FULL_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["1 Ball / Player", "Cones"],
    coachesNeeded: 1,
    tags: ["guards"],
    coachingPoints: [
      "Sell the hesi with your shoulders, not just your feet",
      "Stay low through the change — don't rise before the move",
      "Pull-up: gather 1–2 dribbles max, don't take extra steps",
    ],
  },
  {
    id: "drl_chair_attack",
    categoryId: "cat_handles",
    title: "Chair Attack Series",
    description: "Three chairs set at elbow, nail, and block simulate defenders. Attack chair 1, make a read: Euro step around it, floater at chair 2, or step-back at chair 3. Rep each scenario.",
    skillFocus: "Decision-making · finishing options off live dribble",
    objective: "Pre-program three finishing reads so decisions happen automatically under pressure.",
    repFormat: "3 reps each option (Euro / floater / stepback) · both directions",
    defaultDurationMin: 8,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 2,
    maxPlayers: 8,
    equipment: ["3 Chairs", "1 Ball / Player"],
    coachesNeeded: 1,
    tags: ["scoring"],
    coachingPoints: [
      "Attack the first chair at full speed — don't slow before the move",
      "Euro: two-step wide, protect the ball with your off-arm",
      "Stepback: land with both feet at once, fire the shot immediately",
    ],
  },

  // Finishing
  {
    id: "drl_mikan",
    categoryId: "cat_finishing",
    title: "Mikan + Reverse Mikan",
    description: "Continuous alternating layups from each side of the basket without a dribble between makes. 20 reps each side. Reverse: same flow but use the backboard from the baseline angle.",
    skillFocus: "Footwork · soft touch · both hands",
    objective: "Build automatic footwork and soft touch on both sides of the basket at close range.",
    repFormat: "20 reps each side · Mikan then Reverse",
    defaultDurationMin: 5,
    intensity: "MEDIUM",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 20,
    equipment: ["1 Ball / Player"],
    coachesNeeded: 1,
    tags: ["bigs", "foundation"],
    coachingPoints: [
      "Jump off one foot each rep — no two-foot take-offs",
      "Keep the ball high throughout — don't bring it to your waist",
      "Soft fingertip touch; you're kissing it off the board, not throwing it",
    ],
  },
  {
    id: "drl_contact_finish",
    categoryId: "cat_finishing",
    title: "Contact Finish Gauntlet",
    description: "Player drives from the wing. Coach meets them in the lane with a bump pad on every rep. Player must absorb contact and still finish at the rim. 5 reps each side.",
    skillFocus: "Finishing through contact · body control",
    objective: "Teach players to stay composed and adjust their finish when they take a hit at the rim.",
    repFormat: "5 reps each side · contact on every drive",
    defaultDurationMin: 10,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 2,
    maxPlayers: 8,
    equipment: ["Pad", "1 Ball"],
    coachesNeeded: 2,
    tags: ["physicality"],
    coachingPoints: [
      "Brace your core before contact — don't flinch early",
      "Let the contact come through you; adjust the finish angle after impact",
      "Extend the shooting arm fully — short-arming causes misses under contact",
    ],
  },
  {
    id: "drl_jump_stop_reads",
    categoryId: "cat_finishing",
    title: "Jump-Stop Reads",
    description: "Player drives from the wing, hits a jump-stop at the elbow or nail. Coach shows a live 'help' hand signal: palm out = pass out, palm down = finish, fist = pivot and pass.",
    skillFocus: "Jump-stop control · live reads",
    objective: "Eliminate traveling habits and build the habit of reading the defense after gathering.",
    repFormat: "10 reps · randomized signal · both sides",
    defaultDurationMin: 8,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 8,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["decision"],
    coachingPoints: [
      "Land with both feet at the same time — no step-through",
      "Eyes on the coach signal the moment your feet land",
      "Protect the ball on the pivot — don't expose it to the double",
    ],
  },

  // Decision games / representative learning
  {
    id: "drl_1v1_3dribble",
    categoryId: "cat_decision",
    title: "1v1 Advantage — 3 Dribble Cap",
    description: "Start from wing with live defender. Offense gets max 3 dribbles to score or it's a turnover. Forces immediate decisiveness — no dribbling for comfort.",
    skillFocus: "1v1 scoring · decisiveness under pressure",
    objective: "Eliminate wasted dribbles by forcing players to choose an action within 3 dribbles.",
    repFormat: "5 reps offense → switch · rotate pairs every 3 rounds",
    defaultDurationMin: 8,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 2,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["small-sided", "decision", "game-like", "youth-appropriate"],
    coachingPoints: [
      "Win the first step; decide by the second dribble",
      "Play off contact, not around it",
      "Read defender's chest angle to determine drive direction",
    ],
  },
  {
    id: "drl_2v2_paint_touch",
    categoryId: "cat_decision",
    title: "2v2 Paint-Touch Game",
    description: "Live 2v2 half-court. Teams can only score after a player touches the paint — either by driving or catching a pass inside. Forces aggressive ball movement toward the basket.",
    skillFocus: "Paint attack · spacing reads · kick-out timing",
    objective: "Drive spacing and paint-first mentality by making interior touches a scoring prerequisite.",
    repFormat: "First to 5 · loser subs out · rotate through pairs",
    defaultDurationMin: 10,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["small-sided", "decision", "spacing", "youth-appropriate"],
    coachingPoints: [
      "Attack the gap under control and kick to the open teammate",
      "Relocate after the pass — don't stand and watch",
      "Defenders: stunt at the gap, recover with high hands",
    ],
  },
  {
    id: "drl_3v3_no_corner",
    categoryId: "cat_decision",
    title: "3v3 No-Corner Constraint",
    description: "Half-court 3v3 with cones blocking both corners. Players must operate from the slot and wing, which forces cutting, back-cuts, and quick reversal reads instead of standing in the corner.",
    skillFocus: "Cutting · slot spacing · reversal reads",
    objective: "Remove the 'stand in the corner' comfort zone and force active off-ball movement.",
    repFormat: "First to 5 · auto-rotate every 3 possessions",
    defaultDurationMin: 10,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 6,
    maxPlayers: 12,
    equipment: ["1 Ball", "2 Cones"],
    coachesNeeded: 1,
    tags: ["small-sided", "constraints-led", "spacing"],
    coachingPoints: [
      "If your man watches the ball for 2 seconds, cut",
      "Reverse the ball when the slot is overloaded",
      "Stay in motion — stationary offense is dead offense here",
    ],
  },
  {
    id: "drl_3v2_continuous_reads",
    categoryId: "cat_decision",
    title: "3v2 Continuous Read",
    description: "Transition 3v2 full court. Offense must make one extra pass against early help before finishing. After a score or stop, the two defenders fast-break the other way as a 2v1.",
    skillFocus: "Transition reads · extra-pass discipline",
    objective: "Train players to resist the first open look and find the better shot in transition.",
    repFormat: "Continuous · 10 possessions each group",
    defaultDurationMin: 9,
    intensity: "HIGH",
    surface: "FULL_COURT",
    minPlayers: 7,
    maxPlayers: 15,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["transition", "decision", "representative"],
    coachingPoints: [
      "Ball-handler: read the help and make one more pass",
      "Wings: sprint to the rim, don't trail — be a threat",
      "On the make, outlet immediately — don't celebrate",
    ],
  },
  {
    id: "drl_youth_pivot_tag",
    categoryId: "cat_decision",
    title: "Pivot + Pass Tag (U10)",
    description: "Ball-handler pivots away from pressure and delivers to a moving target. A defender tries to tag the lane before the pass arrives. Teaches triple-threat recognition in a fun constraint.",
    skillFocus: "Pivoting under pressure · passing to a moving target",
    objective: "Build the habit of pivoting before passing, not while panicking.",
    repFormat: "30 sec rounds · rotate roles every round",
    defaultDurationMin: 6,
    intensity: "LOW",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["1 Ball / Group", "4 Cones"],
    coachesNeeded: 1,
    tags: ["u10", "fundamentals", "decision", "passing"],
    coachingPoints: [
      "Get a strong base before you pivot — feet shoulder-width",
      "Eyes up before passing — see where you're throwing",
      "Pass fake first to move the defender, then deliver",
    ],
  },
  {
    id: "drl_youth_1v1_closeout",
    categoryId: "cat_decision",
    title: "1v1 Closeout Read (U10–U12)",
    description: "Coach chest-passes to the offensive player, while a defender closes out from the help line. Offense reads the closeout: shoot if the defender flies by, drive if they go under.",
    skillFocus: "Closeout reads · shoot-or-drive decision",
    objective: "Train players to see the defender's momentum and attack the right response automatically.",
    repFormat: "5 reps each spot (wing left, wing right, top) · rotate pairs",
    defaultDurationMin: 8,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["u10", "u12", "decision", "closeout-read"],
    coachingPoints: [
      "Catch ready: hands up, inside foot forward",
      "Read before you catch — not after",
      "If they fly by: shoot. If they brake: attack the inside shoulder",
    ],
  },

  // Team Offense
  {
    id: "drl_horns_walk",
    categoryId: "cat_offense",
    title: "Horns — Walk-Through (5v0)",
    description: "5v0 half-court install. Entry pass to elbow, backcut from the weakside, pin-down for the shooter. Walk through Read 1 (backcut open) then Read 2 (shooter off pin-down). No defense. Reps until every player knows every role.",
    skillFocus: "Set play install · off-ball timing",
    objective: "Engrain the Horns action so every player knows their read before live reps begin.",
    repFormat: "3 reps each role · coach calls 'Read 1' or 'Read 2'",
    defaultDurationMin: 10,
    intensity: "LOW",
    surface: "HALF_COURT",
    minPlayers: 5,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["sets", "install"],
    coachingPoints: [
      "Backcut player: wait for the entry pass, then cut — not before",
      "Pin-down screener: set a wide base and hold the angle",
      "Shooter: catch ready, square up immediately off the screen",
    ],
  },
  {
    id: "drl_horns_live",
    categoryId: "cat_offense",
    title: "Horns — Live (5v5)",
    description: "Horns set vs scout team defense. Reset after every turnover. Count makes, not reps. Continue until the offense earns 8 total makes from the action.",
    skillFocus: "Set execution under live defense",
    objective: "Stress-test the installed set against resistance and reinforce correct reads under pressure.",
    repFormat: "8 total makes · reset on turnover",
    defaultDurationMin: 15,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 10,
    maxPlayers: 12,
    equipment: ["1 Ball"],
    coachesNeeded: 2,
    tags: ["sets", "live"],
    coachingPoints: [
      "Run the action at game speed — don't slow down for the defense",
      "If Read 1 is denied, continue into Read 2 without telegraphing",
      "Scout team: play honest defense — simulate what you'll see Friday",
    ],
  },
  {
    id: "drl_motion_strong",
    categoryId: "cat_offense",
    title: "5-Out Motion Strong",
    description: "5-out open set with pass-cut-fill rules. After every pass, the passer cuts: if the ball is swung and the cutter is open, hit them for the layup. Otherwise fill an empty spot. Score off back-cut, DHO, or skip pass.",
    skillFocus: "Ball movement · spacing · back-cut reads",
    objective: "Build a repeatable half-court motion system that creates open shots without set plays.",
    repFormat: "5-min continuous · track basket types (cut / DHO / skip)",
    defaultDurationMin: 12,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 5,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["motion"],
    coachingPoints: [
      "Every pass → cut immediately, don't wait",
      "Hold the corner — don't drift into traffic before the skip",
      "On the DHO: giver screens low, receiver reads the hip",
    ],
  },
  {
    id: "drl_transition_3v2_2v1",
    categoryId: "cat_offense",
    title: "3v2 → 2v1 Continuous",
    description: "Three offensive players attack two defenders. After a score or defensive rebound, the two defenders immediately outlet and attack the other end 2v1 against the designated trailer. Continuous with no breaks.",
    skillFocus: "Transition offense · quick decisions · secondary break",
    objective: "Train players to sprint and make quick decisions in transition before the defense sets up.",
    repFormat: "Continuous · 12 possessions per group",
    defaultDurationMin: 12,
    intensity: "HIGH",
    surface: "FULL_COURT",
    minPlayers: 8,
    maxPlayers: 15,
    equipment: ["2 Balls"],
    coachesNeeded: 1,
    tags: ["transition", "decision"],
    coachingPoints: [
      "Ball-handler: attack the nail, force the big to commit",
      "Wings: fill early and wide — be a kickout threat at all times",
      "2v1: don't over-dribble; attack until the help commits, then pass",
    ],
  },
  {
    id: "drl_blob_box",
    categoryId: "cat_offense",
    title: "BLOB — Box Cross",
    description: "Baseline out-of-bounds. Box formation, cross-screen sets an elevator for the shooter cutting off double stagger. Inbounder looks shooter first, then flare for the secondary option. 3 reps left side, 3 reps right side.",
    skillFocus: "BLOB execution · off-ball screening · situational offense",
    objective: "Develop a reliable under-one-minute play for baseline restarts without live pressure.",
    repFormat: "3 reps each side · coach signals primary or secondary",
    defaultDurationMin: 6,
    intensity: "LOW",
    surface: "BASELINE",
    minPlayers: 5,
    maxPlayers: 10,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["situational", "BLOB"],
    coachingPoints: [
      "Screener: seal wide and hold — give the cutter a clean lane",
      "Shooter: hesitate one count before using the elevator",
      "Inbounder: sell the skip first to freeze the defense",
    ],
  },

  // Team Defense
  {
    id: "drl_shell_defense",
    categoryId: "cat_defense",
    title: "4-on-4 Shell Drill",
    description: "4v4 half-court with no live scoring. Coach passes around the perimeter and calls 'drive' or 'kick.' Defenders must jump to the ball on every pass, close out on kicks, and collapse on drives. Reset on any breakdown.",
    skillFocus: "Help-side positioning · ball-side recovery",
    objective: "Build automatic defensive rotations as a unit before adding the complexity of live offense.",
    repFormat: "Continuous until 3 clean possessions in a row · then add scoring",
    defaultDurationMin: 12,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 8,
    maxPlayers: 8,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["foundation"],
    coachingPoints: [
      "Jump to the ball on every pass — you should be moving before the pass lands",
      "Ball-side: deny. Help-side: see man and ball at all times",
      "Closeout: chop your feet the last 6 feet — don't sprint past the shooter",
    ],
  },
  {
    id: "drl_closeouts",
    categoryId: "cat_defense",
    title: "Closeout & Contest",
    description: "Defender starts at help position (lane line). Coach passes to wing shooter. Defender sprints and closes out under control — high hands, no foul. Shooter reads: if defender flies by, shoot. 3 reps each defender, rotate through 5 baskets.",
    skillFocus: "Closeout technique · ball pressure",
    objective: "Build the habit of a controlled, high-hands closeout that contests without fouling.",
    repFormat: "3 reps each defender × 5 baskets",
    defaultDurationMin: 8,
    intensity: "HIGH",
    surface: "HALF_COURT",
    minPlayers: 6,
    maxPlayers: 18,
    equipment: ["3 Balls"],
    coachesNeeded: 2,
    tags: ["technique"],
    coachingPoints: [
      "Sprint until 6 feet away, then chop and brake",
      "High hands: both arms up, not one — contest the shot and the vision",
      "Don't jump on the catch — wait for the shot fake",
    ],
  },
  {
    id: "drl_pnr_ice",
    categoryId: "cat_defense",
    title: "PnR — ICE Coverage",
    description: "Sideline ball screen. Ball defender calls 'ICE' and forces the dribbler baseline (away from the screen). Big man drops to the nail, cutting off the roll. Defense recovers if the ball-handler rejects baseline.",
    skillFocus: "Pick-and-roll defense · ICE coverage",
    objective: "Install and rehearse the ICE coverage against sideline ball screens before seeing it live.",
    repFormat: "5 reps offense · switch roles · scout specific opponent if applicable",
    defaultDurationMin: 10,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 4,
    maxPlayers: 8,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["scout", "coverage"],
    coachingPoints: [
      "Ball defender: get your hip in the path before the screen is set",
      "Big: drop two steps, protect the nail, don't chase the ball",
      "Communication: 'ICE' call before the dribbler attacks",
    ],
  },
  {
    id: "drl_zone_offense",
    categoryId: "cat_defense",
    title: "vs 2-3 Zone — High-Low",
    description: "Offensive install vs stationary or coach-directed 2-3 zone. Flash a player to the high post, look to the low post on the skip, or reverse for a wing three. 3 reps per offensive entry angle.",
    skillFocus: "Zone attack · high-low reads · skip timing",
    objective: "Give players a repeatable zone attack structure so they aren't improvising against a 2-3.",
    repFormat: "3 reps per entry (top, wing left, wing right)",
    defaultDurationMin: 10,
    intensity: "MEDIUM",
    surface: "HALF_COURT",
    minPlayers: 10,
    maxPlayers: 12,
    equipment: ["1 Ball"],
    coachesNeeded: 1,
    tags: ["zone"],
    coachingPoints: [
      "High-post flash: catch facing the basket, look low first",
      "Skip pass: be ready to shoot off the catch — don't hesitate",
      "Reverse the ball quickly — slow ball movement gives the zone time to recover",
    ],
  },

  // Conditioning
  {
    id: "drl_suicides",
    categoryId: "cat_conditioning",
    title: "Suicides × 4",
    description: "Touch free throw line, turn and back. Touch half court, turn and back. Touch far free throw line, turn and back. Touch far baseline, turn and back — that's one rep. 4 reps, each under 28 seconds. Rest 30 sec between reps.",
    skillFocus: "Linear acceleration · anaerobic conditioning",
    objective: "Develop the burst-and-recover conditioning pattern that mirrors game-speed sprints.",
    repFormat: "4 reps · target: sub-28 sec · 30 sec rest",
    defaultDurationMin: 5,
    intensity: "MAX",
    surface: "FULL_COURT",
    minPlayers: 1,
    maxPlayers: 25,
    equipment: [],
    coachesNeeded: 1,
    tags: ["finisher"],
    coachingPoints: [
      "Attack the line at full speed — don't decelerate 5 feet early",
      "Touch with your foot, not just your hand",
      "Breathe out on the sprint back — don't hold your breath",
    ],
  },
  {
    id: "drl_lane_slides",
    categoryId: "cat_conditioning",
    title: "Lane Slide Cycles",
    description: "Defensive slide from one lane line to the other and back = 1 rep. 30 seconds of continuous reps followed by 15 seconds of rest. Repeat 6 times. Do not cross your feet — full lateral slide throughout.",
    skillFocus: "Defensive footwork · lateral conditioning",
    objective: "Build the lateral endurance and technique to maintain proper defensive position through fourth-quarter fatigue.",
    repFormat: "30 sec on / 15 sec off × 6 rounds",
    defaultDurationMin: 5,
    intensity: "HIGH",
    surface: "STATIONARY",
    minPlayers: 1,
    maxPlayers: 25,
    equipment: [],
    coachesNeeded: 1,
    tags: ["defense", "footwork"],
    coachingPoints: [
      "Stay in a low stance the entire round — if you stand up, you're cheating",
      "Lead with the outside foot, don't cross",
      "Fingertips out like you're pressuring the ball — simulate real defense",
    ],
  },
  {
    id: "drl_22_in_4",
    categoryId: "cat_conditioning",
    title: "22 Layups in 4 Minutes",
    description: "Two lines at half court. Both lines attack simultaneously from opposite sides. Goal: 22 total made layups before 4 minutes expires. If the team misses during a run, the count restarts from 0.",
    skillFocus: "Finishing under fatigue · team accountability",
    objective: "Force maximum effort on layups by combining conditioning with a make-based counting pressure.",
    repFormat: "22 makes before 4:00 · miss resets count to 0",
    defaultDurationMin: 5,
    intensity: "HIGH",
    surface: "FULL_COURT",
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ["2 Balls"],
    coachesNeeded: 1,
    tags: ["competitive"],
    coachingPoints: [
      "Sprint every rep — this is conditioning, not shooting practice",
      "Jump off one foot — no two-footed takes when tired",
      "After a miss, reset mentally immediately — get back in line fast",
    ],
  },

  // Film & Walk-through
  {
    id: "drl_film_review",
    categoryId: "cat_film",
    title: "Scout Film — 10 Clips",
    description: "Curated 10-clip reel of the upcoming opponent's top offensive and defensive actions. Coach pauses after each clip and asks the group a question before moving on. Athletes answer aloud — this is not passive watching.",
    skillFocus: "Opponent scouting · decision anticipation",
    objective: "Prepare players to recognize the opponent's primary actions before they see them on the floor.",
    repFormat: "10 clips · pause + question after each",
    defaultDurationMin: 12,
    intensity: "LOW",
    surface: "STATIONARY",
    minPlayers: 5,
    maxPlayers: 20,
    equipment: ["TV / Projector"],
    coachesNeeded: 1,
    tags: ["scout", "film"],
    coachingPoints: [
      "Pause at the moment of decision — ask 'what is the read here?'",
      "Focus on the off-ball players, not just the ball",
      "Connect each clip to a coverage or action you'll run on the floor",
    ],
  },
  {
    id: "drl_play_install",
    categoryId: "cat_film",
    title: "Play Install — Whiteboard",
    description: "Coach diagrams the play or coverage on a whiteboard, then athletes mirror the action on the court at half-speed without defense. Check each player's understanding before adding the second read.",
    skillFocus: "Conceptual install · spatial awareness",
    objective: "Bridge from whiteboard diagram to physical movement before any competitive reps.",
    repFormat: "Diagram → half-speed walk-through → questions → repeat",
    defaultDurationMin: 8,
    intensity: "LOW",
    surface: "HALF_COURT",
    minPlayers: 5,
    maxPlayers: 12,
    equipment: ["Whiteboard"],
    coachesNeeded: 1,
    tags: ["install"],
    coachingPoints: [
      "Walk, don't jog — the goal is positions, not speed",
      "Freeze and point when someone is out of position",
      "Each player must be able to explain their role aloud before live reps",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* PracticePlan model                                                          */
/* -------------------------------------------------------------------------- */

export type PracticePlanBlock = {
  id: string;
  drillId: string;
  durationMin: number;
  notes: string;
  /** Number of athletes that this block targets (overrides drill default for the plan). */
  athleteCount?: number;
};

// ── Outcome-driven metadata types ────────────────────────────────────────────

export type PracticeObjectiveCategory = "skill" | "tactic" | "mindset" | "conditioning" | "opponent_prep";

export type PracticeObjective = {
  id: string;
  label: string;
  category: PracticeObjectiveCategory;
};

export type PracticeTargetGroupType = "full_team" | "guards" | "bigs" | "wings" | "starters" | "bench";

export type PracticeTargetGroup = {
  type: PracticeTargetGroupType;
  label: string;
};

export type PracticeIntensity = "RECOVERY" | "MODERATE" | "HIGH" | "MAX";

export type DrillFeedback = {
  drillId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  note: string;
  teachAgain: boolean;
};

export type PracticeReflection = {
  whatWorked: string;
  whatDidnt: string;
  generalNote: string;
  actualDurationMin: number;
  drillFeedback: DrillFeedback[];
  completedAt: string; // ISO
};

export type PracticePlan = {
  id: string;
  title: string;
  date: string; // ISO date string for "Practice on"
  startTime: string; // "16:00"
  budgetMin: number;
  opponent?: string;
  focus: string;
  authorId: string;
  authorName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "COMPLETED";
  blocks: PracticePlanBlock[];
  createdAt: string; // ISO
  updatedAt: string; // ISO

  // Phase-2: outcome-driven fields
  objectives?: PracticeObjective[];
  targetGroup?: PracticeTargetGroup;
  skillEmphasis?: Record<string, number>; // categoryId → 0-100 weight
  plannedIntensity?: PracticeIntensity;
  linkedEventId?: string;
  reflection?: PracticeReflection;
  followUpActionIds?: string[];
};

export const practicePlans: PracticePlan[] = [
  {
    id: "plan_1",
    title: "Pre-Westbury Sharpening",
    date: "2026-05-02",
    startTime: "16:00",
    budgetMin: 90,
    opponent: "Westbury Catholic",
    focus: "PnR coverage (ICE) + zone offense + late-clock execution.",
    authorId: "user_coach_1",
    authorName: "Coach Daniels",
    status: "PUBLISHED",
    objectives: [
      { id: "obj_pnr_coverage", label: "PnR Coverage", category: "tactic" },
      { id: "obj_zone_offense",  label: "Zone Offense",  category: "tactic" },
      { id: "obj_late_clock",    label: "Late Clock",    category: "tactic" },
      { id: "obj_opponent_prep", label: "Opponent Prep", category: "opponent_prep" },
      { id: "obj_compete",       label: "Compete Level", category: "mindset" },
    ],
    targetGroup: { type: "full_team", label: "Full Team" },
    plannedIntensity: "HIGH",
    createdAt: "2026-04-29T22:00:00Z",
    updatedAt: "2026-04-30T11:30:00Z",
    blocks: [
      { id: "blk_1", drillId: "drl_dyn_warmup", durationMin: 8, notes: "Quick — coaches keep tempo." },
      { id: "blk_2", drillId: "drl_layup_lines", durationMin: 7, notes: "Lefties to far end." },
      { id: "blk_3", drillId: "drl_shooting_circuit", durationMin: 12, notes: "Pairs at every basket." },
      { id: "blk_4", drillId: "drl_pnr_ice", durationMin: 12, notes: "vs Westbury sets — Coverage Sheet" },
      { id: "blk_5", drillId: "drl_zone_offense", durationMin: 10, notes: "4-out vs 2-3, high-low look." },
      { id: "blk_6", drillId: "drl_horns_live", durationMin: 15, notes: "Game-speed. 8 makes total." },
      { id: "blk_7", drillId: "drl_blob_box", durationMin: 6, notes: "BLOB after timeout reps." },
      { id: "blk_8", drillId: "drl_free_throws", durationMin: 10, notes: "50-in-a-row finisher." },
      { id: "blk_9", drillId: "drl_suicides", durationMin: 5, notes: "Earned, not punishment." },
    ],
  },
  {
    id: "plan_2",
    title: "Friday Skill Day",
    date: "2026-05-04",
    startTime: "15:30",
    budgetMin: 75,
    focus: "Individual development — shooting + handles + finishing.",
    authorId: "user_coach_1",
    authorName: "Coach Daniels",
    status: "DRAFT",
    objectives: [
      { id: "obj_shooting",     label: "Shooting",     category: "skill" },
      { id: "obj_ball_handling",label: "Ball Handling", category: "skill" },
      { id: "obj_finishing",    label: "Finishing",    category: "skill" },
    ],
    targetGroup: { type: "guards", label: "Guards" },
    plannedIntensity: "MODERATE",
    createdAt: "2026-04-30T08:00:00Z",
    updatedAt: "2026-04-30T08:00:00Z",
    blocks: [
      { id: "blk_a", drillId: "drl_dyn_warmup", durationMin: 8, notes: "" },
      { id: "blk_b", drillId: "drl_two_ball", durationMin: 10, notes: "Two-ball stationary." },
      { id: "blk_c", drillId: "drl_form_shooting", durationMin: 10, notes: "Block out arc, then 5-spot." },
      { id: "blk_d", drillId: "drl_full_court_handles", durationMin: 12, notes: "" },
      { id: "blk_e", drillId: "drl_chair_attack", durationMin: 10, notes: "Reads vs imaginary help." },
      { id: "blk_f", drillId: "drl_jump_stop_reads", durationMin: 8, notes: "" },
      { id: "blk_g", drillId: "drl_3pt_circuit", durationMin: 8, notes: "Beat-the-pro." },
    ],
  },
  {
    id: "plan_3",
    title: "Monday Install Day",
    date: "2026-05-05",
    startTime: "16:00",
    budgetMin: 90,
    focus: "Install: 5-Out Motion Strong + ICE + new BLOB.",
    authorId: "user_coach_1",
    authorName: "Coach Daniels",
    status: "DRAFT",
    createdAt: "2026-04-30T09:30:00Z",
    updatedAt: "2026-04-30T09:30:00Z",
    blocks: [
      { id: "blk_x", drillId: "drl_dyn_warmup", durationMin: 8, notes: "" },
      { id: "blk_y", drillId: "drl_partner_passing", durationMin: 5, notes: "" },
      { id: "blk_z", drillId: "drl_play_install", durationMin: 12, notes: "Whiteboard install — Motion." },
      { id: "blk_w", drillId: "drl_motion_strong", durationMin: 15, notes: "Full reps 5v0 → 5v5." },
      { id: "blk_v", drillId: "drl_film_review", durationMin: 12, notes: "Last week's bad possessions." },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function planTotalMinutes(plan: PracticePlan): number {
  return plan.blocks.reduce((sum, b) => sum + b.durationMin, 0);
}

export function planEquipment(plan: PracticePlan): string[] {
  const set = new Set<string>();
  for (const b of plan.blocks) {
    const drill = drillLibrary.find((d) => d.id === b.drillId);
    drill?.equipment.forEach((e) => set.add(e));
  }
  return Array.from(set).sort();
}

export function planMaxCoaches(plan: PracticePlan): number {
  return plan.blocks.reduce((max, b) => {
    const drill = drillLibrary.find((d) => d.id === b.drillId);
    return Math.max(max, drill?.coachesNeeded ?? 1);
  }, 1);
}

/**
 * Resolve a drill by id from the GLOBAL library only. Custom-drill consumers
 * should use the `useResolveDrill` hook from `customDrillsStore`-aware sites,
 * which falls back to the persisted custom-drills store.
 */
export function findDrill(drillId: string): Drill | undefined {
  return drillLibrary.find((d) => d.id === drillId);
}

export function findCategory(categoryId: string): DrillCategory | undefined {
  return drillCategories.find((c) => c.id === categoryId);
}
