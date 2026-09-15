import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const nodeStatusEnum = pgEnum("node_status", [
  "pending",
  "online",
  "offline",
  "disabled",
]);

export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 100 }).notNull().unique(),

    hostname: varchar("hostname", { length: 255 }).notNull(),

    address: varchar("address", { length: 255 }).notNull(),

    region: varchar("region", { length: 50 }).notNull(),

    status: nodeStatusEnum("status").default("pending").notNull(),

    // Hardware Capacity (Specs)
    totalCpuCores: integer("total_cpu_cores").default(0).notNull(),

    totalRamMb: integer("total_ram_mb").default(0).notNull(),

    totalDiskGb: integer("total_disk_gb").default(0).notNull(),

    // Allocated Resource Accounting (Overselling is strictly prevented)
    allocatedCpuCores: integer("allocated_cpu_cores").default(0).notNull(),

    allocatedRamMb: integer("allocated_ram_mb").default(0).notNull(),

    allocatedDiskGb: integer("allocated_disk_gb").default(0).notNull(),

    // Reported Hardware & Hypervisor Capabilities
    capabilities: jsonb("capabilities").$type<string[]>().default([]).notNull(),

    agentVersion: varchar("agent_version", { length: 50 }),

    // Hashed Node Auth Credential (Plaintext token is never stored)
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),

    lastHeartbeat: timestamp("last_heartbeat", { withTimezone: true }),

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
    nameIdx: index("nodes_name_idx").on(table.name),
    statusIdx: index("nodes_status_idx").on(table.status),
    tokenHashIdx: index("nodes_token_hash_idx").on(table.tokenHash),
  }),
);
