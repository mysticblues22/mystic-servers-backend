import { db, emailTemplates, eq } from "@mystic/database";

export interface DefaultTemplate {
  key: string;
  name: string;
  subject: string;
  variables: string[];
  htmlBody: string;
  textBody: string;
}

export const DEFAULT_TEMPLATES: Record<string, DefaultTemplate> = {
  verification: {
    key: "verification",
    name: "Email Verification",
    subject: "Verify Your Mystic Servers Account",
    variables: ["username", "verification_url", "support_email"],
    htmlBody: `
<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">MYSTIC SERVERS</h2>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 4px;">Enterprise NVMe Cloud Infrastructure</p>
  </div>
  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
  <p style="font-size: 16px;">Hello <strong>{{username}}</strong>,</p>
  <p style="color: #d1d5db; line-height: 1.6;">Thank you for creating an account with Mystic Servers. Please verify your email address to complete your registration and activate high-performance cloud deployment capabilities.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{verification_url}}" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Verify Email Address</a>
  </div>
  <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">If the button above does not work, copy and paste this link into your browser:<br/><a href="{{verification_url}}" style="color: #6366f1;">{{verification_url}}</a></p>
  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 24px 0;" />
  <p style="font-size: 11px; color: #6b7280; text-align: center;">Mystic Servers Inc. • Need help? Contact <a href="mailto:{{support_email}}" style="color: #9ca3af;">{{support_email}}</a></p>
</div>
    `.trim(),
    textBody: "Hello {{username}},\n\nPlease verify your Mystic Servers account by opening the following link:\n{{verification_url}}\n\nNeed help? Contact {{support_email}}",
  },
  password_reset: {
    key: "password_reset",
    name: "Password Reset Request",
    subject: "Password Reset Request — Mystic Servers",
    variables: ["username", "reset_url", "support_email"],
    htmlBody: `
<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">MYSTIC SERVERS</h2>
  </div>
  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
  <p style="font-size: 16px;">Hello <strong>{{username}}</strong>,</p>
  <p style="color: #d1d5db; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to specify a new password:</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{reset_url}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Reset Password</a>
  </div>
  <p style="font-size: 12px; color: #6b7280;">If you did not request this reset, you can safely ignore this email.</p>
</div>
    `.trim(),
    textBody: "Hello {{username}},\n\nReset your password here:\n{{reset_url}}\n\nIf you did not request this, ignore this email.",
  },
  "2fa_otp": {
    key: "2fa_otp",
    name: "2FA Security OTP Code",
    subject: "Your Mystic Security OTP Code",
    variables: ["otp", "otp_expiry", "support_email"],
    htmlBody: `
<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;">
  <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800; text-align: center;">SECURITY VERIFICATION</h2>
  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
  <p style="color: #d1d5db;">Your One-Time Security Authentication Code is:</p>
  <div style="text-align: center; margin: 24px 0; background-color: #111827; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981; border: 1px solid #374151;">
    {{otp}}
  </div>
  <p style="font-size: 12px; color: #9ca3af; text-align: center;">This code will expire in {{otp_expiry}} minutes. Do not share this code with anyone.</p>
</div>
    `.trim(),
    textBody: "Your Mystic Servers 2FA OTP code is: {{otp}}. Valid for {{otp_expiry}} minutes.",
  },
  contact_ticket: {
    key: "contact_ticket",
    name: "Contact Ticket Notification",
    subject: "[Contact Ticket {{ticket_id}}] {{subject}}",
    variables: ["ticket_id", "name", "email", "subject", "message"],
    htmlBody: `
<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;">
  <h3 style="color: #6366f1;">New Customer Contact Inquiry</h3>
  <p><strong>Ticket ID:</strong> {{ticket_id}}</p>
  <p><strong>Name:</strong> {{name}}</p>
  <p><strong>Email:</strong> {{email}}</p>
  <p><strong>Subject:</strong> {{subject}}</p>
  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
  <p><strong>Message:</strong></p>
  <div style="background: #111827; padding: 16px; border-radius: 6px; color: #d1d5db;">{{message}}</div>
</div>
    `.trim(),
    textBody: "New Ticket {{ticket_id}} from {{name}} ({{email}}):\nSubject: {{subject}}\nMessage: {{message}}",
  },
  payment_confirmation: {
    key: "payment_confirmation",
    name: "Payment Confirmation",
    subject: "Payment Confirmed — Order {{order_number}}",
    variables: ["username", "order_number", "amount", "currency"],
    htmlBody: `
<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;">
  <h2 style="color: #10b981; margin: 0; font-size: 24px;">PAYMENT CONFIRMED</h2>
  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
  <p>Hello <strong>{{username}}</strong>,</p>
  <p>Your payment of <strong>{{amount}} {{currency}}</strong> for Order <strong>{{order_number}}</strong> has been successfully processed.</p>
</div>
    `.trim(),
    textBody: "Hello {{username}},\nPayment of {{amount}} {{currency}} for Order {{order_number}} confirmed.",
  },
  invoice: {
    key: "invoice",
    name: "Official Invoice Issued",
    subject: "Official Tax Invoice {{invoice_number}} Issued",
    variables: ["username", "invoice_number", "amount", "currency"],
    htmlBody: `
<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;">
  <h2 style="color: #6366f1;">INVOICE ISSUED</h2>
  <p>Official Tax Invoice <strong>{{invoice_number}}</strong> for total <strong>{{amount}} {{currency}}</strong> has been generated.</p>
</div>
    `.trim(),
    textBody: "Official Invoice {{invoice_number}} for {{amount}} {{currency}} has been issued.",
  },
  welcome: {
    key: "welcome",
    name: "Welcome to Mystic Servers",
    subject: "Welcome to Enterprise NVMe Cloud Infrastructure",
    variables: ["username", "frontend_url"],
    htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Welcome {{username}} to Mystic Servers!</div>`,
    textBody: "Welcome {{username}} to Mystic Servers!",
  },
  vps_provisioned: {
    key: "vps_provisioned",
    name: "VPS Server Provisioned",
    subject: "Your VPS Server {{server_name}} is Ready",
    variables: ["username", "server_name", "plan_name"],
    htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Server {{server_name}} ({{plan_name}}) is provisioned!</div>`,
    textBody: "Server {{server_name}} ({{plan_name}}) is provisioned!",
  },
  vps_suspended: {
    key: "vps_suspended",
    name: "VPS Server Suspended",
    subject: "Service Notice — Server {{server_name}} Suspended",
    variables: ["username", "server_name", "support_email"],
    htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Server {{server_name}} has been suspended.</div>`,
    textBody: "Server {{server_name}} has been suspended.",
  },
  vps_renewal: {
    key: "vps_renewal",
    name: "VPS Renewal Reminder",
    subject: "Renewal Notice for Server {{server_name}}",
    variables: ["username", "server_name", "amount", "currency"],
    htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Server {{server_name}} renewal due: {{amount}} {{currency}}.</div>`,
    textBody: "Server {{server_name}} renewal due: {{amount}} {{currency}}.",
  },
  security_alert: {
    key: "security_alert",
    name: "Security Alert Notice",
    subject: "Security Alert — Account Activity Notice",
    variables: ["username", "support_email"],
    htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Security alert for account {{username}}.</div>`,
    textBody: "Security alert for account {{username}}.",
  },
};

export async function renderTemplate(
  templateKey: string,
  variables: Record<string, string | number>,
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  // 1. Fetch template from database or fallback to default
  const [dbTemplate] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.key, templateKey))
    .limit(1);

  const def = DEFAULT_TEMPLATES[templateKey] || {
    key: templateKey,
    name: templateKey,
    subject: `Mystic Notification — ${templateKey}`,
    variables: Object.keys(variables),
    htmlBody: `<p>${JSON.stringify(variables)}</p>`,
    textBody: JSON.stringify(variables),
  };

  const rawSubject = dbTemplate ? dbTemplate.subject : def.subject;
  const rawHtml = dbTemplate ? dbTemplate.htmlBody : def.htmlBody;
  const rawText = dbTemplate ? dbTemplate.textBody || "" : def.textBody;

  // Safe regex interpolation: replace {{varName}} without eval or Function
  const interpolate = (str: string) => {
    return str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, varName) => {
      if (varName in variables) {
        return String(variables[varName]);
      }
      return `{{${varName}}}`;
    });
  };

  return {
    subject: interpolate(rawSubject),
    htmlBody: interpolate(rawHtml),
    textBody: interpolate(rawText),
  };
}
