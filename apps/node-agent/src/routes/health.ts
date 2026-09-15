import os from "node:os";
import type { FastifyInstance } from "fastify";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/agent-health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      nodeId: process.env.NODE_ID || "node-local",
      nodeName: process.env.NODE_NAME || os.hostname(),
      agentVersion: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });
}
