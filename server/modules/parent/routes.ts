/**
 * /api/parent — Parent portal endpoints.
 *
 * Every route here:
 *   1. Calls requireOrgRole(req, "guardian") — 403 if not a guardian account.
 *   2. Calls validateParentChildAccess for routes that touch a specific player —
 *      403 if no player_guardians row links this user to that player in this org.
 *
 * This is the primary enforcement layer for security risk #1 (server-side role
 * gating) and risk #2 (parent → specific child scoping).
 */

import { Router } from "express";
import { createRepository } from "@shared/db";
import { HttpError, requireOrgRole, ORG_ROLES } from "../../auth/tenant";
import { validateParentChildAccess, getGuardianPlayerIds } from "../parent/access";

export function registerParentRoutes(router: Router) {

  // ── GET /api/parent/children ─────────────────────────────────────────────
  // Lists all players this guardian is linked to.
  router.get("/children", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      const repo = createRepository(ctx);

      const guardianRows = await repo.guardians.listPlayersForGuardian(ctx.userId);
      if (guardianRows.length === 0) {
        return res.json([]);
      }

      // Hydrate with player details
      const playerIds = guardianRows.map((g) => g.playerId);
      const allPlayers = await repo.players.list();
      const children = allPlayers.filter((p) => playerIds.includes(p.id));

      res.json(children);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/parent/child/:playerId ──────────────────────────────────────
  // Basic player profile (name, team, position, grad year).
  router.get("/child/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);

      const player = await repo.players.getById(req.params.playerId);
      if (!player) return res.status(404).json({ error: "Player not found" });

      // Redact sensitive coach-only fields before sending to parent
      const { medicalNotes: _med, academicNotes: _ac, ...safe } = player;
      res.json(safe);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/parent/child/:playerId/assignments ──────────────────────────
  // Read-only view of the child's assignments (status + due date only;
  // coach feedback is omitted to preserve coaching relationship).
  router.get("/child/:playerId/assignments", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);

      const all = await repo.assignments.listForPlayer(req.params.playerId);

      // Strip coach-only annotation fields
      const parentView = all.map(({ payload: _p, ...a }) => a);
      res.json(parentView);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/parent/child/:playerId/schedule ─────────────────────────────
  // Upcoming events for the player's team.
  router.get("/child/:playerId/schedule", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);

      const evts = await repo.events.listUpcoming();
      res.json(evts);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/parent/child/:playerId/attendance ───────────────────────────
  router.get("/child/:playerId/attendance", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);

      const records = await repo.events.listAttendanceForPlayer(req.params.playerId);
      res.json(records);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/parent/child/:playerId/availability ────────────────────────
  // Parent RSVPs on behalf of their child.
  router.post("/child/:playerId/availability", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);

      const { eventId, status, note } = req.body as {
        eventId: string;
        status: "available" | "unavailable" | "maybe";
        note?: string;
      };
      if (!eventId || !status) {
        return res.status(400).json({ error: "eventId and status required" });
      }

      await repo.events.upsertAvailability({
        playerId: req.params.playerId,
        eventId,
        status,
        note,
        respondedByUserId: ctx.userId,
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/parent/child/:playerId/development ──────────────────────────
  // High-level development summary — coach controls visibility per focus area.
  router.get("/child/:playerId/development", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);

      const focusAreas = await repo.idpFocusAreas.listForPlayer(req.params.playerId);

      // Only return areas where the coach has enabled guardian visibility.
      // guardianVisible is a field we add; default true for simplicity but
      // coaches can lock individual areas.
      const visible = focusAreas.filter((f: any) => f.guardianVisible !== false);

      // Strip sensitive coach-only annotation
      const parentView = visible.map(({ coachPrivateNote: _n, ...f }: any) => f);
      res.json(parentView);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/parent/child/:playerId/waivers ──────────────────────────────
  router.get("/child/:playerId/waivers", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      await validateParentChildAccess(ctx.orgId, ctx.userId, req.params.playerId);
      const repo = createRepository(ctx);

      const [templates, signatures] = await Promise.all([
        repo.waivers.listTemplates(),
        repo.waivers.listSignaturesForPlayer(req.params.playerId),
      ]);

      const signatureMap = Object.fromEntries(
        signatures.map((s) => [s.templateId, s]),
      );

      const combined = templates.map((t) => ({
        ...t,
        signature: signatureMap[t.id] ?? null,
      }));
      res.json(combined);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
