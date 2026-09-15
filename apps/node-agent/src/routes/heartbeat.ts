import os from "node:os";
import type { FastifyInstance } from "fastify";
import { nodeAgentAuthMiddleware } from "../auth/node-agent-auth.middleware.js";
import { capabilityService } from "../services/capability.service.js";
import { hostInfoService } from "../services/host-info.service.js";

export async function heartbeatRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/heartbeat",
    { preHandler: [nodeAgentAuthMiddleware] },
    async (_request, reply) => {
      const hardware = hostInfoService.getHardwareMetrics();
      const capabilitiesReport = capabilityService.getCapabilitiesReport();

      return reply.send({
        status: "ok",
        nodeId: process.env.NODE_ID || "node-local",
        nodeName: process.env.NODE_NAME || os.hostname(),
        agentVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        metrics: {
          totalCpuCores: hardware.cpu.cores,
          totalRamMb: hardware.ram.totalMb,
          usedRamMb: hardware.ram.usedMb,
          totalDiskGb: hardware.disk.totalGb,
          usedDiskGb: hardware.disk.usedGb,
        },
        capabilities: capabilitiesReport.capabilities,
      });
    },
  );
}
