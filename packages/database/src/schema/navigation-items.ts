import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { navigationMenus } from "./navigation-menus.js";

export const navigationItems = pgTable("navigation_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  menuId: uuid("menu_id")
    .references(() => navigationMenus.id, { onDelete: "cascade" })
    .notNull(),

  parentId: uuid("parent_id"),

  label: varchar("label", { length: 255 }).notNull(),

  href: varchar("href", { length: 500 }).notNull(),

  iconName: varchar("icon_name", { length: 100 }),

  actionType: varchar("action_type", { length: 50 }).default("internal").notNull(),

  isEnabled: boolean("is_enabled").default(true).notNull(),

  sortOrder: integer("sort_order").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
