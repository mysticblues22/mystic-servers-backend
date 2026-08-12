import { invoiceRepository } from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";

export async function getUserInvoicesService(userId: string) {
  const invoices = await invoiceRepository.findByUserId(userId);
  return { invoices };
}

export async function getUserInvoiceByIdService(userId: string, invoiceId: string) {
  const invoice = await invoiceRepository.findByUserIdAndId(userId, invoiceId);
  if (!invoice) {
    throw new HttpError(404, "INVOICE_NOT_FOUND", "Invoice not found");
  }
  return { invoice };
}
