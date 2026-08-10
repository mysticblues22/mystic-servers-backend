import crypto from "node:crypto";

import {
  passwordResetRepository,
  userRepository,
} from "@mystic/database";

import { ForgotPasswordInput } from "../../schemas/auth.schema.js";

export async function forgotPasswordService(
  input: ForgotPasswordInput,
) {
  const user = await userRepository.findByEmail(
    input.email,
  );

  // Always return success to avoid user enumeration
  if (!user) {
    return {
      success: true,
    };
  }

  const token = crypto.randomUUID();

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  await passwordResetRepository.deleteByUser(
    user.id,
  );

  await passwordResetRepository.create({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(
      Date.now() + 1000 * 60 * 60,
    ),
  });

  return {
    success: true,
    token,
  };
}
