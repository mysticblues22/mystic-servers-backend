import { FastifyInstance } from "fastify";

import {
  forgotPasswordController,
} from "../controllers/forgot-password.controller.js";

export async function registerForgotPasswordRoute(
  app: FastifyInstance,
) {
  app.post(
    "/auth/forgot-password",
    forgotPasswordController,
  );
}
