import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { HttpError } from "../errors/http-error.js";
import {
  getEmailDashboardService,
  getTemplateByKeyService,
  listEmailLogsService,
  listTemplatesService,
  resetTemplateService,
  sendTestEmailService,
  testSmtpConnectionService,
  updateEmailSettingsService,
  updateTemplateService,
} from "../services/email/email-admin.service.js";

const updateSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  smtpFrom: z.string().optional(),
  supportEmail: z.string().email().optional(),
  emailsEnabled: z.boolean().optional(),
  dailyLimitEnabled: z.boolean().optional(),
  dailyLimit: z.number().int().min(1).optional(),
  monthlyLimitEnabled: z.boolean().optional(),
  monthlyLimit: z.number().int().min(1).optional(),
});

const testConnectionSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpSecure: z.boolean().optional(),
});

const sendTestEmailSchema = z.object({
  recipient: z.string().email("Invalid recipient email address"),
  templateKey: z.string().optional(),
});

const templateKeyParamSchema = z.object({
  key: z.string().min(1),
});

const updateTemplateSchema = z.object({
  subject: z.string().optional(),
  htmlBody: z.string().optional(),
  textBody: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export async function getEmailDashboardController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const result = await getEmailDashboardService();
  return reply.send(result);
}

export async function updateEmailSettingsController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const body = updateSettingsSchema.parse(request.body);
  const result = await updateEmailSettingsService(request.user.id, body);
  return reply.send(result);
}

export async function testSmtpConnectionController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const body = testConnectionSchema.parse(request.body || {});
  const result = await testSmtpConnectionService(body);
  return reply.send(result);
}

export async function sendTestEmailController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const body = sendTestEmailSchema.parse(request.body);
  const result = await sendTestEmailService(body.recipient, body.templateKey);
  return reply.send(result);
}

export async function listTemplatesController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const result = await listTemplatesService();
  return reply.send(result);
}

export async function getTemplateByKeyController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const params = templateKeyParamSchema.parse(request.params);
  const result = await getTemplateByKeyService(params.key);
  return reply.send(result);
}

export async function updateTemplateController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const params = templateKeyParamSchema.parse(request.params);
  const body = updateTemplateSchema.parse(request.body);
  const result = await updateTemplateService(params.key, request.user.id, body);
  return reply.send(result);
}

export async function resetTemplateController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const params = templateKeyParamSchema.parse(request.params);
  const result = await resetTemplateService(params.key, request.user.id);
  return reply.send(result);
}

export async function listEmailLogsController(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  const result = await listEmailLogsService();
  return reply.send(result);
}
