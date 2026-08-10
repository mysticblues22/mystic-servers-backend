import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "@mystic/auth";

import {
  sessionRepository,
  userRepository,
} from "@mystic/database";

export async function refreshService(
  refreshToken: string,
) {
  const payload =
    await verifyRefreshToken(refreshToken);

  const session =
    await sessionRepository.findByRefreshToken(
      refreshToken,
    );

  if (!session) {
    throw new Error("Invalid refresh token");
  }

  if (session.expiresAt < new Date()) {
    await sessionRepository.deleteByRefreshToken(
      refreshToken,
    );

    throw new Error("Refresh token expired");
  }

  const user =
    await userRepository.findById(
      session.userId,
    );

  if (!user) {
    await sessionRepository.deleteByRefreshToken(
      refreshToken,
    );

    throw new Error("User not found");
  }

  await sessionRepository.deleteByRefreshToken(
    refreshToken,
  );

  const newRefreshToken =
    await createRefreshToken({
      userId: user.id,
      tokenId: crypto.randomUUID(),
    });

  await sessionRepository.create({
    userId: user.id,
    refreshToken: newRefreshToken,
    expiresAt: new Date(
      Date.now() +
        1000 * 60 * 60 * 24 * 30,
    ),
  });

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
