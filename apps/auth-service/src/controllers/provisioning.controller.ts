import type { FastifyReply, FastifyRequest } from "fastify";
import { provisioningService } from "../services/provisioning/provisioning.service.js";

export async function adminManualProvisionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const adminUserId = (request as any).user?.id || (request as any).user?.userId;
  const body = request.body as {
    orderId: string;
    sshPublicKey?: string;
    image?: string;
  };

  const result = await provisioningService.provisionServerForOrder({
    orderId: body.orderId,
    adminUserId,
    sshPublicKey: body.sshPublicKey,
    image: body.image,
  });

  return reply.status(200).send(result);
}
