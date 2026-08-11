import type { FastifyReply, FastifyRequest } from "fastify";
import { logoutService } from "../services/auth/logout.service.js";
import { REFRESH_TOKEN_COOKIE_NAME } from "../utils/cookie.js";

export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (refreshToken) {
    try {
      await logoutService(refreshToken);
    } catch (err) {
      request.log.warn({ err }, "Error revoking refresh token session on logout");
    }
  }

  reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    path: "/auth",
  });

  return reply.send({
    success: true,
    message: "Logged out successfully",
  });
}
