import type { FastifyInstance } from "fastify";
import { getNotificationsController } from "../controllers/notification.controller.js";

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.get("/notifications", getNotificationsController);
}
