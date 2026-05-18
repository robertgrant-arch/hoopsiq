// shared/db/repositories/billing.ts
// Domain repository: billing
// Auto-extracted from shared/db/repository.ts as part of VSA refactor.

import { and, desc, eq, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  invoices, invoiceItems, payments, paymentPlans,
  type NewInvoice, type NewInvoiceItem, type NewPayment, type NewPaymentPlan
} from "../schema";
import type { RepoContext } from "../repository";

export function createBillingRepository(db: Db, ctx: RepoContext) {
  return {
    invoices: {
      async list(opts: { playerId?: string; status?: string; seasonId?: string; overdue?: boolean } = {}) {
        const conditions = [eq(invoices.orgId, ctx.orgId)];
        if (opts.playerId) conditions.push(eq(invoices.playerId, opts.playerId));
        if (opts.status) conditions.push(sql`${invoices.status} = ${opts.status}`);
        if (opts.seasonId) conditions.push(eq(invoices.seasonId, opts.seasonId));
        if (opts.overdue) {
          conditions.push(
            sql`${invoices.status} IN ('open','partial')`,
            lte(invoices.dueDate, new Date()),
          );
        }
        return db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.orgId, ctx.orgId)))
          .limit(1);
        return row ?? null;
      },
      async getWithItems(id: string) {
        const invoice = await this.getById(id);
        if (!invoice) return null;
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, id))
          .orderBy(invoiceItems.sortOrder);
        return { ...invoice, items };
      },
      async create(input: Omit<NewInvoice, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(invoices)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async addItem(item: Omit<NewInvoiceItem, "orgId">) {
        const [row] = await db
          .insert(invoiceItems)
          .values({ ...item, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async updateStatus(id: string, status: typeof invoices.status._.data, paidAmount?: number) {
        const patch: Record<string, unknown> = { status, updatedAt: new Date() };
        if (paidAmount !== undefined) {
          patch.amountPaid = paidAmount;
          // Recalculate amount_due via returning and caller updates
        }
        if (status === "paid") patch.paidAt = new Date();
        const [row] = await db
          .update(invoices)
          .set(patch)
          .where(and(eq(invoices.id, id), eq(invoices.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      /** Recalculate amountDue after a payment is applied */
      async applyPayment(invoiceId: string, paymentAmount: number) {
        const [row] = await db
          .update(invoices)
          .set({
            amountPaid: sql`amount_paid + ${paymentAmount}`,
            amountDue: sql`GREATEST(0, amount_due - ${paymentAmount})`,
            status: sql`CASE
              WHEN amount_paid + ${paymentAmount} >= total_amount THEN 'paid'::invoice_status
              WHEN amount_paid + ${paymentAmount} > 0 THEN 'partial'::invoice_status
              ELSE status
            END`,
            paidAt: sql`CASE WHEN amount_paid + ${paymentAmount} >= total_amount THEN now() ELSE paid_at END`,
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, ctx.orgId)))
          .returning();
        return row;
      },
      /** Revenue summary for admin dashboard */
      async revenueSummary(seasonId?: string) {
        const conditions = [eq(invoices.orgId, ctx.orgId)];
        if (seasonId) conditions.push(eq(invoices.seasonId, seasonId));
        const [row] = await db
          .select({
            totalBilled: sql<number>`coalesce(sum(total_amount),0)::int`,
            totalCollected: sql<number>`coalesce(sum(amount_paid),0)::int`,
            totalOutstanding: sql<number>`coalesce(sum(amount_due),0)::int`,
            overdueCount: sql<number>`count(*) filter (where status = 'overdue')::int`,
            openCount: sql<number>`count(*) filter (where status IN ('open','partial'))::int`,
            paidCount: sql<number>`count(*) filter (where status = 'paid')::int`,
          })
          .from(invoices)
          .where(and(...conditions));
        return row;
      },
    },
    payments: {
      async listForInvoice(invoiceId: string) {
        return db
          .select()
          .from(payments)
          .where(and(eq(payments.invoiceId, invoiceId), eq(payments.orgId, ctx.orgId)))
          .orderBy(desc(payments.createdAt));
      },
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(payments)
          .where(and(eq(payments.playerId, playerId), eq(payments.orgId, ctx.orgId)))
          .orderBy(desc(payments.createdAt));
      },
      async record(input: Omit<NewPayment, "orgId">) {
        const [row] = await db
          .insert(payments)
          .values({ ...input, orgId: ctx.orgId })
          .returning();
        return row;
      },
      async updateStatus(id: string, status: "succeeded" | "failed" | "refunded" | "disputed", opts: { failureReason?: string } = {}) {
        const patch: Record<string, unknown> = { status, updatedAt: new Date() };
        if (status === "succeeded") patch.paidAt = new Date();
        if (status === "failed") {
          patch.failedAt = new Date();
          patch.failureReason = opts.failureReason;
        }
        const [row] = await db
          .update(payments)
          .set(patch)
          .where(and(eq(payments.id, id), eq(payments.orgId, ctx.orgId)))
          .returning();
        return row;
      },
    },
    paymentPlans: {
      async listForPlayer(playerId: string) {
        return db
          .select()
          .from(paymentPlans)
          .where(and(eq(paymentPlans.playerId, playerId), eq(paymentPlans.orgId, ctx.orgId)))
          .orderBy(desc(paymentPlans.createdAt));
      },
      async getById(id: string) {
        const [row] = await db
          .select()
          .from(paymentPlans)
          .where(and(eq(paymentPlans.id, id), eq(paymentPlans.orgId, ctx.orgId)))
          .limit(1);
        return row ?? null;
      },
      async create(input: Omit<NewPaymentPlan, "orgId" | "createdByUserId">) {
        const [row] = await db
          .insert(paymentPlans)
          .values({ ...input, orgId: ctx.orgId, createdByUserId: ctx.userId })
          .returning();
        return row;
      },
      async updateStatus(id: string, status: "active" | "completed" | "defaulted" | "cancelled") {
        const [row] = await db
          .update(paymentPlans)
          .set({ status, updatedAt: new Date() })
          .where(and(eq(paymentPlans.id, id), eq(paymentPlans.orgId, ctx.orgId)))
          .returning();
        return row;
      },
    },
  };
}
