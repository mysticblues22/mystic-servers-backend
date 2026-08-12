import {
  bigint,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { orders } from "./orders.js";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id").notNull(),

    userId: uuid("user_id").notNull(),

    // Payment provider name (e.g. "razorpay")
    provider: varchar("provider", { length: 50 }).notNull(),

    // Provider Payment ID (e.g. Razorpay Payment ID: pay_K1234567890xyz)
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),

    // Provider Checkout ID / Order ID (e.g. Razorpay Order ID: order_K1234567890abc)
    providerCheckoutId: varchar("provider_checkout_id", { length: 255 }),

    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),

    currency: varchar("currency", { length: 3 }).default("USD").notNull(),

    status: paymentStatusEnum("status").default("pending").notNull(),

    idempotencyKey: varchar("idempotency_key", { length: 255 }),

    failureCode: varchar("failure_code", { length: 100 }),

    failureMessage: text("failure_message"),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orderUserFk: foreignKey({
      name: "payments_order_user_fk",
      columns: [table.orderId, table.userId],
      foreignColumns: [orders.id, orders.userId],
    }).onDelete("restrict"),

    orderIdIdx: index("payments_order_id_idx").on(table.orderId),
    userIdIdx: index("payments_user_id_idx").on(table.userId),
    statusIdx: index("payments_status_idx").on(table.status),

    providerPaymentIdUnique: unique("payments_provider_payment_id_unique").on(
      table.provider,
      table.providerPaymentId,
    ),
    providerCheckoutIdUnique: unique("payments_provider_checkout_id_unique").on(
      table.provider,
      table.providerCheckoutId,
    ),
  }),
);
