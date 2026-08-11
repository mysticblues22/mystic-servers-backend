import type { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema } from "../schemas/auth.schema.js";
import { loginService } from "../services/auth/login.service.js";
import { REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieOptions } from "../utils/cookie.js";

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const input = loginSchema.parse(request.body);

  const { refreshToken, ...responsePayload } = await loginService(input);

  reply.setCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    getRefreshTokenCookieOptions(),
  );

  return reply.send(responsePayload);
}
