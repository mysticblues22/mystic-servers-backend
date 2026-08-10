import type { FastifyReply, FastifyRequest } from "fastify";
import { registerSchema } from "../schemas/auth.schema.js";
import { registerService } from "../services/auth/register.service.js";

export async function registerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = registerSchema.parse(request.body);

  const { refreshToken, ...responsePayload } = await registerService(body);

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.code(201).send(responsePayload);
}
