import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  adminUserId: uuid("admin_user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  action: varchar("action", { length: 100 }).notNull(),

  entityType: varchar("entity_type", { length: 50 }).notNull(),

  entityId: varchar("entity_id", { length: 100 }).notNull(),

  details: text("details"),

  ipAddress: varchar("ip_address", { length: 45 }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
