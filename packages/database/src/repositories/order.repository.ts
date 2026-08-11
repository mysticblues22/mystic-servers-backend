import { and, eq } from "drizzle-orm";

import { db } from "../drizzle.js";
import { orderItems } from "../schema/order-items.js";
import { orders } from "../schema/orders.js";

export interface CreateOrderParams {
  orderNumber: string;
  userId: string;
  idempotencyKey?: string | null;
  subtotalAmountCents: number;
  totalAmountCents: number;
  currency: string;
  status?: "pending" | "awaiting_payment" | "paid" | "provisioning" | "active" | "cancelled" | "failed" | "refunded";
  item: {
    planId: string;
    itemType?: "plan" | "ipv4" | "storage" | "backup" | "addon";
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
    billingCycle: string;
  };
}

export class OrderRepository {
  async findByUserIdAndIdempotencyKey(userId: string, idempotencyKey: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, idempotencyKey)));

    if (!order) return null;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return { ...order, items };
  }

  async findById(id: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    if (!order) return null;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return { ...order, items };
  }

  async createOrderWithItem(params: CreateOrderParams) {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber: params.orderNumber,
          userId: params.userId,
          idempotencyKey: params.idempotencyKey || null,
          subtotalAmountCents: params.subtotalAmountCents,
          totalAmountCents: params.totalAmountCents,
          currency: params.currency,
          status: params.status || "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const [newItem] = await tx
        .insert(orderItems)
        .values({
          orderId: newOrder.id,
          planId: params.item.planId,
          itemType: params.item.itemType || "plan",
          description: params.item.description,
          quantity: params.item.quantity,
          unitPriceCents: params.item.unitPriceCents,
          totalPriceCents: params.item.totalPriceCents,
          billingCycle: params.item.billingCycle,
          createdAt: new Date(),
        })
        .returning();

      return {
        ...newOrder,
        items: [newItem],
      };
    });
  }
}

export const orderRepository = new OrderRepository();
