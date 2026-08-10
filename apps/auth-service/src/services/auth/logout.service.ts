import {
  verifyRefreshToken,
} from "@mystic/auth";

import {
  sessionRepository,
} from "@mystic/database";

export async function logoutService(
  refreshToken: string,
) {
  await verifyRefreshToken(refreshToken);

  const session =
    await sessionRepository.findByRefreshToken(
      refreshToken,
    );

  if (!session) {
    throw new Error("Invalid refresh token");
  }

  await sessionRepository.deleteByRefreshToken(
    refreshToken,
  );

  return {
    success: true,
  };
}
