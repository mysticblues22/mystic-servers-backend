import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "disabled",
  "draft",
]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),

  slug: varchar("slug", { length: 50 }).notNull().unique(),

  name: varchar("name", { length: 100 }).notNull(),

  category: varchar("category", { length: 50 }).notNull(),

  shortDescription: text("short_description"),

  fullDescription: text("full_description"),

  features: text("features"),

  icon: varchar("icon", { length: 50 }).default("Server").notNull(),

  status: productStatusEnum("status").default("disabled").notNull(),

  sortOrder: integer("sort_order").default(0).notNull(),

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
