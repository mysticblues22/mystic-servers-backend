import { FastifyReply, FastifyRequest } from "fastify";

import {
  forgotPasswordSchema,
} from "../schemas/auth.schema.js";

import {
  forgotPasswordService,
} from "../services/auth/forgot-password.service.js";

export async function forgotPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const input =
      forgotPasswordSchema.parse(
        request.body,
      );

    const result =
      await forgotPasswordService(
        input,
      );

    return reply.send(result);
  } catch (error) {
    return reply.status(400).send({
      message: String(error),
    });
  }
}
