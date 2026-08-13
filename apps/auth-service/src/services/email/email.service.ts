import { renderTemplate } from "./template-renderer.js";
import { enqueueEmailJob, getProviderInstance } from "./email-queue.js";

export interface SendEmailPayload {
  to: string;
  templateKey: string;
  variables: Record<string, string | number>;
}

export const emailService = {
  /**
   * Centralized method to dispatch formatted template email via durable queue
   */
  async dispatchTemplateEmail(payload: SendEmailPayload): Promise<{ jobId: string; status: string }> {
    const config = await getProviderInstance();
    const varsWithDefaults = {
      support_email: config.supportEmail,
      frontend_url: process.env.FRONTEND_URL || "https://mysticservers.com",
      ...payload.variables,
    };

    const rendered = await renderTemplate(payload.templateKey, varsWithDefaults);

    const jobId = await enqueueEmailJob({
      recipient: payload.to,
      templateKey: payload.templateKey,
      subject: rendered.subject,
      htmlBody: rendered.htmlBody,
      textBody: rendered.textBody,
    });

    return { jobId, status: "QUEUED" };
  },

  async sendVerificationEmail(to: string, token: string, username: string = "User") {
    const link = `${process.env.FRONTEND_URL || "https://mysticservers.com"}/verify-email?token=${token}`;
    return this.dispatchTemplateEmail({
      to,
      templateKey: "verification",
      variables: {
        username,
        verification_url: link,
      },
    });
  },

  async sendPasswordResetEmail(to: string, token: string, username: string = "User") {
    const link = `${process.env.FRONTEND_URL || "https://mysticservers.com"}/reset-password?token=${token}`;
    return this.dispatchTemplateEmail({
      to,
      templateKey: "password_reset",
      variables: {
        username,
        reset_url: link,
      },
    });
  },

  async send2FAEmailOtp(to: string, otpCode: string) {
    return this.dispatchTemplateEmail({
      to,
      templateKey: "2fa_otp",
      variables: {
        otp: otpCode,
        otp_expiry: 10,
      },
    });
  },

  async sendContactNotification(contact: { name: string; email: string; subject: string; message: string; ticketId: string }) {
    const config = await getProviderInstance();
    return this.dispatchTemplateEmail({
      to: config.supportEmail,
      templateKey: "contact_ticket",
      variables: {
        ticket_id: contact.ticketId,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
      },
    });
  },

  async sendPaymentConfirmationEmail(to: string, orderNumber: string, amount: string, currency: string = "USD", username: string = "Customer") {
    return this.dispatchTemplateEmail({
      to,
      templateKey: "payment_confirmation",
      variables: {
        username,
        order_number: orderNumber,
        amount,
        currency,
      },
    });
  },

  async sendInvoiceNotificationEmail(to: string, invoiceNumber: string, amount: string, currency: string = "USD", username: string = "Customer") {
    return this.dispatchTemplateEmail({
      to,
      templateKey: "invoice",
      variables: {
        username,
        invoice_number: invoiceNumber,
        amount,
        currency,
      },
    });
  },
};
