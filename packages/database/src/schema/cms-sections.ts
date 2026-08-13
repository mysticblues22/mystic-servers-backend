import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { cmsPages } from "./cms-pages.js";

export const cmsSections = pgTable("cms_sections", {
  id: uuid("id").defaultRandom().primaryKey(),

  pageId: uuid("page_id")
    .references(() => cmsPages.id, { onDelete: "cascade" })
    .notNull(),

  type: varchar("type", { length: 50 }).notNull(),

  title: varchar("title", { length: 255 }),

  subtitle: text("subtitle"),

  content: text("content"),

  configJson: text("config_json").default("{}").notNull(),

  isEnabled: boolean("is_enabled").default(true).notNull(),

  sortOrder: integer("sort_order").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
