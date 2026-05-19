/**
 * features/film-feedback/types.ts
 *
 * Bridge types for the Film Feedback → Rep Plan slice.
 *
 * A FilmRepPlan is a normalized view of a coaching_action row, enriched
 * with parsed drill data and human-readable status. It does not introduce
 * new DB entities — it is a client-side projection of existing data.
 *
 * Source table: coaching_actions
 * Action types covered: recommend_drill | assign_clip | request_reupload
 */

// ── Status ────────────────────────────────────────────────────────────────────
//
// Maps from coaching_action.status (open | in_progress | resolved | dismissed)
// to player-facing language.

export type RepPlanStatus =
  | "assigned"       // coaching_action.status === "open"
  | "in_progress"    // coaching_action.status === "in_progress"
  | "completed"      // coaching_action.status === "resolved" (player self-marked)
  | "coach_reviewed";// coaching_action.status === "resolved" (coach closed loop)

export type FilmActionType =
  | "recommend_drill"    // drill prescription from film clip
  | "assign_clip"        // watch this clip, respond
  | "request_reupload";  // re-record and re-submit

// ── Film context ──────────────────────────────────────────────────────────────
//
// Sourced from coaching_action fields: sessionId, timestampMs, issueCategory.
// sessionTitle is enriched on the client using known session data or a
// fallback label while the session API is wired up.

export type FilmContext = {
  sessionId:    string;
  sessionTitle: string;   // "Barnegat vs. Toms River — Game Film"
  timestamp:    string | null;  // formatted: "1:23", null if none
  clipHref:     string | null;  // deep-link to clip player (null = not available yet)
};

// ── Drill prescription ────────────────────────────────────────────────────────
//
// Parsed from coaching_action.coachNote for recommend_drill type.
// ClipActionBar writes notes in format: "Drill Name — reps/sets"
// e.g. "Mikan Drill — 5 sets of 10"

export type DrillPrescription = {
  title: string;  // "Mikan Drill"
  reps:  string;  // "5 sets of 10"
};

// ── FilmRepPlan — the normalized bridge entity ────────────────────────────────

export type FilmRepPlan = {
  id:          string;         // coaching_action.id
  actionType:  FilmActionType;
  status:      RepPlanStatus;
  film:        FilmContext;
  skillCategory: string;       // coaching_action.issueCategory — "Finishing", "Release" …
  coachNote:   string;         // coaching_action.coachNote (full text)
  drill:       DrillPrescription | null;  // null for assign_clip / request_reupload
  createdAt:   string;
};

// ── Status transition ─────────────────────────────────────────────────────────
//
// Defines which status transitions the player can trigger.
// Coach-triggered transitions (resolved via ClipActionBar) are not listed here.

export const PLAYER_STATUS_TRANSITIONS: Record<
  RepPlanStatus,
  RepPlanStatus | null
> = {
  assigned:      "in_progress",    // player starts
  in_progress:   "completed",      // player finishes
  completed:     null,             // awaiting coach review — no further player action
  coach_reviewed: null,            // loop closed
};

// ── Server-to-client status mapping ──────────────────────────────────────────

export function mapServerStatus(
  serverStatus: "open" | "in_progress" | "resolved" | "dismissed",
  resolvedNote?: string | null,
): RepPlanStatus {
  switch (serverStatus) {
    case "open":         return "assigned";
    case "in_progress":  return "in_progress";
    case "resolved":
      // resolvedNote="player_completed" → player marked done, awaiting coach
      // any other resolvedNote → coach closed the loop
      return resolvedNote === "player_completed" ? "completed" : "coach_reviewed";
    case "dismissed":    return "coach_reviewed"; // treated as closed for player view
  }
}

// ── DrillPrescription parser ──────────────────────────────────────────────────
//
// ClipActionBar coachNote format for recommend_drill:
//   "Drill Name — reps/sets"
//   "Drill Name — reps/sets" (dash may be en-dash or em-dash)
//
// Falls back gracefully: if no dash separator found, entire note = title.

export function parseDrillFromNote(coachNote: string): DrillPrescription {
  const sep = coachNote.match(/ [—–-] /);
  if (sep) {
    const idx = coachNote.indexOf(sep[0]);
    return {
      title: coachNote.slice(0, idx).trim(),
      reps:  coachNote.slice(idx + sep[0].length).trim(),
    };
  }
  return { title: coachNote.trim(), reps: "" };
}

// ── Timestamp formatter ───────────────────────────────────────────────────────

export function formatTimestampMs(ms: number | null | undefined): string | null {
  if (ms == null) return null;
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}
