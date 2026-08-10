import type { FastifyReply, FastifyRequest } from "fastify";
import { forgotPasswordSchema } from "../schemas/auth.schema.js";
import { forgotPasswordService } from "../services/auth/forgot-password.service.js";

export async function forgotPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = forgotPasswordSchema.parse(request.body);
  const result = await forgotPasswordService(input);
  return reply.send(result);
}
