/**
 * Quiet-hours policy — Layer 3 of the HoopsOS communications safety stack.
 *
 *   Layer 1  guardian-policy.ts    — guardian-copy enforcement
 *   Layer 2  thread-type-policy.ts — approved thread type classification
 *   Layer 3  this file             — send-time window enforcement
 *
 * POLICY SUMMARY
 * ──────────────
 * When a staff member sends to a thread containing minor athletes, this
 * policy checks whether the send attempt falls within the org-configured
 * allowed hours (default 05:00–21:00 in the org's local timezone).
 *
 *   Within window  → action = "allowed"   — send immediately
 *   Outside window → action = "queued"    — message stored, delivered at next window open
 *   Outside window
 *     + emergency  → action = "emergency_send" — send immediately, require documented reason
 *   Non-minor thread
 *   or non-staff   → action = "skipped"   — policy does not apply
 *
 * PURITY CONTRACT
 * ───────────────
 * No database access.  All inputs are plain data.  The route handler is
 * responsible for loading org settings, computing `attemptedAt`, and
 * persisting the audit row to `quiet_hours_log`.
 *
 * TIMEZONE APPROACH
 * ─────────────────
 * Uses `Intl.DateTimeFormat` (built into Node.js) to convert UTC times to
 * the org's local timezone — no external library required.  The algorithm
 * handles:
 *   • Whole-hour offsets  (UTC±N)
 *   • Half-hour offsets   (e.g. IST UTC+5:30, NST UTC−3:30)
 *   • DST transitions     (offset is computed at the specific moment)
 *
 * For non-whole-hour offset timezones the computed `scheduledAt` is exact
 * to the minute; no rounding or approximation is applied.
 *
 * ORG SETTINGS
 * ────────────
 * Stored in orgs.payload.quietHoursPolicy (JSONB).
 * Use parseOrgQuietHoursPolicy() to read safely.
 */

import { isStaffRole } from "./guardian-policy";

// ── Emergency reasons ─────────────────────────────────────────────────────────

/**
 * Enumerated emergency reasons a coach may cite when overriding quiet hours.
 * Values are stored verbatim in quiet_hours_log.emergency_reason.
 */
export type EmergencyReason =
  | "medical_emergency"
  | "safety_concern"
  | "weather_cancellation"
  | "urgent_team_matter"
  | "facility_emergency"
  | "other";

export const EMERGENCY_REASON_LABELS: Record<EmergencyReason, string> = {
  medical_emergency:    "Medical Emergency",
  safety_concern:       "Safety or Welfare Concern",
  weather_cancellation: "Weather / Facility Cancellation",
  urgent_team_matter:   "Urgent Team Matter",
  facility_emergency:   "Facility Emergency",
  other:                "Other Emergency",
};

export const VALID_EMERGENCY_REASONS = Object.keys(
  EMERGENCY_REASON_LABELS,
) as EmergencyReason[];

/** Minimum number of characters required in the emergency note field. */
export const EMERGENCY_NOTE_MIN_LENGTH = 10;

// ── Org quiet-hours policy ────────────────────────────────────────────────────

export interface OrgQuietHoursPolicy {
  /** Master switch. When false the policy is not evaluated.  Default: true. */
  enabled:          boolean;
  /**
   * First hour of the allowed window (inclusive), 0–23.
   * Default: 5  (5:00 AM local time).
   */
  allowedStartHour: number;
  /**
   * Last hour before which messages may be sent (exclusive), 0–23.
   * Messages attempted AT this hour or later are outside the window.
   * Default: 21 (9:00 PM local time, so window is 05:00–20:59).
   */
  allowedEndHour:   number;
  /**
   * IANA timezone identifier for the org's primary location.
   * Used to convert UTC send times to local time for window comparison.
   * Default: "America/Chicago".
   */
  timezone:         string;
}

export const DEFAULT_QUIET_HOURS_POLICY: Readonly<OrgQuietHoursPolicy> = {
  enabled:          true,
  allowedStartHour: 5,
  allowedEndHour:   21,
  timezone:         "America/Chicago",
};

/**
 * Reads org quiet-hours settings from the `orgs.payload` JSONB blob.
 * Missing or malformed fields fall back to DEFAULT_QUIET_HOURS_POLICY.
 */
export function parseOrgQuietHoursPolicy(payload: unknown): OrgQuietHoursPolicy {
  if (!payload || typeof payload !== "object") return { ...DEFAULT_QUIET_HOURS_POLICY };
  const p  = payload as Record<string, unknown>;
  const qh = (typeof p.quietHoursPolicy === "object" && p.quietHoursPolicy !== null
    ? p.quietHoursPolicy
    : {}) as Record<string, unknown>;

  const safeInt = (v: unknown, def: number, min: number, max: number): number => {
    if (typeof v !== "number" || !Number.isInteger(v)) return def;
    return Math.min(max, Math.max(min, v));
  };

  return {
    enabled:
      typeof qh.enabled === "boolean" ? qh.enabled : DEFAULT_QUIET_HOURS_POLICY.enabled,
    allowedStartHour: safeInt(qh.allowedStartHour, DEFAULT_QUIET_HOURS_POLICY.allowedStartHour, 0, 23),
    allowedEndHour:   safeInt(qh.allowedEndHour,   DEFAULT_QUIET_HOURS_POLICY.allowedEndHour,   0, 23),
    timezone:
      typeof qh.timezone === "string" && qh.timezone.length > 0
        ? qh.timezone
        : DEFAULT_QUIET_HOURS_POLICY.timezone,
  };
}

// ── Input / output types ──────────────────────────────────────────────────────

export interface EmergencyOverride {
  reason: EmergencyReason;
  /** Free-text note documenting the emergency. Min length: EMERGENCY_NOTE_MIN_LENGTH. */
  note:   string;
}

export interface QuietHoursInput {
  senderRole:          string;
  hasMinorRecipients:  boolean;
  /** The UTC timestamp of the send attempt. Pass `new Date()` in production. */
  attemptedAt:         Date;
  policy:              OrgQuietHoursPolicy;
  /** When present, caller is requesting emergency override. */
  emergencyOverride?:  EmergencyOverride;
}

export type QuietHoursAction = "skipped" | "allowed" | "queued" | "emergency_send";

export interface QuietHoursResult {
  action:             QuietHoursAction;
  /** True when the message should be delivered immediately. */
  sendNow:            boolean;
  /** Set when action = "queued"; the UTC time the message should be released. */
  scheduledAt:        Date | null;
  /** Human-readable local time of the attempt, e.g. "22:14 CST". */
  localOrgTime:       string;
  /** Human-readable policy window, e.g. "05:00–21:00". */
  policyWindow:       string;
  emergencyApproved:  boolean;
  emergencyReason:    EmergencyReason | null;
  emergencyNote:      string | null;
  /**
   * When the emergency override was rejected (reason invalid or note too
   * short), this is non-null and the message is queued instead.
   */
  emergencyRejectedReason: string | null;
}

// ── Timezone helpers ──────────────────────────────────────────────────────────

/**
 * Returns the local hour (0–23) in the given IANA timezone for a UTC date.
 * Falls back to utcDate.getUTCHours() if the timezone is invalid.
 */
export function getLocalHour(utcDate: Date, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour:     "2-digit",
      hour12:   false,
    }).formatToParts(utcDate);
    const h = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
    return h === 24 ? 0 : h; // Intl returns 24 for midnight in some locales
  } catch {
    return utcDate.getUTCHours();
  }
}

/**
 * Returns the local date-parts (year, month 1-indexed, day, hour) in the
 * given IANA timezone for a UTC date.
 */
export function getLocalDateParts(
  utcDate: Date,
  timezone: string,
): { year: number; month: number; day: number; hour: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year:     "numeric",
      month:    "2-digit",
      day:      "2-digit",
      hour:     "2-digit",
      hour12:   false,
    }).formatToParts(utcDate);

    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)!.value, 10);
    const h = get("hour");

    return {
      year:  get("year"),
      month: get("month"),
      day:   get("day"),
      hour:  h === 24 ? 0 : h,
    };
  } catch {
    return {
      year:  utcDate.getUTCFullYear(),
      month: utcDate.getUTCMonth() + 1,
      day:   utcDate.getUTCDate(),
      hour:  utcDate.getUTCHours(),
    };
  }
}

/**
 * Returns a human-readable local-time string in the given timezone.
 * Example output: "22:14 CST"
 */
export function formatLocalTime(utcDate: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone:     timezone,
      hour:         "2-digit",
      minute:       "2-digit",
      hour12:       false,
      timeZoneName: "short",
    }).format(utcDate);
  } catch {
    return utcDate.toISOString();
  }
}

/**
 * Computes the UTC Date at which the next occurrence of `targetHour:00` in
 * `timezone` falls, starting from `utcBase`.
 *
 * If `localHour` at `utcBase` is before `targetHour`: returns the UTC time
 * corresponding to today-local at `targetHour:00`.
 * If `localHour` at `utcBase` is at or after `targetHour`: returns tomorrow-
 * local at `targetHour:00`.
 *
 * The two-step algorithm:
 *   1. Construct `guess1` as Date.UTC(localYear, localMonth, targetDay, targetHour).
 *      This treats the target local datetime as if it were UTC — a deliberate
 *      wrong guess that we correct in step 2.
 *   2. Ask Intl what local hour+minute `guess1` corresponds to.  The difference
 *      between that and `targetHour` gives the UTC offset in minutes.
 *   3. Subtract the offset from `guess1` to get the correct UTC time.
 *
 * Handles whole-hour and non-whole-hour (e.g. +5:30, −3:30) UTC offsets
 * correctly.  DST transitions are handled because the offset is computed at
 * the specific target moment (not the current moment).
 */
export function getNextWindowOpenUtc(
  utcBase: Date,
  targetHour: number,
  timezone: string,
): Date {
  const localParts = getLocalDateParts(utcBase, timezone);
  const { year, month, day, hour: localHour } = localParts;

  // Use "today" local when before targetHour, "tomorrow" local otherwise.
  const addDay = localHour >= targetHour ? 1 : 0;

  // Step 1: construct guess treating local date/time as UTC.
  // Adding addDay days via Date.UTC handles month/year overflow automatically.
  const guess1 = new Date(Date.UTC(year, month - 1, day + addDay, targetHour, 0, 0));

  // Step 2: measure the UTC offset at guess1 (in minutes).
  let localHourAtGuess: number;
  let localMinAtGuess:  number;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour:     "2-digit",
      minute:   "2-digit",
      hour12:   false,
    }).formatToParts(guess1);
    const rawHour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
    localHourAtGuess = rawHour === 24 ? 0 : rawHour;
    localMinAtGuess  = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  } catch {
    // Timezone invalid — fall back to a UTC-based estimate.
    return new Date(guess1.getTime());
  }

  const guess1UtcMin     = guess1.getUTCHours() * 60 + guess1.getUTCMinutes();
  const localTotalMin    = localHourAtGuess * 60 + localMinAtGuess;
  const targetTotalMin   = targetHour * 60;

  // diff = local − UTC (the UTC offset of the timezone at guess1).
  let diffMin = localTotalMin - guess1UtcMin;

  // Normalise for midnight crossing (diff cannot exceed ±12 hours = ±720 min).
  if (diffMin > 720)  diffMin -= 1440;
  if (diffMin < -720) diffMin += 1440;

  // Step 3: subtract the offset to get the true UTC time.
  return new Date(guess1.getTime() - diffMin * 60_000);
}

// ── Core enforcement function ─────────────────────────────────────────────────

/**
 * Evaluates the quiet-hours policy for a pending send attempt.
 *
 * Call this AFTER layers 1 and 2 have passed, when you know whether the
 * thread contains minor recipients.  Pass the result to the route handler
 * to decide whether to deliver immediately or queue, and to write the
 * `quiet_hours_log` audit row.
 *
 * @example
 * ```ts
 * const qhResult = enforceQuietHours({
 *   senderRole:         ctx.role,
 *   hasMinorRecipients: guardianPolicy.minorPlayerIds.length > 0,
 *   attemptedAt:        new Date(),
 *   policy:             orgQuietHoursPolicy,
 *   emergencyOverride:  req.body.emergencyOverride,
 * });
 *
 * if (!qhResult.sendNow) {
 *   // store message with scheduledAt = qhResult.scheduledAt
 *   return res.status(202).json({ scheduledAt: qhResult.scheduledAt });
 * }
 * // proceed with immediate send
 * ```
 */
export function enforceQuietHours(input: QuietHoursInput): QuietHoursResult {
  const { senderRole, hasMinorRecipients, attemptedAt, policy, emergencyOverride } = input;

  const policyWindow = `${String(policy.allowedStartHour).padStart(2, "0")}:00–${String(policy.allowedEndHour).padStart(2, "0")}:00`;
  const localOrgTime = formatLocalTime(attemptedAt, policy.timezone);

  // ── Fast path: policy does not apply ────────────────────────────────────────
  if (!isStaffRole(senderRole) || !hasMinorRecipients || !policy.enabled) {
    return {
      action:                  "skipped",
      sendNow:                 true,
      scheduledAt:             null,
      localOrgTime,
      policyWindow,
      emergencyApproved:       false,
      emergencyReason:         null,
      emergencyNote:           null,
      emergencyRejectedReason: null,
    };
  }

  // ── Check whether we are inside the allowed window ───────────────────────
  const localHour = getLocalHour(attemptedAt, policy.timezone);
  const inWindow  = localHour >= policy.allowedStartHour && localHour < policy.allowedEndHour;

  if (inWindow) {
    return {
      action:                  "allowed",
      sendNow:                 true,
      scheduledAt:             null,
      localOrgTime,
      policyWindow,
      emergencyApproved:       false,
      emergencyReason:         null,
      emergencyNote:           null,
      emergencyRejectedReason: null,
    };
  }

  // ── Outside allowed window ────────────────────────────────────────────────

  // Validate and apply emergency override if one was supplied.
  if (emergencyOverride) {
    const { reason, note } = emergencyOverride;

    if (!VALID_EMERGENCY_REASONS.includes(reason as EmergencyReason)) {
      // Invalid reason — treat as queued and note the rejection.
      return {
        action:                  "queued",
        sendNow:                 false,
        scheduledAt:             getNextWindowOpenUtc(attemptedAt, policy.allowedStartHour, policy.timezone),
        localOrgTime,
        policyWindow,
        emergencyApproved:       false,
        emergencyReason:         null,
        emergencyNote:           null,
        emergencyRejectedReason: `Invalid emergency reason "${String(reason)}". Must be one of: ${VALID_EMERGENCY_REASONS.join(", ")}.`,
      };
    }

    const trimmedNote = (note ?? "").trim();
    if (trimmedNote.length < EMERGENCY_NOTE_MIN_LENGTH) {
      return {
        action:                  "queued",
        sendNow:                 false,
        scheduledAt:             getNextWindowOpenUtc(attemptedAt, policy.allowedStartHour, policy.timezone),
        localOrgTime,
        policyWindow,
        emergencyApproved:       false,
        emergencyReason:         null,
        emergencyNote:           null,
        emergencyRejectedReason: `Emergency note must be at least ${EMERGENCY_NOTE_MIN_LENGTH} characters (got ${trimmedNote.length}).`,
      };
    }

    // Override accepted — send immediately.
    return {
      action:                  "emergency_send",
      sendNow:                 true,
      scheduledAt:             null,
      localOrgTime,
      policyWindow,
      emergencyApproved:       true,
      emergencyReason:         reason as EmergencyReason,
      emergencyNote:           trimmedNote,
      emergencyRejectedReason: null,
    };
  }

  // No override — queue for next window open.
  return {
    action:                  "queued",
    sendNow:                 false,
    scheduledAt:             getNextWindowOpenUtc(attemptedAt, policy.allowedStartHour, policy.timezone),
    localOrgTime,
    policyWindow,
    emergencyApproved:       false,
    emergencyReason:         null,
    emergencyNote:           null,
    emergencyRejectedReason: null,
  };
}
