import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { emailStatusEnum } from "./email-queue.js";

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  recipient: varchar("recipient", { length: 255 }).notNull(),

  templateKey: varchar("template_key", { length: 100 }).notNull(),

  subject: text("subject").notNull(),

  provider: varchar("provider", { length: 50 }).default("smtp").notNull(),

  status: emailStatusEnum("status").notNull(),

  providerMessageId: varchar("provider_message_id", { length: 255 }),

  errorMessage: text("error_message"),

  sentAt: timestamp("sent_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
