import type { CookieSerializeOptions } from "@fastify/cookie";
import { loadConfig } from "@mystic/config";

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

export function getRefreshTokenCookieOptions(): CookieSerializeOptions {
  const config = loadConfig();

  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: "lax",
    path: "/auth",
    maxAge: 7 * 24 * 60 * 60, // 604800 seconds (7 days)
  };
}
