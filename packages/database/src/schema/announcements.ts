import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),

  message: text("message").notNull(),

  type: varchar("type", { length: 50 }).default("info").notNull(),

  link: varchar("link", { length: 500 }),

  linkLabel: varchar("link_label", { length: 100 }),

  isEnabled: boolean("is_enabled").default(true).notNull(),

  priority: integer("priority").default(0).notNull(),

  startTime: timestamp("start_time", { withTimezone: true }),

  endTime: timestamp("end_time", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
