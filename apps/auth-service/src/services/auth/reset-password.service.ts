import crypto from "node:crypto";

import { hashPassword } from "@mystic/auth";

import {
  passwordResetRepository,
  sessionRepository,
  userRepository,
} from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";
import { ResetPasswordInput } from "../../schemas/auth.schema.js";

export async function resetPasswordService(
  input: ResetPasswordInput,
) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(input.token)
    .digest("hex");

  const token =
    await passwordResetRepository.findByHash(
      tokenHash,
    );

  if (!token) {
    throw new HttpError(
      400,
      "INVALID_RESET_TOKEN",
      "Invalid or expired reset token",
    );
  }

  if (
    token.expiresAt.getTime() <
    Date.now()
  ) {
    await passwordResetRepository.deleteByHash(
      tokenHash,
    );

    throw new HttpError(
      400,
      "INVALID_RESET_TOKEN",
      "Invalid or expired reset token",
    );
  }

  const passwordHash =
    await hashPassword(input.password);

  await userRepository.updatePassword(
    token.userId,
    passwordHash,
  );

  await passwordResetRepository.deleteByUser(
    token.userId,
  );

  await sessionRepository.deleteAllByUser(
    token.userId,
  );

  return {
    success: true,
  };
}
