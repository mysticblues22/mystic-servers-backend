import {
  FastifyReply,
  FastifyRequest,
} from "fastify";

export function requireRole(
  ...roles: ("admin" | "user")[]
) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        },
      });
    }

    if (
      !roles.includes(
        request.user.role,
      )
    ) {
      return reply.status(403).send({
        error: {
          code: "FORBIDDEN",
          message: "Forbidden",
        },
      });
    }
  };
}
