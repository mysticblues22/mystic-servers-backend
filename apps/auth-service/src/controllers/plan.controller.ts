import type { FastifyReply, FastifyRequest } from "fastify";

import {
  getPlanByIdSchema,
  getPlanBySlugSchema,
} from "../schemas/plan.schema.js";
import {
  getPlanByIdService,
  getPlanBySlugService,
  getPublicPlansService,
} from "../services/plan/plan.service.js";

export async function listPlansController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await getPublicPlansService();
  return reply.send(result);
}

export async function getPlanByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = getPlanByIdSchema.parse(request.params);
  const result = await getPlanByIdService(params.id);
  return reply.send(result);
}

export async function getPlanBySlugController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = getPlanBySlugSchema.parse(request.params);
  const result = await getPlanBySlugService(params.slug);
  return reply.send(result);
}
