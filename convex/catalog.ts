import { ConvexError, v } from "convex/values";
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
  args: { categoryId: v.optional(v.id("categories")) },
  handler: async (ctx, { categoryId }) => {
    await requireUser(ctx);
    return categoryId
      ? await ctx.db
          .query("shops")
          .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
          .collect()
      : await ctx.db.query("shops").collect();
  },
});

export const category = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, { categoryId }) => {
    await requireUser(ctx);
    return await ctx.db.get(categoryId);
  },
});

export const shop = query({
  args: { shopId: v.id("shops") },
  handler: async (ctx, { shopId }) => {
    await requireUser(ctx);
    const shop = await ctx.db.get(shopId);
    if (shop === null) throw new ConvexError("المحل غير موجود");
    const [sections, products] = await Promise.all([
      ctx.db
        .query("menuSections")
        .withIndex("by_shop", (q) => q.eq("shopId", shopId))
        .collect(),
      ctx.db
        .query("products")
        .withIndex("by_shop", (q) => q.eq("shopId", shopId))
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
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await requireUser(ctx);
    const product = await ctx.db.get(productId);
    if (product === null) throw new ConvexError("المنتج غير موجود");
    const shop = await ctx.db.get(product.shopId);
    if (shop === null) throw new ConvexError("المحل غير موجود");
    return { product, shop };
  },
});
