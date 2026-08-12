export interface CreateCheckoutSessionInput {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  amountCents: number;
  currency: "USD" | "INR";
  notes?: Record<string, string>;
}

export interface CheckoutSessionResult {
  provider: string;
  providerCheckoutId: string;
  keyId: string;
  amount: number;
  currency: string;
  rawResponse?: Record<string, any>;
}

export interface IPaymentProvider {
  readonly providerName: string;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
}
