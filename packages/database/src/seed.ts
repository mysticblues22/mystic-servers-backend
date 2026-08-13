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
    const { eq, and } = await import("drizzle-orm");
    await db.update(users).set({ role: "admin" }).where(eq(users.email, "rdhanush07@gmail.com"));
    console.log("  ✓ Admin role verified/promoted for rdhanush07@gmail.com");

    // Email Settings & Templates Bootstrap
    const { emailSettings } = await import("./schema/email-settings.js");
    const { emailTemplates } = await import("./schema/email-templates.js");
    const crypto = await import("node:crypto");

    const [existingSettings] = await db.select().from(emailSettings).limit(1);

    const smtpHost = process.env.SMTP_HOST || "smtp.resend.com";
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || "resend";
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
    const smtpFrom = process.env.SMTP_FROM || "Mystic Servers <noreply@mysticservers.com>";
    const supportEmail = process.env.SUPPORT_EMAIL || "support@mysticservers.com";
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!existingSettings || !existingSettings.encryptedSmtpPass) {
      let encryptedPass: string | null = null;

      if (smtpPass && encryptionKey) {
        const key = crypto.createHash("sha256").update(encryptionKey).digest();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
        let enc = cipher.update(smtpPass, "utf8", "hex");
        enc += cipher.final("hex");
        const tag = cipher.getAuthTag().toString("hex");
        encryptedPass = `${iv.toString("hex")}:${tag}:${enc}`;
      }

      if (existingSettings) {
        await db
          .update(emailSettings)
          .set({
            smtpHost,
            smtpPort,
            smtpUser,
            ...(encryptedPass ? { encryptedSmtpPass: encryptedPass } : {}),
            smtpSecure,
            smtpFrom,
            supportEmail,
            updatedAt: new Date(),
          })
          .where(eq(emailSettings.id, existingSettings.id));
        console.log("  ✓ email_settings updated with production configuration.");
      } else {
        await db.insert(emailSettings).values({
          provider: "smtp",
          smtpHost,
          smtpPort,
          smtpUser,
          encryptedSmtpPass: encryptedPass,
          smtpSecure,
          smtpFrom,
          supportEmail,
          emailsEnabled: true,
          dailyLimit: 0,
          monthlyLimit: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log("  ✓ email_settings initialized with production configuration.");
      }
    } else {
      console.log("  ✓ email_settings already exists with configured credentials; preserving existing configuration.");
    }

    // Default Email Templates Bootstrap
    const defaultTemplates = [
      {
        key: "verification",
        name: "Email Verification",
        subject: "Verify Your Mystic Servers Account",
        variablesJson: JSON.stringify(["username", "verification_url", "support_email"]),
        htmlBody: `<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;"><div style="text-align: center; margin-bottom: 24px;"><h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">MYSTIC SERVERS</h2><p style="color: #9ca3af; font-size: 12px; margin-top: 4px;">Enterprise NVMe Cloud Infrastructure</p></div><hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" /><p style="font-size: 16px;">Hello <strong>{{username}}</strong>,</p><p style="color: #d1d5db; line-height: 1.6;">Thank you for creating an account with Mystic Servers. Please verify your email address to complete your registration and activate high-performance cloud deployment capabilities.</p><div style="text-align: center; margin: 32px 0;"><a href="{{verification_url}}" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Verify Email Address</a></div><p style="font-size: 12px; color: #6b7280; line-height: 1.5;">If the button above does not work, copy and paste this link into your browser:<br/><a href="{{verification_url}}" style="color: #6366f1;">{{verification_url}}</a></p><hr style="border: 0; border-top: 1px solid #1f2937; margin: 24px 0;" /><p style="font-size: 11px; color: #6b7280; text-align: center;">Mystic Servers Inc. • Need help? Contact <a href="mailto:{{support_email}}" style="color: #9ca3af;">{{support_email}}</a></p></div>`,
        textBody: "Hello {{username}},\n\nPlease verify your Mystic Servers account by opening the following link:\n{{verification_url}}\n\nNeed help? Contact {{support_email}}",
      },
      {
        key: "password_reset",
        name: "Password Reset Request",
        subject: "Password Reset Request — Mystic Servers",
        variablesJson: JSON.stringify(["username", "reset_url", "support_email"]),
        htmlBody: `<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;"><div style="text-align: center; margin-bottom: 24px;"><h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">MYSTIC SERVERS</h2></div><hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" /><p style="font-size: 16px;">Hello <strong>{{username}}</strong>,</p><p style="color: #d1d5db; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to specify a new password:</p><div style="text-align: center; margin: 32px 0;"><a href="{{reset_url}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Reset Password</a></div><p style="font-size: 12px; color: #6b7280;">If you did not request this reset, you can safely ignore this email.</p></div>`,
        textBody: "Hello {{username}},\n\nReset your password here:\n{{reset_url}}\n\nIf you did not request this, ignore this email.",
      },
      {
        key: "2fa_otp",
        name: "2FA Security OTP Code",
        subject: "Your Mystic Security OTP Code",
        variablesJson: JSON.stringify(["otp", "otp_expiry", "support_email"]),
        htmlBody: `<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;"><h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800; text-align: center;">SECURITY VERIFICATION</h2><hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" /><p style="color: #d1d5db;">Your One-Time Security Authentication Code is:</p><div style="text-align: center; margin: 24px 0; background-color: #111827; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981; border: 1px solid #374151;">{{otp}}</div><p style="font-size: 12px; color: #9ca3af; text-align: center;">This code will expire in {{otp_expiry}} minutes. Do not share this code with anyone.</p></div>`,
        textBody: "Your Mystic Servers 2FA OTP code is: {{otp}}. Valid for {{otp_expiry}} minutes.",
      },
      {
        key: "contact_ticket",
        name: "Contact Ticket Notification",
        subject: "[Contact Ticket {{ticket_id}}] {{subject}}",
        variablesJson: JSON.stringify(["ticket_id", "name", "email", "subject", "message"]),
        htmlBody: `<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;"><h3 style="color: #6366f1;">New Customer Contact Inquiry</h3><p><strong>Ticket ID:</strong> {{ticket_id}}</p><p><strong>Name:</strong> {{name}}</p><p><strong>Email:</strong> {{email}}</p><p><strong>Subject:</strong> {{subject}}</p><hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" /><p><strong>Message:</strong></p><div style="background: #111827; padding: 16px; border-radius: 6px; color: #d1d5db;">{{message}}</div></div>`,
        textBody: "New Ticket {{ticket_id}} from {{name}} ({{email}}):\nSubject: {{subject}}\nMessage: {{message}}",
      },
      {
        key: "payment_confirmation",
        name: "Payment Confirmation",
        subject: "Payment Confirmed — Order {{order_number}}",
        variablesJson: JSON.stringify(["username", "order_number", "amount", "currency"]),
        htmlBody: `<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;"><h2 style="color: #10b981; margin: 0; font-size: 24px;">PAYMENT CONFIRMED</h2><hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" /><p>Hello <strong>{{username}}</strong>,</p><p>Your payment of <strong>{{amount}} {{currency}}</strong> for Order <strong>{{order_number}}</strong> has been successfully processed.</p></div>`,
        textBody: "Hello {{username}},\nPayment of {{amount}} {{currency}} for Order {{order_number}} confirmed.",
      },
      {
        key: "invoice",
        name: "Official Invoice Issued",
        subject: "Official Tax Invoice {{invoice_number}} Issued",
        variablesJson: JSON.stringify(["username", "invoice_number", "amount", "currency"]),
        htmlBody: `<div style="background-color: #0b0f19; color: #f3f4f6; font-family: sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1f2937;"><h2 style="color: #6366f1;">INVOICE ISSUED</h2><p>Official Tax Invoice <strong>{{invoice_number}}</strong> for total <strong>{{amount}} {{currency}}</strong> has been generated.</p></div>`,
        textBody: "Official Invoice {{invoice_number}} for {{amount}} {{currency}} has been issued.",
      },
      {
        key: "welcome",
        name: "Welcome to Mystic Servers",
        subject: "Welcome to Enterprise NVMe Cloud Infrastructure",
        variablesJson: JSON.stringify(["username", "frontend_url"]),
        htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Welcome {{username}} to Mystic Servers!</div>`,
        textBody: "Welcome {{username}} to Mystic Servers!",
      },
      {
        key: "vps_provisioned",
        name: "VPS Server Provisioned",
        subject: "Your VPS Server {{server_name}} is Ready",
        variablesJson: JSON.stringify(["username", "server_name", "plan_name"]),
        htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Server {{server_name}} ({{plan_name}}) is provisioned!</div>`,
        textBody: "Server {{server_name}} ({{plan_name}}) is provisioned!",
      },
      {
        key: "vps_suspended",
        name: "VPS Server Suspended",
        subject: "Service Notice — Server {{server_name}} Suspended",
        variablesJson: JSON.stringify(["username", "server_name", "support_email"]),
        htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Server {{server_name}} has been suspended.</div>`,
        textBody: "Server {{server_name}} has been suspended.",
      },
      {
        key: "vps_renewal",
        name: "VPS Renewal Reminder",
        subject: "Renewal Notice for Server {{server_name}}",
        variablesJson: JSON.stringify(["username", "server_name", "amount", "currency"]),
        htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Server {{server_name}} renewal due: {{amount}} {{currency}}.</div>`,
        textBody: "Server {{server_name}} renewal due: {{amount}} {{currency}}.",
      },
      {
        key: "security_alert",
        name: "Security Alert Notice",
        subject: "Security Alert — Account Activity Notice",
        variablesJson: JSON.stringify(["username", "support_email"]),
        htmlBody: `<div style="padding:24px; background:#0b0f19; color:#fff;">Security alert for account {{username}}.</div>`,
        textBody: "Security alert for account {{username}}.",
      },
    ];

    for (const tpl of defaultTemplates) {
      await db
        .insert(emailTemplates)
        .values({
          ...tpl,
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing({ target: emailTemplates.key });
    }
    console.log("  ✓ 11 default email templates initialized (idempotent).");

    // CMS Site Settings Bootstrap
    const { siteSettings } = await import("./schema/site-settings.js");
    const [existingSite] = await db.select().from(siteSettings).limit(1);
    if (!existingSite) {
      await db.insert(siteSettings).values({
        companyName: "Mystic Servers",
        logoUrl: "/brand/logo.png",
        faviconUrl: "/brand/favicon/favicon.ico",
        tagline: "Powering Your Next Project.",
        description: "High-performance enterprise NVMe cloud VPS hosting, bare-metal dedicated servers, and specialized game infrastructure.",
        supportEmail: "support@mysticservers.com",
        salesEmail: "sales@mysticservers.com",
        pressEmail: "press@mysticservers.com",
        statusState: "operational",
        statusMessage: "All Systems Operational (99.99%)",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("  ✓ CMS Site Settings initialized.");
    } else {
      console.log("  ✓ CMS Site Settings already exists.");
    }

    // CMS Navigation Bootstrap
    const { navigationMenus } = await import("./schema/navigation-menus.js");
    const { navigationItems } = await import("./schema/navigation-items.js");

    const menusData = [
      { name: "Header Main Menu", slug: "header" },
      { name: "Footer Products", slug: "footer_products" },
      { name: "Footer Resources", slug: "footer_resources" },
    ];

    for (const mData of menusData) {
      let [menu] = await db.select().from(navigationMenus).where(eq(navigationMenus.slug, mData.slug)).limit(1);
      if (!menu) {
        [menu] = await db.insert(navigationMenus).values(mData).returning();
      }

      if (mData.slug === "header") {
        const headerItems = [
          { label: "Cloud VPS", href: "/products/vps", sortOrder: 1, actionType: "internal" },
          { label: "Dedicated", href: "/products/dedicated", sortOrder: 2, actionType: "internal" },
          { label: "Game Hosting", href: "/products/game", sortOrder: 3, actionType: "internal" },
          { label: "Pricing", href: "/pricing", sortOrder: 4, actionType: "internal" },
          { label: "Status", href: "/status", sortOrder: 5, actionType: "internal" },
          { label: "Docs", href: "/knowledge-base", sortOrder: 6, actionType: "internal" },
        ];
        for (const item of headerItems) {
          const [itemExists] = await db
            .select()
            .from(navigationItems)
            .where(and(eq(navigationItems.menuId, menu.id), eq(navigationItems.href, item.href)))
            .limit(1);
          if (!itemExists) {
            await db.insert(navigationItems).values({ ...item, menuId: menu.id, isEnabled: true });
          }
        }
      } else if (mData.slug === "footer_products") {
        const prodItems = [
          { label: "NVMe Cloud VPS", href: "/products/vps", sortOrder: 1 },
          { label: "Minecraft Hosting", href: "/products/game", sortOrder: 2 },
          { label: "Dedicated Servers", href: "/products/dedicated", sortOrder: 3 },
          { label: "DDoS Protection", href: "/products/vps", sortOrder: 4 },
          { label: "Cloud Hosting", href: "/products/cloud", sortOrder: 5 },
        ];
        for (const item of prodItems) {
          const [itemExists] = await db
            .select()
            .from(navigationItems)
            .where(and(eq(navigationItems.menuId, menu.id), eq(navigationItems.href, item.href)))
            .limit(1);
          if (!itemExists) {
            await db.insert(navigationItems).values({ ...item, menuId: menu.id, isEnabled: true });
          }
        }
      } else if (mData.slug === "footer_resources") {
        const resItems = [
          { label: "Documentation", href: "/knowledge-base", sortOrder: 1 },
          { label: "API Reference", href: "/knowledge-base", sortOrder: 2 },
          { label: "System Status", href: "/status", sortOrder: 3 },
          { label: "Community Discord", href: "https://discord.gg/mysticservers", actionType: "external", sortOrder: 4 },
          { label: "Knowledge Base", href: "/knowledge-base", sortOrder: 5 },
        ];
        for (const item of resItems) {
          const [itemExists] = await db
            .select()
            .from(navigationItems)
            .where(and(eq(navigationItems.menuId, menu.id), eq(navigationItems.label, item.label)))
            .limit(1);
          if (!itemExists) {
            await db.insert(navigationItems).values({ ...item, menuId: menu.id, isEnabled: true });
          }
        }
      }
    }
    console.log("  ✓ CMS Navigation Menus & Items initialized.");

    // CMS Announcements Bootstrap
    const { announcements } = await import("./schema/announcements.js");
    const [annExists] = await db.select().from(announcements).limit(1);
    if (!annExists) {
      await db.insert(announcements).values({
        title: "Next-Gen Infrastructure Launch",
        message: "High-performance enterprise NVMe Gen4 instances now live in all global datacenter regions.",
        type: "info",
        link: "/products/vps",
        linkLabel: "Explore VPS Plans",
        isEnabled: true,
        priority: 1,
      });
      console.log("  ✓ Default Announcement Banner initialized.");
    }

    console.log("✅ Production plan catalog, email, and CMS bootstrap seed completed successfully!");
  } catch (err) {
    console.error("❌ Plan seed failed with error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
