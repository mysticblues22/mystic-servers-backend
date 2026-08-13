import crypto from "node:crypto";
import { orderRepository, planRepository } from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";
import { CreateOrderInput } from "../../schemas/order.schema.js";

function generateOrderNumber(): string {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${timestampPart}-${randomPart}`;
}

export async function getOrdersService(userId: string) {
  const orders = await orderRepository.findByUserId(userId);
  return { orders };
}

export async function getOrderByIdService(userId: string, orderId: string) {
  const order = await orderRepository.findByUserIdAndId(userId, orderId);

  if (!order) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return { order };
}

export async function cancelOrderService(userId: string, orderId: string) {
  const existingOrder = await orderRepository.findByUserIdAndId(userId, orderId);

  if (!existingOrder) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const cancellableStatuses = ["pending", "awaiting_payment"];
  if (!cancellableStatuses.includes(existingOrder.status)) {
    throw new HttpError(
      400,
      "INVALID_ORDER_STATUS",
      "Order cannot be cancelled in its current status",
    );
  }

  const updatedOrder = await orderRepository.updateStatusByUserIdAndId(
    userId,
    orderId,
    "cancelled",
  );

  if (!updatedOrder) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return { order: updatedOrder };
}

export async function createOrderService(
  userId: string,
  input: CreateOrderInput,
  idempotencyKey?: string | null,
) {
  const cleanIdempotencyKey = idempotencyKey ? idempotencyKey.trim() : null;

  // 1. Idempotency pre-check
  if (cleanIdempotencyKey) {
    const existingOrder = await orderRepository.findByUserIdAndIdempotencyKey(
      userId,
      cleanIdempotencyKey,
    );
    if (existingOrder) {
      return { order: existingOrder, isReplay: true };
    }
  }

  // 2. Resolve plan & validate active status
  const plan = await planRepository.findById(input.planId);
  if (!plan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  if (plan.status !== "active") {
    throw new HttpError(
      400,
      "INACTIVE_PLAN",
      "Selected plan is inactive and cannot be ordered",
    );
  }

  // 3. Server-side price calculation accounting for duration months
  let durationMonths = input.termMonths || 1;
  const cycleLower = (input.billingCycle || "").toLowerCase();

  if (cycleLower.includes("annual") || cycleLower.includes("12") || cycleLower === "year") {
    durationMonths = 12;
  } else if (cycleLower.includes("semi") || cycleLower.includes("6")) {
    durationMonths = 6;
  } else if (cycleLower.includes("24") || cycleLower.includes("biennial")) {
    durationMonths = 24;
  }

  let unitPriceCents = plan.monthlyPriceCents;
  let termMultiplier = durationMonths;
  if (durationMonths === 12 && plan.annualPriceCents) {
    unitPriceCents = plan.annualPriceCents;
    termMultiplier = 1; // annualPriceCents is the total annual price
  }

  const totalPriceCents = unitPriceCents * termMultiplier * input.quantity;
  const subtotalAmountCents = totalPriceCents;
  const totalAmountCents = totalPriceCents;
  const currency = plan.currency;
  const cycleLabel = durationMonths > 1 ? `${durationMonths} Months` : (input.billingCycle === "annual" ? "Annual" : "Monthly");
  const description = `${plan.name} Plan (${cycleLabel})`;
  const orderNumber = generateOrderNumber();

  // 4. Create order and order_item inside transaction
  try {
    const newOrder = await orderRepository.createOrderWithItem({
      orderNumber,
      userId,
      idempotencyKey: cleanIdempotencyKey,
      subtotalAmountCents,
      totalAmountCents,
      currency,
      status: "pending",
      item: {
        planId: plan.id,
        itemType: "plan",
        description,
        quantity: input.quantity,
        unitPriceCents,
        totalPriceCents,
        billingCycle: input.billingCycle,
      },
    });

    return { order: newOrder, isReplay: false };
  } catch (err: unknown) {
    // 5. Race condition fallback for unique idempotency key constraint
    if (cleanIdempotencyKey) {
      const existingOrder = await orderRepository.findByUserIdAndIdempotencyKey(
        userId,
        cleanIdempotencyKey,
      );
      if (existingOrder) {
        return { order: existingOrder, isReplay: true };
      }
    }
    throw err;
  }
}
