import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository, getDb } from "@shared/db";
import { players } from "@shared/db/schema/players";
import { playerGuardians } from "@shared/db/schema/guardians";
import { messageRecipients } from "@shared/db/schema/messages";
import { eq, and, isNull } from "drizzle-orm";
import { sendSms } from "../../lib/twilio";
import { resolveRecipients, type RecipientSpec } from "./recipient-resolver";

export function registerMessagingRoutes(router: Router) {
  // List threads for current user
  router.get("/threads", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const threads = await repo.messages.listThreads();
      res.json(threads);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Create thread
  router.post("/threads", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const thread = await repo.messages.createThread({
        ...req.body,
        createdByUserId: ctx.userId,
      });
      res.status(201).json(thread);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Get messages in thread
  router.get("/threads/:threadId/messages", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const msgs = await repo.messages.listMessages(req.params.threadId);
      res.json(msgs);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Send message
  router.post("/threads/:threadId/messages", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const msg = await repo.messages.createMessage({
        threadId: req.params.threadId,
        senderUserId: ctx.userId,
        body: req.body.body,
      });

      // Optional SMS notification for parent DMs
      if (req.body.notifySms && req.body.recipientPhone) {
        try {
          await sendSms(
            req.body.recipientPhone,
            `HoopsIQ message from your coach: ${req.body.body.substring(0, 140)}`
          );
        } catch (smsErr) {
          console.warn("SMS notification failed:", smsErr);
        }
      }

      res.status(201).json(msg);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Resolve audience preview — returns counts and warnings without sending.
  // Used by the compose dialog to show live audience summary as the coach configures targeting.
  router.post("/resolve-audience", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const spec = req.body as RecipientSpec;

      const [allPlayers, allGuardians] = await Promise.all([
        getDb().select().from(players).where(and(eq(players.orgId, ctx.orgId), isNull(players.deletedAt))),
        getDb().select().from(playerGuardians).where(and(eq(playerGuardians.orgId, ctx.orgId), isNull(playerGuardians.deletedAt))),
      ]);

      const audience = resolveRecipients(spec, allPlayers, allGuardians);
      res.json({
        playerCount:      audience.players.length,
        guardianCount:    audience.guardians.length,
        totalContacts:    audience.totalContacts,
        playerWarnings:   audience.playerWarnings,
        guardianWarnings: audience.guardianWarnings,
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Compose — create thread + first message + per-recipient records in one transaction.
  router.post("/compose", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const { spec, title, body } = req.body as {
        spec:  RecipientSpec;
        title: string;
        body:  string;
      };

      if (!body?.trim()) {
        return res.status(400).json({ error: "Message body is required" });
      }

      const [allPlayers, allGuardians] = await Promise.all([
        getDb().select().from(players).where(and(eq(players.orgId, ctx.orgId), isNull(players.deletedAt))),
        getDb().select().from(playerGuardians).where(and(eq(playerGuardians.orgId, ctx.orgId), isNull(playerGuardians.deletedAt))),
      ]);

      const audience = resolveRecipients(spec, allPlayers, allGuardians);

      if (audience.totalContacts === 0) {
        return res.status(400).json({ error: "Recipient spec resolved to zero contacts" });
      }

      const repo = createRepository(ctx);

      // Map audience mode to thread type
      const threadType =
        spec.mode === "individuals" || spec.mode === "players" ? "broadcast"
        : spec.mode === "parents" ? "parent_dm"
        : "broadcast";

      // All player + guardian userIds for participantIds (backward compat)
      const participantIds = [
        ...audience.players.map((p) => p.userId).filter(Boolean),
      ] as string[];

      const thread = await repo.messages.createThread({
        type:                   threadType,
        audienceMode:           spec.mode,
        title:                  title || null,
        participantIds,
        resolvedRecipientCount: audience.totalContacts,
        createdByUserId:        ctx.userId,
      });

      const message = await repo.messages.createMessage({
        threadId:     thread.id,
        senderUserId: ctx.userId,
        body,
      });

      // Write per-recipient records
      const recipientRows = [
        ...audience.players.map((p) => ({
          orgId:         ctx.orgId,
          threadId:      thread.id,
          messageId:     message.id,
          recipientType: "player" as const,
          playerId:      p.playerId,
          guardianId:    null,
          userId:        p.userId,
          contactEmail:  null,
          contactPhone:  null,
        })),
        ...audience.guardians.map((g) => ({
          orgId:         ctx.orgId,
          threadId:      thread.id,
          messageId:     message.id,
          recipientType: "guardian" as const,
          playerId:      g.playerId,
          guardianId:    g.guardianId,
          userId:        null,
          contactEmail:  g.email,
          contactPhone:  g.phone,
        })),
      ];

      if (recipientRows.length > 0) {
        await getDb().insert(messageRecipients).values(recipientRows);
      }

      // Fire SMS for guardian recipients (non-blocking — failures logged per row)
      const smsTargets = audience.guardians.filter((g) => g.phone);
      if (smsTargets.length > 0) {
        const preview = body.substring(0, 140);
        const smsBody = `HoopsIQ message from your coach: ${preview}`;
        try {
          const { sendBroadcastSms } = await import("../../lib/twilio");
          await sendBroadcastSms(smsTargets.map((g) => g.phone!), smsBody);
        } catch (smsErr) {
          console.warn("[messaging] SMS broadcast failed:", smsErr);
        }
      }

      res.status(201).json({
        thread,
        message,
        audience: {
          playerCount:   audience.players.length,
          guardianCount: audience.guardians.length,
          totalContacts: audience.totalContacts,
          warnings:      [...audience.playerWarnings, ...audience.guardianWarnings],
        },
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // Broadcast to all parents (SMS)
  router.post("/broadcast-sms", async (req, res) => {
    try {
      await requireOrg(req);
      const { recipients, message } = req.body;
      if (!Array.isArray(recipients) || !message) {
        return res.status(400).json({ error: "recipients[] and message required" });
      }
      const { sendBroadcastSms } = await import("../../lib/twilio");
      const result = await sendBroadcastSms(recipients, message);
      res.json(result);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
