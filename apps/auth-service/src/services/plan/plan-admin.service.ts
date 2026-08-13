import {
  db,
  plans,
  regionalPrices,
  auditLogs,
  products,
  eq,
  and,
  asc,
} from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";

const SUPPORTED_REGIONS = ["IN", "US", "EU", "UK", "JP"];
const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY"];

export async function listAdminPlansService(filterProductIdOrSlug?: string) {
  if (filterProductIdOrSlug) {
    // Check if UUID or product slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filterProductIdOrSlug);
    let targetProductId = filterProductIdOrSlug;
    if (!isUuid) {
      const [prod] = await db.select().from(products).where(eq(products.slug, filterProductIdOrSlug)).limit(1);
      if (prod) targetProductId = prod.id;
    }

    const filteredPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.productId, targetProductId))
      .orderBy(asc(plans.sortOrder));

    return { plans: filteredPlans };
  }

  const allPlans = await db
    .select()
    .from(plans)
    .orderBy(asc(plans.sortOrder));

  return { plans: allPlans };
}

export async function getPlanByIdService(planId: string) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!plan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  // Fetch regional prices
  const prices = await db
    .select()
    .from(regionalPrices)
    .where(eq(regionalPrices.planId, planId));

  return { plan, regionalPrices: prices };
}

export async function createAdminPlanService(
  adminUserId: string,
  input: {
    productId?: string;
    slug: string;
    name: string;
    description?: string;
    cpuCores: number;
    ramMb: number;
    diskGb: number;
    bandwidthTb: number;
    monthlyPriceCents: number;
    annualPriceCents: number;
    monthlyPriceInrCents?: number;
    annualPriceInrCents?: number;
    currency?: string;
    status?: "active" | "deprecated" | "archived";
    sortOrder?: number;
    ipv4Included?: number;
    ipv6Available?: boolean;
    ctaLabel?: string;
    ctaDestination?: string;
  },
) {
  if (input.monthlyPriceCents < 0 || input.annualPriceCents < 0) {
    throw new HttpError(400, "INVALID_PRICE", "Prices cannot be negative");
  }

  const [existing] = await db
    .select()
    .from(plans)
    .where(eq(plans.slug, input.slug))
    .limit(1);

  if (existing) {
    throw new HttpError(400, "DUPLICATE_PLAN_SLUG", `Plan slug '${input.slug}' already exists`);
  }

  const [newPlan] = await db
    .insert(plans)
    .values({
      productId: input.productId || null,
      slug: input.slug.toLowerCase().trim(),
      name: input.name.trim(),
      description: input.description || null,
      cpuCores: input.cpuCores,
      ramMb: input.ramMb,
      diskGb: input.diskGb,
      bandwidthTb: input.bandwidthTb,
      monthlyPriceCents: input.monthlyPriceCents,
      annualPriceCents: input.annualPriceCents,
      monthlyPriceInrCents: input.monthlyPriceInrCents || null,
      annualPriceInrCents: input.annualPriceInrCents || null,
      currency: (input.currency || "USD").toUpperCase(),
      status: input.status || "active",
      sortOrder: input.sortOrder || 0,
      ipv4Included: input.ipv4Included ?? 1,
      ipv6Available: input.ipv6Available ?? true,
      ctaLabel: input.ctaLabel || "Deploy VPS",
      ctaDestination: input.ctaDestination || "/contact",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Audit log entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "PLAN_CREATED",
    entityType: "plan",
    entityId: newPlan.id,
    details: JSON.stringify({ slug: newPlan.slug, name: newPlan.name }),
    createdAt: new Date(),
  });

  return { plan: newPlan };
}

export async function updateAdminPlanService(
  planId: string,
  adminUserId: string,
  input: {
    productId?: string;
    name?: string;
    description?: string;
    cpuCores?: number;
    ramMb?: number;
    diskGb?: number;
    bandwidthTb?: number;
    monthlyPriceCents?: number;
    annualPriceCents?: number;
    monthlyPriceInrCents?: number;
    annualPriceInrCents?: number;
    status?: "active" | "deprecated" | "archived";
    sortOrder?: number;
    ipv4Included?: number;
    ipv6Available?: boolean;
    ctaLabel?: string;
    ctaDestination?: string;
  },
) {
  const [existing] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!existing) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  if (
    (input.monthlyPriceCents !== undefined && input.monthlyPriceCents < 0) ||
    (input.annualPriceCents !== undefined && input.annualPriceCents < 0)
  ) {
    throw new HttpError(400, "INVALID_PRICE", "Prices cannot be negative");
  }

  const [updatedPlan] = await db
    .update(plans)
    .set({
      ...(input.productId !== undefined ? { productId: input.productId } : {}),
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.cpuCores !== undefined ? { cpuCores: input.cpuCores } : {}),
      ...(input.ramMb !== undefined ? { ramMb: input.ramMb } : {}),
      ...(input.diskGb !== undefined ? { diskGb: input.diskGb } : {}),
      ...(input.bandwidthTb !== undefined ? { bandwidthTb: input.bandwidthTb } : {}),
      ...(input.monthlyPriceCents !== undefined ? { monthlyPriceCents: input.monthlyPriceCents } : {}),
      ...(input.annualPriceCents !== undefined ? { annualPriceCents: input.annualPriceCents } : {}),
      ...(input.monthlyPriceInrCents !== undefined ? { monthlyPriceInrCents: input.monthlyPriceInrCents } : {}),
      ...(input.annualPriceInrCents !== undefined ? { annualPriceInrCents: input.annualPriceInrCents } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.ipv4Included !== undefined ? { ipv4Included: input.ipv4Included } : {}),
      ...(input.ipv6Available !== undefined ? { ipv6Available: input.ipv6Available } : {}),
      ...(input.ctaLabel !== undefined ? { ctaLabel: input.ctaLabel } : {}),
      ...(input.ctaDestination !== undefined ? { ctaDestination: input.ctaDestination } : {}),
      updatedAt: new Date(),
    })
    .where(eq(plans.id, planId))
    .returning();

  // Audit Log Entry
  await db.insert(auditLogs).values({
    adminUserId,
    action: "PLAN_UPDATED",
    entityType: "plan",
    entityId: planId,
    details: JSON.stringify({ old: existing, updated: updatedPlan }),
    createdAt: new Date(),
  });

  return { plan: updatedPlan };
}

export async function updatePlanRegionalPricesService(
  planId: string,
  adminUserId: string,
  matrix: Array<{
    regionCode: string;
    currency: string;
    monthlyPriceCents: number;
    annualPriceCents: number;
  }>,
) {
  const [existingPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!existingPlan) {
    throw new HttpError(404, "PLAN_NOT_FOUND", "Plan not found");
  }

  // Validate matrix entries
  const seenCombos = new Set<string>();

  for (const entry of matrix) {
    const region = entry.regionCode.toUpperCase();
    const currency = entry.currency.toUpperCase();

    if (!SUPPORTED_REGIONS.includes(region)) {
      throw new HttpError(400, "UNSUPPORTED_REGION", `Region '${region}' is not supported. Supported regions: ${SUPPORTED_REGIONS.join(", ")}`);
    }

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      throw new HttpError(400, "UNSUPPORTED_CURRENCY", `Currency '${currency}' is not supported. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`);
    }

    if (entry.monthlyPriceCents < 0 || entry.annualPriceCents < 0) {
      throw new HttpError(400, "INVALID_PRICE", `Price for region ${region} (${currency}) cannot be negative`);
    }

    const comboKey = `${region}-${currency}`;
    if (seenCombos.has(comboKey)) {
      throw new HttpError(400, "DUPLICATE_REGIONAL_PRICE", `Duplicate pricing entry for region ${region} and currency ${currency}`);
    }
    seenCombos.add(comboKey);
  }

  // Record audit log entry before mutation
  await db.insert(auditLogs).values({
    adminUserId,
    action: "PRICING_UPDATED",
    entityType: "pricing",
    entityId: planId,
    details: JSON.stringify({ planId, matrix }),
    createdAt: new Date(),
  });

  // Upsert regional prices
  for (const entry of matrix) {
    const regionCode = entry.regionCode.toUpperCase();
    const currency = entry.currency.toUpperCase();

    const [existingPrice] = await db
      .select()
      .from(regionalPrices)
      .where(eq(regionalPrices.planId, planId))
      .limit(1);

    if (existingPrice) {
      await db
        .update(regionalPrices)
        .set({
          monthlyPriceCents: entry.monthlyPriceCents,
          annualPriceCents: entry.annualPriceCents,
          updatedAt: new Date(),
        })
        .where(eq(regionalPrices.id, existingPrice.id));
    } else {
      await db.insert(regionalPrices).values({
        planId,
        regionCode,
        currency,
        monthlyPriceCents: entry.monthlyPriceCents,
        annualPriceCents: entry.annualPriceCents,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update canonical INR columns on plan table if region is IN
    if (regionCode === "IN") {
      await db
        .update(plans)
        .set({
          monthlyPriceInrCents: entry.monthlyPriceCents,
          annualPriceInrCents: entry.annualPriceCents,
          updatedAt: new Date(),
        })
        .where(eq(plans.id, planId));
    }
  }

  return { success: true, message: "Regional pricing matrix updated successfully" };
}
