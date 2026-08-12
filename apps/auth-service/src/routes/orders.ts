import type { FastifyInstance } from "fastify";

import {
  createOrderController,
  getOrderByIdController,
  listOrdersController,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export async function registerOrderRoutes(app: FastifyInstance) {
  app.get(
    "/orders",
    {
      preHandler: [authMiddleware],
    },
    listOrdersController,
  );

  app.get(
    "/orders/:id",
    {
      preHandler: [authMiddleware],
    },
    getOrderByIdController,
  );

  app.post(
    "/orders",
    {
      preHandler: [authMiddleware],
    },
    createOrderController,
  );
}
