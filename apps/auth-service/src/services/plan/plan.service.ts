import { planRepository } from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";
import { resolvePlanPrice } from "../currency/currency.service.js";

export async function getPublicPlansService(
  currency: string = "USD",
  region: string = "INTL",
  productSlug?: string,
) {
  const rawPlans = await planRepository.findAllActive(productSlug);

  const plans = rawPlans.map((plan) => {
    const monthlyPrice = resolvePlanPrice(plan, "monthly", currency, region);
    const annualPrice = resolvePlanPrice(plan, "annual", currency, region);

    return {
      ...plan,
      displayPricing: {
        monthly: monthlyPrice,
        annual: annualPrice,
      },
    };
  });

  return { plans };
}

export async function getPlanByIdService(
  id: string,
  currency: string = "USD",
  region: string = "INTL",
) {
  const plan = await planRepository.findById(id);

  if (!plan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  const monthlyPrice = resolvePlanPrice(plan, "monthly", currency, region);
  const annualPrice = resolvePlanPrice(plan, "annual", currency, region);

  return {
    plan: {
      ...plan,
      displayPricing: {
        monthly: monthlyPrice,
        annual: annualPrice,
      },
    },
  };
}

export async function getPlanBySlugService(
  slug: string,
  currency: string = "USD",
  region: string = "INTL",
) {
  const plan = await planRepository.findBySlug(slug);

  if (!plan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  const monthlyPrice = resolvePlanPrice(plan, "monthly", currency, region);
  const annualPrice = resolvePlanPrice(plan, "annual", currency, region);

  return {
    plan: {
      ...plan,
      displayPricing: {
        monthly: monthlyPrice,
        annual: annualPrice,
      },
    },
  };
}
