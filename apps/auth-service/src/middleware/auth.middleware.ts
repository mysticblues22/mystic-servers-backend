import {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  verifyAccessToken,
} from "@mystic/auth";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const header =
    request.headers.authorization;

  if (
    !header ||
    !header.startsWith("Bearer ")
  ) {
    return reply.status(401).send({
      message: "Unauthorized",
    });
  }

  const token = header.substring(7);

  try {
    const payload =
      await verifyAccessToken(token);

    request.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return reply.status(401).send({
      message: "Invalid access token",
    });
  }
}
