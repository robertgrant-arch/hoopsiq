/**
 * ProgramTerminologyPage — /app/coach/education/terminology
 *
 * Shared coaching language library. Coaches define, approve, and manage the
 * program vocabulary used consistently with players, parents, and staff.
 */

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Users,
  BookOpen,
  FileText,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type TermCategory = "Offense" | "Defense" | "Culture" | "Practice";

type TermDefinition = {
  id: string;
  term: string;
  category: TermCategory;
  shortDefinition: string;
  fullDefinition: string;
  coachingCues: string[];
  playerFacingDescription: string;
  drillsWhere: string[];
  addedBy: string;
  approvedByHead: boolean;
  visibleToPlayers: boolean;
};

type AddTermFormData = {
  term: string;
  category: TermCategory;
  shortDefinition: string;
  fullDefinition: string;
  playerFacingDescription: string;
  coachingCueInput: string;
  coachingCues: string[];
  drillInput: string;
  drillsWhere: string[];
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_TERMS: TermDefinition[] = [
  {
    id: "t1",
    term: "Loaded Triple Threat",
    category: "Offense",
    shortDefinition: "Attack-ready stance with weight on the inside foot.",
    fullDefinition:
      "A triple-threat position where the player's weight is loaded on the inside (drive-side) foot, hips are low, and the ball is protected at the hip. Emphasizes immediate attack readiness rather than a static catch stance.",
    coachingCues: ["Sit into it", "Weight on the inside foot", "Ball at the hip, not the chest"],
    playerFacingDescription:
      "When you catch the ball, immediately load your weight on your inside foot so you can attack right away. Think 'low and loaded.'",
    drillsWhere: ["Catch-and-attack series", "1v1 off the catch", "Triple-threat isolations"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t2",
    term: "Drive-and-Kick",
    category: "Offense",
    shortDefinition: "Penetrate to collapse the defense, kick out to the open shooter.",
    fullDefinition:
      "An offensive action where the ball handler drives hard toward the rim to draw two defenders, then delivers a skip or kick pass to a teammate in a catch-and-shoot position. Execution depends on reading the second defender's feet — not a predetermined pass.",
    coachingCues: ["Attack the second defender's inside foot", "Eyes up early", "Don't commit, read the feet"],
    playerFacingDescription:
      "Drive hard enough to pull two defenders toward you, then find the open shooter. Don't decide to pass before you drive — let the defense tell you.",
    drillsWhere: ["Shell drill kick-outs", "3v2 advantage reads", "5-out drive-and-kick"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t3",
    term: "Skip Pass",
    category: "Offense",
    shortDefinition: "A two-skip cross-court pass that reverses ball quickly over a help defender.",
    fullDefinition:
      "A direct, two-handed (or one-handed swing) pass that travels across the lane and skips over the help-side defense. Used to attack a defender caught on the wrong side of a ball reversal. Requires the passer to see the full court before the pass — not a desperation reset.",
    coachingCues: ["See the whole floor first", "Step into it, don't lob it", "Receiver: hands ready before the pass lands"],
    playerFacingDescription:
      "A skip pass goes over the defense to your teammate on the far side. It only works if you see them open before you throw — not after.",
    drillsWhere: ["Shell reversal drills", "4-out skip reads", "Transition kick-ahead"],
    addedBy: "Coach Martinez",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t4",
    term: "Pick-and-Roll Reject",
    category: "Offense",
    shortDefinition: "Ball handler reads the screen and goes away from it.",
    fullDefinition:
      "When a defender fully commits to defending the ball handler going over the screen, the ball handler rejects (goes opposite) to attack the backside. The reject is a read, not a predetermined action — it requires the ball handler to feel the defender's body position before the point of contact.",
    coachingCues: ["Feel the pressure first", "Reject = attack the backside hip", "Don't telegraph it"],
    playerFacingDescription:
      "If your defender cheats over the screen, you reject it — go the other way. Read the pressure before you decide.",
    drillsWhere: ["2-man pick-and-roll progressions", "Ballscreen decision series", "3v3 live ballscreen"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: false,
  },
  {
    id: "t5",
    term: "Shot Pocket",
    category: "Offense",
    shortDefinition: "The exact catch position that sets up a clean, immediate shot.",
    fullDefinition:
      "The specific position — ball at shoulder height, elbow under the ball, feet already set — that allows a player to shoot in one motion without a dip or realignment. The shot pocket is established before the ball arrives, not after the catch.",
    coachingCues: ["Pocket ready before the pass", "Elbow under, not behind", "No dip — straight up"],
    playerFacingDescription:
      "Your shot pocket is where you hold the ball so you can shoot in one move. Get there before you catch it.",
    drillsWhere: ["Catch-and-shoot progressions", "WOD shooting series", "Off-screen catch-and-fire"],
    addedBy: "Coach Thompson",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t6",
    term: "ICE Coverage",
    category: "Defense",
    shortDefinition: "Defender forces the ball handler away from the screen, toward the baseline.",
    fullDefinition:
      "A ballscreen defensive scheme where the on-ball defender positions to eliminate the pick-and-roll action by forcing the ball handler toward the sideline or baseline. Requires the on-ball defender to show their chest toward the sideline before contact and the big to hold the lane without hedging.",
    coachingCues: ["Show baseline early — before contact", "Big: sit in the lane, don't go out", "No gap on the catch side"],
    playerFacingDescription:
      "ICE means you're taking away the pick-and-roll by forcing the ball handler to the corner. You show them baseline from the start.",
    drillsWhere: ["Ballscreen coverage walkthroughs", "2v2 ICE enforcement", "5v5 vs pick-and-roll sets"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: false,
  },
  {
    id: "t7",
    term: "Help First",
    category: "Defense",
    shortDefinition: "Every off-ball defender's first responsibility is stopping penetration, not tagging their man.",
    fullDefinition:
      "A defensive philosophy stating that every player not guarding the ball must first be in a position to stop a drive before worrying about their own assignment. The help defender's stance, position, and communication happen before the drive, not as a reaction to it.",
    coachingCues: ["Pistols: see your man and the ball", "Help is your first job", "Don't lose the ball chasing your man"],
    playerFacingDescription:
      "When the ball is driven, help stop it first. Your man doesn't matter until the drive is stopped.",
    drillsWhere: ["Shell drill", "3v3 help-and-recover", "Scramble close-out series"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t8",
    term: "Pack the Paint",
    category: "Defense",
    shortDefinition: "Defensive positioning that denies easy rim access without over-committing.",
    fullDefinition:
      "A team defensive concept where off-ball defenders sag into the lane and clog driving lanes before the ball is driven. Differs from zone in that defenders still guard individual players, but their starting positions are inside the paint rather than attached to their assignment.",
    coachingCues: ["Start in the paint, not on your man", "Gap is your friend on the weak side", "Recover on the catch, not on the drive"],
    playerFacingDescription:
      "Pack the paint means you start inside, closer to the rim, so we take away the easy drive. You still guard your player — you just start deeper.",
    drillsWhere: ["5v0 defensive positioning", "4v4 no-drive drill", "Pack-and-recover reads"],
    addedBy: "Coach Martinez",
    approvedByHead: false,
    visibleToPlayers: false,
  },
  {
    id: "t9",
    term: "Hedge and Recover",
    category: "Defense",
    shortDefinition: "Big steps out to slow the ball handler, then sprints back to their man.",
    fullDefinition:
      "A pick-and-roll coverage scheme where the screener's defender (big) steps into the ball handler's path immediately after the screen to slow penetration, then sprints to recover to their own player once the on-ball defender re-engages. Timing is critical — a slow hedge gives up a mid-range; a long hedge gives up a lob.",
    coachingCues: ["One hard step out — no more", "Hedge on the hip, not the ball", "Sprint back or you're late"],
    playerFacingDescription:
      "When your player sets a screen, you step out to slow the ball handler for one second, then get back to your player fast.",
    drillsWhere: ["Hedge drill progressions", "2v2 ballscreen coverage", "5v5 live ballscreens"],
    addedBy: "Coach Thompson",
    approvedByHead: true,
    visibleToPlayers: false,
  },
  {
    id: "t10",
    term: "Contest Without Contact",
    category: "Defense",
    shortDefinition: "Closing out with a high hand, not a foul.",
    fullDefinition:
      "A close-out execution standard requiring the defender to get a hand in the shooter's eyeline without making body contact that draws a foul. The defender's close-out is a sprint into a brake — not a fly-by, not a lunge. Hand is up before the shooter releases.",
    coachingCues: ["Sprint, brake, hand up", "Hand high — not hand into them", "Feet under you before you reach"],
    playerFacingDescription:
      "Close out hard, but stop your body before you get there. Hand up without fouling. Feet first, then hand.",
    drillsWhere: ["Close-out series", "Catch-and-shoot vs close-out", "4v4 close-out enforcement"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t11",
    term: "Force Middle",
    category: "Defense",
    shortDefinition: "On-ball defender channels drives toward help, away from the baseline.",
    fullDefinition:
      "An on-ball defensive instruction that positions the defender to eliminate the baseline drive and funnel the ball handler toward the lane and help defenders. Used in situations where the help side is loaded. Requires the defender to shade their stance before the first dribble, not after.",
    coachingCues: ["Shade the baseline hip before they move", "Funnel them into help", "Don't give up the baseline — ever"],
    playerFacingDescription:
      "Force middle means you take away the baseline and push the ball handler toward your teammates who are in help position.",
    drillsWhere: ["1v1 on-ball force series", "3v3 force and help", "Half-court man-to-man"],
    addedBy: "Coach Martinez",
    approvedByHead: true,
    visibleToPlayers: false,
  },
  {
    id: "t12",
    term: "Compete Level",
    category: "Culture",
    shortDefinition: "The consistent intensity standard a player brings regardless of context.",
    fullDefinition:
      "A player's baseline intensity and focus as observed across all contexts — drills, film sessions, weight room, team huddles. Compete level is not effort spikes in big moments; it is the floor a player maintains. Coaches track it through observation logs and reference it in IDP conversations.",
    coachingCues: ["Your compete level is what you do when no one's watching", "We measure the floor, not the ceiling", "Compete level is a habit"],
    playerFacingDescription:
      "Compete level is how hard you go every single rep — not just the ones that matter. We notice the reps you think don't count.",
    drillsWhere: ["All sessions — it's an attitude, not a drill"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t13",
    term: "Buy-In",
    category: "Culture",
    shortDefinition: "Active, visible commitment to the program's process and standards.",
    fullDefinition:
      "A player's demonstrated alignment with the program's development approach, including completing check-ins, engaging in film sessions, executing IDP work, and communicating proactively. Buy-in is observable behavior, not an attitude — coaches assess it through logged actions, not impressions.",
    coachingCues: ["Buy-in shows up in the log, not just in words", "Consistency is the signal", "Buy-in without action isn't buy-in"],
    playerFacingDescription:
      "Buy-in means doing the work the program asks for, consistently — check-ins, WODs, film, IDP milestones. It's not about talking about it.",
    drillsWhere: ["Check-in completion", "WOD completion rate", "IDP milestone tracking"],
    addedBy: "Coach Martinez",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t14",
    term: "Detail Work",
    category: "Culture",
    shortDefinition: "Intentional focus on small technical refinements that compound over time.",
    fullDefinition:
      "Practice behavior characterized by making precise, intentional corrections to technique — footwork alignment, hand position, spacing — rather than just completing reps at full speed. Detail work requires slowing down, acknowledging errors, and re-executing with intent. Players who avoid detail work plateau early.",
    coachingCues: ["Slow it down and fix it", "One detail per rep — not everything at once", "A rep with the wrong detail is a rep that digs a hole"],
    playerFacingDescription:
      "Detail work means slowing down to get something exactly right, then speeding it up. Don't just go through the motions.",
    drillsWhere: ["Skill-isolation blocks", "WOD technical focus", "Film + drill pairs"],
    addedBy: "Coach Thompson",
    approvedByHead: false,
    visibleToPlayers: true,
  },
  {
    id: "t15",
    term: "Locked In",
    category: "Culture",
    shortDefinition: "Full attention and engagement during a session — no distractions, no half-reps.",
    fullDefinition:
      "A session-ready state where a player is mentally present, engaged with coaching cues, and not distracted by external factors. Coaches call this out positively when observed and reference it in check-in follow-ups. Being 'locked in' is not the same as being quiet — it includes active verbal engagement and on-time responses to instruction.",
    coachingCues: ["Eyes on me — not the phone, not the scoreboard", "Locked in means responding, not just hearing", "Tell me what you just heard"],
    playerFacingDescription:
      "Locked in means your full attention is here — no scrolling, no zoning out, no half-effort. We can see the difference.",
    drillsWhere: ["Film sessions", "Pre-practice walk-throughs", "IDP check-ins"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t16",
    term: "Full Speed",
    category: "Practice",
    shortDefinition: "Every rep executed at game-realistic tempo — no courtesy reps.",
    fullDefinition:
      "A practice standard requiring all drills to be run at the speed they would occur in a game. Full speed does not mean out of control — it means maximum controlled tempo. Coaches call out half-speed reps immediately. A full-speed rep done incorrectly is more valuable than a slow rep done correctly.",
    coachingCues: ["If you can think about it, it's not fast enough", "Game speed or we go again", "Controlled chaos — not slow perfection"],
    playerFacingDescription:
      "Full speed means the same pace you'd use in a game. Don't slow it down to make it look clean — make it clean at full speed.",
    drillsWhere: ["All live-rep drills", "Transition series", "5v5 competitive sets"],
    addedBy: "Coach Davis",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t17",
    term: "Game Reps",
    category: "Practice",
    shortDefinition: "Practice situations designed to mirror real game decision conditions.",
    fullDefinition:
      "Practice drills or scrimmage segments designed with the randomness, decision-making pressure, and time constraints of actual game situations. Game reps differ from isolation drills in that they require the player to read and react rather than execute a predetermined action. Volume of game reps is a key IDP planning metric.",
    coachingCues: ["Make a read — don't execute a script", "The decision is the skill", "You won't have a coach telling you in a game"],
    playerFacingDescription:
      "Game reps mean you have to read the defense and decide. There's no preset answer. That's the point.",
    drillsWhere: ["3v2 and 2v1 reads", "4v4 and 5v5 live", "Decision-series drills"],
    addedBy: "Coach Martinez",
    approvedByHead: true,
    visibleToPlayers: true,
  },
  {
    id: "t18",
    term: "Reset",
    category: "Practice",
    shortDefinition: "Structured pause to refocus attention before continuing a drill or session.",
    fullDefinition:
      "A deliberate pause called by a coach to stop a drill, reset the players' mental state, and reinforce the coaching point before continuing. Resets are not negative — they signal that the coaching moment is important enough to interrupt momentum. Players are expected to get to the teaching position quickly and make eye contact.",
    coachingCues: ["Whistle means stop everything and come in", "Eyes on me in three seconds", "No side conversations during a reset"],
    playerFacingDescription:
      "When a coach calls 'reset,' stop where you are, come in quickly, and listen. It means something important is about to be said.",
    drillsWhere: ["Any drill where a coaching point needs emphasis", "Film-to-court transfer moments"],
    addedBy: "Coach Thompson",
    approvedByHead: true,
    visibleToPlayers: true,
  },
];

const STAFF_MEMBERS = [
  { name: "Coach Davis", agreed: true },
  { name: "Coach Martinez", agreed: true },
  { name: "Coach Thompson", agreed: true },
  { name: "Coach Williams", agreed: false },
];

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES: Array<"All" | TermCategory> = [
  "All",
  "Offense",
  "Defense",
  "Culture",
  "Practice",
];

const CATEGORY_COLORS: Record<TermCategory, { bg: string; text: string }> = {
  Offense:  { bg: "oklch(0.72 0.18 290 / 0.12)", text: "oklch(0.52 0.18 290)" },
  Defense:  { bg: "oklch(0.68 0.22 25 / 0.10)",  text: "oklch(0.50 0.22 25)"  },
  Culture:  { bg: "oklch(0.75 0.12 140 / 0.12)", text: "oklch(0.45 0.15 140)" },
  Practice: { bg: "oklch(0.78 0.16 75 / 0.12)",  text: "oklch(0.50 0.18 75)"  },
};

const EMPTY_TERM_FORM: AddTermFormData = {
  term: "",
  category: "Offense",
  shortDefinition: "",
  fullDefinition: "",
  playerFacingDescription: "",
  coachingCueInput: "",
  coachingCues: [],
  drillInput: "",
  drillsWhere: [],
};

// ── Sub-components ────────────────────────────────────────────────────────────

function TermCard({
  term,
  onToggleVisibility,
}: {
  term: TermDefinition;
  onToggleVisibility: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = CATEGORY_COLORS[term.category];

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-[15px] font-semibold leading-snug">{term.term}</h3>
            {term.approvedByHead ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="size-3" />
                Approved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                <Clock className="size-3" />
                Pending
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground">{term.shortDefinition}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
            style={{ background: colors.bg, color: colors.text }}
          >
            {term.category}
          </span>
          <button
            onClick={() => onToggleVisibility(term.id)}
            title={term.visibleToPlayers ? "Hide from players" : "Show to players"}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            {term.visibleToPlayers ? (
              <Eye className="size-4 text-primary" />
            ) : (
              <EyeOff className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Coaching cues */}
      <div className="flex flex-wrap gap-1.5">
        {term.coachingCues.map((cue) => (
          <span
            key={cue}
            className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/40 text-foreground"
          >
            "{cue}"
          </span>
        ))}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {expanded ? "Less" : "Full definition + player description"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 pt-1 border-t border-border">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Full Definition
            </p>
            <p className="text-[13px] text-foreground leading-relaxed">{term.fullDefinition}</p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Player-Facing Description
            </p>
            <p className="text-[13px] text-foreground italic border-l-2 border-primary/30 pl-3">
              {term.playerFacingDescription}
            </p>
          </div>

          {term.drillsWhere.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Used In
              </p>
              <div className="flex flex-wrap gap-1.5">
                {term.drillsWhere.map((d) => (
                  <span
                    key={d}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/20"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">Added by {term.addedBy}</p>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgramTerminologyPage() {
  const [terms, setTerms] = useState<TermDefinition[]>(INITIAL_TERMS);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | TermCategory>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddTermFormData>(EMPTY_TERM_FORM);
  const [staffExpanded, setStaffExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return terms.filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const matchesQuery =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.shortDefinition.toLowerCase().includes(q) ||
        t.fullDefinition.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, terms]);

  function handleToggleVisibility(id: string) {
    setTerms((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, visibleToPlayers: !t.visibleToPlayers } : t
      )
    );
    const t = terms.find((x) => x.id === id);
    if (t) {
      toast.success(
        t.visibleToPlayers
          ? `"${t.term}" hidden from players`
          : `"${t.term}" visible to players`
      );
    }
  }

  function handleAddCue(value: string, field: "coachingCues") {
    const trimmed = value.trim();
    if (!trimmed || form[field].includes(trimmed)) return;
    setForm((f) => ({ ...f, [field]: [...f[field], trimmed], coachingCueInput: "" }));
  }

  function handleAddDrill(value: string) {
    const trimmed = value.trim();
    if (!trimmed || form.drillsWhere.includes(trimmed)) return;
    setForm((f) => ({ ...f, drillsWhere: [...f.drillsWhere, trimmed], drillInput: "" }));
  }

  function handleSubmit() {
    if (!form.term.trim() || !form.shortDefinition.trim()) {
      toast.error("Term name and short definition are required.");
      return;
    }
    const newTerm: TermDefinition = {
      id: `custom-${Date.now()}`,
      term: form.term.trim(),
      category: form.category,
      shortDefinition: form.shortDefinition.trim(),
      fullDefinition: form.fullDefinition.trim(),
      playerFacingDescription: form.playerFacingDescription.trim(),
      coachingCues: form.coachingCues,
      drillsWhere: form.drillsWhere,
      addedBy: "You",
      approvedByHead: false,
      visibleToPlayers: false,
    };
    setTerms((prev) => [newTerm, ...prev]);
    setForm(EMPTY_TERM_FORM);
    setShowAddModal(false);
    toast.success(`"${newTerm.term}" added — pending head coach approval.`);
  }

  const approvedCount = terms.filter((t) => t.approvedByHead).length;
  const playerVisibleCount = terms.filter((t) => t.visibleToPlayers).length;
  const staffAgreedCount = STAFF_MEMBERS.filter((s) => s.agreed).length;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="COACHING EDUCATION"
          title="Program Terminology"
          subtitle="Define and align the language your program uses on and off the court."
          actions={
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 text-[13px] font-medium px-4 py-2 rounded-lg text-white transition-colors"
              style={{
                background: "oklch(0.72 0.18 290)",
                minHeight: 44,
              }}
            >
              <Plus className="size-4" />
              Add Term
            </button>
          }
        />

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Terms", value: terms.length, icon: BookOpen },
            { label: "Approved", value: approvedCount, icon: CheckCircle2 },
            { label: "Player Visible", value: playerVisibleCount, icon: Eye },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <Icon className="size-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[20px] font-bold leading-none">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Staff agreement collapsible */}
        <div className="rounded-xl border border-border bg-card mb-6 overflow-hidden">
          <button
            onClick={() => setStaffExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            style={{ minHeight: 44 }}
          >
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-[14px] font-semibold">Staff Agreement</span>
              <span className="text-[12px] text-muted-foreground">
                {staffAgreedCount}/{STAFF_MEMBERS.length} coaches aligned
              </span>
            </div>
            {staffExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {staffExpanded && (
            <div className="px-5 pb-5 border-t border-border">
              <p className="text-[12px] text-muted-foreground mb-4 pt-4">
                All coaches must review and agree to use this terminology consistently before terms are considered program-standard.
              </p>
              <div className="flex flex-col gap-2">
                {STAFF_MEMBERS.map((member) => (
                  <div key={member.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-[13px] font-medium">{member.name}</span>
                    {member.agreed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-3" />
                        Agreed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Clock className="size-3" />
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms or definitions..."
            className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors"
              style={
                activeCategory === cat
                  ? {
                      background: "oklch(0.72 0.18 290)",
                      borderColor: "oklch(0.72 0.18 290)",
                      color: "white",
                    }
                  : {
                      background: "transparent",
                      borderColor: "oklch(0.85 0.01 260)",
                      color: "oklch(0.55 0.02 260)",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-[12px] text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "term" : "terms"}
          {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
          {query ? ` matching "${query}"` : ""}
        </p>

        {/* Terms grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] text-muted-foreground">No terms match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((t) => (
              <TermCard key={t.id} term={t} onToggleVisibility={handleToggleVisibility} />
            ))}
          </div>
        )}

        {/* Export */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground border border-border px-4 py-2 rounded-lg hover:bg-muted/40 transition-colors"
            style={{ minHeight: 44 }}
          >
            <FileText className="size-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Add term modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-[16px] font-semibold">Add Program Term</h2>
              <button
                onClick={() => { setShowAddModal(false); setForm(EMPTY_TERM_FORM); }}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                style={{ minHeight: 44, minWidth: 44 }}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {/* Term name */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Term Name *
                </label>
                <input
                  type="text"
                  value={form.term}
                  onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
                  placeholder="e.g., Slip Screen"
                  className="w-full px-3 py-2.5 text-[14px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(["Offense", "Defense", "Culture", "Practice"] as TermCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className="text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors"
                      style={
                        form.category === cat
                          ? {
                              background: "oklch(0.72 0.18 290)",
                              borderColor: "oklch(0.72 0.18 290)",
                              color: "white",
                            }
                          : {
                              background: "transparent",
                              borderColor: "oklch(0.85 0.01 260)",
                              color: "oklch(0.55 0.02 260)",
                            }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short definition */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Short Definition *
                </label>
                <input
                  type="text"
                  value={form.shortDefinition}
                  onChange={(e) => setForm((f) => ({ ...f, shortDefinition: e.target.value }))}
                  placeholder="One sentence summary"
                  className="w-full px-3 py-2.5 text-[14px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Full definition */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Full Definition
                </label>
                <textarea
                  value={form.fullDefinition}
                  onChange={(e) => setForm((f) => ({ ...f, fullDefinition: e.target.value }))}
                  placeholder="Detailed explanation for coaching staff..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-[14px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Player-facing description */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Player-Facing Description
                </label>
                <textarea
                  value={form.playerFacingDescription}
                  onChange={(e) => setForm((f) => ({ ...f, playerFacingDescription: e.target.value }))}
                  placeholder="How you'd explain this to a player..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-[14px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Coaching cues */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Coaching Cues
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={form.coachingCueInput}
                    onChange={(e) => setForm((f) => ({ ...f, coachingCueInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCue(form.coachingCueInput, "coachingCues");
                      }
                    }}
                    placeholder='Type a cue and press Enter'
                    className="flex-1 px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {form.coachingCues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.coachingCues.map((cue) => (
                      <span
                        key={cue}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/40"
                      >
                        {cue}
                        <button
                          onClick={() => setForm((f) => ({ ...f, coachingCues: f.coachingCues.filter((c) => c !== cue) }))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Drills */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Drills Where Used
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={form.drillInput}
                    onChange={(e) => setForm((f) => ({ ...f, drillInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDrill(form.drillInput);
                      }
                    }}
                    placeholder="Type a drill name and press Enter"
                    className="flex-1 px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {form.drillsWhere.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.drillsWhere.map((drill) => (
                      <span
                        key={drill}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/20"
                      >
                        {drill}
                        <button
                          onClick={() => setForm((f) => ({ ...f, drillsWhere: f.drillsWhere.filter((d) => d !== drill) }))}
                          className="text-primary/60 hover:text-primary"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
              <button
                onClick={() => { setShowAddModal(false); setForm(EMPTY_TERM_FORM); }}
                className="flex-1 py-2.5 text-[14px] font-medium border border-border rounded-lg hover:bg-muted/40 transition-colors"
                style={{ minHeight: 44 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 text-[14px] font-medium text-white rounded-lg transition-colors"
                style={{ background: "oklch(0.72 0.18 290)", minHeight: 44 }}
              >
                Add Term
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
