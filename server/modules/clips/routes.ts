/**
 * Film Room v2 API — coach-created clip assignments.
 * Spec: docs/film-room-schema-api.md · mounted at /api/film-room
 *
 * Coach (requireOrgRole coach/owner/admin):
 *   GET    /sessions/:sessionId/clips
 *   POST   /sessions/:sessionId/clips
 *   PATCH  /clips/:id                    (409 CLIP_LOCKED on locked bounds/note)
 *   DELETE /clips/:id                    (soft)
 *   POST   /clips/:id/assignments        { playerIds, dueAt?, requireResponse, responsePrompt?, send }
 *   GET    /assignments                  queue query + summary
 *   GET    /assignment-players/:id       detail (clip, reviews, followups, events)
 *   POST   /assignment-players/:id/followups { kind, body?, meta? }
 *   POST   /assignment-players/:id/escalate  { focusArea, note? }
 *   GET    /attention                    landing strip counts
 *
 * Player (own rows only):
 *   GET    /my/assignments
 *   POST   /assignment-players/:id/progress { watchPct }
 *   POST   /assignment-players/:id/review    { kind, textBody?, ... }
 */

import type { Express, Request, Response } from "express";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@shared/db";
import {
  clips,
  clipPlayers,
  clipAssignments,
  clipAssignmentPlayers,
  playerReviews,
  coachFollowups,
  clipIdpLinks,
  filmAuditEvents,
  filmSessions,
  players,
} from "@shared/db";
import { requireOrg, requireOrgRole, HttpError } from "../../auth/tenant";

const COACH_ROLES = ["coach", "owner", "admin"] as const;

function fail(res: Response, e: unknown) {
  if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("CLIP_LOCKED")) {
    return res.status(409).json({ error: "Sent clips can't be edited — duplicate to edit.", code: "CLIP_LOCKED" });
  }
  console.error("[film-room]", e);
  return res.status(500).json({ error: "Internal error" });
}

async function audit(
  orgId: string,
  actorId: string | null,
  actorKind: string,
  entityType: string,
  entityId: string,
  action: string,
  detail: Record<string, unknown> = {},
) {
  try {
    await getDb().insert(filmAuditEvents).values({
      orgId, actorId, actorKind, entityType, entityId, action, detail,
    });
  } catch (e) {
    console.error("[film-room] audit write failed:", e);
  }
}

async function loadPlayersMap(orgId: string, ids: string[]) {
  if (!ids.length) return new Map<string, { id: string; name: string; position: string | null }>();
  const db = getDb();
  const rows = await db
    .select({ id: players.id, name: players.name, position: players.position })
    .from(players)
    .where(and(eq(players.orgId, orgId), inArray(players.id, ids)));
  return new Map(rows.map((r) => [r.id, r]));
}

export function registerClipRoutes(app: Express): void {
  // ── Clips ────────────────────────────────────────────────────────────────

  app.get("/api/film-room/sessions/:sessionId/clips", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db = getDb();
      const rows = await db
        .select()
        .from(clips)
        .where(and(
          eq(clips.sessionId, req.params.sessionId),
          eq(clips.orgId, ctx.orgId),
          isNull(clips.deletedAt),
        ))
        .orderBy(clips.startMs);
      const tagRows = rows.length
        ? await db.select().from(clipPlayers).where(inArray(clipPlayers.clipId, rows.map((r) => r.id)))
        : [];
      const tags = new Map<string, string[]>();
      for (const t of tagRows) {
        tags.set(t.clipId, [...(tags.get(t.clipId) ?? []), t.playerId]);
      }
      res.json(rows.map((c) => ({ ...c, playerIds: tags.get(c.id) ?? [] })));
    } catch (e) { fail(res, e); }
  });

  app.post("/api/film-room/sessions/:sessionId/clips", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ...COACH_ROLES);
      const db = getDb();
      const [session] = await db.select({ id: filmSessions.id }).from(filmSessions)
        .where(and(eq(filmSessions.id, req.params.sessionId), isNull(filmSessions.deletedAt)))
        .limit(1);
      if (!session) throw new HttpError(404, "Film not found");

      const startMs = Math.max(0, Number(req.body?.startMs ?? 0));
      const endMs = Number(req.body?.endMs ?? 0);
      if (!(endMs > startMs)) throw new HttpError(400, "endMs must be greater than startMs");

      const [clip] = await db.insert(clips).values({
        orgId: ctx.orgId,
        sessionId: session.id,
        createdBy: ctx.userId,
        source: req.body?.source === "ai_accepted" ? "ai_accepted" : "coach",
        startMs,
        endMs,
        title: String(req.body?.title ?? ""),
        note: String(req.body?.note ?? ""),
        categories: Array.isArray(req.body?.categories) ? req.body.categories : [],
        priority: ["low", "normal", "high"].includes(req.body?.priority) ? req.body.priority : "normal",
      }).returning();

      const playerIds: string[] = Array.isArray(req.body?.playerIds) ? req.body.playerIds : [];
      if (playerIds.length) {
        await db.insert(clipPlayers)
          .values(playerIds.map((p) => ({ clipId: clip.id, playerId: p })))
          .onConflictDoNothing();
      }
      await audit(ctx.orgId, ctx.userId, "coach", "clip", clip.id, "created", { startMs, endMs });
      res.status(201).json({ ...clip, playerIds });
    } catch (e) { fail(res, e); }
  });

  app.patch("/api/film-room/clips/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ...COACH_ROLES);
      const db = getDb();
      const [existing] = await db.select().from(clips)
        .where(and(eq(clips.id, req.params.id), eq(clips.orgId, ctx.orgId), isNull(clips.deletedAt)))
        .limit(1);
      if (!existing) throw new HttpError(404, "Clip not found");

      const patch: Partial<typeof clips.$inferInsert> = { updatedAt: new Date() };
      for (const k of ["title", "note", "priority"] as const) {
        if (typeof req.body?.[k] === "string") (patch as any)[k] = req.body[k];
      }
      if (patch.note !== undefined && patch.note !== existing.note) {
        patch.noteSource = existing.noteSource === "ai_draft_accepted" ? "ai_draft_edited" : existing.noteSource;
      }
      if (Array.isArray(req.body?.categories)) patch.categories = req.body.categories;
      if (typeof req.body?.startMs === "number") patch.startMs = req.body.startMs;
      if (typeof req.body?.endMs === "number") patch.endMs = req.body.endMs;
      if (req.body?.status === "approved" && existing.status === "draft") patch.status = "approved";
      if (req.body?.status === "archived") patch.status = "archived";
      if (req.body?.noteSource === "ai_draft_accepted" && existing.note === "") {
        patch.noteSource = "ai_draft_accepted";
      }

      const [updated] = await db.update(clips).set(patch)
        .where(eq(clips.id, existing.id)).returning();

      if (Array.isArray(req.body?.playerIds)) {
        await db.delete(clipPlayers).where(eq(clipPlayers.clipId, existing.id));
        if (req.body.playerIds.length) {
          await db.insert(clipPlayers)
            .values(req.body.playerIds.map((p: string) => ({ clipId: existing.id, playerId: p })))
            .onConflictDoNothing();
        }
      }
      if (patch.status && patch.status !== existing.status) {
        await audit(ctx.orgId, ctx.userId, "coach", "clip", existing.id, "status_changed",
          { from: existing.status, to: patch.status });
      }
      const tagRows = await db.select().from(clipPlayers).where(eq(clipPlayers.clipId, existing.id));
      res.json({ ...updated, playerIds: tagRows.map((t) => t.playerId) });
    } catch (e) { fail(res, e); }
  });

  app.delete("/api/film-room/clips/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ...COACH_ROLES);
      const db = getDb();
      const [existing] = await db.select().from(clips)
        .where(and(eq(clips.id, req.params.id), eq(clips.orgId, ctx.orgId), isNull(clips.deletedAt)))
        .limit(1);
      if (!existing) throw new HttpError(404, "Clip not found");
      if (existing.lockedAt) throw new HttpError(409, "Sent clips can't be deleted — archive instead.");
      await db.update(clips).set({ deletedAt: new Date() }).where(eq(clips.id, existing.id));
      await audit(ctx.orgId, ctx.userId, "coach", "clip", existing.id, "deleted");
      res.json({ ok: true });
    } catch (e) { fail(res, e); }
  });

  // ── Assign ───────────────────────────────────────────────────────────────

  app.post("/api/film-room/clips/:id/assignments", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ...COACH_ROLES);
      const db = getDb();
      const [clip] = await db.select().from(clips)
        .where(and(eq(clips.id, req.params.id), eq(clips.orgId, ctx.orgId), isNull(clips.deletedAt)))
        .limit(1);
      if (!clip) throw new HttpError(404, "Clip not found");
      if (clip.status !== "approved" && clip.status !== "assigned") {
        throw new HttpError(400, "Only approved clips can be sent");
      }
      const playerIds: string[] = Array.isArray(req.body?.playerIds) ? req.body.playerIds : [];
      if (!playerIds.length) throw new HttpError(400, "At least one player is required");
      const send = req.body?.send !== false;

      const [assignment] = await db.insert(clipAssignments).values({
        orgId: ctx.orgId,
        clipId: clip.id,
        assignedBy: ctx.userId,
        dueAt: req.body?.dueAt ? new Date(req.body.dueAt) : null,
        priority: ["low", "normal", "high"].includes(req.body?.priority) ? req.body.priority : "normal",
        requireResponse: req.body?.requireResponse !== false,
        responsePrompt: typeof req.body?.responsePrompt === "string" ? req.body.responsePrompt : null,
        sentAt: send ? new Date() : null,
      }).returning();

      const rows = await db.insert(clipAssignmentPlayers).values(
        playerIds.map((p) => ({
          orgId: ctx.orgId,
          assignmentId: assignment.id,
          playerId: p,
          status: (send ? "assigned" : "draft") as any,
        })),
      ).onConflictDoNothing().returning();

      if (send) {
        await db.update(clips)
          .set({ status: "assigned", lockedAt: clip.lockedAt ?? new Date(), updatedAt: new Date() })
          .where(eq(clips.id, clip.id));
      }
      await audit(ctx.orgId, ctx.userId, "coach", "assignment", assignment.id,
        send ? "sent" : "drafted", { players: playerIds.length, clipId: clip.id });
      res.status(201).json({ assignment, players: rows });
    } catch (e) { fail(res, e); }
  });

  // ── Queue ────────────────────────────────────────────────────────────────

  app.get("/api/film-room/assignments", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db = getDb();
      const isCoach = COACH_ROLES.includes(ctx.role as any);

      const conds = [eq(clipAssignmentPlayers.orgId, ctx.orgId)] as any[];
      if (!isCoach) {
        // players see only their own rows (players.id keyed by user via payload
        // or matching userId — resolve the caller's player row)
        const [me] = await db.select({ id: players.id }).from(players)
          .where(and(eq(players.orgId, ctx.orgId), eq(players.userId, ctx.userId)))
          .limit(1);
        if (!me) return res.json({ rows: [], summary: null });
        conds.push(eq(clipAssignmentPlayers.playerId, me.id));
      }
      if (typeof req.query.player === "string") conds.push(eq(clipAssignmentPlayers.playerId, req.query.player));
      if (typeof req.query.status === "string") {
        conds.push(eq(clipAssignmentPlayers.status, req.query.status as any));
      }

      const rows = await db
        .select({
          ap: clipAssignmentPlayers,
          assignment: clipAssignments,
          clip: clips,
          sessionTitle: filmSessions.title,
        })
        .from(clipAssignmentPlayers)
        .innerJoin(clipAssignments, eq(clipAssignmentPlayers.assignmentId, clipAssignments.id))
        .innerJoin(clips, eq(clipAssignments.clipId, clips.id))
        .innerJoin(filmSessions, eq(clips.sessionId, filmSessions.id))
        .where(and(...conds))
        .orderBy(desc(clipAssignmentPlayers.createdAt))
        .limit(200);

      const pmap = await loadPlayersMap(ctx.orgId, rows.map((r) => r.ap.playerId));
      const now = Date.now();
      const out = rows.map((r) => ({
        id: r.ap.id,
        status: r.ap.status,
        overdue:
          !!r.assignment.dueAt &&
          r.assignment.dueAt.getTime() < now &&
          ["assigned", "opened", "watched"].includes(r.ap.status),
        player: pmap.get(r.ap.playerId) ?? { id: r.ap.playerId, name: "Unknown", position: null },
        clip: {
          id: r.clip.id, title: r.clip.title, startMs: r.clip.startMs, endMs: r.clip.endMs,
          categories: r.clip.categories, priority: r.clip.priority, sessionId: r.clip.sessionId,
        },
        sessionTitle: r.sessionTitle,
        assignedBy: r.assignment.assignedBy,
        dueAt: r.assignment.dueAt,
        requireResponse: r.assignment.requireResponse,
        responsePrompt: r.assignment.responsePrompt,
        sentAt: r.assignment.sentAt,
        openedAt: r.ap.openedAt,
        watchedAt: r.ap.watchedAt,
        watchPct: r.ap.watchPct,
        respondedAt: r.ap.respondedAt,
        completedAt: r.ap.completedAt,
        reviewRequested: r.ap.reviewRequested,
        nudgeCount: r.ap.nudgeCount,
      }));

      const summary = isCoach
        ? {
            active: out.filter((r) => !["completed", "archived", "draft"].includes(r.status)).length,
            watched: out.filter((r) => ["watched", "responded", "completed"].includes(r.status)).length,
            responded: out.filter((r) => ["responded", "completed"].includes(r.status)).length,
            overdue: out.filter((r) => r.overdue).length,
          }
        : null;
      res.json({ rows: out, summary });
    } catch (e) { fail(res, e); }
  });

  app.get("/api/film-room/assignment-players/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const db = getDb();
      const [row] = await db.select().from(clipAssignmentPlayers)
        .where(and(eq(clipAssignmentPlayers.id, req.params.id), eq(clipAssignmentPlayers.orgId, ctx.orgId)))
        .limit(1);
      if (!row) throw new HttpError(404, "Assignment not found");
      const isCoach = COACH_ROLES.includes(ctx.role as any);
      if (!isCoach) {
        const [me] = await db.select({ id: players.id }).from(players)
          .where(and(eq(players.orgId, ctx.orgId), eq(players.userId, ctx.userId))).limit(1);
        if (!me || me.id !== row.playerId) throw new HttpError(403, "Not your assignment");
      }
      const [assignment] = await db.select().from(clipAssignments)
        .where(eq(clipAssignments.id, row.assignmentId)).limit(1);
      const [clip] = await db.select().from(clips).where(eq(clips.id, assignment.clipId)).limit(1);
      const [session] = await db.select().from(filmSessions).where(eq(filmSessions.id, clip.sessionId)).limit(1);
      const reviews = await db.select().from(playerReviews)
        .where(eq(playerReviews.assignmentPlayerId, row.id)).orderBy(playerReviews.createdAt);
      const followups = await db.select().from(coachFollowups)
        .where(eq(coachFollowups.assignmentPlayerId, row.id)).orderBy(coachFollowups.createdAt);
      const events = await db.select().from(filmAuditEvents)
        .where(and(eq(filmAuditEvents.entityType, "assignment_player"), eq(filmAuditEvents.entityId, row.id)))
        .orderBy(filmAuditEvents.createdAt);
      const pmap = await loadPlayersMap(ctx.orgId, [row.playerId]);
      res.json({
        ...row,
        player: pmap.get(row.playerId) ?? null,
        assignment, clip, session: { id: session?.id, title: session?.title, kind: session?.kind },
        reviews, followups, events,
      });
    } catch (e) { fail(res, e); }
  });

  // ── Player actions ───────────────────────────────────────────────────────

  async function ownAssignmentPlayer(req: Request, ctx: { orgId: string; userId: string }) {
    const db = getDb();
    const [row] = await db.select().from(clipAssignmentPlayers)
      .where(and(eq(clipAssignmentPlayers.id, req.params.id), eq(clipAssignmentPlayers.orgId, ctx.orgId)))
      .limit(1);
    if (!row) throw new HttpError(404, "Assignment not found");
    const [me] = await db.select({ id: players.id }).from(players)
      .where(and(eq(players.orgId, ctx.orgId), eq(players.userId, ctx.userId))).limit(1);
    if (!me || me.id !== row.playerId) throw new HttpError(403, "Not your assignment");
    return row;
  }

  app.post("/api/film-room/assignment-players/:id/progress", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const row = await ownAssignmentPlayer(req, ctx);
      const db = getDb();
      const pct = Math.min(100, Math.max(0, Number(req.body?.watchPct ?? 0)));
      const patch: Partial<typeof clipAssignmentPlayers.$inferInsert> = {
        watchPct: Math.max(row.watchPct, pct) as any,
        updatedAt: new Date(),
      };
      if (!row.openedAt) {
        patch.openedAt = new Date();
        if (row.status === "assigned") patch.status = "opened" as any;
      }
      if (pct >= 90 && !row.watchedAt) {
        patch.watchedAt = new Date();
        if (["assigned", "opened"].includes(row.status)) patch.status = "watched" as any;
        await audit(ctx.orgId, ctx.userId, "player", "assignment_player", row.id, "watched", { pct });
      }
      const [updated] = await db.update(clipAssignmentPlayers).set(patch)
        .where(eq(clipAssignmentPlayers.id, row.id)).returning();
      res.json(updated);
    } catch (e) { fail(res, e); }
  });

  app.post("/api/film-room/assignment-players/:id/review", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const row = await ownAssignmentPlayer(req, ctx);
      const db = getDb();
      const kind = String(req.body?.kind ?? "text");
      if (!["text", "choice", "confidence", "flag_review_request"].includes(kind)) {
        throw new HttpError(400, "Invalid response kind");
      }
      const [review] = await db.insert(playerReviews).values({
        orgId: ctx.orgId,
        assignmentPlayerId: row.id,
        authorUserId: ctx.userId,
        kind,
        textBody: typeof req.body?.textBody === "string" ? req.body.textBody.slice(0, 500) : null,
        choiceIndex: typeof req.body?.choiceIndex === "number" ? req.body.choiceIndex : null,
        confidence: typeof req.body?.confidence === "number" ? req.body.confidence : null,
        clientCreatedAt: req.body?.clientCreatedAt ? new Date(req.body.clientCreatedAt) : null,
      }).returning();

      const patch: Partial<typeof clipAssignmentPlayers.$inferInsert> = { updatedAt: new Date() };
      if (kind === "flag_review_request") {
        patch.reviewRequested = true;
      } else if (!row.respondedAt) {
        patch.respondedAt = new Date();
        if (["assigned", "opened", "watched"].includes(row.status)) patch.status = "responded" as any;
      }
      await db.update(clipAssignmentPlayers).set(patch).where(eq(clipAssignmentPlayers.id, row.id));
      await audit(ctx.orgId, ctx.userId, "player", "assignment_player", row.id, "responded", { kind });
      res.status(201).json(review);
    } catch (e) { fail(res, e); }
  });

  // ── Coach follow-ups ─────────────────────────────────────────────────────

  app.post("/api/film-room/assignment-players/:id/followups", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ...COACH_ROLES);
      const db = getDb();
      const [row] = await db.select().from(clipAssignmentPlayers)
        .where(and(eq(clipAssignmentPlayers.id, req.params.id), eq(clipAssignmentPlayers.orgId, ctx.orgId)))
        .limit(1);
      if (!row) throw new HttpError(404, "Assignment not found");
      const kind = String(req.body?.kind ?? "");
      const valid = ["reply", "nudge", "due_change", "complete", "reopen", "archive"];
      if (!valid.includes(kind)) throw new HttpError(400, "Invalid follow-up kind");

      if (kind === "nudge" && row.lastNudgedAt &&
          Date.now() - row.lastNudgedAt.getTime() < 12 * 60 * 60 * 1000) {
        throw new HttpError(429, "Already reminded in the last 12 hours.");
      }

      const [followup] = await db.insert(coachFollowups).values({
        orgId: ctx.orgId,
        assignmentPlayerId: row.id,
        authorUserId: ctx.userId,
        kind,
        body: typeof req.body?.body === "string" ? req.body.body : null,
        meta: req.body?.meta ?? {},
      }).returning();

      const patch: Partial<typeof clipAssignmentPlayers.$inferInsert> = { updatedAt: new Date() };
      if (kind === "complete") {
        patch.status = "completed" as any;
        patch.completedAt = new Date();
        patch.completedBy = ctx.userId;
      }
      if (kind === "reopen") {
        patch.status = (row.respondedAt ? "responded" : row.watchedAt ? "watched" : "assigned") as any;
        patch.completedAt = null as any;
      }
      if (kind === "archive") {
        patch.status = "archived" as any;
        patch.archivedReason = typeof req.body?.meta?.reason === "string" ? req.body.meta.reason : null;
      }
      if (kind === "nudge") {
        patch.nudgeCount = (row.nudgeCount + 1) as any;
        patch.lastNudgedAt = new Date();
      }
      await db.update(clipAssignmentPlayers).set(patch).where(eq(clipAssignmentPlayers.id, row.id));
      await audit(ctx.orgId, ctx.userId, "coach", "assignment_player", row.id, kind, req.body?.meta ?? {});
      res.status(201).json(followup);
    } catch (e) { fail(res, e); }
  });

  // ── IDP escalation ───────────────────────────────────────────────────────

  app.post("/api/film-room/assignment-players/:id/escalate", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ...COACH_ROLES);
      const db = getDb();
      const [row] = await db.select().from(clipAssignmentPlayers)
        .where(and(eq(clipAssignmentPlayers.id, req.params.id), eq(clipAssignmentPlayers.orgId, ctx.orgId)))
        .limit(1);
      if (!row) throw new HttpError(404, "Assignment not found");
      const [assignment] = await db.select().from(clipAssignments)
        .where(eq(clipAssignments.id, row.assignmentId)).limit(1);
      const focusArea = String(req.body?.focusArea ?? "").trim();
      if (!focusArea) throw new HttpError(400, "Focus area is required");

      const [link] = await db.insert(clipIdpLinks).values({
        orgId: ctx.orgId,
        clipId: assignment.clipId,
        assignmentPlayerId: row.id,
        playerId: row.playerId,
        focusArea,
        note: typeof req.body?.note === "string" ? req.body.note : null,
        escalatedBy: ctx.userId,
        source: req.body?.source === "ai_recommended" ? "ai_recommended" : "coach",
      }).returning();
      await db.insert(coachFollowups).values({
        orgId: ctx.orgId,
        assignmentPlayerId: row.id,
        authorUserId: ctx.userId,
        kind: "escalate",
        meta: { focusArea, linkId: link.id },
      });
      await audit(ctx.orgId, ctx.userId, "coach", "assignment_player", row.id, "escalated", { focusArea });
      res.status(201).json(link);
    } catch (e) { fail(res, e); }
  });

  // ── Landing strip ────────────────────────────────────────────────────────

  app.get("/api/film-room/attention", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ...COACH_ROLES);
      const db = getDb();
      const [readyToClip] = await db.select({ n: sql<number>`count(*)::int` }).from(filmSessions)
        .where(and(eq(filmSessions.status, "ready" as any), isNull(filmSessions.deletedAt),
          sql`NOT EXISTS (SELECT 1 FROM clips c WHERE c.session_id = ${filmSessions.id} AND c.deleted_at IS NULL)`));
      const [readyToSend] = await db.select({ n: sql<number>`count(*)::int` }).from(clips)
        .where(and(eq(clips.orgId, ctx.orgId), eq(clips.status, "approved"), isNull(clips.deletedAt)));
      const [awaiting] = await db.select({ n: sql<number>`count(*)::int` }).from(clipAssignmentPlayers)
        .where(and(eq(clipAssignmentPlayers.orgId, ctx.orgId),
          inArray(clipAssignmentPlayers.status, ["assigned", "opened", "watched"])));
      const [overdue] = await db.select({ n: sql<number>`count(*)::int` })
        .from(clipAssignmentPlayers)
        .innerJoin(clipAssignments, eq(clipAssignmentPlayers.assignmentId, clipAssignments.id))
        .where(and(eq(clipAssignmentPlayers.orgId, ctx.orgId),
          inArray(clipAssignmentPlayers.status, ["assigned", "opened", "watched"]),
          sql`${clipAssignments.dueAt} < now()`));
      res.json({
        readyToClip: readyToClip?.n ?? 0,
        readyToSend: readyToSend?.n ?? 0,
        awaitingPlayers: awaiting?.n ?? 0,
        overdue: overdue?.n ?? 0,
      });
    } catch (e) { fail(res, e); }
  });
}
