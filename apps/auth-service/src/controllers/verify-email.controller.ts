import {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  verifyEmailService,
} from "../services/auth/verify-email.service.js";

export async function verifyEmailController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const authorization =
      request.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer ",
      )
    ) {
      return reply.status(401).send({
        message:
          "Missing access token",
      });
    }

    const accessToken =
      authorization.substring(7);

    const result =
      await verifyEmailService(
        accessToken,
      );

    return reply.send(result);
  } catch (error) {
    return reply.status(400).send({
      message: String(error),
    });
  }
}
