/**
 * ParentDigestPage — Weekly development digest for parents.
 *
 * Auto-generated summary of the child's week in review, surfacing
 * WOD completions, coach observations, IDP goal progress, and upcoming events.
 */
import {
  Dumbbell,
  Eye,
  Flame,
  Target,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { skillTracks } from "@/lib/mock/data";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY = "oklch(0.72 0.18 290)";
const SUCCESS = "oklch(0.75 0.12 140)";
const WARNING = "oklch(0.78 0.16 75)";
const DANGER  = "oklch(0.68 0.22 25)";

/* -------------------------------------------------------------------------- */
/* Inline data                                                                 */
/* -------------------------------------------------------------------------- */

const WEEK_LABEL     = "May 9–15, 2026";
const CHILD_NAME     = "Andrew";
const FULL_NAME      = "Andrew Garcia";

const HERO_METRICS = [
  {
    icon: Dumbbell,
    label:    "WODs Completed",
    value:    "4 / 5",
    sub:      "this week",
    color:    PRIMARY,
  },
  {
    icon: Eye,
    label:    "Coach Observations",
    value:    "3 new",
    sub:      "this week",
    color:    SUCCESS,
  },
  {
    icon: Flame,
    label:    "Active Streak",
    value:    "14 days",
    sub:      "active",
    color:    WARNING,
  },
];

const IDP_GOALS = [
  {
    area:         "Left-Hand Finishing",
    currentLevel: 3,
    targetLevel:  4,
    status:       "on_track" as const,
    milestone:    "Mikan drill milestone hit this week",
  },
  {
    area:         "Pull-Up Reads off PnR",
    currentLevel: 2,
    targetLevel:  4,
    status:       "on_track" as const,
    milestone:    "Level 2 → 3 verified by coach",
  },
  {
    area:         "Ball Pressure Defense",
    currentLevel: 2,
    targetLevel:  3,
    status:       "on_track" as const,
    milestone:    undefined,
  },
];

type WodSession = {
  day:        string;
  date:       string;
  drills: {
    name:       string;
    skillFocus: string;
    completed:  boolean;
  }[];
};

const WOD_SESSIONS: WodSession[] = [
  {
    day:  "Monday",
    date: "May 9",
    drills: [
      { name: "Form Shooting",          skillFocus: "Shooting mechanics",   completed: true  },
      { name: "Elbow Pull-Ups",         skillFocus: "Mid-range pull-up",    completed: true  },
    ],
  },
  {
    day:  "Tuesday",
    date: "May 10",
    drills: [
      { name: "Mikan Drill (Left)",     skillFocus: "Left-hand finishing",  completed: true  },
      { name: "Finishing Burst",        skillFocus: "Finishing under fatigue", completed: true },
    ],
  },
  {
    day:  "Wednesday",
    date: "May 11",
    drills: [
      { name: "Screen Escape Jumpers",  skillFocus: "Off-screen shooting",  completed: true  },
      { name: "Defensive Slides",       skillFocus: "Defensive stance",     completed: true  },
    ],
  },
  {
    day:  "Friday",
    date: "May 13",
    drills: [
      { name: "PnR Pull-Up Series",     skillFocus: "PnR reads",            completed: true  },
    ],
  },
  {
    day:  "Saturday",
    date: "May 14",
    drills: [
      { name: "Shell Drill Closeouts",  skillFocus: "Ball pressure defense", completed: false },
      { name: "Live Dribble Catch-Shoot", skillFocus: "Rhythm shooting",    completed: false },
    ],
  },
];

const OBSERVATIONS = [
  {
    date:        "May 14, 2026",
    observation: "Left-hand layup form significantly improved — natural, one-foot take-off consistent across 8 reps",
    category:    "Finishing",
    coachNote:   "This is the milestone we've been chasing since February. Andrew locked this in on his own.",
  },
  {
    date:        "May 11, 2026",
    observation: "PnR pull-up decision timing improving — reading screen angle before initiating dribble",
    category:    "Shooting",
    coachNote:   undefined,
  },
  {
    date:        "May 8, 2026",
    observation: "Improved defensive stance consistency through full defensive slide series — no stance breaks",
    category:    "Defense",
    coachNote:   "Shell drill has been the key. Three weeks of consistent reps showing up in practice.",
  },
];

const ATTENDANCE_THIS_WEEK = { attended: 4, total: 5 };
const READINESS_AVG = 81;

const UPCOMING = [
  { icon: Clock,    text: "Next practice: Thursday May 16, 5:30 PM — Barnegat HS Gym B" },
  { icon: Calendar, text: "Upcoming: Oak Hill game Saturday May 17, 11 AM"               },
  { icon: Dumbbell, text: "Next WOD focus: Ball Control + Layup Footwork"                 },
];

const COACH_NOTE = {
  text:   "Strong week from Andrew. Left-hand work is clicking. Keep the WOD submissions consistent — we're building toward the Oak Hill game. Focus on staying low on the defensive closeouts.",
  author: "Coach Marcus",
};

const CATEGORY_COLORS: Record<string, string> = {
  Finishing: DANGER,
  Shooting:  PRIMARY,
  Defense:   SUCCESS,
};

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ progress, color = PRIMARY }: { progress: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${progress}%`, background: color }}
      />
    </div>
  );
}

function LevelTrack({
  current,
  target,
  max = 5,
}: {
  current: number;
  target: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const filled   = i < current;
        const inTarget = !filled && i < target;
        return (
          <span
            key={i}
            className="w-3 h-3 rounded-full border transition-colors"
            style={{
              background:  filled ? PRIMARY : inTarget ? `${PRIMARY.replace(")", " / 0.20)")}` : "transparent",
              borderColor: filled ? PRIMARY : inTarget ? `${PRIMARY.replace(")", " / 0.35)")}` : "oklch(0.28 0.01 260)",
            }}
          />
        );
      })}
      <span className="ml-1.5 text-[11px] text-muted-foreground">
        {current} / {target}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ParentDigestPage() {
  const { user } = useAuth();

  // For demo purposes, treat non-Pro as free tier to show the upgrade prompt
  const isFreeTier = true;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-7">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="pt-1">
          <div
            className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-1"
            style={{ color: PRIMARY }}
          >
            Weekly Digest
          </div>
          <h1 className="text-2xl font-bold leading-tight">
            {CHILD_NAME}'s Week in Review
            <span className="block text-[15px] font-normal text-muted-foreground mt-1">
              {WEEK_LABEL}
            </span>
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Auto-generated by HoopsIQ from coach-verified data
          </p>
        </div>

        {/* ── Hero metric strip ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {HERO_METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1"
            >
              <m.icon
                className="w-4 h-4 shrink-0 mb-0.5"
                style={{ color: m.color }}
              />
              <div
                className="text-[18px] font-bold leading-tight"
                style={{ color: m.color }}
              >
                {m.value}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-medium">
                {m.sub}
              </div>
              <div className="text-[11px] text-foreground/70 font-medium">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── IDP goals this week ───────────────────────────────────── */}
        <div>
          <SectionHeading
            title="This Week's Focus"
            sub="Individual Development Plan goals"
          />
          <div className="space-y-3">
            {IDP_GOALS.map((goal) => (
              <div
                key={goal.area}
                className="rounded-xl border border-border bg-card px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-[13.5px] font-semibold">{goal.area}</div>
                  <span
                    className="shrink-0 text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                    style={{
                      background: `${SUCCESS.replace(")", " / 0.14)")}`,
                      color:      SUCCESS,
                    }}
                  >
                    On Track
                  </span>
                </div>
                <LevelTrack
                  current={goal.currentLevel}
                  target={goal.targetLevel}
                />
                {goal.milestone && (
                  <div
                    className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium"
                    style={{ color: SUCCESS }}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    {goal.milestone}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Skill track snapshot ────────────────────────────────────── */}
        <div>
          <SectionHeading
            title="Skill Track Progress"
            sub="Long-term tracked development areas"
          />
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {skillTracks.map((track) => (
              <div key={track.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] leading-none">{track.icon}</span>
                    <span className="text-[13px] font-medium">{track.name}</span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${PRIMARY.replace(")", " / 0.14)")}`,
                      color:      PRIMARY,
                    }}
                  >
                    Lvl {track.level}
                  </span>
                </div>
                <ProgressBar progress={track.progress} />
              </div>
            ))}
          </div>
        </div>

        {/* ── What Andrew worked on ────────────────────────────────────── */}
        <div>
          <SectionHeading
            title={`What ${CHILD_NAME} Worked On`}
            sub="WOD sessions this week by day"
          />
          <div className="space-y-3">
            {WOD_SESSIONS.map((session) => (
              <div key={session.day} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* day header */}
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[13px] font-semibold">{session.day}</span>
                    <span className="text-[12px] text-muted-foreground">·</span>
                    <span className="text-[12px] text-muted-foreground">{session.date}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {session.drills.filter((d) => d.completed).length} / {session.drills.length} done
                  </span>
                </div>
                {/* drills */}
                <div className="divide-y divide-border">
                  {session.drills.map((drill, di) => (
                    <div
                      key={di}
                      className="px-4 py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2
                          className="w-4 h-4 shrink-0"
                          style={{ color: drill.completed ? SUCCESS : "oklch(0.35 0.01 260)" }}
                        />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium truncate">{drill.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {drill.skillFocus}
                          </div>
                        </div>
                      </div>
                      {!drill.completed && (
                        <span className="shrink-0 text-[10px] text-muted-foreground/60">
                          Missed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Coach observations ───────────────────────────────────────── */}
        <div>
          <SectionHeading
            title="Coach Observations"
            sub="Verified this week · From film and practice"
          />
          <div className="space-y-3">
            {OBSERVATIONS.map((obs, i) => {
              const catColor = CATEGORY_COLORS[obs.category] ?? PRIMARY;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] text-muted-foreground">{obs.date}</span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                      style={{
                        background: `${catColor.replace(")", " / 0.14)")}`,
                        color:      catColor,
                      }}
                    >
                      {obs.category}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold"
                      style={{ color: SUCCESS }}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Coach-verified
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-foreground/90 mb-2">
                    {obs.observation}
                  </p>
                  {obs.coachNote && (
                    <blockquote
                      className="mt-2 pl-3 border-l-2 text-[12px] italic text-muted-foreground leading-relaxed"
                      style={{ borderColor: catColor }}
                    >
                      "{obs.coachNote}"
                    </blockquote>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Attendance ───────────────────────────────────────────────── */}
        <div>
          <SectionHeading title="Attendance This Week" />
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-semibold">
                {ATTENDANCE_THIS_WEEK.attended} / {ATTENDANCE_THIS_WEEK.total} practices attended
              </span>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: `${SUCCESS.replace(")", " / 0.14)")}`,
                  color:      SUCCESS,
                }}
              >
                {Math.round((ATTENDANCE_THIS_WEEK.attended / ATTENDANCE_THIS_WEEK.total) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: ATTENDANCE_THIS_WEEK.total }, (_, i) => (
                <span
                  key={i}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors"
                  style={
                    i < ATTENDANCE_THIS_WEEK.attended
                      ? { background: SUCCESS, color: "#fff" }
                      : { background: "oklch(0.22 0.005 260)", color: "oklch(0.40 0.01 260)" }
                  }
                >
                  {i < ATTENDANCE_THIS_WEEK.attended ? "✓" : "–"}
                </span>
              ))}
              <span className="text-[11px] text-muted-foreground ml-1">
                {["Mon", "Tue", "Wed", "Thu", "Sat"][ATTENDANCE_THIS_WEEK.total - 1] ? "" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Readiness ────────────────────────────────────────────────── */}
        <div>
          <SectionHeading title="Readiness Average" />
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[20px] font-bold" style={{ color: SUCCESS }}>
                  {READINESS_AVG}
                </span>
                <span className="text-[14px] text-muted-foreground"> / 100</span>
              </div>
              <span
                className="text-[12px] font-semibold px-3 py-1 rounded-full"
                style={{
                  background: `${SUCCESS.replace(")", " / 0.14)")}`,
                  color:      SUCCESS,
                }}
              >
                Good to train all week
              </span>
            </div>
            <ProgressBar progress={READINESS_AVG} color={SUCCESS} />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Avg readiness score based on daily check-ins
            </p>
          </div>
        </div>

        {/* ── What's next ──────────────────────────────────────────────── */}
        <div>
          <SectionHeading title="What's Next" />
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {UPCOMING.map((item, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <item.icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: PRIMARY }}
                />
                <span className="text-[13px] text-foreground/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Coach note ───────────────────────────────────────────────── */}
        <div>
          <SectionHeading title="From the Coach" />
          <div
            className="rounded-xl border px-5 py-5"
            style={{
              borderColor: `${PRIMARY.replace(")", " / 0.20)")}`,
              background:  `${PRIMARY.replace(")", " / 0.05)")}`,
            }}
          >
            <MessageSquare
              className="w-4 h-4 mb-3"
              style={{ color: PRIMARY }}
            />
            <blockquote className="text-[14px] leading-relaxed italic text-foreground/90 mb-3">
              "{COACH_NOTE.text}"
            </blockquote>
            <div className="text-[12px] font-semibold text-muted-foreground">
              — {COACH_NOTE.author}
            </div>
          </div>
        </div>

        {/* ── Upgrade prompt (free tier) ───────────────────────────────── */}
        {isFreeTier && (
          <div
            className="rounded-2xl border border-border bg-card px-5 py-5"
            style={{
              borderColor: `${WARNING.replace(")", " / 0.25)")}`,
              background:  `${WARNING.replace(")", " / 0.04)")}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: `${WARNING.replace(")", " / 0.15)")}`,
                  color:      WARNING,
                }}
              >
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11px] uppercase tracking-[0.1em] font-bold mb-1"
                  style={{ color: WARNING }}
                >
                  HoopsIQ Pro
                </div>
                <p className="text-[13.5px] font-semibold leading-snug mb-1">
                  Get full access to session videos, live readiness data, and direct coach messaging
                </p>
                <p className="text-[12px] text-muted-foreground mb-3.5">
                  Upgrade to HoopsIQ Pro and stay fully connected to {CHILD_NAME}'s development in real time.
                </p>
                <Link href="/app/parent/billing">
                  <a>
                    <Button
                      size="sm"
                      className="text-[12px] font-semibold"
                      style={{ background: WARNING, color: "#000" }}
                    >
                      Upgrade to Pro
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </AppShell>
  );
}
