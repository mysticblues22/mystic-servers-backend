CREATE TYPE "public"."email_status" AS ENUM('QUEUED', 'SENDING', 'SENT', 'FAILED', 'SKIPPED', 'RATE_LIMITED');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'disabled', 'draft');--> statement-breakpoint
CREATE TYPE "public"."ipv4_status" AS ENUM('available', 'assigned', 'reserved', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."node_status" AS ENUM('pending', 'online', 'offline', 'disabled');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'info' NOT NULL,
	"link" varchar(500),
	"link_label" varchar(100),
	"is_enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"details" text,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"seo_keywords" text,
	"og_title" varchar(255),
	"og_description" text,
	"og_image" varchar(500),
	"canonical_url" varchar(500),
	"no_index" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cms_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cms_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255),
	"subtitle" text,
	"content" text,
	"config_json" text DEFAULT '{}' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_inquiries_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"template_key" varchar(100) NOT NULL,
	"subject" text NOT NULL,
	"provider" varchar(50) DEFAULT 'smtp' NOT NULL,
	"status" "email_status" NOT NULL,
	"provider_message_id" varchar(255),
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"template_key" varchar(100) NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"status" "email_status" DEFAULT 'QUEUED' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"provider_message_id" varchar(255),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) DEFAULT 'smtp' NOT NULL,
	"smtp_host" varchar(255),
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_user" varchar(255),
	"encrypted_smtp_pass" text,
	"smtp_secure" boolean DEFAULT false NOT NULL,
	"smtp_from" varchar(255) DEFAULT 'Mystic Servers <noreply@mysticservers.com>' NOT NULL,
	"support_email" varchar(255) DEFAULT 'support@mysticservers.com' NOT NULL,
	"emails_enabled" boolean DEFAULT true NOT NULL,
	"daily_limit" integer DEFAULT 0 NOT NULL,
	"monthly_limit" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"variables_json" text DEFAULT '[]' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"short_description" text,
	"full_description" text,
	"features" text,
	"icon" varchar(50) DEFAULT 'Server' NOT NULL,
	"status" "product_status" DEFAULT 'disabled' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"cta_label" varchar(100) DEFAULT 'Explore Catalog' NOT NULL,
	"cta_destination" varchar(255) DEFAULT '/contact' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "regional_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"region_code" varchar(20) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"monthly_price_cents" bigint NOT NULL,
	"annual_price_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ipv4_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"subnet_prefix" varchar(20) DEFAULT '/32' NOT NULL,
	"region_code" varchar(20) DEFAULT 'US' NOT NULL,
	"status" "ipv4_status" DEFAULT 'available' NOT NULL,
	"assigned_server_id" uuid,
	"assigned_user_id" uuid,
	"monthly_price_cents" bigint DEFAULT 300 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ipv4_inventory_ip_address_unique" UNIQUE("ip_address")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) DEFAULT 'Mystic Servers' NOT NULL,
	"logo_url" varchar(500) DEFAULT '/brand/logo.png' NOT NULL,
	"favicon_url" varchar(500) DEFAULT '/brand/favicon/favicon.ico' NOT NULL,
	"tagline" varchar(255) DEFAULT 'Powering Your Next Project.' NOT NULL,
	"description" text DEFAULT 'High-performance enterprise NVMe cloud VPS hosting, bare-metal dedicated servers, and specialized game infrastructure.' NOT NULL,
	"support_email" varchar(255) DEFAULT 'support@mysticservers.com' NOT NULL,
	"sales_email" varchar(255) DEFAULT 'sales@mysticservers.com' NOT NULL,
	"press_email" varchar(255) DEFAULT 'press@mysticservers.com' NOT NULL,
	"social_links_json" text DEFAULT '{"github":"https://github.com","discord":"https://discord.gg/mysticservers","twitter":"https://twitter.com","linkedin":"https://linkedin.com"}' NOT NULL,
	"default_seo_title" varchar(255) DEFAULT 'Mystic Servers — Enterprise NVMe Cloud Infrastructure' NOT NULL,
	"default_seo_description" text DEFAULT 'High-performance enterprise NVMe cloud VPS hosting, bare-metal dedicated servers, and specialized game infrastructure.' NOT NULL,
	"default_og_image" varchar(500) DEFAULT '/og.png' NOT NULL,
	"status_state" varchar(50) DEFAULT 'operational' NOT NULL,
	"status_message" varchar(255) DEFAULT 'All Systems Operational (99.99%)' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "navigation_menus_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"parent_id" uuid,
	"label" varchar(255) NOT NULL,
	"href" varchar(500) NOT NULL,
	"icon_name" varchar(100),
	"action_type" varchar(50) DEFAULT 'internal' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"user_id" uuid NOT NULL,
	"notification_key" varchar(255) NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_reads_user_id_notification_key_pk" PRIMARY KEY("user_id","notification_key")
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"hostname" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"region" varchar(50) NOT NULL,
	"status" "node_status" DEFAULT 'pending' NOT NULL,
	"total_cpu_cores" integer DEFAULT 0 NOT NULL,
	"total_ram_mb" integer DEFAULT 0 NOT NULL,
	"total_disk_gb" integer DEFAULT 0 NOT NULL,
	"allocated_cpu_cores" integer DEFAULT 0 NOT NULL,
	"allocated_ram_mb" integer DEFAULT 0 NOT NULL,
	"allocated_disk_gb" integer DEFAULT 0 NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"agent_version" varchar(50),
	"token_hash" varchar(255) NOT NULL,
	"last_heartbeat" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nodes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "ipv4_included" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "ipv6_available" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "cta_label" varchar(100) DEFAULT 'Deploy VPS' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "cta_destination" varchar(255) DEFAULT '/contact' NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "node_id" uuid;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "provider" varchar(50);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "provider_instance_id" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_sections" ADD CONSTRAINT "cms_sections_page_id_cms_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."cms_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regional_prices" ADD CONSTRAINT "regional_prices_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ipv4_inventory" ADD CONSTRAINT "ipv4_inventory_assigned_server_id_servers_id_fk" FOREIGN KEY ("assigned_server_id") REFERENCES "public"."servers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ipv4_inventory" ADD CONSTRAINT "ipv4_inventory_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_menu_id_navigation_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."navigation_menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_reads_user_id_idx" ON "notification_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nodes_name_idx" ON "nodes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "nodes_status_idx" ON "nodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "nodes_token_hash_idx" ON "nodes" USING btree ("token_hash");--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "servers_node_id_idx" ON "servers" USING btree ("node_id");