import type { FastifyReply, FastifyRequest } from "fastify";

import { HttpError } from "../errors/http-error.js";
import {
  createOrderSchema,
  idempotencyHeaderSchema,
} from "../schemas/order.schema.js";
import { createOrderService } from "../services/order/order.service.js";

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
