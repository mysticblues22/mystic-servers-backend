import {
  db,
  siteSettings,
  cmsPages,
  cmsSections,
  navigationMenus,
  navigationItems,
  announcements,
  contactInquiries,
  auditLogs,
  eq,
  and,
  asc,
  desc,
} from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";

export async function getAdminSiteSettingsService() {
  const [settings] = await db.select().from(siteSettings).limit(1);
  return settings || null;
}

export async function updateAdminSiteSettingsService(adminUserId: string, payload: any) {
  const [existing] = await db.select().from(siteSettings).limit(1);

  let updated;
  if (existing) {
    [updated] = await db
      .update(siteSettings)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, existing.id))
      .returning();
  } else {
    [updated] = await db.insert(siteSettings).values({ ...payload }).returning();
  }

  await db.insert(auditLogs).values({
    adminUserId,
    action: "UPDATE_SITE_SETTINGS",
    entityType: "site_settings",
    entityId: updated.id,
    details: JSON.stringify(payload),
    createdAt: new Date(),
  });

  return updated;
}

// Pages Management
export async function listAdminPagesService() {
  return db.select().from(cmsPages).orderBy(asc(cmsPages.sortOrder), asc(cmsPages.title));
}

export async function createAdminPageService(adminUserId: string, payload: any) {
  const [created] = await db
    .insert(cmsPages)
    .values({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(auditLogs).values({
    adminUserId,
    action: "CREATE_CMS_PAGE",
    entityType: "cms_pages",
    entityId: created.id,
    details: JSON.stringify({ slug: created.slug }),
    createdAt: new Date(),
  });

  return created;
}

export async function updateAdminPageService(adminUserId: string, id: string, payload: any) {
  const [updated] = await db
    .update(cmsPages)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(cmsPages.id, id))
    .returning();

  if (!updated) throw new HttpError(404, "NOT_FOUND", "CMS Page not found");

  await db.insert(auditLogs).values({
    adminUserId,
    action: "UPDATE_CMS_PAGE",
    entityType: "cms_pages",
    entityId: updated.id,
    details: JSON.stringify(payload),
    createdAt: new Date(),
  });

  return updated;
}

export async function deleteAdminPageService(adminUserId: string, id: string) {
  const [deleted] = await db.delete(cmsPages).where(eq(cmsPages.id, id)).returning();
  if (!deleted) throw new HttpError(404, "NOT_FOUND", "CMS Page not found");

  await db.insert(auditLogs).values({
    adminUserId,
    action: "DELETE_CMS_PAGE",
    entityType: "cms_pages",
    entityId: id,
    details: JSON.stringify({ slug: deleted.slug }),
    createdAt: new Date(),
  });

  return deleted;
}

// Page Sections Management
export async function listAdminPageSectionsService(pageId: string) {
  return db
    .select()
    .from(cmsSections)
    .where(eq(cmsSections.pageId, pageId))
    .orderBy(asc(cmsSections.sortOrder));
}

export async function createAdminPageSectionService(adminUserId: string, pageId: string, payload: any) {
  const [created] = await db
    .insert(cmsSections)
    .values({
      ...payload,
      pageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateAdminPageSectionService(adminUserId: string, sectionId: string, payload: any) {
  const [updated] = await db
    .update(cmsSections)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(cmsSections.id, sectionId))
    .returning();

  if (!updated) throw new HttpError(404, "NOT_FOUND", "CMS Section not found");
  return updated;
}

export async function deleteAdminPageSectionService(adminUserId: string, sectionId: string) {
  const [deleted] = await db.delete(cmsSections).where(eq(cmsSections.id, sectionId)).returning();
  if (!deleted) throw new HttpError(404, "NOT_FOUND", "CMS Section not found");
  return deleted;
}

// Navigation Management
export async function listAdminNavigationService() {
  const menus = await db.select().from(navigationMenus);
  const items = await db.select().from(navigationItems).orderBy(asc(navigationItems.sortOrder));

  return menus.map((menu) => ({
    ...menu,
    items: items.filter((item) => item.menuId === menu.id),
  }));
}

export async function createAdminNavigationItemService(adminUserId: string, payload: any) {
  const [created] = await db
    .insert(navigationItems)
    .values({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateAdminNavigationItemService(adminUserId: string, id: string, payload: any) {
  const [updated] = await db
    .update(navigationItems)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(navigationItems.id, id))
    .returning();

  if (!updated) throw new HttpError(404, "NOT_FOUND", "Navigation Item not found");
  return updated;
}

export async function deleteAdminNavigationItemService(adminUserId: string, id: string) {
  const [deleted] = await db.delete(navigationItems).where(eq(navigationItems.id, id)).returning();
  if (!deleted) throw new HttpError(404, "NOT_FOUND", "Navigation Item not found");
  return deleted;
}

// Announcements Management
export async function listAdminAnnouncementsService() {
  return db.select().from(announcements).orderBy(desc(announcements.priority), desc(announcements.createdAt));
}

export async function createAdminAnnouncementService(adminUserId: string, payload: any) {
  const [created] = await db
    .insert(announcements)
    .values({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateAdminAnnouncementService(adminUserId: string, id: string, payload: any) {
  const [updated] = await db
    .update(announcements)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id))
    .returning();

  if (!updated) throw new HttpError(404, "NOT_FOUND", "Announcement not found");
  return updated;
}

export async function deleteAdminAnnouncementService(adminUserId: string, id: string) {
  const [deleted] = await db.delete(announcements).where(eq(announcements.id, id)).returning();
  if (!deleted) throw new HttpError(404, "NOT_FOUND", "Announcement not found");
  return deleted;
}

// Inquiries Audit Log
export async function listAdminInquiriesService() {
  return db.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt));
}
