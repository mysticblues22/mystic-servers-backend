import { Pool } from "pg";

import { loadConfig } from "@mystic/config";

const config = loadConfig();
const host = process.env.DB_HOST_OVERRIDE || config.database.host;

export const pool = new Pool({
  host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,

  max: 20,

  idleTimeoutMillis: 30_000,

  connectionTimeoutMillis: 5_000,
});

export default pool;
