/**
 * FamilyPrivacyPage — Family control center for athlete recruiting visibility.
 * Route: /app/family/privacy
 *
 * Sections:
 *  1. Public profile switch (large toggle card)
 *  2. Always visible (informational)
 *  3. Family-controlled toggles (grid)
 *  4. Always requires approval (locked, informational)
 *  5. Access settings (expiry, search discovery)
 */
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type ManagedPlayer = {
  id: string;
  name: string;
  position: string;
  gradYear: number;
  programName: string;
  overallTier: "Emerging" | "Developing" | "Advanced" | "Elite";
  profileSlug: string;
  isPublic: boolean;
  badgeCount: number;
  assessmentCount: number;
  coachabilityIndex: number;
  attendanceRate: number;
};

type PrivacySettings = {
  playerId: string;
  isPublic: boolean;
  showTier: boolean;
  showBadges: boolean;
  showGrowthSignal: boolean;
  showCoachNarrativeSummary: boolean;
  showFilmClips: boolean;
  requireApproval: boolean;
  accessExpiryDays: 30 | 60 | 90;
  allowSearch: boolean;
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const MANAGED_PLAYERS: ManagedPlayer[] = [
  {
    id: "player-jordan",
    name: "Jordan Mills",
    position: "Point Guard",
    gradYear: 2027,
    programName: "Elevation Basketball",
    overallTier: "Advanced",
    profileSlug: "jordan-mills-2027",
    isPublic: true,
    badgeCount: 7,
    assessmentCount: 14,
    coachabilityIndex: 88,
    attendanceRate: 92,
  },
  {
    id: "player-casey",
    name: "Casey Mills",
    position: "Small Forward",
    gradYear: 2029,
    programName: "Elevation Basketball",
    overallTier: "Developing",
    profileSlug: "casey-mills-2029",
    isPublic: false,
    badgeCount: 2,
    assessmentCount: 5,
    coachabilityIndex: 74,
    attendanceRate: 96,
  },
];

const INITIAL_PRIVACY: Record<string, PrivacySettings> = {
  "player-jordan": {
    playerId: "player-jordan",
    isPublic: true,
    showTier: true,
    showBadges: true,
    showGrowthSignal: true,
    showCoachNarrativeSummary: true,
    showFilmClips: false,
    requireApproval: true,
    accessExpiryDays: 60,
    allowSearch: true,
  },
  "player-casey": {
    playerId: "player-casey",
    isPublic: false,
    showTier: false,
    showBadges: false,
    showGrowthSignal: false,
    showCoachNarrativeSummary: false,
    showFilmClips: false,
    requireApproval: true,
    accessExpiryDays: 30,
    allowSearch: false,
  },
};

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: checked
          ? "oklch(0.75 0.12 140)"
          : "oklch(0.30 0.01 260)",
      }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0px)" }}
      />
    </button>
  );
}

function PrivacyToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 p-4 rounded-xl border transition-all"
      style={{
        background: "var(--bg-surface)",
        borderColor: checked
          ? "oklch(0.75 0.12 140 / 0.35)"
          : "var(--border)",
      }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text-primary)]">
          {label}
        </div>
        <div className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
          {description}
        </div>
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        label={`Toggle ${label}`}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function FamilyPrivacyPage() {
  const [activePlayerId, setActivePlayerId] = useState<string>(
    MANAGED_PLAYERS[0].id
  );
  const [privacy, setPrivacy] = useState<Record<string, PrivacySettings>>(
    INITIAL_PRIVACY
  );
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const player = MANAGED_PLAYERS.find((p) => p.id === activePlayerId)!;
  const settings = privacy[activePlayerId]!;

  function updateSetting<K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) {
    setPrivacy((prev) => ({
      ...prev,
      [activePlayerId]: { ...prev[activePlayerId], [key]: value },
    }));
  }

  function handlePublicToggle(val: boolean) {
    if (val) {
      setShowPublicModal(true);
    } else {
      updateSetting("isPublic", false);
    }
  }

  function confirmMakePublic() {
    updateSetting("isPublic", true);
    setShowPublicModal(false);
  }

  function handleRequireApprovalToggle(val: boolean) {
    if (!val) {
      setShowApprovalModal(true);
    } else {
      updateSetting("requireApproval", true);
    }
  }

  function handleSave() {
    toast.success("Privacy settings saved.");
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="Privacy & Control"
          title="Your Athlete's Profile"
          subtitle="You control exactly what college programs and recruiters can see"
          actions={
            <Button
              onClick={handleSave}
              style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
            >
              Save Changes
            </Button>
          }
        />

        {/* Multi-player tab strip */}
        {MANAGED_PLAYERS.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {MANAGED_PLAYERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlayerId(p.id)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shrink-0 transition-all text-[13px] font-medium"
                style={
                  activePlayerId === p.id
                    ? {
                        background: "oklch(0.72 0.18 290 / 0.12)",
                        borderColor: "oklch(0.72 0.18 290 / 0.4)",
                        color: "oklch(0.72 0.18 290)",
                        fontWeight: 600,
                      }
                    : {
                        background: "var(--bg-surface)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }
                }
              >
                {/* Avatar placeholder */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{
                    background:
                      activePlayerId === p.id
                        ? "oklch(0.72 0.18 290 / 0.20)"
                        : "oklch(0.25 0.01 260)",
                    color:
                      activePlayerId === p.id
                        ? "oklch(0.72 0.18 290)"
                        : "oklch(0.60 0.02 260)",
                  }}
                >
                  {p.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Privacy philosophy callout */}
        <div
          className="flex gap-4 p-5 rounded-2xl border mb-8"
          style={{
            background: "oklch(0.72 0.18 290 / 0.06)",
            borderColor: "oklch(0.72 0.18 290 / 0.20)",
          }}
        >
          {/* Shield SVG */}
          <div className="shrink-0 mt-0.5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L4 6v6c0 5.25 3.47 10.15 8 11.36C16.53 22.15 20 17.25 20 12V6l-8-4z"
                fill="oklch(0.72 0.18 290 / 0.20)"
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
          </div>
          <div>
            <div
              className="text-[14px] font-semibold mb-1"
              style={{ color: "oklch(0.72 0.18 290)" }}
            >
              You own your child's data.
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
              HoopsIQ never sells player information. Every profile view is
              logged and visible to you. You can change these settings anytime,
              and any access you've granted can be revoked immediately.
            </p>
          </div>
        </div>

        {/* ── Section 1: Public profile switch ── */}
        <section className="mb-8">
          <div
            className="rounded-2xl border p-5 transition-all"
            style={{
              background: settings.isPublic
                ? "oklch(0.75 0.12 140 / 0.07)"
                : "var(--bg-surface)",
              borderColor: settings.isPublic
                ? "oklch(0.75 0.12 140 / 0.35)"
                : "var(--border)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {/* Icon */}
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: settings.isPublic
                      ? "oklch(0.75 0.12 140 / 0.15)"
                      : "oklch(0.22 0.01 260)",
                  }}
                >
                  {settings.isPublic ? (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M12 2L4 6v6c0 5.25 3.47 10.15 8 11.36C16.53 22.15 20 17.25 20 12V6l-8-4z"
                        fill="oklch(0.75 0.12 140 / 0.20)"
                        stroke="oklch(0.75 0.12 140)"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="oklch(0.75 0.12 140)"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect
                        x="5"
                        y="11"
                        width="14"
                        height="10"
                        rx="2"
                        stroke="oklch(0.55 0.02 260)"
                        strokeWidth="1.5"
                        fill="oklch(0.22 0.01 260 / 0.60)"
                      />
                      <path
                        d="M8 11V7a4 4 0 018 0v4"
                        stroke="oklch(0.55 0.02 260)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="16" r="1.5" fill="oklch(0.55 0.02 260)" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0">
                  <div
                    className="text-[17px] font-bold leading-tight"
                    style={{
                      color: settings.isPublic
                        ? "oklch(0.75 0.12 140)"
                        : "var(--text-primary)",
                    }}
                  >
                    {player.name}'s profile is{" "}
                    <span
                      className="uppercase tracking-wide"
                      style={{
                        color: settings.isPublic
                          ? "oklch(0.75 0.12 140)"
                          : "var(--text-muted)",
                      }}
                    >
                      {settings.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  <p
                    className="text-[13px] mt-1 leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {settings.isPublic
                      ? "Recruiters can discover this profile in search results."
                      : "Only people with a direct link can request access."}
                  </p>
                </div>
              </div>

              <Toggle
                checked={settings.isPublic}
                onChange={handlePublicToggle}
                label="Toggle profile visibility"
              />
            </div>
          </div>
        </section>

        {/* ── Section 2: Always visible ── */}
        <section className="mb-8">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">
            Always on your public profile
          </h2>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            This information helps recruiters identify the right athletes — it's
            the equivalent of a jersey number.
          </p>
          <div
            className="rounded-xl border p-4 space-y-2.5"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            {[
              "Full name",
              "Position",
              "Graduating class year",
              "Height",
              "Program name and team tier",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0"
                >
                  <circle cx="8" cy="8" r="7" fill="oklch(0.75 0.12 140 / 0.15)" />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="oklch(0.75 0.12 140)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[13px] text-[var(--text-primary)]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Family-controlled toggles ── */}
        <section className="mb-8">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">
            You choose what's shown publicly
          </h2>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            Each of these can be turned on or off at any time. Changes take
            effect immediately.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PrivacyToggleCard
              label="Development Tier"
              description={`Shows which level ${player.name} has reached (${player.overallTier}). No raw scores.`}
              checked={settings.showTier}
              onChange={(v) => updateSetting("showTier", v)}
            />
            <PrivacyToggleCard
              label="Verified Badges"
              description={`Shows badge names and count (${player.badgeCount} badges). Details require approved access.`}
              checked={settings.showBadges}
              onChange={(v) => updateSetting("showBadges", v)}
            />
            <PrivacyToggleCard
              label="Growth Signal"
              description={`Shows whether ${player.name} is improving or stable. No specific numbers.`}
              checked={settings.showGrowthSignal}
              onChange={(v) => updateSetting("showGrowthSignal", v)}
            />
            <PrivacyToggleCard
              label="Coach Narrative Preview"
              description="A 2-sentence summary of the coach's assessment. Full text requires access."
              checked={settings.showCoachNarrativeSummary}
              onChange={(v) => updateSetting("showCoachNarrativeSummary", v)}
            />
            <PrivacyToggleCard
              label="Film Clips"
              description="Shows that film exists and clip count. Viewing clips requires access."
              checked={settings.showFilmClips}
              onChange={(v) => updateSetting("showFilmClips", v)}
            />
          </div>
        </section>

        {/* ── Section 4: Always requires approval ── */}
        <section className="mb-8">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-1">
            Always gated — requires your explicit approval
          </h2>
          <p className="text-[12px] text-[var(--text-muted)] mb-4">
            No recruiter ever sees these without your individual approval.
          </p>
          <div
            className="rounded-xl border p-4 space-y-2.5"
            style={{
              background: "var(--bg-surface)",
              borderColor: "oklch(0.68 0.22 25 / 0.20)",
            }}
          >
            {[
              "Full skill scores and history",
              "Complete assessment data",
              "Coach observations (full text)",
              "Individual Development Plan details",
              "Attendance data",
              "Coachability index specifics",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0"
                >
                  <rect
                    x="3"
                    y="7"
                    width="10"
                    height="7"
                    rx="1.5"
                    stroke="oklch(0.68 0.22 25)"
                    strokeWidth="1.25"
                    fill="oklch(0.68 0.22 25 / 0.10)"
                  />
                  <path
                    d="M5.5 7V5a2.5 2.5 0 015 0v2"
                    stroke="oklch(0.68 0.22 25)"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[13px] text-[var(--text-primary)]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5: Access settings ── */}
        <section className="mb-8">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-4">
            Access settings
          </h2>

          <div className="space-y-4">
            {/* Require approval toggle */}
            <div
              className="flex items-start justify-between gap-4 p-4 rounded-xl border"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Require approval for every access request
                </div>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Every recruiter request requires your explicit yes. This
                  cannot be disabled without confirmation.
                </p>
              </div>
              <Toggle
                checked={settings.requireApproval}
                onChange={handleRequireApprovalToggle}
                label="Toggle require approval"
              />
            </div>

            {/* Expiry radio */}
            <div
              className="p-4 rounded-xl border"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">
                Access expires after
              </div>
              <div className="flex gap-3 flex-wrap mb-4">
                {([30, 60, 90] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => updateSetting("accessExpiryDays", days)}
                    className="flex flex-col items-center px-5 py-3 rounded-xl border transition-all"
                    style={
                      settings.accessExpiryDays === days
                        ? {
                            background: "oklch(0.72 0.18 290 / 0.12)",
                            borderColor: "oklch(0.72 0.18 290 / 0.45)",
                            color: "oklch(0.72 0.18 290)",
                          }
                        : {
                            background: "oklch(0.18 0.005 260)",
                            borderColor: "var(--border)",
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    <span
                      className="text-[22px] font-bold leading-none"
                      style={{
                        color:
                          settings.accessExpiryDays === days
                            ? "oklch(0.72 0.18 290)"
                            : "var(--text-primary)",
                      }}
                    >
                      {days}
                    </span>
                    <span className="text-[11px] mt-0.5">days</span>
                  </button>
                ))}
              </div>
              {/* Timeline graphic */}
              <div className="relative h-8 flex items-center">
                <div
                  className="absolute inset-0 rounded-full h-2 top-1/2 -translate-y-1/2"
                  style={{ background: "oklch(0.22 0.01 260)" }}
                />
                <div
                  className="absolute left-0 rounded-full h-2 top-1/2 -translate-y-1/2 transition-all duration-300"
                  style={{
                    background: "oklch(0.72 0.18 290)",
                    width: `${(settings.accessExpiryDays / 90) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white z-10 transition-all duration-300"
                  style={{
                    left: `${(settings.accessExpiryDays / 90) * 100}%`,
                    background: "oklch(0.72 0.18 290)",
                  }}
                />
                <span
                  className="absolute right-0 text-[10px] top-full mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  90 days max
                </span>
                <span
                  className="absolute left-0 text-[10px] top-full mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  30 days min
                </span>
              </div>
            </div>

            {/* Search discovery toggle */}
            <div
              className="flex items-start justify-between gap-4 p-4 rounded-xl border"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Allow search discovery
                </div>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  When ON, {player.name} appears in recruiter search results.
                  When OFF, only people with a direct link can find the profile.
                </p>
              </div>
              <Toggle
                checked={settings.allowSearch}
                onChange={(v) => updateSetting("allowSearch", v)}
                label="Toggle search discovery"
              />
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="px-8"
            style={{ background: "oklch(0.72 0.18 290)", color: "white" }}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Make Public confirmation modal */}
      <Dialog open={showPublicModal} onOpenChange={setShowPublicModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make profile public?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mt-1 mb-6">
            Making this profile public means recruiters can find{" "}
            {player.name} in search results. You still control all access
            requests individually — no one gets full access without your
            approval.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPublicModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmMakePublic}
              style={{
                background: "oklch(0.75 0.12 140)",
                color: "white",
              }}
            >
              Make Public
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable approval warning modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disable required approval?</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mt-1 mb-6">
            We strongly recommend keeping approval required. Without it, anyone
            with access to the profile link could view {player.name}'s full
            recruiting data. Are you sure you want to disable this?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
            >
              Keep Approval On
            </Button>
            <Button
              onClick={() => {
                updateSetting("requireApproval", false);
                setShowApprovalModal(false);
              }}
              style={{
                background: "oklch(0.68 0.22 25)",
                color: "white",
              }}
            >
              Disable Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
