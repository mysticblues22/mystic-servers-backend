import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyEmailService } from "../services/auth/verify-email.service.js";

export async function verifyEmailController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing access token",
      },
    });
  }

  const accessToken = authorization.substring(7);
  const result = await verifyEmailService(accessToken);
  return reply.send(result);
}
