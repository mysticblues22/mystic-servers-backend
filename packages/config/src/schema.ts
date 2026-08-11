import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "production",
    "test"
  ]).default("development"),

  APP_NAME: z.string(),

  LOG_LEVEL: z.string().default("info"),

  API_HOST: z.string(),

  API_PORT: z.coerce.number(),

  DATABASE_HOST: z.string(),

  DATABASE_PORT: z.coerce.number(),

  DATABASE_NAME: z.string(),

  DATABASE_USER: z.string(),

  DATABASE_PASSWORD: z.string(),

  REDIS_HOST: z.string(),

  REDIS_PORT: z.coerce.number(),

  MINIO_ENDPOINT: z.string(),

  MINIO_PORT: z.coerce.number(),

  JWT_SECRET: z.string(),

  JWT_REFRESH_SECRET: z.string(),

  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default("15m"),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default("30d"),

  AUTH_COOKIE_SECURE: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === "") return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
});

export type Env = z.infer<typeof envSchema>;
