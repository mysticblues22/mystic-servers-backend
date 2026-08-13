export interface SendEmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  name: string;
  send(payload: SendEmailPayload): Promise<{ sent: boolean; messageId: string }>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}
