import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Lock,
  Award,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  Users,
  BookOpen,
  Share2,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types & data                                                                */
/* -------------------------------------------------------------------------- */

type Requirement = {
  id: string;
  label: string;
  description: string;
  met: boolean;
  currentValue: string;
  needed?: string;
};

type Credential = {
  id: string;
  title: string;
  shortTitle: string;
  level: 1 | 2 | 3;
  status: "in-progress" | "locked" | "earned";
  requirements: Requirement[];
  unlocks: string[];
  aspirationalNote?: string;
};

const CREDENTIALS: Credential[] = [
  {
    id: "foundation",
    title: "HoopsIQ Foundation Certificate",
    shortTitle: "Foundation",
    level: 1,
    status: "in-progress",
    requirements: [
      {
        id: "curriculum",
        label: "Complete Level 1 curriculum (12 modules)",
        description: "Work through all 12 foundational coaching modules covering player development, communication, practice design, and performance tracking.",
        met: false,
        currentValue: "2 of 12 complete",
        needed: "Complete 10 more modules",
      },
      {
        id: "idp_milestones",
        label: "All players have active IDPs with at least 2 milestones",
        description: "Each player on your roster must have an Individual Development Plan with at least two concrete, measurable milestones set.",
        met: true,
        currentValue: "9 of 11 players · 82%",
      },
      {
        id: "film_review",
        label: "Maintain >75% film review rate for 6 consecutive weeks",
        description: "Consistent film review is one of the strongest predictors of player development. Track your weekly review percentage across 6 unbroken weeks.",
        met: false,
        currentValue: "Current: 68% · Week 3 of 6",
        needed: "Reach 75%+ and sustain for 6 consecutive weeks",
      },
      {
        id: "observations",
        label: "2+ observations per player per week for 4 consecutive weeks",
        description: "Regular structured observations help players improve faster. Document at least 2 per player each week across 4 consecutive weeks.",
        met: false,
        currentValue: "Current: 1.8/week · Week 1 of 4",
        needed: "Reach 2.0+ observations/player/week",
      },
      {
        id: "parent_comm",
        label: "Parent communication: 1 per family per month for 3 months",
        description: "Strong parent relationships improve player retention and development. Reach out to every family at least once per month for three consecutive months.",
        met: true,
        currentValue: "Month 2 of 3 complete",
      },
      {
        id: "peer_review",
        label: "Deliver one peer practice plan review",
        description: "Collaborate with another coach by reviewing their practice plan and providing structured feedback. This builds your analytical coaching eye.",
        met: true,
        currentValue: "Completed May 3",
      },
      {
        id: "staff_alignment",
        label: "Conduct one staff alignment session",
        description: "Bring your staff together around shared coaching values, player development philosophy, and communication standards.",
        met: true,
        currentValue: "Completed April 28",
      },
      {
        id: "wod_completion",
        label: "80%+ WOD completion across roster for 30 days",
        description: "Consistent workout completion signals player engagement and buy-in. Maintain 80%+ roster-wide completion across 30 consecutive days.",
        met: true,
        currentValue: "Current: 78% · 26 of 30 days",
      },
      {
        id: "philosophy",
        label: "Submit coaching philosophy statement",
        description: "Write and submit a 300–500 word coaching philosophy statement articulating your values, approach to player development, and long-term vision.",
        met: false,
        currentValue: "Not submitted",
        needed: "Write and submit your philosophy statement",
      },
    ],
    unlocks: [
      "HoopsIQ Foundation credential badge on your coach profile",
      "Access to Level 2 curriculum and advanced modules",
      "Community plan sharing — publish practice plans to the coach network",
      "Referral eligibility — earn credits for coaches you bring to HoopsIQ",
      "Priority listing in program search results",
    ],
  },
  {
    id: "development",
    title: "HoopsIQ Development Certificate",
    shortTitle: "Development",
    level: 2,
    status: "locked",
    requirements: [
      {
        id: "dev_curriculum",
        label: "Complete Level 2 curriculum (15 modules)",
        description: "Advanced modules covering periodization, video analysis mastery, team culture systems, and competitive performance.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_idp_outcomes",
        label: "Document 5 player milestone achievements",
        description: "Track and document at least 5 players reaching a milestone in their IDP — with before/after data.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_film_mastery",
        label: "Complete 20 annotated film sessions",
        description: "Submit 20 film sessions with timestamp annotations and player-specific feedback notes.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_peer_network",
        label: "Complete 3 peer coach exchanges",
        description: "Mutual practice plan reviews or observation sessions with other certified coaches.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_parent_engagement",
        label: "Achieve 90%+ parent satisfaction score",
        description: "Via HoopsIQ end-of-season parent survey across a full season.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_practice_quality",
        label: "Submit 12 high-rated practice plans",
        description: "Plans rated 4+ stars by the peer review community or a verified expert coach.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_at_risk",
        label: "Document 3 successful at-risk interventions",
        description: "Log structured check-ins and outcomes for at-risk players, with follow-up data.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_mentorship",
        label: "Mentor one Foundation-level coach",
        description: "Formally support a Foundation-level coach through at least 4 structured sessions.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_benchmarking",
        label: "Complete two benchmarking assessment cycles",
        description: "Run full benchmarking assessments across your roster with documented progression.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "dev_philosophy",
        label: "Submit updated coaching philosophy + program outcomes",
        description: "A revised philosophy statement supported by player outcome data from the past season.",
        met: false,
        currentValue: "Locked",
      },
    ],
    unlocks: [
      "Development credential badge — displayed prominently in coach search",
      "Access to Expert marketplace listing — charge for 1-on-1 coaching sessions",
      "Unlock advanced AI film analysis features",
      "Co-author and publish playbooks to the HoopsIQ community library",
      "Early access to new platform features",
      "Invitation to HoopsIQ Coach Advisory roundtables",
    ],
  },
  {
    id: "elite",
    title: "HoopsIQ Elite Certificate",
    shortTitle: "Elite",
    level: 3,
    status: "locked",
    aspirationalNote: "For coaches who have built something that lasts.",
    requirements: [
      {
        id: "elite_outcomes",
        label: "Document 3 years of measurable player outcomes",
        description: "Longitudinal player development data showing skill progression, retention, and player-reported growth.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "elite_program",
        label: "Build a program culture system",
        description: "Document your team values framework, onboarding process, and cultural rituals — reviewed by a HoopsIQ Master Coach.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "elite_mentor",
        label: "Develop two Development-level coaches",
        description: "Formally mentor two coaches to Development certification through your program.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "elite_publish",
        label: "Publish 3 peer-reviewed coaching resources",
        description: "Practice plans, playbooks, or methodology documents that have been peer-reviewed and featured in the HoopsIQ community.",
        met: false,
        currentValue: "Locked",
      },
      {
        id: "elite_interview",
        label: "Complete Master Coach review interview",
        description: "A structured conversation with a HoopsIQ Master Coach assessing your philosophy, outcomes, and program systems.",
        met: false,
        currentValue: "Locked",
      },
    ],
    unlocks: [
      "Elite credential badge — rarest designation in the HoopsIQ network",
      "Master Coach listing with full program showcase page",
      "Revenue share on curriculum you contribute to the platform",
      "Invitation to HoopsIQ Coach Summit (annual, all expenses paid)",
      "Dedicated profile feature to programs seeking elite coaches",
    ],
  },
];

const MET_COUNT = CREDENTIALS[0].requirements.filter((r) => r.met).length;
const TOTAL_COUNT = CREDENTIALS[0].requirements.length;
const PROGRESS_PCT = Math.round((MET_COUNT / TOTAL_COUNT) * 100);

/* -------------------------------------------------------------------------- */
/* SVG Progress Ring                                                           */
/* -------------------------------------------------------------------------- */

function ProgressRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const R = (size - 10) / 2;
  const C = 2 * Math.PI * R;
  const dashOffset = C - (C * pct) / 100;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        fill="none"
        stroke="oklch(0.30 0.01 260)"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        fill="none"
        stroke="oklch(0.75 0.12 140)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Requirement Row                                                             */
/* -------------------------------------------------------------------------- */

function RequirementRow({ req }: { req: Requirement }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border transition-colors ${
        req.met
          ? "border-green-500/20 bg-green-500/5"
          : "border-border bg-background"
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-3 text-left min-h-[44px]"
      >
        <span className="shrink-0 mt-0.5">
          {req.met ? (
            <CheckCircle2
              className="w-4 h-4"
              style={{ color: "oklch(0.75 0.12 140)" }}
            />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground/50" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div
            className="text-[13px] font-medium leading-snug"
            style={{ color: req.met ? "oklch(0.75 0.12 140)" : undefined }}
          >
            {req.label}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {req.currentValue}
            {!req.met && req.needed && (
              <span className="ml-2 text-warning" style={{ color: "oklch(0.78 0.16 75)" }}>
                · {req.needed}
              </span>
            )}
          </div>
        </div>

        <span className="shrink-0 text-muted-foreground/40 mt-0.5">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-[12px] text-muted-foreground leading-relaxed pl-7">
            {req.description}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Maintenance Section                                                         */
/* -------------------------------------------------------------------------- */

function MaintenanceSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 min-h-[44px] text-left"
      >
        <div className="flex items-center gap-3">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
          <span className="text-[14px] font-semibold">Credential Maintenance</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          <p className="text-[13px] text-muted-foreground">
            Credentials expire after <strong className="text-foreground">24 months</strong> without maintenance activity. Maintenance keeps your credential current and signals active coaching engagement.
          </p>

          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/50">
              Annual maintenance requires
            </div>
            {[
              { icon: <BookOpen className="w-4 h-4" />, label: "Complete 4 modules per year from the continuing education library" },
              { icon: <Users className="w-4 h-4" />, label: "Submit 1 peer practice plan review per year" },
              { icon: <TrendingUp className="w-4 h-4" />, label: "Maintain active engagement metrics (coaching sessions, observations, communications)" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-[13px] text-muted-foreground">
                <span className="shrink-0 mt-0.5 text-muted-foreground/60">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg p-3 text-[12px]"
            style={{
              background: "oklch(0.72 0.18 290 / 0.08)",
              border: "1px solid oklch(0.72 0.18 290 / 0.18)",
              color: "oklch(0.72 0.18 290)",
            }}
          >
            Foundation Certificate — renewal not yet applicable (no active credential). Maintenance tracking begins after you earn your first credential.
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Network Badge Preview                                                       */
/* -------------------------------------------------------------------------- */

function NetworkBadgeSection() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Share2 className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-[14px] font-semibold">How your credential appears to others</h3>
      </div>

      {/* Badge preview */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-[18px] font-bold shrink-0"
          style={{
            background: "oklch(0.72 0.18 290 / 0.12)",
            border: "2px solid oklch(0.72 0.18 290 / 0.35)",
            color: "oklch(0.72 0.18 290)",
          }}
        >
          <Award className="w-7 h-7" />
        </div>
        <div>
          <div className="text-[13px] font-bold">Coach Name</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">HoopsIQ Foundation · In Progress</div>
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mt-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            6 of 9 requirements met
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <div
            className="text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider"
            style={{
              background: "oklch(0.78 0.16 75 / 0.12)",
              color: "oklch(0.78 0.16 75)",
              border: "1px solid oklch(0.78 0.16 75 / 0.25)",
            }}
          >
            In Progress
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div
        className="rounded-lg p-4 flex items-start gap-3"
        style={{
          background: "oklch(0.75 0.12 140 / 0.07)",
          border: "1px solid oklch(0.75 0.12 140 / 0.18)",
        }}
      >
        <Sparkles
          className="w-4 h-4 shrink-0 mt-0.5"
          style={{ color: "oklch(0.75 0.12 140)" }}
        />
        <p className="text-[13px]" style={{ color: "oklch(0.75 0.12 140)" }}>
          <strong>Coaches with Foundation credentials are 2.4× more likely</strong> to be hired by programs that find them through HoopsIQ.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Level Progression Visual                                                    */
/* -------------------------------------------------------------------------- */

function LevelProgression({ initials }: { initials: string }) {
  const steps = [
    { label: "Foundation", status: "in-progress", met: MET_COUNT, total: TOTAL_COUNT },
    { label: "Development", status: "locked", met: 0, total: 10 },
    { label: "Elite", status: "locked", met: 0, total: 5 },
  ];

  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {steps.map((step, i) => {
        const isActive = step.status === "in-progress";
        const isLocked = step.status === "locked";
        const isEarned = step.status === "earned";

        return (
          <div key={step.label} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      border: "2px solid oklch(0.72 0.18 290 / 0.5)",
                      transform: "scale(1.25)",
                    }}
                  />
                )}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-[13px] font-bold relative z-10"
                  style={
                    isActive
                      ? {
                          background: "oklch(0.72 0.18 290 / 0.15)",
                          border: "2px solid oklch(0.72 0.18 290)",
                          color: "oklch(0.72 0.18 290)",
                        }
                      : isEarned
                      ? {
                          background: "oklch(0.75 0.12 140 / 0.15)",
                          border: "2px solid oklch(0.75 0.12 140)",
                          color: "oklch(0.75 0.12 140)",
                        }
                      : {
                          background: "oklch(0.18 0.005 260)",
                          border: "2px solid oklch(0.28 0.01 260)",
                          color: "oklch(0.45 0.01 260)",
                        }
                  }
                >
                  {isLocked ? (
                    <Lock className="w-5 h-5" />
                  ) : isEarned ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    initials
                  )}
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-[12px] font-semibold"
                  style={{
                    color: isActive
                      ? "oklch(0.72 0.18 290)"
                      : isEarned
                      ? "oklch(0.75 0.12 140)"
                      : "oklch(0.45 0.01 260)",
                  }}
                >
                  {step.label}
                </div>
                {isActive && (
                  <div className="text-[10px] text-muted-foreground">
                    {step.met} of {step.total} met
                  </div>
                )}
                {isLocked && (
                  <div className="text-[10px] text-muted-foreground/40">Locked</div>
                )}
              </div>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="w-12 h-[2px] mx-1 mb-6"
                style={{
                  background:
                    i === 0
                      ? "linear-gradient(to right, oklch(0.72 0.18 290 / 0.4), oklch(0.28 0.01 260))"
                      : "oklch(0.28 0.01 260)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Foundation Card                                                             */
/* -------------------------------------------------------------------------- */

function FoundationCard({ credential }: { credential: Credential }) {
  const [showUnlocks, setShowUnlocks] = useState(false);

  return (
    <div className="rounded-xl border-2 bg-card p-5 space-y-5" style={{ borderColor: "oklch(0.72 0.18 290 / 0.4)" }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div
            className="text-[11px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            Level 1 · In Progress
          </div>
          <h2 className="text-[20px] font-bold leading-tight">{credential.title}</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Projected completion: <strong className="text-foreground">~6 weeks at current pace</strong>
          </p>
        </div>

        {/* Progress ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          <ProgressRing pct={PROGRESS_PCT} size={88} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[18px] font-bold" style={{ color: "oklch(0.75 0.12 140)" }}>
              {PROGRESS_PCT}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              {MET_COUNT}/{TOTAL_COUNT}
            </span>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/50">
          Requirements ({MET_COUNT} of {TOTAL_COUNT} met)
        </div>
        <div className="space-y-1.5">
          {credential.requirements.map((req) => (
            <RequirementRow key={req.id} req={req} />
          ))}
        </div>
      </div>

      {/* Unlocks section */}
      <div className="rounded-xl border border-border bg-background">
        <button
          onClick={() => setShowUnlocks((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left min-h-[44px]"
        >
          <span className="text-[13px] font-semibold">What this unlocks</span>
          {showUnlocks ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {showUnlocks && (
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
            {credential.unlocks.map((unlock, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                <CheckCircle2
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: "oklch(0.75 0.12 140)" }}
                />
                <span>{unlock}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Link href="/app/coach/education/paths" asChild>
        <a
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold transition-all min-h-[44px]"
          style={{
            background: "oklch(0.72 0.18 290)",
            color: "#fff",
          }}
          onClick={() => toast("Opening Foundation curriculum")}
        >
          Continue Foundation curriculum
          <ChevronRight className="w-4 h-4" />
        </a>
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Locked Credential Card                                                      */
/* -------------------------------------------------------------------------- */

function LockedCredentialCard({ credential }: { credential: Credential }) {
  const [showUnlocks, setShowUnlocks] = useState(false);

  const isElite = credential.level === 3;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 relative overflow-hidden">
      {/* Dimmed overlay feel */}
      <div className="absolute inset-0 bg-background/40 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "oklch(0.22 0.005 260)",
              border: "1px solid oklch(0.28 0.01 260)",
            }}
          >
            <Lock className="w-5 h-5" style={{ color: "oklch(0.45 0.01 260)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5">
              Level {credential.level} · Locked
            </div>
            <h2 className="text-[18px] font-bold text-muted-foreground/60 leading-tight">
              {credential.title}
            </h2>
            {isElite && credential.aspirationalNote && (
              <p className="text-[13px] text-muted-foreground/50 mt-1 italic">
                "{credential.aspirationalNote}"
              </p>
            )}
            <p className="text-[12px] text-muted-foreground/50 mt-1">
              Unlocks after {credential.level === 2 ? "Foundation" : "Development"} Certificate
            </p>
          </div>
        </div>

        {/* Requirements (grayed out preview) */}
        <div className="space-y-2 mb-4">
          <div className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/30">
            Requirements ({credential.requirements.length} total)
          </div>
          <div className="space-y-1.5">
            {credential.requirements.map((req) => (
              <div
                key={req.id}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-border/40 bg-background/50"
              >
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground/30" />
                <span className="text-[12px] text-muted-foreground/40 leading-snug">
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Unlocks section */}
        <div className="rounded-xl border border-border/40 bg-background/50">
          <button
            onClick={() => setShowUnlocks((v) => !v)}
            className="w-full flex items-center justify-between p-4 text-left min-h-[44px]"
          >
            <span className="text-[13px] font-semibold text-muted-foreground/60">What this unlocks</span>
            {showUnlocks ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            )}
          </button>
          {showUnlocks && (
            <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-2">
              {credential.unlocks.map((unlock, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[12px] text-muted-foreground/50">
                  <Award className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/30" />
                  <span>{unlock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function CertificationPage() {
  const initials = "JC"; // Would come from useAuth() in production

  const foundation = CREDENTIALS[0];
  const development = CREDENTIALS[1];
  const elite = CREDENTIALS[2];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          eyebrow="Coach Development"
          title="Certifications"
          subtitle="Earn credentials that validate your coaching practice and unlock new platform capabilities."
        />

        {/* Level progression visual */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-[12px] font-semibold text-muted-foreground/60 text-center mb-1 uppercase tracking-widest">
            Your path
          </div>
          <LevelProgression initials={initials} />
        </div>

        {/* Foundation Certificate */}
        <FoundationCard credential={foundation} />

        {/* Development Certificate */}
        <LockedCredentialCard credential={development} />

        {/* Elite Certificate */}
        <LockedCredentialCard credential={elite} />

        {/* Maintenance */}
        <MaintenanceSection />

        {/* Network badge */}
        <NetworkBadgeSection />
      </div>
    </AppShell>
  );
}
