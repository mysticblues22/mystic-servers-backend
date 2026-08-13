import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { HttpError } from "../errors/http-error.js";
import {
  createAdminPlanService,
  getPlanByIdService,
  listAdminPlansService,
  updateAdminPlanService,
  updatePlanRegionalPricesService,
} from "../services/plan/plan-admin.service.js";

const planIdParamSchema = z.object({
  id: z.string().uuid("Invalid plan ID"),
});

const createPlanSchema = z.object({
  productId: z.string().uuid().optional(),
  slug: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  cpuCores: z.number().int().min(1),
  ramMb: z.number().int().min(512),
  diskGb: z.number().int().min(10),
  bandwidthTb: z.number().int().min(1),
  monthlyPriceCents: z.number().int().min(0),
  annualPriceCents: z.number().int().min(0),
  monthlyPriceInrCents: z.number().int().min(0).optional(),
  annualPriceInrCents: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(["active", "deprecated", "archived"]).optional(),
  sortOrder: z.number().int().optional(),
  ipv4Included: z.number().int().min(0).optional(),
  ipv6Available: z.boolean().optional(),
  ctaLabel: z.string().optional(),
  ctaDestination: z.string().optional(),
});

const updatePlanSchema = createPlanSchema.partial();

const pricingMatrixSchema = z.object({
  matrix: z.array(
    z.object({
      regionCode: z.string().min(2),
      currency: z.string().length(3),
      monthlyPriceCents: z.number().int().min(0),
      annualPriceCents: z.number().int().min(0),
    }),
  ),
});

export async function listAdminPlansController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const query = (request.query || {}) as { productId?: string; category?: string };
  const result = await listAdminPlansService(query.productId || query.category);
  return reply.send(result);
}

export async function getPlanByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const params = planIdParamSchema.parse(request.params);
  const result = await getPlanByIdService(params.id);
  return reply.send(result);
}

export async function createAdminPlanController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const body = createPlanSchema.parse(request.body);
  const result = await createAdminPlanService(request.user.id, body);
  return reply.status(201).send(result);
}

export async function updateAdminPlanController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const params = planIdParamSchema.parse(request.params);
  const body = updatePlanSchema.parse(request.body);
  const result = await updateAdminPlanService(params.id, request.user.id, body);
  return reply.send(result);
}

export async function updatePlanRegionalPricesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const params = planIdParamSchema.parse(request.params);
  const body = pricingMatrixSchema.parse(request.body);
  const result = await updatePlanRegionalPricesService(params.id, request.user.id, body.matrix);
  return reply.send(result);
}
