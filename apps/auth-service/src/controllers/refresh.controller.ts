import type { FastifyReply, FastifyRequest } from "fastify";
import { refreshService } from "../services/auth/refresh.service.js";
import { REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieOptions } from "../utils/cookie.js";

export async function refreshController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];

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

  reply.setCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    newRefreshToken,
    getRefreshTokenCookieOptions(),
  );

  return reply.send({ accessToken });
}
