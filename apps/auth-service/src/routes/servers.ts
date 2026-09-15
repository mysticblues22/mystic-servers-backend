import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getCustomerServerByIdController,
  listCustomerServersController,
} from "../controllers/server.controller.js";

export async function registerCustomerServerRoutes(app: FastifyInstance) {
  app.get(
    "/servers",
    { preHandler: [authMiddleware] },
    listCustomerServersController,
  );

  app.get(
    "/servers/:id",
    { preHandler: [authMiddleware] },
    getCustomerServerByIdController,
  );
}
