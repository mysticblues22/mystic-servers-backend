import {
  db,
  emailSettings,
  emailTemplates,
  emailLogs,
  emailQueue,
  auditLogs,
  eq,
  sql,
  desc,
} from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";
import { encryptSecret, decryptSecret } from "./encryption.service.js";
import { SmtpEmailProvider } from "./providers/smtp.provider.js";
import { DEFAULT_TEMPLATES, renderTemplate } from "./template-renderer.js";
import { enqueueEmailJob, processEmailQueue } from "./email-queue.js";

export async function getEmailDashboardService() {
  const [settings] = await db.select().from(emailSettings).limit(1);

  // Queue counters
  const [queued] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailQueue)
    .where(eq(emailQueue.status, "QUEUED"));

  const [sending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailQueue)
    .where(eq(emailQueue.status, "SENDING"));

  const [sent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailQueue)
    .where(eq(emailQueue.status, "SENT"));

  const [failed] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailQueue)
    .where(eq(emailQueue.status, "FAILED"));

  const [rateLimited] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailQueue)
    .where(eq(emailQueue.status, "RATE_LIMITED"));

  const [skipped] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailQueue)
    .where(eq(emailQueue.status, "SKIPPED"));

  // Last successful delivery
  const [lastSent] = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.status, "SENT"))
    .orderBy(desc(emailLogs.sentAt))
    .limit(1);

  // Last failure
  const [lastFailure] = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.status, "FAILED"))
    .orderBy(desc(emailLogs.createdAt))
    .limit(1);

  // Daily count
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailQueue)
    .where(eq(emailQueue.status, "SENT"));

  return {
    settings: settings
      ? {
          provider: settings.provider,
          smtpHost: settings.smtpHost || "",
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser || "",
          smtpSecure: settings.smtpSecure,
          smtpFrom: settings.smtpFrom,
          supportEmail: settings.supportEmail,
          emailsEnabled: settings.emailsEnabled,
          dailyLimitEnabled: settings.dailyLimitEnabled,
          dailyLimit: settings.dailyLimit,
          monthlyLimitEnabled: settings.monthlyLimitEnabled,
          monthlyLimit: settings.monthlyLimit,
          isConfigured: !!(settings.smtpHost && settings.smtpUser && settings.encryptedSmtpPass),
        }
      : {
          provider: "smtp",
          smtpHost: process.env.SMTP_HOST || "",
          smtpPort: Number(process.env.SMTP_PORT || 587),
          smtpUser: process.env.SMTP_USER || "",
          smtpSecure: process.env.SMTP_SECURE === "true",
          smtpFrom: process.env.SMTP_FROM || "Mystic Servers <noreply@mysticservers.com>",
          supportEmail: process.env.SUPPORT_EMAIL || "support@mysticservers.com",
          emailsEnabled: true,
          dailyLimitEnabled: false,
          dailyLimit: 80,
          monthlyLimitEnabled: false,
          monthlyLimit: 2500,
          isConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        },
    metrics: {
      queued: queued?.count || 0,
      sending: sending?.count || 0,
      sent: sent?.count || 0,
      failed: failed?.count || 0,
      rateLimited: rateLimited?.count || 0,
      skipped: skipped?.count || 0,
      todaySent: todayCount?.count || 0,
      lastSuccessfulDelivery: lastSent ? lastSent.sentAt : null,
      lastFailureMessage: lastFailure ? `${lastFailure.recipient}: ${lastFailure.errorMessage}` : null,
    },
  };
}

export async function updateEmailSettingsService(
  adminUserId: string,
  input: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure?: boolean;
    smtpFrom?: string;
    supportEmail?: string;
    emailsEnabled?: boolean;
    dailyLimitEnabled?: boolean;
    dailyLimit?: number;
    monthlyLimitEnabled?: boolean;
    monthlyLimit?: number;
  },
) {
  const [existing] = await db.select().from(emailSettings).limit(1);

  let encryptedSmtpPass = existing?.encryptedSmtpPass || null;

  // Enforce mandatory ENCRYPTION_KEY check when providing a password
  if (input.smtpPass !== undefined && input.smtpPass.trim() !== "") {
    encryptedSmtpPass = encryptSecret(input.smtpPass.trim());
  }

  if (existing) {
    const [updated] = await db
      .update(emailSettings)
      .set({
        ...(input.smtpHost !== undefined ? { smtpHost: input.smtpHost } : {}),
        ...(input.smtpPort !== undefined ? { smtpPort: input.smtpPort } : {}),
        ...(input.smtpUser !== undefined ? { smtpUser: input.smtpUser } : {}),
        ...(encryptedSmtpPass !== null ? { encryptedSmtpPass } : {}),
        ...(input.smtpSecure !== undefined ? { smtpSecure: input.smtpSecure } : {}),
        ...(input.smtpFrom !== undefined ? { smtpFrom: input.smtpFrom } : {}),
        ...(input.supportEmail !== undefined ? { supportEmail: input.supportEmail } : {}),
        ...(input.emailsEnabled !== undefined ? { emailsEnabled: input.emailsEnabled } : {}),
        ...(input.dailyLimitEnabled !== undefined ? { dailyLimitEnabled: input.dailyLimitEnabled } : {}),
        ...(input.dailyLimit !== undefined ? { dailyLimit: input.dailyLimit } : {}),
        ...(input.monthlyLimitEnabled !== undefined ? { monthlyLimitEnabled: input.monthlyLimitEnabled } : {}),
        ...(input.monthlyLimit !== undefined ? { monthlyLimit: input.monthlyLimit } : {}),
        updatedAt: new Date(),
      })
      .where(eq(emailSettings.id, existing.id))
      .returning();

    await db.insert(auditLogs).values({
      adminUserId,
      action: "EMAIL_SETTINGS_UPDATED",
      entityType: "email_settings",
      entityId: existing.id,
      details: JSON.stringify({ host: updated.smtpHost, port: updated.smtpPort, enabled: updated.emailsEnabled }),
      createdAt: new Date(),
    });
  } else {
    const [created] = await db
      .insert(emailSettings)
      .values({
        provider: "smtp",
        smtpHost: input.smtpHost || "",
        smtpPort: input.smtpPort ?? 587,
        smtpUser: input.smtpUser || "",
        encryptedSmtpPass: encryptedSmtpPass,
        smtpSecure: input.smtpSecure ?? false,
        smtpFrom: input.smtpFrom || "Mystic Servers <noreply@mysticservers.com>",
        supportEmail: input.supportEmail || "support@mysticservers.com",
        emailsEnabled: input.emailsEnabled ?? true,
        dailyLimit: input.dailyLimit ?? 80,
        monthlyLimit: input.monthlyLimit ?? 2500,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(auditLogs).values({
      adminUserId,
      action: "EMAIL_SETTINGS_CREATED",
      entityType: "email_settings",
      entityId: created.id,
      details: JSON.stringify({ host: created.smtpHost, port: created.smtpPort }),
      createdAt: new Date(),
    });
  }

  return { success: true, message: "Email settings updated successfully" };
}

export async function testSmtpConnectionService(input: {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
}) {
  const [existing] = await db.select().from(emailSettings).limit(1);

  const host = input.smtpHost || existing?.smtpHost || process.env.SMTP_HOST;
  const port = input.smtpPort ?? existing?.smtpPort ?? Number(process.env.SMTP_PORT || 587);
  const user = input.smtpUser || existing?.smtpUser || process.env.SMTP_USER;
  let pass = input.smtpPass;

  if (!pass && existing?.encryptedSmtpPass) {
    pass = decryptSecret(existing.encryptedSmtpPass);
  }
  if (!pass) {
    pass = process.env.SMTP_PASS;
  }

  if (!host || !user || !pass) {
    throw new HttpError(400, "MISSING_CREDENTIALS", "SMTP host, user, and password are required to test connection");
  }

  const provider = new SmtpEmailProvider({
    host,
    port,
    user,
    pass,
    secure: input.smtpSecure ?? existing?.smtpSecure ?? (process.env.SMTP_SECURE === "true"),
  });

  return provider.testConnection();
}

export async function sendTestEmailService(recipient: string, templateKey: string = "verification") {
  const sampleVars: Record<string, string | number> = {
    username: "Test Admin",
    verification_url: `${process.env.FRONTEND_URL || "https://mysticservers.com"}/verify-email?token=TEST_TOKEN_123`,
    reset_url: `${process.env.FRONTEND_URL || "https://mysticservers.com"}/reset-password?token=TEST_TOKEN_123`,
    otp: "849201",
    otp_expiry: 10,
    ticket_id: "TKT-8849",
    name: "Test User",
    email: recipient,
    subject: "Test Support Inquiry",
    message: "This is a test notification message from the Mystic Servers Admin Email Control Plane.",
    order_number: "ORD-99382",
    invoice_number: "INV-2026-001",
    amount: "$19.99",
    currency: "USD",
    server_name: "vps-test-node-01",
    plan_name: "VPS Standard",
    support_email: "support@mysticservers.com",
    frontend_url: process.env.FRONTEND_URL || "https://mysticservers.com",
  };

  const rendered = await renderTemplate(templateKey, sampleVars);

  const jobId = await enqueueEmailJob({
    recipient,
    templateKey,
    subject: `[TEST EMAIL] ${rendered.subject}`,
    htmlBody: rendered.htmlBody,
    textBody: rendered.textBody,
  });

  // Force queue flush for test email
  await processEmailQueue();

  return { success: true, jobId, message: `Test email dispatched to ${recipient}` };
}

export async function listTemplatesService() {
  const dbList = await db.select().from(emailTemplates);
  const keys = Object.keys(DEFAULT_TEMPLATES);

  const merged = keys.map((k) => {
    const match = dbList.find((t) => t.key === k);
    const def = DEFAULT_TEMPLATES[k];
    return {
      key: k,
      name: def.name,
      subject: match ? match.subject : def.subject,
      htmlBody: match ? match.htmlBody : def.htmlBody,
      textBody: match ? match.textBody : def.textBody,
      variables: def.variables,
      isEnabled: match ? match.isEnabled : true,
      isCustomized: !!match,
    };
  });

  return { templates: merged };
}

export async function getTemplateByKeyService(key: string) {
  const [match] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, key))
    .limit(1);

  const def = DEFAULT_TEMPLATES[key];

  if (!def && !match) {
    throw new HttpError(404, "TEMPLATE_NOT_FOUND", `Email template '${key}' not found`);
  }

  return {
    template: {
      key,
      name: def?.name || key,
      subject: match ? match.subject : def.subject,
      htmlBody: match ? match.htmlBody : def.htmlBody,
      textBody: match ? match.textBody : def.textBody,
      variables: def?.variables || [],
      isEnabled: match ? match.isEnabled : true,
      isCustomized: !!match,
    },
  };
}

export async function updateTemplateService(
  key: string,
  adminUserId: string,
  input: { subject?: string; htmlBody?: string; textBody?: string; isEnabled?: boolean },
) {
  const [existing] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, key))
    .limit(1);

  const def = DEFAULT_TEMPLATES[key];

  if (existing) {
    await db
      .update(emailTemplates)
      .set({
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        ...(input.htmlBody !== undefined ? { htmlBody: input.htmlBody } : {}),
        ...(input.textBody !== undefined ? { textBody: input.textBody } : {}),
        ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, existing.id));
  } else {
    await db.insert(emailTemplates).values({
      key,
      name: def?.name || key,
      subject: input.subject || def?.subject || key,
      htmlBody: input.htmlBody || def?.htmlBody || "",
      textBody: input.textBody || def?.textBody || "",
      variablesJson: JSON.stringify(def?.variables || []),
      isEnabled: input.isEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db.insert(auditLogs).values({
    adminUserId,
    action: "EMAIL_TEMPLATE_UPDATED",
    entityType: "email_template",
    entityId: key,
    details: JSON.stringify({ key, enabled: input.isEnabled }),
    createdAt: new Date(),
  });

  return { success: true, message: `Template '${key}' updated successfully` };
}

export async function resetTemplateService(key: string, adminUserId: string) {
  await db.delete(emailTemplates).where(eq(emailTemplates.key, key));

  await db.insert(auditLogs).values({
    adminUserId,
    action: "EMAIL_TEMPLATE_RESET",
    entityType: "email_template",
    entityId: key,
    details: JSON.stringify({ key, action: "reset_to_default" }),
    createdAt: new Date(),
  });

  return { success: true, message: `Template '${key}' restored to default Mystic Servers branding` };
}

export async function listEmailLogsService() {
  const logs = await db
    .select()
    .from(emailLogs)
    .orderBy(desc(emailLogs.createdAt))
    .limit(100);

  return { logs };
}
