import { z } from "zod";

export const getInvoiceByIdSchema = z.object({
  id: z.string().uuid("Invalid invoice ID format"),
});

export type GetInvoiceByIdInput = z.infer<typeof getInvoiceByIdSchema>;
