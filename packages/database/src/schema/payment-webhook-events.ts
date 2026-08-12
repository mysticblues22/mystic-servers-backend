import {
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
import { payments } from "./payments.js";

export const webhookEventStatusEnum = pgEnum("webhook_event_status", [
  "pending",
  "processed",
  "failed",
  "ignored",
]);

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    provider: varchar("provider", { length: 50 }).notNull(),

    providerEventId: varchar("provider_event_id", { length: 255 }).notNull(),

    eventType: varchar("event_type", { length: 100 }).notNull(),

    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),

    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),

    status: webhookEventStatusEnum("status").default("pending").notNull(),

    processedAt: timestamp("processed_at", {
      withTimezone: true,
    }),

    errorMessage: text("error_message"),

    payload: jsonb("payload"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    providerEventUnique: unique("payment_webhook_events_provider_event_unique").on(
      table.provider,
      table.providerEventId,
    ),
    paymentIdIdx: index("payment_webhook_events_payment_id_idx").on(table.paymentId),
    orderIdIdx: index("payment_webhook_events_order_id_idx").on(table.orderId),
    statusIdx: index("payment_webhook_events_status_idx").on(table.status),
    createdAtIdx: index("payment_webhook_events_created_at_idx").on(table.createdAt),
  }),
);
