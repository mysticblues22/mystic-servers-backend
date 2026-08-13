import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  getEmailDashboardController,
  getTemplateByKeyController,
  listEmailLogsController,
  listTemplatesController,
  resetTemplateController,
  sendTestEmailController,
  testSmtpConnectionController,
  updateEmailSettingsController,
  updateTemplateController,
} from "../controllers/email-admin.controller.js";

export async function registerEmailAdminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/settings/email",
    { preHandler: [authMiddleware, requireRole("admin")] },
    getEmailDashboardController,
  );

  app.put(
    "/admin/settings/email",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateEmailSettingsController,
  );

  app.post(
    "/admin/settings/email/test-connection",
    { preHandler: [authMiddleware, requireRole("admin")] },
    testSmtpConnectionController,
  );

  app.post(
    "/admin/settings/email/send-test",
    { preHandler: [authMiddleware, requireRole("admin")] },
    sendTestEmailController,
  );

  app.get(
    "/admin/settings/email/templates",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listTemplatesController,
  );

  app.get(
    "/admin/settings/email/templates/:key",
    { preHandler: [authMiddleware, requireRole("admin")] },
    getTemplateByKeyController,
  );

  app.put(
    "/admin/settings/email/templates/:key",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateTemplateController,
  );

  app.post(
    "/admin/settings/email/templates/:key/reset",
    { preHandler: [authMiddleware, requireRole("admin")] },
    resetTemplateController,
  );

  app.get(
    "/admin/settings/email/logs",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listEmailLogsController,
  );
}
