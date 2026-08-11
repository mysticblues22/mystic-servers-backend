import {
  bigint,
  index,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "awaiting_payment",
  "paid",
  "provisioning",
  "active",
  "cancelled",
  "failed",
  "refunded",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    // Idempotency key for preventing duplicate POST /orders processing (user-scoped)
    idempotencyKey: varchar("idempotency_key", { length: 255 }),

    // Financial totals (in bigint cents)
    subtotalAmountCents: bigint("subtotal_amount_cents", { mode: "number" }).notNull(),

    totalAmountCents: bigint("total_amount_cents", { mode: "number" }).notNull(),

    currency: varchar("currency", { length: 3 }).default("USD").notNull(),

    status: orderStatusEnum("status").default("pending").notNull(),

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
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    statusIdx: index("orders_status_idx").on(table.status),
    userIdIdempotencyKeyUnique: unique("orders_user_id_idempotency_key_unique").on(
      table.userId,
      table.idempotencyKey,
    ),
  }),
);
