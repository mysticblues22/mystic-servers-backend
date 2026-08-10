import { bootstrap } from "@mystic/bootstrap";

bootstrap({
  envFile: "../../../infrastructure/env/backend.env",
});

import { pool } from "./src/client.js";

async function main() {
  const client = await pool.connect();

  const result = await client.query("SELECT NOW() AS now");

  console.log(result.rows);

  client.release();
  await pool.end();
}

main().catch(console.error);
