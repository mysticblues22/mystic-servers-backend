import type { FastifyReply, FastifyRequest } from "fastify";
import { refreshService } from "../services/auth/refresh.service.js";

export async function refreshController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies.refreshToken;

  if (!refreshToken) {
    return reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "No refresh token cookie supplied",
      },
    });
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await refreshService(refreshToken);

  reply.setCookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.send({ accessToken });
}
