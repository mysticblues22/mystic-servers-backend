import type { FastifyReply, FastifyRequest } from "fastify";
import { exchangeRateService } from "../services/currency/currency.service.js";

export async function listCurrenciesController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const currencies = exchangeRateService.getAllSupportedCurrencies();
  const rates = {
    USD: exchangeRateService.getRate("USD"),
    INR: exchangeRateService.getRate("INR"),
    EUR: exchangeRateService.getRate("EUR"),
    GBP: exchangeRateService.getRate("GBP"),
    CAD: exchangeRateService.getRate("CAD"),
    AUD: exchangeRateService.getRate("AUD"),
    SGD: exchangeRateService.getRate("SGD"),
    AED: exchangeRateService.getRate("AED"),
    SAR: exchangeRateService.getRate("SAR"),
    JPY: exchangeRateService.getRate("JPY"),
  };

  return reply.send({
    baseCurrency: "USD",
    supportedPaymentCurrencies: ["USD", "INR"],
    currencies,
    rates,
  });
}
