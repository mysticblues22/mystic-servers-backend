import crypto from "node:crypto";
import Razorpay from "razorpay";
import { loadConfig } from "@mystic/config";
import {
  CheckoutSessionResult,
  CreateCheckoutSessionInput,
  IPaymentProvider,
} from "./payment-provider.interface.js";

export class RazorpayPaymentProvider implements IPaymentProvider {
  public readonly providerName = "razorpay";
  private razorpayClient: Razorpay | null = null;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor(keyId?: string, keySecret?: string, webhookSecret?: string) {
    const config = loadConfig();
    this.keyId = keyId || config.razorpay.keyId;
    this.keySecret = keySecret || config.razorpay.keySecret;
    this.webhookSecret = webhookSecret || config.razorpay.webhookSecret;
  }

  private getClient(): Razorpay {
    if (!this.razorpayClient) {
      this.razorpayClient = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
    return this.razorpayClient;
  }

  public verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature?: string | null,
    secretOverride?: string,
  ): boolean {
    if (!signature || !razorpayOrderId || !razorpayPaymentId) {
      return false;
    }

    const secret = secretOverride || this.keySecret;
    if (!secret) {
      return false;
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8"),
      );
    } catch {
      return false;
    }
  }

  public verifyWebhookSignature(
    rawBody: string | Buffer,
    signature?: string | null,
    secretOverride?: string,
  ): boolean {
    if (!signature || !rawBody) {
      return false;
    }

    const secret = secretOverride || this.webhookSecret;
    if (!secret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8"),
      );
    } catch {
      return false;
    }
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const client = this.getClient();

    const receipt =
      input.orderNumber.length <= 40
        ? input.orderNumber
        : input.orderId.replace(/-/g, "").substring(0, 40);

    const options = {
      amount: input.amountCents,
      currency: input.currency,
      receipt,
      notes: {
        paymentId: input.paymentId,
        orderId: input.orderId,
        userId: input.userId,
        ...input.notes,
      },
    };

    const razorpayOrder = await client.orders.create(options);

    return {
      provider: this.providerName,
      providerCheckoutId: razorpayOrder.id,
      keyId: this.keyId,
      amount: Number(razorpayOrder.amount),
      currency: razorpayOrder.currency,
      rawResponse: razorpayOrder as any,
    };
  }
}

export const razorpayPaymentProvider = new RazorpayPaymentProvider();
