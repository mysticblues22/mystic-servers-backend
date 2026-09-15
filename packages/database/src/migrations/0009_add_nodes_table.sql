-- Migration: Add nodes table and node foreign keys to servers table
DO $$ BEGIN
  CREATE TYPE "node_status" AS ENUM ('pending', 'online', 'offline', 'disabled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "nodes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL UNIQUE,
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
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "nodes_name_idx" ON "nodes" ("name");
CREATE INDEX IF NOT EXISTS "nodes_status_idx" ON "nodes" ("status");
CREATE INDEX IF NOT EXISTS "nodes_token_hash_idx" ON "nodes" ("token_hash");

ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "node_id" uuid REFERENCES "nodes"("id") ON DELETE SET NULL;
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "provider" varchar(50);
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "provider_instance_id" varchar(255);

CREATE INDEX IF NOT EXISTS "servers_node_id_idx" ON "servers" ("node_id");
