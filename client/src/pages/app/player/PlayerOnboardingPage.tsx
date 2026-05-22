/**
 * PlayerOnboardingPage — 5-step Apple-style onboarding flow for new athletes.
 * Route: /app/player/onboarding
 *
 * Steps:
 *   1. Welcome          — animated welcome + VDV north star explanation
 *   2. Profile Setup    — name, position, grad year
 *   3. Goals            — pick 3 skills to focus on
 *   4. Connect Coach    — enter join code or invite coach
 *   5. Done             — confetti, CTA to dashboard
 *
 * Design rules:
 *   - OKLCH color system, CSS variables only
 *   - SVG-only illustrations (no external images)
 *   - No external chart/animation libraries
 *   - toast from sonner for interactions
 *   - Inline mock data only
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ChevronRight,
  Check,
  Target,
  TrendingUp,
  Shield,
  Star,
  Zap,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                        */
/* -------------------------------------------------------------------------- */

type Step = 1 | 2 | 3 | 4 | 5;

const SKILL_OPTIONS = [
  "Ball Handling",
  "Shooting",
  "Finishing",
  "Court Vision",
  "Defense",
  "Rebounding",
  "Screen Setting",
  "Off-Ball Movement",
];

const POSITIONS = ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];
const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029];

/* -------------------------------------------------------------------------- */
/* Step illustrations (SVG)                                                     */
/* -------------------------------------------------------------------------- */

function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-40 mx-auto" aria-hidden>
      {/* Court floor */}
      <ellipse cx="100" cy="130" rx="80" ry="18" fill="oklch(0.72 0.18 290 / 0.15)" />
      {/* Player silhouette */}
      <circle cx="100" cy="62" r="18" fill="oklch(0.72 0.18 290)" />
      <rect x="84" y="80" width="32" height="36" rx="8" fill="oklch(0.72 0.18 290)" />
      {/* Arms raised */}
      <line x1="84" y1="90" x2="64" y2="72" stroke="oklch(0.72 0.18 290)" strokeWidth="6" strokeLinecap="round" />
      <line x1="116" y1="90" x2="136" y2="72" stroke="oklch(0.72 0.18 290)" strokeWidth="6" strokeLinecap="round" />
      {/* Basketball */}
      <circle cx="136" cy="66" r="10" fill="oklch(0.78 0.16 75)" />
      <path d="M127 62 Q136 56 145 62" stroke="oklch(0.55 0.02 260)" strokeWidth="1.5" fill="none" />
      <path d="M127 70 Q136 76 145 70" stroke="oklch(0.55 0.02 260)" strokeWidth="1.5" fill="none" />
      <line x1="136" y1="56" x2="136" y2="76" stroke="oklch(0.55 0.02 260)" strokeWidth="1.5" />
      {/* Stars */}
      {[
        [40, 40], [160, 30], [170, 80], [30, 100],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="oklch(0.78 0.16 75 / 0.6)" />
      ))}
    </svg>
  );
}

function GoalsIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-44 h-36 mx-auto" aria-hidden>
      {/* Target rings */}
      <circle cx="100" cy="70" r="55" fill="none" stroke="oklch(0.72 0.18 290 / 0.2)" strokeWidth="2" />
      <circle cx="100" cy="70" r="40" fill="none" stroke="oklch(0.72 0.18 290 / 0.35)" strokeWidth="2" />
      <circle cx="100" cy="70" r="25" fill="none" stroke="oklch(0.72 0.18 290 / 0.55)" strokeWidth="2" />
      <circle cx="100" cy="70" r="12" fill="oklch(0.72 0.18 290)" />
      <circle cx="100" cy="70" r="4" fill="white" />
      {/* Arrow */}
      <line x1="150" y1="20" x2="108" y2="66" stroke="oklch(0.78 0.16 75)" strokeWidth="3" strokeLinecap="round" />
      <polygon points="104,58 112,58 108,68" fill="oklch(0.78 0.16 75)" />
    </svg>
  );
}

function ConnectIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-44 h-36 mx-auto" aria-hidden>
      {/* Coach */}
      <circle cx="60" cy="50" r="16" fill="oklch(0.75 0.12 140)" />
      <rect x="46" y="66" width="28" height="28" rx="6" fill="oklch(0.75 0.12 140)" />
      <text x="60" y="56" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">C</text>
      {/* Player */}
      <circle cx="140" cy="50" r="16" fill="oklch(0.72 0.18 290)" />
      <rect x="126" y="66" width="28" height="28" rx="6" fill="oklch(0.72 0.18 290)" />
      <text x="140" y="56" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">P</text>
      {/* Connection line */}
      <line x1="76" y1="55" x2="124" y2="55" stroke="oklch(0.78 0.16 75)" strokeWidth="2.5" strokeDasharray="5 3" />
      <circle cx="100" cy="55" r="5" fill="oklch(0.78 0.16 75)" />
      {/* Labels */}
      <text x="60" y="108" textAnchor="middle" fontSize="10" fill="oklch(0.55 0.02 260)">Coach</text>
      <text x="140" y="108" textAnchor="middle" fontSize="10" fill="oklch(0.55 0.02 260)">You</text>
    </svg>
  );
}

function DoneIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-40 mx-auto" aria-hidden>
      {/* Shield */}
      <path d="M100 20 L148 44 L148 88 Q148 124 100 140 Q52 124 52 88 L52 44 Z"
        fill="oklch(0.72 0.18 290 / 0.2)" stroke="oklch(0.72 0.18 290)" strokeWidth="2" />
      {/* Check */}
      <polyline points="76,84 94,102 126,70"
        fill="none" stroke="oklch(0.72 0.18 290)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Confetti dots */}
      {[
        [30,30,"oklch(0.78 0.16 75)"], [170,40,"oklch(0.72 0.18 290)"],
        [45,110,"oklch(0.75 0.12 140)"], [165,115,"oklch(0.78 0.16 75)"],
        [20,70,"oklch(0.68 0.22 25)"], [180,75,"oklch(0.75 0.12 140)"],
      ].map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r="5" fill={fill as string} />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Step components                                                              */
/* -------------------------------------------------------------------------- */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <WelcomeIllustration />
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome to HoopsIQ
        </h1>
        <p className="mt-2 text-base max-w-sm" style={{ color: "var(--text-muted)" }}>
          The only platform where your improvement is verified by your coach — and seen by college recruiters.
        </p>
      </div>

      {/* VDV explanation cards */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-3">
        {[
          { icon: <Target className="w-5 h-5" />, label: "Get Assessed", color: "oklch(0.72 0.18 290)" },
          { icon: <TrendingUp className="w-5 h-5" />, label: "Show Growth", color: "oklch(0.75 0.12 140)" },
          { icon: <Shield className="w-5 h-5" />, label: "Get Verified", color: "oklch(0.78 0.16 75)" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: item.color,
            }}
          >
            {item.icon}
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
        Your <strong>VDV (Verified Development Velocity)</strong> score shows recruiters real, coach-verified improvement — not just self-reported stats.
      </p>

      <button
        onClick={onNext}
        className="w-full max-w-sm py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
      >
        Get Started <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ProfileData {
  firstName: string;
  lastName: string;
  position: string;
  gradYear: number;
}

function StepProfile({ data, onChange, onNext, onBack }: {
  data: ProfileData;
  onChange: (d: ProfileData) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = data.firstName.trim() && data.lastName.trim() && data.position && data.gradYear;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "oklch(0.72 0.18 290 / 0.15)" }}>
          <Star className="w-6 h-6" style={{ color: "oklch(0.72 0.18 290)" }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Your Profile</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          This is what coaches and recruiters will see.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              First Name
            </label>
            <input
              type="text"
              value={data.firstName}
              onChange={e => onChange({ ...data, firstName: e.target.value })}
              placeholder="Marcus"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Last Name
            </label>
            <input
              type="text"
              value={data.lastName}
              onChange={e => onChange({ ...data, lastName: e.target.value })}
              placeholder="Johnson"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
            Position
          </label>
          <select
            value={data.position}
            onChange={e => onChange({ ...data, position: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">Select position…</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
            Graduation Year
          </label>
          <div className="flex gap-2 flex-wrap">
            {GRAD_YEARS.map(year => (
              <button
                key={year}
                onClick={() => onChange({ ...data, gradYear: year })}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{
                  background: data.gradYear === year ? "oklch(0.72 0.18 290)" : "var(--bg-surface)",
                  borderColor: data.gradYear === year ? "oklch(0.72 0.18 290)" : "var(--border)",
                  color: data.gradYear === year ? "white" : "var(--text-primary)",
                }}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border font-medium text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-[2] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
          style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepGoals({ selected, onToggle, onNext, onBack }: {
  selected: string[];
  onToggle: (skill: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <GoalsIllustration />
        <h2 className="text-2xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>Pick Your Focus Skills</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Choose up to 3 skills you want to develop most this season.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SKILL_OPTIONS.map(skill => {
          const active = selected.includes(skill);
          const disabled = !active && selected.length >= 3;
          return (
            <button
              key={skill}
              onClick={() => !disabled && onToggle(skill)}
              disabled={disabled}
              className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all disabled:opacity-40"
              style={{
                background: active ? "oklch(0.72 0.18 290 / 0.12)" : "var(--bg-surface)",
                borderColor: active ? "oklch(0.72 0.18 290)" : "var(--border)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: active ? "oklch(0.72 0.18 290)" : "var(--border)",
                  background: active ? "oklch(0.72 0.18 290)" : "transparent",
                }}
              >
                {active && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{skill}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
        {selected.length}/3 selected. Your coach will see these as your priorities.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border font-medium text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className="flex-[2] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
          style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StepConnect({ onNext, onSkip, onBack }: {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!code.trim()) return;
    setSubmitted(true);
    toast.success("Team code submitted! Your coach will confirm your account.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <ConnectIllustration />
        <h2 className="text-2xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>Connect to Your Team</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Enter your team code to link with your coach. They'll verify your assessments and unlock your VDV score.
        </p>
      </div>

      <div
        className="p-4 rounded-xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          Team Join Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ELITE24"
            maxLength={10}
            className="flex-1 px-3 py-2.5 rounded-lg border text-sm font-mono outline-none"
            style={{
              background: "var(--bg-base)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!code.trim() || submitted}
            className="px-4 py-2.5 rounded-lg font-medium text-sm transition-opacity disabled:opacity-40"
            style={{ background: "oklch(0.75 0.12 140)", color: "white" }}
          >
            {submitted ? <Check className="w-4 h-4" /> : "Join"}
          </button>
        </div>
        {submitted && (
          <p className="text-xs mt-2" style={{ color: "oklch(0.75 0.12 140)" }}>
            Request sent! Your coach will approve within 24 hours.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border font-medium text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          Back
        </button>
        <button
          onClick={submitted ? onNext : onSkip}
          className="flex-[2] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: submitted ? "oklch(0.72 0.18 290)" : "var(--bg-surface)",
            color: submitted ? "white" : "var(--text-muted)",
            borderWidth: submitted ? 0 : 1,
            borderColor: "var(--border)",
          }}
        >
          {submitted ? <>Continue <ChevronRight className="w-4 h-4" /></> : "Skip for now"}
        </button>
      </div>
    </div>
  );
}

function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <DoneIllustration />
      <div>
        <h2 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>You're Ready.</h2>
        <p className="text-base mt-2 max-w-sm" style={{ color: "var(--text-muted)" }}>
          Your profile is set up. Once your coach runs your first assessment, your VDV score will activate.
        </p>
      </div>

      <div className="w-full max-w-sm grid grid-cols-1 gap-3">
        {[
          { icon: <Zap className="w-4 h-4" />, text: "Your coach can now assess your skills" },
          { icon: <Shield className="w-4 h-4" />, text: "VDV verification starts after 2 cycles" },
          { icon: <Star className="w-4 h-4" />, text: "Recruiters can discover you once verified" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border text-left"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.72 0.18 290 / 0.15)", color: "oklch(0.72 0.18 290)" }}>
              {item.icon}
            </div>
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onFinish}
        className="w-full max-w-sm py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
      >
        Go to My Dashboard <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress indicator                                                           */
/* -------------------------------------------------------------------------- */

function ProgressDots({ step, total }: { step: Step; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const n = (i + 1) as Step;
        return (
          <div
            key={n}
            className="rounded-full transition-all"
            style={{
              width: n === step ? 24 : 8,
              height: 8,
              background: n <= step ? "oklch(0.72 0.18 290)" : "var(--border)",
            }}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function PlayerOnboardingPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);

  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    position: "",
    gradYear: 0,
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }

  function finish() {
    toast.success("Welcome to HoopsIQ! Your profile is ready.");
    navigate("/app/player");
  }

  const totalSteps = 5;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="text-sm font-semibold" style={{ color: "oklch(0.72 0.18 290)" }}>
          HoopsIQ
        </div>
        {step < 5 && (
          <button
            onClick={finish}
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Skip all
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="px-6 pb-6">
        <ProgressDots step={step} total={totalSteps} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
        {step === 2 && (
          <StepProfile
            data={profile}
            onChange={setProfile}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepGoals
            selected={selectedSkills}
            onToggle={toggleSkill}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepConnect
            onNext={() => setStep(5)}
            onSkip={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && <StepDone onFinish={finish} />}
      </div>
    </div>
  );
}
