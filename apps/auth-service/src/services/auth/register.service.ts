import {
  createAccessToken,
  createRefreshToken,
  hashPassword,
} from "@mystic/auth";

import {
  sessionRepository,
  userRepository,
} from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";
import { RegisterInput } from "../../schemas/auth.schema.js";
import { emailService } from "../email/email.service.js";

export async function registerService(
  input: RegisterInput,
) {
  const emailExists =
    await userRepository.findByEmail(input.email);

  if (emailExists) {
    throw new HttpError(
      400,
      "EMAIL_ALREADY_EXISTS",
      "Email already exists",
    );
  }

  const usernameExists =
    await userRepository.findByUsername(
      input.username,
    );

  if (usernameExists) {
    throw new HttpError(
      400,
      "USERNAME_ALREADY_EXISTS",
      "Username already exists",
    );
  }

  const passwordHash = await hashPassword(
    input.password,
  );

  const user = await userRepository.create({
    email: input.email,
    username: input.username,
    passwordHash,
    role: "user",
  });

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

  // Dispatch email verification asynchronously
  emailService
    .sendVerificationEmail(user.email, accessToken, user.username)
    .catch((err) => console.error("[Verification Email Dispatch Error]", err?.message));

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    accessToken,
    refreshToken,
  };
}
