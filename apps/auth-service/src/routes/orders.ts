import type { FastifyInstance } from "fastify";

import { createOrderController } from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export async function registerOrderRoutes(app: FastifyInstance) {
  app.post(
    "/orders",
    {
      preHandler: [authMiddleware],
    },
    createOrderController,
  );
}
