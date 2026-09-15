import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

/**
 * notification_reads — tracks which notifications a user has already read.
 *
 * A notification is identified by a composite string key that encodes its source
 * and origin ID, e.g. "inquiry-<uuid>", "order-<uuid>", "invoice-<uuid>",
 * "announcement-<uuid>".
 *
 * This table is the authoritative source of truth for read state.
 * The notification service filters out notifications whose notificationKey
 * exists in this table for the requesting user.
 */
export const notificationReads = pgTable(
  "notification_reads",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    notificationKey: varchar("notification_key", { length: 255 }).notNull(),

    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.notificationKey] }),
    userIdIdx: index("notification_reads_user_id_idx").on(table.userId),
  }),
);
