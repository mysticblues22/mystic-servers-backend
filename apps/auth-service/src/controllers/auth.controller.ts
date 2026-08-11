import type { FastifyReply, FastifyRequest } from "fastify";
import { registerSchema } from "../schemas/auth.schema.js";
import { registerService } from "../services/auth/register.service.js";
import { REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieOptions } from "../utils/cookie.js";

export async function registerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = registerSchema.parse(request.body);

  const { refreshToken, ...responsePayload } = await registerService(body);

  reply.setCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    refreshToken,
    getRefreshTokenCookieOptions(),
  );

  return reply.code(201).send(responsePayload);
}
