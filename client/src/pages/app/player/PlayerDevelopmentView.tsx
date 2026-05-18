import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Target,
  Flame,
  CheckCircle2,
  Circle,
  Film,
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  ChevronRight,
  Star,
  ClipboardList,
  Dumbbell,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api/client";

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const PLAYER = {
  name: "Marcus Davis",
  position: "PG",
  team: "Barnegat Varsity",
  tier: "HS Varsity",
  gradYear: 2026,
};

const SEASON_PROGRESS = {
  week: 8,
  totalWeeks: 20,
  streakDays: 14,
  completedDrills: 47,
  totalDrills: 60,
};

const FOCUS_AREAS = [
  {
    id: "fa1",
    priority: 1,
    category: "Finishing",
    subSkill: "Contact Layup",
    emoji: "🏀",
    currentScore: 5,
    targetScore: 7,
    progress: 28,
    deadline: "Jun 15",
    coachNote:
      "You're making progress — keep attacking the rim in live reps. The Mikan drill is showing results.",
    coachInitials: "CW",
    todayDrill: "Mikan drill · 5 sets of 10",
    dueToday: true,
    linkedClip: { title: "Missed and-1 vs. Toms River", href: "/app/film/clips/c2" },
  },
  {
    id: "fa2",
    priority: 2,
    category: "Shooting",
    subSkill: "Off Dribble",
    emoji: "🎯",
    currentScore: 6,
    targetScore: 8,
    progress: 15,
    deadline: "Jul 1",
    coachNote:
      "Your DHO reads are getting sharper. Focus on the 1-2 step rhythm this week.",
    coachInitials: "CW",
    todayDrill: "Pull-up off DHO · 50 reps each side",
    dueToday: false,
    linkedClip: null,
  },
  {
    id: "fa3",
    priority: 3,
    category: "Ball Handling",
    subSkill: "Weak Hand",
    emoji: "✋",
    currentScore: 6,
    targetScore: 8,
    progress: 40,
    deadline: "Jul 15",
    coachNote: "Great improvement. Left-only 3-cone milestone hit — nice work.",
    coachInitials: "CW",
    todayDrill: "Left-only dribble warmup · 10 minutes",
    dueToday: true,
    linkedClip: null,
  },
];

const GOALS = [
  { term: "4-week", text: "Score 6/10 on contact layup eval", completed: false },
  { term: "4-week", text: "60% pull-up shooting chart", completed: false },
  { term: "Season", text: "Earn D1 film session invitation", completed: false },
  { term: "Season", text: "Improve overall assessment avg to 7.5+", completed: false },
  { term: "Long-term", text: "Build showcase reel for June recruiting events", completed: false },
];

const RECENT_FEEDBACK = [
  {
    id: "f1",
    date: "May 5",
    coachInitials: "CW",
    coachName: "Coach Williams",
    type: "Monthly Review",
    text: "Strong session. Your weak hand has made real strides since March. The contact finishing is lagging but the Mikan drill work is showing up in practice.",
    linkedClip: null,
  },
  {
    id: "f2",
    date: "May 2",
    coachInitials: "CW",
    coachName: "Coach Williams",
    type: "Film Note",
    text: "Watch your footwork on this play. You're fading instead of attacking — going left and drawing the foul is the right read here.",
    linkedClip: { title: "Missed and-1 vs. Toms River (0:47)", href: "/app/film/clips/c2" },
  },
  {
    id: "f3",
    date: "Apr 28",
    coachInitials: "CW",
    coachName: "Coach Williams",
    type: "Film Note",
    text: "Great DHO read here. This is exactly the instinct we're building. Bank this feeling.",
    linkedClip: { title: "DHO read vs. LBI (2:13)", href: "/app/film/clips/c4" },
  },
];

const UPCOMING = [
  { date: "May 20", label: "Contact Layup Re-Assessment", type: "assessment" },
  { date: "Jun 5", label: "Monthly 1-on-1 Review", type: "review" },
  { date: "Jun 15", label: "Focus Area #1 Deadline", type: "deadline" },
];

type CoachingActionType = "assign_clip" | "recommend_drill" | "add_to_idp" | "add_to_wod" | "request_reupload";
type CoachingActionStatus = "open" | "in_progress" | "resolved";

interface CoachingActionItem {
  id: string;
  actionType: CoachingActionType;
  status: CoachingActionStatus;
  issueCategory?: string;
  coachNote?: string;
  sessionTitle?: string;
  timestamp?: string;
  createdAt: string;
}

const MOCK_COACHING_ACTIONS: CoachingActionItem[] = [
  {
    id: "ca1",
    actionType: "request_reupload",
    status: "open",
    issueCategory: "Finishing",
    coachNote: "Record this contact layup again — drive through the contact instead of fading. Submit within 48h.",
    sessionTitle: "Barnegat vs. Toms River",
    timestamp: "1:23",
    createdAt: "2026-05-12",
  },
  {
    id: "ca2",
    actionType: "assign_clip",
    status: "open",
    issueCategory: "Release",
    coachNote: "Watch your thumb flick in this clip. This is the habit we need to break — index finger last off the ball.",
    sessionTitle: "Pull-Up Jumper Review",
    timestamp: "0:37",
    createdAt: "2026-05-10",
  },
  {
    id: "ca3",
    actionType: "recommend_drill",
    status: "in_progress",
    issueCategory: "Balance",
    coachNote: "Balance Board Jumpers — 3 sets of 8, focus on chest staying stacked over your base. Daily.",
    sessionTitle: "Pull-Up Jumper Review",
    timestamp: "0:14",
    createdAt: "2026-05-08",
  },
];

const ACTION_TYPE_META: Record<CoachingActionType, { label: string; icon: React.ReactNode; color: string }> = {
  assign_clip:      { label: "Film Clip",     icon: <Film className="w-3 h-3" />,         color: "bg-primary/15 text-primary border-primary/30" },
  recommend_drill:  { label: "Drill",         icon: <Dumbbell className="w-3 h-3" />,      color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  add_to_idp:       { label: "IDP",           icon: <Target className="w-3 h-3" />,        color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  add_to_wod:       { label: "WOD",           icon: <Flame className="w-3 h-3" />,         color: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  request_reupload: { label: "Re-upload Ask", icon: <RotateCcw className="w-3 h-3" />,    color: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
};

const SKILL_OVERVIEW = [
  { category: "Shooting", score: 7.2, max: 10 },
  { category: "Ball Handling", score: 7.8, max: 10 },
  { category: "Finishing", score: 5.7, max: 10 },
  { category: "Footwork", score: 6.5, max: 10 },
  { category: "Defense", score: 6.8, max: 10 },
  { category: "Decision-Making", score: 7.0, max: 10 },
  { category: "Conditioning", score: 8.0, max: 10 },
  { category: "Basketball IQ", score: 7.5, max: 10 },
];

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

const PRIORITY_MEDALS = ["🥇", "🥈", "🥉"];

function ScoreNumberLine({
  current,
  target,
  max = 10,
}: {
  current: number;
  target: number;
  max?: number;
}) {
  const pcts = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-0.5">
      {pcts.map((n) => {
        const isCurrent = n === current;
        const isTarget = n === target;
        const isBetween = n > current && n <= target;
        return (
          <div key={n} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold border transition-colors ${
                isCurrent
                  ? "bg-amber-500 border-amber-400 text-white"
                  : isTarget
                  ? "bg-primary border-primary text-primary-foreground"
                  : isBetween
                  ? "bg-primary/20 border-primary/30 text-primary/70"
                  : "bg-muted border-border text-muted-foreground/50"
              }`}
            >
              {n}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FocusAreaCard({
  area,
  drillDone,
  onDrillDone,
}: {
  area: (typeof FOCUS_AREAS)[number];
  drillDone: boolean;
  onDrillDone: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{area.emoji}</span>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                {area.category}
              </span>
              <span className="text-[11px] text-muted-foreground/50">·</span>
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                Focus #{area.priority}
              </span>
            </div>
            <h3 className="font-semibold text-[15px] leading-tight">{area.subSkill}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-lg leading-none">{PRIORITY_MEDALS[area.priority - 1]}</span>
          {area.dueToday && (
            <Badge className="text-[10px] bg-amber-500/15 text-amber-500 border-amber-500/30">
              Due Today
            </Badge>
          )}
        </div>
      </div>

      {/* Score number line */}
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-2">
          Score tracker · Current{" "}
          <span className="text-amber-500 font-bold">{area.currentScore}</span> → Target{" "}
          <span className="text-primary font-bold">{area.targetScore}</span> / 10
        </div>
        <ScoreNumberLine current={area.currentScore} target={area.targetScore} />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.1em]">
            Progress
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground">{area.progress}%</span>
            <span className="text-[10.5px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Deadline {area.deadline}
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${area.progress}%` }}
          />
        </div>
      </div>

      {/* Today's drill chip */}
      <div
        className={`rounded-lg px-4 py-3 flex items-center justify-between gap-3 border ${
          area.dueToday
            ? "bg-amber-500/8 border-amber-500/25"
            : "bg-muted/40 border-border"
        }`}
      >
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
            {area.dueToday ? "Today's drill" : "This week's drill"}
          </div>
          <div className="text-[13px] font-medium">{area.todayDrill}</div>
        </div>
        {area.dueToday && (
          <Button
            size="sm"
            variant={drillDone ? "outline" : "default"}
            className="shrink-0 text-xs"
            onClick={() => {
              if (!drillDone) {
                onDrillDone();
                toast.success("Drill logged! Keep building.");
              }
            }}
          >
            {drillDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Done
              </>
            ) : (
              "Log Drill"
            )}
          </Button>
        )}
      </div>

      {/* Coach note */}
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
          {area.coachInitials}
        </div>
        <p className="text-[12.5px] text-muted-foreground italic leading-relaxed">
          "{area.coachNote}"
        </p>
      </div>

      {/* Film clip link */}
      {area.linkedClip && (
        <Link href={area.linkedClip.href} asChild>
          <a className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:underline">
            <Film className="w-3.5 h-3.5" />
            {area.linkedClip.title}
            <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      )}
    </div>
  );
}

function SkillBar({ category, score, max }: { category: string; score: number; max: number }) {
  const pct = (score / max) * 100;
  const color =
    score >= 7.5
      ? "bg-emerald-500"
      : score >= 6.5
      ? "bg-primary"
      : score >= 5.5
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-muted-foreground w-[120px] shrink-0 truncate">
        {category}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12px] font-semibold w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

const UPCOMING_ICONS: Record<string, React.ReactNode> = {
  assessment: <Star className="w-3.5 h-3.5 text-amber-500" />,
  review: <TrendingUp className="w-3.5 h-3.5 text-primary" />,
  deadline: <Target className="w-3.5 h-3.5 text-rose-500" />,
};

const TERM_ORDER = ["4-week", "Season", "Long-term"] as const;

/* -------------------------------------------------------------------------- */
/* Main view                                                                   */
/* -------------------------------------------------------------------------- */

export function PlayerDevelopmentView() {
  const [, setLocation] = useLocation();
  const todayDrillIds = FOCUS_AREAS.filter((a) => a.dueToday).map((a) => a.id);
  const [doneDrills, setDoneDrills] = useState<Set<string>>(new Set());

  // Coaching actions assigned to this player — try real API, fall back to mock
  const [coachingActions, setCoachingActions] = useState<CoachingActionItem[]>(MOCK_COACHING_ACTIONS);
  useEffect(() => {
    // In a real session, PLAYER.id would come from the auth context
    apiGet<CoachingActionItem[]>("/coaching-actions/player/me")
      .then((items) => { if (Array.isArray(items) && items.length) setCoachingActions(items); })
      .catch(() => { /* keep mock */ });
  }, []);

  const allDone = todayDrillIds.every((id) => doneDrills.has(id));

  function markDone(id: string) {
    setDoneDrills((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (todayDrillIds.every((tid) => next.has(tid))) {
        toast.success("All done for today 🎉 You put in the work!");
      }
      return next;
    });
  }

  const seasonPct = Math.round((SEASON_PROGRESS.week / SEASON_PROGRESS.totalWeeks) * 100);
  const drillsPct = Math.round(
    (SEASON_PROGRESS.completedDrills / SEASON_PROGRESS.totalDrills) * 100
  );

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow={`${PLAYER.tier} · Class of ${PLAYER.gradYear} · ${PLAYER.team}`}
          title={`${PLAYER.name}'s Development Plan`}
          subtitle="Your personalized roadmap to the next level. Every rep counts. Show up every day."
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ---------------------------------------------------------------- */}
          {/* LEFT COLUMN                                                       */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Season progress card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
                    Season Progress
                  </div>
                  <h2 className="font-semibold text-[15px]">
                    Week {SEASON_PROGRESS.week} of {SEASON_PROGRESS.totalWeeks} · Season 2024–25
                  </h2>
                </div>
                <Badge className="gap-1.5 bg-amber-500/15 text-amber-500 border-amber-500/30 text-[11.5px] px-2.5 py-1">
                  <Flame className="w-3.5 h-3.5" />
                  {SEASON_PROGRESS.streakDays}-day streak
                </Badge>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.1em]">
                    Season timeline
                  </span>
                  <span className="text-[11.5px] font-semibold">{seasonPct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${seasonPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[12.5px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {SEASON_PROGRESS.completedDrills}/{SEASON_PROGRESS.totalDrills}
                    </span>{" "}
                    drills completed
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${drillsPct}%` }}
                  />
                </div>
                <span className="text-[11.5px] font-semibold text-emerald-500">{drillsPct}%</span>
              </div>
            </div>

            {/* Focus area cards */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-[15px]">Focus Areas</h2>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {FOCUS_AREAS.length} active
                </Badge>
              </div>
              {FOCUS_AREAS.map((area) => (
                <FocusAreaCard
                  key={area.id}
                  area={area}
                  drillDone={doneDrills.has(area.id)}
                  onDrillDone={() => markDone(area.id)}
                />
              ))}
            </div>

            {/* Coaching Actions — open items from your coach */}
            {coachingActions.filter((a) => a.status !== "resolved").length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-[15px]">Coach Actions</h2>
                  <Badge variant="outline" className="text-[10px] font-mono ml-auto">
                    {coachingActions.filter((a) => a.status === "open").length} open
                  </Badge>
                </div>
                <div className="flex flex-col gap-3">
                  {coachingActions
                    .filter((a) => a.status !== "resolved")
                    .map((action) => {
                      const meta = ACTION_TYPE_META[action.actionType];
                      return (
                        <div
                          key={action.id}
                          className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-background"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${meta.color}`}>
                              {meta.icon}
                              {meta.label}
                            </span>
                            {action.issueCategory && (
                              <span className="text-[11px] font-medium text-foreground">
                                {action.issueCategory}
                              </span>
                            )}
                            {action.status === "in_progress" && (
                              <span className="ml-auto text-[10px] font-mono text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                In progress
                              </span>
                            )}
                          </div>

                          {action.coachNote && (
                            <p className="text-[12.5px] text-muted-foreground leading-relaxed italic">
                              "{action.coachNote}"
                            </p>
                          )}

                          <div className="flex items-center gap-3 flex-wrap">
                            {action.sessionTitle && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Film className="w-3 h-3" />
                                {action.sessionTitle}
                                {action.timestamp && ` @ ${action.timestamp}`}
                              </span>
                            )}
                            <span className="text-[10.5px] text-muted-foreground font-mono ml-auto">
                              {action.createdAt}
                            </span>
                          </div>

                          {action.actionType === "request_reupload" && action.status === "open" && (
                            <button
                              onClick={() => setLocation(`/app/player/uploads?resolves=${action.id}`)}
                              className="inline-flex items-center gap-1.5 self-start h-7 px-3 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[11.5px] font-medium transition"
                            >
                              <Upload className="w-3 h-3" />
                              Upload Response
                            </button>
                          )}

                          {action.actionType === "assign_clip" && action.status === "open" && (
                            <Link href="/app/player/uploads" asChild>
                              <a className="inline-flex items-center gap-1.5 self-start h-7 px-3 rounded-md border border-border hover:bg-muted text-[11.5px] font-medium transition">
                                <Film className="w-3 h-3" />
                                Review Clip
                                <ChevronRight className="w-3 h-3" />
                              </a>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Skill overview */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-[15px]">Skill Overview</h2>
                <span className="text-[11.5px] text-muted-foreground ml-auto">Out of 10</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {SKILL_OVERVIEW.sort((a, b) => b.score - a.score).map((s) => (
                  <SkillBar key={s.category} {...s} />
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10.5px] text-muted-foreground">7.5+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[10.5px] text-muted-foreground">6.5–7.4</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[10.5px] text-muted-foreground">5.5–6.4</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[10.5px] text-muted-foreground">&lt; 5.5</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT COLUMN                                                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex flex-col gap-5">
            {/* Today's Work card */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-[15px]">Today's Work</h2>
              </div>

              {allDone ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-semibold text-[14px]">All done for today!</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    You put in the work. Rest up and come back tomorrow.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {FOCUS_AREAS.filter((a) => a.dueToday).map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5"
                    >
                      <span className="text-xl shrink-0">{area.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
                          {area.subSkill}
                        </div>
                        <div className="text-[12.5px] font-medium truncate">{area.todayDrill}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={doneDrills.has(area.id) ? "outline" : "default"}
                        className="shrink-0 text-xs h-7 px-2.5"
                        onClick={() => {
                          if (!doneDrills.has(area.id)) markDone(area.id);
                        }}
                      >
                        {doneDrills.has(area.id) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          "Done"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming timeline */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-[15px]">Upcoming</h2>
              </div>
              <div className="flex flex-col gap-3">
                {UPCOMING.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {UPCOMING_ICONS[item.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium leading-tight truncate">
                        {item.label}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground font-mono mt-0.5">
                        {item.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-[15px]">Coach Feedback</h2>
              </div>
              <div className="flex flex-col gap-4">
                {RECENT_FEEDBACK.map((fb) => (
                  <div key={fb.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {fb.coachInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11.5px] font-semibold">{fb.coachName}</span>
                          <Badge variant="outline" className="text-[9.5px] px-1.5 py-0">
                            {fb.type}
                          </Badge>
                        </div>
                        <div className="text-[10.5px] text-muted-foreground font-mono">
                          {fb.date}
                        </div>
                      </div>
                    </div>
                    <p className="text-[12.5px] text-muted-foreground leading-relaxed pl-8">
                      {fb.text}
                    </p>
                    {fb.linkedClip && (
                      <Link href={fb.linkedClip.href} asChild>
                        <a className="inline-flex items-center gap-1.5 text-[11.5px] text-primary hover:underline pl-8">
                          <Film className="w-3 h-3" />
                          {fb.linkedClip.title}
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </Link>
                    )}
                    <div className="border-b border-border/50 last:hidden" />
                  </div>
                ))}
              </div>
            </div>

            {/* Goals card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-[15px]">Goals</h2>
              </div>
              <div className="flex flex-col gap-5">
                {TERM_ORDER.map((term) => {
                  const goals = GOALS.filter((g) => g.term === term);
                  if (!goals.length) return null;
                  return (
                    <div key={term}>
                      <div className="text-[10px] font-mono uppercase tracking-[0.13em] text-muted-foreground mb-2.5">
                        {term}
                      </div>
                      <div className="flex flex-col gap-2">
                        {goals.map((goal, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            {goal.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-px" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-px" />
                            )}
                            <span
                              className={`text-[12.5px] leading-snug ${
                                goal.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {goal.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default PlayerDevelopmentView;
