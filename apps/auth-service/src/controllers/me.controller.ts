import {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  userRepository,
} from "@mystic/database";

export async function meController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({
      message: "Unauthorized",
    });
  }

  const user =
    await userRepository.findById(
      request.user.id,
    );

  if (!user) {
    return reply.status(404).send({
      message: "User not found",
    });
  }

  return reply.send({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    verified: user.isVerified,
    createdAt: user.createdAt,
  });
}
