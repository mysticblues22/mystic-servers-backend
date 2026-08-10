import { FastifyInstance } from "fastify";

import { registerController } from "../controllers/auth.controller.js";

export async function registerAuthRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/auth/register",
    registerController,
  );
}
