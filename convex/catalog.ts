import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./lib/session";

export const categories = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("categories").withIndex("by_sort").collect();
  },
});

export const shops = query({
  args: { categoryId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const categoryId = args.categoryId === undefined ? null : ctx.db.normalizeId("categories", args.categoryId);
    if (args.categoryId !== undefined && categoryId === null) return [];
    return categoryId
      ? await ctx.db
          .query("shops")
          .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
          .collect()
      : await ctx.db.query("shops").collect();
  },
});

export const category = query({
  args: { categoryId: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const categoryId = ctx.db.normalizeId("categories", args.categoryId);
    return categoryId === null ? null : await ctx.db.get(categoryId);
  },
});

// Route params arrive as plain strings, so a stale or malformed id returns null.
export const shop = query({
  args: { shopId: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const shopId = ctx.db.normalizeId("shops", args.shopId);
    const shop = shopId === null ? null : await ctx.db.get(shopId);
    if (shop === null) return null;
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
  },
});

export const product = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const productId = ctx.db.normalizeId("products", args.productId);
    const product = productId === null ? null : await ctx.db.get(productId);
    const shop = product === null ? null : await ctx.db.get(product.shopId);
    if (product === null || shop === null) return null;
    return { product, shop };
  },
});
