import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "@mystic/auth";

import {
  sessionRepository,
  userRepository,
} from "@mystic/database";

import { UnauthorizedError } from "../../errors/http-error.js";

export async function refreshService(
  refreshToken: string,
) {
  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new UnauthorizedError(
      "INVALID_REFRESH_TOKEN",
      "Invalid or expired refresh token",
    );
  }

  const session =
    await sessionRepository.findByRefreshToken(
      refreshToken,
    );

  if (!session) {
    throw new UnauthorizedError(
      "INVALID_REFRESH_TOKEN",
      "Invalid or expired refresh token",
    );
  }

  if (session.expiresAt < new Date()) {
    await sessionRepository.deleteByRefreshToken(
      refreshToken,
    );

    throw new UnauthorizedError(
      "INVALID_REFRESH_TOKEN",
      "Invalid or expired refresh token",
    );
  }

  const user =
    await userRepository.findById(
      session.userId,
    );

  if (!user) {
    await sessionRepository.deleteByRefreshToken(
      refreshToken,
    );

    throw new UnauthorizedError(
      "INVALID_REFRESH_TOKEN",
      "Invalid or expired refresh token",
    );
  }

  const newRefreshToken =
    await createRefreshToken({
      userId: user.id,
      tokenId: crypto.randomUUID(),
    });

  const newSession =
    await sessionRepository.rotateSession(
      refreshToken,
      {
        userId: user.id,
        refreshToken: newRefreshToken,
        expiresAt: new Date(
          Date.now() +
            1000 * 60 * 60 * 24 * 30,
        ),
      },
    );

  if (!newSession) {
    throw new UnauthorizedError(
      "INVALID_REFRESH_TOKEN",
      "Invalid or expired refresh token",
    );
  }

  const accessToken =
    await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}
