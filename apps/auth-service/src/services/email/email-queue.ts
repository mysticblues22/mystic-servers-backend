import {
  db,
  emailQueue,
  emailSettings,
  emailLogs,
  eq,
  sql,
  and,
  or,
  lte,
  gte,
  asc,
} from "@mystic/database";
import { decryptSecret } from "./encryption.service.js";
import { SmtpEmailProvider } from "./providers/smtp.provider.js";
import { IEmailProvider } from "./providers/email-provider.interface.js";

let isWorkerRunning = false;

export async function enqueueEmailJob(job: {
  recipient: string;
  templateKey: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  maxRetries?: number;
}): Promise<string> {
  const [created] = await db
    .insert(emailQueue)
    .values({
      recipient: job.recipient,
      templateKey: job.templateKey,
      subject: job.subject,
      htmlBody: job.htmlBody,
      textBody: job.textBody || null,
      status: "QUEUED",
      retryCount: 0,
      maxRetries: job.maxRetries ?? 3,
      nextRetryAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Trigger background process immediately
  processEmailQueue().catch((err) =>
    console.error("[Email Queue Worker Error]", err?.message),
  );

  return created.id;
}

export async function getProviderInstance(): Promise<{
  provider: IEmailProvider | null;
  from: string;
  supportEmail: string;
  emailsEnabled: boolean;
  dailyLimitEnabled: boolean;
  dailyLimit: number;
  monthlyLimitEnabled: boolean;
  monthlyLimit: number;
  unconfiguredReason?: string;
}> {
  // 1. Fetch DB settings first
  const [settings] = await db.select().from(emailSettings).limit(1);

  if (settings && settings.smtpHost && settings.smtpUser && settings.encryptedSmtpPass) {
    if (!settings.emailsEnabled) {
      return {
        provider: null,
        from: settings.smtpFrom,
        supportEmail: settings.supportEmail,
        emailsEnabled: false,
        dailyLimitEnabled: settings.dailyLimitEnabled,
        dailyLimit: settings.dailyLimit,
        monthlyLimitEnabled: settings.monthlyLimitEnabled,
        monthlyLimit: settings.monthlyLimit,
        unconfiguredReason: "GLOBAL_KILL_SWITCH_ACTIVE",
      };
    }

    try {
      const pass = decryptSecret(settings.encryptedSmtpPass);
      const provider = new SmtpEmailProvider({
        host: settings.smtpHost,
        port: settings.smtpPort,
        user: settings.smtpUser,
        pass,
        secure: settings.smtpSecure,
      });

      return {
        provider,
        from: settings.smtpFrom,
        supportEmail: settings.supportEmail,
        emailsEnabled: true,
        dailyLimitEnabled: settings.dailyLimitEnabled,
        dailyLimit: settings.dailyLimit,
        monthlyLimitEnabled: settings.monthlyLimitEnabled,
        monthlyLimit: settings.monthlyLimit,
      };
    } catch (err: any) {
      return {
        provider: null,
        from: settings.smtpFrom,
        supportEmail: settings.supportEmail,
        emailsEnabled: true,
        dailyLimitEnabled: settings.dailyLimitEnabled,
        dailyLimit: settings.dailyLimit,
        monthlyLimitEnabled: settings.monthlyLimitEnabled,
        monthlyLimit: settings.monthlyLimit,
        unconfiguredReason: `DECRYPTION_ERROR: ${err?.message}`,
      };
    }
  }

  // 2. Fallback to process.env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const from = process.env.SMTP_FROM || "Mystic Servers <noreply@mysticservers.com>";
    const supportEmail = process.env.SUPPORT_EMAIL || "support@mysticservers.com";
    const provider = new SmtpEmailProvider({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      secure: process.env.SMTP_SECURE === "true",
    });

    return {
      provider,
      from,
      supportEmail,
      emailsEnabled: true,
      dailyLimitEnabled: false,
      dailyLimit: 80,
      monthlyLimitEnabled: false,
      monthlyLimit: 2500,
    };
  }

  return {
    provider: null,
    from: "Mystic Servers <noreply@mysticservers.com>",
    supportEmail: "support@mysticservers.com",
    emailsEnabled: true,
    dailyLimitEnabled: false,
    dailyLimit: 80,
    monthlyLimitEnabled: false,
    monthlyLimit: 2500,
    unconfiguredReason: "NO_SMTP_CREDENTIALS_CONFIGURED",
  };
}

export async function processEmailQueue() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    // 1. Recover stale SENDING jobs (stuck > 5 minutes)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    await db
      .update(emailQueue)
      .set({ status: "QUEUED", updatedAt: new Date() })
      .where(and(eq(emailQueue.status, "SENDING"), lte(emailQueue.updatedAt, fiveMinsAgo)));

    // 2. Check Provider & Rate Limits
    const config = await getProviderInstance();

    // 3. Find next QUEUED jobs ready for delivery
    const jobs = await db
      .select()
      .from(emailQueue)
      .where(and(eq(emailQueue.status, "QUEUED"), lte(emailQueue.nextRetryAt, new Date())))
      .orderBy(asc(emailQueue.createdAt))
      .limit(10);

    if (jobs.length === 0) {
      isWorkerRunning = false;
      return;
    }

    for (const job of jobs) {
      // Check emergency kill switch
      if (!config.emailsEnabled) {
        await db
          .update(emailQueue)
          .set({ status: "SKIPPED", lastError: "Global email kill switch active", updatedAt: new Date() })
          .where(eq(emailQueue.id, job.id));

        await db.insert(emailLogs).values({
          recipient: job.recipient,
          templateKey: job.templateKey,
          subject: job.subject,
          provider: "none",
          status: "SKIPPED",
          errorMessage: "Global email kill switch active",
          createdAt: new Date(),
        });
        continue;
      }

      // Check if SMTP is unconfigured
      if (!config.provider) {
        await db
          .update(emailQueue)
          .set({ status: "SKIPPED", lastError: config.unconfiguredReason || "SMTP credentials missing", updatedAt: new Date() })
          .where(eq(emailQueue.id, job.id));

        await db.insert(emailLogs).values({
          recipient: job.recipient,
          templateKey: job.templateKey,
          subject: job.subject,
          provider: "none",
          status: "SKIPPED",
          errorMessage: config.unconfiguredReason || "SMTP credentials missing",
          createdAt: new Date(),
        });
        continue;
      }

      // Check daily rate limits ONLY if dailyLimitEnabled is explicitly set to true
      if (config.dailyLimitEnabled) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [dailySentCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(emailQueue)
          .where(and(eq(emailQueue.status, "SENT"), gte(emailQueue.sentAt, startOfDay)));

        if ((dailySentCount?.count || 0) >= config.dailyLimit) {
          await db
            .update(emailQueue)
            .set({ status: "RATE_LIMITED", lastError: `Daily rate limit of ${config.dailyLimit} reached`, updatedAt: new Date() })
            .where(eq(emailQueue.id, job.id));

          await db.insert(emailLogs).values({
            recipient: job.recipient,
            templateKey: job.templateKey,
            subject: job.subject,
            provider: config.provider.name,
            status: "RATE_LIMITED",
            errorMessage: `Daily rate limit of ${config.dailyLimit} reached`,
            createdAt: new Date(),
          });
          continue;
        }
      }

      // Lock job into SENDING state
      await db
        .update(emailQueue)
        .set({ status: "SENDING", updatedAt: new Date() })
        .where(eq(emailQueue.id, job.id));

      try {
        const result = await config.provider.send({
          to: job.recipient,
          from: config.from,
          subject: job.subject,
          html: job.htmlBody,
          text: job.textBody || undefined,
        });

        // Mark as SENT only after provider confirms acceptance
        await db
          .update(emailQueue)
          .set({
            status: "SENT",
            providerMessageId: result.messageId,
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(emailQueue.id, job.id));

        await db.insert(emailLogs).values({
          recipient: job.recipient,
          templateKey: job.templateKey,
          subject: job.subject,
          provider: config.provider.name,
          status: "SENT",
          providerMessageId: result.messageId,
          sentAt: new Date(),
          createdAt: new Date(),
        });
      } catch (err: any) {
        const nextRetryCount = job.retryCount + 1;
        const isFinalFailure = nextRetryCount >= job.maxRetries;

        // Exponential backoff (1m, 5m, 15m)
        const backoffMs = Math.pow(5, nextRetryCount) * 60 * 1000;
        const nextRetryAt = new Date(Date.now() + backoffMs);

        await db
          .update(emailQueue)
          .set({
            status: isFinalFailure ? "FAILED" : "QUEUED",
            retryCount: nextRetryCount,
            nextRetryAt,
            lastError: err?.message || "Provider dispatch failed",
            updatedAt: new Date(),
          })
          .where(eq(emailQueue.id, job.id));

        if (isFinalFailure) {
          await db.insert(emailLogs).values({
            recipient: job.recipient,
            templateKey: job.templateKey,
            subject: job.subject,
            provider: config.provider.name,
            status: "FAILED",
            errorMessage: err?.message || "Provider dispatch failed",
            createdAt: new Date(),
          });
        }
      }
    }
  } finally {
    isWorkerRunning = false;
  }
}
