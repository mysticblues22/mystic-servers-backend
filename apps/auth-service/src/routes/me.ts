import { FastifyInstance } from "fastify";

import { meController } from "../controllers/me.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export async function registerMeRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/auth/me",
    {
      preHandler: [
        authMiddleware,
        requireRole(
          "admin",
          "user",
        ),
      ],
    },
    meController,
  );
}
