import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  loginSchema,
} from "../schemas/auth.schema.js";

import {
  loginService,
} from "../services/auth/login.service.js";

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const input =
      loginSchema.parse(request.body);

    const result =
      await loginService(input);

    return reply.send(result);
  } catch (error) {
    return reply.status(400).send({
      message: String(error),
    });
  }
}
