import { bootstrap } from "@mystic/bootstrap";

bootstrap({
  envFile: process.env.ENV_FILE ?? "/srv/git/infrastructure/env/backend.env",
});

const { pool } = await import("./client.js");
const { db } = await import("./drizzle.js");
const { plans } = await import("./schema/plans.js");
const { products } = await import("./schema/products.js");

export const catalogProducts = [
  {
    slug: "vps",
    name: "Cloud VPS",
    category: "vps",
    shortDescription: "High-performance enterprise NVMe Cloud Virtual Private Servers.",
    fullDescription: "Dedicated virtual compute resources backed by latest Gen4 NVMe arrays, DDR5 memory, and high-speed network interfaces.",
    features: "NVMe Storage, Root Access, Instant Provisioning, Automated Backups, DDoS Protection",
    icon: "Server",
    status: "active" as const,
    sortOrder: 1,
  },
  {
    slug: "cloud",
    name: "Cloud Hosting",
    category: "cloud",
    shortDescription: "Scalable multi-tenant cloud compute nodes for elastic workloads.",
    fullDescription: "Auto-scaling cloud infrastructure built for high availability applications and distributed microservice clusters.",
    features: "Auto-Scaling, High Availability, Load Balancing, Managed Kubernetes Support",
    icon: "Cloud",
    status: "disabled" as const,
    sortOrder: 2,
  },
  {
    slug: "dedicated",
    name: "Dedicated Servers",
    category: "dedicated",
    shortDescription: "Bare-metal dedicated hardware for maximum performance and isolation.",
    fullDescription: "Single-tenant bare metal servers with unthrottled CPU cores, enterprise ECC RAM, and dedicated network ports.",
    features: "Bare-Metal Hardware, 10Gbps Uplink, IPMI/KVM Access, Unmetered Bandwidth Options",
    icon: "Cpu",
    status: "disabled" as const,
    sortOrder: 3,
  },
  {
    slug: "game",
    name: "Game Hosting",
    category: "game",
    shortDescription: "Low-latency game server hosting powered by high clock-speed processors.",
    fullDescription: "Optimized server instances for Minecraft, Rust, ARK, and custom multiplayer game servers with low ping routes.",
    features: "High Single-Core Frequency, Custom Mod Managers, Low-Latency Anycast Routing, DDoS Mitigation",
    icon: "Gamepad",
    status: "disabled" as const,
    sortOrder: 4,
  },
  {
    slug: "web",
    name: "Web Hosting",
    category: "web",
    shortDescription: "Managed web hosting with cPanel/Plesk and automated SSL certificates.",
    fullDescription: "Turnkey website hosting environment with 1-click installer scripts, free SSL, and managed email mailboxes.",
    features: "1-Click App Installer, Free SSL Certificates, Daily Offsite Backups, NVMe Powered",
    icon: "Globe",
    status: "disabled" as const,
    sortOrder: 5,
  },
];

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
    monthlyPriceInrCents: 39900,
    annualPriceInrCents: 382800,
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
    monthlyPriceInrCents: 79900,
    annualPriceInrCents: 766800,
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
    monthlyPriceInrCents: 159900,
    annualPriceInrCents: 1534800,
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
    monthlyPriceInrCents: 359900,
    annualPriceInrCents: 3454800,
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
    monthlyPriceInrCents: 719900,
    annualPriceInrCents: 6874800,
    currency: "USD",
    status: "active" as const,
  },
];

async function seed() {
  console.log("🌱 Starting idempotent production product and plan catalog seed...");

  try {
    const productMap: Record<string, string> = {};

    for (const prodData of catalogProducts) {
      const [inserted] = await db
        .insert(products)
        .values({
          ...prodData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            name: prodData.name,
            category: prodData.category,
            shortDescription: prodData.shortDescription,
            fullDescription: prodData.fullDescription,
            features: prodData.features,
            icon: prodData.icon,
            status: prodData.status,
            sortOrder: prodData.sortOrder,
            updatedAt: new Date(),
          },
        })
        .returning({ id: products.id, slug: products.slug });

      if (inserted) {
        productMap[inserted.slug] = inserted.id;
      }
      console.log(`  ✓ Product '${prodData.slug}' (${prodData.name} - ${prodData.status}) processed.`);
    }

    const vpsProductId = productMap["vps"];

    for (const planData of catalogPlans) {
      await db
        .insert(plans)
        .values({
          ...planData,
          productId: vpsProductId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: plans.slug,
          set: {
            name: planData.name,
            productId: vpsProductId,
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

    // Admin promotion for designated administrative account
    const { users } = await import("./schema/users.js");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ role: "admin" }).where(eq(users.email, "rdhanush07@gmail.com"));
    console.log("  ✓ Admin role verified/promoted for rdhanush07@gmail.com");

    console.log("✅ Production plan catalog seed completed successfully!");
  } catch (err) {
    console.error("❌ Plan seed failed with error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
