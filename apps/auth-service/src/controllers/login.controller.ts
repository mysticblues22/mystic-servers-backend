import type { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema } from "../schemas/auth.schema.js";
import { loginService } from "../services/auth/login.service.js";

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = loginSchema.parse(request.body);

  const { refreshToken, ...responsePayload } = await loginService(input);

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return reply.send(responsePayload);
}
