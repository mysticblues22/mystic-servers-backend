import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").defaultRandom().primaryKey(),

  key: varchar("key", { length: 100 }).notNull().unique(),

  name: varchar("name", { length: 255 }).notNull(),

  subject: text("subject").notNull(),

  htmlBody: text("html_body").notNull(),

  textBody: text("text_body"),

  variablesJson: text("variables_json").default("[]").notNull(),

  isEnabled: boolean("is_enabled").default(true).notNull(),

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
