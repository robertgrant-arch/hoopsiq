/**
 * /api/invoices — Invoice and payment management.
 *
 * Admins manage invoices; guardians/players can view their own.
 * Manual payment recording (cash/check/Zelle) is supported alongside Stripe.
 */

import { Router } from "express";
import { createRepository } from "@shared/db";
import { requireOrg, requireOrgRole, ORG_ROLES } from "../../auth/tenant";
import { validateParentChildAccess } from "../parent/access";
import { generateInvoiceNumber } from "../../lib/invoiceNumber";

export function registerInvoiceRoutes(router: Router) {

  // ── GET /api/invoices ─────────────────────────────────────────────────────
  // Admin: all invoices with optional filters
  router.get("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);

      const invoiceList = await repo.invoices.list({
        playerId: req.query.playerId as string | undefined,
        status: req.query.status as string | undefined,
        seasonId: req.query.seasonId as string | undefined,
        overdue: req.query.overdue === "true",
      });
      res.json(invoiceList);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/invoices/my ──────────────────────────────────────────────────
  // Guardian: list invoices for their linked children
  router.get("/my", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.GUARDIAN);
      const repo = createRepository(ctx);

      const guardianRows = await repo.guardians.listPlayersForGuardian(ctx.userId);
      if (guardianRows.length === 0) return res.json([]);

      const all = await Promise.all(
        guardianRows.map((g) => repo.invoices.list({ playerId: g.playerId }))
      );
      res.json(all.flat());
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/invoices/summary ─────────────────────────────────────────────
  // Admin revenue dashboard summary
  router.get("/summary", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const summary = await repo.invoices.revenueSummary(req.query.seasonId as string | undefined);
      res.json(summary);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/invoices/:id ─────────────────────────────────────────────────
  router.get("/:id", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const invoice = await repo.invoices.getWithItems(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      // Guardians can only see their child's invoices
      if (ctx.role === ORG_ROLES.GUARDIAN) {
        await validateParentChildAccess(ctx.orgId, ctx.userId, invoice.playerId);
      }

      res.json(invoice);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/invoices ────────────────────────────────────────────────────
  // Admin creates a manual invoice
  router.post("/", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);

      const { playerId, seasonId, items, dueDate, memo, adminNotes } = req.body as {
        playerId: string;
        seasonId?: string;
        items: Array<{ type: string; description: string; quantity: number; unitAmount: number }>;
        dueDate?: string;
        memo?: string;
        adminNotes?: string;
      };

      if (!playerId || !items?.length) {
        return res.status(400).json({ error: "playerId and items are required" });
      }

      const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitAmount, 0);
      const invoiceNumber = await generateInvoiceNumber(ctx.orgId);

      const invoice = await repo.invoices.create({
        playerId,
        seasonId: seasonId ?? undefined,
        invoiceNumber,
        status: "open",
        subtotal,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: subtotal,
        amountPaid: 0,
        amountDue: subtotal,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        issuedAt: new Date(),
        memo: memo ?? null,
        adminNotes: adminNotes ?? null,
      });

      // Add line items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await repo.invoices.addItem({
          invoiceId: invoice.id,
          type: item.type as any,
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitAmount,
          totalAmount: item.quantity * item.unitAmount,
          sortOrder: i,
        });
      }

      res.status(201).json(await repo.invoices.getWithItems(invoice.id));
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── PATCH /api/invoices/:id/void ──────────────────────────────────────────
  router.patch("/:id/void", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const updated = await repo.invoices.updateStatus(req.params.id, "void" as any);
      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/invoices/:id/payments ───────────────────────────────────────
  // Record a manual payment (cash / check / Zelle etc.)
  router.post("/:id/payments", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);

      const invoice = await repo.invoices.getById(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      const { amount, method, referenceNote, paidAt } = req.body as {
        amount: number;
        method: string;
        referenceNote?: string;
        paidAt?: string;
      };

      if (!amount || !method) {
        return res.status(400).json({ error: "amount and method are required" });
      }

      // Record the payment
      const payment = await repo.payments.record({
        invoiceId: invoice.id,
        playerId: invoice.playerId,
        guardianUserId: invoice.guardianUserId ?? undefined,
        amount,
        method: method as any,
        status: "succeeded",
        referenceNote: referenceNote ?? null,
        recordedByUserId: ctx.userId,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      });

      // Apply payment to invoice (updates amountPaid, amountDue, status)
      const updatedInvoice = await repo.invoices.applyPayment(invoice.id, amount);

      res.status(201).json({ payment, invoice: updatedInvoice });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/invoices/:id/payments ────────────────────────────────────────
  router.get("/:id/payments", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN, ORG_ROLES.COACH);
      const repo = createRepository(ctx);
      const paymentList = await repo.payments.listForInvoice(req.params.id);
      res.json(paymentList);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── POST /api/invoices/:id/send ───────────────────────────────────────────
  // Mark invoice as issued / "sent" to the family
  router.post("/:id/send", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const updated = await repo.invoices.updateStatus(req.params.id, "open" as any);
      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  // ── GET /api/memberships/plans ────────────────────────────────────────────
  // Membership plan CRUD (nested here for simplicity)
  router.get("/plans/all", async (req, res) => {
    try {
      const ctx = await requireOrg(req);
      const repo = createRepository(ctx);
      const plans = await repo.membershipPlans.list({
        seasonId: req.query.seasonId as string | undefined,
        status: ctx.role === ORG_ROLES.GUARDIAN ? "active" : undefined,
      });
      res.json(plans);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.post("/plans", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);

      const { name, description, type, seasonId, priceAmount, allowsPaymentPlan, installmentCount, depositAmount, earlyBirdAmount, earlyBirdDeadline, maxEnrollment } = req.body;

      if (!name || !priceAmount) return res.status(400).json({ error: "name and priceAmount required" });

      const plan = await repo.membershipPlans.create({
        name,
        description: description ?? null,
        type: type ?? "season",
        status: "draft",
        seasonId: seasonId ?? null,
        priceAmount,
        allowsPaymentPlan: allowsPaymentPlan ?? false,
        installmentCount: installmentCount ?? null,
        depositAmount: depositAmount ?? 0,
        earlyBirdAmount: earlyBirdAmount ?? null,
        earlyBirdDeadline: earlyBirdDeadline ? new Date(earlyBirdDeadline) : null,
        maxEnrollment: maxEnrollment ?? null,
      });
      res.status(201).json(plan);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });

  router.patch("/plans/:planId", async (req, res) => {
    try {
      const ctx = await requireOrgRole(req, ORG_ROLES.OWNER, ORG_ROLES.ADMIN);
      const repo = createRepository(ctx);
      const updated = await repo.membershipPlans.update(req.params.planId, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  });
}
