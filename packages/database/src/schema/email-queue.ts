import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const emailStatusEnum = pgEnum("email_status", [
  "QUEUED",
  "SENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
  "RATE_LIMITED",
]);

export const emailQueue = pgTable("email_queue", {
  id: uuid("id").defaultRandom().primaryKey(),

  recipient: varchar("recipient", { length: 255 }).notNull(),

  templateKey: varchar("template_key", { length: 100 }).notNull(),

  subject: text("subject").notNull(),

  htmlBody: text("html_body").notNull(),

  textBody: text("text_body"),

  status: emailStatusEnum("status").default("QUEUED").notNull(),

  retryCount: integer("retry_count").default(0).notNull(),

  maxRetries: integer("max_retries").default(3).notNull(),

  nextRetryAt: timestamp("next_retry_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  lastError: text("last_error"),

  providerMessageId: varchar("provider_message_id", { length: 255 }),

  sentAt: timestamp("sent_at", {
    withTimezone: true,
  }),

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
