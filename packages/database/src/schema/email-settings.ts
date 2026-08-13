import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const emailSettings = pgTable("email_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  provider: varchar("provider", { length: 50 }).default("smtp").notNull(),

  smtpHost: varchar("smtp_host", { length: 255 }),

  smtpPort: integer("smtp_port").default(587).notNull(),

  smtpUser: varchar("smtp_user", { length: 255 }),

  encryptedSmtpPass: text("encrypted_smtp_pass"),

  smtpSecure: boolean("smtp_secure").default(false).notNull(),

  smtpFrom: varchar("smtp_from", { length: 255 }).default("Mystic Servers <noreply@mysticservers.com>").notNull(),

  supportEmail: varchar("support_email", { length: 255 }).default("support@mysticservers.com").notNull(),

  emailsEnabled: boolean("emails_enabled").default(true).notNull(),

  dailyLimit: integer("daily_limit").default(0).notNull(),

  monthlyLimit: integer("monthly_limit").default(0).notNull(),

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
