import { db, products, plans, regionalPrices, eq, asc, desc } from "@mystic/database";
import { HttpError } from "../../errors/http-error.js";

export async function listPublicProductsService() {
  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.status, "active"))
    .orderBy(asc(products.sortOrder));

  return { products: activeProducts };
}

export async function getProductBySlugService(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) {
    throw new HttpError(404, "PRODUCT_NOT_FOUND", `Product '${slug}' not found`);
  }

  // Fetch associated plans if product is active
  const productPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.status, "active"))
    .orderBy(asc(plans.sortOrder));

  return { product, plans: productPlans };
}

// Admin Services
export async function listAdminProductsService() {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder));

  return { products: allProducts };
}

export async function createProductService(input: {
  slug: string;
  name: string;
  category: string;
  shortDescription?: string;
  fullDescription?: string;
  features?: string;
  icon?: string;
  status?: "active" | "disabled" | "draft";
  sortOrder?: number;
}) {
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.slug, input.slug))
    .limit(1);

  if (existing) {
    throw new HttpError(400, "DUPLICATE_PRODUCT_SLUG", `Product with slug '${input.slug}' already exists`);
  }

  const [newProduct] = await db
    .insert(products)
    .values({
      slug: input.slug.toLowerCase().trim(),
      name: input.name.trim(),
      category: input.category.toLowerCase().trim(),
      shortDescription: input.shortDescription || null,
      fullDescription: input.fullDescription || null,
      features: input.features || null,
      icon: input.icon || "Server",
      status: input.status || "disabled",
      sortOrder: input.sortOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return { product: newProduct };
}

export async function updateProductService(
  productId: string,
  input: {
    name?: string;
    category?: string;
    shortDescription?: string;
    fullDescription?: string;
    features?: string;
    icon?: string;
    status?: "active" | "disabled" | "draft";
    sortOrder?: number;
  },
) {
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!existing) {
    throw new HttpError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const [updatedProduct] = await db
    .update(products)
    .set({
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.category ? { category: input.category.toLowerCase().trim() } : {}),
      ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
      ...(input.fullDescription !== undefined ? { fullDescription: input.fullDescription } : {}),
      ...(input.features !== undefined ? { features: input.features } : {}),
      ...(input.icon ? { icon: input.icon } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId))
    .returning();

  return { product: updatedProduct };
}
