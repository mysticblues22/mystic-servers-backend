import { SignJWT, jwtVerify } from "jose";

import { loadConfig } from "@mystic/config";

const config = loadConfig();

import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "./types.js";

const accessSecret = new TextEncoder().encode(
  config.jwt.secret,
);

const refreshSecret = new TextEncoder().encode(
  config.jwt.refreshSecret,
);

export async function createAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(
      config.jwt.accessExpiresIn,
    )
    .sign(accessSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(
    token,
    accessSecret,
  );

  return payload as unknown as AccessTokenPayload;
}

export async function createRefreshToken(
  payload: RefreshTokenPayload,
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(
      config.jwt.refreshExpiresIn,
    )
    .sign(refreshSecret);
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(
    token,
    refreshSecret,
  );

  return payload as unknown as RefreshTokenPayload;
}
