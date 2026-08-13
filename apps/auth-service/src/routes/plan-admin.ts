import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  createAdminPlanController,
  getPlanByIdController,
  listAdminPlansController,
  updateAdminPlanController,
  updatePlanRegionalPricesController,
} from "../controllers/plan-admin.controller.js";

export async function registerPlanAdminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/plans",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminPlansController,
  );

  app.get(
    "/admin/plans/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    getPlanByIdController,
  );

  app.post(
    "/admin/plans",
    { preHandler: [authMiddleware, requireRole("admin")] },
    createAdminPlanController,
  );

  app.put(
    "/admin/plans/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateAdminPlanController,
  );

  app.put(
    "/admin/plans/:id/pricing",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updatePlanRegionalPricesController,
  );
}
