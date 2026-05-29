/**
 * ThreadTypeBadge — visual indicators for policy-approved thread types.
 *
 * Four exports, each mapping to a server-side policy outcome:
 *
 *   <ThreadTypeLabel type="…" />
 *     Pill showing the human-readable approved thread type name.
 *     Rendered in the audience summary row.
 *
 *   <MinorProtectedBadge />
 *     Amber badge confirming a minor is in the thread and the guardian
 *     copy rule is active.
 *
 *   <SecondAdultIncludedBadge />
 *     Blue badge shown when a second adult staff member is on the thread.
 *
 *   <ThreadPolicyBadgeRow badges={[…]} threadType="…" />
 *     Convenience row that renders the applicable badge set from the
 *     `policy.badges` array returned by the server's compose response.
 *
 * Badge keys (from ThreadBadge in thread-type-policy.ts):
 *   "minor_protected"       → <MinorProtectedBadge />
 *   "guardian_included"     → <GuardianIncludedBadge /> (from SafetyPolicyBanner)
 *   "second_adult_included" → <SecondAdultIncludedBadge />
 */

import { Shield, ShieldCheck, Users } from "lucide-react";
import { GuardianIncludedBadge } from "./SafetyPolicyBanner";

// ── Thread type label pill ────────────────────────────────────────────────────

const THREAD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  coach_to_parent:               { label: "Coach → Parent",          color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
  coach_to_minor_with_guardian:  { label: "Protected 1:1",           color: "text-amber-400  border-amber-500/30  bg-amber-500/10"  },
  coach_to_team_with_adult_copy: { label: "Team (Guardian Copy)",    color: "text-sky-400    border-sky-500/30    bg-sky-500/10"    },
  staff_internal:                { label: "Staff Internal",          color: "text-slate-400  border-slate-500/30  bg-slate-500/10"  },
  broadcast:                     { label: "Team Broadcast",          color: "text-zinc-400   border-zinc-500/30   bg-zinc-500/10"   },
  dm:                            { label: "Direct Message",          color: "text-zinc-400   border-zinc-500/30   bg-zinc-500/10"   },
  parent_dm:                     { label: "Parent Message",          color: "text-zinc-400   border-zinc-500/30   bg-zinc-500/10"   },
};

interface ThreadTypeLabelProps {
  type: string;
}

export function ThreadTypeLabel({ type }: ThreadTypeLabelProps) {
  const meta = THREAD_TYPE_LABELS[type];
  if (!meta) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-medium ${meta.color}`}
      title={`Thread type: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
}

// ── Minor Protected badge ─────────────────────────────────────────────────────

export function MinorProtectedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10.5px] font-medium"
      title="Minor athlete detected — guardian copy policy is active for this thread."
    >
      <Shield className="w-3 h-3 shrink-0" />
      Minor Protected
    </span>
  );
}

// ── Second Adult Included badge ───────────────────────────────────────────────

export function SecondAdultIncludedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10.5px] font-medium"
      title="A second adult staff member is included on this thread for additional oversight."
    >
      <Users className="w-3 h-3 shrink-0" />
      Second Adult
    </span>
  );
}

// ── Convenience badge row ─────────────────────────────────────────────────────

interface ThreadPolicyBadgeRowProps {
  /** Badge keys from the server's policy.badges array. */
  badges: string[];
  /** Thread type from the server's policy.threadType. */
  threadType?: string;
  className?: string;
}

export function ThreadPolicyBadgeRow({
  badges,
  threadType,
  className = "",
}: ThreadPolicyBadgeRowProps) {
  if (badges.length === 0 && !threadType) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {threadType && <ThreadTypeLabel type={threadType} />}
      {badges.includes("minor_protected")     && <MinorProtectedBadge />}
      {badges.includes("guardian_included")   && <GuardianIncludedBadge />}
      {badges.includes("second_adult_included") && <SecondAdultIncludedBadge />}
    </div>
  );
}
