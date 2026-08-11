import { z } from "zod";

export const createOrderSchema = z.object({
  planId: z.string().uuid("Invalid plan ID format"),
  billingCycle: z.enum(["monthly", "annual"], {
    message: "Billing cycle must be either 'monthly' or 'annual'",
  }),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10")
    .default(1),
});

export const idempotencyHeaderSchema = z
  .string()
  .trim()
  .min(1, "Idempotency-Key cannot be empty")
  .max(255, "Idempotency-Key cannot exceed 255 characters")
  .optional();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
