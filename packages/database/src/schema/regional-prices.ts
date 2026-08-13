import {
  bigint,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { plans } from "./plans.js";

export const regionalPrices = pgTable("regional_prices", {
  id: uuid("id").defaultRandom().primaryKey(),

  planId: uuid("plan_id")
    .references(() => plans.id, { onDelete: "cascade" })
    .notNull(),

  regionCode: varchar("region_code", { length: 20 }).notNull(),

  currency: varchar("currency", { length: 3 }).notNull(),

  monthlyPriceCents: bigint("monthly_price_cents", { mode: "number" }).notNull(),

  annualPriceCents: bigint("annual_price_cents", { mode: "number" }).notNull(),

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
});
