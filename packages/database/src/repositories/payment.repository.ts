import { and, eq } from "drizzle-orm";

import { db } from "../drizzle.js";
import { payments } from "../schema/payments.js";
import { paymentWebhookEvents } from "../schema/payment-webhook-events.js";

export interface CreatePaymentParams {
  orderId: string;
  userId: string;
  provider: string;
  providerCheckoutId?: string | null;
  providerPaymentId?: string | null;
  amountCents: number;
  currency?: string;
  status?: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded";
  idempotencyKey?: string | null;
  metadata?: Record<string, any> | null;
}

export class PaymentRepository {
  async findById(id: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    return payment || null;
  }

  async findByOrderId(orderId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
    return payment || null;
  }

  async findPendingByOrderIdAndCurrency(orderId: string, currency: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.orderId, orderId),
          eq(payments.currency, currency),
          eq(payments.status, "pending"),
        ),
      );
    return payment || null;
  }

  async findByProviderCheckoutId(provider: string, providerCheckoutId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.provider, provider),
          eq(payments.providerCheckoutId, providerCheckoutId),
        ),
      );
    return payment || null;
  }

  async findByProviderPaymentId(provider: string, providerPaymentId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.provider, provider),
          eq(payments.providerPaymentId, providerPaymentId),
        ),
      );
    return payment || null;
  }

  async createPayment(params: CreatePaymentParams) {
    const [newPayment] = await db
      .insert(payments)
      .values({
        orderId: params.orderId,
        userId: params.userId,
        provider: params.provider,
        providerCheckoutId: params.providerCheckoutId || null,
        providerPaymentId: params.providerPaymentId || null,
        amountCents: params.amountCents,
        currency: params.currency || "USD",
        status: params.status || "pending",
        idempotencyKey: params.idempotencyKey || null,
        metadata: params.metadata || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newPayment;
  }

  async updateProviderCheckoutId(id: string, providerCheckoutId: string) {
    const [updated] = await db
      .update(payments)
      .set({
        providerCheckoutId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();
    return updated || null;
  }

  async updatePaymentStatus(
    id: string,
    status: "pending" | "processing" | "succeeded" | "failed" | "cancelled" | "refunded",
    failureCode?: string | null,
    failureMessage?: string | null,
  ) {
    const [updated] = await db
      .update(payments)
      .set({
        status,
        failureCode: failureCode || null,
        failureMessage: failureMessage || null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();
    return updated || null;
  }

  async markPaymentSucceeded(id: string, providerPaymentId: string) {
    const [updated] = await db
      .update(payments)
      .set({
        status: "succeeded",
        providerPaymentId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();
    return updated || null;
  }

  async findByWebhookEventId(provider: string, providerEventId: string) {
    const [eventRecord] = await db
      .select()
      .from(paymentWebhookEvents)
      .where(
        and(
          eq(paymentWebhookEvents.provider, provider),
          eq(paymentWebhookEvents.providerEventId, providerEventId),
        ),
      );
    return eventRecord || null;
  }

  async recordWebhookEvent(params: {
    provider: string;
    providerEventId: string;
    eventType: string;
    paymentId?: string | null;
    orderId?: string | null;
    status?: "pending" | "processed" | "failed" | "ignored";
    payload?: Record<string, any> | null;
    errorMessage?: string | null;
  }) {
    const [eventRecord] = await db
      .insert(paymentWebhookEvents)
      .values({
        provider: params.provider,
        providerEventId: params.providerEventId,
        eventType: params.eventType,
        paymentId: params.paymentId || null,
        orderId: params.orderId || null,
        status: params.status || "pending",
        payload: params.payload || null,
        errorMessage: params.errorMessage || null,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    if (!eventRecord) {
      return await this.findByWebhookEventId(params.provider, params.providerEventId);
    }

    return eventRecord;
  }

  async updateWebhookEventStatus(
    id: string,
    status: "pending" | "processed" | "failed" | "ignored",
    errorMessage?: string | null,
    paymentId?: string | null,
    orderId?: string | null,
  ) {
    const updateData: Record<string, any> = {
      status,
      errorMessage: errorMessage || null,
    };

    if (status === "processed") {
      updateData.processedAt = new Date();
    }

    if (paymentId) updateData.paymentId = paymentId;
    if (orderId) updateData.orderId = orderId;

    const [updated] = await db
      .update(paymentWebhookEvents)
      .set(updateData)
      .where(eq(paymentWebhookEvents.id, id))
      .returning();

    return updated || null;
  }
}

export const paymentRepository = new PaymentRepository();
