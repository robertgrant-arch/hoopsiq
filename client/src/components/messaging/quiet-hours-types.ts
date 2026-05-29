/**
 * Client-side mirror of the quiet-hours policy types defined in
 * server/modules/messaging/quiet-hours-policy.ts.
 *
 * Keep in sync with the server-side EMERGENCY_REASON_LABELS and
 * EMERGENCY_NOTE_MIN_LENGTH constants.  These are intentionally duplicated
 * (rather than imported from the server module) to keep the client bundle
 * free of server-only dependencies.
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

/** Must match server-side EMERGENCY_NOTE_MIN_LENGTH. */
export const EMERGENCY_NOTE_MIN_LENGTH = 10;

/** Shape of the emergency override payload sent to POST /api/messages/compose. */
export interface EmergencyOverride {
  reason: EmergencyReason;
  note:   string;
}

/** Shape of the quietHours block in the compose response (201 or 202). */
export interface QuietHoursResponsePolicy {
  action:                   string;   // "skipped"|"allowed"|"queued"|"emergency_send"
  sendNow:                  boolean;
  scheduledAt:              string | null;
  localOrgTime:             string;
  policyWindow:             string;
  emergencyApproved:        boolean;
  emergencyRejectedReason?: string;
}
