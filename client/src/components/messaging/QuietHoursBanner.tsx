/**
 * QuietHoursBanner — minimal status banners for Layer 3 quiet-hours policy.
 *
 * Three independent exports, shown depending on the server response:
 *
 *   <OutsideHoursWarning policyWindow="…" localOrgTime="…" />
 *     Shown in the compose dialog when the client-side clock suggests the
 *     send will land outside allowed hours (pre-send preview state).
 *
 *   <MessageQueuedBanner scheduledAt="…" localOrgTime="…" />
 *     Shown as a success state when the server responds 202 (queued).
 *     Replaces the normal "Message sent" toast.
 *
 *   <EmergencySentBanner reason="…" />
 *     Shown inline on a thread row or compose confirmation when an emergency
 *     override was used.  Reminds staff the send is flagged for admin review.
 */

import { Clock, CalendarCheck, AlertOctagon } from "lucide-react";
import { EMERGENCY_REASON_LABELS } from "./quiet-hours-types";

// ── Outside hours inline warning ──────────────────────────────────────────────

interface OutsideHoursWarningProps {
  /** Policy window string, e.g. "05:00–21:00". */
  policyWindow:  string;
  /** Human-readable current local time in org timezone, e.g. "22:14 CST". */
  localOrgTime?: string;
  className?:    string;
}

export function OutsideHoursWarning({
  policyWindow,
  localOrgTime,
  className = "",
}: OutsideHoursWarningProps) {
  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 text-[11.5px] ${className}`}
    >
      <Clock className="w-3.5 h-3.5 mt-px shrink-0 text-amber-400" />
      <div className="space-y-0.5">
        <div className="font-medium text-amber-300">Outside Allowed Hours</div>
        <div className="text-amber-300/80">
          {localOrgTime && <span>Current time: {localOrgTime}. </span>}
          Messages to minor athletes may only be sent between{" "}
          <span className="font-medium text-amber-200">{policyWindow}</span>.
        </div>
        <div className="text-amber-300/60 pt-0.5">
          Your message will be scheduled for the next available window, or
          you can submit an emergency override below.
        </div>
      </div>
    </div>
  );
}

// ── Queued confirmation banner ─────────────────────────────────────────────────

interface MessageQueuedBannerProps {
  /** ISO timestamp from server policy.quietHours.scheduledAt */
  scheduledAt:  string;
  /** Human-readable local time, e.g. "05:00 CST tomorrow" */
  localOrgTime?: string;
  className?:   string;
}

export function MessageQueuedBanner({
  scheduledAt,
  localOrgTime,
  className = "",
}: MessageQueuedBannerProps) {
  // Format the scheduled time for display.
  let displayTime = scheduledAt;
  try {
    displayTime = new Intl.DateTimeFormat("en-US", {
      dateStyle:  "medium",
      timeStyle:  "short",
    }).format(new Date(scheduledAt));
  } catch {
    // keep raw ISO string as fallback
  }

  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-sky-500/25 bg-sky-500/8 text-[11.5px] ${className}`}
    >
      <CalendarCheck className="w-3.5 h-3.5 mt-px shrink-0 text-sky-400" />
      <div className="space-y-0.5">
        <div className="font-medium text-sky-200">Scheduled for Later</div>
        <div className="text-sky-300/80">
          Your message has been saved and will be delivered at{" "}
          <span className="font-medium text-sky-200">{displayTime}</span>
          {localOrgTime && ` (${localOrgTime})`} when the policy window opens.
        </div>
        <div className="text-sky-300/60 pt-0.5">
          Guardian recipients will be notified at that time.
        </div>
      </div>
    </div>
  );
}

// ── Emergency-sent banner ─────────────────────────────────────────────────────

interface EmergencySentBannerProps {
  /** EmergencyReason key from the policy service. */
  reason:    string;
  className?: string;
}

export function EmergencySentBanner({ reason, className = "" }: EmergencySentBannerProps) {
  const label = EMERGENCY_REASON_LABELS[reason as keyof typeof EMERGENCY_REASON_LABELS]
    ?? reason;

  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-orange-500/30 bg-orange-500/8 text-[11.5px] ${className}`}
    >
      <AlertOctagon className="w-3.5 h-3.5 mt-px shrink-0 text-orange-400" />
      <div className="space-y-0.5">
        <div className="font-medium text-orange-300">Sent with Emergency Override</div>
        <div className="text-orange-300/80">
          Reason: <span className="font-medium text-orange-200">{label}</span>.
          This send has been logged for administrator review.
        </div>
      </div>
    </div>
  );
}
