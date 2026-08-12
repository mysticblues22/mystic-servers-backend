import type { FastifyInstance } from "fastify";
import { listCurrenciesController } from "../controllers/currency.controller.js";

export async function registerCurrencyRoutes(app: FastifyInstance) {
  app.get("/currencies", listCurrenciesController);
}
