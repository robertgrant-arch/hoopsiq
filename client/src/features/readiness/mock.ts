/**
 * Readiness feature — mock / seed data for development and demo mode.
 * Replace with real API calls (useTeamReadinessToday) in connected environments.
 */
import type { PlayerReadiness } from "./types";

export const MOCK_TEAM_READINESS: PlayerReadiness[] = [
  {
    playerId: "p1", playerName: "Marcus Johnson", position: "PG", jerseyNumber: "3",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "high",
    reasons: ["fatigue_high", "soreness_high"],
    summary: "High fatigue reported; High soreness reported",
  },
  {
    playerId: "p2", playerName: "DeShawn Williams", position: "SG", jerseyNumber: "5",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p3", playerName: "Tyler Brooks", position: "SF", jerseyNumber: "11",
    checkinSubmitted: false,
    status: "RESTRICTED", confidence: "high",
    reasons: ["injury_active"],
    summary: "Active injury on file",
  },
  {
    playerId: "p4", playerName: "Jordan Davis", position: "PF", jerseyNumber: "21",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "medium",
    reasons: ["sleep_low", "injury_monitoring"],
    summary: "Low sleep reported; Injury under monitoring",
  },
  {
    playerId: "p5", playerName: "Elijah Carter", position: "C", jerseyNumber: "34",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p6", playerName: "Jaylen Scott", position: "PG", jerseyNumber: "1",
    checkinSubmitted: false,
    status: "UNKNOWN", confidence: "none",
    reasons: ["no_data"],
    summary: "No recent data — readiness unknown",
  },
  {
    playerId: "p7", playerName: "Cam Porter", position: "SG", jerseyNumber: "13",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "low",
    reasons: ["workload_overload"],
    summary: "High 7-day workload load",
  },
  {
    playerId: "p8", playerName: "Noah Rivera", position: "SF", jerseyNumber: "23",
    checkinSubmitted: true,
    status: "READY", confidence: "medium",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p9", playerName: "Darius Thomas", position: "C", jerseyNumber: "42",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p10", playerName: "Malik Henderson", position: "PF", jerseyNumber: "32",
    checkinSubmitted: false,
    status: "FLAGGED", confidence: "low",
    reasons: ["attendance_streak_missed"],
    summary: "Consecutive unexcused absences",
  },
  {
    playerId: "p11", playerName: "Trey Evans", position: "PG", jerseyNumber: "7",
    checkinSubmitted: true,
    status: "READY", confidence: "high",
    reasons: [],
    summary: "Ready to practice",
  },
  {
    playerId: "p12", playerName: "Brandon Lee", position: "SG", jerseyNumber: "15",
    checkinSubmitted: true,
    status: "FLAGGED", confidence: "high",
    reasons: ["wearable_recovery_low"],
    summary: "Low wearable recovery score",
  },
];
