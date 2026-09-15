import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { listAllAdminServersController } from "../controllers/server.controller.js";
import { adminManualProvisionController } from "../controllers/provisioning.controller.js";

export async function registerServerAdminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/servers",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAllAdminServersController,
  );

  app.post(
    "/admin/servers/provision",
    { preHandler: [authMiddleware, requireRole("admin")] },
    adminManualProvisionController,
  );
}
