import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "../controllers/notification.controller.js";

export async function registerNotificationRoutes(app: FastifyInstance) {
  // GET /notifications — Returns unread notifications for the authenticated user
  app.get(
    "/notifications",
    { preHandler: [authMiddleware] },
    getNotificationsController,
  );

  // POST /notifications/read-all — Marks all notifications as read
  app.post(
    "/notifications/read-all",
    { preHandler: [authMiddleware] },
    markAllNotificationsReadController,
  );

  // POST /notifications/:key/read — Marks a single notification as read
  // :key is the composite notification key (e.g. "inquiry-uuid123")
  app.post(
    "/notifications/:key/read",
    { preHandler: [authMiddleware] },
    markNotificationReadController,
  );
}
