/**
 * /api/registrations — Player registration pipeline.
 *
 * Families submit registrations; admins review and accept/deny.
 * On acceptance, an invoice is automatically generated.
 *
 * Security:
 *  - POST (submit): any authenticated user (guardian submits for their child)
 *  - PATCH (status updates): owner/admin/coach only
 *  - GET: coach+ for full list; guardian can only see own registrations
 */

import { Router } from "express";
import { createRepository } from "@shared/db";
import { requireOrg, requireOrgRole, ORG_ROLES, HttpError } from "../../auth/tenant";
import { validateParentChildAccess } from "../parent/access";
import { generateInvoiceNumber } from "../../lib/invoiceNumber";

export function registerRegistrationRoutes(router: Router) {

  // ── GET /api/registrations ────────────────────────────────────────────────
  // Admin/coach list view — full pipeline with filters
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const regs = await repo.registrations.list({
        seasonId: req.query.seasonId as string | undefined,
        status: req.query.status as string | undefined,
        playerId: req.query.playerId as string | undefined,
      });
      res.json(regs);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/registrations/my ─────────────────────────────────────────────
  // Guardian sees their own child's registrations
  router.get("/my", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      const repo = createRepository(ctx);

      // Find all players this guardian is linked to
      const guardianRows = await repo.guardians.listPlayersForGuardian(ctx.userId);
      const playerIds = guardianRows.map((g) => g.playerId);

      if (playerIds.length === 0) return res.json([]);

      // List registrations for all linked players
      const all = await Promise.all(
        playerIds.map((pid) => repo.registrations.list({ playerId: pid }))
      );
      res.json(all.flat());
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/registrations/:id ────────────────────────────────────────────
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const reg = await repo.registrations.getById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration not found" });

      // Guardians can only view their child's registration
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, reg.playerId);
      }

      res.json(reg);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/registrations ───────────────────────────────────────────────
  // Family submits a registration
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);

      const { playerId, seasonId, planId, teamId } = req.body as {
        playerId: string;
        seasonId: string;
        planId?: string;
        teamId?: string;
      };

      if (!playerId || !seasonId) {
        return res.status(400).json({ error: "playerId and seasonId are required" });
      }

      // If submitting as a guardian, enforce parent-child link
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, playerId);
      }

      // Lookup plan price for effective amount
      let effectiveAmount = 0;
      if (planId) {
        const plan = await repo.membershipPlans.getById(planId);
        if (!plan) return res.status(404).json({ error: "Plan not found" });
        if (plan.status !== "active") return res.status(400).json({ error: "Plan is not active" });
        effectiveAmount = plan.priceAmount;

        // Apply early-bird discount
        if (plan.earlyBirdAmount && plan.earlyBirdDeadline && new Date() <= plan.earlyBirdDeadline) {
          effectiveAmount = effectiveAmount - plan.earlyBirdAmount;
        }
      }

      const reg = await repo.registrations.create({
        playerId,
        seasonId,
        planId: planId ?? null,
        teamId: teamId ?? null,
        status: "pending",
        effectiveAmount,
        discountAmount: 0,
      });

      res.status(201).json(reg);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PATCH /api/registrations/:id/status ──────────────────────────────────
  // Admin accepts / denies / waitlists registrations
  router.patch("/:id/status", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const { status, adminNotes } = req.body as {
        status: "accepted" | "denied" | "waitlisted" | "cancelled" | "active" | "incomplete";
        adminNotes?: string;
      };

      const validStatuses = ["accepted","denied","waitlisted","cancelled","active","incomplete"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      const reg = await repo.registrations.getById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration not found" });

      const updated = await repo.registrations.updateStatus(req.params.id, status, {
        adminNotes,
        acceptedByUserId: ctx.userId,
      });

      // Auto-generate invoice when accepted (if a plan is attached)
      if (status === "accepted" && reg.planId && !reg.effectiveAmount) {
        // noop: amount was 0 — free registration
      } else if (status === "accepted" && reg.effectiveAmount > 0) {
        const plan = reg.planId ? await repo.membershipPlans.getById(reg.planId) : null;
        const invoiceNumber = await generateInvoiceNumber(ctx.orgId);

        const invoice = await repo.invoices.create({
          seasonId: reg.seasonId ?? undefined,
          registrationId: reg.id,
          playerId: reg.playerId,
          invoiceNumber,
          status: "open",
          subtotal: reg.effectiveAmount,
          discountAmount: reg.discountAmount,
          taxAmount: 0,
          totalAmount: reg.effectiveAmount - reg.discountAmount,
          amountPaid: 0,
          amountDue: reg.effectiveAmount - reg.discountAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
          issuedAt: new Date(),
          memo: plan ? `${plan.name} — ${reg.seasonId ?? "registration"}` : "Season registration",
        });

        // Add line item
        await repo.invoices.addItem({
          invoiceId: invoice.id,
          type: "membership",
          description: plan?.name ?? "Season Registration",
          quantity: 1,
          unitAmount: reg.effectiveAmount,
          totalAmount: reg.effectiveAmount,
          membershipPlanId: reg.planId ?? undefined,
          sortOrder: 0,
        });

        if (reg.discountAmount > 0) {
          await repo.invoices.addItem({
            invoiceId: invoice.id,
            type: "discount",
            description: reg.discountReason ?? "Discount",
            quantity: 1,
            unitAmount: -reg.discountAmount,
            totalAmount: -reg.discountAmount,
            sortOrder: 1,
          });
        }

        return res.json({ registration: updated, invoice });
      }

      res.json({ registration: updated });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/registrations/:id/cancel ───────────────────────────────────
  // Guardian or admin can cancel
  router.post("/:id/cancel", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);

      const reg = await repo.registrations.getById(req.params.id);
      if (!reg) return res.status(404).json({ error: "Registration not found" });

      // Guardians can only cancel their own child's registration
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, reg.playerId);
        // Guardians cannot cancel after acceptance without admin
        if (reg.status === "active") {
          return res.status(403).json({ error: "Contact your program admin to cancel an active registration" });
        }
      }

      const updated = await repo.registrations.updateStatus(req.params.id, "cancelled");
      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
