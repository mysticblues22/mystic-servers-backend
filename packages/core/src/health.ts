import { FastifyInstance } from "fastify";

export async function registerHealthRoute(
  app: FastifyInstance<any, any, any, any>
) {
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });
}
