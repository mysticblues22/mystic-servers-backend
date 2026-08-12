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

interface PricingQuery {
  currency?: string;
  region?: string;
}

export async function listPlansController(
  request: FastifyRequest<{ Querystring: PricingQuery }>,
  reply: FastifyReply,
) {
  const query = request.query || {};
  const result = await getPublicPlansService(query.currency, query.region);
  return reply.send(result);
}

export async function getPlanByIdController(
  request: FastifyRequest<{ Querystring: PricingQuery }>,
  reply: FastifyReply,
) {
  const query = request.query || {};
  const params = getPlanByIdSchema.parse(request.params);
  const result = await getPlanByIdService(params.id, query.currency, query.region);
  return reply.send(result);
}

export async function getPlanBySlugController(
  request: FastifyRequest<{ Querystring: PricingQuery }>,
  reply: FastifyReply,
) {
  const query = request.query || {};
  const params = getPlanBySlugSchema.parse(request.params);
  const result = await getPlanBySlugService(params.slug, query.currency, query.region);
  return reply.send(result);
}
