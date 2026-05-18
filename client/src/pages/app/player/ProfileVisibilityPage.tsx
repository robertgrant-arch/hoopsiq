/**
 * ProfileVisibilityPage — /app/player/recruiting/visibility
 *
 * Granular privacy controls for the player/family. Controls what's public,
 * what requires approval, and how long access lasts.
 *
 * Demo player: rp_001 (Jordan Mills, SG, 2027)
 */

import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import {
  recruitingPlayers,
  accessRequests,
  recruiterProfiles,
  getPlayerPrivacySettings,
  type PrivacySettings,
  type AccessRequest,
} from "@/features/recruiting/mock";

const DEMO_PLAYER_ID = "rp_001";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function divisionColor(tier: string): string {
  if (tier === "D1") return "oklch(0.72 0.18 290)";
  if (tier === "D2") return "oklch(0.75 0.12 140)";
  if (tier === "D3") return "oklch(0.78 0.16 75)";
  return "oklch(0.55 0.02 260)";
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)]"
      style={{
        backgroundColor: checked
          ? "oklch(0.72 0.18 290)"
          : "oklch(0.55 0.02 260 / 0.3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

// ─── Lock Icon ────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 text-[var(--text-muted)]">
      <rect x="3" y="6.5" width="8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 6.5V5a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
      <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-0.5">{title}</h2>
      {subtitle && <p className="text-[12px] text-[var(--text-muted)] mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ─── Controlled-Visibility Toggle Card ───────────────────────────────────────

interface ControlledFieldDef {
  key: PrivacySettings["sharedFields"][number];
  label: string;
  description: string;
  defaultPublic: boolean;
}

const CONTROLLED_FIELDS: ControlledFieldDef[] = [
  {
    key: "skillScores",
    label: "Skill Scores",
    description: "Your 8-category skill score breakdown and history",
    defaultPublic: true,
  },
  {
    key: "coachabilityIndex",
    label: "Coachability Index",
    description: "Your composite coachability rating (0–10)",
    defaultPublic: false,
  },
  {
    key: "filmClips",
    label: "Film Clips",
    description: "Coach-selected and annotated film from practice and games",
    defaultPublic: false,
  },
  {
    key: "assessmentHistory",
    label: "Assessment History",
    description: "Full history of structured assessment results over time",
    defaultPublic: false,
  },
  {
    key: "coachObservations",
    label: "Coach Narrative Summary",
    description: "The coach-written narrative about your development",
    defaultPublic: true,
  },
];

// ─── Access-Gated Fields ──────────────────────────────────────────────────────

const GATED_FIELDS = [
  { label: "Full Skill Scores", description: "Complete scoring detail and level annotations" },
  { label: "Assessment History", description: "All historical assessments with score progression" },
  { label: "Coach Observations (full text)", description: "Complete coach narrative — not just the summary" },
  { label: "Coachability Index Details", description: "Breakdown of attendance, IDP, and engagement sub-scores" },
  { label: "IDP Specifics", description: "Individual Development Plan goals and progress details" },
  { label: "Attendance Data", description: "Session-level attendance and absence records" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileVisibilityPage() {
  const player = recruitingPlayers.find((p) => p.id === DEMO_PLAYER_ID)!;
  const initialSettings = getPlayerPrivacySettings(DEMO_PLAYER_ID)!;
  const approvedRequests = accessRequests.filter(
    (r) => r.playerId === DEMO_PLAYER_ID && r.status === "approved"
  );

  // ── State ────────────────────────────────────────────────────────────────────

  const [isPublic, setIsPublic] = useState(player.isPublic);
  const [showPublicWarning, setShowPublicWarning] = useState(false);

  const [controlledToggles, setControlledToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(
      CONTROLLED_FIELDS.map((f) => [f.key, initialSettings.sharedFields.includes(f.key)])
    )
  );

  const [visibilityToggles, setVisibilityToggles] = useState<Record<string, boolean>>({
    tier: initialSettings.publicFields.includes("tier"),
    badgeCount: initialSettings.publicFields.includes("badgeCount"),
    growthSignal: initialSettings.publicFields.includes("growthSignal"),
  });

  const [requireApproval, setRequireApproval] = useState(initialSettings.requireApprovalForAccess);
  const [accessExpiry, setAccessExpiry] = useState<30 | 60 | 90 | 0>(initialSettings.accessExpiry);
  const [allowSearch, setAllowSearch] = useState(initialSettings.allowRecruiterSearch);

  const [revokedIds, setRevokedIds] = useState<Set<string>>(new Set());

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handlePublicToggle(val: boolean) {
    if (val && !isPublic) {
      setShowPublicWarning(true);
    } else {
      setIsPublic(val);
      setShowPublicWarning(false);
    }
  }

  function confirmPublic() {
    setIsPublic(true);
    setShowPublicWarning(false);
    toast.success("Profile is now public — recruiters can find you");
  }

  function handleControlledToggle(key: string, val: boolean) {
    setControlledToggles((prev) => ({ ...prev, [key]: val }));
  }

  function handleVisibilityToggle(key: string, val: boolean) {
    setVisibilityToggles((prev) => ({ ...prev, [key]: val }));
  }

  function handleRevoke(requestId: string, requesterSchool: string) {
    setRevokedIds((prev) => new Set(Array.from(prev).concat(requestId)));
    toast.success(`Access revoked for ${requesterSchool}`);
  }

  function handleSave() {
    toast.success("Privacy settings saved");
  }

  const activeApproved = approvedRequests.filter((r) => !revokedIds.has(r.id));

  function getRecruiterForRequest(req: AccessRequest) {
    return recruiterProfiles.find((rp) => rp.id === req.requesterId);
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <PageHeader
          eyebrow="Privacy & Permissions"
          title="Profile Visibility"
          subtitle="Control exactly what recruiters and the public can see"
        />

        <div className="space-y-5">

          {/* ── 1. Public Profile Toggle ─────────────────────────────────── */}
          <SectionCard
            title="Profile Visibility"
            subtitle="Toggle whether recruiters can find and view your profile"
          >
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]">
              <div>
                <p className="text-[14px] font-semibold text-[var(--text-primary)] mb-0.5">
                  Your profile is {isPublic ? "PUBLIC" : "PRIVATE"} to recruiters
                </p>
                <p className="text-[12px] text-[var(--text-muted)]">
                  {isPublic
                    ? "Recruiters can search for and view your public information"
                    : "Your profile is hidden — recruiters cannot find or view it"}
                </p>
              </div>
              <Toggle
                checked={isPublic}
                onChange={handlePublicToggle}
                label="Toggle profile public/private"
              />
            </div>
            {showPublicWarning && (
              <div
                className="mt-3 p-4 rounded-xl border"
                style={{ backgroundColor: "oklch(0.78 0.16 75 / 0.08)", borderColor: "oklch(0.78 0.16 75 / 0.3)" }}
              >
                <p className="text-[13px] font-medium mb-1" style={{ color: "oklch(0.78 0.16 75)" }}>
                  Make profile public?
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mb-3">
                  Anyone with the link can see your public information. Gated data still requires an approved access request.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={confirmPublic}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white"
                    style={{ backgroundColor: "oklch(0.78 0.16 75)" }}
                  >
                    Yes, make public
                  </button>
                  <button
                    onClick={() => setShowPublicWarning(false)}
                    className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── 2. Always-Public Information ─────────────────────────────── */}
          <SectionCard
            title="Always visible on your public profile"
            subtitle="These fields are always shown when your profile is public and cannot be hidden"
          >
            <div className="space-y-2">
              {[
                { label: "Name", value: player.name },
                { label: "Position", value: player.position },
                { label: "Graduation Year", value: String(player.gradYear) },
                { label: "Height", value: player.height },
                { label: "Program", value: player.programName },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">{value}</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" fill="oklch(0.55 0.02 260 / 0.1)" />
                      <path d="M4.5 7l2 2 3.5-3.5" stroke="oklch(0.55 0.02 260)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── 3. Controlled Visibility ─────────────────────────────────── */}
          <SectionCard
            title="You control what's shown"
            subtitle="Toggle each category to include or exclude it from your public profile"
          >
            <div className="space-y-2 mb-4">
              {(
                [
                  { key: "tier", label: "Overall Tier / Level", description: "Your current tier: Emerging, Developing, Advanced, or Elite", defaultOn: true },
                  { key: "badgeCount", label: "Badge Count & Types", description: "How many badges you've earned and what they are", defaultOn: true },
                  { key: "growthSignal", label: "Growth Signal", description: "Whether your skills are improving, stable, or declining", defaultOn: true },
                ] as { key: string; label: string; description: string; defaultOn: boolean }[]
              ).map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Default: Public</p>
                  </div>
                  <Toggle
                    checked={visibilityToggles[key] ?? true}
                    onChange={(val) => handleVisibilityToggle(key, val)}
                    label={`Toggle ${label}`}
                  />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[var(--text-muted)] mb-3 uppercase tracking-wider font-medium">Film &amp; skill data — shown to approved access only</p>
            <div className="space-y-2">
              {CONTROLLED_FIELDS.map(({ key, label, description, defaultPublic }) => (
                <div
                  key={key}
                  className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Default: {defaultPublic ? "Shared with access" : "Private"}</p>
                  </div>
                  <Toggle
                    checked={controlledToggles[key] ?? false}
                    onChange={(val) => handleControlledToggle(key, val)}
                    label={`Toggle ${label}`}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── 4. Access-Gated Section ───────────────────────────────────── */}
          <SectionCard
            title="Shown only with approved access"
            subtitle="These categories are always private — they require an approved access request and cannot be made public"
          >
            <div className="space-y-2">
              {GATED_FIELDS.map(({ label, description }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]">
                  <div className="mt-0.5 text-[var(--text-muted)]">
                    <LockIcon />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── 5. Access Request Settings ───────────────────────────────── */}
          <SectionCard title="Access Request Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border)]">
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">Require approval for all access requests</p>
                  <p className="text-[12px] text-[var(--text-muted)]">Recruiters must wait for you to approve before seeing gated data</p>
                </div>
                <Toggle
                  checked={requireApproval}
                  onChange={setRequireApproval}
                  label="Require approval for access requests"
                />
              </div>

              <div className="pb-3 border-b border-[var(--border)]">
                <p className="text-[13px] font-medium text-[var(--text-primary)] mb-1">Access link expires after</p>
                <p className="text-[12px] text-[var(--text-muted)] mb-3">After approval, how long can a recruiter access your gated data?</p>
                <div className="flex flex-wrap gap-2">
                  {([30, 60, 90, 0] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setAccessExpiry(days)}
                      className="text-[12px] font-medium px-4 py-2 rounded-lg border transition-colors"
                      style={
                        accessExpiry === days
                          ? { backgroundColor: "oklch(0.72 0.18 290)", color: "white", borderColor: "transparent" }
                          : { borderColor: "var(--border)", color: "var(--text-muted)" }
                      }
                    >
                      {days === 0 ? "Never" : `${days} days`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">Allow recruiters to find me in search</p>
                  <p className="text-[12px] text-[var(--text-muted)]">When off, your profile won't appear in recruiter search results</p>
                </div>
                <Toggle
                  checked={allowSearch}
                  onChange={setAllowSearch}
                  label="Allow recruiter search"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── 6. Active Access Grants ───────────────────────────────────── */}
          <SectionCard
            title={`Active Access Grants — ${activeApproved.length}`}
            subtitle="Recruiters currently approved to view your gated data"
          >
            {activeApproved.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No active access grants.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Requester", "School", "Division", "Granted", "Expires", "Sections", ""].map((h) => (
                        <th key={h} className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium pb-2 pr-4 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeApproved.map((req: AccessRequest) => {
                      const recruiter = getRecruiterForRequest(req);
                      return (
                        <tr key={req.id} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-3 pr-4">
                            <p className="text-[12px] font-medium text-[var(--text-primary)] whitespace-nowrap">{req.requesterName}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{req.requesterTitle}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-[12px] text-[var(--text-primary)] whitespace-nowrap">{req.requesterSchool}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ color: divisionColor(req.requesterSchoolTier), backgroundColor: `${divisionColor(req.requesterSchoolTier)}18` }}
                            >
                              {req.requesterSchoolTier}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">
                              {req.respondedAt ? formatDate(req.respondedAt) : "—"}
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">
                              {req.expiresAt ? formatDate(req.expiresAt) : "Never"}
                            </p>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="text-[11px] text-[var(--text-muted)] capitalize">
                              {req.accessLevel === "includes_film"
                                ? "Profile + film"
                                : req.accessLevel === "full_profile"
                                ? "Full profile"
                                : "Profile only"}
                            </p>
                            {recruiter && (
                              <p className="text-[10px] text-[var(--text-muted)]">{req.viewCount} views</p>
                            )}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleRevoke(req.id, req.requesterSchool)}
                              className="text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap"
                              style={{
                                color: "oklch(0.68 0.22 25)",
                                borderColor: "oklch(0.68 0.22 25 / 0.35)",
                                backgroundColor: "oklch(0.68 0.22 25 / 0.06)",
                              }}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* ── 7. Save Button ────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <p className="text-[12px] text-[var(--text-muted)]">Changes take effect immediately</p>
            <button
              onClick={handleSave}
              className="text-[13px] font-semibold px-5 py-2.5 rounded-lg text-white transition-colors"
              style={{ backgroundColor: "oklch(0.72 0.18 290)" }}
            >
              Save changes
            </button>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
