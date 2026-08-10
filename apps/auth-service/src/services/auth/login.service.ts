import {
  createAccessToken,
  createRefreshToken,
  verifyPassword,
} from "@mystic/auth";

import {
  sessionRepository,
  userRepository,
} from "@mystic/database";

import type {
  LoginInput,
} from "../../schemas/auth.schema.js";

export async function loginService(
  input: LoginInput,
) {
  const user =
    await userRepository.findByEmail(
      input.email,
    );

  if (!user) {
    throw new Error(
      "Invalid email or password",
    );
  }

  const valid =
    await verifyPassword(
      user.passwordHash,
      input.password,
    );

  if (!valid) {
    throw new Error(
      "Invalid email or password",
    );
  }

  const accessToken =
    await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

  const refreshToken =
    await createRefreshToken({
      userId: user.id,
      tokenId: crypto.randomUUID(),
    });

  await sessionRepository.create({
    userId: user.id,
    refreshToken,
    expiresAt: new Date(
      Date.now() +
      1000 * 60 * 60 * 24 * 30,
    ),
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    accessToken,
    refreshToken,
  };
}
