import type {
  FastifyInstance,
} from "fastify";

import {
  refreshController,
} from "../controllers/refresh.controller.js";

export async function registerRefreshRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/auth/refresh",
    refreshController,
  );
}
