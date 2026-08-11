import {
  bigint,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { orders } from "./orders.js";
import { users } from "./users.js";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "unpaid",
  "paid",
  "void",
  "refunded",
]);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceNumber: varchar("invoice_number", { length: 32 }).notNull().unique(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),

    // Preserved independent financial state (in bigint cents)
    subtotalCents: bigint("subtotal_cents", { mode: "number" }).notNull(),

    taxCents: bigint("tax_cents", { mode: "number" }).default(0).notNull(),

    totalCents: bigint("total_cents", { mode: "number" }).notNull(),

    amountPaidCents: bigint("amount_paid_cents", { mode: "number" }).default(0).notNull(),

    currency: varchar("currency", { length: 3 }).default("USD").notNull(),

    status: invoiceStatusEnum("status").default("unpaid").notNull(),

    dueDate: timestamp("due_date", {
      withTimezone: true,
    }).notNull(),

    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

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
    userIdIdx: index("invoices_user_id_idx").on(table.userId),
    statusIdx: index("invoices_status_idx").on(table.status),
  }),
);
