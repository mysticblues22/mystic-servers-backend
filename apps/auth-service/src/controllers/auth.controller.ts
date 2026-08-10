import { FastifyReply, FastifyRequest } from "fastify";

import { registerSchema } from "../schemas/auth.schema.js";
import { registerService } from "../services/auth/register.service.js";

export async function registerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = registerSchema.parse(request.body);

    const result = await registerService(body);

    return reply.code(201).send(result);
  } catch (error) {
  console.error(error);

  return reply.code(500).send({
    message: String(error),
    });
  }
}
