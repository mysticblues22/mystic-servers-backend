import type { FastifyReply, FastifyRequest } from "fastify";
import { logoutService } from "../services/auth/logout.service.js";

export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies.refreshToken;

  if (refreshToken) {
    try {
      await logoutService(refreshToken);
    } catch (err) {
      request.log.warn({ err }, "Error revoking refresh token session on logout");
    }
  }

  reply.clearCookie("refreshToken", {
    path: "/auth",
  });

  return reply.send({
    success: true,
    message: "Logged out successfully",
  });
}
