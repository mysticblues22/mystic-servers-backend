import crypto from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "../drizzle.js";
import { invoiceItems } from "../schema/invoice-items.js";
import { invoices } from "../schema/invoices.js";

export class InvoiceRepository {
  async findByOrderId(orderId: string) {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, orderId));

    if (!invoice) return null;

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    return { ...invoice, items };
  }

  async findByUserId(userId: string) {
    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));

    if (userInvoices.length === 0) {
      return [];
    }

    const invoiceIds = userInvoices.map((inv) => inv.id);
    const allItems = await db
      .select()
      .from(invoiceItems)
      .where(inArray(invoiceItems.invoiceId, invoiceIds));

    const itemsByInvoiceId = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const existing = itemsByInvoiceId.get(item.invoiceId) || [];
      existing.push(item);
      itemsByInvoiceId.set(item.invoiceId, existing);
    }

    return userInvoices.map((invoice) => ({
      ...invoice,
      items: itemsByInvoiceId.get(invoice.id) || [],
    }));
  }

  async findByUserIdAndId(userId: string, invoiceId: string) {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));

    if (!invoice) return null;

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    return { ...invoice, items };
  }

  private generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `INV-${dateStr}-${randomSuffix}`;
  }

  async createInvoiceForPaidOrder(order: any, payment?: any) {
    // 1. Idempotency Check: if invoice already exists for this order, return it
    const existing = await this.findByOrderId(order.id);
    if (existing) {
      return existing;
    }

    const currency = payment?.currency || order.currency || "USD";
    const amountPaid = payment?.amountCents || order.totalAmountCents;
    const paidAtDate = payment?.updatedAt ? new Date(payment.updatedAt) : new Date();

    return await db.transaction(async (tx) => {
      // Re-verify inside transaction to prevent race conditions
      const [txExisting] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.orderId, order.id));

      if (txExisting) {
        const items = await tx
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, txExisting.id));
        return { ...txExisting, items };
      }

      const invoiceNumber = this.generateInvoiceNumber();

      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          invoiceNumber,
          userId: order.userId,
          orderId: order.id,
          subtotalCents: order.subtotalAmountCents,
          taxCents: 0,
          totalCents: order.totalAmountCents,
          amountPaidCents: amountPaid,
          currency,
          status: "paid",
          dueDate: new Date(),
          paidAt: paidAtDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const itemsToInsert = (order.items || []).map((item: any) => ({
        invoiceId: newInvoice.id,
        description: item.description || "Compute Instance Plan",
        quantity: item.quantity || 1,
        unitAmountCents: item.unitPriceCents || item.totalPriceCents,
        totalAmountCents: item.totalPriceCents,
        createdAt: new Date(),
      }));

      let insertedItems: any[] = [];
      if (itemsToInsert.length > 0) {
        insertedItems = await tx
          .insert(invoiceItems)
          .values(itemsToInsert)
          .returning();
      }

      return {
        ...newInvoice,
        items: insertedItems,
      };
    });
  }
}

export const invoiceRepository = new InvoiceRepository();
