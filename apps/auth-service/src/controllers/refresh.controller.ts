import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  refreshService,
} from "../services/auth/refresh.service.js";

export async function refreshController(
  request: FastifyRequest<{
    Body: {
      refreshToken: string;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const tokens =
      await refreshService(
        request.body.refreshToken,
      );

    return reply.send(tokens);
  } catch (error) {
    return reply.status(401).send({
      message: String(error),
    });
  }
}
