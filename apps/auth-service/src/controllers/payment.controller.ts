import type { FastifyReply, FastifyRequest } from "fastify";

import { HttpError } from "../errors/http-error.js";
import { idempotencyHeaderSchema } from "../schemas/order.schema.js";
import {
  initiatePaymentSchema,
  paymentIdParamSchema,
  verifyPaymentSchema,
} from "../schemas/payment.schema.js";
import {
  initiatePaymentService,
  verifyPaymentService,
} from "../services/payment/payment.service.js";

export async function initiatePaymentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const userId = request.user.id;
  const params = paymentIdParamSchema.parse(request.params);
  const body = initiatePaymentSchema.parse(request.body || {});

  const rawIdempotencyKey = request.headers["idempotency-key"];
  const idempotencyKey = Array.isArray(rawIdempotencyKey)
    ? rawIdempotencyKey[0]
    : rawIdempotencyKey;

  const validIdempotencyKey = idempotencyHeaderSchema.parse(idempotencyKey);

  const { payment, checkout, isReplay } = await initiatePaymentService(
    userId,
    params.id,
    body,
    validIdempotencyKey,
  );

  const statusCode = isReplay ? 200 : 201;
  return reply.status(statusCode).send({ payment, checkout });
}

export async function verifyPaymentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const userId = request.user.id;
  const params = paymentIdParamSchema.parse(request.params);
  const body = verifyPaymentSchema.parse(request.body);

  const result = await verifyPaymentService(userId, params.id, body);

  return reply.status(200).send(result);
}
