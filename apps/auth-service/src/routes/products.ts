import type { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  createProductController,
  getProductBySlugController,
  listAdminProductsController,
  listPublicProductsController,
  updateProductController,
} from "../controllers/product.controller.js";

export async function registerProductRoutes(app: FastifyInstance) {
  // Public Catalog
  app.get("/products", listPublicProductsController);
  app.get("/products/:slug", getProductBySlugController);

  // Admin Catalog Management (Requires admin role)
  app.get(
    "/admin/products",
    { preHandler: [authMiddleware, requireRole("admin")] },
    listAdminProductsController,
  );
  app.post(
    "/admin/products",
    { preHandler: [authMiddleware, requireRole("admin")] },
    createProductController,
  );
  app.put(
    "/admin/products/:id",
    { preHandler: [authMiddleware, requireRole("admin")] },
    updateProductController,
  );
}
