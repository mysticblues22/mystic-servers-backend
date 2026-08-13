import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { db, contactInquiries } from "@mystic/database";
import { emailService } from "../services/email/email.service.js";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function submitContactController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = contactSchema.parse(request.body);
  const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;

  // Store Inquiry in Database
  await db.insert(contactInquiries).values({
    ticketId,
    name: body.name,
    email: body.email,
    subject: body.subject,
    message: body.message,
    status: "open",
    createdAt: new Date(),
  });

  request.log.info({ contact: body, ticketId }, "Received customer contact request");

  try {
    await emailService.sendContactNotification({
      ...body,
      ticketId,
    });
  } catch (err: any) {
    request.log.warn(`[Contact Email Warning] ${err.message}`);
  }

  return reply.status(201).send({
    success: true,
    message: "Thank you. Your message has been received and logged.",
    data: {
      id: ticketId,
      ticketId,
      receivedAt: new Date().toISOString(),
    },
  });
}
