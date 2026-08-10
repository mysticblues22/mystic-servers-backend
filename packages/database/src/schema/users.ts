import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "user",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: varchar("email", {
    length: 255,
  }).notNull().unique(),

  username: varchar("username", {
    length: 50,
  }).notNull().unique(),

  passwordHash: text("password_hash").notNull(),

  role: userRoleEnum("role")
    .default("user")
    .notNull(),

  isVerified: boolean("is_verified")
    .default(false)
    .notNull(),

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
