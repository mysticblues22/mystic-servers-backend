
import { FastifyInstance } from "fastify";

import { verifyEmailController } from "../controllers/verify-email.controller.js";

export async function registerVerifyEmailRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/auth/verify-email",
    verifyEmailController,
  );
}
