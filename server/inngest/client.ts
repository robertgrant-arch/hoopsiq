import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "hoopsos",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Event type definitions
export type HoopsIQEvents = {
  "film/asset.ready": {
    data: {
      sessionId: string;
      orgId: string;
      muxAssetId: string;
      muxPlaybackId: string;
      durationSecs: number;
    };
  };
  "readiness/flagged": {
    data: {
      checkinId: string;
      orgId: string;
      playerId: string;
      playerName: string;
      coachUserId: string;
      fatigue: number;
      sleep: number;
      soreness: number;
      note?: string;
    };
  };
  "attendance/submitted": {
    data: {
      eventId: string;
      orgId: string;
      eventTitle: string;
      eventDate: string;
      absentPlayers: Array<{ playerId: string; playerName: string; parentPhone?: string; parentEmail?: string }>;
      coachUserId: string;
    };
  };
  "assignment/overdue": {
    data: {
      assignmentId: string;
      orgId: string;
      playerId: string;
      playerName: string;
      title: string;
      daysOverdue: number;
      parentPhone?: string;
    };
  };
  "coaching-action/created": {
    data: {
      actionId: string;
      orgId: string;
      actionType: string;
      playerId: string | null;
      sessionId: string;
      coachNote?: string;
      issueCategory?: string;
      authorUserId: string;
    };
  };
};
