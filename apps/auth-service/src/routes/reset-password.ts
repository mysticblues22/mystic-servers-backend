import { FastifyInstance } from "fastify";

import {
  resetPasswordController,
} from "../controllers/reset-password.controller.js";

export async function registerResetPasswordRoute(
  app: FastifyInstance,
) {
  app.post(
    "/auth/reset-password",
    resetPasswordController,
  );
}
