import {
  bigint,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { invoices } from "./invoices.js";

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "cascade",
      }),

    description: varchar("description", { length: 255 }).notNull(),

    quantity: integer("quantity").default(1).notNull(),

    unitAmountCents: bigint("unit_amount_cents", { mode: "number" }).notNull(),

    totalAmountCents: bigint("total_amount_cents", { mode: "number" }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    invoiceIdIdx: index("invoice_items_invoice_id_idx").on(table.invoiceId),
  }),
);
