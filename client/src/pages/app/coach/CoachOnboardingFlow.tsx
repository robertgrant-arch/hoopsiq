/**
 * CoachOnboardingFlow — 5-step onboarding for new coaches.
 * Route: /app/coach/onboarding
 *
 * Steps:
 *   1. Welcome       — what HoopsIQ does for coaches
 *   2. Profile       — name, title, coaching philosophy
 *   3. First Players — quick add up to 5 players (name + position)
 *   4. First Assess  — run a quick 3-skill assessment on player 1
 *   5. Done          — VDV explained, CTA to dashboard
 *
 * Design rules:
 *   - OKLCH color system, CSS variables only
 *   - SVG-only illustrations
 *   - No external libraries
 *   - toast from sonner for interactions
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ChevronRight,
  Plus,
  X,
  Check,
  Users,
  ClipboardCheck,
  TrendingUp,
  Shield,
  Star,
  GraduationCap,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types & config                                                               */
/* -------------------------------------------------------------------------- */

type Step = 1 | 2 | 3 | 4 | 5;

const TITLES = [
  "Head Coach",
  "Assistant Coach",
  "Skills Trainer",
  "Program Director",
  "Youth Coach",
];

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

const QUICK_SKILLS = ["Ball Handling", "Shooting", "Defense"] as const;
type QuickSkill = typeof QUICK_SKILLS[number];

interface RosterEntry {
  name: string;
  position: string;
}

interface CoachProfile {
  firstName: string;
  lastName: string;
  title: string;
  philosophy: string;
}

/* -------------------------------------------------------------------------- */
/* SVG Illustrations                                                            */
/* -------------------------------------------------------------------------- */

function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-44 h-36 mx-auto" aria-hidden>
      {/* Clipboard */}
      <rect x="55" y="20" width="90" height="100" rx="8" fill="var(--bg-surface)" stroke="oklch(0.72 0.18 290)" strokeWidth="2" />
      <rect x="75" y="12" width="50" height="16" rx="6" fill="oklch(0.72 0.18 290)" />
      {/* Lines */}
      {[44, 60, 76, 92, 108].map((y, i) => (
        <rect key={i} x="68" y={y} width={i === 0 ? 64 : i < 3 ? 56 : 40} height="6" rx="3"
          fill={i === 0 ? "oklch(0.72 0.18 290 / 0.5)" : "var(--border)"} />
      ))}
      {/* Check marks */}
      {[60, 76, 92].map((y, i) => (
        <circle key={i} cx="62" cy={y + 3} r="5" fill="oklch(0.75 0.12 140 / 0.8)" />
      ))}
      {[60, 76, 92].map((y, i) => (
        <polyline key={i} points={`59,${y+3} 61,${y+5} 65,${y+1}`}
          fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {/* Shield badge */}
      <path d="M152 80 L170 90 L170 110 Q170 125 161 130 Q152 125 152 110 Z"
        fill="oklch(0.78 0.16 75 / 0.3)" stroke="oklch(0.78 0.16 75)" strokeWidth="1.5" />
      <text x="161" y="108" textAnchor="middle" fontSize="11" fill="oklch(0.78 0.16 75)" fontWeight="bold">VDV</text>
    </svg>
  );
}

function RosterIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-44 h-28 mx-auto" aria-hidden>
      {[
        [30, 60, "oklch(0.72 0.18 290)"],
        [80, 60, "oklch(0.75 0.12 140)"],
        [130, 60, "oklch(0.78 0.16 75)"],
        [180, 60, "oklch(0.68 0.22 25)"],
      ].map(([cx, cy, fill], i) => (
        <g key={i}>
          <circle cx={cx as number} cy={cy as number} r="18" fill={fill as string} opacity="0.9" />
          <text x={cx as number} y={(cy as number) + 5} textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
            {["P", "P", "P", "P"][i]}
          </text>
          <rect x={(cx as number) - 20} y={(cy as number) + 22} width="40" height="8" rx="4" fill={fill as string} opacity="0.3" />
        </g>
      ))}
      <text x="100" y="112" textAnchor="middle" fontSize="10" fill="oklch(0.55 0.02 260)">Your Roster</text>
    </svg>
  );
}

function AssessIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-44 h-28 mx-auto" aria-hidden>
      {/* Score bars */}
      {[
        { label: "Ball Handling", score: 7, x: 20 },
        { label: "Shooting", score: 5, x: 80 },
        { label: "Defense", score: 6, x: 140 },
      ].map(({ label, score, x }) => (
        <g key={label}>
          {/* Background bar */}
          <rect x={x} y="20" width="40" height="80" rx="6" fill="var(--border)" opacity="0.4" />
          {/* Filled bar */}
          <rect
            x={x}
            y={20 + 80 - (score / 10) * 80}
            width="40"
            height={(score / 10) * 80}
            rx="6"
            fill="oklch(0.72 0.18 290)"
            opacity="0.85"
          />
          <text x={x + 20} y={15} textAnchor="middle" fontSize="9" fill="oklch(0.55 0.02 260)">
            {label.split(" ")[0]}
          </text>
          <text x={x + 20} y={108} textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--text-primary)">
            {score}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DoneIllustration() {
  return (
    <svg viewBox="0 0 200 150" className="w-44 h-36 mx-auto" aria-hidden>
      <path d="M100 15 L148 40 L148 90 Q148 128 100 145 Q52 128 52 90 L52 40 Z"
        fill="oklch(0.72 0.18 290 / 0.15)" stroke="oklch(0.72 0.18 290)" strokeWidth="2" />
      <polyline points="76,82 94,100 124,68"
        fill="none" stroke="oklch(0.72 0.18 290)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="100" y="128" textAnchor="middle" fontSize="10" fontWeight="bold" fill="oklch(0.72 0.18 290)">VDV VERIFIED</text>
      {[
        [28,28,"oklch(0.78 0.16 75)"], [172,35,"oklch(0.72 0.18 290)"],
        [42,115,"oklch(0.75 0.12 140)"], [162,110,"oklch(0.78 0.16 75)"],
      ].map(([cx, cy, fill], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r="5" fill={fill as string} />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress dots                                                                */
/* -------------------------------------------------------------------------- */

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        return (
          <div
            key={n}
            className="rounded-full transition-all"
            style={{
              width: n === step ? 24 : 8,
              height: 8,
              background: n <= step ? "oklch(0.75 0.12 140)" : "var(--border)",
            }}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step: Welcome                                                                */
/* -------------------------------------------------------------------------- */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <WelcomeIllustration />
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome, Coach.
        </h1>
        <p className="mt-2 text-base max-w-sm" style={{ color: "var(--text-muted)" }}>
          HoopsIQ turns your coaching observations into verified player development records — trusted by recruiters.
        </p>
      </div>

      <div className="w-full max-w-sm grid grid-cols-1 gap-3">
        {[
          { icon: <ClipboardCheck className="w-5 h-5" />, title: "Assess", body: "Rate 8 skills in under 4 minutes" },
          { icon: <TrendingUp className="w-5 h-5" />, title: "Verify", body: "2 cycles = VDV verified player" },
          { icon: <Shield className="w-5 h-5" />, title: "Impact", body: "Your record follows your players to recruiters" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border text-left"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.75 0.12 140 / 0.15)", color: "oklch(0.75 0.12 140)" }}
            >
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.body}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full max-w-sm py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90"
        style={{ background: "oklch(0.75 0.12 140)", color: "white" }}
      >
        Set Up My Account <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step: Profile                                                                */
/* -------------------------------------------------------------------------- */

function StepProfile({ data, onChange, onNext, onBack }: {
  data: CoachProfile;
  onChange: (d: CoachProfile) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = data.firstName.trim() && data.lastName.trim() && data.title;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: "oklch(0.75 0.12 140 / 0.15)" }}
        >
          <GraduationCap className="w-6 h-6" style={{ color: "oklch(0.75 0.12 140)" }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Your Coaching Profile</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          This is your public professional identity on HoopsIQ.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>First Name</label>
            <input
              type="text"
              value={data.firstName}
              onChange={e => onChange({ ...data, firstName: e.target.value })}
              placeholder="Alex"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Last Name</label>
            <input
              type="text"
              value={data.lastName}
              onChange={e => onChange({ ...data, lastName: e.target.value })}
              placeholder="Rivera"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Title</label>
          <div className="flex flex-wrap gap-2">
            {TITLES.map(t => (
              <button
                key={t}
                onClick={() => onChange({ ...data, title: t })}
                className="px-3 py-1.5 rounded-lg border text-sm transition-all"
                style={{
                  background: data.title === t ? "oklch(0.75 0.12 140)" : "var(--bg-surface)",
                  borderColor: data.title === t ? "oklch(0.75 0.12 140)" : "var(--border)",
                  color: data.title === t ? "white" : "var(--text-primary)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
            Coaching Philosophy <span style={{ color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <textarea
            value={data.philosophy}
            onChange={e => onChange({ ...data, philosophy: e.target.value })}
            placeholder="I believe every player has a ceiling they haven't touched yet…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Shown on your verified coach profile. Parents and recruiters read this.
          </p>
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
          className="flex-[2] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: "oklch(0.75 0.12 140)", color: "white" }}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step: First players                                                          */
/* -------------------------------------------------------------------------- */

function StepRoster({ players, onChange, onNext, onSkip, onBack }: {
  players: RosterEntry[];
  onChange: (p: RosterEntry[]) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  function addPlayer() {
    if (players.length >= 5) return;
    onChange([...players, { name: "", position: "PG" }]);
  }

  function updatePlayer(i: number, field: keyof RosterEntry, value: string) {
    const updated = players.map((p, idx) => idx === i ? { ...p, [field]: value } : p);
    onChange(updated);
  }

  function removePlayer(i: number) {
    onChange(players.filter((_, idx) => idx !== i));
  }

  const hasValidPlayers = players.some(p => p.name.trim());

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <RosterIllustration />
        <h2 className="text-2xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>Add Your First Players</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Add up to 5 players now. You can import your full roster after setup.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {players.map((player, i) => (
          <div
            key={i}
            className="flex gap-2 items-center p-3 rounded-xl border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "oklch(0.75 0.12 140 / 0.2)", color: "oklch(0.75 0.12 140)" }}
            >
              {i + 1}
            </div>
            <input
              type="text"
              value={player.name}
              onChange={e => updatePlayer(i, "name", e.target.value)}
              placeholder="Player name"
              className="flex-1 px-2 py-1 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--bg-base)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <select
              value={player.position}
              onChange={e => updatePlayer(i, "position", e.target.value)}
              className="px-2 py-1 rounded-lg border text-sm outline-none w-16"
              style={{
                background: "var(--bg-base)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => removePlayer(i)} className="p-1 rounded" style={{ color: "var(--text-muted)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {players.length < 5 && (
          <button
            onClick={addPlayer}
            className="flex items-center gap-2 p-3 rounded-xl border border-dashed text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <Plus className="w-4 h-4" />
            Add player ({players.length}/5)
          </button>
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
          onClick={hasValidPlayers ? onNext : onSkip}
          className="flex-[2] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: hasValidPlayers ? "oklch(0.75 0.12 140)" : "var(--bg-surface)",
            color: hasValidPlayers ? "white" : "var(--text-muted)",
            borderWidth: hasValidPlayers ? 0 : 1,
            borderColor: "var(--border)",
          }}
        >
          {hasValidPlayers ? <><Users className="w-4 h-4" /> Continue</> : "Skip for now"}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step: First assess                                                           */
/* -------------------------------------------------------------------------- */

function StepAssess({ playerName, onNext, onSkip, onBack }: {
  playerName: string;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [scores, setScores] = useState<Record<QuickSkill, number>>({
    "Ball Handling": 5,
    "Shooting": 5,
    "Defense": 5,
  });
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  function saveAssessment() {
    setSaved(true);
    toast.success(`Assessment saved for ${playerName || "Player 1"}!`);
    setTimeout(onNext, 800);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <AssessIllustration />
        <h2 className="text-2xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>
          Quick Assessment
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Rate {playerName || "your first player"} on 3 skills. This starts their VDV clock.
        </p>
      </div>

      <div
        className="p-4 rounded-xl border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-5">
          {QUICK_SKILLS.map(skill => (
            <div key={skill}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{skill}</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: "oklch(0.75 0.12 140)" }}
                >
                  {scores[skill]}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const val = i + 1;
                  const active = val <= scores[skill];
                  return (
                    <button
                      key={val}
                      onClick={() => setScores(prev => ({ ...prev, [skill]: val }))}
                      className="flex-1 h-8 rounded transition-all"
                      style={{
                        background: active ? "oklch(0.75 0.12 140)" : "var(--border)",
                        opacity: active ? 1 : 0.5,
                      }}
                      aria-label={`${skill} score ${val}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
          Observation note <span style={{ color: "var(--text-muted)" }}>(optional, but helps VDV quality)</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Describe specifically what you saw. E.g., 'Left-hand finish off drive was automatic — 3 out of 4 reps in live 5-on-5.'"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
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
          onClick={saveAssessment}
          disabled={saved}
          className="flex-[2] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: saved ? "oklch(0.75 0.12 140 / 0.7)" : "oklch(0.75 0.12 140)", color: "white" }}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><ClipboardCheck className="w-4 h-4" /> Save Assessment</>}
        </button>
      </div>

      <button
        onClick={onSkip}
        className="text-sm text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Skip — I'll assess later
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step: Done                                                                   */
/* -------------------------------------------------------------------------- */

function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <DoneIllustration />
      <div>
        <h2 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>You're Set Up.</h2>
        <p className="text-base mt-2 max-w-sm" style={{ color: "var(--text-muted)" }}>
          Complete one more assessment cycle within 90 days and your players get VDV verified. That's when recruiters take notice.
        </p>
      </div>

      <div className="w-full max-w-sm grid grid-cols-1 gap-3">
        {[
          { icon: <ClipboardCheck className="w-4 h-4" />, text: "2 cycles in 90 days = VDV verified player", color: "oklch(0.72 0.18 290)" },
          { icon: <Star className="w-4 h-4" />, text: "Your career record builds with every assessment", color: "oklch(0.78 0.16 75)" },
          { icon: <Shield className="w-4 h-4" />, text: "Verified data is trusted by college programs", color: "oklch(0.75 0.12 140)" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border text-left"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color.replace(")", " / 0.15)")}`, color: item.color }}
            >
              {item.icon}
            </div>
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onFinish}
        className="w-full max-w-sm py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90"
        style={{ background: "oklch(0.75 0.12 140)", color: "white" }}
      >
        Go to Coach Dashboard <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                    */
/* -------------------------------------------------------------------------- */

export default function CoachOnboardingFlow() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);

  const [profile, setProfile] = useState<CoachProfile>({
    firstName: "",
    lastName: "",
    title: "",
    philosophy: "",
  });

  const [players, setPlayers] = useState<RosterEntry[]>([
    { name: "", position: "PG" },
  ]);

  function finish() {
    toast.success("Welcome to HoopsIQ! Let's start developing players.");
    navigate("/app/coach");
  }

  const firstPlayerName = players.find(p => p.name.trim())?.name ?? "";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="text-sm font-semibold" style={{ color: "oklch(0.75 0.12 140)" }}>
          HoopsIQ
        </div>
        {step < 5 && (
          <button onClick={finish} className="text-sm" style={{ color: "var(--text-muted)" }}>
            Skip all
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="px-6 pb-6">
        <ProgressDots step={step} total={5} />
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
          <StepRoster
            players={players}
            onChange={setPlayers}
            onNext={() => setStep(4)}
            onSkip={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepAssess
            playerName={firstPlayerName}
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
