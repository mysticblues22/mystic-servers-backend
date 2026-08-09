import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "production",
    "test"
  ]).default("development"),

  APP_NAME: z.string(),

  APP_PORT: z.coerce.number(),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string(),

  MINIO_ENDPOINT: z.string(),

  MINIO_ACCESS_KEY: z.string(),

  MINIO_SECRET_KEY: z.string(),

  JWT_SECRET: z.string(),

  JWT_REFRESH_SECRET: z.string()
});

export type Env = z.infer<typeof envSchema>;
