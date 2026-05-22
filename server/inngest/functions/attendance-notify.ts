import { inngest } from "../client";
import { sendSms } from "../../lib/twilio";

export const attendanceNotifyFn = inngest.createFunction(
  { id: "attendance-notify", name: "Attendance → Parent Notification" },
  { event: "attendance/submitted" },
  async ({ event, step }) => {
    const { eventTitle, eventDate, absentPlayers } = event.data;

    const results = await step.run("send-parent-sms", async () => {
      const sent: string[] = [];
      for (const player of absentPlayers) {
        if (player.parentPhone) {
          await sendSms(
            player.parentPhone,
            `HoopsIQ: ${player.playerName} was marked absent for ${eventTitle} on ${eventDate}. Questions? Reply to contact your coach.`
          );
          sent.push(player.playerId);
        }
      }
      return sent;
    });

    return { notified: results };
  }
);
