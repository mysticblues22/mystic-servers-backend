import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  logoutService,
} from "../services/auth/logout.service.js";

export async function logoutController(
  request: FastifyRequest<{
    Body: {
      refreshToken: string;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const result =
      await logoutService(
        request.body.refreshToken,
      );

    return reply.send(result);
  } catch (error) {
    return reply.status(401).send({
      message: String(error),
    });
  }
}
