import type { FastifyReply, FastifyRequest } from "fastify";
import { detectRegionFromRequest } from "../services/region/region-detector.service.js";

export async function detectRegionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const detected = detectRegionFromRequest(request);
  return reply.send({ region: detected });
}
