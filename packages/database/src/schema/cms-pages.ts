import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const cmsPages = pgTable("cms_pages", {
  id: uuid("id").defaultRandom().primaryKey(),

  slug: varchar("slug", { length: 100 }).notNull().unique(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  status: varchar("status", { length: 50 }).default("published").notNull(),

  sortOrder: integer("sort_order").default(0).notNull(),

  seoTitle: varchar("seo_title", { length: 255 }),

  seoDescription: text("seo_description"),

  seoKeywords: text("seo_keywords"),

  ogTitle: varchar("og_title", { length: 255 }),

  ogDescription: text("og_description"),

  ogImage: varchar("og_image", { length: 500 }),

  canonicalUrl: varchar("canonical_url", { length: 500 }),

  noIndex: boolean("no_index").default(false).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
