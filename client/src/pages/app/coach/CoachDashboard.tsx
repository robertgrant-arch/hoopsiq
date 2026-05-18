/**
 * CoachDashboard — pre-practice command center.
 *
 * IA hierarchy (top → bottom):
 *   1. CommandStrip     — today's session context + next game countdown
 *   2. ActionLanes      — grouped, filterable attention lanes (replaces flat TriagePanel)
 *   3. TeamSnapshotRow  — compact readiness + WOD completion, not a table
 *   4. UpcomingEvents   — next 3 sessions (practice / game / tournament)
 *   Sidebar:
 *   5. FilmQueue        — top pending reviews with AI confidence
 *   6. DevelopmentAlerts— IDP + streak gaps by player name
 *   7. QuickActions     — 4 high-frequency coach actions
 */
import { useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  Film,
  Calendar,
  ClipboardList,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Moon,
  Zap,
  CheckCircle2,
  X,
  Star,
  ArrowRight,
  MapPin,
  Clock,
  Swords,
  TrendingUp,
  Bell,
  Dumbbell,
  Target,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { roster, athleteUploads } from "@/lib/mock/data";
import { MOCK_TEAM_READINESS } from "@/features/readiness";
import { ActionLanes } from "@/components/app/ActionLanes";

/* -------------------------------------------------------------------------- */
/* Mock data — command-center specific                                         */
/* -------------------------------------------------------------------------- */

const TODAY_SESSION = {
  type: "practice" as const,
  label: "Practice",
  location: "Barnegat HS · Main Gym",
  time: "3:30 – 5:15 PM",
  focus: "Ball pressure defense → half-court execution",
};

const NEXT_GAME = {
  opponent: "Oak Hill Academy",
  date: "Saturday",
  daysOut: 2,
  location: "Oak Hill HS · Away",
  scoutingReady: false,
};

const UPCOMING_EVENTS = [
  { id: "e1", type: "practice" as const, label: "Practice",            date: "Today",    time: "3:30 PM",  location: "Barnegat HS"        },
  { id: "e2", type: "game"     as const, label: "Game — Oak Hill",     date: "Saturday", time: "5:00 PM",  location: "Oak Hill HS · Away" },
  { id: "e3", type: "practice" as const, label: "Walkthrough",         date: "Friday",   time: "4:00 PM",  location: "Barnegat HS"        },
];


const DEVELOPMENT_ALERTS = [
  { id: "d1", player: "Tyler Brooks",  playerId: "p3",  note: "No IDP activity in 9 days",        href: "/app/coach/players/p3/idp"   },
  { id: "d2", player: "Noah Rivera",   playerId: "p8",  note: "Shooting goal deadline in 4 days",  href: "/app/coach/players/p8/idp"   },
  { id: "d3", player: "Brandon Lee",   playerId: "p12", note: "No skill log in 7 days",            href: "/app/coach/players/p12/idp"  },
];

const PRACTICE_PHASES = ["Warm-up", "Skill work", "5-on-5", "Film review"];

/* -------------------------------------------------------------------------- */
/* Small shared components                                                     */
/* -------------------------------------------------------------------------- */

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <span
      className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${className ?? "bg-primary/15 text-primary"}`}
    >
      {initials}
    </span>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
      <h3 className="font-bold text-[15px]">{title}</h3>
      {href && (
        <Link href={href} asChild>
          <a className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            {linkLabel} <ArrowRight className="w-3 h-3" />
          </a>
        </Link>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} asChild>
      <a className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition text-[13px]">
        <span className="flex items-center gap-2.5">
          <span className="text-primary">{icon}</span>
          {label}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
      </a>
    </Link>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className="focus:outline-none">
          <Star
            className={`w-5 h-5 transition-colors ${
              s <= value
                ? "fill-[oklch(0.72_0.17_75)] text-[oklch(0.72_0.17_75)]"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Zone 1 — CommandStrip                                                       */
/* Coach sees: today's session, focus area, next game countdown                */
/* -------------------------------------------------------------------------- */

function CommandStrip({
  onPracticeNotes,
  showPrompt,
  onDismissPrompt,
}: {
  onPracticeNotes: () => void;
  showPrompt: boolean;
  onDismissPrompt: () => void;
}) {
  const eventIcon =
    TODAY_SESSION.type === "practice" ? (
      <Dumbbell className="w-4 h-4 shrink-0" />
    ) : (
      <Swords className="w-4 h-4 shrink-0" />
    );

  return (
    <div className="space-y-3 mb-6">
      {/* Main strip */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid sm:grid-cols-[1fr_auto] divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {/* Left — today's session */}
          <div className="px-5 py-4 flex items-start gap-3.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "oklch(0.72 0.18 290 / 0.12)", color: "oklch(0.72 0.18 290)" }}
            >
              {eventIcon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[15px]">{TODAY_SESSION.label}</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "oklch(0.72 0.18 290 / 0.12)",
                    color: "oklch(0.72 0.18 290)",
                  }}
                >
                  TODAY
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {TODAY_SESSION.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {TODAY_SESSION.location}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[12.5px]">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Focus:</span>
                <span className="font-medium">{TODAY_SESSION.focus}</span>
              </div>
            </div>
          </div>

          {/* Right — next game */}
          <div className="px-5 py-4 flex items-start gap-3.5 sm:w-64">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: NEXT_GAME.daysOut <= 2
                  ? "oklch(0.68 0.22 25 / 0.12)"
                  : "oklch(0.72 0.17 75 / 0.10)",
                color: NEXT_GAME.daysOut <= 2
                  ? "oklch(0.68 0.22 25)"
                  : "oklch(0.72 0.17 75)",
              }}
            >
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[14px]">Next Game</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: NEXT_GAME.daysOut <= 2
                      ? "oklch(0.68 0.22 25 / 0.12)"
                      : "oklch(0.72 0.17 75 / 0.10)",
                    color: NEXT_GAME.daysOut <= 2
                      ? "oklch(0.68 0.22 25)"
                      : "oklch(0.72 0.17 75)",
                  }}
                >
                  {NEXT_GAME.daysOut === 0 ? "TODAY" : `${NEXT_GAME.daysOut}d`}
                </span>
              </div>
              <div className="text-[13px] font-medium mt-0.5">vs {NEXT_GAME.opponent}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{NEXT_GAME.date} · {NEXT_GAME.location}</div>
              {!NEXT_GAME.scoutingReady && NEXT_GAME.daysOut <= 2 && (
                <Link href="/app/coach/scouting/opp_westbury/game-plan" asChild>
                  <a
                    className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold w-full transition-colors hover:brightness-110"
                    style={{
                      borderColor: "oklch(0.68 0.22 25 / 0.35)",
                      background: "oklch(0.68 0.22 25 / 0.08)",
                      color: "oklch(0.68 0.22 25)",
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Game prep incomplete — open game-day view
                  </a>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post-practice prompt */}
      {showPrompt && (
        <div
          className="flex items-center gap-4 rounded-xl border px-5 py-3.5"
          style={{
            borderColor: "oklch(0.72 0.17 75 / 0.35)",
            background: "oklch(0.72 0.17 75 / 0.06)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ background: "oklch(0.72 0.17 75)" }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-[13.5px] font-semibold">Practice ended 45 min ago</span>
            <span className="text-[13px] text-muted-foreground ml-2">
              Leave notes while it's fresh.
            </span>
          </div>
          <Button size="sm" className="h-8 px-3 text-[12px] shrink-0" onClick={onPracticeNotes}>
            Log Notes
          </Button>
          <button
            onClick={onDismissPrompt}
            className="text-muted-foreground hover:text-foreground transition shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* Zone 2 — ActionLanes (imported from @/components/app/ActionLanes) */

/* -------------------------------------------------------------------------- */
/* Zone 3 — TeamSnapshotRow                                                    */
/* Compact, not a table. Shows: check-in rate, readiness breakdown, WOD done  */
/* -------------------------------------------------------------------------- */

function TeamSnapshotRow() {
  const total = MOCK_TEAM_READINESS.length;
  const submitted = MOCK_TEAM_READINESS.filter((p) => p.checkinSubmitted).length;
  const ready = MOCK_TEAM_READINESS.filter((p) => p.status === "READY").length;
  const flagged = MOCK_TEAM_READINESS.filter((p) => p.status === "FLAGGED").length;
  const restricted = MOCK_TEAM_READINESS.filter((p) => p.status === "RESTRICTED").length;
  const unknown = MOCK_TEAM_READINESS.filter((p) => p.status === "UNKNOWN").length;
  const wodDone = roster.filter((a) => a.compliance === 100).length;

  const cells = [
    { label: "Check-ins", value: `${submitted}/${total}`, sub: "submitted today", color: submitted === total ? "oklch(0.75 0.12 140)" : "oklch(0.72 0.17 75)" },
    { label: "Ready",      value: ready,      sub: "to practice",  color: "oklch(0.75 0.12 140)" },
    { label: "Flagged",    value: flagged,    sub: "need review",  color: flagged  > 0 ? "oklch(0.72 0.17 75)"  : undefined },
    { label: "Restricted", value: restricted, sub: "sit out",      color: restricted > 0 ? "oklch(0.68 0.22 25)" : undefined },
    { label: "No data",    value: unknown,    sub: "unknown",      color: unknown  > 0 ? "oklch(0.55 0.04 240)" : undefined },
    { label: "WOD done",   value: `${wodDone}/${roster.length}`, sub: "100% today", color: "oklch(0.72 0.18 290)" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-border/50">
        {cells.map((c) => (
          <div key={c.label} className="px-4 py-3 text-center">
            <div
              className="font-mono font-bold text-[20px] leading-none"
              style={c.color ? { color: c.color } : undefined}
            >
              {c.value}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{c.label}</div>
            <div className="text-[9px] text-muted-foreground/60 leading-none mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Zone 4 — UpcomingEvents                                                     */
/* -------------------------------------------------------------------------- */

function UpcomingEvents() {
  const eventTypeStyle = (type: "practice" | "game" | "tournament") => {
    if (type === "game")       return { bg: "oklch(0.68 0.22 25 / 0.1)",  text: "oklch(0.68 0.22 25)",  label: "Game" };
    if (type === "tournament") return { bg: "oklch(0.72 0.18 290 / 0.1)", text: "oklch(0.72 0.18 290)", label: "Tournament" };
    return                            { bg: "oklch(0.75 0.12 140 / 0.1)", text: "oklch(0.75 0.12 140)", label: "Practice" };
  };

  const nextGame = UPCOMING_EVENTS.find((e) => e.type === "game");

  return (
    <CollapsibleSection
      title="Upcoming"
      count={UPCOMING_EVENTS.length}
      href="/app/team/schedule"
      linkLabel="Full schedule"
      defaultOpen
      summary={nextGame ? `Next game ${nextGame.date} · ${nextGame.time}` : `${UPCOMING_EVENTS.length} events`}
    >
      <div className="divide-y divide-border/40">
        {UPCOMING_EVENTS.map((ev) => {
          const s = eventTypeStyle(ev.type);
          return (
            <div key={ev.id} className="px-5 py-3 flex items-center gap-3.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: s.bg, color: s.text }}
              >
                {ev.type === "game" ? <Swords className="w-3.5 h-3.5" /> : <Dumbbell className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{ev.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {ev.date} · {ev.time} · {ev.location}
                </div>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: s.bg, color: s.text }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar — FilmQueue                                                         */
/* Top pending reviews — directly actionable                                  */
/* -------------------------------------------------------------------------- */

function FilmQueue() {
  const pending = athleteUploads.filter((u) => u.status !== "COACH_REVIEWED");

  return (
    <CollapsibleSection
      title="Film Queue"
      count={pending.length}
      href="/app/coach/queue"
      linkLabel="Open queue"
      summary={pending.length > 0 ? `${pending.length} video${pending.length !== 1 ? "s" : ""} need review` : "Queue clear"}
    >
      {pending.length === 0 ? (
        <div className="px-5 py-4 flex items-center gap-2 text-[12px]" style={{ color: "oklch(0.65 0.18 150)" }}>
          <CheckCircle2 className="w-4 h-4" /> Queue clear
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {pending.slice(0, 4).map((u) => (
            <Link key={u.id} href={`/app/coach/queue/${u.id}`} asChild>
              <a className="px-5 py-3 flex items-start gap-3 hover:bg-muted/30 transition block">
                <Film
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.72 0.18 290)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate leading-snug">{u.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span className="font-mono">AI {(u.aiConfidence * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>{u.issues.length} issue{u.issues.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
              </a>
            </Link>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar — DevelopmentAlerts                                                 */
/* IDP gaps and goal deadlines by player name — drives coaching conversations  */
/* -------------------------------------------------------------------------- */

function DevelopmentAlerts() {
  return (
    <CollapsibleSection
      title="Development Gaps"
      count={DEVELOPMENT_ALERTS.length}
      href="/app/coach/roster"
      linkLabel="All players"
      summary={
        DEVELOPMENT_ALERTS.length > 0
          ? `${DEVELOPMENT_ALERTS.length} player${DEVELOPMENT_ALERTS.length !== 1 ? "s" : ""} need attention`
          : "No gaps"
      }
    >
      {DEVELOPMENT_ALERTS.length === 0 ? (
        <div className="px-5 py-4 flex items-center gap-2 text-[12px]" style={{ color: "oklch(0.65 0.18 150)" }}>
          <CheckCircle2 className="w-4 h-4" /> No development gaps
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {DEVELOPMENT_ALERTS.map((d) => (
            <Link key={d.id} href={d.href} asChild>
              <a className="px-5 py-3 flex items-start gap-3 hover:bg-muted/30 transition block">
                <TrendingUp
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.72 0.17 75)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{d.player}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{d.note}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
              </a>
            </Link>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                              */
/* -------------------------------------------------------------------------- */

export function CoachDashboard() {
  const [showPracticePrompt, setShowPracticePrompt] = useState(true);
  const [practiceNotesOpen, setPracticeNotesOpen] = useState(false);
  const [phaseRatings, setPhaseRatings] = useState([0, 0, 0, 0]);
  const [practiceNotes, setPracticeNotes] = useState("");
  function submitPracticeNotes() {
    setPracticeNotesOpen(false);
    setShowPracticePrompt(false);
    setPracticeNotes("");
    setPhaseRatings([0, 0, 0, 0]);
    toast.success("Practice notes saved");
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Coach HQ · Varsity"
          title="Command Center"
          subtitle="What needs your attention before practice starts."
          actions={
            <Link href="/app/coach/practice-plans" asChild>
              <a className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-[12.5px] uppercase tracking-[0.08em] hover:brightness-110 transition">
                <Calendar className="w-4 h-4" /> Practice Plan
              </a>
            </Link>
          }
        />

        {/* Zone 1 — Command strip */}
        <CommandStrip
          onPracticeNotes={() => setPracticeNotesOpen(true)}
          showPrompt={showPracticePrompt}
          onDismissPrompt={() => setShowPracticePrompt(false)}
        />

        <div className="grid lg:grid-cols-3 gap-5">
          {/* ---------------------------------------------------------------- */}
          {/* Left 2-col area                                                  */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-2 space-y-5">

            {/* Zone 2 — Action Lanes */}
            <ActionLanes />

            {/* Zone 3 — Team snapshot */}
            <TeamSnapshotRow />

            {/* Zone 4 — Upcoming events */}
            <UpcomingEvents />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right sidebar                                                    */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-5">
            {/* Film queue */}
            <FilmQueue />

            {/* Development alerts */}
            <DevelopmentAlerts />

            {/* Quick actions — condensed to 4 high-frequency items */}
            <CollapsibleSection title="Quick Actions" defaultOpen>
              <div className="p-3 space-y-0.5">
                <QuickAction
                  href="/app/coach/assignments"
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="Assign Workout"
                />
                <QuickAction
                  href="/app/coach/film/upload"
                  icon={<Film className="w-4 h-4" />}
                  label="Upload Film"
                />
                <QuickAction
                  href="/app/playbook"
                  icon={<Sparkles className="w-4 h-4" />}
                  label="Design a Play"
                />
                <QuickAction
                  href="/app/coach/inbox"
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Messages"
                />
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Post-Practice Notes Dialog — unchanged, still great UX */}
      <Dialog open={practiceNotesOpen} onOpenChange={setPracticeNotesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-bold text-[18px]">Post-Practice Notes</DialogTitle>
            <p className="text-[12.5px] text-muted-foreground">
              {TODAY_SESSION.label} · {TODAY_SESSION.location} · {TODAY_SESSION.time}
            </p>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div>
              <div className="text-[12px] uppercase tracking-[0.07em] font-semibold text-muted-foreground mb-3">
                Rate each phase
              </div>
              <div className="space-y-3">
                {PRACTICE_PHASES.map((phase, i) => (
                  <div key={phase} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-muted-foreground w-28 shrink-0">{phase}</span>
                    <StarRating
                      value={phaseRatings[i]}
                      onChange={(v) => setPhaseRatings((r) => r.map((x, j) => (j === i ? v : x)))}
                    />
                    <span className="text-[11px] font-mono text-muted-foreground w-6 text-right shrink-0">
                      {phaseRatings[i] > 0 ? `${phaseRatings[i]}/5` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] uppercase tracking-[0.07em] font-semibold text-muted-foreground block mb-2">
                Notes
              </label>
              <Textarea
                placeholder="Key observations, things to address tomorrow, standout moments..."
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
                className="text-[13px] min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Moon className="w-3.5 h-3.5" />
              Notes sync to this practice plan and athlete timelines
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPracticeNotesOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitPracticeNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
