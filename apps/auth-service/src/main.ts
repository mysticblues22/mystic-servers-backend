import { loadConfig } from "@mystic/config";

import { buildApp } from "./app.js";
import { initializeBootstrap } from "./plugins/bootstrap.js";

async function main() {
  initializeBootstrap();
  const config = loadConfig();
  const app = await buildApp();

  await app.listen({
    host: config.app.host,
    port: config.app.port,
  });

  app.log.info(
    `${config.app.name} listening on ${config.app.host}:${config.app.port}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
