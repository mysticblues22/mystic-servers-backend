import crypto from "node:crypto";
import { invoiceRepository, orderRepository, paymentRepository } from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";
import { razorpayPaymentProvider } from "./providers/razorpay.provider.js";

export async function processRazorpayWebhookService(
  rawBody: string | Buffer,
  signature: string | undefined,
  parsedPayload: any,
) {
  // 1. Signature Verification
  const isValidSignature = razorpayPaymentProvider.verifyWebhookSignature(
    rawBody,
    signature,
  );

  if (!isValidSignature) {
    throw new HttpError(401, "UNAUTHORIZED", "Invalid webhook signature");
  }

  // 2. Extract Event ID & Type
  const rawString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const providerEventId =
    parsedPayload?.event_id ||
    parsedPayload?.id ||
    crypto.createHash("sha256").update(rawString).digest("hex");

  const eventType = parsedPayload?.event || "unknown";

  // 3. Deduplicate Webhook Event Record
  const eventRecord = await paymentRepository.recordWebhookEvent({
    provider: "razorpay",
    providerEventId,
    eventType,
    payload: parsedPayload,
    status: "pending",
  });

  if (eventRecord && (eventRecord.status === "processed" || eventRecord.status === "ignored")) {
    return { status: "ok", duplicate: true };
  }

  // 4. Handle Event Types
  try {
    if (eventType === "payment.captured") {
      const entity = parsedPayload?.payload?.payment?.entity;
      if (!entity) {
        throw new HttpError(400, "BAD_REQUEST", "Missing payment entity in payload");
      }

      const razorpayPaymentId = entity.id;
      const razorpayOrderId = entity.order_id;
      const razorpayAmount = Number(entity.amount);
      const razorpayCurrency = entity.currency;

      if (!razorpayOrderId) {
        throw new HttpError(400, "BAD_REQUEST", "Missing Razorpay order_id in payment entity");
      }

      // Lookup Mystic Payment Record
      const payment = await paymentRepository.findByProviderCheckoutId("razorpay", razorpayOrderId);
      if (!payment) {
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "failed",
          `Mystic payment record not found for providerCheckoutId '${razorpayOrderId}'`,
        );
        throw new HttpError(404, "PAYMENT_NOT_FOUND", "Mystic payment record not found");
      }

      // Lookup Associated Order
      const order = await orderRepository.findById(payment.orderId);
      if (!order) {
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "failed",
          `Associated order '${payment.orderId}' not found`,
        );
        throw new HttpError(404, "ORDER_NOT_FOUND", "Associated order not found");
      }

      // Financial Verification
      if (payment.providerCheckoutId !== razorpayOrderId) {
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "failed",
          `Razorpay order_id mismatch: expected '${payment.providerCheckoutId}', got '${razorpayOrderId}'`,
          payment.id,
          order.id,
        );
        throw new HttpError(400, "AMOUNT_MISMATCH", "Razorpay order_id mismatch");
      }

      if (payment.amountCents !== razorpayAmount) {
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "failed",
          `Payment amount mismatch: expected ${payment.amountCents}, got ${razorpayAmount}`,
          payment.id,
          order.id,
        );
        throw new HttpError(400, "AMOUNT_MISMATCH", "Payment amount mismatch");
      }

      if (payment.currency !== razorpayCurrency) {
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "failed",
          `Payment currency mismatch: expected '${payment.currency}', got '${razorpayCurrency}'`,
          payment.id,
          order.id,
        );
        throw new HttpError(400, "CURRENCY_MISMATCH", "Payment currency mismatch");
      }

      // State Machine Checks
      const paidOrderStatuses = ["paid", "provisioning", "active"];
      if (paidOrderStatuses.includes(order.status)) {
        try {
          await invoiceRepository.createInvoiceForPaidOrder(order, payment);
        } catch {
          // Ignore secondary invoice errors if already paid
        }
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "processed",
          null,
          payment.id,
          order.id,
        );
        return { status: "ok", alreadyPaid: true };
      }

      const terminalOrderStatuses = ["cancelled", "refunded", "failed"];
      if (terminalOrderStatuses.includes(order.status)) {
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "failed",
          `Order in terminal status '${order.status}' cannot transition to paid`,
          payment.id,
          order.id,
        );
        throw new HttpError(
          400,
          "INVALID_ORDER_STATUS",
          `Order in terminal status '${order.status}' cannot transition to paid`,
        );
      }

      if (payment.status === "succeeded") {
        try {
          await invoiceRepository.createInvoiceForPaidOrder(order, payment);
        } catch {
          // Ignore secondary invoice errors if already succeeded
        }
        await paymentRepository.updateWebhookEventStatus(
          eventRecord.id,
          "processed",
          null,
          payment.id,
          order.id,
        );
        return { status: "ok", alreadySucceeded: true };
      }

      // Atomic State Transitions
      await paymentRepository.markPaymentSucceeded(payment.id, razorpayPaymentId);
      await orderRepository.updateOrderStatusById(order.id, "paid");

      // Idempotent Invoice Generation (Non-blocking for payment status)
      try {
        await invoiceRepository.createInvoiceForPaidOrder(order, payment);
      } catch (invoiceErr: any) {
        console.warn(`[Invoice Warning] Failed to generate invoice for order ${order.id}:`, invoiceErr.message);
      }

      await paymentRepository.updateWebhookEventStatus(
        eventRecord.id,
        "processed",
        null,
        payment.id,
        order.id,
      );

      return { status: "ok" };
    }

    if (eventType === "payment.failed") {
      const entity = parsedPayload?.payload?.payment?.entity;
      const razorpayPaymentId = entity?.id;
      const razorpayOrderId = entity?.order_id;
      const failureCode = entity?.error_code || "PAYMENT_FAILED";
      const failureMessage = entity?.error_description || "Razorpay payment failed";

      let paymentId: string | null = null;
      let orderId: string | null = null;

      if (razorpayOrderId) {
        const payment = await paymentRepository.findByProviderCheckoutId("razorpay", razorpayOrderId);
        if (payment && payment.status !== "succeeded") {
          paymentId = payment.id;
          orderId = payment.orderId;
          await paymentRepository.updatePaymentStatus(
            payment.id,
            "failed",
            failureCode,
            failureMessage,
          );
        }
      }

      await paymentRepository.updateWebhookEventStatus(
        eventRecord.id,
        "processed",
        null,
        paymentId,
        orderId,
      );

      return { status: "ok" };
    }

    // Unhandled / Unknown events recorded as ignored
    await paymentRepository.updateWebhookEventStatus(
      eventRecord.id,
      "ignored",
      `Unhandled event type '${eventType}'`,
    );

    return { status: "ok" };
  } catch (err: any) {
    if (err instanceof HttpError) {
      throw err;
    }

    await paymentRepository.updateWebhookEventStatus(
      eventRecord.id,
      "failed",
      err.message || "Webhook processing error",
    );

    throw new HttpError(500, "INTERNAL_ERROR", "Failed to process webhook event");
  }
}
