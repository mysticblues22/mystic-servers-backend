import { verifyAccessToken } from "@mystic/auth";

import {
  sessionRepository,
  userRepository,
} from "@mystic/database";

export async function verifyEmailService(
  accessToken: string,
) {
  const payload =
    await verifyAccessToken(accessToken);

  const user =
    await userRepository.findById(
      payload.userId,
    );

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error(
      "Email already verified",
    );
  }

  await userRepository.verifyUser(
    user.id,
  );

  await sessionRepository.deleteByUser(
    user.id,
  );

  return {
    success: true,
    message: "Email verified successfully",
  };
}
