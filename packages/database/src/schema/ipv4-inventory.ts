import {
  bigint,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { servers } from "./servers.js";
import { users } from "./users.js";

export const ipv4StatusEnum = pgEnum("ipv4_status", [
  "available",
  "assigned",
  "reserved",
  "blocked",
]);

export const ipv4Inventory = pgTable("ipv4_inventory", {
  id: uuid("id").defaultRandom().primaryKey(),

  ipAddress: varchar("ip_address", { length: 45 }).notNull().unique(),

  subnetPrefix: varchar("subnet_prefix", { length: 20 }).default("/32").notNull(),

  regionCode: varchar("region_code", { length: 20 }).default("US").notNull(),

  status: ipv4StatusEnum("status").default("available").notNull(),

  assignedServerId: uuid("assigned_server_id").references(() => servers.id, {
    onDelete: "set null",
  }),

  assignedUserId: uuid("assigned_user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  monthlyPriceCents: bigint("monthly_price_cents", { mode: "number" }).default(300).notNull(),

  notes: text("notes"),

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
