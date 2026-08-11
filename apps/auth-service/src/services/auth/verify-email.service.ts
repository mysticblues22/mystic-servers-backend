import { verifyAccessToken } from "@mystic/auth";

import {
  sessionRepository,
  userRepository,
} from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";

export async function verifyEmailService(
  accessToken: string,
) {
  let payload;
  try {
    payload = await verifyAccessToken(accessToken);
  } catch {
    throw new HttpError(
      400,
      "INVALID_VERIFICATION_TOKEN",
      "Invalid verification token",
    );
  }

  const user =
    await userRepository.findById(
      payload.userId,
    );

  if (!user) {
    throw new HttpError(
      400,
      "INVALID_VERIFICATION_TOKEN",
      "Invalid verification token",
    );
  }

  if (user.isVerified) {
    throw new HttpError(
      400,
      "EMAIL_ALREADY_VERIFIED",
      "Email is already verified",
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
