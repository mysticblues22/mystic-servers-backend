CREATE TYPE "public"."plan_status" AS ENUM('active', 'deprecated', 'archived');--> statement-breakpoint
CREATE TYPE "public"."server_status" AS ENUM('pending', 'provisioning', 'active', 'stopped', 'rebooting', 'suspended', 'terminated', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'awaiting_payment', 'paid', 'provisioning', 'active', 'cancelled', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."order_item_type" AS ENUM('plan', 'ipv4', 'storage', 'backup', 'addon');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'unpaid', 'paid', 'void', 'refunded');--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"cpu_cores" integer NOT NULL,
	"ram_mb" integer NOT NULL,
	"disk_gb" integer NOT NULL,
	"bandwidth_tb" integer DEFAULT 1 NOT NULL,
	"monthly_price_cents" bigint NOT NULL,
	"annual_price_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "plan_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"hostname" varchar(255),
	"region" varchar(50) NOT NULL,
	"cpu_cores" integer NOT NULL,
	"ram_mb" integer NOT NULL,
	"disk_gb" integer NOT NULL,
	"public_ip" varchar(45),
	"private_ip" varchar(45),
	"status" "server_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(32) NOT NULL,
	"user_id" uuid NOT NULL,
	"idempotency_key" varchar(255),
	"subtotal_amount_cents" bigint NOT NULL,
	"total_amount_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_user_id_idempotency_key_unique" UNIQUE("user_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"plan_id" uuid,
	"item_type" "order_item_type" DEFAULT 'plan' NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" bigint NOT NULL,
	"total_price_cents" bigint NOT NULL,
	"billing_cycle" varchar(20) DEFAULT 'monthly' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(32) NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"subtotal_cents" bigint NOT NULL,
	"tax_cents" bigint DEFAULT 0 NOT NULL,
	"total_cents" bigint NOT NULL,
	"amount_paid_cents" bigint DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "invoice_status" DEFAULT 'unpaid' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount_cents" bigint NOT NULL,
	"total_amount_cents" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "servers_user_id_idx" ON "servers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "servers_status_idx" ON "servers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "invoices_user_id_idx" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items" USING btree ("invoice_id");