/* -------------------------------------------------------------------------- */
/* benchmarks.ts — Benchmarking System & IDP Generator mock data              */
/* -------------------------------------------------------------------------- */

export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type AgeGroup = "13U" | "15U" | "17U" | "18U";
export type SkillCategory =
  | "ball_handling"
  | "shooting"
  | "finishing"
  | "defense"
  | "footwork"
  | "iq_reads"
  | "athleticism"
  | "conditioning";

export type PositionBenchmark = {
  position: Position;
  ageGroup: AgeGroup;
  skill: SkillCategory;
  targetLevel: number;
  eliteLevel: number;
  minimumLevel: number;
  description: string;
};

export type PlayerBenchmarkGap = {
  playerId: string;
  playerName: string;
  position: Position;
  ageGroup: AgeGroup;
  skill: SkillCategory;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  priority: "critical" | "high" | "moderate" | "none";
  recommendation: string;
};

export type BenchmarkReport = {
  playerId: string;
  playerName: string;
  position: Position;
  ageGroup: AgeGroup;
  gradYear: number;
  gaps: PlayerBenchmarkGap[];
  overallGapScore: number;
  topPriority: SkillCategory[];
  strengths: SkillCategory[];
  generatedAt: string;
};

export type IDPGoalTemplate = {
  skill: SkillCategory;
  title: string;
  description: string;
  baselineLevel: number;
  targetLevel: number;
  timelineWeeks: number;
  milestones: string[];
  keyDrills: string[];
  successCriteria: string;
};

export type IDPTemplate = {
  id: string;
  name: string;
  focusAreas: SkillCategory[];
  typicalDuration: number;
  description: string;
  bestFor: string;
  sampleGoals: IDPGoalTemplate[];
};

/* -------------------------------------------------------------------------- */
/* Skill display metadata                                                      */
/* -------------------------------------------------------------------------- */

export const SKILL_LABELS: Record<SkillCategory, string> = {
  ball_handling: "Ball Handling",
  shooting: "Shooting",
  finishing: "Finishing",
  defense: "Defense",
  footwork: "Footwork",
  iq_reads: "IQ & Reads",
  athleticism: "Athleticism",
  conditioning: "Conditioning",
};

export const SKILL_ICONS: Record<SkillCategory, string> = {
  ball_handling: "✋",
  shooting: "🎯",
  finishing: "🏀",
  defense: "🛡️",
  footwork: "👟",
  iq_reads: "🧠",
  athleticism: "⚡",
  conditioning: "💪",
};

/* -------------------------------------------------------------------------- */
/* Position Benchmarks — full matrix                                           */
/* 5 positions × 4 age groups × 8 skills = 160 entries                       */
/* -------------------------------------------------------------------------- */

type BenchmarkEntry = {
  target: number;
  elite: number;
  min: number;
  desc: string;
};

type Matrix = {
  [P in Position]: {
    [A in AgeGroup]: {
      [S in SkillCategory]: BenchmarkEntry;
    };
  };
};

const MATRIX: Matrix = {
  PG: {
    "13U": {
      ball_handling: { target: 2, elite: 3, min: 1, desc: "13U PGs need basic two-hand comfort and simple change of direction at slow speed." },
      shooting:      { target: 2, elite: 3, min: 1, desc: "Consistent form from mid-range; game-speed shooting not yet expected." },
      finishing:     { target: 2, elite: 3, min: 1, desc: "Layups off both feet; contact finishing will come later." },
      defense:       { target: 2, elite: 3, min: 1, desc: "On-ball stance fundamentals and active hands in passing lanes." },
      footwork:      { target: 2, elite: 3, min: 1, desc: "Triple threat, pivot technique, and first-step quickness basics." },
      iq_reads:      { target: 2, elite: 3, min: 1, desc: "Understands basic pick-and-roll coverage and simple drive-kick reads." },
      athleticism:   { target: 2, elite: 3, min: 1, desc: "First step quickness and change-of-direction beginning to emerge." },
      conditioning:  { target: 2, elite: 3, min: 1, desc: "Can sustain effort for full junior game; basic aerobic base." },
    },
    "15U": {
      ball_handling: { target: 3, elite: 4, min: 2, desc: "15U PGs should be reliable with both hands at game speed in open court." },
      shooting:      { target: 3, elite: 4, min: 2, desc: "Consistent three-point range and pull-up off the dribble expected." },
      finishing:     { target: 3, elite: 4, min: 2, desc: "Can finish through light contact; euro step and floater developing." },
      defense:       { target: 3, elite: 4, min: 2, desc: "Solid on-ball defense; can guard off screens and contest without fouling." },
      footwork:      { target: 3, elite: 4, min: 2, desc: "Quick first step, controlled stop-and-go, solid jump stop mechanics." },
      iq_reads:      { target: 3, elite: 4, min: 2, desc: "Reads basic ball-screen actions, spot-up vs. drive decisions in half-court." },
      athleticism:   { target: 3, elite: 4, min: 2, desc: "Lateral quickness and vertical beginning to differentiate from peers." },
      conditioning:  { target: 3, elite: 4, min: 2, desc: "Can maintain intensity through 32-minute varsity-style game." },
    },
    "17U": {
      ball_handling: { target: 4, elite: 5, min: 3, desc: "Elite handles under pressure — snap crossovers, between-leg at full speed." },
      shooting:      { target: 4, elite: 5, min: 3, desc: "Game-ready shooter off catch and creation; 35%+ from three in games." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Finishes through contact, uses angles and body control in traffic." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Disciplined on-ball, reads rotations, makes correct help-side decisions." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Efficient footwork in every action — pull-ups, finishes, defensive slides." },
      iq_reads:      { target: 4, elite: 5, min: 3, desc: "Reads complex actions, makes second and third-level passes, understands flow." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Explosive first step, quick release, gets to spots at game speed." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Maintains competitive edge through full tournament weekend." },
    },
    "18U": {
      ball_handling: { target: 4, elite: 5, min: 3, desc: "College-ready handles — effective vs. full-court pressure, no weak hand." },
      shooting:      { target: 4, elite: 5, min: 3, desc: "Reliable off screen, trail three, and pull-up — college-level volume." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Consistent finish vs. length and physicality at college level." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Locks down in isolation, communicates defensive schemes, no glaring gaps." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Automatic footwork in every situation — no wasted steps." },
      iq_reads:      { target: 5, elite: 5, min: 3, desc: "Can run a collegiate offense; reads all five defenders, orchestrates flow." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Separates from peers athletically; first step and burst are weapons." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Full-game elite conditioning; performs as well in 4Q as 1Q." },
    },
  },
  SG: {
    "13U": {
      ball_handling: { target: 2, elite: 3, min: 1, desc: "Basic dribbling in space; beginning to use off-hand in simple movements." },
      shooting:      { target: 2, elite: 3, min: 1, desc: "Consistent mid-range form; early catch-and-shoot off simple sets." },
      finishing:     { target: 2, elite: 3, min: 1, desc: "Standard layup package; beginning to learn floater." },
      defense:       { target: 2, elite: 3, min: 1, desc: "Active hands on ball; understands help-side basics." },
      footwork:      { target: 2, elite: 3, min: 1, desc: "Basic jab step and shot fake mechanics; footwork in catch situations." },
      iq_reads:      { target: 2, elite: 3, min: 1, desc: "Reads simple drive or kick; beginning to understand spacing." },
      athleticism:   { target: 2, elite: 3, min: 1, desc: "Athletic development beginning; decent burst off catch." },
      conditioning:  { target: 2, elite: 3, min: 1, desc: "Can sustain full junior game effort." },
    },
    "15U": {
      ball_handling: { target: 3, elite: 4, min: 2, desc: "Comfortable creating off the dribble in half-court; some ball-screen reads." },
      shooting:      { target: 3, elite: 4, min: 2, desc: "Reliable spot-up shooter off catch; beginning to shoot off movement." },
      finishing:     { target: 3, elite: 4, min: 2, desc: "Gets to the line; can finish in traffic with light contact." },
      defense:       { target: 3, elite: 4, min: 2, desc: "Fights over screens, contests shots without fouling, reads passing lanes." },
      footwork:      { target: 3, elite: 4, min: 2, desc: "Strong footwork on catch-and-shoot and off movement; drift control." },
      iq_reads:      { target: 3, elite: 4, min: 2, desc: "Understands spacing, finds open man off drive kick, reads defensive gaps." },
      athleticism:   { target: 3, elite: 4, min: 2, desc: "Enough quickness to create separation; plays above the rim in open court." },
      conditioning:  { target: 3, elite: 4, min: 2, desc: "Maintains shooting form late in games; sustains defensive intensity." },
    },
    "17U": {
      ball_handling: { target: 3, elite: 4, min: 2, desc: "Creates off pull-up and dribble penetration; change of pace is effective." },
      shooting:      { target: 4, elite: 5, min: 3, desc: "High-volume shooter off screens, pull-ups, and spot-ups; college-ready range." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Draws contact, finishes through it; uses floater and euro step." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Fights through screens, locks down wings, communicates team defense." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Efficient footwork on and off the ball — catch, shoot, create." },
      iq_reads:      { target: 3, elite: 4, min: 2, desc: "Reads defense on movement actions; makes correct shot vs. pass decision." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Elite athlete on the wing — bouncy, quick laterally, can guard multiple positions." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Plays hard both ends for full 32 minutes; no drop-off in 4Q." },
    },
    "18U": {
      ball_handling: { target: 3, elite: 5, min: 2, desc: "Reliable creation off the dribble; not a liability as secondary ball-handler." },
      shooting:      { target: 5, elite: 5, min: 3, desc: "Elite shooting in all zones; college coaches evaluate this skill most." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Draws fouls, finishes in traffic — separates elite SGs at recruitment." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Lockdown ability at the position; college coaches need commitment defensively." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "No wasted motion — every catch, screen, cut is executed crisply." },
      iq_reads:      { target: 3, elite: 5, min: 2, desc: "Understands modern off-ball concepts; runs correct actions without coaching." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Athletic profile stands out at the position; burst and length matter." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Elite conditioning base for college-level training demands." },
    },
  },
  SF: {
    "13U": {
      ball_handling: { target: 2, elite: 3, min: 1, desc: "Basic dribbling in open space; beginning to handle in transition." },
      shooting:      { target: 2, elite: 3, min: 1, desc: "Consistent mid-range; early work on wing three-point range." },
      finishing:     { target: 2, elite: 3, min: 1, desc: "Strong layups; learns to play through contact." },
      defense:       { target: 2, elite: 3, min: 1, desc: "Understands basic wing defense; contests without leaving feet." },
      footwork:      { target: 2, elite: 3, min: 1, desc: "Good base on catch; learning to use jab step." },
      iq_reads:      { target: 2, elite: 3, min: 1, desc: "Recognizes skip passes and back-cuts in simple sets." },
      athleticism:   { target: 2, elite: 3, min: 1, desc: "Length and athleticism beginning to emerge." },
      conditioning:  { target: 2, elite: 3, min: 1, desc: "Can sustain full game effort at junior level." },
    },
    "15U": {
      ball_handling: { target: 3, elite: 4, min: 2, desc: "Can handle in transition and make a play off the bounce in space." },
      shooting:      { target: 3, elite: 4, min: 2, desc: "Consistent wing three-pointer; developing pull-up from mid-range." },
      finishing:     { target: 3, elite: 4, min: 2, desc: "Strong through contact from wing drives; uses size near the basket." },
      defense:       { target: 3, elite: 4, min: 2, desc: "Defends both wings and some perimeter big; uses length to alter shots." },
      footwork:      { target: 3, elite: 4, min: 2, desc: "Wing footwork — jab, shot fake, and baseline drive mechanics solid." },
      iq_reads:      { target: 3, elite: 4, min: 2, desc: "Reads drive-kick, corner cuts, and post-entry reads." },
      athleticism:   { target: 3, elite: 4, min: 2, desc: "Explosive enough to attack close-outs; length starting to be a factor." },
      conditioning:  { target: 3, elite: 4, min: 2, desc: "Sustains intensity on both ends for full game." },
    },
    "17U": {
      ball_handling: { target: 3, elite: 4, min: 2, desc: "Initiates offense off the bounce; effective off ball-screens." },
      shooting:      { target: 4, elite: 5, min: 3, desc: "College-ready wing shooter; hits off catch and off dribble." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Combination of size and touch near the rim; draws fouls." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Can guard 1-4 on different possessions; communicates and rotates." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Crisp catch-and-shoot mechanics; efficient baseline and middle drives." },
      iq_reads:      { target: 3, elite: 4, min: 2, desc: "Makes correct decisions as cutter, passer, and shooter in half-court." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Elite length and burst; can guard quicker guards and overpower smaller forwards." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Physical and energetic for full 32 minutes at high level." },
    },
    "18U": {
      ball_handling: { target: 3, elite: 5, min: 2, desc: "Versatile enough to handle in transition and secondary sets." },
      shooting:      { target: 4, elite: 5, min: 3, desc: "Elite wing shooting is the primary college recruitment metric for SFs." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Uses size and length to score at the rim at college level." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Versatile defender — guards wings and switches onto bigs and guards." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "No inefficiency in any footwork pattern — automated at game speed." },
      iq_reads:      { target: 4, elite: 5, min: 3, desc: "Understands all offensive and defensive concepts at a high level." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Athletic profile is a primary differentiator at the SF position." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Elite conditioning base ready for college practice demands." },
    },
  },
  PF: {
    "13U": {
      ball_handling: { target: 1, elite: 2, min: 1, desc: "Basic dribbling in close quarters; beginning face-up game." },
      shooting:      { target: 2, elite: 3, min: 1, desc: "Reliable mid-range face-up; early work on extended shooting." },
      finishing:     { target: 2, elite: 3, min: 1, desc: "Strong two-handed finishes and basic post moves near basket." },
      defense:       { target: 2, elite: 3, min: 1, desc: "Solid post defense stance; learns to guard both sides of the lane." },
      footwork:      { target: 2, elite: 3, min: 1, desc: "Drop step, up-and-under, and face-up footwork basics." },
      iq_reads:      { target: 2, elite: 3, min: 1, desc: "Understands high-low action, screen-and-roll role, and helpside basics." },
      athleticism:   { target: 2, elite: 3, min: 1, desc: "Developing strength and vertical; beginning to rebound with purpose." },
      conditioning:  { target: 2, elite: 3, min: 1, desc: "Can sustain physical post play for full junior game." },
    },
    "15U": {
      ball_handling: { target: 2, elite: 3, min: 1, desc: "Can handle in space in transition; early face-up creation off dribble." },
      shooting:      { target: 2, elite: 3, min: 1, desc: "Solid mid-range face-up; beginning to develop extended range to draw bigs out." },
      finishing:     { target: 3, elite: 4, min: 2, desc: "Post moves with both hands; goes up strong through contact." },
      defense:       { target: 3, elite: 4, min: 2, desc: "Physical post defense, boxes out, reads cutters and help-side rotations." },
      footwork:      { target: 3, elite: 4, min: 2, desc: "Strong post footwork — pivot, power step, face-up drive." },
      iq_reads:      { target: 2, elite: 3, min: 1, desc: "Understands screen-and-roll reads, high-low, and cutting timing." },
      athleticism:   { target: 3, elite: 4, min: 2, desc: "Developing into physical rebounder and rim protector; athleticism emerging." },
      conditioning:  { target: 3, elite: 4, min: 2, desc: "Sustains physical play both ends for full game." },
    },
    "17U": {
      ball_handling: { target: 2, elite: 4, min: 1, desc: "Can face up and create in space; modern stretch-4 development valued." },
      shooting:      { target: 3, elite: 4, min: 2, desc: "Extended mid-range and developing three-point range; stretch-4 profile important." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Strong finisher with both hands around the rim; draws fouls." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Guards on the perimeter and in the post; communicates switches." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Post and perimeter footwork — can operate from both positions." },
      iq_reads:      { target: 3, elite: 4, min: 2, desc: "Reads ball-screen coverages, high-low passes, and defensive rotations." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Physical and explosive — dominant rebounder and finisher at level." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Physical conditioning to compete 32 minutes at high level." },
    },
    "18U": {
      ball_handling: { target: 3, elite: 5, min: 2, desc: "Can operate in pick-and-pop, face-up, and some drive situations." },
      shooting:      { target: 3, elite: 5, min: 2, desc: "College PFs need to shoot — three-point range is rapidly becoming required." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Dominant finisher around the rim; uses physicality to score." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Versatile enough to switch while still protecting the paint." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Complete footwork package — post and perimeter automated." },
      iq_reads:      { target: 4, elite: 5, min: 3, desc: "Understands pick-and-roll coverage from both sides; reads flow quickly." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Elite physical profile differentiates at the college level." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Physical conditioning base for college-level training." },
    },
  },
  C: {
    "13U": {
      ball_handling: { target: 1, elite: 2, min: 1, desc: "Basic handling to avoid turnovers — outlet passes and short dribbles." },
      shooting:      { target: 1, elite: 2, min: 1, desc: "Basic scoring around the rim; no range expected at this level." },
      finishing:     { target: 2, elite: 3, min: 1, desc: "Reliable two-handed finishes; strong position near the basket." },
      defense:       { target: 2, elite: 3, min: 1, desc: "Rim protection basics, box-out technique, and weak-side help." },
      footwork:      { target: 2, elite: 3, min: 1, desc: "Drop step, hop step, and basic post entry footwork." },
      iq_reads:      { target: 2, elite: 3, min: 1, desc: "Sets good screens, seals defenders, makes simple post reads." },
      athleticism:   { target: 2, elite: 3, min: 1, desc: "Developing strength and coordination; vertical beginning to develop." },
      conditioning:  { target: 2, elite: 3, min: 1, desc: "Can sustain physical play for full junior game." },
    },
    "15U": {
      ball_handling: { target: 1, elite: 3, min: 1, desc: "Basic ball-handling in tight spaces; can handle in secondary sets." },
      shooting:      { target: 2, elite: 3, min: 1, desc: "Reliable face-up mid-range; early development of extended shooting." },
      finishing:     { target: 3, elite: 4, min: 2, desc: "Strong two-handed and drop-step finishes; beginning to finish over help." },
      defense:       { target: 3, elite: 4, min: 2, desc: "Rim protection, box-out, and help-side presence; beginning to guard on perimeter." },
      footwork:      { target: 3, elite: 4, min: 2, desc: "Drop step, front pivot, face-up — beginning to add spin move." },
      iq_reads:      { target: 2, elite: 3, min: 1, desc: "Reads high-low, sets effective screens, times seals correctly." },
      athleticism:   { target: 3, elite: 4, min: 2, desc: "Physical presence — long and strong; develops vertical and coordination." },
      conditioning:  { target: 3, elite: 4, min: 2, desc: "Sustains physical post and defense for full game." },
    },
    "17U": {
      ball_handling: { target: 2, elite: 3, min: 1, desc: "Modern centers handle in space — 15-foot catch and go; reliable in transition." },
      shooting:      { target: 2, elite: 4, min: 1, desc: "Mid-range consistency; elite centers developing three-point range at this level." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Dominant finisher — strong through contact, two hands, ambidextrous post moves." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Protects the rim, boxes out every possession, guards ball-screens on perimeter." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Complete post footwork — drop step, spin, face-up drive, jump hook." },
      iq_reads:      { target: 3, elite: 4, min: 2, desc: "Makes correct decisions in pick-and-roll, lob situations, and help defense." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Explosive vertical, long, and strong — dominates physically at level." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Physical conditioning to compete as a dominant presence 32 minutes." },
    },
    "18U": {
      ball_handling: { target: 2, elite: 4, min: 1, desc: "College centers must handle short-roll reads and outlet situations reliably." },
      shooting:      { target: 2, elite: 5, min: 1, desc: "Mid-range required; elite college centers are developing three-point shooting." },
      finishing:     { target: 4, elite: 5, min: 3, desc: "Dominant finisher; college-ready power and touch around the rim." },
      defense:       { target: 4, elite: 5, min: 3, desc: "Anchors defense — rim protection, switchability, and rebounding required." },
      footwork:      { target: 4, elite: 5, min: 3, desc: "Complete post footwork package; efficient and automatic at game speed." },
      iq_reads:      { target: 4, elite: 5, min: 3, desc: "Understands complex defensive schemes; makes quick reads in pick-and-roll." },
      athleticism:   { target: 4, elite: 5, min: 3, desc: "Elite physical profile is the primary differentiator for college centers." },
      conditioning:  { target: 4, elite: 5, min: 3, desc: "Physical conditioning base for college-level training and practice demands." },
    },
  },
};

/* -------------------------------------------------------------------------- */
/* positionBenchmarks — flatten the matrix                                    */
/* -------------------------------------------------------------------------- */

export const positionBenchmarks: PositionBenchmark[] = [];

const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];
const AGE_GROUPS: AgeGroup[] = ["13U", "15U", "17U", "18U"];
const SKILLS: SkillCategory[] = [
  "ball_handling", "shooting", "finishing", "defense",
  "footwork", "iq_reads", "athleticism", "conditioning",
];

for (const position of POSITIONS) {
  for (const ageGroup of AGE_GROUPS) {
    for (const skill of SKILLS) {
      const entry = MATRIX[position][ageGroup][skill];
      positionBenchmarks.push({
        position,
        ageGroup,
        skill,
        targetLevel: entry.target,
        eliteLevel: entry.elite,
        minimumLevel: entry.min,
        description: entry.desc,
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/* IDP Templates                                                               */
/* -------------------------------------------------------------------------- */

export const idpTemplates: IDPTemplate[] = [
  {
    id: "tpl_handle_first_pg",
    name: "Handle First PG",
    focusAreas: ["ball_handling", "finishing", "iq_reads"],
    typicalDuration: 8,
    description: "Builds a dominant dribble foundation — both hands at game speed, counters off reads, and finishing through contact.",
    bestFor: "PGs with weak handles or inconsistency under pressure",
    sampleGoals: [
      {
        skill: "ball_handling",
        title: "Game-Speed Two-Hand Dribble Package",
        description: "Develop reliable ball-handling with both hands at game pace including crossovers, between-legs, and behind-back.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 8,
        milestones: [
          "Complete 3-cone drill under 7 seconds with left hand only",
          "Execute full crossover-behind combo at 75% game speed without looking at ball",
          "Go left successfully on 70% of live-drill reps in 5v5",
        ],
        keyDrills: ["Two-Ball Dribble Series", "Chair Dribble Gauntlet", "3-Cone Left-Only", "Change-of-Pace Combo"],
        successCriteria: "Coach evaluates: can create off the bounce with left hand in live game situations without telegraphing.",
      },
      {
        skill: "finishing",
        title: "Off-Hand Finishing at Rim",
        description: "Extend finishing package to include left-hand layups, floaters, and contact finishes on both sides.",
        baselineLevel: 2,
        targetLevel: 3,
        timelineWeeks: 6,
        milestones: [
          "Hit 8/10 left-hand Mikan drill reps",
          "Finish floater at 50% rate in game situations",
          "Draw contact and convert and-1 in 3 of 5 live drill reps",
        ],
        keyDrills: ["Mikan Drill (left-emphasis)", "Euro Step Finishing", "Floater Form Series", "Contact Layup Drill"],
        successCriteria: "Finishes 60%+ of attempts at the rim in live play regardless of which hand is used.",
      },
    ],
  },
  {
    id: "tpl_shooting_development",
    name: "Shooting Development",
    focusAreas: ["shooting", "footwork", "conditioning"],
    typicalDuration: 10,
    description: "Comprehensive shooting program — form, range extension, off-movement shooting, and late-game conditioning.",
    bestFor: "Wings and guards who need to become reliable shooters",
    sampleGoals: [
      {
        skill: "shooting",
        title: "Consistent Three-Point Shooter",
        description: "Build reliable catch-and-shoot mechanics and extend range to three-point line with game-speed footwork.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 10,
        milestones: [
          "Shoot 40% on catch-and-shoot threes in isolated shooting drill",
          "Make 7/10 spot-up threes off pass at full speed",
          "Hit at least one three in three consecutive game situations",
        ],
        keyDrills: ["Spot-Up Series (5 spots)", "DHO Shooting Drill", "Quick-Release Catch Series", "Fatigue Shooting (HIIT ends)"],
        successCriteria: "Makes 35%+ of three-point attempts in game conditions over 4-week sample.",
      },
      {
        skill: "footwork",
        title: "Shooting Footwork Mechanics",
        description: "Lock in footwork patterns for catch-and-shoot, off-screen, and pull-up — zero wasted motion.",
        baselineLevel: 2,
        targetLevel: 3,
        timelineWeeks: 6,
        milestones: [
          "One-two step is consistent on 90% of catch-and-shoot reps",
          "Footwork off pin-down screen executed without coaching cue",
          "Pull-up footwork under pressure is clean in live drill",
        ],
        keyDrills: ["1-2 Step Catch Series", "Pin-Down Footwork Drill", "Pull-Up Off Ball Screen", "Shadow Footwork"],
        successCriteria: "Coach evaluates: shooting footwork is automatic — no correction needed in live reps.",
      },
    ],
  },
  {
    id: "tpl_defensive_identity",
    name: "Defensive Identity",
    focusAreas: ["defense", "footwork", "conditioning"],
    typicalDuration: 8,
    description: "Builds elite defensive habits — on-ball technique, off-ball positioning, communication, and the conditioning to sustain it.",
    bestFor: "Players with a defense gap needing to become a lockdown option",
    sampleGoals: [
      {
        skill: "defense",
        title: "On-Ball Lockdown Technique",
        description: "Develop proper on-ball defense stance, slide footwork, and contest mechanics.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 8,
        milestones: [
          "Hold opponent below 40% in 1v1 isolation drill for 5 consecutive reps",
          "Execute correct contest without fouling in 8 of 10 live reps",
          "Coach evaluates: correct help-side positioning without verbal cue in scrimmage",
        ],
        keyDrills: ["Defensive Slide Ladder", "1v1 Isolation Contest", "Help-Side Shell Drill", "Mirror Slide Drill"],
        successCriteria: "Holds primary offensive assignment to below average efficiency in three consecutive game situations.",
      },
      {
        skill: "conditioning",
        title: "Defensive Conditioning Base",
        description: "Build the cardio foundation to sustain elite defensive effort through 32 minutes.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 8,
        milestones: [
          "Complete 6 defensive slide shuttle runs in under 45 seconds without break",
          "Maintain correct defensive stance in 4th quarter practice scrimmage",
          "Heart rate recovery below 120bpm within 90 seconds of full-speed defensive drill",
        ],
        keyDrills: ["Defensive Slide Shuttles", "Kill-The-Ball Conditioning", "3-Minute Defensive Possession Series", "Cone Slide Circuit"],
        successCriteria: "Coach evaluates: defensive effort and form consistent from 1Q through 4Q in scrimmage.",
      },
    ],
  },
  {
    id: "tpl_big_development",
    name: "Big Development",
    focusAreas: ["finishing", "footwork", "conditioning"],
    typicalDuration: 10,
    description: "Develops a modern big — post footwork, ambidextrous finishing, rim protection, and physical conditioning.",
    bestFor: "PFs and Cs developing their post game and physical foundation",
    sampleGoals: [
      {
        skill: "finishing",
        title: "Post Scoring Package",
        description: "Develop a complete scoring toolkit near the basket — drop step, spin, face-up, and jump hook.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 10,
        milestones: [
          "Drop step left and right executed with correct footwork in 9 of 10 reps",
          "Jump hook over outstretched arm is consistent from both sides",
          "Face-up drive-or-shoot read executed correctly in 8 of 10 live reps",
        ],
        keyDrills: ["Drop Step Series", "Mikan Post Drill", "Jump Hook (both sides)", "Face-Up Drive Drill"],
        successCriteria: "Scores in the post on 50%+ of live isolation possessions against a defender.",
      },
      {
        skill: "footwork",
        title: "Post Footwork Foundation",
        description: "Lock in all post footwork patterns — pivot, seal, and finishing mechanics.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 8,
        milestones: [
          "Catches and pivots to strong side in under 1.5 seconds without traveling",
          "Executes seal footwork without coaching in live 1-on-1 sets",
          "Three-option post footwork sequence (drop/spin/face) completed without error",
        ],
        keyDrills: ["Pivot Series", "Seal and Catch Drill", "Three-Option Post Sequence", "Catch-and-Read Footwork"],
        successCriteria: "Coach evaluates: zero traveled violations in post play during scrimmage week.",
      },
    ],
  },
  {
    id: "tpl_iq_decision_making",
    name: "IQ & Decision Making",
    focusAreas: ["iq_reads", "footwork", "ball_handling"],
    typicalDuration: 8,
    description: "Sharpens basketball IQ — reading defenses, making correct passes, understanding spacing and flow.",
    bestFor: "Any position with an IQ/reads gap; players who over-dribble or make wrong decisions",
    sampleGoals: [
      {
        skill: "iq_reads",
        title: "Ball-Screen Read Mastery",
        description: "Learn to read and execute all ball-screen options: pull-up, reject, and pocket pass.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 8,
        milestones: [
          "Identifies drop/hedge/blitz coverage and selects correct counter in 8 of 10 reps",
          "Makes correct pocket pass to rolling big in 5v5 without verbal prompt",
          "Reads when to reject screen vs. use it correctly in 3 consecutive live reps",
        ],
        keyDrills: ["2-Man Ball-Screen Series", "Coverage Recognition Drill", "3v3 Pick-and-Roll Game", "Film Study: Reads"],
        successCriteria: "Makes correct primary read off ball-screen on 80% of live possessions.",
      },
    ],
  },
  {
    id: "tpl_athletic_development",
    name: "Athletic Development",
    focusAreas: ["conditioning", "athleticism", "footwork"],
    typicalDuration: 12,
    description: "Pure athletic development — vertical, lateral quickness, change of direction, and game-conditioning base.",
    bestFor: "Players whose athletic profile is limiting their skill expression",
    sampleGoals: [
      {
        skill: "athleticism",
        title: "Explosive First-Step Development",
        description: "Improve first-step quickness and change-of-direction speed through targeted plyometric and agility work.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 12,
        milestones: [
          "L-Drill time improves by 0.3 seconds over 6-week baseline",
          "Reactive agility score improves by 10% on coach evaluation",
          "Vertical jump improves by 2 inches on standing vertical assessment",
        ],
        keyDrills: ["L-Drill", "5-10-5 Pro Agility", "Depth Jump Series", "Band Lateral Resistance Slides"],
        successCriteria: "Athletic metrics improve measurably on all four assessment tests at 12-week mark.",
      },
      {
        skill: "conditioning",
        title: "Game-Conditioning Base",
        description: "Build cardio foundation to maintain performance level through full competition.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 10,
        milestones: [
          "Beep test level improves from Level 7 to Level 9",
          "Sprint times in final minute of conditioning test within 5% of fresh times",
          "No visible performance drop-off after 24 minutes in scrimmage",
        ],
        keyDrills: ["Interval Sprint Series", "4-Corner Conditioning", "Repeat Sprint Protocol", "Full-Court Press Defense"],
        successCriteria: "Coach evaluates: no significant performance or effort drop-off between first and fourth quarters.",
      },
    ],
  },
  {
    id: "tpl_all_around_guard",
    name: "All-Around Guard",
    focusAreas: ["ball_handling", "shooting", "finishing"],
    typicalDuration: 10,
    description: "Builds the complete modern guard — handles, shooting, and finishing for a three-level scoring profile.",
    bestFor: "PGs and SGs with gaps across multiple offensive skill areas",
    sampleGoals: [
      {
        skill: "ball_handling",
        title: "Complete Ball-Handling Package",
        description: "Two-hand dribble mastery — works in tight spaces, off screens, and under defensive pressure.",
        baselineLevel: 2,
        targetLevel: 3,
        timelineWeeks: 6,
        milestones: [
          "Handles defensive pressure in live 1v1 for 10 seconds without turnover",
          "Executes hesitation move consistently — opponent reacts before move begins",
          "Completes 3-cone drill under 8 seconds using both hands",
        ],
        keyDrills: ["Pressure Dribble Series", "Hesitation Gauntlet", "Off-Screen Dribble Set", "1v1 Pressure Drill"],
        successCriteria: "Turnover rate on ball-handling possessions decreases by 50% over 6-week period.",
      },
      {
        skill: "shooting",
        title: "Pull-Up Mid-Range Consistency",
        description: "Develop pull-up mid-range as a reliable weapon off the dribble.",
        baselineLevel: 2,
        targetLevel: 3,
        timelineWeeks: 6,
        milestones: [
          "Makes 6/10 pull-up jumpers from elbow in isolated drill",
          "Uses pull-up correctly vs. closeout in live rep without hesitating",
          "Hits pull-up in back-to-back live possessions against live defense",
        ],
        keyDrills: ["Elbow Pull-Up Series", "Side-Step Pull-Up", "Pull-Up vs. Closeout Drill", "Catch-and-Create Combo"],
        successCriteria: "Makes 45%+ of mid-range pull-ups in game conditions over 3-week sample.",
      },
    ],
  },
  {
    id: "tpl_lockdown_wing",
    name: "Lockdown Wing",
    focusAreas: ["defense", "footwork", "conditioning"],
    typicalDuration: 8,
    description: "Builds an elite wing defender — lateral quickness, physicality over screens, and positioning mastery.",
    bestFor: "SFs and SGs wanting to build defensive identity as primary skill",
    sampleGoals: [
      {
        skill: "defense",
        title: "Wing Lockdown Package",
        description: "Develop elite wing defense — over screens, in isolation, and in help rotations.",
        baselineLevel: 2,
        targetLevel: 4,
        timelineWeeks: 8,
        milestones: [
          "Fights over three consecutive pin-down screens without help from coach",
          "Holds wing isolation to below 40% in live 1v1 over 5-possession set",
          "Correctly reads and rotates in shell drill 9 out of 10 times",
        ],
        keyDrills: ["Over-Screen Pursuit Drill", "1v1 Wing Isolation", "Shell Defensive Drill", "Defensive Positioning Film Review"],
        successCriteria: "Assigned opponent shoots below 35% when guarded by player in three consecutive game situations.",
      },
      {
        skill: "footwork",
        title: "Defensive Footwork Precision",
        description: "Lateral slides, close-outs, and recovery footwork — faster and cleaner.",
        baselineLevel: 2,
        targetLevel: 3,
        timelineWeeks: 6,
        milestones: [
          "Defensive slide drill completed without crossing feet in 8 of 10 reps",
          "Close-out footwork on three-point shooter correct — no flying by",
          "Recovery step after screen executed correctly in live 2v2 defensive set",
        ],
        keyDrills: ["Defensive Slide Series", "Close-Out Footwork Drill", "Recovery Step Drill", "Zig-Zag Defensive Slides"],
        successCriteria: "Coach evaluates: defensive footwork is automatic — no reminders needed in practice.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Helper functions                                                            */
/* -------------------------------------------------------------------------- */

export function getBenchmarksForPlayer(
  position: Position,
  ageGroup: AgeGroup,
): PositionBenchmark[] {
  return positionBenchmarks.filter(
    (b) => b.position === position && b.ageGroup === ageGroup,
  );
}

function getGapPriority(gap: number): PlayerBenchmarkGap["priority"] {
  if (gap <= 0) return "none";
  if (gap === 1) return "moderate";
  if (gap === 2) return "high";
  return "critical";
}

const RECOMMENDATIONS: Record<SkillCategory, (gap: number) => string> = {
  ball_handling: (gap) =>
    gap >= 2
      ? "Daily two-ball dribbling — minimum 20 min with left-hand emphasis. Add pressure dribble sets."
      : "Maintain current handle work; add one weekly session of game-speed off-screen dribble sets.",
  shooting: (gap) =>
    gap >= 2
      ? "500 catch-and-shoot reps per week with form focus. Add pull-up series 3x/week."
      : "Maintain volume; shift to shooting off movement and fatigue situations.",
  finishing: (gap) =>
    gap >= 2
      ? "Daily Mikan drill (both hands) + euro step and floater series 3x/week with contact."
      : "Add one contact finishing session weekly; focus on drawing fouls in live reps.",
  defense: (gap) =>
    gap >= 2
      ? "Dedicated defensive training 3x/week — stance, slide footwork, and 1v1 isolation sets."
      : "Film review of defensive positioning; add one weekly shell drill session.",
  footwork: (gap) =>
    gap >= 2
      ? "Daily footwork ladder + position-specific drills (post or perimeter) every session."
      : "Shadow footwork before each practice — automate the patterns you already know.",
  iq_reads: (gap) =>
    gap >= 2
      ? "Weekly film study sessions + 3v3/4v4 situations focusing on reads. Talk through every decision."
      : "Add one film session per week; coach labels correct reads in live scrimmage.",
  athleticism: (gap) =>
    gap >= 2
      ? "2x/week agility and plyometric program — L-drill, depth jumps, band lateral work."
      : "Maintain current athletic training; add one reactive agility session weekly.",
  conditioning: (gap) =>
    gap >= 2
      ? "3x/week interval conditioning program — sprints, defensive slides, and repeat-sprint protocol."
      : "Add one conditioning circuit per week; focus on sustaining performance in scrimmage 4Q.",
};

export function generateBenchmarkReport(
  playerId: string,
  playerName: string,
  position: Position,
  ageGroup: AgeGroup,
  gradYear: number,
  currentLevels: Record<SkillCategory, number>,
): BenchmarkReport {
  const benchmarks = getBenchmarksForPlayer(position, ageGroup);

  const gaps: PlayerBenchmarkGap[] = benchmarks.map((b) => {
    const current = currentLevels[b.skill] ?? 1;
    const gap = b.targetLevel - current;
    return {
      playerId,
      playerName,
      position,
      ageGroup,
      skill: b.skill,
      currentLevel: current,
      targetLevel: b.targetLevel,
      gap,
      priority: getGapPriority(gap),
      recommendation: RECOMMENDATIONS[b.skill](gap),
    };
  });

  const overallGapScore =
    gaps.reduce((sum, g) => sum + Math.max(0, g.gap), 0) / gaps.length;

  const sortedGaps = [...gaps]
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap || a.skill.localeCompare(b.skill));

  const topPriority = sortedGaps.slice(0, 3).map((g) => g.skill);
  const strengths = gaps
    .filter((g) => g.gap <= 0)
    .map((g) => g.skill);

  return {
    playerId,
    playerName,
    position,
    ageGroup,
    gradYear,
    gaps,
    overallGapScore: Math.round(overallGapScore * 10) / 10,
    topPriority,
    strengths,
    generatedAt: new Date().toISOString(),
  };
}

export function getRecommendedTemplate(gaps: PlayerBenchmarkGap[]): IDPTemplate {
  // Score each template by how well it covers the top gaps
  const topGaps = [...gaps]
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((g) => g.skill);

  let bestTemplate = idpTemplates[0];
  let bestScore = -1;

  for (const template of idpTemplates) {
    const score = topGaps.reduce(
      (s, skill) => s + (template.focusAreas.includes(skill) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  }

  return bestTemplate;
}

export function getPriorityGaps(
  report: BenchmarkReport,
  count = 3,
): PlayerBenchmarkGap[] {
  return [...report.gaps]
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, count);
}

/* -------------------------------------------------------------------------- */
/* Sample benchmark reports — 5 pre-computed players                          */
/* -------------------------------------------------------------------------- */

export const sampleBenchmarkReports: BenchmarkReport[] = [
  generateBenchmarkReport(
    "player_malik",
    "Malik Henderson",
    "PG",
    "17U",
    2026,
    {
      ball_handling: 3,
      shooting:      4,
      finishing:     3,
      defense:       2,
      footwork:      3,
      iq_reads:      4,
      athleticism:   4,
      conditioning:  3,
    },
  ),
  generateBenchmarkReport(
    "player_jaylen",
    "Jaylen Scott",
    "SG",
    "15U",
    2028,
    {
      ball_handling: 2,
      shooting:      2,
      finishing:     2,
      defense:       3,
      footwork:      2,
      iq_reads:      2,
      athleticism:   3,
      conditioning:  2,
    },
  ),
  generateBenchmarkReport(
    "player_noah",
    "Noah Rivera",
    "SF",
    "17U",
    2026,
    {
      ball_handling: 3,
      shooting:      3,
      finishing:     4,
      defense:       3,
      footwork:      4,
      iq_reads:      3,
      athleticism:   4,
      conditioning:  4,
    },
  ),
  generateBenchmarkReport(
    "player_tyler",
    "Tyler Brooks",
    "PF",
    "15U",
    2028,
    {
      ball_handling: 1,
      shooting:      1,
      finishing:     2,
      defense:       2,
      footwork:      2,
      iq_reads:      2,
      athleticism:   2,
      conditioning:  2,
    },
  ),
  generateBenchmarkReport(
    "player_cam",
    "Cam Porter",
    "C",
    "18U",
    2025,
    {
      ball_handling: 2,
      shooting:      2,
      finishing:     4,
      defense:       3,
      footwork:      3,
      iq_reads:      3,
      athleticism:   4,
      conditioning:  3,
    },
  ),
];
