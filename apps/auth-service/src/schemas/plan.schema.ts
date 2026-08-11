import { z } from "zod";

export const getPlanByIdSchema = z.object({
  id: z.string().uuid("Invalid plan ID format"),
});

export const getPlanBySlugSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens"),
});

export type GetPlanByIdInput = z.infer<typeof getPlanByIdSchema>;
export type GetPlanBySlugInput = z.infer<typeof getPlanBySlugSchema>;
