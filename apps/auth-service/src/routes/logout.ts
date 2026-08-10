import type {
  FastifyInstance,
} from "fastify";

import {
  logoutController,
} from "../controllers/logout.controller.js";

export async function registerLogoutRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/auth/logout",
    logoutController,
  );
}
