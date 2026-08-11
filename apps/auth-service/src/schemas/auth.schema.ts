import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  email: emailSchema,
  username: z.string().min(3).max(32),
  password: passwordSchema,
});

export type RegisterInput = z.infer<
  typeof registerSchema
>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput =
  z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: passwordSchema,
});

export type ResetPasswordInput =
  z.infer<typeof resetPasswordSchema>;

export type LoginInput = z.infer<
  typeof loginSchema
>;
