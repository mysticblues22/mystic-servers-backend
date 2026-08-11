import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { orders } from "./orders.js";
import { plans } from "./plans.js";

export const orderItemTypeEnum = pgEnum("order_item_type", [
  "plan",
  "ipv4",
  "storage",
  "backup",
  "addon",
]);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, {
        onDelete: "cascade",
      }),

    planId: uuid("plan_id").references(() => plans.id, {
      onDelete: "set null",
    }),

    itemType: orderItemTypeEnum("item_type").default("plan").notNull(),

    description: varchar("description", { length: 255 }).notNull(),

    quantity: integer("quantity").default(1).notNull(),

    // Immutable pricing captured at checkout time (in bigint cents)
    unitPriceCents: bigint("unit_price_cents", { mode: "number" }).notNull(),

    totalPriceCents: bigint("total_price_cents", { mode: "number" }).notNull(),

    billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
  }),
);
