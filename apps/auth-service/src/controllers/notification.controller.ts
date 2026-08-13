import type { FastifyReply, FastifyRequest } from "fastify";
import { getNotificationsService } from "../services/notification.service.js";

export async function getNotificationsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = await getNotificationsService();
  return reply.status(200).send(data);
}
