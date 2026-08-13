import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  addIPv4AddressController,
  listIPv4InventoryController,
  updateIPv4StatusController,
} from "../controllers/ipv4-admin.controller.js";

export async function registerIPv4AdminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/infrastructure/ipv4",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listIPv4InventoryController,
  );

  app.post(
    "/admin/infrastructure/ipv4",
    { preHandler: [authMiddleware, requireRole("admin")] },
    addIPv4AddressController,
  );

  app.put(
    "/admin/infrastructure/ipv4/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateIPv4StatusController,
  );
}
