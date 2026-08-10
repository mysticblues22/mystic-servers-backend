import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<
  typeof registerSchema
>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordInput =
  z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string(),

  password: z
    .string()
    .min(8),
});

export type ResetPasswordInput =
  z.infer<typeof resetPasswordSchema>;

export type LoginInput = z.infer<
  typeof loginSchema
>;
