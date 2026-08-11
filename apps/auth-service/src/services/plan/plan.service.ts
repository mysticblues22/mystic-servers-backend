import { planRepository } from "@mystic/database";

import { HttpError } from "../../errors/http-error.js";

export async function getPublicPlansService() {
  const plans = await planRepository.findAllActive();
  return { plans };
}

export async function getPlanByIdService(id: string) {
  const plan = await planRepository.findById(id);

  if (!plan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  return { plan };
}

export async function getPlanBySlugService(slug: string) {
  const plan = await planRepository.findBySlug(slug);

  if (!plan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  return { plan };
}
