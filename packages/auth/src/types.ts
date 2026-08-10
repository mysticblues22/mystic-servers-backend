import type { JWTPayload } from "jose";

export interface AccessTokenPayload extends JWTPayload {
  userId: string;

  email: string;

  role: "admin" | "user";
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;

  tokenId: string;
}
