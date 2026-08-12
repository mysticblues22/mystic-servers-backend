import type { FastifyReply, FastifyRequest } from "fastify";
import { processRazorpayWebhookService } from "../services/payment/webhook.service.js";

export async function razorpayWebhookController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const signature = request.headers["x-razorpay-signature"] as string | undefined;

  const rawBody =
    (request as any).rawBody ||
    (typeof request.body === "string" ? request.body : JSON.stringify(request.body));

  const parsedBody =
    typeof request.body === "string" ? JSON.parse(request.body) : request.body;

  await processRazorpayWebhookService(rawBody, signature, parsedBody);

  return reply.status(200).send({ status: "ok" });
}
