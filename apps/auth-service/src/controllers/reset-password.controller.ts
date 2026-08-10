import type { FastifyReply, FastifyRequest } from "fastify";
import { resetPasswordSchema } from "../schemas/auth.schema.js";
import { resetPasswordService } from "../services/auth/reset-password.service.js";

export async function resetPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = resetPasswordSchema.parse(request.body);
  const result = await resetPasswordService(input);
  return reply.send(result);
}
