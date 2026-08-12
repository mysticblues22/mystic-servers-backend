import { z } from "zod";

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    APP_NAME: z.string(),

    LOG_LEVEL: z.string().default("info"),

    API_HOST: z.string(),

    API_PORT: z.coerce.number(),

    CORS_ORIGIN: z.string().optional(),

    DATABASE_HOST: z.string(),

    DATABASE_PORT: z.coerce.number(),

    DATABASE_NAME: z.string(),

    DATABASE_USER: z.string(),

    DATABASE_PASSWORD: z.string(),

    REDIS_HOST: z.string(),

    REDIS_PORT: z.coerce.number(),

    MINIO_ENDPOINT: z.string(),

    MINIO_PORT: z.coerce.number(),

    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters"),

    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

    AUTH_COOKIE_SECURE: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      }),

    RAZORPAY_KEY_ID: z.string().optional(),

    RAZORPAY_KEY_SECRET: z.string().optional(),

    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.NODE_ENV === "production" &&
      (!data.CORS_ORIGIN || data.CORS_ORIGIN.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGIN"],
        message:
          "CORS_ORIGIN must be explicitly configured when NODE_ENV is production",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
