import { invoiceRepository, orderRepository, paymentRepository } from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";
import { InitiatePaymentInput, VerifyPaymentInput } from "../../schemas/payment.schema.js";
import {
  calculatePaymentAmount,
  exchangeRateService,
  isSupportedPaymentCurrency,
} from "../currency/currency.service.js";
import { IPaymentProvider } from "./providers/payment-provider.interface.js";
import { RazorpayPaymentProvider, razorpayPaymentProvider } from "./providers/razorpay.provider.js";

export async function initiatePaymentService(
  userId: string,
  orderId: string,
  input: InitiatePaymentInput,
  idempotencyKey?: string | null,
  providerOverride?: IPaymentProvider,
) {
  const provider = providerOverride || razorpayPaymentProvider;

  const targetCurrency = input.currency.toUpperCase();

  // 1. Verify payment currency support
  if (!isSupportedPaymentCurrency(targetCurrency)) {
    throw new HttpError(
      400,
      "UNSUPPORTED_PAYMENT_CURRENCY",
      `Payment currency '${targetCurrency}' is not supported by Razorpay. Supported payment currencies are USD, INR.`,
    );
  }

  // 2. Lookup order & enforce user IDOR ownership
  const order = await orderRepository.findByUserIdAndId(userId, orderId);
  if (!order) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  // 3. Status checks
  const paidStatuses = ["paid", "provisioning", "active"];
  if (paidStatuses.includes(order.status)) {
    throw new HttpError(
      400,
      "ORDER_ALREADY_PAID",
      "Order has already been paid",
    );
  }

  const invalidStatuses = ["cancelled", "failed", "refunded"];
  if (invalidStatuses.includes(order.status)) {
    throw new HttpError(
      400,
      "INVALID_ORDER_STATUS",
      "Order cannot accept payments in its current status",
    );
  }

  // 4. Server-authoritative price calculation & snapshot generation
  const { amountCents, currency: paymentCurrency } = calculatePaymentAmount(
    order.totalAmountCents,
    targetCurrency as "USD" | "INR",
  );

  const rateInfo = exchangeRateService.getRate(paymentCurrency);

  const paymentSnapshot = {
    pricingRegion: order.currency === "INR" ? "IN" : "INTL",
    sourceCurrency: order.currency || "USD",
    sourceAmountCents: order.totalAmountCents,
    displayCurrency: targetCurrency,
    paymentCurrency,
    exchangeRate: rateInfo.rate,
    exchangeRateTimestamp: rateInfo.retrievedAt.toISOString(),
    convertedAmountCents: amountCents,
    billingCycle: (order as any).items?.[0]?.billingCycle || "monthly",
  };

  // 5. Idempotency pre-check for existing pending payment record
  const existingPendingPayment = await paymentRepository.findPendingByOrderIdAndCurrency(
    order.id,
    paymentCurrency,
  );

  if (existingPendingPayment && existingPendingPayment.providerCheckoutId) {
    return {
      payment: {
        id: existingPendingPayment.id,
        provider: existingPendingPayment.provider,
        providerCheckoutId: existingPendingPayment.providerCheckoutId,
        amountCents: existingPendingPayment.amountCents,
        currency: existingPendingPayment.currency,
        status: existingPendingPayment.status,
        snapshot: existingPendingPayment.metadata || paymentSnapshot,
      },
      checkout: {
        keyId: (provider as any).keyId || "rzp_test_mock_key_id",
        razorpayOrderId: existingPendingPayment.providerCheckoutId,
        amount: existingPendingPayment.amountCents,
        currency: existingPendingPayment.currency,
        displayCurrency: targetCurrency,
        paymentMessage: `Payment will be processed in ${paymentCurrency}.`,
      },
      isReplay: true,
    };
  }

  // 6. Create payment record in database with snapshot metadata
  const payment = await paymentRepository.createPayment({
    orderId: order.id,
    userId,
    provider: provider.providerName,
    amountCents,
    currency: paymentCurrency,
    status: "pending",
    idempotencyKey: idempotencyKey ? idempotencyKey.trim() : null,
    metadata: paymentSnapshot,
  });

  // 7. Initiate checkout session with Provider (Razorpay)
  let checkoutSession;
  try {
    checkoutSession = await provider.createCheckoutSession({
      paymentId: payment.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId,
      amountCents,
      currency: paymentCurrency as "USD" | "INR",
    });
  } catch (err: any) {
    await paymentRepository.updatePaymentStatus(
      payment.id,
      "failed",
      "PROVIDER_ERROR",
      err.message || "Failed to create checkout session with provider",
    );
    throw new HttpError(
      502,
      "PAYMENT_PROVIDER_ERROR",
      `Failed to initiate payment with ${provider.providerName}: ${err.message || "Unknown provider error"}`,
    );
  }

  // 8. Store provider Checkout ID (Razorpay Order ID) & update order status to awaiting_payment
  await paymentRepository.updateProviderCheckoutId(
    payment.id,
    checkoutSession.providerCheckoutId,
  );

  await orderRepository.updateStatusByUserIdAndId(
    userId,
    order.id,
    "awaiting_payment",
  );

  return {
    payment: {
      id: payment.id,
      provider: provider.providerName,
      providerCheckoutId: checkoutSession.providerCheckoutId,
      amountCents,
      currency: paymentCurrency,
      status: "pending",
      snapshot: paymentSnapshot,
    },
    checkout: {
      keyId: checkoutSession.keyId,
      razorpayOrderId: checkoutSession.providerCheckoutId,
      amount: checkoutSession.amount,
      currency: checkoutSession.currency,
      displayCurrency: targetCurrency,
      paymentMessage: `Payment will be processed in ${paymentCurrency}.`,
    },
    isReplay: false,
  };
}

export async function verifyPaymentService(
  userId: string,
  orderId: string,
  input: VerifyPaymentInput,
  providerOverride?: IPaymentProvider,
) {
  const provider = providerOverride || razorpayPaymentProvider;

  // 1. Lookup order with IDOR protection (must belong to userId)
  const order = await orderRepository.findByUserIdAndId(userId, orderId);
  if (!order) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  // 2. Check if order is already in a paid state
  const paidStatuses = ["paid", "provisioning", "active"];
  if (paidStatuses.includes(order.status)) {
    const existingPayment =
      (await paymentRepository.findByProviderCheckoutId(
        provider.providerName,
        input.razorpayOrderId,
      )) || (await paymentRepository.findByOrderId(order.id));

    return {
      order,
      payment: existingPayment,
      verified: true,
      message: "Payment has already been successfully verified",
    };
  }

  // 3. Status restriction: terminal orders cannot be verified to paid
  const invalidStatuses = ["cancelled", "failed", "refunded"];
  if (invalidStatuses.includes(order.status)) {
    throw new HttpError(
      400,
      "INVALID_ORDER_STATUS",
      `Order in status '${order.status}' cannot accept payment verification`,
    );
  }

  // 4. Lookup Mystic payment record
  let payment = await paymentRepository.findByProviderCheckoutId(
    provider.providerName,
    input.razorpayOrderId,
  );

  if (!payment) {
    payment = await paymentRepository.findByOrderId(order.id);
  }

  if (!payment) {
    throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment record not found");
  }

  // 5. Verification Ownership & Checkout ID Consistency
  if (payment.userId !== userId) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (payment.orderId !== order.id) {
    throw new HttpError(
      400,
      "PAYMENT_MISMATCH",
      "Payment record does not match the specified order",
    );
  }

  if (payment.providerCheckoutId && payment.providerCheckoutId !== input.razorpayOrderId) {
    throw new HttpError(
      400,
      "PAYMENT_MISMATCH",
      "Razorpay order ID does not match payment checkout session",
    );
  }

  // 6. Signature Verification (HMAC-SHA256 razorpay_order_id + "|" + razorpay_payment_id)
  const isValidSignature = (provider as RazorpayPaymentProvider).verifyPaymentSignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature,
  );

  if (!isValidSignature) {
    throw new HttpError(
      400,
      "PAYMENT_SIGNATURE_INVALID",
      "Payment signature verification failed",
    );
  }

  // 7. If payment is already succeeded, return idempotent response
  if (payment.status === "succeeded") {
    return {
      order,
      payment,
      verified: true,
      message: "Payment has already been successfully verified",
    };
  }

  // 8. Atomic State Transitions
  const updatedPayment = await paymentRepository.markPaymentSucceeded(
    payment.id,
    input.razorpayPaymentId,
  );

  const updatedOrder = await orderRepository.updateStatusByUserIdAndId(
    userId,
    order.id,
    "paid",
  );

  // 9. Idempotent Invoice Issuance
  try {
    await invoiceRepository.createInvoiceForPaidOrder(
      updatedOrder || order,
      updatedPayment || payment,
    );
  } catch (invoiceErr: any) {
    console.warn(
      `[Invoice Warning] Failed to generate invoice for verified payment order ${order.id}:`,
      invoiceErr.message,
    );
  }

  return {
    order: updatedOrder || order,
    payment: updatedPayment || payment,
    verified: true,
  };
}
