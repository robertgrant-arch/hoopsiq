/**
 * PlayerPublicProfilePage — Shareable public player development profile.
 *
 * Accessible at /profile/:id (no auth wall).
 * Designed to be sent to college coaches and recruiting contacts.
 * Always renders Andrew Garcia's data in demo mode.
 */
import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  Shield,
  Share2,
  Check,
  TrendingUp,
  Target,
  Flame,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  MapPin,
  GraduationCap,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { skillTracks } from "@/lib/mock/data";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* Design tokens                                                               */
/* -------------------------------------------------------------------------- */

const PRIMARY   = "oklch(0.72 0.18 290)";
const SUCCESS   = "oklch(0.75 0.12 140)";
const WARNING   = "oklch(0.78 0.16 75)";

/* -------------------------------------------------------------------------- */
/* Inline data                                                                 */
/* -------------------------------------------------------------------------- */

const PLAYER = {
  id: "p_me",
  name: "Andrew Garcia",
  initials: "AG",
  position: "Point Guard",
  ageGroup: "17U",
  gradYear: "2027",
  location: "Barnegat, NJ",
  program: "Barnegat Basketball Program",
};

const DEV_STATS = [
  { label: "WOD Completion",     value: "91%",             sub: "Last 30 days"    },
  { label: "Film Observations",  value: "14 coach-verified", sub: "This season"   },
  { label: "Development Streak", value: "14 days",          sub: "Active"         },
  { label: "IDP Goals On Track", value: "3 / 3",            sub: "Current cycle"  },
];

const IDP_GOALS = [
  {
    area: "Left-Hand Finishing",
    currentLevel: 3,
    targetLevel: 4,
    status: "on_track" as const,
    note: "Consistent in Mikan drill, working toward contact finishes",
  },
  {
    area: "Pull-Up Reads off PnR",
    currentLevel: 2,
    targetLevel: 4,
    status: "on_track" as const,
    note: "Improving — 6 verified observations this month",
  },
  {
    area: "Ball Pressure Defense",
    currentLevel: 2,
    targetLevel: 3,
    status: "on_track" as const,
    note: "Shell drill consistency improving",
  },
];

const OBSERVATIONS = [
  {
    date: "May 14, 2026",
    observation:
      "Left-hand layup form significantly improved — natural, one-foot take-off consistent across 8 reps",
    category: "Finishing",
    verified: true,
  },
  {
    date: "May 11, 2026",
    observation:
      "PnR pull-up decision timing improving — reading screen angle before initiating dribble",
    category: "Shooting",
    verified: true,
  },
  {
    date: "May 8, 2026",
    observation:
      "Improved defensive stance consistency through full defensive slide series — no stance breaks",
    category: "Defense",
    verified: true,
  },
];

const TIMELINE_MILESTONES = [
  { period: "Jan 2026", event: "Joined Barnegat Program" },
  { period: "Feb 2026", event: "IDP goals set: Left-Hand Finishing, PnR Reads, Defense" },
  { period: "Mar 2026", event: "14-day WOD streak achieved" },
  { period: "Apr 2026", event: "Left-hand Mikan milestone completed" },
  { period: "May 2026", event: "Pull-up reads: Level 2 → 3 confirmed" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Finishing: "oklch(0.68 0.22 25)",
  Shooting:  PRIMARY,
  Defense:   SUCCESS,
};

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      className="flex-1 min-w-[140px] rounded-xl border border-border bg-card p-4"
      style={{ borderColor: `${PRIMARY.replace(")", " / 0.18)")}` }}
    >
      <div className="text-[11px] uppercase tracking-[0.1em] font-semibold text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className="text-xl font-bold leading-tight"
        style={{ color: PRIMARY }}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function LevelDots({
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
        const inTarget = i < target && i >= current;
        return (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-full border transition-colors"
            style={{
              background: filled
                ? PRIMARY
                : inTarget
                ? `${PRIMARY.replace(")", " / 0.20)")}`
                : "transparent",
              borderColor: filled
                ? PRIMARY
                : inTarget
                ? `${PRIMARY.replace(")", " / 0.40)")}`
                : "oklch(0.30 0.01 260)",
            }}
          />
        );
      })}
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${progress}%`, background: PRIMARY }}
      />
    </div>
  );
}

function SectionHeading({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-[16px] font-bold">{title}</h2>
      {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function PlayerPublicProfilePage() {
  useRoute("/profile/:id"); // consume the route param — always renders Andrew's data in demo

  const [copied, setCopied] = useState(false);

  function handleShare() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        toast.error("Could not copy link");
      });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Minimal nav ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size={26} />
          <Link href="/sign-in" asChild>
            <a className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </a>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
          {/* gradient accent strip */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ background: `linear-gradient(90deg, ${PRIMARY}, oklch(0.62 0.20 310))` }}
          />

          <div className="px-6 pt-7 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-[26px] font-bold shrink-0 select-none"
                style={{
                  background: `${PRIMARY.replace(")", " / 0.18)")}`,
                  color:      PRIMARY,
                  border:     `2px solid ${PRIMARY.replace(")", " / 0.35)")}`,
                }}
              >
                {PLAYER.initials}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div>
                    <h1 className="text-2xl font-bold leading-tight">{PLAYER.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: PRIMARY }}
                      >
                        {PLAYER.position}
                      </span>
                      <span className="text-muted-foreground text-[12px]">·</span>
                      <span className="text-[13px] text-muted-foreground">{PLAYER.ageGroup}</span>
                      <span className="text-muted-foreground text-[12px]">·</span>
                      <span className="text-[13px] text-muted-foreground">
                        Grad {PLAYER.gradYear}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{PLAYER.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span>{PLAYER.program}</span>
                    </div>
                  </div>

                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" style={{ color: SUCCESS }} />
                        <span style={{ color: SUCCESS }}>Link copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Verified badge */}
            <div
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{
                background: `${SUCCESS.replace(")", " / 0.12)")}`,
                color:      SUCCESS,
                border:     `1px solid ${SUCCESS.replace(")", " / 0.30)")}`,
              }}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              Verified Development Record · HoopsIQ
            </div>
          </div>
        </div>

        {/* ── Development stats strip ───────────────────────────────────── */}
        <div>
          <SectionHeading
            title="Development Overview"
            sub="Tracked and coach-verified through HoopsIQ"
          />
          <div className="flex flex-wrap gap-3">
            {DEV_STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* ── Skill tracks ─────────────────────────────────────────────── */}
        <div>
          <SectionHeading
            title="Skill Development"
            sub="Tracked since Jan 2025"
          />
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {skillTracks.map((track) => (
              <div key={track.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[17px] leading-none">{track.icon}</span>
                    <span className="text-[14px] font-semibold">{track.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${PRIMARY.replace(")", " / 0.14)")}`,
                        color:      PRIMARY,
                      }}
                    >
                      Lvl {track.level}
                    </span>
                    <span className="text-[12px] text-muted-foreground">{track.progress}%</span>
                  </div>
                </div>
                <ProgressBar progress={track.progress} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 px-1">
            Progress tracked through coach-verified film observations and WOD completions
          </p>
        </div>

        {/* ── Development focus (IDP goals) ────────────────────────────── */}
        <div>
          <SectionHeading
            title="Development Focus"
            sub="Individual Development Plan — Current cycle"
          />
          <div className="space-y-3">
            {IDP_GOALS.map((goal) => (
              <div
                key={goal.area}
                className="rounded-xl border border-border bg-card px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[14px] font-semibold">{goal.area}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{goal.note}</div>
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full"
                    style={{
                      background: `${SUCCESS.replace(")", " / 0.14)")}`,
                      color:      SUCCESS,
                    }}
                  >
                    On Track
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1.5">
                      Level {goal.currentLevel} → {goal.targetLevel}
                    </div>
                    <LevelDots
                      current={goal.currentLevel}
                      target={goal.targetLevel}
                      max={5}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span>Target: Level {goal.targetLevel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Coach observations ───────────────────────────────────────── */}
        <div>
          <SectionHeading
            title="Recent Coach Observations"
            sub="Coach-verified · Film-backed"
          />
          <div className="space-y-3">
            {OBSERVATIONS.map((obs, i) => {
              const catColor = CATEGORY_COLORS[obs.category] ?? PRIMARY;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card px-5 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[12px] text-muted-foreground">{obs.date}</span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full"
                      style={{
                        background: `${catColor.replace(")", " / 0.14)")}`,
                        color:      catColor,
                      }}
                    >
                      {obs.category}
                    </span>
                    {obs.verified && (
                      <span
                        className="flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: SUCCESS }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Coach-verified
                      </span>
                    )}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-foreground/90">
                    {obs.observation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Development timeline ─────────────────────────────────────── */}
        <div>
          <SectionHeading
            title="Development Timeline"
            sub="Key milestones since joining the program"
          />
          <div className="relative pl-6">
            {/* vertical line */}
            <div
              className="absolute left-[9px] top-2 bottom-2 w-[2px] rounded-full"
              style={{ background: `${PRIMARY.replace(")", " / 0.20)")}` }}
            />
            <div className="space-y-5">
              {TIMELINE_MILESTONES.map((m, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  {/* dot */}
                  <div
                    className="absolute -left-[15px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      background:   i === TIMELINE_MILESTONES.length - 1 ? PRIMARY : "var(--background)",
                      borderColor:  PRIMARY,
                    }}
                  >
                    {i === TIMELINE_MILESTONES.length - 1 && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-background"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: PRIMARY }}
                    >
                      {m.period}
                    </span>
                    <p className="text-[13px] text-foreground/85 mt-0.5">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer CTA ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border px-6 py-6 text-center"
          style={{
            borderColor: `${PRIMARY.replace(")", " / 0.25)")}`,
            background:  `${PRIMARY.replace(")", " / 0.06)")}`,
          }}
        >
          <div className="flex justify-center mb-3">
            <Award className="w-7 h-7" style={{ color: PRIMARY }} />
          </div>
          <h3 className="text-[17px] font-bold mb-1">
            Interested in {PLAYER.name}?
          </h3>
          <p className="text-[13px] text-muted-foreground mb-4 max-w-sm mx-auto">
            Contact {PLAYER.program} through HoopsIQ to learn more about Andrew's development record.
          </p>
          <Link href="/sign-up">
            <a>
              <Button
                disabled
                className="px-6 text-[13px] font-semibold opacity-60"
                style={{ background: PRIMARY, color: "#fff" }}
              >
                Contact Program
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </Link>
          <p className="text-[11px] text-muted-foreground/60 mt-4">
            Powered by HoopsIQ — Verified player development records
          </p>
        </div>
      </div>

      {/* Bottom padding for mobile */}
      <div className="h-10" />
    </div>
  );
}
