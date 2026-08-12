import { bootstrap } from "@mystic/bootstrap";

bootstrap({
  envFile: process.env.ENV_FILE ?? "/srv/git/infrastructure/env/backend.env",
});

const { pool } = await import("./client.js");
const { db } = await import("./drizzle.js");
const { plans } = await import("./schema/plans.js");

export const catalogPlans = [
  {
    slug: "starter",
    name: "Starter",
    description: "Ideal for lightweight development, staging microservices, and bot hosting.",
    cpuCores: 1,
    ramMb: 2048,
    diskGb: 40,
    bandwidthTb: 2,
    monthlyPriceCents: 499,
    annualPriceCents: 4788,
    monthlyPriceInrCents: null,
    annualPriceInrCents: null,
    currency: "USD",
    status: "active" as const,
  },
  {
    slug: "basic",
    name: "Basic",
    description: "Essential virtual compute instance for small production websites and APIs.",
    cpuCores: 2,
    ramMb: 4096,
    diskGb: 80,
    bandwidthTb: 4,
    monthlyPriceCents: 999,
    annualPriceCents: 9588,
    monthlyPriceInrCents: null,
    annualPriceInrCents: null,
    currency: "USD",
    status: "active" as const,
  },
  {
    slug: "standard",
    name: "Standard",
    description: "Designed for production application backends, databases, and microservices.",
    cpuCores: 4,
    ramMb: 16384,
    diskGb: 240,
    bandwidthTb: 8,
    monthlyPriceCents: 1999,
    annualPriceCents: 19188,
    monthlyPriceInrCents: null,
    annualPriceInrCents: null,
    currency: "USD",
    status: "active" as const,
  },
  {
    slug: "advanced",
    name: "Advanced",
    description: "High-density virtual compute for memory-intensive host databases and stacks.",
    cpuCores: 8,
    ramMb: 32768,
    diskGb: 480,
    bandwidthTb: 15,
    monthlyPriceCents: 4499,
    annualPriceCents: 43188,
    monthlyPriceInrCents: null,
    annualPriceInrCents: null,
    currency: "USD",
    status: "active" as const,
  },
  {
    slug: "ultimate",
    name: "Ultimate",
    description: "Maximum virtual compute capacity for high-throughput enterprise workloads.",
    cpuCores: 16,
    ramMb: 65536,
    diskGb: 960,
    bandwidthTb: 20,
    monthlyPriceCents: 8999,
    annualPriceCents: 86388,
    monthlyPriceInrCents: null,
    annualPriceInrCents: null,
    currency: "USD",
    status: "active" as const,
  },
];

async function seed() {
  console.log("🌱 Starting idempotent production plan catalog seed...");

  try {
    for (const planData of catalogPlans) {
      await db
        .insert(plans)
        .values({
          ...planData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: plans.slug,
          set: {
            name: planData.name,
            description: planData.description,
            cpuCores: planData.cpuCores,
            ramMb: planData.ramMb,
            diskGb: planData.diskGb,
            bandwidthTb: planData.bandwidthTb,
            monthlyPriceCents: planData.monthlyPriceCents,
            annualPriceCents: planData.annualPriceCents,
            monthlyPriceInrCents: planData.monthlyPriceInrCents,
            annualPriceInrCents: planData.annualPriceInrCents,
            currency: planData.currency,
            status: planData.status,
            updatedAt: new Date(),
          },
        });

      console.log(`  ✓ Plan '${planData.slug}' (${planData.name}) processed.`);
    }

    console.log("✅ Production plan catalog seed completed successfully!");
  } catch (err) {
    console.error("❌ Plan seed failed with error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
