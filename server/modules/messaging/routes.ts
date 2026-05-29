import { Router } from "express";
import { requireOrg } from "../../auth/tenant";
import { createRepository, getDb } from "@shared/db";
import { orgs }          from "@shared/db/schema/orgs";
import { players }       from "@shared/db/schema/players";
import { playerGuardians } from "@shared/db/schema/guardians";
import { messageRecipients } from "@shared/db/schema/messages";
import { messagingPolicyLog }    from "@shared/db/schema/messaging_policy_log";
import { threadTypePolicyLog }   from "@shared/db/schema/thread_type_policy_log";
import { eq, and, isNull } from "drizzle-orm";
import { sendSms } from "../../lib/twilio";
import { resolveRecipients, type RecipientSpec, type ResolvedGuardian } from "./recipient-resolver";
import { enforceGuardianPolicy } from "./guardian-policy";
import {
  classifyThreadType,
  parseOrgMessagingSettings,
  buildPolicyAudit,
  UNSAFE_LEGACY_TYPES_FOR_MINORS,
} from "./thread-type-policy";
import {
  enforceQuietHours,
  parseOrgQuietHoursPolicy,
  type EmergencyOverride,
} from "./quiet-hours-policy";
import { messages }           from "@shared/db/schema/messages";
import { quietHoursLog }      from "@shared/db/schema/quiet_hours_log";
import { safetyFlags, flagReviewItems } from "@shared/db/schema/safety_flags";
import { scanMessage }        from "./safety-rules";

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

  // Create thread (lightweight — no message body).
  // Runs both policy layers when participant player IDs are provided:
  //   Layer 1: guardian-copy enforcement (guardian-policy.ts)
  //   Layer 2: thread-type classification (thread-type-policy.ts)
  router.post("/threads", async (req, res) => {
    try {
      const ctx = await requireOrg(req);

      const participantPlayerIds: string[] = Array.isArray(req.body.participantPlayerIds)
        ? req.body.participantPlayerIds
        : [];

      const secondAdultUserIds: string[] = Array.isArray(req.body.secondAdultUserIds)
        ? req.body.secondAdultUserIds
        : [];

      if (participantPlayerIds.length > 0) {
        const [[allPlayers, allGuardians], orgRow] = await Promise.all([
          Promise.all([
            getDb().select().from(players).where(and(eq(players.orgId, ctx.orgId), isNull(players.deletedAt))),
            getDb().select().from(playerGuardians).where(and(eq(playerGuardians.orgId, ctx.orgId), isNull(playerGuardians.deletedAt))),
          ]),
          getDb().select({ payload: orgs.payload }).from(orgs).where(eq(orgs.id, ctx.orgId)).limit(1),
        ]);

        const orgSettings = parseOrgMessagingSettings(orgRow[0]?.payload);

        // ── Layer 1: guardian-copy policy ──────────────────────────────────
        const guardianPolicy = enforceGuardianPolicy({
          senderRole:          ctx.role,
          targetPlayerIds:     participantPlayerIds,
          allPlayers,
          allGuardians,
          existingGuardianIds: [],
        });

        void getDb()
          .insert(messagingPolicyLog)
          .values({
            orgId:              ctx.orgId,
            senderId:           ctx.userId,
            threadId:           null,
            minorPresent:       guardianPolicy.audit.minorPresent,
            guardiansAdded:     guardianPolicy.audit.guardiansAdded,
            participantsBefore: guardianPolicy.audit.participantsBefore,
            participantsAfter:  guardianPolicy.audit.participantsAfter,
            blockedReason:      guardianPolicy.audit.blockedReason,
            action:             guardianPolicy.action,
          })
          .catch((err) => console.error("[messaging:policy-log] insert failed:", err));

        if (!guardianPolicy.allowed) {
          return res.status(422).json({
            error:         guardianPolicy.blockedReason,
            code:          "GUARDIAN_REQUIRED",
            blockedReason: guardianPolicy.blockedReason,
          });
        }

        // ── Layer 2: thread-type classification ────────────────────────────
        const targetMinorIds = guardianPolicy.minorPlayerIds;
        const hasMinorRecipients    = targetMinorIds.length > 0;
        const hasGuardianRecipients = guardianPolicy.guardiansToAdd.length > 0;

        const classification = classifyThreadType({
          senderRole:             ctx.role,
          hasMinorRecipients,
          hasGuardianRecipients,
          hasPlayerRecipients:    participantPlayerIds.length > 0,
          isTeamThread:           participantPlayerIds.length > 1,
          staffOnly:              participantPlayerIds.length === 0 && !hasGuardianRecipients,
          secondAdultUserIds,
          orgSettings,
        });

        void getDb()
          .insert(threadTypePolicyLog)
          .values({
            orgId:                   ctx.orgId,
            senderId:                ctx.userId,
            threadId:                null,
            requestedType:           req.body.type ?? null,
            classifiedType:          classification.threadType,
            senderRole:              ctx.role,
            hasMinorRecipients,
            hasGuardianRecipients,
            isTeamThread:            participantPlayerIds.length > 1,
            secondAdultPresent:      secondAdultUserIds.length > 0,
            allowed:                 classification.allowed,
            blockedReason:           classification.blockedReason,
            blockedCode:             classification.blockedCode,
            badges:                  classification.badges,
            orgSettingsSnapshot:     orgSettings,
          })
          .catch((err) => console.error("[messaging:thread-type-log] insert failed:", err));

        if (!classification.allowed) {
          return res.status(422).json({
            error:         classification.blockedReason,
            code:          classification.blockedCode,
            blockedReason: classification.blockedReason,
          });
        }

        // Override the caller-supplied type with the policy-classified type.
        // This prevents callers from forcing an unsafe legacy type (e.g. "dm")
        // when a minor is present.
        req.body.type = classification.threadType ?? req.body.type;
      }

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

  // Compose — create thread + first message + per-recipient records.
  // Three-layer safety stack:
  //   Layer 1 (guardian-policy)    — auto-add / block on missing guardian
  //   Layer 2 (thread-type-policy) — classify safe type / block unsafe structures
  //   Layer 3 (quiet-hours-policy) — enforce send-time window; queue or emergency-override
  router.post("/compose", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const {
        spec,
        title,
        body,
        secondAdultUserIds: rawSecondAdults,
        emergencyOverride:  rawEmergency,
      } = req.body as {
        spec:                RecipientSpec;
        title:               string;
        body:                string;
        secondAdultUserIds?: string[];
        emergencyOverride?:  EmergencyOverride;
      };

      const secondAdultUserIds: string[] = Array.isArray(rawSecondAdults) ? rawSecondAdults : [];

      if (!body?.trim()) {
        return res.status(400).json({ error: "Message body is required" });
      }

      // Load roster, guardians, and org config in parallel
      const [[allPlayers, allGuardians], orgRow] = await Promise.all([
        Promise.all([
          getDb().select().from(players).where(and(eq(players.orgId, ctx.orgId), isNull(players.deletedAt))),
          getDb().select().from(playerGuardians).where(and(eq(playerGuardians.orgId, ctx.orgId), isNull(playerGuardians.deletedAt))),
        ]),
        getDb().select({ payload: orgs.payload }).from(orgs).where(eq(orgs.id, ctx.orgId)).limit(1),
      ]);

      const orgPayload  = orgRow[0]?.payload;
      const orgSettings = parseOrgMessagingSettings(orgPayload);
      const quietPolicy = parseOrgQuietHoursPolicy(orgPayload);

      const audience = resolveRecipients(spec, allPlayers, allGuardians);

      if (audience.totalContacts === 0) {
        return res.status(400).json({ error: "Recipient spec resolved to zero contacts" });
      }

      // ── Layer 1: guardian-copy policy ───────────────────────────────────────
      const targetPlayerIds = audience.players.map((p) => p.playerId);

      const guardianPolicy = enforceGuardianPolicy({
        senderRole:          ctx.role,
        targetPlayerIds,
        allPlayers,
        allGuardians,
        existingGuardianIds: audience.guardians.map((g) => g.guardianId),
      });

      void getDb()
        .insert(messagingPolicyLog)
        .values({
          orgId:              ctx.orgId,
          senderId:           ctx.userId,
          threadId:           null,
          minorPresent:       guardianPolicy.audit.minorPresent,
          guardiansAdded:     guardianPolicy.audit.guardiansAdded,
          participantsBefore: guardianPolicy.audit.participantsBefore,
          participantsAfter:  guardianPolicy.audit.participantsAfter,
          blockedReason:      guardianPolicy.audit.blockedReason,
          action:             guardianPolicy.action,
        })
        .catch((err) => console.error("[messaging:policy-log] insert failed:", err));

      if (!guardianPolicy.allowed) {
        return res.status(422).json({
          error:         guardianPolicy.blockedReason,
          code:          "GUARDIAN_REQUIRED",
          blockedReason: guardianPolicy.blockedReason,
        });
      }

      const finalGuardians: ResolvedGuardian[] = [
        ...audience.guardians,
        ...guardianPolicy.guardiansToAdd,
      ];

      // ── Layer 2: thread-type classification ──────────────────────────────────
      const hasMinorRecipients    = guardianPolicy.minorPlayerIds.length > 0;
      const hasGuardianRecipients = finalGuardians.length > 0;
      const hasPlayerRecipients   = audience.players.length > 0;
      const isTeamThread          = audience.players.length > 1;
      const staffOnly             = !hasPlayerRecipients && !hasGuardianRecipients;

      const classification = classifyThreadType({
        senderRole: ctx.role,
        hasMinorRecipients,
        hasGuardianRecipients,
        hasPlayerRecipients,
        isTeamThread,
        staffOnly,
        secondAdultUserIds,
        orgSettings,
      });

      const policyAudit = buildPolicyAudit(
        { senderRole: ctx.role, hasMinorRecipients, hasGuardianRecipients,
          hasPlayerRecipients, isTeamThread, staffOnly, secondAdultUserIds, orgSettings },
        classification,
      );

      void getDb()
        .insert(threadTypePolicyLog)
        .values({
          orgId: ctx.orgId, senderId: ctx.userId, threadId: null,
          requestedType: null, classifiedType: policyAudit.classifiedType,
          senderRole: policyAudit.senderRole,
          hasMinorRecipients:    policyAudit.hasMinorRecipients,
          hasGuardianRecipients: policyAudit.hasGuardianRecipients,
          isTeamThread:          policyAudit.isTeamThread,
          secondAdultPresent:    policyAudit.secondAdultPresent,
          allowed:               policyAudit.allowed,
          blockedReason:         policyAudit.blockedReason,
          blockedCode:           policyAudit.blockedCode,
          badges:                policyAudit.badges,
          orgSettingsSnapshot:   policyAudit.orgSettingsSnapshot,
        })
        .catch((err) => console.error("[messaging:thread-type-log] insert failed:", err));

      if (!classification.allowed) {
        return res.status(422).json({
          error: classification.blockedReason,
          code:  classification.blockedCode,
          blockedReason: classification.blockedReason,
        });
      }

      // ── Layer 4: rule-based safety scan ─────────────────────────────────────
      // Runs before any DB writes so HIGH-severity blocks are clean (no orphan rows).
      const scan = scanMessage({
        body,
        senderRole:         ctx.role,
        hasMinorRecipients,
        threadType:         classification.threadType ?? undefined,
      });

      if (scan.shouldBlock) {
        // Persist flag evidence (non-blocking) — message_id is null (never created).
        void getDb()
          .insert(safetyFlags)
          .values({
            orgId:              ctx.orgId,
            messageId:          null,
            threadId:           null,
            senderId:           ctx.userId,
            senderRole:         ctx.role,
            bodySnapshot:       body,
            matchedRules:       scan.matches,
            maxSeverity:        scan.maxSeverity!,
            categories:         scan.categories,
            wasBlocked:         true,
            hasMinorRecipients,
            threadType:         classification.threadType,
          })
          .returning({ id: safetyFlags.id })
          .then(([flag]) => {
            if (!flag) return;
            // Create escalated review item (high severity → immediate attention).
            return getDb().insert(flagReviewItems).values({
              orgId:   ctx.orgId,
              flagId:  flag.id,
              status:  "escalated",
            });
          })
          .catch((err) => console.error("[messaging:safety-flag] insert failed:", err));

        const topMatch = scan.matches.find((m) => m.severity === "high");
        return res.status(422).json({
          error:         `Message blocked: ${topMatch?.description ?? "content policy violation"}.`,
          code:          "CONTENT_SAFETY_BLOCK",
          blockedReason: `This message was blocked because it contains language that violates the program's communications policy (${topMatch?.category ?? "safety rule"}).`,
          flagCategory:  topMatch?.category,
        });
      }

      // ── Layer 3: quiet-hours enforcement ────────────────────────────────────
      const attemptedAt = new Date();

      const quietResult = enforceQuietHours({
        senderRole:         ctx.role,
        hasMinorRecipients,
        attemptedAt,
        policy:             quietPolicy,
        emergencyOverride:  rawEmergency,
      });

      // ── Build and persist the thread + message + recipients ──────────────────
      const repo       = createRepository(ctx);
      const threadType = classification.threadType ?? "broadcast";

      const participantIds = [
        ...audience.players.map((p) => p.userId).filter(Boolean),
        ...secondAdultUserIds,
      ] as string[];

      const thread = await repo.messages.createThread({
        type:                   threadType,
        audienceMode:           spec.mode,
        title:                  title || null,
        participantIds,
        resolvedRecipientCount: audience.players.length + finalGuardians.length,
        createdByUserId:        ctx.userId,
      });

      // Insert message directly so we can set scheduledAt (not exposed by repo).
      const [message] = await getDb()
        .insert(messages)
        .values({
          orgId:       ctx.orgId,
          threadId:    thread.id,
          senderUserId: ctx.userId,
          body,
          scheduledAt: quietResult.sendNow ? null : quietResult.scheduledAt,
        })
        .returning();

      // Write per-recipient records
      const recipientRows = [
        ...audience.players.map((p) => ({
          orgId:         ctx.orgId,  threadId:   thread.id,  messageId:     message.id,
          recipientType: "player" as const,      playerId:   p.playerId,
          guardianId:    null,       userId:     p.userId,   contactEmail:  null,  contactPhone: null,
        })),
        ...finalGuardians.map((g) => ({
          orgId:         ctx.orgId,  threadId:   thread.id,  messageId:     message.id,
          recipientType: "guardian" as const,    playerId:   g.playerId,
          guardianId:    g.guardianId,           userId:     null,
          contactEmail:  g.email,                contactPhone: g.phone,
        })),
      ];

      if (recipientRows.length > 0) {
        await getDb().insert(messageRecipients).values(recipientRows);
      }

      // ── Layer 4: persist flag for medium/low severity (non-blocking) ─────────
      if (scan.maxSeverity !== null) {
        void getDb()
          .insert(safetyFlags)
          .values({
            orgId:              ctx.orgId,
            messageId:          message.id,
            threadId:           thread.id,
            senderId:           ctx.userId,
            senderRole:         ctx.role,
            bodySnapshot:       body,
            matchedRules:       scan.matches,
            maxSeverity:        scan.maxSeverity,
            categories:         scan.categories,
            wasBlocked:         false,
            hasMinorRecipients,
            threadType:         classification.threadType,
          })
          .returning({ id: safetyFlags.id })
          .then(([flag]) => {
            if (!flag || !scan.createReviewItem) return;
            return getDb().insert(flagReviewItems).values({
              orgId:  ctx.orgId,
              flagId: flag.id,
              status: scan.reviewItemStatus ?? "open",
            });
          })
          .catch((err) => console.error("[messaging:safety-flag] insert failed:", err));
      }

      // Persist quiet-hours audit row (non-blocking, links to created message).
      void getDb()
        .insert(quietHoursLog)
        .values({
          orgId:               ctx.orgId,
          senderId:            ctx.userId,
          threadId:            thread.id,
          messageId:           message.id,
          attemptedAt,
          localOrgTime:        quietResult.localOrgTime,
          policyWindow:        quietResult.policyWindow,
          orgTimezone:         quietPolicy.timezone,
          actionTaken:         quietResult.action,
          scheduledAt:         quietResult.scheduledAt,
          emergencyReason:     quietResult.emergencyReason,
          emergencyNote:       quietResult.emergencyNote,
          hasMinorRecipients,
        })
        .catch((err) => console.error("[messaging:quiet-hours-log] insert failed:", err));

      // Fire SMS only when sending immediately (not queued).
      // Queued messages are released by the Inngest quiet-hours release function.
      if (quietResult.sendNow) {
        const smsTargets = finalGuardians.filter((g) => g.phone);
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
      }

      // 202 Accepted for queued messages; 201 Created for immediate sends.
      const statusCode = quietResult.sendNow ? 201 : 202;

      return res.status(statusCode).json({
        thread,
        message,
        audience: {
          playerCount:   audience.players.length,
          guardianCount: finalGuardians.length,
          totalContacts: audience.players.length + finalGuardians.length,
          warnings:      [...audience.playerWarnings, ...audience.guardianWarnings],
        },
        policy: {
          // Layer 1
          guardianAction:      guardianPolicy.action,
          guardiansAutoAdded:  guardianPolicy.guardiansToAdd.length,
          minorPlayerIds:      guardianPolicy.minorPlayerIds,
          // Layer 2
          threadType,
          badges:              classification.badges,
          requiresSecondAdult: classification.requiresSecondAdult,
          // Layer 4
          ...(scan.maxSeverity && {
            safetyFlag: {
              maxSeverity:      scan.maxSeverity,
              categories:       scan.categories,
              createReviewItem: scan.createReviewItem,
            },
          }),
          ...(guardianPolicy.action === "guardian_auto_included" && {
            notice: `Guardian${guardianPolicy.guardiansToAdd.length !== 1 ? "s" : ""} automatically included for ${guardianPolicy.minorPlayerIds.length} minor athlete${guardianPolicy.minorPlayerIds.length !== 1 ? "s" : ""}`,
          }),
          // Layer 3
          quietHours: {
            action:             quietResult.action,
            sendNow:            quietResult.sendNow,
            scheduledAt:        quietResult.scheduledAt?.toISOString() ?? null,
            localOrgTime:       quietResult.localOrgTime,
            policyWindow:       quietResult.policyWindow,
            emergencyApproved:  quietResult.emergencyApproved,
            ...(quietResult.emergencyRejectedReason && {
              emergencyRejectedReason: quietResult.emergencyRejectedReason,
            }),
          },
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
