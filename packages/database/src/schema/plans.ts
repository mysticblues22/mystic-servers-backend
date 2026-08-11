import {
  bigint,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const planStatusEnum = pgEnum("plan_status", [
  "active",
  "deprecated",
  "archived",
]);

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),

  slug: varchar("slug", { length: 50 }).notNull().unique(),

  name: varchar("name", { length: 100 }).notNull(),

  description: text("description"),

  // Technical Specifications
  cpuCores: integer("cpu_cores").notNull(),

  ramMb: integer("ram_mb").notNull(),

  diskGb: integer("disk_gb").notNull(),

  bandwidthTb: integer("bandwidth_tb").default(1).notNull(),

  // Pricing (in bigint cents)
  monthlyPriceCents: bigint("monthly_price_cents", { mode: "number" }).notNull(),

  annualPriceCents: bigint("annual_price_cents", { mode: "number" }).notNull(),

  currency: varchar("currency", { length: 3 }).default("USD").notNull(),

  status: planStatusEnum("status").default("active").notNull(),

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
