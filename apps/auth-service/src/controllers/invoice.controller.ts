import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpError } from "../errors/http-error.js";
import { getInvoiceByIdSchema } from "../schemas/invoice.schema.js";
import {
  getUserInvoiceByIdService,
  getUserInvoicesService,
} from "../services/invoice/invoice.service.js";

export async function listInvoicesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }
  const result = await getUserInvoicesService(request.user.id);
  return reply.send(result);
}

export async function getInvoiceByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  }
  const params = getInvoiceByIdSchema.parse(request.params);
  const result = await getUserInvoiceByIdService(request.user.id, params.id);
  return reply.send(result);
}
