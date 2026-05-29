/**
 * Safety admin API — review queue for flagged messages.
 *
 * All endpoints require owner or admin role.
 *
 * GET  /api/safety/review-queue        — paginated list of review items
 * GET  /api/safety/review-queue/:id    — single item with full flag evidence
 * PATCH /api/safety/review-queue/:id  — update triage status
 */

import { Router } from "express";
import { requireOrgRole } from "../../auth/tenant";
import { getDb } from "@shared/db";
import { safetyFlags, flagReviewItems } from "@shared/db/schema/safety_flags";
import { eq, and, inArray, desc } from "drizzle-orm";
import { safetyIncidents }     from "@shared/db/schema/safety_incidents";
import { messagingPolicyLog }  from "@shared/db/schema/messaging_policy_log";
import { quietHoursLog }       from "@shared/db/schema/quiet_hours_log";
import { messageThreads }      from "@shared/db/schema/messages";
import { orgs }                from "@shared/db/schema/orgs";
import { sql, gte, lte }       from "drizzle-orm";

export function registerSafetyRoutes(router: Router) {

  // ── GET /review-queue ─────────────────────────────────────────────────────
  // Returns all review items (joined to their flag) for the org.
  // Query params:
  //   status  "open"|"escalated"|"dismissed"|"all"  (default: "open,escalated")
  //   page    integer ≥ 1                             (default: 1)
  //   limit   integer 1–100                           (default: 50)
  router.get("/review-queue", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");

      const statusParam = (req.query.status as string) ?? "open,escalated";
      const statuses    =
        statusParam === "all"
          ? ["open", "escalated", "dismissed"]
          : statusParam.split(",").map((s) => s.trim());

      const page  = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
      const offset = (page - 1) * limit;

      const db = getDb();

      // Fetch review items
      const items = await db
        .select()
        .from(flagReviewItems)
        .where(
          and(
            eq(flagReviewItems.orgId, ctx.orgId),
            inArray(flagReviewItems.status, statuses),
          ),
        )
        .orderBy(desc(flagReviewItems.createdAt))
        .limit(limit)
        .offset(offset);

      if (items.length === 0) {
        return res.json({ items: [], total: 0, page, limit });
      }

      // Join flag evidence rows
      const flagIds = items.map((i) => i.flagId);
      const flags   = await db
        .select()
        .from(safetyFlags)
        .where(inArray(safetyFlags.id, flagIds));

      const flagMap = new Map(flags.map((f) => [f.id, f]));

      const enriched = items.map((item) => ({
        ...item,
        flag: flagMap.get(item.flagId) ?? null,
      }));

      res.json({ items: enriched, total: enriched.length, page, limit });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /review-queue/:id ─────────────────────────────────────────────────
  // Returns a single review item with its full flag evidence.
  router.get("/review-queue/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");
      const db  = getDb();

      const [item] = await db
        .select()
        .from(flagReviewItems)
        .where(and(eq(flagReviewItems.id, req.params.id), eq(flagReviewItems.orgId, ctx.orgId)))
        .limit(1);

      if (!item) return res.status(404).json({ error: "Review item not found" });

      const [flag] = await db
        .select()
        .from(safetyFlags)
        .where(eq(safetyFlags.id, item.flagId))
        .limit(1);

      res.json({ ...item, flag: flag ?? null });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PATCH /review-queue/:id ───────────────────────────────────────────────
  // Update the triage status of a review item.
  // Body: { status: "open"|"dismissed"|"escalated"; reviewNote?: string }
  router.patch("/review-queue/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");

      const { status, reviewNote } = req.body as {
        status:      string;
        reviewNote?: string;
      };

      const VALID_STATUSES = ["open", "dismissed", "escalated"];
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }

      const db = getDb();

      const [item] = await db
        .select()
        .from(flagReviewItems)
        .where(and(eq(flagReviewItems.id, req.params.id), eq(flagReviewItems.orgId, ctx.orgId)))
        .limit(1);

      if (!item) return res.status(404).json({ error: "Review item not found" });

      const [updated] = await db
        .update(flagReviewItems)
        .set({
          status,
          reviewedBy: ctx.userId,
          reviewNote: reviewNote ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(flagReviewItems.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /settings ─────────────────────────────────────────────────────────
  // Returns the org's safety-related settings parsed from payload sub-keys.
  router.get("/settings", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");
      const db  = getDb();

      const [org] = await db
        .select()
        .from(orgs)
        .where(eq(orgs.id, ctx.orgId))
        .limit(1);

      if (!org) return res.status(404).json({ error: "Org not found" });

      const payload = (org.payload ?? {}) as Record<string, any>;
      const mp  = payload.messagingPolicy   ?? {};
      const qh  = payload.quietHoursPolicy  ?? {};
      const ss  = payload.safetySettings    ?? {};

      res.json({
        requireAllGuardians:                mp.requireAllGuardians                ?? true,
        requireSecondAdultForTeamThreads:   mp.requireSecondAdultForTeamThreads   ?? false,
        quietHoursEnabled:                  qh.enabled                            ?? true,
        allowedStartHour:                   qh.allowedStartHour                   ?? 5,
        allowedEndHour:                     qh.allowedEndHour                     ?? 21,
        orgTimezone:                        qh.timezone                           ?? "America/Chicago",
        allowSocialHandleSharing:           ss.allowSocialHandleSharing           ?? false,
        messageRetentionDays:               ss.messageRetentionDays               ?? 365,
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PUT /settings ─────────────────────────────────────────────────────────
  // Deep-merges safety settings into org payload sub-keys.
  // Body: partial SafetySettings object.
  router.put("/settings", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");

      const body = req.body as {
        requireAllGuardians?:              boolean;
        requireSecondAdultForTeamThreads?: boolean;
        quietHoursEnabled?:                boolean;
        allowedStartHour?:                 number;
        allowedEndHour?:                   number;
        orgTimezone?:                      string;
        allowSocialHandleSharing?:         boolean;
        messageRetentionDays?:             number;
      };

      if (body.allowedStartHour !== undefined) {
        const v = body.allowedStartHour;
        if (!Number.isInteger(v) || v < 0 || v > 23) {
          return res.status(400).json({ error: "allowedStartHour must be an integer 0–23" });
        }
      }
      if (body.allowedEndHour !== undefined) {
        const v = body.allowedEndHour;
        if (!Number.isInteger(v) || v < 0 || v > 23) {
          return res.status(400).json({ error: "allowedEndHour must be an integer 0–23" });
        }
      }
      if (body.messageRetentionDays !== undefined) {
        const v = body.messageRetentionDays;
        if (!Number.isInteger(v) || v < 30 || v > 3650) {
          return res.status(400).json({ error: "messageRetentionDays must be an integer 30–3650" });
        }
      }

      const db = getDb();

      const [org] = await db
        .select()
        .from(orgs)
        .where(eq(orgs.id, ctx.orgId))
        .limit(1);

      if (!org) return res.status(404).json({ error: "Org not found" });

      const payload = (org.payload ?? {}) as Record<string, any>;
      const mp  = { ...(payload.messagingPolicy  ?? {}) };
      const qh  = { ...(payload.quietHoursPolicy ?? {}) };
      const ss  = { ...(payload.safetySettings   ?? {}) };

      if (body.requireAllGuardians              !== undefined) mp.requireAllGuardians              = body.requireAllGuardians;
      if (body.requireSecondAdultForTeamThreads !== undefined) mp.requireSecondAdultForTeamThreads = body.requireSecondAdultForTeamThreads;
      if (body.quietHoursEnabled                !== undefined) qh.enabled                          = body.quietHoursEnabled;
      if (body.allowedStartHour                 !== undefined) qh.allowedStartHour                 = body.allowedStartHour;
      if (body.allowedEndHour                   !== undefined) qh.allowedEndHour                   = body.allowedEndHour;
      if (body.orgTimezone                      !== undefined) qh.timezone                         = body.orgTimezone;
      if (body.allowSocialHandleSharing         !== undefined) ss.allowSocialHandleSharing         = body.allowSocialHandleSharing;
      if (body.messageRetentionDays             !== undefined) ss.messageRetentionDays             = body.messageRetentionDays;

      const newPayload = { ...payload, messagingPolicy: mp, quietHoursPolicy: qh, safetySettings: ss };

      await db.update(orgs).set({ payload: newPayload }).where(eq(orgs.id, ctx.orgId));

      res.json({
        requireAllGuardians:                mp.requireAllGuardians                ?? true,
        requireSecondAdultForTeamThreads:   mp.requireSecondAdultForTeamThreads   ?? false,
        quietHoursEnabled:                  qh.enabled                            ?? true,
        allowedStartHour:                   qh.allowedStartHour                   ?? 5,
        allowedEndHour:                     qh.allowedEndHour                     ?? 21,
        orgTimezone:                        qh.timezone                           ?? "America/Chicago",
        allowSocialHandleSharing:           ss.allowSocialHandleSharing           ?? false,
        messageRetentionDays:               ss.messageRetentionDays               ?? 365,
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /incidents ───────────────────────────────────────────────────────
  // Create a new safety incident report.
  // Body: { subjectType, subjectId?, category, severity?, notes, evidenceSnapshot? }
  router.post("/incidents", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin", "coach");

      const { subjectType, subjectId, category, severity, notes, evidenceSnapshot } = req.body as {
        subjectType:       string;
        subjectId?:        string;
        category:          string;
        severity?:         string;
        notes:             string;
        evidenceSnapshot?: unknown;
      };

      const VALID_SUBJECT_TYPES = ["player", "coach", "parent", "guardian", "staff", "other"];
      const VALID_CATEGORIES    = ["harassment", "inappropriate_content", "bullying", "threat", "grooming", "other"];

      if (!VALID_SUBJECT_TYPES.includes(subjectType)) {
        return res.status(400).json({ error: `subjectType must be one of: ${VALID_SUBJECT_TYPES.join(", ")}` });
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
      }
      if (!notes || notes.trim().length < 20) {
        return res.status(400).json({ error: "notes must be at least 20 characters" });
      }

      const db = getDb();

      const [incident] = await db
        .insert(safetyIncidents)
        .values({
          orgId:            ctx.orgId,
          reporterId:       ctx.userId,
          reporterRole:     ctx.role,
          subjectType,
          subjectId:        subjectId ?? null,
          category,
          severity:         severity ?? null,
          notes,
          evidenceSnapshot: evidenceSnapshot ?? null,
          status:           "open",
        })
        .returning();

      res.status(201).json(incident);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /incidents ────────────────────────────────────────────────────────
  // Returns paginated list of safety incidents for the org.
  // Query params: status (default "open,under_review"), page (default 1), limit (default 50 max 100)
  router.get("/incidents", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");

      const statusParam = (req.query.status as string) ?? "open,under_review";
      const statuses    = statusParam.split(",").map((s) => s.trim());

      const page   = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10) || 1);
      const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50));
      const offset = (page - 1) * limit;

      const db = getDb();

      const items = await db
        .select()
        .from(safetyIncidents)
        .where(
          and(
            eq(safetyIncidents.orgId, ctx.orgId),
            inArray(safetyIncidents.status, statuses),
          ),
        )
        .orderBy(desc(safetyIncidents.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({ items, total: items.length, page, limit });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /incidents/:id ────────────────────────────────────────────────────
  // Returns a single safety incident.
  router.get("/incidents/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");
      const db  = getDb();

      const [incident] = await db
        .select()
        .from(safetyIncidents)
        .where(and(eq(safetyIncidents.id, req.params.id), eq(safetyIncidents.orgId, ctx.orgId)))
        .limit(1);

      if (!incident) return res.status(404).json({ error: "Incident not found" });

      res.json(incident);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PATCH /incidents/:id ──────────────────────────────────────────────────
  // Update triage status of a safety incident.
  // Body: { status, resolutionNote? }
  router.patch("/incidents/:id", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");

      const { status, resolutionNote } = req.body as {
        status:           string;
        resolutionNote?:  string;
      };

      const VALID_STATUSES = ["open", "under_review", "resolved", "escalated_external"];
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }

      const db = getDb();

      const [incident] = await db
        .select()
        .from(safetyIncidents)
        .where(and(eq(safetyIncidents.id, req.params.id), eq(safetyIncidents.orgId, ctx.orgId)))
        .limit(1);

      if (!incident) return res.status(404).json({ error: "Incident not found" });

      const updateFields: Record<string, any> = {
        status,
        resolutionNote: resolutionNote ?? null,
      };

      if (status === "resolved") {
        updateFields.resolvedBy = ctx.userId;
        updateFields.resolvedAt = sql`now()`;
      }

      const [updated] = await db
        .update(safetyIncidents)
        .set(updateFields)
        .where(eq(safetyIncidents.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /dashboard ────────────────────────────────────────────────────────
  // Returns safety metrics for a given period.
  // Query params: period = "7d"|"30d"|"90d" (default "30d")
  router.get("/dashboard", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");

      const period     = (req.query.period as string) ?? "30d";
      const periodDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const periodStartMs  = Date.now() - periodDays * 86400000;
      const periodStart    = new Date(periodStartMs);

      const db = getDb();

      const [
        protectedThreadsRes,
        blockedSendsRes,
        flaggedMessagesRes,
        emergencySendsRes,
        guardianBlocksRes,
        openReviewRes,
        openIncidentsRes,
      ] = await Promise.all([
        db.select({ n: sql<number>`cast(count(*) as int)` })
          .from(messageThreads)
          .where(
            and(
              eq(messageThreads.orgId, ctx.orgId),
              inArray(messageThreads.type, ["coach_to_minor_with_guardian", "coach_to_team_with_adult_copy", "coach_to_parent"]),
              sql`${messageThreads.deletedAt} is null`,
            ),
          ),
        db.select({ n: sql<number>`cast(count(*) as int)` })
          .from(safetyFlags)
          .where(
            and(
              eq(safetyFlags.orgId, ctx.orgId),
              eq(safetyFlags.wasBlocked, true),
              gte(safetyFlags.createdAt, periodStart),
            ),
          ),
        db.select({ n: sql<number>`cast(count(*) as int)` })
          .from(safetyFlags)
          .where(
            and(
              eq(safetyFlags.orgId, ctx.orgId),
              eq(safetyFlags.wasBlocked, false),
              gte(safetyFlags.createdAt, periodStart),
            ),
          ),
        db.select({ n: sql<number>`cast(count(*) as int)` })
          .from(quietHoursLog)
          .where(
            and(
              eq(quietHoursLog.orgId, ctx.orgId),
              eq(quietHoursLog.actionTaken, "emergency_send"),
              gte(quietHoursLog.createdAt, periodStart),
            ),
          ),
        db.select({ n: sql<number>`cast(count(*) as int)` })
          .from(messagingPolicyLog)
          .where(
            and(
              eq(messagingPolicyLog.orgId, ctx.orgId),
              eq(messagingPolicyLog.action, "blocked"),
              gte(messagingPolicyLog.createdAt, periodStart),
            ),
          ),
        db.select({ n: sql<number>`cast(count(*) as int)` })
          .from(flagReviewItems)
          .where(
            and(
              eq(flagReviewItems.orgId, ctx.orgId),
              inArray(flagReviewItems.status, ["open", "escalated"]),
            ),
          ),
        db.select({ n: sql<number>`cast(count(*) as int)` })
          .from(safetyIncidents)
          .where(
            and(
              eq(safetyIncidents.orgId, ctx.orgId),
              inArray(safetyIncidents.status, ["open", "under_review"]),
            ),
          ),
      ]);

      res.json({
        period,
        periodStart: periodStart.toISOString(),
        metrics: {
          protectedThreadsTotal: protectedThreadsRes[0]?.n ?? 0,
          blockedSendsCount:     blockedSendsRes[0]?.n     ?? 0,
          flaggedMessagesCount:  flaggedMessagesRes[0]?.n  ?? 0,
          emergencySendsCount:   emergencySendsRes[0]?.n   ?? 0,
          guardianBlocksCount:   guardianBlocksRes[0]?.n   ?? 0,
          openReviewItems:       openReviewRes[0]?.n        ?? 0,
          openIncidentsCount:    openIncidentsRes[0]?.n    ?? 0,
        },
      });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /export/incidents ─────────────────────────────────────────────────
  // CSV export of safety incidents.
  // Query params: from, to (ISO date strings, optional)
  router.get("/export/incidents", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");
      const db  = getDb();

      const fromParam = req.query.from as string | undefined;
      const toParam   = req.query.to   as string | undefined;

      const conditions: any[] = [eq(safetyIncidents.orgId, ctx.orgId)];
      if (fromParam) conditions.push(gte(safetyIncidents.createdAt, new Date(fromParam)));
      if (toParam)   conditions.push(lte(safetyIncidents.createdAt, new Date(toParam)));

      const rows = await db
        .select()
        .from(safetyIncidents)
        .where(and(...conditions))
        .orderBy(desc(safetyIncidents.createdAt))
        .limit(1000);

      function toCsv(headers: string[], dataRows: string[][]): string {
        return [headers, ...dataRows].map((r) => r.map((v) => JSON.stringify(v ?? "")).join(",")).join("\n");
      }

      const headers = ["id", "created_at", "reporter_role", "subject_type", "category", "severity", "status", "notes_preview"];
      const csvRows = rows.map((row) => [
        row.id,
        row.createdAt ? new Date(row.createdAt).toISOString() : "",
        row.reporterRole ?? "",
        row.subjectType  ?? "",
        row.category     ?? "",
        row.severity     ?? "",
        row.status       ?? "",
        (row.notes ?? "").slice(0, 100),
      ]);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="incidents-export.csv"`);
      res.send(toCsv(headers, csvRows));
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /export/audit ─────────────────────────────────────────────────────
  // CSV export of messaging policy audit log.
  // Query params: from, to (ISO date strings, optional)
  router.get("/export/audit", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");
      const db  = getDb();

      const fromParam = req.query.from as string | undefined;
      const toParam   = req.query.to   as string | undefined;

      const conditions: any[] = [eq(messagingPolicyLog.orgId, ctx.orgId)];
      if (fromParam) conditions.push(gte(messagingPolicyLog.createdAt, new Date(fromParam)));
      if (toParam)   conditions.push(lte(messagingPolicyLog.createdAt, new Date(toParam)));

      const rows = await db
        .select()
        .from(messagingPolicyLog)
        .where(and(...conditions))
        .orderBy(desc(messagingPolicyLog.createdAt))
        .limit(1000);

      function toCsv(headers: string[], dataRows: string[][]): string {
        return [headers, ...dataRows].map((r) => r.map((v) => JSON.stringify(v ?? "")).join(",")).join("\n");
      }

      const headers = ["id", "created_at", "sender_id", "action", "minor_present", "guardians_added_count", "blocked_reason"];
      const csvRows = rows.map((row) => [
        row.id,
        row.createdAt ? new Date(row.createdAt).toISOString() : "",
        row.senderId       ?? "",
        row.action         ?? "",
        String(row.minorPresent ?? false),
        String((row.guardiansAdded as string[])?.length ?? 0),
        row.blockedReason  ?? "",
      ]);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="audit-export.csv"`);
      res.send(toCsv(headers, csvRows));
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /export/blocked ───────────────────────────────────────────────────
  // CSV export of blocked sends (safetyFlags where wasBlocked=true).
  // Query params: from, to (ISO date strings, optional)
  router.get("/export/blocked", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, "owner", "admin");
      const db  = getDb();

      const fromParam = req.query.from as string | undefined;
      const toParam   = req.query.to   as string | undefined;

      const conditions: any[] = [
        eq(safetyFlags.orgId, ctx.orgId),
        eq(safetyFlags.wasBlocked, true),
      ];
      if (fromParam) conditions.push(gte(safetyFlags.createdAt, new Date(fromParam)));
      if (toParam)   conditions.push(lte(safetyFlags.createdAt, new Date(toParam)));

      const rows = await db
        .select()
        .from(safetyFlags)
        .where(and(...conditions))
        .orderBy(desc(safetyFlags.createdAt))
        .limit(1000);

      function toCsv(headers: string[], dataRows: string[][]): string {
        return [headers, ...dataRows].map((r) => r.map((v) => JSON.stringify(v ?? "")).join(",")).join("\n");
      }

      const headers = ["id", "created_at", "sender_id", "sender_role", "max_severity", "categories_str", "body_preview"];
      const csvRows = rows.map((row) => [
        row.id,
        row.createdAt ? new Date(row.createdAt).toISOString() : "",
        row.senderId    ?? "",
        row.senderRole  ?? "",
        row.maxSeverity ?? "",
        (row.categories as string[]).join("|"),
        (row.bodySnapshot as string).slice(0, 120),
      ]);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="blocked-sends-export.csv"`);
      res.send(toCsv(headers, csvRows));
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
