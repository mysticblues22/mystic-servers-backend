import { IEmailProvider, SendEmailPayload } from "./email-provider.interface.js";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}

export class SmtpEmailProvider implements IEmailProvider {
  name = "smtp";
  private config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.config = config;
  }

  private async getTransporter() {
    const nodemailerModule: any = await (async () => {
      try {
        return await import("nodemailer" as any);
      } catch {
        return null;
      }
    })();

    if (!nodemailerModule) {
      throw new Error("Nodemailer package is not installed");
    }

    return nodemailerModule.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
      connectionTimeout: 10000,
    });
  }

  async send(payload: SendEmailPayload): Promise<{ sent: boolean; messageId: string }> {
    const transporter = await this.getTransporter();
    const info = await transporter.sendMail({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return {
      sent: true,
      messageId: info.messageId || `MSG-${Date.now()}`,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return {
        success: true,
        message: `Successfully authenticated and connected to SMTP server ${this.config.host}:${this.config.port}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `SMTP Connection Failed: ${err?.message || "Unknown error"}`,
      };
    }
  }
}
