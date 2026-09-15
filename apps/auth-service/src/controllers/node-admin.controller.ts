import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createAdminNodeService,
  deleteAdminNodeService,
  getAdminNodeByIdService,
  listAdminNodesService,
  regenerateNodeTokenService,
  updateAdminNodeService,
} from "../services/node/node-admin.service.js";
import { processNodeHeartbeatService } from "../services/node/node-heartbeat.service.js";

export async function listAdminNodesController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = await listAdminNodesService();
  return reply.status(200).send(data);
}

export async function getAdminNodeByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = (request.params as { id: string }) || {};
  const data = await getAdminNodeByIdService(id);
  return reply.status(200).send(data);
}

export async function createAdminNodeController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const adminUserId = (request as any).user?.id || (request as any).user?.userId;
  const input = request.body as {
    name: string;
    hostname: string;
    address: string;
    region: string;
    totalCpuCores?: number;
    totalRamMb?: number;
    totalDiskGb?: number;
  };

  const data = await createAdminNodeService(adminUserId, input);
  return reply.status(201).send(data);
}

export async function updateAdminNodeController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = (request.params as { id: string }) || {};
  const adminUserId = (request as any).user?.id || (request as any).user?.userId;
  const input = request.body as {
    name?: string;
    hostname?: string;
    address?: string;
    region?: string;
    status?: "pending" | "online" | "offline" | "disabled";
  };

  const data = await updateAdminNodeService(id, adminUserId, input);
  return reply.status(200).send(data);
}

export async function deleteAdminNodeController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = (request.params as { id: string }) || {};
  const adminUserId = (request as any).user?.id || (request as any).user?.userId;

  const data = await deleteAdminNodeService(id, adminUserId);
  return reply.status(200).send(data);
}

export async function regenerateNodeTokenController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = (request.params as { id: string }) || {};
  const adminUserId = (request as any).user?.id || (request as any).user?.userId;

  const data = await regenerateNodeTokenService(id, adminUserId);
  return reply.status(200).send(data);
}

export async function nodeHeartbeatController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const header = request.headers.authorization;
  const customHeader = request.headers["x-node-token"] as string | undefined;

  let token: string | undefined;
  if (header && header.startsWith("Bearer ")) {
    token = header.substring(7).trim();
  } else if (customHeader) {
    token = customHeader.trim();
  }

  const payload = (request.body as any) || {};

  const data = await processNodeHeartbeatService(token, payload);
  return reply.status(200).send(data);
}
