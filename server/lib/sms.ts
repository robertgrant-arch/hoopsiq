import twilio from "twilio";

let twilioClient: twilio.Twilio | null = null;

function getClient() {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error("Twilio credentials not configured");
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER not set");

  // Normalize to E.164 if needed
  const normalized = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`;

  await getClient().messages.create({ to: normalized, from, body });
}

export async function sendBroadcastSms(recipients: string[], body: string): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    try {
      await sendSms(recipient, body);
      sent++;
    } catch (err) {
      console.error(`SMS failed to ${recipient}:`, err);
      failed++;
    }
  }
  return { sent, failed };
}
