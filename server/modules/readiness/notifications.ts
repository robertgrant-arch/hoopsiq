/**
 * Readiness-domain notification helpers.
 *
 * These functions know about readiness concepts (coaches, players, flags).
 * The underlying SMS transport lives in server/lib/sms.ts.
 */
import { sendSms } from "../../lib/sms";

export async function sendCoachAlert(params: {
  coachUserId: string;
  orgId: string;
  subject: string;
  message: string;
  link?: string;
}) {
  // In production: look up coach phone from org_members and send SMS
  // For now: structured console log for observability
  console.log(`[COACH ALERT] ${params.subject}: ${params.message}`);
}

export async function sendParentNotification(params: {
  parentPhone?: string;
  playerName: string;
  message: string;
}) {
  if (params.parentPhone) {
    await sendSms(params.parentPhone, params.message);
  }
}
