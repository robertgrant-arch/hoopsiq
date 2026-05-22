/**
 * PublicRecruitingProfilePage — Public-facing recruiting profile.
 * Route: /recruiting/:slug
 *
 * NO auth required. NO AppShell. Standalone marketing-quality page.
 * Dark background. Centered container max-w-4xl.
 *
 * Sections:
 *  1. Minimal top nav (logo + sign in)
 *  2. Hero (name, position, tier, verified)
 *  3. Verification strip
 *  4. Development tier visualization
 *  5. Skills overview (gated blur)
 *  6. Verified badges
 *  7. Growth signal
 *  8. Coach narrative preview
 *  9. Film package indicator
 * 10. Program context
 * 11. Access request CTA + form
 * 12. Footer
 */
import { useState } from "react";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Tier = "Emerging" | "Developing" | "Advanced" | "Elite";
type Division = "D1" | "D2" | "D3" | "NAIA" | "JUCO";
type AccessLevel =
  | "profile_narrative"
  | "full_profile"
  | "full_profile_film";

type PublicProfile = {
  slug: string;
  playerName: string;
  position: string;
  gradYear: number;
  height: string;
  programName: string;
  teamTier: Tier;
  overallTier: Tier;
  assessmentCount: number;
  badgeCount: number;
  filmClipCount: number;
  filmSessionCount: number;
  lastUpdated: string;
  growthSignal: "rapidly_improving" | "steadily_improving" | "stable";
  coachNarrativePreview: string | null;
  showCoachNarrative: boolean;
  topSkills: Array<{ name: string; tierLabel: string; score: number }>;
  badges: Array<{ name: string; id: string }>;
  programDescription: string;
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const PROFILES: Record<string, PublicProfile> = {
  "jordan-mills-2027": {
    slug: "jordan-mills-2027",
    playerName: "Jordan Mills",
    position: "Point Guard",
    gradYear: 2027,
    height: "6'1\"",
    programName: "Elevation Basketball",
    teamTier: "Advanced",
    overallTier: "Advanced",
    assessmentCount: 14,
    badgeCount: 7,
    filmClipCount: 23,
    filmSessionCount: 8,
    lastUpdated: "May 10, 2026",
    growthSignal: "rapidly_improving",
    coachNarrativePreview:
      "Jordan has had a standout quarter. The effort in defensive drills has translated directly into game performance — this isn't just practice improvement, it's real.",
    showCoachNarrative: true,
    topSkills: [
      { name: "Defense", tierLabel: "Elite", score: 79 },
      { name: "Ball Handling", tierLabel: "Proficient", score: 83 },
    ],
    badges: [
      { name: "Lockdown Defender", id: "badge-lockdown" },
      { name: "Floor General", id: "badge-floor-general" },
      { name: "Film Student", id: "badge-film" },
      { name: "Attendance Leader", id: "badge-attendance" },
      { name: "IDP Finisher", id: "badge-idp" },
      { name: "Coachable", id: "badge-coachable" },
      { name: "Clutch Performer", id: "badge-clutch" },
    ],
    programDescription:
      "Development-focused program on HoopsIQ. Advanced team tier.",
  },
};

const DEFAULT_PROFILE = PROFILES["jordan-mills-2027"];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const TIER_ORDER: Tier[] = ["Emerging", "Developing", "Advanced", "Elite"];

const TIER_COLORS: Record<Tier, string> = {
  Emerging: "oklch(0.60 0.10 200)",
  Developing: "oklch(0.78 0.16 75)",
  Advanced: "oklch(0.72 0.18 290)",
  Elite: "oklch(0.75 0.12 140)",
};

const GROWTH_SIGNAL_LABELS: Record<PublicProfile["growthSignal"], string> = {
  rapidly_improving: "Rapidly improving",
  steadily_improving: "Steadily improving",
  stable: "Stable",
};

const GROWTH_SIGNAL_COLORS: Record<PublicProfile["growthSignal"], string> = {
  rapidly_improving: "oklch(0.75 0.12 140)",
  steadily_improving: "oklch(0.72 0.18 290)",
  stable: "oklch(0.78 0.16 75)",
};

/* -------------------------------------------------------------------------- */
/* Tier bar visualization                                                      */
/* -------------------------------------------------------------------------- */

function TierBar({ currentTier }: { currentTier: Tier }) {
  const currentIdx = TIER_ORDER.indexOf(currentTier);

  return (
    <div className="w-full">
      <div className="flex gap-1 mb-2">
        {TIER_ORDER.map((tier, idx) => {
          const isActive = idx === currentIdx;
          const isPast = idx < currentIdx;

          return (
            <div key={tier} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-3 rounded-full transition-all"
                style={{
                  background: isActive
                    ? TIER_COLORS[tier]
                    : isPast
                    ? `${TIER_COLORS[tier].replace(")", " / 0.40)")}`
                    : "oklch(0.22 0.01 260)",
                }}
              />
              <span
                className="text-[11px] font-medium"
                style={{
                  color: isActive
                    ? TIER_COLORS[tier]
                    : "oklch(0.40 0.01 260)",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {tier}
              </span>
            </div>
          );
        })}
      </div>

      {/* Position indicator */}
      <div
        className="flex"
        style={{
          paddingLeft: `${(currentIdx / (TIER_ORDER.length - 1)) * 100 - 4}%`,
        }}
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path
            d="M6 0l6 8H0L6 0z"
            fill={TIER_COLORS[currentTier]}
          />
        </svg>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge SVG                                                                   */
/* -------------------------------------------------------------------------- */

function PublicBadgeIcon({ idx }: { idx: number }) {
  const hues = [290, 140, 75, 25, 200, 320, 60];
  const hue = hues[idx % hues.length];
  return (
    <svg width="40" height="46" viewBox="0 0 40 46" fill="none">
      <path
        d="M20 3L4 9v12c0 11 7 21 16 24 9-3 16-13 16-24V9L20 3z"
        fill={`oklch(0.72 0.18 ${hue} / 0.12)`}
        stroke={`oklch(0.72 0.18 ${hue})`}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M13 23l4.5 4.5 9-9"
        stroke={`oklch(0.72 0.18 ${hue})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Gated skills visualization                                                  */
/* -------------------------------------------------------------------------- */

const SKILL_CATEGORIES = [
  "Defense",
  "Ball Handling",
  "Court Awareness",
  "Shooting",
  "Athleticism",
  "Leadership",
  "Rebounding",
  "Passing",
];

function SkillsOverview({
  topSkills,
}: {
  topSkills: PublicProfile["topSkills"];
}) {
  return (
    <div className="relative">
      <div className="space-y-2.5 mb-2">
        {/* Top 2 skills — visible */}
        {topSkills.map((skill) => (
          <div key={skill.name}>
            <div className="flex justify-between items-center mb-1">
              <span
                className="text-[13px] font-semibold"
                style={{ color: "oklch(0.85 0.02 260)" }}
              >
                {skill.name}
              </span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background:
                    skill.tierLabel === "Elite"
                      ? "oklch(0.75 0.12 140 / 0.15)"
                      : "oklch(0.72 0.18 290 / 0.15)",
                  color:
                    skill.tierLabel === "Elite"
                      ? "oklch(0.75 0.12 140)"
                      : "oklch(0.72 0.18 290)",
                }}
              >
                {skill.tierLabel}
              </span>
            </div>
            <div
              className="w-full h-2.5 rounded-full overflow-hidden"
              style={{ background: "oklch(0.22 0.01 260)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${skill.score}%`,
                  background:
                    skill.tierLabel === "Elite"
                      ? "oklch(0.75 0.12 140)"
                      : "oklch(0.72 0.18 290)",
                }}
              />
            </div>
          </div>
        ))}

        {/* Remaining categories — gated */}
        {SKILL_CATEGORIES.slice(topSkills.length).map((cat) => (
          <div key={cat}>
            <div className="flex justify-between items-center mb-1">
              <span
                className="text-[13px]"
                style={{ color: "oklch(0.45 0.01 260)" }}
              >
                {cat}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.20 0.005 260)",
                  color: "oklch(0.40 0.01 260)",
                }}
              >
                Locked
              </span>
            </div>
            <div
              className="w-full h-2.5 rounded-full"
              style={{ background: "oklch(0.20 0.01 260)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${45 + Math.sin(cat.length) * 30}%`,
                  background: "oklch(0.25 0.01 260)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Gradient overlay + CTA */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 rounded-b-xl flex items-end justify-center pb-2"
        style={{
          background:
            "linear-gradient(to bottom, transparent, oklch(0.12 0.005 260 / 0.95))",
          pointerEvents: "none",
        }}
      />
      <div className="mt-1 text-center">
        <span
          className="text-[12px]"
          style={{ color: "oklch(0.55 0.02 260)" }}
        >
          Full scores require access request
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Growth signal arrow visualization                                           */
/* -------------------------------------------------------------------------- */

function GrowthArrow({ signal }: { signal: PublicProfile["growthSignal"] }) {
  const color = GROWTH_SIGNAL_COLORS[signal];
  const angle =
    signal === "rapidly_improving"
      ? -45
      : signal === "steadily_improving"
      ? -25
      : 0;

  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ transform: `rotate(${angle}deg)`, transition: "transform 0.3s" }}
    >
      <circle cx="24" cy="24" r="22" fill={`${color.replace(")", " / 0.10)")}`} />
      <path
        d="M14 28l10-10 10 10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 18v12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Input components                                                            */
/* -------------------------------------------------------------------------- */

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-[12px] font-semibold mb-1.5"
        style={{ color: "oklch(0.65 0.02 260)" }}
      >
        {label}
        {required && (
          <span className="ml-1" style={{ color: "oklch(0.68 0.22 25)" }}>
            *
          </span>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
        style={{
          background: "oklch(0.16 0.005 260)",
          border: "1px solid oklch(0.28 0.01 260)",
          color: "oklch(0.90 0.01 260)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function PublicRecruitingProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "jordan-mills-2027";
  const profile = PROFILES[slug] ?? DEFAULT_PROFILE;

  // Form state
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formInstitution, setFormInstitution] = useState("");
  const [formDivision, setFormDivision] = useState<Division | "">("");
  const [formAccessLevel, setFormAccessLevel] = useState<AccessLevel>(
    "full_profile"
  );
  const [formMessage, setFormMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const tierColor = TIER_COLORS[profile.overallTier];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formTitle || !formInstitution || !formDivision) {
      toast.error("Please fill out all required fields.");
      return;
    }
    setSubmitted(true);
    toast.success("Request sent. Jordan's family will be notified.");
  }

  const ACCESS_LEVELS: Array<{ value: AccessLevel; label: string; description: string }> = [
    {
      value: "profile_narrative",
      label: "Profile + Narrative",
      description: "Skill overview, coach narrative, coachability data",
    },
    {
      value: "full_profile",
      label: "Full Profile",
      description: "All assessment data, full skill history, IDP details",
    },
    {
      value: "full_profile_film",
      label: "Full Profile + Film",
      description: "Everything above, plus all coach-curated film clips",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.10 0.005 260)", color: "oklch(0.88 0.01 260)" }}
    >
      {/* ── Top nav ── */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          background: "oklch(0.10 0.005 260 / 0.92)",
          borderColor: "oklch(0.20 0.005 260)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 font-bold text-[16px] tracking-tight"
            style={{ color: "oklch(0.72 0.18 290)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="oklch(0.72 0.18 290)"
                strokeWidth="2"
                fill="oklch(0.72 0.18 290 / 0.12)"
              />
              <path
                d="M8 12l2.5 2.5L16 9"
                stroke="oklch(0.72 0.18 290)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            HoopsIQ
          </div>

          <Link href="/sign-in" asChild>
            <a
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: "oklch(0.72 0.18 290 / 0.12)",
                color: "oklch(0.72 0.18 290)",
                border: "1px solid oklch(0.72 0.18 290 / 0.25)",
              }}
            >
              College Coach? Sign in →
            </a>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        {/* ── Hero ── */}
        <section className="pt-12 pb-8 text-center">
          {/* Verified badge */}
          <div className="flex justify-center mb-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide"
              style={{
                background: "oklch(0.75 0.12 140 / 0.12)",
                border: "1px solid oklch(0.75 0.12 140 / 0.30)",
                color: "oklch(0.75 0.12 140)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.5L2 4v5c0 3.5 2.5 6.8 6 7.7 3.5-.9 6-4.2 6-7.7V4L8 1.5z"
                  fill="oklch(0.75 0.12 140 / 0.20)"
                  stroke="oklch(0.75 0.12 140)"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 8l1.8 1.8 3.2-3.2"
                  stroke="oklch(0.75 0.12 140)"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              HoopsIQ Verified
            </div>
          </div>

          {/* Name */}
          <h1
            className="font-bold leading-none mb-3"
            style={{ fontSize: "clamp(36px, 6vw, 52px)", color: "white" }}
          >
            {profile.playerName}
          </h1>

          {/* Position · Grad year · Height */}
          <div
            className="text-[15px] mb-4 flex items-center justify-center gap-2 flex-wrap"
            style={{ color: "oklch(0.60 0.02 260)" }}
          >
            <span>{profile.position}</span>
            <span style={{ color: "oklch(0.35 0.01 260)" }}>·</span>
            <span>Class of {profile.gradYear}</span>
            <span style={{ color: "oklch(0.35 0.01 260)" }}>·</span>
            <span>{profile.height}</span>
          </div>

          {/* Program + tier */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-5">
            <span
              className="text-[13px]"
              style={{ color: "oklch(0.60 0.02 260)" }}
            >
              {profile.programName}
            </span>
            <span
              className="text-[13px] px-3 py-1 rounded-full font-semibold"
              style={{
                background: `${tierColor.replace(")", " / 0.12)")}`,
                border: `1px solid ${tierColor.replace(")", " / 0.30)")}`,
                color: tierColor,
              }}
            >
              {profile.teamTier} Program
            </span>
          </div>

          {/* Overall tier pill */}
          <div className="flex justify-center">
            <div
              className="px-8 py-3 rounded-full font-black uppercase tracking-[0.12em] text-[15px]"
              style={{
                background: `${tierColor.replace(")", " / 0.15)")}`,
                border: `2px solid ${tierColor.replace(")", " / 0.40)")}`,
                color: tierColor,
                boxShadow: `0 0 24px ${tierColor.replace(")", " / 0.15)")}`,
              }}
            >
              {profile.overallTier} Athlete
            </div>
          </div>
        </section>

        {/* ── Verification strip ── */}
        <div
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl mb-8 text-center flex-wrap"
          style={{
            background: "oklch(0.14 0.005 260)",
            border: "1px solid oklch(0.22 0.01 260)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v7c0 5.25 3.83 10.15 9 11.36C17.17 24.15 21 19.25 21 14V7l-9-5z"
              fill="oklch(0.72 0.18 290 / 0.12)"
              stroke="oklch(0.72 0.18 290)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="oklch(0.72 0.18 290)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-[12px]"
            style={{ color: "oklch(0.60 0.02 260)" }}
          >
            Profile data sourced from{" "}
            <strong style={{ color: "oklch(0.75 0.02 260)" }}>
              {profile.assessmentCount} coach-recorded assessments
            </strong>{" "}
            ·{" "}
            <strong style={{ color: "oklch(0.75 0.02 260)" }}>
              {profile.badgeCount} verified badges
            </strong>{" "}
            ·{" "}
            <strong style={{ color: "oklch(0.75 0.02 260)" }}>
              {profile.filmSessionCount} film sessions
            </strong>{" "}
            · Data current as of {profile.lastUpdated}
          </span>
        </div>

        {/* ── Content grid ── */}
        <div className="space-y-6">
          {/* 1 — Development tier */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "oklch(0.13 0.005 260)",
              borderColor: "oklch(0.20 0.01 260)",
            }}
          >
            <h2
              className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-4"
              style={{ color: "oklch(0.55 0.02 260)" }}
            >
              Development Tier
            </h2>
            <TierBar currentTier={profile.overallTier} />
          </div>

          {/* 2 — Skills overview */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "oklch(0.13 0.005 260)",
              borderColor: "oklch(0.20 0.01 260)",
            }}
          >
            <h2
              className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-4"
              style={{ color: "oklch(0.55 0.02 260)" }}
            >
              Skills Overview
            </h2>
            <SkillsOverview topSkills={profile.topSkills} />
          </div>

          {/* 3 — Verified badges */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "oklch(0.13 0.005 260)",
              borderColor: "oklch(0.20 0.01 260)",
            }}
          >
            <h2
              className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-1"
              style={{ color: "oklch(0.55 0.02 260)" }}
            >
              Verified Badges
            </h2>
            <p
              className="text-[12px] mb-4"
              style={{ color: "oklch(0.45 0.01 260)" }}
            >
              Awarded by {profile.programName} · Details require access request
            </p>
            <div className="flex gap-4 flex-wrap">
              {profile.badges.map((badge, idx) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-1.5"
                >
                  <PublicBadgeIcon idx={idx} />
                  <span
                    className="text-[11px] text-center max-w-[72px] leading-tight font-medium"
                    style={{ color: "oklch(0.65 0.02 260)" }}
                  >
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4 — Growth signal */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "oklch(0.13 0.005 260)",
              borderColor: "oklch(0.20 0.01 260)",
            }}
          >
            <h2
              className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-4"
              style={{ color: "oklch(0.55 0.02 260)" }}
            >
              Development Trajectory
            </h2>
            <div className="flex items-center gap-5">
              <GrowthArrow signal={profile.growthSignal} />
              <div>
                <div
                  className="text-[20px] font-bold mb-1"
                  style={{ color: GROWTH_SIGNAL_COLORS[profile.growthSignal] }}
                >
                  {GROWTH_SIGNAL_LABELS[profile.growthSignal]}
                </div>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: "oklch(0.55 0.02 260)" }}
                >
                  {profile.playerName.split(" ")[0]} has been in the top
                  quartile of skill improvement among {profile.gradYear}{" "}
                  athletes in comparable programs over the last 6 months.
                </p>
              </div>
            </div>
          </div>

          {/* 5 — Coach narrative preview */}
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "oklch(0.13 0.005 260)",
              borderColor: "oklch(0.20 0.01 260)",
            }}
          >
            <h2
              className="text-[13px] uppercase tracking-[0.12em] font-semibold mb-4"
              style={{ color: "oklch(0.55 0.02 260)" }}
            >
              Coach Narrative
            </h2>
            {profile.showCoachNarrative && profile.coachNarrativePreview ? (
              <div className="relative">
                <p
                  className="text-[14px] leading-relaxed italic"
                  style={{ color: "oklch(0.75 0.02 260)" }}
                >
                  "{profile.coachNarrativePreview}..."
                </p>
                <div
                  className="mt-3 py-2 px-3 rounded-lg text-[12px] inline-flex items-center gap-2"
                  style={{
                    background: "oklch(0.17 0.005 260)",
                    color: "oklch(0.50 0.02 260)",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M7 11V7a5 5 0 0110 0v4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Full assessment requires access request
                </div>
              </div>
            ) : (
              <div
                className="text-[13px] italic"
                style={{ color: "oklch(0.45 0.01 260)" }}
              >
                [Coach narrative available with approved access]
              </div>
            )}
          </div>

          {/* 6 — Film package */}
          <div
            className="rounded-2xl border p-6 flex items-center gap-5"
            style={{
              background: "oklch(0.13 0.005 260)",
              borderColor: "oklch(0.20 0.01 260)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.72 0.18 290 / 0.12)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect
                  x="2"
                  y="5"
                  width="16"
                  height="14"
                  rx="2"
                  stroke="oklch(0.72 0.18 290)"
                  strokeWidth="1.5"
                  fill="oklch(0.72 0.18 290 / 0.10)"
                />
                <path
                  d="M18 9l4-2v10l-4-2V9z"
                  stroke="oklch(0.72 0.18 290)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fill="oklch(0.72 0.18 290 / 0.10)"
                />
              </svg>
            </div>
            <div>
              <div
                className="text-[16px] font-bold mb-1"
                style={{ color: "oklch(0.85 0.02 260)" }}
              >
                {profile.filmClipCount} coach-curated film clips available
              </div>
              <p
                className="text-[13px]"
                style={{ color: "oklch(0.50 0.01 260)" }}
              >
                Requesting access includes the full film package.
              </p>
            </div>
          </div>

          {/* 7 — Program context */}
          <div
            className="py-3 px-4 rounded-xl text-center text-[12px]"
            style={{
              background: "oklch(0.14 0.005 260)",
              color: "oklch(0.50 0.01 260)",
              border: "1px solid oklch(0.20 0.01 260)",
            }}
          >
            {profile.programName} · {profile.teamTier} ·{" "}
            {profile.programDescription}
          </div>
        </div>

        {/* ── Access Request CTA ── */}
        <section className="mt-12">
          <div
            className="rounded-3xl border p-8"
            style={{
              background: "oklch(0.13 0.005 260)",
              borderColor: `${tierColor.replace(")", " / 0.25)")}`,
              boxShadow: `0 0 40px ${tierColor.replace(")", " / 0.06)")}`,
            }}
          >
            <div className="text-center mb-8">
              <h2
                className="text-[28px] font-bold mb-2"
                style={{ color: "white" }}
              >
                Request Full Profile Access
              </h2>
              <p
                className="text-[15px] leading-relaxed max-w-lg mx-auto"
                style={{ color: "oklch(0.60 0.02 260)" }}
              >
                Access is granted by {profile.playerName}'s family individually.
                You'll receive a response within 1–2 business days.
              </p>
            </div>

            {/* What you'll receive */}
            <div
              className="rounded-2xl p-5 mb-8"
              style={{
                background: "oklch(0.11 0.005 260)",
                border: "1px solid oklch(0.20 0.01 260)",
              }}
            >
              <h3
                className="text-[12px] uppercase tracking-[0.12em] font-semibold mb-3"
                style={{ color: "oklch(0.55 0.02 260)" }}
              >
                With approval, you'll receive
              </h3>
              <ul className="space-y-2">
                {[
                  "Full skill assessment history (2+ years of data)",
                  "Trajectory charts showing growth rate vs. cohort",
                  "Coachability indicators — attendance, IDP completion, film engagement",
                  "Complete coach observations",
                  "Coach narrative (full text)",
                  `Film package (${profile.filmClipCount} clips across ${profile.filmSessionCount} sessions)`,
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[13px]"
                    style={{ color: "oklch(0.70 0.02 260)" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="shrink-0 mt-0.5"
                    >
                      <circle
                        cx="7"
                        cy="7"
                        r="6"
                        fill="oklch(0.75 0.12 140 / 0.15)"
                      />
                      <path
                        d="M4 7l2 2 4-4"
                        stroke="oklch(0.75 0.12 140)"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form */}
            {submitted ? (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "oklch(0.75 0.12 140 / 0.15)" }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="oklch(0.75 0.12 140)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div
                  className="text-[20px] font-bold mb-2"
                  style={{ color: "white" }}
                >
                  Request sent
                </div>
                <p
                  className="text-[14px]"
                  style={{ color: "oklch(0.60 0.02 260)" }}
                >
                  {profile.playerName}'s family will be notified. You'll hear
                  back within 1–2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Your name"
                    placeholder="e.g., Marcus Reid"
                    value={formName}
                    onChange={setFormName}
                    required
                  />
                  <FormInput
                    label="Title"
                    placeholder="e.g., Assistant Coach, Men's Basketball"
                    value={formTitle}
                    onChange={setFormTitle}
                    required
                  />
                </div>
                <FormInput
                  label="Institution"
                  placeholder="e.g., University of Portland"
                  value={formInstitution}
                  onChange={setFormInstitution}
                  required
                />

                {/* Division select */}
                <div>
                  <label
                    className="block text-[12px] font-semibold mb-1.5"
                    style={{ color: "oklch(0.65 0.02 260)" }}
                  >
                    Division{" "}
                    <span style={{ color: "oklch(0.68 0.22 25)" }}>*</span>
                  </label>
                  <select
                    value={formDivision}
                    onChange={(e) =>
                      setFormDivision(e.target.value as Division | "")
                    }
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                    style={{
                      background: "oklch(0.16 0.005 260)",
                      border: "1px solid oklch(0.28 0.01 260)",
                      color:
                        formDivision
                          ? "oklch(0.90 0.01 260)"
                          : "oklch(0.45 0.01 260)",
                    }}
                  >
                    <option value="">Select division</option>
                    {(["D1", "D2", "D3", "NAIA", "JUCO"] as Division[]).map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Access level radio */}
                <div>
                  <label
                    className="block text-[12px] font-semibold mb-2"
                    style={{ color: "oklch(0.65 0.02 260)" }}
                  >
                    Access level requested
                  </label>
                  <div className="space-y-2">
                    {ACCESS_LEVELS.map((al) => (
                      <button
                        type="button"
                        key={al.value}
                        onClick={() => setFormAccessLevel(al.value)}
                        className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all"
                        style={
                          formAccessLevel === al.value
                            ? {
                                background: `${tierColor.replace(
                                  ")",
                                  " / 0.10)"
                                )}`,
                                borderColor: `${tierColor.replace(
                                  ")",
                                  " / 0.35)"
                                )}`,
                              }
                            : {
                                background: "oklch(0.15 0.005 260)",
                                borderColor: "oklch(0.22 0.01 260)",
                              }
                        }
                      >
                        <div
                          className="w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center"
                          style={{
                            borderColor:
                              formAccessLevel === al.value
                                ? tierColor
                                : "oklch(0.35 0.01 260)",
                          }}
                        >
                          {formAccessLevel === al.value && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: tierColor }}
                            />
                          )}
                        </div>
                        <div>
                          <div
                            className="text-[13px] font-semibold"
                            style={{
                              color:
                                formAccessLevel === al.value
                                  ? tierColor
                                  : "oklch(0.80 0.02 260)",
                            }}
                          >
                            {al.label}
                          </div>
                          <div
                            className="text-[12px]"
                            style={{ color: "oklch(0.50 0.01 260)" }}
                          >
                            {al.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    className="block text-[12px] font-semibold mb-1.5"
                    style={{ color: "oklch(0.65 0.02 260)" }}
                  >
                    Message to family
                    <span
                      className="ml-2 font-normal"
                      style={{ color: "oklch(0.45 0.01 260)" }}
                    >
                      {formMessage.length}/300
                    </span>
                  </label>
                  <textarea
                    value={formMessage}
                    onChange={(e) =>
                      setFormMessage(e.target.value.slice(0, 300))
                    }
                    placeholder="Introduce yourself and explain why you're interested in Jordan..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                    style={{
                      background: "oklch(0.16 0.005 260)",
                      border: "1px solid oklch(0.28 0.01 260)",
                      color: "oklch(0.90 0.01 260)",
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 text-[15px] font-bold rounded-xl"
                  style={{
                    background: tierColor,
                    color:
                      profile.overallTier === "Elite" ||
                      profile.overallTier === "Advanced"
                        ? "white"
                        : "black",
                    height: "auto",
                  }}
                >
                  Send Access Request →
                </Button>

                <p
                  className="text-[11px] text-center"
                  style={{ color: "oklch(0.40 0.01 260)" }}
                >
                  Your request will be reviewed by {profile.playerName}'s
                  family. Access is never automatic.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="mt-16 border-t py-8"
        style={{
          borderColor: "oklch(0.18 0.005 260)",
          background: "oklch(0.09 0.005 260)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-2">
          <p
            className="text-[12px]"
            style={{ color: "oklch(0.42 0.01 260)" }}
          >
            Profile verified by HoopsIQ · Data sourced from{" "}
            {profile.programName}'s coaching staff · Last updated{" "}
            {profile.lastUpdated}
          </p>
          <p
            className="text-[12px]"
            style={{ color: "oklch(0.35 0.01 260)" }}
          >
            <span style={{ color: "oklch(0.55 0.02 260)", fontWeight: 600 }}>
              HoopsIQ
            </span>{" "}
            — Basketball Operations Platform ·{" "}
            <Link href="/privacy" asChild>
              <a style={{ color: "oklch(0.50 0.02 260)" }}>Privacy Policy</a>
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
