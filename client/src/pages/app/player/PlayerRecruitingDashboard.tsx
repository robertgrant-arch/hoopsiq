/**
 * PlayerRecruitingDashboard — /app/player/recruiting
 *
 * The player's hub for their recruiting presence. Shows everything a recruiter
 * can see plus controls for access requests, film package, and exports.
 * Demo player: rp_001 (Jordan Mills, SG, 2027)
 */

import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  recruitingPlayers,
  accessLog,
  developmentBadges,
  recruitingExports as allRecruitingExports,
  getPlayerAccessRequests,
  getPlayerBadges,
  getPlayerFilmClips,
  type AccessRequest,
  type BadgeInstance,
  type FilmClip,
  type RecruitingExport,
} from "@/features/recruiting/mock";

const DEMO_PLAYER_ID = "rp_001";

// ─── SVG Badge Icons ──────────────────────────────────────────────────────────

function BadgeIcon({ iconKey, size = 20, color = "currentColor" }: {
  iconKey: string;
  size?: number;
  color?: string;
}) {
  switch (iconKey) {
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2L3 5v5c0 4.4 3 8 7 9 4-1 7-4.6 7-9V5l-7-3z" fill={color} opacity="0.85" />
          <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "star":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2l2.4 5 5.6.8-4 3.8.9 5.4L10 14.5l-4.9 2.5.9-5.4L2 7.8l5.6-.8L10 2z" fill={color} />
        </svg>
      );
    case "flame":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M11.5 2C11.5 6 14 7.5 14 10.5c0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1.5.8-2.8 2-3.5-.3 1 .2 2.2 1.2 2.7C9.4 8 9.7 5.5 11.5 2z" fill={color} />
          <path d="M10 17c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" fill={color} opacity="0.7" />
        </svg>
      );
    case "target":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.5" />
          <circle cx="10" cy="10" r="5" stroke={color} strokeWidth="1.5" />
          <circle cx="10" cy="10" r="2" fill={color} />
        </svg>
      );
    case "clock":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.5" />
          <path d="M10 6v4l2.5 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8" cy="7" r="3" stroke={color} strokeWidth="1.5" />
          <path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="14" cy="6" r="2" stroke={color} strokeWidth="1.2" />
          <path d="M16 15c0-2.2-1-4-2.5-5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "trophy":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 3h10v6a5 5 0 01-10 0V3z" stroke={color} strokeWidth="1.5" />
          <path d="M5 6H3a2 2 0 000 4h2M15 6h2a2 2 0 010 4h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 14v3M7 17h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "film":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="4" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5" />
          <path d="M2 8h16M2 12h16" stroke={color} strokeWidth="1" />
          <rect x="5" y="5" width="2" height="2" fill={color} opacity="0.5" />
          <rect x="9" y="5" width="2" height="2" fill={color} opacity="0.5" />
          <rect x="13" y="5" width="2" height="2" fill={color} opacity="0.5" />
          <rect x="5" y="13" width="2" height="2" fill={color} opacity="0.5" />
          <rect x="9" y="13" width="2" height="2" fill={color} opacity="0.5" />
          <rect x="13" y="13" width="2" height="2" fill={color} opacity="0.5" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.5" />
        </svg>
      );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  return formatDate(iso);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function schoolInitials(school: string): string {
  return school
    .split(" ")
    .filter((w) => !["of", "the", "at"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function divisionColor(tier: string): string {
  if (tier === "D1") return "oklch(0.72 0.18 290)";
  if (tier === "D2") return "oklch(0.75 0.12 140)";
  if (tier === "D3") return "oklch(0.78 0.16 75)";
  return "oklch(0.55 0.02 260)";
}

const SCHOOL_COLORS: Record<string, string> = {
  "University of Vermont": "oklch(0.75 0.12 140)",
  "Seton Hall University": "oklch(0.72 0.18 290)",
  "Monmouth University": "oklch(0.78 0.16 75)",
  "Rider University": "oklch(0.68 0.22 25)",
  "Stockton University": "oklch(0.55 0.02 260)",
};

function schoolColor(name: string): string {
  return SCHOOL_COLORS[name] ?? "oklch(0.55 0.02 260)";
}

// ─── Profile Completeness ─────────────────────────────────────────────────────

function computeCompleteness(player: (typeof recruitingPlayers)[0], badgeCount: number, filmCount: number, hasNarrative: boolean): { score: number; missing: string[] } {
  const missing: string[] = [];
  let score = 0;

  if (player.assessmentCount >= 3) score += 30; else missing.push("Complete 3+ assessments");
  if (filmCount >= 5) score += 25; else if (filmCount >= 1) { score += 12; missing.push("Add more film clips (5+ recommended)"); } else missing.push("Add film clips");
  if (hasNarrative) score += 20; else missing.push("Coach narrative pending");
  if (badgeCount >= 3) score += 15; else if (badgeCount >= 1) { score += 8; missing.push("Earn more development badges"); } else missing.push("Earn development badges");
  if (player.isPublic) score += 10; else missing.push("Set profile to public to be found by recruiters");

  return { score: Math.min(score, 100), missing };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 ${className}`}>
      <h2 className="text-[13px] uppercase tracking-[0.1em] font-semibold text-[var(--text-muted)] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function StatusChip({ status }: { status: RecruitingExport["status"] }) {
  const map: Record<RecruitingExport["status"], { label: string; color: string }> = {
    draft: { label: "Draft", color: "oklch(0.55 0.02 260)" },
    pending_approval: { label: "Pending Approval", color: "oklch(0.78 0.16 75)" },
    approved: { label: "Approved", color: "oklch(0.75 0.12 140)" },
    shared: { label: "Shared", color: "oklch(0.72 0.18 290)" },
  };
  const { label, color } = map[status];
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: `${color}50`, backgroundColor: `${color}15` }}
    >
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlayerRecruitingDashboard() {
  const player = recruitingPlayers.find((p) => p.id === DEMO_PLAYER_ID)!;
  const playerBadges = getPlayerBadges(DEMO_PLAYER_ID);
  const playerClips = getPlayerFilmClips(DEMO_PLAYER_ID);
  const playerRequests = getPlayerAccessRequests(DEMO_PLAYER_ID);
  const playerExports = allRecruitingExports.filter((e) => e.playerId === DEMO_PLAYER_ID);
  const playerLog = accessLog.filter((l) => l.playerId === DEMO_PLAYER_ID);

  const hasNarrative = true; // Jordan has an approved narrative
  const { score: completeness, missing: missingItems } = computeCompleteness(player, playerBadges.length, playerClips.length, hasNarrative);

  const pendingRequests = playerRequests.filter((r) => r.status === "pending");
  const approvedRequests = playerRequests.filter((r) => r.status === "approved");

  const [requestStatuses, setRequestStatuses] = useState<Record<string, AccessRequest["status"]>>(
    Object.fromEntries(playerRequests.map((r) => [r.id, r.status]))
  );

  const [clipPackageState, setClipPackageState] = useState<Record<string, boolean>>(
    Object.fromEntries(playerClips.map((c) => [c.id, c.isInRecruitingPackage]))
  );

  const completenessColor =
    completeness >= 70
      ? "oklch(0.72 0.18 290)"
      : completeness >= 40
      ? "oklch(0.78 0.16 75)"
      : "oklch(0.68 0.22 25)";

  function handleApprove(requestId: string) {
    setRequestStatuses((prev) => ({ ...prev, [requestId]: "approved" }));
    const req = playerRequests.find((r) => r.id === requestId);
    toast.success(`Access approved for ${req?.requesterSchool}`);
  }

  function handleDeny(requestId: string) {
    setRequestStatuses((prev) => ({ ...prev, [requestId]: "denied" }));
    const req = playerRequests.find((r) => r.id === requestId);
    toast.success(`Access request from ${req?.requesterSchool} denied`);
  }

  function handleClipToggle(clipId: string) {
    const next = !clipPackageState[clipId];
    setClipPackageState((prev) => ({ ...prev, [clipId]: next }));
    const clip = playerClips.find((c) => c.id === clipId);
    toast.success(next ? `"${clip?.title}" added to recruiting package` : `"${clip?.title}" removed from recruiting package`);
  }

  const badgeLookup = Object.fromEntries(developmentBadges.map((b) => [b.id, b]));

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader
          eyebrow="My Profile"
          title="Recruiting Dashboard"
          subtitle="Your recruiting presence, access controls, and profile performance"
          actions={
            <Link href={`/recruiting/${player.profileSlug}`}>
              <button className="text-[13px] font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors">
                See what recruiters see →
              </button>
            </Link>
          }
        />

        <div className="space-y-5">

          {/* ── 1. Profile Strength ──────────────────────────────────────────── */}
          <SectionCard title="Profile Strength">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[28px] font-bold" style={{ color: completenessColor }}>{completeness}%</span>
              <span className="text-[12px] text-[var(--text-muted)]">
                {completeness >= 70 ? "Strong profile" : completeness >= 40 ? "Building profile" : "Profile needs attention"}
              </span>
            </div>
            <div className="h-3 rounded-full bg-[var(--bg-base)] overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${completeness}%`, backgroundColor: completenessColor }}
              />
            </div>
            {missingItems.length > 0 && (
              <div className="space-y-1.5">
                {missingItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7 4v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <circle cx="7" cy="10" r="0.7" fill="currentColor" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            )}
            {missingItems.length === 0 && (
              <p className="text-[12px] text-[var(--text-muted)]">Your profile is complete — recruiters have everything they need.</p>
            )}
          </SectionCard>

          {/* ── 2. Visibility Status ─────────────────────────────────────────── */}
          <SectionCard title="Visibility Status">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: player.isPublic ? "oklch(0.75 0.12 140)" : "oklch(0.55 0.02 260)" }}
                  />
                  <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {player.isPublic ? "Profile is PUBLIC" : "Profile is PRIVATE"}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--text-muted)] mb-3">
                  {player.isPublic
                    ? "Recruiters can find you and view your public information"
                    : "Recruiters cannot find or view your profile"}
                </p>
                <div className="flex items-center gap-4 text-[12px] text-[var(--text-muted)]">
                  <span>
                    <strong className="text-[var(--text-primary)]">{playerLog.length}</strong> profile views in last 30 days
                  </span>
                  <span>
                    <strong className="text-[var(--text-primary)]">{approvedRequests.length}</strong> approved access grants
                  </span>
                </div>
              </div>
              <Link href="/app/player/recruiting/visibility">
                <button className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors whitespace-nowrap">
                  Visibility settings →
                </button>
              </Link>
            </div>
          </SectionCard>

          {/* ── 3. Access Requests ───────────────────────────────────────────── */}
          <SectionCard title={`Access Requests — ${pendingRequests.length} pending`}>
            {playerRequests.filter((r) => requestStatuses[r.id] === "pending").length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No pending access requests.</p>
            ) : (
              <div className="space-y-3">
                {playerRequests
                  .filter((r) => requestStatuses[r.id] === "pending")
                  .map((req) => (
                    <div key={req.id} className="flex items-start gap-4 p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ backgroundColor: divisionColor(req.requesterSchoolTier) }}
                      >
                        {schoolInitials(req.requesterSchool)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[13px] font-semibold text-[var(--text-primary)]">{req.requesterSchool}</span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: divisionColor(req.requesterSchoolTier), backgroundColor: `${divisionColor(req.requesterSchoolTier)}18` }}
                          >
                            {req.requesterSchoolTier}
                          </span>
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)] mb-1">
                          {req.requesterName} · {req.requesterTitle}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mb-2">
                          Requested {timeAgo(req.requestedAt)} · {req.accessLevel === "includes_film" ? "Full profile + film" : req.accessLevel === "full_profile" ? "Full profile" : "Profile only"}
                        </p>
                        <p className="text-[12px] text-[var(--text-primary)] line-clamp-2">{req.requestMessage}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
                          style={{ backgroundColor: "oklch(0.75 0.12 140)" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(req.id)}
                          className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {approvedRequests.length > 0 && (
              <p className="text-[12px] text-[var(--text-muted)] mt-3">
                {approvedRequests.length} approved — manage in{" "}
                <Link href="/app/player/recruiting/visibility">
                  <span className="text-[var(--text-primary)] underline cursor-pointer">visibility settings</span>
                </Link>
              </p>
            )}
          </SectionCard>

          {/* ── 4. Recent Profile Views ──────────────────────────────────────── */}
          <SectionCard title="Recent Profile Views">
            {playerLog.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No profile views yet.</p>
            ) : (
              <div className="space-y-2">
                {playerLog.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: schoolColor(entry.requesterSchool) }}
                    >
                      {schoolInitials(entry.requesterSchool)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{entry.requesterSchool}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {entry.requesterName} · Viewed{" "}
                        {entry.sectionsViewed.join(" + ")}
                      </p>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] shrink-0">{timeAgo(entry.viewedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── 5. My Badges ─────────────────────────────────────────────────── */}
          <SectionCard title="My Badges">
            {playerBadges.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No badges earned yet. Complete assessments and film sessions to earn badges.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playerBadges.map((inst: BadgeInstance) => {
                  const badge = badgeLookup[inst.badgeId];
                  if (!badge) return null;
                  const badgeColor = badge.category === "skill"
                    ? "oklch(0.72 0.18 290)"
                    : badge.category === "behavioral"
                    ? "oklch(0.75 0.12 140)"
                    : "oklch(0.78 0.16 75)";
                  return (
                    <div
                      key={inst.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)]"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${badgeColor}20` }}
                      >
                        <BadgeIcon iconKey={badge.iconKey} size={20} color={badgeColor} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{badge.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{badge.description}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">
                          Earned {formatDate(inst.awardedAt)} · {inst.awardedBy}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ── 6. Recruiting Exports ─────────────────────────────────────────── */}
          <SectionCard title="Recruiting Exports">
            {playerExports.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[13px] text-[var(--text-muted)] mb-3">No exports generated yet. Ask your coach to create a recruiting export.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {playerExports.map((exp) => (
                  <div key={exp.id} className="flex items-start gap-4 p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                          Export — {formatDate(exp.generatedAt)}
                        </span>
                        <StatusChip status={exp.status} />
                      </div>
                      <p className="text-[12px] text-[var(--text-muted)] mb-1">
                        Generated by {exp.generatedBy} · {exp.clipIds.length} clips included
                      </p>
                      {exp.status === "shared" && (
                        <div className="flex items-center gap-4 text-[12px] text-[var(--text-muted)]">
                          <span>{exp.viewCount} views</span>
                          <span>{exp.downloadCount} downloads</span>
                          {exp.shareLinkExpiresAt && (
                            <span>Expires {formatDate(exp.shareLinkExpiresAt)}</span>
                          )}
                        </div>
                      )}
                      {exp.status === "pending_approval" && (
                        <p className="text-[12px] mt-1" style={{ color: "oklch(0.78 0.16 75)" }}>
                          Awaiting your family's approval before sharing
                        </p>
                      )}
                    </div>
                    {exp.status === "shared" && exp.shareLink && (
                      <a
                        href={exp.shareLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0"
                      >
                        View export
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => toast.success("Request sent to your coach to generate a recruiting export")}
                className="text-[13px] font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors"
              >
                Ask coach to generate export
              </button>
            </div>
          </SectionCard>

          {/* ── 7. Film Package ───────────────────────────────────────────────── */}
          <SectionCard title="Film Package">
            <p className="text-[12px] text-[var(--text-muted)] mb-4">
              {Object.values(clipPackageState).filter(Boolean).length} clips in your recruiting package ·{" "}
              Total runtime:{" "}
              {formatDuration(
                playerClips
                  .filter((c) => clipPackageState[c.id])
                  .reduce((sum, c) => sum + c.durationSeconds, 0)
              )}
            </p>
            <div className="space-y-3">
              {playerClips.map((clip: FilmClip) => {
                const inPackage = clipPackageState[clip.id];
                return (
                  <div
                    key={clip.id}
                    className="flex items-start gap-3 p-3 rounded-xl border transition-colors"
                    style={{
                      borderColor: inPackage ? "oklch(0.72 0.18 290 / 0.4)" : "var(--border)",
                      backgroundColor: inPackage ? "oklch(0.72 0.18 290 / 0.06)" : "var(--bg-base)",
                    }}
                  >
                    {/* Thumbnail placeholder */}
                    <div
                      className="w-16 h-12 rounded-lg shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: clip.thumbnailUrl }}
                    >
                      {formatDuration(clip.durationSeconds)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{clip.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{clip.coachAnnotation}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {clip.skillTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ color: "oklch(0.72 0.18 290)", backgroundColor: "oklch(0.72 0.18 290 / 0.12)" }}
                          >
                            {tag.replace("_", " ")}
                          </span>
                        ))}
                        <span className="text-[10px] text-[var(--text-muted)] capitalize">{clip.eventType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClipToggle(clip.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors shrink-0"
                      style={
                        inPackage
                          ? { color: "oklch(0.68 0.22 25)", borderColor: "oklch(0.68 0.22 25 / 0.4)", backgroundColor: "oklch(0.68 0.22 25 / 0.08)" }
                          : { color: "var(--text-muted)", borderColor: "var(--border)" }
                      }
                    >
                      {inPackage ? "Remove" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>

        </div>
      </div>
    </AppShell>
  );
}

