import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository } from "@shared/db";
import { inngest } from "../../inngest/client";
import { computeReadiness, type ReadinessStatus } from "./score";

export function registerReadinessRoutes(router: Router) {
  // ── Player submits their own check-in ──────────────────────────────────────
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { fatigue, sleep, soreness, mood, note } = req.body as {
        fatigue: number;
        sleep: number;
        soreness: number;
        mood?: number;
        note?: string;
      };
      const flagged = fatigue >= 7 || sleep <= 5 || soreness >= 7;
      const record = await repo.readiness.create({
        playerId: ctx.userId,
        fatigue,
        sleep,
        soreness,
        mood,
        note,
        flagged,
      });

      if (flagged) {
        try {
          await inngest.send({
            name: "readiness/flagged",
            data: {
              checkinId: record.id,
              orgId: ctx.orgId,
              playerId: ctx.userId,
              playerName: "Unknown",
              coachUserId: ctx.userId,
              fatigue,
              sleep,
              soreness,
              note,
            },
          });
        } catch (err) {
          console.warn("Inngest not available:", err);
        }
      }

      res.status(201).json(record);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Today's check-ins (coach view) ────────────────────────────────────────
  router.get("/today", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const records = await repo.readiness.listToday();
      res.json(records);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Per-player history ─────────────────────────────────────────────────────
  router.get("/player/:playerId", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const days = req.query.days ? Number(req.query.days) : 30;
      const records = await repo.readiness.listForPlayer(req.params.playerId, days);
      res.json(records);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Team readiness snapshot ────────────────────────────────────────────────
  // Returns one computed ReadinessResult per active player on the roster.
  router.get("/team", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);

      // Load all signals in parallel
      const [todayCheckins, players, injuries, overrides] = await Promise.all([
        repo.readiness.listToday(),
        repo.players.listActive(),
        repo.injuries.listActive(),
        repo.readinessOverrides.listActive(ctx.orgId),
      ]);

      const checkinByPlayer = Object.fromEntries(
        todayCheckins.map((c: any) => [c.playerId, c]),
      );
      const injuryByPlayer: Record<string, { active: boolean; monitoring: boolean }> = {};
      for (const inj of injuries) {
        if (!injuryByPlayer[inj.playerId]) {
          injuryByPlayer[inj.playerId] = { active: false, monitoring: false };
        }
        if (inj.status === "active")     injuryByPlayer[inj.playerId].active = true;
        if (inj.status === "monitoring") injuryByPlayer[inj.playerId].monitoring = true;
      }
      const overrideByPlayer = Object.fromEntries(
        overrides.map((o: any) => [
          o.playerId,
          { status: o.status as ReadinessStatus, note: o.note ?? "", expiresAt: o.expiresAt },
        ]),
      );

      const results = players.map((player: any) => {
        const checkin = checkinByPlayer[player.id] ?? null;
        const inj = injuryByPlayer[player.id];
        const result = computeReadiness({
          checkin: checkin ? { fatigue: checkin.fatigue, sleep: checkin.sleep, soreness: checkin.soreness } : null,
          hasActiveInjury: inj?.active ?? false,
          hasMonitoringInjury: inj?.monitoring ?? false,
          playerStatus: player.status ?? null,
          override: overrideByPlayer[player.id] ?? null,
        });
        return {
          playerId:   player.id,
          playerName: player.name,
          position:   player.position,
          jerseyNumber: player.jerseyNumber,
          avatarUrl:  player.avatarUrl,
          checkinSubmitted: checkin != null,
          ...result,
        };
      });

      res.json(results);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Coach sets an override for a player ───────────────────────────────────
  router.post("/player/:playerId/override", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const { status, note } = req.body as { status: ReadinessStatus; note?: string };
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
      const override = await repo.readinessOverrides.upsert({
        orgId:       ctx.orgId,
        playerId:    req.params.playerId,
        coachUserId: ctx.userId,
        status,
        note,
        expiresAt,
      });
      res.status(201).json(override);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── Coach removes their override ──────────────────────────────────────────
  router.delete("/player/:playerId/override", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      await repo.readinessOverrides.remove(ctx.orgId, req.params.playerId);
      res.status(204).end();
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
