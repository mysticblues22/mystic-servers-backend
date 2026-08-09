import Fastify, { type FastifyInstance } from "fastify";

import { registerHealthRoute } from "./health.js";

export type MysticServer = FastifyInstance;

export async function createServer(): Promise<MysticServer> {
  const app = Fastify({
    logger: true,
  });

  await registerHealthRoute(app);

  return app;
}
