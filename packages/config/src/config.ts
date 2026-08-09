import { envSchema } from "./schema.js";

export function loadConfig() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables");
    console.error(parsed.error.format());
    process.exit(1);
  }

  const env = parsed.data;

  const databaseUrl =
    `postgres://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}` +
    `@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`;

  const redisUrl =
    `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;

  return {
    app: {
      name: env.APP_NAME,
      environment: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
      host: env.API_HOST,
      port: env.API_PORT,
    },

    database: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      name: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      url: databaseUrl,
    },

    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      url: redisUrl,
    },

    minio: {
      endpoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
    },

    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  } as const;
}
