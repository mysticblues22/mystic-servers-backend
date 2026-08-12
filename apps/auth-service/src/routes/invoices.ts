import type { FastifyInstance } from "fastify";
import {
  getInvoiceByIdController,
  listInvoicesController,
} from "../controllers/invoice.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export async function registerInvoiceRoutes(app: FastifyInstance) {
  app.get(
    "/invoices",
    { preHandler: [authMiddleware] },
    listInvoicesController,
  );

  app.get(
    "/invoices/:id",
    { preHandler: [authMiddleware] },
    getInvoiceByIdController,
  );
}
