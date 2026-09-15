import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { nodes } from "./nodes.js";
import { plans } from "./plans.js";
import { users } from "./users.js";

export const serverStatusEnum = pgEnum("server_status", [
  "pending",
  "provisioning",
  "active",
  "stopped",
  "rebooting",
  "suspended",
  "terminated",
  "failed",
]);

export const servers = pgTable(
  "servers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, {
        onDelete: "restrict",
      }),

    nodeId: uuid("node_id").references(() => nodes.id, {
      onDelete: "set null",
    }),

    name: varchar("name", { length: 100 }).notNull(),

    hostname: varchar("hostname", { length: 255 }),

    region: varchar("region", { length: 50 }).notNull(),

    // Hypervisor / Provider Reference
    provider: varchar("provider", { length: 50 }), // e.g. "incus", "kvm"

    providerInstanceId: varchar("provider_instance_id", { length: 255 }),

    // Resource Snapshots (Immutable server specifications)
    cpuCores: integer("cpu_cores").notNull(),

    ramMb: integer("ram_mb").notNull(),

    diskGb: integer("disk_gb").notNull(),

    // Network IP Allocations
    publicIp: varchar("public_ip", { length: 45 }),

    privateIp: varchar("private_ip", { length: 45 }),

    status: serverStatusEnum("status").default("pending").notNull(),

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
  },
  (table) => ({
    userIdIdx: index("servers_user_id_idx").on(table.userId),
    nodeIdIdx: index("servers_node_id_idx").on(table.nodeId),
    statusIdx: index("servers_status_idx").on(table.status),
  }),
);
