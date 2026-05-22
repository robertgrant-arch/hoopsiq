/**
 * CoachEducationHub — /app/coach/education
 *
 * The education landing page for HoopsIQ coaches. Designed as a development
 * partner, not a course catalog. Shows progress, priorities, and next actions
 * in a warm, professional two-column layout.
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  GraduationCap,
  BookOpen,
  Target,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
  Flame,
  ArrowRight,
  FileText,
  Users,
  Award,
  Zap,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  learningPaths,
  allModules,
  getNextModule,
  journalPrompts,
  type EducationModule,
} from "@/features/coach-education/education";
import { coachEffectivenessBreakdown } from "@/features/coach-metrics/mock";

// ─────────────────────────────────────────────────────────────────────────────
// Derived data helpers
// ─────────────────────────────────────────────────────────────────────────────

const foundationPath = learningPaths.find((p) => p.level === 1)!;
const foundationModuleList = foundationPath.modules;
const completedCount = foundationModuleList.filter((m) => !!m.completedAt).length;

// Credential requirement mock — computed from module completion
const CREDENTIAL_REQUIREMENTS = [
  {
    id: "cr_01",
    label: "Complete all 9 Foundation modules",
    target: "9 of 9 modules complete",
    currentValue: `${completedCount} of 9 complete`,
    met: completedCount === 9,
  },
  {
    id: "cr_02",
    label: "All active players have IDPs",
    target: "100% IDP coverage",
    currentValue: "11 of 11 players",
    met: true,
  },
  {
    id: "cr_03",
    label: "IDP milestone coverage",
    target: "80% of players have milestones",
    currentValue: "8 of 11 players",
    met: true,
  },
  {
    id: "cr_04",
    label: "Film reviews with timestamp annotations",
    target: "3 sessions with timestamps",
    currentValue: "1 session",
    met: false,
  },
  {
    id: "cr_05",
    label: "Cue Library populated",
    target: "5 drills with cues",
    currentValue: "5 of 5 drills",
    met: true,
  },
  {
    id: "cr_06",
    label: "Practice plans using 4-block structure",
    target: "4 plans with all blocks",
    currentValue: "4 of 4 plans",
    met: true,
  },
  {
    id: "cr_07",
    label: "Coaching journal entries",
    target: "5 entries across 3+ modules",
    currentValue: "5 entries, 5 modules",
    met: true,
  },
  {
    id: "cr_08",
    label: "Observation log entries",
    target: "10 observations in 30 days",
    currentValue: "6 observations",
    met: false,
  },
  {
    id: "cr_09",
    label: "Parent communication log",
    target: "2 documented conversations",
    currentValue: "0 documented",
    met: false,
  },
];

const CREDENTIAL_PROGRESS = Math.round(
  (CREDENTIAL_REQUIREMENTS.filter((r) => r.met).length / CREDENTIAL_REQUIREMENTS.length) * 100
);

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COACHING_STREAK = 7;
const COMMUNITY_COUNT = 847;

const TODAY_JOURNAL_PROMPT =
  "Describe one player interaction from this week that surprised you. What did you learn about how they receive feedback?";

const WEEK_ACTIVITY = [true, true, false, true, true, true, true]; // Mon–Sun

const QUICK_LINKS = [
  { label: "Learning Paths", icon: BookOpen, href: "/app/coach/education/paths" },
  { label: "Cue Library", icon: Target, href: "/app/coach/cues" },
  { label: "Coaching Journal", icon: FileText, href: "/app/coach/education/journal" },
  { label: "Staff Cohort", icon: Users, href: "/app/coach/staff" },
  { label: "Certifications", icon: Award, href: "/app/coach/education/certifications" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** SVG arc effectiveness ring */
function EffectivenessRing({ score }: { score: number }) {
  const radius = 36;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="oklch(0.9 0.01 260)"
          strokeWidth="7"
          className="dark:opacity-20"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="oklch(0.72 0.18 290)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          fontSize="18"
          fontWeight="700"
          fontFamily="inherit"
        >
          {score}
        </text>
      </svg>
      <p className="text-[11px] text-muted-foreground text-center max-w-[90px] leading-tight">
        Based on your player outcome data
      </p>
    </div>
  );
}

/** Module status indicator — derived from status field */
function StatusDot({ module, locked }: { module: EducationModule; locked?: boolean }) {
  if (module.status === "complete") {
    return <CheckCircle2 className="size-4 text-[oklch(0.75_0.12_140)] shrink-0" />;
  }
  if (locked || module.status === "locked") {
    return <Lock className="size-4 text-muted-foreground shrink-0 opacity-50" />;
  }
  if (module.status === "in_progress") {
    return (
      <div className="size-4 rounded-full border-2 border-primary bg-primary/20 shrink-0" />
    );
  }
  // "next up" — first not_started module in path
  const firstNotStarted = allModules.find(
    (m) => m.path === module.path && m.status === "not_started"
  );
  if (firstNotStarted?.id === module.id) {
    return (
      <div className="size-4 rounded-full border-2 border-primary bg-primary/20 shrink-0" />
    );
  }
  return <Circle className="size-4 text-muted-foreground shrink-0 opacity-40" />;
}

/** Domain/category tag — works with both slug categories and domain strings */
function domainToColor(domain: string): string {
  if (domain.includes("Film")) return "oklch(0.65 0.15 220)";
  if (domain.includes("Practice") || domain.includes("WOD") || domain.includes("Drill") || domain.includes("Teaching") || domain.includes("Cue")) return "oklch(0.75 0.12 140)";
  if (domain.includes("Communication") || domain.includes("Parent")) return "oklch(0.70 0.14 170)";
  if (domain.includes("Program") || domain.includes("Accountability")) return "oklch(0.68 0.22 25)";
  if (domain === "data") return "oklch(0.78 0.16 75)";
  if (domain === "leadership") return "oklch(0.68 0.22 25)";
  if (domain === "film") return "oklch(0.65 0.15 220)";
  if (domain === "communication") return "oklch(0.70 0.14 170)";
  if (domain === "practice-design") return "oklch(0.75 0.12 140)";
  return "oklch(0.72 0.18 290)";
}

function domainToLabel(domain: string): string {
  if (domain.includes("Film")) return "Film";
  if (domain.includes("Practice") || domain.includes("WOD") || domain.includes("Drill") || domain.includes("Teaching") || domain.includes("Cue")) return "Practice";
  if (domain.includes("Communication") || domain.includes("Parent")) return "Communication";
  if (domain.includes("Program") || domain.includes("Accountability")) return "Leadership";
  const slugMap: Record<string, string> = { "player-dev": "Player Dev", "practice-design": "Practice", film: "Film", communication: "Communication", data: "Data", leadership: "Leadership" };
  return slugMap[domain] ?? domain;
}

function CategoryTag({ category }: { category: string }) {
  const color = domainToColor(category);
  return (
    <span
      className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      {domainToLabel(category)}
    </span>
  );
}

/** Level badge */
function LevelBadge({ level }: { level: "foundation" | "development" | "elite" }) {
  const config = {
    foundation: {
      label: "Foundation Coach",
      color: "oklch(0.65 0.15 220)",
      bg: "oklch(0.65 0.15 220 / 0.12)",
    },
    development: {
      label: "Development Coach",
      color: "oklch(0.72 0.18 290)",
      bg: "oklch(0.72 0.18 290 / 0.12)",
    },
    elite: {
      label: "Elite Coach",
      color: "oklch(0.78 0.16 75)",
      bg: "oklch(0.78 0.16 75 / 0.12)",
    },
  };
  const cfg = config[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border"
      style={{
        color: cfg.color,
        background: cfg.bg,
        borderColor: `color-mix(in oklch, ${cfg.color} 30%, transparent)`,
      }}
    >
      <GraduationCap className="size-3.5" />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Welcome Card
// ─────────────────────────────────────────────────────────────────────────────

function WelcomeCard() {
  const { user } = useAuth();
  const activeModule = getNextModule();
  const firstName = user?.name?.split(" ")[0] ?? "Coach";
  const effectivenessScore = coachEffectivenessBreakdown.overallScore;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-3">
            <LevelBadge level="foundation" />
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Flame className="size-4 text-[oklch(0.68_0.22_25)]" />
              {COACHING_STREAK} days engaging with Coach Ed
            </span>
          </div>

          <h2 className="text-[22px] font-bold leading-tight mb-1">
            Welcome back, {firstName}
          </h2>
          <p className="text-[14px] text-muted-foreground mb-5">
            You're {completedCount} of {foundationModuleList.length} modules through Foundation. Keep the momentum.
          </p>

          {activeModule && (
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                This week's focus
              </p>
              <h3 className="text-[15px] font-semibold mb-1">{activeModule.title}</h3>
              <p className="text-[13px] text-muted-foreground mb-3 line-clamp-2">
                {activeModule.subtitle}
              </p>
              <div className="flex items-center gap-2">
                <Link href={`/app/coach/education/module/${activeModule.id}`}>
                  <Button size="sm" className="gap-1.5">
                    <PlayCircle className="size-4" />
                    Start module
                  </Button>
                </Link>
                <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {activeModule.estimatedMinutes} min
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 sm:pt-1">
          <EffectivenessRing score={effectivenessScore} />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center hidden sm:block">
            Effectiveness
            <br />
            Score
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: What To Do Next
// ─────────────────────────────────────────────────────────────────────────────

function WhatToDoNext() {
  const activeModule = getNextModule();
  const topUnmetReq = CREDENTIAL_REQUIREMENTS.find((r) => !r.met);

  const recommended = foundationModuleList.find(
    (m) => m.status !== "complete" && m.status !== "locked" && m.id !== activeModule?.id
  );

  type AccentKey = "primary" | "warning" | "success";

  const accentColors: Record<AccentKey, string> = {
    primary: "oklch(0.72 0.18 290)",
    warning: "oklch(0.78 0.16 75)",
    success: "oklch(0.75 0.12 140)",
  };

  const items: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    category: string;
    href: string;
    actionLabel: string;
    accent: AccentKey;
  }> = [];

  if (activeModule) {
    items.push({
      icon: <PlayCircle className="size-5 text-primary" />,
      title: activeModule.title,
      description: `Next up · ${activeModule.estimatedMinutes} min`,
      category: activeModule.domain,
      href: `/app/coach/education/module/${activeModule.id}`,
      actionLabel: "Start",
      accent: "primary",
    });
  }

  if (topUnmetReq) {
    items.push({
      icon: <Award className="size-5 text-[oklch(0.78_0.16_75)]" />,
      title: topUnmetReq.label,
      description: topUnmetReq.currentValue ?? topUnmetReq.label,
      category: "leadership",
      href: "/app/coach/education/certifications",
      actionLabel: "View",
      accent: "warning",
    });
  }

  if (recommended) {
    items.push({
      icon: <Zap className="size-5 text-[oklch(0.75_0.12_140)]" />,
      title: recommended.title,
      description: `Recommended · ${recommended.estimatedMinutes} min`,
      category: recommended.domain,
      href: `/app/coach/education/module/${recommended.id}`,
      actionLabel: "Preview",
      accent: "success",
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        What to do next
      </h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-background"
          >
            <div
              className="size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: `color-mix(in oklch, ${accentColors[item.accent]} 12%, transparent)`,
              }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <CategoryTag category={item.category} />
              <p className="text-[14px] font-semibold mt-1 mb-0.5 line-clamp-1">
                {item.title}
              </p>
              <p className="text-[12px] text-muted-foreground line-clamp-1">
                {item.description}
              </p>
            </div>
            <Link href={item.href}>
              <Button variant="ghost" size="sm" className="shrink-0 mt-1">
                {item.actionLabel}
                <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Foundation Path Progress
// ─────────────────────────────────────────────────────────────────────────────

function FoundationPathProgress() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[15px] font-semibold flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          Foundation Path
        </h2>
        <Link href="/app/coach/education/paths">
          <button className="text-[12px] text-primary hover:underline flex items-center gap-0.5">
            All paths <ChevronRight className="size-3.5" />
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4 mt-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${(completedCount / foundationModuleList.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-[12px] text-muted-foreground shrink-0">
          {completedCount}/{foundationModuleList.length}
        </span>
      </div>

      <div className="divide-y divide-border">
        {foundationModuleList.map((module, index) => (
          <Link
            key={module.id}
            href={`/app/coach/education/module/${module.id}`}
          >
            <div
              className="flex items-center gap-3 py-2.5 hover:bg-accent/30 -mx-2 px-2 rounded transition-colors cursor-pointer"
            >
              <span className="text-[12px] text-muted-foreground w-5 shrink-0 font-mono">
                {String(index + 1).padStart(2, "0")}
              </span>
              <StatusDot module={module} />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] font-medium truncate ${
                    module.status === "complete"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {module.title}
                </p>
                <CategoryTag category={module.domain} />
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                <Clock className="size-3" />
                {module.estimatedMinutes}m
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Coaching Journal Prompt
// ─────────────────────────────────────────────────────────────────────────────

function JournalPromptCard() {
  const [response, setResponse] = useState("");
  const [saved, setSaved] = useState(false);
  const todayPrompt = journalPrompts[journalPrompts.length - 1];

  function handleSave() {
    if (!response.trim()) {
      toast.error("Write something first — even a sentence counts.");
      return;
    }
    setSaved(true);
    toast.success("Journal entry saved.");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          Today's reflection
        </h2>
        <span className="text-[11px] text-muted-foreground">Last entry: May 14</span>
      </div>

      <p className="text-[14px] text-foreground mb-3 leading-relaxed italic">
        "{todayPrompt?.prompt ?? TODAY_JOURNAL_PROMPT}"
      </p>

      {saved ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[oklch(0.75_0.12_140_/_0.1)] border border-[oklch(0.75_0.12_140_/_0.3)]">
          <CheckCircle2 className="size-4 text-[oklch(0.75_0.12_140)]" />
          <p className="text-[13px] text-[oklch(0.75_0.12_140)]">
            Entry saved to your coaching journal.
          </p>
        </div>
      ) : (
        <>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your reflection here..."
            className="min-h-[96px] text-[14px] mb-3 resize-none"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!response.trim()}
            className="w-full"
          >
            Save to journal
          </Button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Recent Wins
// ─────────────────────────────────────────────────────────────────────────────

function RecentWins() {
  const wins = [
    {
      label: "Completed: Writing IDPs",
      sub: "3 days ago · Foundation Module 1",
      icon: <CheckCircle2 className="size-4 text-[oklch(0.75_0.12_140)]" />,
    },
    {
      label: "Completed: 4-Block Practice Structure",
      sub: "1 day ago · Foundation Module 2",
      icon: <CheckCircle2 className="size-4 text-[oklch(0.75_0.12_140)]" />,
    },
    {
      label: "Platform deliverable: Updated Marcus's IDP milestones",
      sub: "Yesterday · Behavioral completion",
      icon: <Star className="size-4 text-[oklch(0.78_0.16_75)]" />,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
        <Star className="size-4 text-[oklch(0.78_0.16_75)]" />
        Recent wins
      </h2>
      <div className="space-y-2.5">
        {wins.map((w, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{w.icon}</div>
            <div>
              <p className="text-[13px] font-medium">{w.label}</p>
              <p className="text-[11px] text-muted-foreground">{w.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar: Foundation Certificate
// ─────────────────────────────────────────────────────────────────────────────

function CertificateSidebar() {
  const requirements = CREDENTIAL_REQUIREMENTS;
  const metCount = requirements.filter((r) => r.met).length;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Award className="size-4 text-[oklch(0.78_0.16_75)]" />
        <h3 className="text-[14px] font-semibold leading-tight">
          HoopsIQ Foundation Certificate
        </h3>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${CREDENTIAL_PROGRESS}%`,
              background: "oklch(0.72 0.18 290)",
            }}
          />
        </div>
        <span className="text-[12px] font-semibold text-muted-foreground shrink-0">
          {CREDENTIAL_PROGRESS}%
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground mb-3">
        {metCount} of {requirements.length} requirements met
      </p>

      <div className="space-y-2">
        {requirements.map((req) => (
          <div key={req.id} className="flex items-start gap-2">
            {req.met ? (
              <CheckCircle2 className="size-4 text-[oklch(0.75_0.12_140)] shrink-0 mt-0.5" />
            ) : (
              <Circle className="size-4 text-[oklch(0.68_0.22_25)] shrink-0 mt-0.5 opacity-70" />
            )}
            <div className="min-w-0">
              <p
                className={`text-[12px] font-medium leading-snug ${
                  req.met ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {req.label}
              </p>
              {!req.met && req.currentValue && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {req.currentValue}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Link href="/app/coach/education/certifications">
        <button className="w-full mt-4 text-[12px] text-primary hover:underline flex items-center justify-center gap-1">
          View full requirements <ArrowRight className="size-3.5" />
        </button>
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar: Module Streak
// ─────────────────────────────────────────────────────────────────────────────

function StreakSidebar() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold flex items-center gap-2">
          <Flame className="size-4 text-[oklch(0.68_0.22_25)]" />
          Module streak
        </h3>
        <span className="text-[13px] font-bold text-primary">{COACHING_STREAK} days</span>
      </div>
      <div className="flex gap-2">
        {WEEK_ACTIVITY.map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className="size-7 rounded-full border-2 transition-all"
              style={
                active
                  ? {
                      background: "oklch(0.72 0.18 290)",
                      borderColor: "oklch(0.72 0.18 290)",
                    }
                  : {
                      background: "transparent",
                      borderColor: "oklch(0.85 0.01 260)",
                    }
              }
            />
            <span className="text-[10px] text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar: Quick Links
// ─────────────────────────────────────────────────────────────────────────────

function QuickLinksSidebar() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-[14px] font-semibold mb-3">Quick links</h3>
      <div className="space-y-0.5">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group">
              <link.icon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-[13px] font-medium flex-1">{link.label}</span>
              <ChevronRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar: Community Stat
// ─────────────────────────────────────────────────────────────────────────────

function CommunityStat() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Users className="size-5 text-primary" />
      </div>
      <div>
        <p className="text-[15px] font-bold">{COMMUNITY_COUNT.toLocaleString()}</p>
        <p className="text-[12px] text-muted-foreground">HoopsIQ coaches learning this week</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CoachEducationHub() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <PageHeader
          eyebrow="COACHING EDUCATION"
          title="Education Hub"
          subtitle="Build your coaching system. Track your impact."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Content */}
          <div className="space-y-6 min-w-0">
            <WelcomeCard />
            <WhatToDoNext />
            <FoundationPathProgress />
            <JournalPromptCard />
            <RecentWins />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <CertificateSidebar />
            <StreakSidebar />
            <QuickLinksSidebar />
            <CommunityStat />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
