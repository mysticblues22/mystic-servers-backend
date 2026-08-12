import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import { loadConfig } from "@mystic/config";
import { createServer } from "@mystic/core";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { registerAuthRoutes } from "./routes/auth.js";
import { registerCurrencyRoutes } from "./routes/currencies.js";
import { registerForgotPasswordRoute } from "./routes/forgot-password.js";
import { registerInvoiceRoutes } from "./routes/invoices.js";
import { registerLoginRoutes } from "./routes/login.js";
import { registerLogoutRoutes } from "./routes/logout.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerOrderRoutes } from "./routes/orders.js";
import { registerPaymentRoutes } from "./routes/payments.js";
import { registerPlanRoutes } from "./routes/plans.js";
import { registerRefreshRoutes } from "./routes/refresh.js";
import { registerResetPasswordRoute } from "./routes/reset-password.js";
import { registerVerifyEmailRoutes } from "./routes/verify-email.js";

const config = loadConfig();

export async function buildApp() {
  const app = await createServer();

  // Custom JSON Content Parser to preserve raw body for Webhook HMAC Signature verification
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (req, body, done) => {
      try {
        const rawString = body.toString("utf8");
        (req as any).rawBody = rawString;
        const json = JSON.parse(rawString);
        done(null, json);
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    },
  );

  // Register CORS
  await app.register(fastifyCors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "Idempotency-Key",
      "X-Razorpay-Signature",
    ],
  });

  // Register Cookie plugin
  await app.register(fastifyCookie, {
    secret: config.jwt.secret,
  });

  // Register Rate Limiter
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: (request: FastifyRequest, context: { max: number; after: string }) => ({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Limit is ${context.max} requests per ${context.after}. Please try again later.`,
      },
    }),
  });

  // Centralized Sanitized Error Handler
  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message || "Invalid request parameters",
        },
      });
    }

    const statusCode = error.statusCode || 500;
    const isDomainError = statusCode < 500;

    return reply.status(statusCode).send({
      error: {
        code: isDomainError ? (error.code || "BAD_REQUEST") : "INTERNAL_ERROR",
        message: isDomainError
          ? error.message
          : "An unexpected error occurred. Please try again later.",
      },
    });
  });

  await registerAuthRoutes(app);
  await registerLoginRoutes(app);
  await registerLogoutRoutes(app);
  await registerRefreshRoutes(app);
  await registerMeRoutes(app);
  await registerVerifyEmailRoutes(app);
  await registerForgotPasswordRoute(app);
  await registerResetPasswordRoute(app);
  await registerPlanRoutes(app);
  await registerCurrencyRoutes(app);
  await registerOrderRoutes(app);
  await registerPaymentRoutes(app);
  await registerInvoiceRoutes(app);

  return app;
}
