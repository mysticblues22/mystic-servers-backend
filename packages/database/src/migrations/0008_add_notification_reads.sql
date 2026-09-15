-- Migration: Add notification_reads table for persistent read state
-- This table tracks which notifications each user has read.
-- A notificationKey encodes the source type and record ID (e.g. "inquiry-<uuid>").

CREATE TABLE IF NOT EXISTS "notification_reads" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "notification_key" varchar(255) NOT NULL,
  "read_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("user_id", "notification_key")
);

CREATE INDEX IF NOT EXISTS "notification_reads_user_id_idx"
  ON "notification_reads" ("user_id");
