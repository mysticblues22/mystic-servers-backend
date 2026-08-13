import { z } from "zod";

export const createOrderSchema = z.object({
  planId: z.string().uuid("Invalid plan ID format"),
  billingCycle: z.string().default("monthly"),
  termMonths: z.number().int().min(1).max(36).optional(),
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

export const getOrderByIdSchema = z.object({
  id: z.string().uuid("Invalid order ID format"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
