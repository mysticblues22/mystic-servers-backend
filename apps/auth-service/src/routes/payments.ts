import type { FastifyInstance } from "fastify";

import {
  initiatePaymentController,
  verifyPaymentController,
} from "../controllers/payment.controller.js";
import { razorpayWebhookController } from "../controllers/webhook.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export async function registerPaymentRoutes(app: FastifyInstance) {
  app.post(
    "/orders/:id/payment",
    {
      preHandler: [authMiddleware],
    },
    initiatePaymentController,
  );

  app.post(
    "/orders/:id/payment/verify",
    {
      preHandler: [authMiddleware],
    },
    verifyPaymentController,
  );

  app.post("/payments/webhook/razorpay", razorpayWebhookController);
}
