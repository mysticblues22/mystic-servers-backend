import { defineConfig } from "drizzle-kit";

import { loadConfig } from "@mystic/config";
import { bootstrap } from "@mystic/bootstrap";

bootstrap({
  envFile: "../../../infrastructure/env/backend.env",
});

const config = loadConfig();

const host = process.env.DB_HOST_OVERRIDE || config.database.host;

export default defineConfig({
  dialect: "postgresql",

  schema: "./src/schema",

  out: "./src/migrations",

  dbCredentials: {
    host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
  },

  verbose: true,
  strict: true,
});
