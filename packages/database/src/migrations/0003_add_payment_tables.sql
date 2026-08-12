CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded');
--> statement-breakpoint
CREATE TYPE "public"."webhook_event_status" AS ENUM('pending', 'processed', 'failed', 'ignored');
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_id_user_id_unique" UNIQUE("id","user_id");
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_payment_id" varchar(255),
	"provider_checkout_id" varchar(255),
	"amount_cents" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"idempotency_key" varchar(255),
	"failure_code" varchar(100),
	"failure_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_payment_id_unique" UNIQUE("provider","provider_payment_id"),
	CONSTRAINT "payments_provider_checkout_id_unique" UNIQUE("provider","provider_checkout_id")
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payment_id" uuid,
	"order_id" uuid,
	"status" "webhook_event_status" DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_webhook_events_provider_event_unique" UNIQUE("provider","provider_event_id")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_user_fk" FOREIGN KEY ("order_id","user_id") REFERENCES "public"."orders"("id","user_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "payments_order_id_succeeded_unique" ON "payments" ("order_id") WHERE status = 'succeeded';
--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_order_id_unique" ON "invoices" ("order_id") WHERE order_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "payment_webhook_events_payment_id_idx" ON "payment_webhook_events" USING btree ("payment_id");
--> statement-breakpoint
CREATE INDEX "payment_webhook_events_order_id_idx" ON "payment_webhook_events" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "payment_webhook_events_status_idx" ON "payment_webhook_events" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "payment_webhook_events_created_at_idx" ON "payment_webhook_events" USING btree ("created_at");
