import type { FastifyReply, FastifyRequest } from "fastify";
import {
  getCustomerServerByIdService,
  listAllServersAdminService,
  listCustomerServersService,
} from "../services/server.service.js";

export async function listCustomerServersController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (request as any).user?.id || (request as any).user?.userId;
  const result = await listCustomerServersService(userId);
  return reply.status(200).send(result);
}

export async function getCustomerServerByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (request as any).user?.id || (request as any).user?.userId;
  const { id } = (request.params as { id: string }) || {};
  const result = await getCustomerServerByIdService(userId, id);
  return reply.status(200).send(result);
}

export async function listAllAdminServersController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await listAllServersAdminService();
  return reply.status(200).send(result);
}
