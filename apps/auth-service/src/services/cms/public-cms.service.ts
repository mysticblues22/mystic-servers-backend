import {
  db,
  siteSettings,
  announcements,
  navigationMenus,
  navigationItems,
  cmsPages,
  cmsSections,
  eq,
  and,
  asc,
  desc,
} from "@mystic/database";

export async function getPublicSiteService() {
  const [settings] = await db.select().from(siteSettings).limit(1);

  // Active Announcements
  const activeAnnouncements = await db
    .select()
    .from(announcements)
    .where(eq(announcements.isEnabled, true))
    .orderBy(desc(announcements.priority), desc(announcements.createdAt));

  // Menus
  const menus = await db.select().from(navigationMenus);
  const headerMenu = menus.find((m) => m.slug === "header");
  const footerProductsMenu = menus.find((m) => m.slug === "footer_products");
  const footerResourcesMenu = menus.find((m) => m.slug === "footer_resources");

  const headerItems = headerMenu
    ? await db
        .select()
        .from(navigationItems)
        .where(and(eq(navigationItems.menuId, headerMenu.id), eq(navigationItems.isEnabled, true)))
        .orderBy(asc(navigationItems.sortOrder))
    : [];

  const footerProducts = footerProductsMenu
    ? await db
        .select()
        .from(navigationItems)
        .where(and(eq(navigationItems.menuId, footerProductsMenu.id), eq(navigationItems.isEnabled, true)))
        .orderBy(asc(navigationItems.sortOrder))
    : [];

  const footerResources = footerResourcesMenu
    ? await db
        .select()
        .from(navigationItems)
        .where(and(eq(navigationItems.menuId, footerResourcesMenu.id), eq(navigationItems.isEnabled, true)))
        .orderBy(asc(navigationItems.sortOrder))
    : [];

  let socialLinks = {
    github: "https://github.com",
    discord: "https://discord.gg/mysticservers",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
  };

  if (settings?.socialLinksJson) {
    try {
      socialLinks = JSON.parse(settings.socialLinksJson);
    } catch {
      // keep fallback
    }
  }

  return {
    site: settings
      ? {
          companyName: settings.companyName,
          logoUrl: settings.logoUrl,
          faviconUrl: settings.faviconUrl,
          tagline: settings.tagline,
          description: settings.description,
          supportEmail: settings.supportEmail,
          salesEmail: settings.salesEmail,
          pressEmail: settings.pressEmail,
          socialLinks,
          defaultSeoTitle: settings.defaultSeoTitle,
          defaultSeoDescription: settings.defaultSeoDescription,
          defaultOgImage: settings.defaultOgImage,
          statusState: settings.statusState,
          statusMessage: settings.statusMessage,
        }
      : {
          companyName: "Mystic Servers",
          logoUrl: "/brand/logo.png",
          faviconUrl: "/brand/favicon/favicon.ico",
          tagline: "Powering Your Next Project.",
          description: "High-performance enterprise NVMe cloud VPS hosting, bare-metal dedicated servers, and specialized game infrastructure.",
          supportEmail: "support@mysticservers.com",
          salesEmail: "sales@mysticservers.com",
          pressEmail: "press@mysticservers.com",
          socialLinks,
          defaultSeoTitle: "Mystic Servers — Enterprise NVMe Cloud Infrastructure",
          defaultSeoDescription: "High-performance enterprise NVMe cloud VPS hosting, bare-metal dedicated servers, and specialized game infrastructure.",
          defaultOgImage: "/og.png",
          statusState: "operational",
          statusMessage: "All Systems Operational (99.99%)",
        },
    announcements: activeAnnouncements,
    navigation: {
      header: headerItems,
      footerProducts,
      footerResources,
    },
  };
}

export async function getPublicPageBySlugService(slug: string) {
  const [page] = await db
    .select()
    .from(cmsPages)
    .where(and(eq(cmsPages.slug, slug), eq(cmsPages.status, "published")))
    .limit(1);

  if (!page) return null;

  const sections = await db
    .select()
    .from(cmsSections)
    .where(and(eq(cmsSections.pageId, page.id), eq(cmsSections.isEnabled, true)))
    .orderBy(asc(cmsSections.sortOrder));

  return {
    page,
    sections,
  };
}
