import "./env.js";

import { envSchema } from "./schema.js";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables");
  console.error(parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

export const config = {
  app: {
    name: env.APP_NAME,
    port: env.APP_PORT,
    environment: env.NODE_ENV,
  },

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  minio: {
    endpoint: env.MINIO_ENDPOINT,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
  },

  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  },
} as const;
