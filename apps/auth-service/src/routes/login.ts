import type {
  FastifyInstance,
} from "fastify";

import {
  loginController,
} from "../controllers/login.controller.js";

export async function registerLoginRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/auth/login",
    loginController,
  );
}
