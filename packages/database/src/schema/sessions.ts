import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    refreshToken: text("refresh_token").notNull(),

    ipAddress: varchar("ip_address", {
      length: 45,
    }),

    userAgent: text("user_agent"),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);
