/**
 * DevelopmentResumePage — /app/player/resume
 *
 * The verified development resume — a formatted, printable document view.
 * Presents the player's full verified profile as a credibility artifact for
 * recruiting and family records.
 *
 * Print / Export PDF: calls window.print(). Add @media print CSS at the app
 * stylesheet level to hide the shell nav and show only the resume card.
 *
 * Demo player: rp_001 (Jordan Mills, SG, 2027)
 */

import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  recruitingPlayers,
  developmentBadges,
  getPlayerBadges,
  getPlayerFilmClips,
  getPlayerNarrative,
  getPlayerSynthesis,
  type RecruitingPlayer,
  type BadgeInstance,
} from "@/features/recruiting/mock";
import { CATEGORY_LABELS, type SkillCategory } from "@/features/skill-assessment/mock";

const DEMO_PLAYER_ID = "rp_001";

// ─── Skill category display order ─────────────────────────────────────────────

const SKILL_CATEGORIES: SkillCategory[] = [
  "ball_handling",
  "shooting",
  "finishing",
  "defense",
  "footwork",
  "iq_reads",
  "athleticism",
  "conditioning",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreBarColor(score: number): string {
  if (score >= 8.5) return "oklch(0.72 0.18 290)";
  if (score >= 7.0) return "oklch(0.75 0.12 140)";
  if (score >= 5.5) return "oklch(0.78 0.16 75)";
  return "oklch(0.68 0.22 25)";
}

function tierColor(tier: RecruitingPlayer["overallTier"]): string {
  const map: Record<RecruitingPlayer["overallTier"], string> = {
    Elite: "oklch(0.72 0.18 290)",
    Advanced: "oklch(0.75 0.12 140)",
    Developing: "oklch(0.78 0.16 75)",
    Emerging: "oklch(0.55 0.02 260)",
  };
  return map[tier];
}

function deltaSymbol(delta: number): string {
  if (delta > 0.1) return `↑ +${delta.toFixed(1)}`;
  if (delta < -0.1) return `↓ ${delta.toFixed(1)}`;
  return "→ Stable";
}

function deltaStyle(delta: number): { color: string } {
  if (delta > 0.1) return { color: "oklch(0.75 0.12 140)" };
  if (delta < -0.1) return { color: "oklch(0.68 0.22 25)" };
  return { color: "oklch(0.55 0.02 260)" };
}

// Extract 2–3 pull-quote sentences from a narrative body
function extractPullQuotes(body: string): string[] {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 160);
  return sentences.slice(0, 3);
}

// ─── Section heading ─────────────────────────────────────────────────────────

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--text-muted)]">{title}</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      {children}
    </section>
  );
}

// ─── Checkmark SVG ────────────────────────────────────────────────────────────

function CheckIcon({ size = 14, color = "oklch(0.75 0.12 140)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill={color} opacity="0.15" />
      <path d="M4.5 7l2 2 3.5-3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Lock Icon ────────────────────────────────────────────────────────────────

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="2" y="5.5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Skill Bar SVG ────────────────────────────────────────────────────────────

function SkillBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  const W = 160;
  const H = 10;
  const filled = (score / max) * W;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <rect x="0" y="1" width={W} height={H - 2} rx={4} fill="oklch(0.2 0 0 / 0.08)" />
      <rect x="0" y="1" width={filled} height={H - 2} rx={4} fill={color} />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DevelopmentResumePage() {
  const player = recruitingPlayers.find((p) => p.id === DEMO_PLAYER_ID)!;
  const playerBadges = getPlayerBadges(DEMO_PLAYER_ID);
  const playerClips = getPlayerFilmClips(DEMO_PLAYER_ID);
  const narrative = getPlayerNarrative(DEMO_PLAYER_ID);
  const synthesis = getPlayerSynthesis(DEMO_PLAYER_ID);

  const recruitingClips = playerClips.filter((c) => c.isInRecruitingPackage);
  const totalRuntime = recruitingClips.reduce((sum, c) => sum + c.durationSeconds, 0);
  const badgeLookup = Object.fromEntries(developmentBadges.map((b) => [b.id, b]));

  // Unique skill tags across all clips
  const clipSkillTags = Array.from(
    new Set(playerClips.flatMap((c) => c.skillTags))
  );

  const pullQuotes = narrative ? extractPullQuotes(narrative.body) : [];

  const topSkill = SKILL_CATEGORIES.reduce((best, cat) =>
    player.skillScores[cat] > player.skillScores[best] ? cat : best
  );

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader
          eyebrow="Verified by HoopsOS"
          title="Development Resume"
          subtitle="Your verified development record — assessments, film, badges, and coach observations"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.success("Share link copied to clipboard")}
                className="text-[13px] font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
              >
                Share
              </button>
              <button
                onClick={() => {
                  toast.success("Opening print dialog…");
                  window.print();
                }}
                className="text-[13px] font-medium px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: "oklch(0.72 0.18 290)" }}
              >
                Print / Export PDF
              </button>
            </div>
          }
        />

        {/* ── Resume Document ────────────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-[var(--border)] max-w-[800px] mx-auto p-8 sm:p-10 shadow-sm"
          style={{ color: "#111" }}
        >

          {/* ── 1. Header Block ───────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 mb-8 pb-8 border-b border-gray-100">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-gray-900 mb-1">{player.name}</h1>
              <p className="text-[15px] text-gray-500 mb-3">
                {player.position} · Class of {player.gradYear} · {player.height} · {player.wingspan} wingspan
              </p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span
                  className="text-[12px] font-semibold px-3 py-1 rounded-full"
                  style={{ color: tierColor(player.overallTier), backgroundColor: `${tierColor(player.overallTier)}15`, border: `1px solid ${tierColor(player.overallTier)}30` }}
                >
                  {player.overallTier}
                </span>
                <span className="text-[12px] text-gray-500">{player.programName} · {player.teamTier}</span>
              </div>
              {/* HoopsOS Verified badge */}
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold"
                  style={{ backgroundColor: "oklch(0.75 0.12 140 / 0.12)", color: "oklch(0.75 0.12 140)", border: "1px solid oklch(0.75 0.12 140 / 0.3)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 1L2 3v3.5c0 2.8 1.9 5 4 5.5 2.1-.5 4-2.7 4-5.5V3L6 1z" fill="oklch(0.75 0.12 140)" opacity="0.2" />
                    <path d="M4 6l1.5 1.5 3-3" stroke="oklch(0.75 0.12 140)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  HoopsOS Verified
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">hoopsos.app/recruiting/{player.profileSlug}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[12px] text-gray-400 mb-1.5">Last assessed</div>
              <div className="text-[13px] font-medium text-gray-700">{formatDate(player.lastAssessedAt)}</div>
              <div className="mt-3 space-y-1">
                <div className="text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-700">{player.assessmentCount}</span> assessments
                </div>
                <div className="text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-700">{player.filmClipCount}</span> film sessions
                </div>
                <div className="text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-700">2</span> seasons active
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Skills Profile ─────────────────────────────────────────── */}
          <ResumeSection title="Skills Profile">
            <p className="text-[11px] text-gray-400 mb-4">
              HoopsOS 8-category structured assessment · Last updated {formatDate(player.lastAssessedAt)}
            </p>
            <div className="space-y-3">
              {SKILL_CATEGORIES.map((cat) => {
                const score = player.skillScores[cat];
                const delta = player.skillDeltas[cat];
                const color = scoreBarColor(score);
                const isTop = cat === topSkill;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-gray-600 w-28 shrink-0">{CATEGORY_LABELS[cat]}</span>
                      <SkillBar score={score} color={color} />
                      <span className="text-[13px] font-bold w-8 text-right" style={{ color }}>{score.toFixed(1)}</span>
                      <span className="text-[11px] w-16" style={deltaStyle(delta)}>{deltaSymbol(delta)}</span>
                    </div>
                    {isTop && (
                      <p className="text-[10px] text-gray-400 ml-[7.5rem] mt-0.5">
                        Top 12% · SG / 17U cohort
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ResumeSection>

          {/* ── 3. Coachability Indicators ────────────────────────────────── */}
          <ResumeSection title="Coachability Indicators">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <p className="text-[22px] font-bold text-gray-900">{Math.round(player.attendanceRate * 100)}%</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Attendance Rate</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <p className="text-[22px] font-bold" style={{ color: player.idpOnTrack ? "oklch(0.75 0.12 140)" : "oklch(0.68 0.22 25)" }}>
                  {player.idpOnTrack ? "On Track" : "Behind"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">IDP Status</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <p className="text-[22px] font-bold text-gray-900">{player.filmClipCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Sessions Reviewed</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <p className="text-[22px] font-bold text-gray-900">{player.assessmentCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Assessments Completed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-[12px] text-gray-500 mb-0.5">Coachability Index</p>
                <p className="text-[11px] text-gray-400">Composite of attendance, IDP adherence, film engagement, and coach observations</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[28px] font-bold" style={{ color: "oklch(0.72 0.18 290)" }}>{player.coachabilityIndex.toFixed(1)}</p>
                <p className="text-[10px] text-gray-400">out of 10</p>
              </div>
            </div>
          </ResumeSection>

          {/* ── 4. Verified Milestones ────────────────────────────────────── */}
          <ResumeSection title="Verified Milestones">
            {playerBadges.length === 0 ? (
              <p className="text-[12px] text-gray-400">No badges earned yet.</p>
            ) : (
              <div className="space-y-2">
                {playerBadges.map((inst: BadgeInstance) => {
                  const badge = badgeLookup[inst.badgeId];
                  if (!badge) return null;
                  return (
                    <div key={inst.id} className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <CheckIcon />
                      </div>
                      <div>
                        <span className="text-[13px] font-semibold text-gray-800">{badge.name}</span>
                        <span className="text-[12px] text-gray-500 ml-2">
                          · Earned {formatShortDate(inst.awardedAt)} · Coach: {inst.awardedBy}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ResumeSection>

          {/* ── 5. Film Record ────────────────────────────────────────────── */}
          <ResumeSection title="Film Record">
            <div className="flex items-start gap-6 flex-wrap mb-4">
              <div>
                <p className="text-[22px] font-bold text-gray-900">{playerClips.length}</p>
                <p className="text-[11px] text-gray-500">Coach-annotated sessions</p>
              </div>
              <div>
                <p className="text-[22px] font-bold text-gray-900">{playerClips.filter((c) => c.skillTags.length > 0).length}</p>
                <p className="text-[11px] text-gray-500">Tagged clips</p>
              </div>
              <div>
                <p className="text-[22px] font-bold text-gray-900">{recruitingClips.length}</p>
                <p className="text-[11px] text-gray-500">In recruiting package</p>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-[11px] text-gray-500 mb-1.5">Top clip themes</p>
              <div className="flex flex-wrap gap-1.5">
                {clipSkillTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ color: "oklch(0.72 0.18 290)", backgroundColor: "oklch(0.72 0.18 290 / 0.1)", border: "1px solid oklch(0.72 0.18 290 / 0.2)" }}
                  >
                    {CATEGORY_LABELS[tag] ?? tag.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-gray-50">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "oklch(0.72 0.18 290 / 0.1)" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="oklch(0.72 0.18 290)" strokeWidth="1.3" />
                  <path d="M1.5 6.5h13M1.5 9.5h13" stroke="oklch(0.72 0.18 290)" strokeWidth="1" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-medium text-gray-700">Recruiter package</p>
                <p className="text-[11px] text-gray-400">{recruitingClips.length} clips · {formatDuration(totalRuntime)} total runtime</p>
              </div>
            </div>
          </ResumeSection>

          {/* ── 6. Coach Observations ─────────────────────────────────────── */}
          <ResumeSection title="Coach Observations">
            {narrative ? (
              <div>
                <p className="text-[11px] text-gray-400 mb-4">
                  Compiled by {narrative.authorName} · {narrative.authorRole} · {formatShortDate(narrative.updatedAt)}
                </p>
                <div className="space-y-3 mb-4">
                  {pullQuotes.map((quote, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 pl-4 py-1 text-[13px] text-gray-700 italic"
                      style={{ borderColor: "oklch(0.72 0.18 290 / 0.4)" }}
                    >
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400">
                  Compiled from {player.assessmentCount} sessions ·{" "}
                  <span className="text-gray-500">
                    <LockIcon /> +{Math.max(0, narrative.body.split(/[.!?]+/).length - 3)} additional observations · requires access request
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-[12px] text-gray-400">Coach narrative not yet submitted.</p>
            )}
          </ResumeSection>

          {/* ── 7. Development Plan ───────────────────────────────────────── */}
          <ResumeSection title="Development Plan">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-[11px] text-gray-500 mb-2">Current focus areas</p>
                <ul className="space-y-1">
                  <li className="text-[12px] text-gray-700 flex items-center gap-1.5">
                    <CheckIcon size={12} />
                    Shooting mechanics — off-movement
                  </li>
                  <li className="text-[12px] text-gray-700 flex items-center gap-1.5">
                    <CheckIcon size={12} />
                    Defensive closeout technique
                  </li>
                  <li className="text-[12px] text-gray-700 flex items-center gap-1.5">
                    <CheckIcon size={12} color="oklch(0.78 0.16 75)" />
                    IQ — blitz coverage reads
                  </li>
                </ul>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-[11px] text-gray-500 mb-1">IDP Status</p>
                <p
                  className="text-[15px] font-bold"
                  style={{ color: player.idpOnTrack ? "oklch(0.75 0.12 140)" : "oklch(0.68 0.22 25)" }}
                >
                  {player.idpOnTrack ? "On Track" : "Needs Attention"}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">2 of 3 goals met ahead of schedule</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-[11px] text-gray-500 mb-1">Plan cycles completed</p>
                <p className="text-[22px] font-bold text-gray-900">2</p>
                <p className="text-[11px] text-gray-400">Spring 2025 · Spring 2026</p>
              </div>
            </div>
          </ResumeSection>

          {/* ── 8. Verification Footer ────────────────────────────────────── */}
          <div className="pt-6 border-t border-gray-100 mt-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] text-gray-400">
                  Verified by <strong className="text-gray-600">HoopsOS</strong> on behalf of {player.programName}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Data period: Sep 2024 – {formatShortDate(player.lastAssessedAt)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Verification URL: hoopsos.app/verify/{player.profileSlug}
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: "oklch(0.75 0.12 140 / 0.08)", color: "oklch(0.75 0.12 140)", border: "1px solid oklch(0.75 0.12 140 / 0.25)" }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <path d="M5.5 1L2 2.7v3.2c0 2.6 1.8 4.8 3.5 5.1C7.2 10.7 9 8.5 9 5.9V2.7L5.5 1z" fill="oklch(0.75 0.12 140)" opacity="0.25" />
                  <path d="M3.5 5.5l1.5 1.5 3-3" stroke="oklch(0.75 0.12 140)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified Document
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
