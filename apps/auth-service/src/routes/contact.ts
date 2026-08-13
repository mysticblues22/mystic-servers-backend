import type { FastifyInstance } from "fastify";
import { submitContactController } from "../controllers/contact.controller.js";

export async function registerContactRoutes(app: FastifyInstance) {
  app.post("/contact", submitContactController);
}
