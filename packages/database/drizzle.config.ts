import { defineConfig } from "drizzle-kit";

import { loadConfig } from "@mystic/config";
import { bootstrap } from "@mystic/bootstrap";

bootstrap({
  envFile: "../../../infrastructure/env/backend.env",
});

const config = loadConfig();

export default defineConfig({
  dialect: "postgresql",

  schema: "./src/schema",

  out: "./src/migrations",

  dbCredentials: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
  },

  verbose: true,
  strict: true,
});
