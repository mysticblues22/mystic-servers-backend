import type { FastifyInstance } from "fastify";

import {
  getPlanByIdController,
  getPlanBySlugController,
  listPlansController,
} from "../controllers/plan.controller.js";

export async function registerPlanRoutes(app: FastifyInstance) {
  app.get("/plans", listPlansController);
  app.get("/plans/slug/:slug", getPlanBySlugController);
  app.get("/plans/:id", getPlanByIdController);
}
