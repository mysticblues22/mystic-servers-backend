import path from "node:path";
import { fileURLToPath } from "node:url";

import { bootstrap } from "@mystic/bootstrap";

bootstrap({
  envFile: process.env.ENV_FILE ?? "/srv/git/infrastructure/env/backend.env",
});

const { migrate } = await import("drizzle-orm/node-postgres/migrator");
const { pool } = await import("./client.js");
const { db } = await import("./drizzle.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("⏳ Starting database migration...");

  try {
    const migrationsFolder = path.resolve(__dirname, "./migrations");
    console.log(`📁 Loading migrations from: ${migrationsFolder}`);

    await migrate(db, { migrationsFolder });
    console.log("✅ All pending migrations applied successfully!");
  } catch (err) {
    console.error("❌ Migration failed with error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
