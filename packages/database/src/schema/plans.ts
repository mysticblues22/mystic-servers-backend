import {
  bigint,
  boolean,
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

  productId: uuid("product_id"),

  slug: varchar("slug", { length: 50 }).notNull().unique(),

  name: varchar("name", { length: 100 }).notNull(),

  description: text("description"),

  sortOrder: integer("sort_order").default(0).notNull(),

  // Technical Specifications
  cpuCores: integer("cpu_cores").notNull(),

  ramMb: integer("ram_mb").notNull(),

  diskGb: integer("disk_gb").notNull(),

  bandwidthTb: integer("bandwidth_tb").default(1).notNull(),

  ipv4Included: integer("ipv4_included").default(1).notNull(),

  ipv6Available: boolean("ipv6_available").default(true).notNull(),

  // International USD Pricing (in minor unit cents)
  monthlyPriceCents: bigint("monthly_price_cents", { mode: "number" }).notNull(),

  annualPriceCents: bigint("annual_price_cents", { mode: "number" }).notNull(),

  // India INR Pricing (in minor unit paise, nullable until configured)
  monthlyPriceInrCents: bigint("monthly_price_inr_cents", { mode: "number" }),

  annualPriceInrCents: bigint("annual_price_inr_cents", { mode: "number" }),

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
