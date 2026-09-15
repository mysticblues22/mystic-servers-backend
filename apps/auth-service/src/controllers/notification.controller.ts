import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
} from "../services/notification.service.js";

/**
 * GET /notifications
 * Returns unread notifications for the authenticated user.
 * Falls back to all notifications if no userId is available.
 */
export async function getNotificationsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (request as any).user?.userId as string | undefined;
  const data = await getNotificationsService(userId);
  return reply.status(200).send(data);
}

/**
 * POST /notifications/:key/read
 * Marks a single notification as read for the authenticated user.
 * The :key param is the full notification composite key (e.g. "inquiry-<uuid>").
 */
export async function markNotificationReadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (request as any).user?.userId as string;
  const { key } = (request.params as { key: string }) || {};

  if (!userId) {
    return reply.status(401).send({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  await markNotificationReadService(userId, key);
  return reply.status(200).send({ success: true });
}

/**
 * POST /notifications/read-all
 * Marks all currently visible notifications as read for the authenticated user.
 */
export async function markAllNotificationsReadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (request as any).user?.userId as string;

  if (!userId) {
    return reply.status(401).send({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  await markAllNotificationsReadService(userId);
  return reply.status(200).send({ success: true });
}
