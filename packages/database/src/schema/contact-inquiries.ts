import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const contactInquiries = pgTable("contact_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),

  ticketId: varchar("ticket_id", { length: 100 }).notNull().unique(),

  name: varchar("name", { length: 255 }).notNull(),

  email: varchar("email", { length: 255 }).notNull(),

  subject: varchar("subject", { length: 255 }).notNull(),

  message: text("message").notNull(),

  status: varchar("status", { length: 50 }).default("open").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
