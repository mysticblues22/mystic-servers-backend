import crypto from "node:crypto";
import {
  passwordResetRepository,
  userRepository,
} from "@mystic/database";
import { ForgotPasswordInput } from "../../schemas/auth.schema.js";

export async function forgotPasswordService(
  input: ForgotPasswordInput,
) {
  const user = await userRepository.findByEmail(input.email);

  // Always return identical generic success message to prevent user enumeration attacks
  const genericResponse = {
    success: true,
    message: "If an account matching that email address exists, password recovery instructions will be provided.",
  };

  if (!user) {
    return genericResponse;
  }

  const token = crypto.randomUUID();

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  await passwordResetRepository.deleteByUser(user.id);

  await passwordResetRepository.create({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  });

  return genericResponse;
}
