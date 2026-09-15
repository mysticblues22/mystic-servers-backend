import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyNodeToken } from "./node-auth.js";

const UNAUTHORIZED_RESPONSE = {
  error: {
    code: "UNAUTHORIZED_NODE",
    message: "Invalid, missing, or revoked node authorization token.",
  },
};

export async function nodeAgentAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const header = request.headers.authorization;
  const customHeader = request.headers["x-node-token"] as string | undefined;

  let token: string | undefined;

  if (header && header.startsWith("Bearer ")) {
    token = header.substring(7).trim();
  } else if (customHeader) {
    token = customHeader.trim();
  }

  if (!token) {
    return reply.status(401).send(UNAUTHORIZED_RESPONSE);
  }

  const expectedToken = process.env.NODE_SECRET || process.env.NODE_TOKEN;
  const expectedHash = process.env.NODE_TOKEN_HASH;

  // Verify against configured secret or hash (if configured)
  if (expectedHash) {
    if (!verifyNodeToken(token, expectedHash)) {
      return reply.status(401).send(UNAUTHORIZED_RESPONSE);
    }
  } else if (expectedToken) {
    if (token !== expectedToken.trim()) {
      return reply.status(401).send(UNAUTHORIZED_RESPONSE);
    }
  }
}
