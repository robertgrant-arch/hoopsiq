/**
 * SafetyPolicyBanner — minimal UI indicators for the guardian-copy policy.
 *
 * Three variants, all independent of each other:
 *
 *   <GuardianIncludedBadge />
 *     Inline badge shown in the audience summary when guardians were (or will
 *     be) automatically included for minor athletes.
 *
 *   <ProtectedMinorBanner />
 *     Panel-level banner shown at the top of a message thread that contains
 *     a minor. Informs all participants that this thread is monitored.
 *
 *   <BlockedSendBanner reason="…" />
 *     Error state shown in the compose dialog when a send was rejected because
 *     a minor has no guardian on file.
 */

import { ShieldCheck, Shield, ShieldAlert } from "lucide-react";

// ── Guardian Included badge ───────────────────────────────────────────────────

interface GuardianIncludedBadgeProps {
  count?: number; // number of guardians auto-added (omit for generic label)
}

export function GuardianIncludedBadge({ count }: GuardianIncludedBadgeProps) {
  const label =
    count !== undefined
      ? `Guardian${count !== 1 ? "s" : ""} Included (${count})`
      : "Guardian Included";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10.5px] font-medium"
      title="A guardian has been automatically included for each minor athlete in this thread."
    >
      <ShieldCheck className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

// ── Protected Minor Thread banner ─────────────────────────────────────────────

interface ProtectedMinorBannerProps {
  /** Number of minors in this thread (for copy). */
  minorCount?: number;
  className?: string;
}

export function ProtectedMinorBanner({
  minorCount,
  className = "",
}: ProtectedMinorBannerProps) {
  const athleteLabel =
    minorCount === 1 ? "a minor athlete" : `${minorCount ?? "minor"} athletes`;

  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-[11.5px] text-sky-300 ${className}`}
    >
      <Shield className="w-3.5 h-3.5 mt-px shrink-0 text-sky-400" />
      <div className="space-y-0.5">
        <div className="font-medium text-sky-200">Protected Minor Thread</div>
        <div className="text-sky-300/80">
          This conversation includes {athleteLabel}. A parent or guardian is
          copied on all messages per program policy.
        </div>
      </div>
    </div>
  );
}

// ── Blocked Send banner ───────────────────────────────────────────────────────
//
// Handles all policy block codes returned by the server:
//
//   GUARDIAN_REQUIRED      (layer 1) — minor has no guardian on file
//   MINOR_WITHOUT_GUARDIAN (layer 2) — thread structure has minor without guardian
//   SECOND_ADULT_REQUIRED  (layer 2) — org requires second adult for team threads
//   THREAD_TYPE_BLOCKED    (layer 2) — generic thread type rejection

const BLOCK_CODE_META: Record<string, { title: string; hint: string }> = {
  // Layer 1 — guardian-copy
  GUARDIAN_REQUIRED: {
    title: "Blocked: Guardian Required",
    hint:  "Go to the athlete's profile and add a guardian with a valid email or phone number, then retry.",
  },
  MINOR_WITHOUT_GUARDIAN: {
    title: "Blocked: Guardian Required",
    hint:  "Use the compose flow — guardians for minor athletes will be added automatically.",
  },
  // Layer 2 — thread type
  SECOND_ADULT_REQUIRED: {
    title: "Blocked: Second Adult Required",
    hint:  "Ask your program administrator to add a second staff member to this thread before sending.",
  },
  THREAD_TYPE_BLOCKED: {
    title: "Blocked: Unsafe Thread Structure",
    hint:  "This message structure is not permitted by your organization's communications policy.",
  },
  // Layer 3 — quiet hours (informational, not hard-blocked)
  OUTSIDE_QUIET_HOURS: {
    title: "Outside Allowed Hours",
    hint:  "Your message has been scheduled for the next allowed window, or use the emergency override.",
  },
};

const DEFAULT_BLOCK_META = {
  title: "Blocked: Policy Violation",
  hint:  "Contact your program administrator if you believe this is incorrect.",
};

interface BlockedSendBannerProps {
  reason: string;
  /** Machine-readable code from the server (e.g. "GUARDIAN_REQUIRED"). */
  code?: string;
  className?: string;
}

export function BlockedSendBanner({ reason, code, className = "" }: BlockedSendBannerProps) {
  const meta = (code && BLOCK_CODE_META[code]) ?? DEFAULT_BLOCK_META;

  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-red-500/30 bg-red-500/8 text-[11.5px] ${className}`}
      role="alert"
    >
      <ShieldAlert className="w-3.5 h-3.5 mt-px shrink-0 text-red-400" />
      <div className="space-y-0.5">
        <div className="font-medium text-red-300">{meta.title}</div>
        <div className="text-red-300/80">{reason}</div>
        <div className="text-red-300/60 pt-0.5">{meta.hint}</div>
      </div>
    </div>
  );
}
