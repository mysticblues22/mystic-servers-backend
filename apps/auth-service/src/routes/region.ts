import type { FastifyInstance } from "fastify";
import { detectRegionController } from "../controllers/region.controller.js";

export async function registerRegionRoutes(app: FastifyInstance) {
  app.get("/region/detect", detectRegionController);
}
