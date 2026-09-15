import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  createAdminNodeController,
  deleteAdminNodeController,
  getAdminNodeByIdController,
  listAdminNodesController,
  nodeHeartbeatController,
  regenerateNodeTokenController,
  updateAdminNodeController,
} from "../controllers/node-admin.controller.js";

export async function registerNodeAdminRoutes(app: FastifyInstance) {
  // Admin Node Management Endpoints
  app.get(
    "/admin/nodes",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminNodesController,
  );

  app.get(
    "/admin/nodes/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    getAdminNodeByIdController,
  );

  app.post(
    "/admin/nodes",
    { preHandler: [authMiddleware, requireRole("admin")] },
    createAdminNodeController,
  );

  app.put(
    "/admin/nodes/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateAdminNodeController,
  );

  app.delete(
    "/admin/nodes/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    deleteAdminNodeController,
  );

  app.post(
    "/admin/nodes/:id/regenerate-token",
    { preHandler: [authMiddleware, requireRole("admin")] },
    regenerateNodeTokenController,
  );

  // Central Node Heartbeat Receiver Endpoint
  app.post("/nodes/heartbeat", nodeHeartbeatController);
}
