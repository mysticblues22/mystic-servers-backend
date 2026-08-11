import { asc, eq } from "drizzle-orm";

import { db } from "../drizzle.js";
import { plans } from "../schema/plans.js";

export class PlanRepository {
  async findAllActive() {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.status, "active"))
      .orderBy(asc(plans.monthlyPriceCents));
  }

  async findById(id: string) {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, id));

    return plan ?? null;
  }

  async findBySlug(slug: string) {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, slug));

    return plan ?? null;
  }
}

export const planRepository = new PlanRepository();
