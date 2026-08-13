import { and, asc, eq } from "drizzle-orm";

import { db } from "../drizzle.js";
import { plans } from "../schema/plans.js";
import { products } from "../schema/products.js";

export class PlanRepository {
  async findAllActive(productSlug?: string) {
    if (productSlug) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.slug, productSlug));

      if (product) {
        return await db
          .select()
          .from(plans)
          .where(and(eq(plans.status, "active"), eq(plans.productId, product.id)))
          .orderBy(asc(plans.sortOrder), asc(plans.monthlyPriceCents));
      }
    }

    return await db
      .select()
      .from(plans)
      .where(eq(plans.status, "active"))
      .orderBy(asc(plans.sortOrder), asc(plans.monthlyPriceCents));
  }

  async findByProductId(productId: string) {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.productId, productId))
      .orderBy(asc(plans.sortOrder), asc(plans.monthlyPriceCents));
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
