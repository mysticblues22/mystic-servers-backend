import Fastify from "fastify";

import { registerHealthRoute } from "./health.js";

export async function createServer() {
  const app = Fastify({
    logger: true,
  });

  await registerHealthRoute(app);

  return app;
}
