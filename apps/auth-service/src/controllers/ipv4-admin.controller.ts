import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { HttpError } from "../errors/http-error.js";
import {
  addIPv4AddressService,
  listIPv4InventoryService,
  updateIPv4StatusService,
} from "../services/ipv4/ipv4-admin.service.js";

const ipv4IdParamSchema = z.object({
  id: z.string().uuid("Invalid IPv4 ID"),
});

const addIPv4Schema = z.object({
  ipAddress: z.string().min(7).max(45),
  subnetPrefix: z.string().optional(),
  regionCode: z.string().optional(),
  monthlyPriceCents: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const updateIPv4StatusSchema = z.object({
  status: z.enum(["available", "assigned", "reserved", "blocked"]).optional(),
  notes: z.string().optional(),
  assignedServerId: z.string().uuid().nullable().optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
});

export async function listIPv4InventoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const result = await listIPv4InventoryService();
  return reply.send(result);
}

export async function addIPv4AddressController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const body = addIPv4Schema.parse(request.body);
  const result = await addIPv4AddressService(request.user.id, body);
  return reply.status(201).send(result);
}

export async function updateIPv4StatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const params = ipv4IdParamSchema.parse(request.params);
  const body = updateIPv4StatusSchema.parse(request.body);
  const result = await updateIPv4StatusService(params.id, request.user.id, body);
  return reply.send(result);
}
