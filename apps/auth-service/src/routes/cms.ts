import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  createAdminAnnouncementController,
  createAdminNavigationItemController,
  createAdminPageController,
  createAdminPageSectionController,
  deleteAdminAnnouncementController,
  deleteAdminNavigationItemController,
  deleteAdminPageController,
  deleteAdminPageSectionController,
  getAdminSiteSettingsController,
  getPublicPageBySlugController,
  getPublicSiteController,
  listAdminAnnouncementsController,
  listAdminInquiriesController,
  listAdminNavigationController,
  listAdminPageSectionsController,
  listAdminPagesController,
  updateAdminAnnouncementController,
  updateAdminNavigationItemController,
  updateAdminPageController,
  updateAdminPageSectionController,
  updateAdminSiteSettingsController,
} from "../controllers/cms.controller.js";

export async function registerCmsRoutes(app: FastifyInstance) {
  // Public routes
  app.get("/public/site", getPublicSiteController);
  app.get("/public/pages/:slug", getPublicPageBySlugController);

  // Admin Site Settings routes
  app.get(
    "/admin/content/site-settings",
    { preHandler: [authMiddleware, requireRole("admin")] },
    getAdminSiteSettingsController,
  );
  app.put(
    "/admin/content/site-settings",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateAdminSiteSettingsController,
  );

  // Admin Pages routes
  app.get(
    "/admin/content/pages",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminPagesController,
  );
  app.post(
    "/admin/content/pages",
    { preHandler: [authMiddleware, requireRole("admin")] },
    createAdminPageController,
  );
  app.put(
    "/admin/content/pages/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateAdminPageController,
  );
  app.delete(
    "/admin/content/pages/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    deleteAdminPageController,
  );

  // Admin Page Sections routes
  app.get(
    "/admin/content/pages/:pageId/sections",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminPageSectionsController,
  );
  app.post(
    "/admin/content/pages/:pageId/sections",
    { preHandler: [authMiddleware, requireRole("admin")] },
    createAdminPageSectionController,
  );
  app.put(
    "/admin/content/sections/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateAdminPageSectionController,
  );
  app.delete(
    "/admin/content/sections/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    deleteAdminPageSectionController,
  );

  // Admin Navigation routes
  app.get(
    "/admin/content/navigation",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminNavigationController,
  );
  app.post(
    "/admin/content/navigation/items",
    { preHandler: [authMiddleware, requireRole("admin")] },
    createAdminNavigationItemController,
  );
  app.put(
    "/admin/content/navigation/items/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateAdminNavigationItemController,
  );
  app.delete(
    "/admin/content/navigation/items/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    deleteAdminNavigationItemController,
  );

  // Admin Announcements routes
  app.get(
    "/admin/content/announcements",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminAnnouncementsController,
  );
  app.post(
    "/admin/content/announcements",
    { preHandler: [authMiddleware, requireRole("admin")] },
    createAdminAnnouncementController,
  );
  app.put(
    "/admin/content/announcements/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateAdminAnnouncementController,
  );
  app.delete(
    "/admin/content/announcements/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    deleteAdminAnnouncementController,
  );

  // Admin Inquiries routes
  app.get(
    "/admin/content/inquiries",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminInquiriesController,
  );
}
