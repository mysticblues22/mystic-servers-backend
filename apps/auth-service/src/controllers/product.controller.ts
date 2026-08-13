import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { HttpError } from "../errors/http-error.js";
import {
  createProductService,
  getProductBySlugService,
  listAdminProductsService,
  listPublicProductsService,
  updateProductService,
} from "../services/product/product.service.js";

const productSlugParamSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
});

const createProductSchema = z.object({
  slug: z.string().min(2).max(50),
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  features: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["active", "disabled", "draft"]).optional(),
  sortOrder: z.number().int().optional(),
  ctaLabel: z.string().optional(),
  ctaDestination: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

export async function listPublicProductsController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const result = await listPublicProductsService();
  return reply.send(result);
}

export async function getProductBySlugController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = productSlugParamSchema.parse(request.params);
  const result = await getProductBySlugService(params.slug);
  return reply.send(result);
}

export async function listAdminProductsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const result = await listAdminProductsService();
  return reply.send(result);
}

export async function createProductController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const body = createProductSchema.parse(request.body);
  const result = await createProductService(body);
  return reply.status(201).send(result);
}

export async function updateProductController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const params = productIdParamSchema.parse(request.params);
  const body = updateProductSchema.parse(request.body);
  const result = await updateProductService(params.id, body);
  return reply.send(result);
}
