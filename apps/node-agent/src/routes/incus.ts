import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { nodeAgentAuthMiddleware } from "../auth/node-agent-auth.middleware.js";
import { incusProvider } from "../services/incus.provider.js";
import { VirtualizationInstanceOptions } from "../services/provider.interface.js";

export async function registerIncusRoutes(fastify: FastifyInstance) {
  // Create Container
  fastify.post(
    "/virtualization/incus/containers",
    { preHandler: [nodeAgentAuthMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as VirtualizationInstanceOptions;
      const result = await incusProvider.create(body);
      return reply.status(201).send({ status: "ok", container: result });
    },
  );

  // Start Container
  fastify.post(
    "/virtualization/incus/containers/:name/start",
    { preHandler: [nodeAgentAuthMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name } = (request.params as { name: string }) || {};
      const result = await incusProvider.start(name);
      return reply.status(200).send({ status: "ok", container: result });
    },
  );

  // Stop Container
  fastify.post(
    "/virtualization/incus/containers/:name/stop",
    { preHandler: [nodeAgentAuthMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name } = (request.params as { name: string }) || {};
      const result = await incusProvider.stop(name);
      return reply.status(200).send({ status: "ok", container: result });
    },
  );

  // Reboot Container
  fastify.post(
    "/virtualization/incus/containers/:name/reboot",
    { preHandler: [nodeAgentAuthMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name } = (request.params as { name: string }) || {};
      const result = await incusProvider.reboot(name);
      return reply.status(200).send({ status: "ok", container: result });
    },
  );

  // Delete / Destroy Container
  fastify.delete(
    "/virtualization/incus/containers/:name",
    { preHandler: [nodeAgentAuthMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name } = (request.params as { name: string }) || {};
      const result = await incusProvider.destroy(name);
      return reply.status(200).send({ status: "ok", result });
    },
  );

  // Get Container State
  fastify.get(
    "/virtualization/incus/containers/:name/state",
    { preHandler: [nodeAgentAuthMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name } = (request.params as { name: string }) || {};
      const result = await incusProvider.getState(name);
      return reply.status(200).send({ status: "ok", container: result });
    },
  );
}
