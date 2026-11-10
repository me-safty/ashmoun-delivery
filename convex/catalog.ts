import { v } from "convex/values";
import { query, mutation, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { ensureSlugs } from "./lib/slugs";

// Catalog browsing is public: guests can browse shops, categories and menus without an account.
// Authentication is enforced where it matters — orders.quote/orders.place under convex/orders.ts.

// Route params can carry either a slug ("food") or a stale-but-valid row id;
// resolve both so old links never dead-end.
async function resolveCategory(ctx: QueryCtx, slug: string): Promise<Doc<"categories"> | null> {
  const bySlug = await ctx.db.query("categories").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
  if (bySlug !== null) return bySlug;
  const byId = ctx.db.normalizeId("categories", slug);
  return byId === null ? null : await ctx.db.get(byId);
}

// Shared detail view for the shop page, whichever way the route names the shop.
async function shopDetailView(ctx: QueryCtx, shop: Doc<"shops">) {
  const [sections, products] = await Promise.all([
    ctx.db
      .query("menuSections")
      .withIndex("by_shop", (q) => q.eq("shopId", shop._id))
      .collect(),
    ctx.db
      .query("products")
      .withIndex("by_shop", (q) => q.eq("shopId", shop._id))
      .collect(),
  ]);
  return {
    shop,
    sections: sections
      .map((section) => ({
        ...section,
        products: products.filter((p) => p.sectionId === section._id),
      }))
      .filter((section) => section.products.length > 0),
  };
}

export const categories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").withIndex("by_sort").collect();
  },
});

export const shops = query({
  args: { categoryId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const categoryId = args.categoryId === undefined ? null : ctx.db.normalizeId("categories", args.categoryId);
    if (args.categoryId !== undefined && categoryId === null) return [];
    const shops = categoryId
      ? await ctx.db
          .query("shops")
          .withIndex("by_category_sort", (q) => q.eq("categoryId", categoryId))
          .filter((q) => q.eq(q.field("paused"), false))
          .collect()
      : await ctx.db.query("shops").filter((q) => q.eq(q.field("paused"), false)).order("asc").collect();

    return shops.map((shop) => ({
      ...shop,
      categoryName: "",
    }));
  },
});

export const category = query({
  args: { categoryId: v.string() },
  handler: async (ctx, args) => {
    const categoryId = ctx.db.normalizeId("categories", args.categoryId);
    return categoryId === null ? null : await ctx.db.get(categoryId);
  },
});

// Route params arrive as plain strings, so a stale or malformed id returns null.
// Accepts a slug or a shop id, so old links keep working.
export const shop = query({
  args: { shopId: v.string() },
  handler: async (ctx, args) => {
    const shopId = ctx.db.normalizeId("shops", args.shopId);
    const shop = shopId === null ? null : await ctx.db.get(shopId);
    return shop === null ? null : await shopDetailView(ctx, shop);
  },
});

export const product = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    const productId = ctx.db.normalizeId("products", args.productId);
    const product = productId === null ? null : await ctx.db.get(productId);
    const shop = product === null ? null : await ctx.db.get(product.shopId);
    if (product === null || shop === null) return null;
    return { product, shop };
  },
});

export const shopBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const bySlug = await ctx.db.query("shops").withIndex("by_slug", (q) => q.eq("slug", args.slug)).first();
    const shop = bySlug ?? null;
    if (shop !== null) return await shopDetailView(ctx, shop);
    const byId = ctx.db.normalizeId("shops", args.slug);
    if (byId === null) return null;
    const shopById = await ctx.db.get(byId);
    return shopById === null ? null : await shopDetailView(ctx, shopById);
  },
});

export const categoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => await resolveCategory(ctx, args.slug),
});

export const shopsByCategorySlug = query({
  args: { categorySlug: v.string() },
  handler: async (ctx, args) => {
    const category = await resolveCategory(ctx, args.categorySlug);
    if (category === null) return [];
    const shops = await ctx.db
      .query("shops")
      .withIndex("by_category_sort", (q) => q.eq("categoryId", category._id))
      .filter((q) => q.eq(q.field("paused"), false))
      .collect();
    return shops.map((shop) => ({
      ...shop,
      categoryName: category.name,
    }));
  },
});

// One-off (idempotent) data repair: gives slug-less categories and shops a
// unique slug so routing by slug always resolves.
export const backfillSlugs = mutation({
  args: {},
  handler: async (ctx) => await ensureSlugs(ctx),
});

export const updateShopSortOrder = mutation({
  args: { shopId: v.id("shops"), sortOrder: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.shopId, { sortOrder: args.sortOrder });
  },
});
