import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { HttpError } from "../errors/http-error.js";
import {
  getPublicPageBySlugService,
  getPublicSiteService,
} from "../services/cms/public-cms.service.js";
import {
  createAdminAnnouncementService,
  createAdminNavigationItemService,
  createAdminPageSectionService,
  createAdminPageService,
  deleteAdminAnnouncementService,
  deleteAdminNavigationItemService,
  deleteAdminPageSectionService,
  deleteAdminPageService,
  getAdminSiteSettingsService,
  listAdminAnnouncementsService,
  listAdminInquiriesService,
  listAdminNavigationService,
  listAdminPageSectionsService,
  listAdminPagesService,
  updateAdminAnnouncementService,
  updateAdminNavigationItemService,
  updateAdminPageSectionService,
  updateAdminPageService,
  updateAdminSiteSettingsService,
} from "../services/cms/admin-cms.service.js";

// Public Controllers
export async function getPublicSiteController(request: FastifyRequest, reply: FastifyReply) {
  const data = await getPublicSiteService();
  return reply.status(200).send(data);
}

export async function getPublicPageBySlugController(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string };
  const data = await getPublicPageBySlugService(slug);
  if (!data) throw new HttpError(404, "NOT_FOUND", "Page not found");
  return reply.status(200).send(data);
}

// Admin Controllers
export async function getAdminSiteSettingsController(request: FastifyRequest, reply: FastifyReply) {
  const data = await getAdminSiteSettingsService();
  return reply.status(200).send({ settings: data });
}

export async function updateAdminSiteSettingsController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const updated = await updateAdminSiteSettingsService(adminUserId, request.body);
  return reply.status(200).send({ success: true, settings: updated });
}

// Admin Page Controllers
export async function listAdminPagesController(request: FastifyRequest, reply: FastifyReply) {
  const pages = await listAdminPagesService();
  return reply.status(200).send({ pages });
}

export async function createAdminPageController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const created = await createAdminPageService(adminUserId, request.body);
  return reply.status(201).send({ success: true, page: created });
}

export async function updateAdminPageController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const updated = await updateAdminPageService(adminUserId, id, request.body);
  return reply.status(200).send({ success: true, page: updated });
}

export async function deleteAdminPageController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const deleted = await deleteAdminPageService(adminUserId, id);
  return reply.status(200).send({ success: true, page: deleted });
}

// Admin Section Controllers
export async function listAdminPageSectionsController(request: FastifyRequest, reply: FastifyReply) {
  const { pageId } = request.params as { pageId: string };
  const sections = await listAdminPageSectionsService(pageId);
  return reply.status(200).send({ sections });
}

export async function createAdminPageSectionController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { pageId } = request.params as { pageId: string };
  const created = await createAdminPageSectionService(adminUserId, pageId, request.body);
  return reply.status(201).send({ success: true, section: created });
}

export async function updateAdminPageSectionController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const updated = await updateAdminPageSectionService(adminUserId, id, request.body);
  return reply.status(200).send({ success: true, section: updated });
}

export async function deleteAdminPageSectionController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const deleted = await deleteAdminPageSectionService(adminUserId, id);
  return reply.status(200).send({ success: true, section: deleted });
}

// Admin Navigation Controllers
export async function listAdminNavigationController(request: FastifyRequest, reply: FastifyReply) {
  const navigation = await listAdminNavigationService();
  return reply.status(200).send({ navigation });
}

export async function createAdminNavigationItemController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const created = await createAdminNavigationItemService(adminUserId, request.body);
  return reply.status(201).send({ success: true, item: created });
}

export async function updateAdminNavigationItemController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const updated = await updateAdminNavigationItemService(adminUserId, id, request.body);
  return reply.status(200).send({ success: true, item: updated });
}

export async function deleteAdminNavigationItemController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const deleted = await deleteAdminNavigationItemService(adminUserId, id);
  return reply.status(200).send({ success: true, item: deleted });
}

// Admin Announcements Controllers
export async function listAdminAnnouncementsController(request: FastifyRequest, reply: FastifyReply) {
  const list = await listAdminAnnouncementsService();
  return reply.status(200).send({ announcements: list });
}

export async function createAdminAnnouncementController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const created = await createAdminAnnouncementService(adminUserId, request.body);
  return reply.status(201).send({ success: true, announcement: created });
}

export async function updateAdminAnnouncementController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const updated = await updateAdminAnnouncementService(adminUserId, id, request.body);
  return reply.status(200).send({ success: true, announcement: updated });
}

export async function deleteAdminAnnouncementController(request: FastifyRequest, reply: FastifyReply) {
  const adminUserId = (request as any).user.id;
  const { id } = request.params as { id: string };
  const deleted = await deleteAdminAnnouncementService(adminUserId, id);
  return reply.status(200).send({ success: true, announcement: deleted });
}

// Admin Inquiries Controller
export async function listAdminInquiriesController(request: FastifyRequest, reply: FastifyReply) {
  const inquiries = await listAdminInquiriesService();
  return reply.status(200).send({ inquiries });
}
