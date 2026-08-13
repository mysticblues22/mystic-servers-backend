ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cta_label" varchar(100) DEFAULT 'Explore Catalog' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cta_destination" varchar(255) DEFAULT '/contact' NOT NULL;

ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "cta_label" varchar(100) DEFAULT 'Deploy VPS' NOT NULL;
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "cta_destination" varchar(255) DEFAULT '/contact' NOT NULL;
