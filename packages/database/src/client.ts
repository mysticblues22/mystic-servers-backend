import { Pool } from "pg";

import { loadConfig } from "@mystic/config";

const config = loadConfig();

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,

  max: 20,

  idleTimeoutMillis: 30_000,

  connectionTimeoutMillis: 5_000,
});

export default pool;
