import type { FastifyReply, FastifyRequest } from "fastify";

import { HttpError } from "../errors/http-error.js";
import {
  createOrderSchema,
  getOrderByIdSchema,
  idempotencyHeaderSchema,
} from "../schemas/order.schema.js";
import {
  cancelOrderService,
  createOrderService,
  getOrderByIdService,
  getOrdersService,
} from "../services/order/order.service.js";

export async function listOrdersController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const userId = request.user.id;
  const result = await getOrdersService(userId);
  return reply.send(result);
}

export async function getOrderByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const userId = request.user.id;
  const params = getOrderByIdSchema.parse(request.params);
  const result = await getOrderByIdService(userId, params.id);
  return reply.send(result);
}

export async function cancelOrderController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const userId = request.user.id;
  const params = getOrderByIdSchema.parse(request.params);
  const result = await cancelOrderService(userId, params.id);
  return reply.status(200).send(result);
}

export async function createOrderController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const userId = request.user.id;
  const body = createOrderSchema.parse(request.body);

  const rawIdempotencyKey = request.headers["idempotency-key"];
  const idempotencyKey = Array.isArray(rawIdempotencyKey)
    ? rawIdempotencyKey[0]
    : rawIdempotencyKey;

  const validIdempotencyKey = idempotencyHeaderSchema.parse(idempotencyKey);

  const { order, isReplay } = await createOrderService(
    userId,
    body,
    validIdempotencyKey,
  );

  const statusCode = isReplay ? 200 : 201;
  return reply.status(statusCode).send({ order });
}
