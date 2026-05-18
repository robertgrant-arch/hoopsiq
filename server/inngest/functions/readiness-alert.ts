import { inngest } from "../client";
import { sendCoachAlert } from "../../modules/readiness/notifications";

export const readinessAlertFn = inngest.createFunction(
  { id: "readiness-alert", name: "Readiness Flag → Coach Alert" },
  { event: "readiness/flagged" },
  async ({ event, step }) => {
    const { playerName, fatigue, sleep, soreness, note, coachUserId, orgId } = event.data;

    await step.run("notify-coach", async () => {
      const reasons = [];
      if (fatigue >= 7) reasons.push(`fatigue ${fatigue}/10`);
      if (sleep <= 5) reasons.push(`sleep ${sleep}h`);
      if (soreness >= 7) reasons.push(`soreness ${soreness}/10`);

      await sendCoachAlert({
        coachUserId,
        orgId,
        subject: `Readiness flag: ${playerName}`,
        message: `${playerName} flagged this morning — ${reasons.join(", ")}.${note ? ` Note: "${note}"` : ""} Consider modifying today's workout.`,
        link: `/app/coach`,
      });
    });

    return { notified: coachUserId };
  }
);
