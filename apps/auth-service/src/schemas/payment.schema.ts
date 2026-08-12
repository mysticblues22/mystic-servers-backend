import { z } from "zod";

export const initiatePaymentSchema = z.object({
  currency: z
    .enum(["USD", "INR"], {
      message: "Payment currency must be either 'USD' or 'INR'",
    })
    .default("USD"),
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid("Invalid order ID format"),
});

export const verifyPaymentSchema = z.object({
  razorpayPaymentId: z.string().min(1, "Razorpay payment ID is required"),
  razorpayOrderId: z.string().min(1, "Razorpay order ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay signature is required"),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type PaymentIdParamInput = z.infer<typeof paymentIdParamSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
