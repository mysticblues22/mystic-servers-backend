import fastifyCors from "@fastify/cors";
import { createServer } from "@mystic/core";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { healthRoutes } from "./routes/health.js";
import { capabilitiesRoutes } from "./routes/capabilities.js";
import { heartbeatRoutes } from "./routes/heartbeat.js";
import { registerIncusRoutes } from "./routes/incus.js";

export async function buildNodeAgentApp() {
  const app = await createServer();

  await app.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Node-Token"],
  });

  app.setErrorHandler(
    (
      error: Error & { statusCode?: number; code?: string },
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
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
            : "An unexpected error occurred in node agent.",
        },
      });
    },
  );

  await healthRoutes(app);
  await capabilitiesRoutes(app);
  await heartbeatRoutes(app);
  await registerIncusRoutes(app);

  return app;
}
