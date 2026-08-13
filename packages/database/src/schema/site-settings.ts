import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  companyName: varchar("company_name", { length: 255 }).default("Mystic Servers").notNull(),

  logoUrl: varchar("logo_url", { length: 500 }).default("/brand/logo.png").notNull(),

  faviconUrl: varchar("favicon_url", { length: 500 }).default("/brand/favicon/favicon.ico").notNull(),

  tagline: varchar("tagline", { length: 255 }).default("Powering Your Next Project.").notNull(),

  description: text("description").default("High-performance enterprise NVMe cloud VPS hosting, bare-metal dedicated servers, and specialized game infrastructure.").notNull(),

  supportEmail: varchar("support_email", { length: 255 }).default("support@mysticservers.com").notNull(),

  salesEmail: varchar("sales_email", { length: 255 }).default("sales@mysticservers.com").notNull(),

  pressEmail: varchar("press_email", { length: 255 }).default("press@mysticservers.com").notNull(),

  socialLinksJson: text("social_links_json").default('{"github":"https://github.com","discord":"https://discord.gg/mysticservers","twitter":"https://twitter.com","linkedin":"https://linkedin.com"}').notNull(),

  defaultSeoTitle: varchar("default_seo_title", { length: 255 }).default("Mystic Servers — Enterprise NVMe Cloud Infrastructure").notNull(),

  defaultSeoDescription: text("default_seo_description").default("High-performance enterprise NVMe cloud VPS hosting, bare-metal dedicated servers, and specialized game infrastructure.").notNull(),

  defaultOgImage: varchar("default_og_image", { length: 500 }).default("/og.png").notNull(),

  statusState: varchar("status_state", { length: 50 }).default("operational").notNull(),

  statusMessage: varchar("status_message", { length: 255 }).default("All Systems Operational (99.99%)").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
