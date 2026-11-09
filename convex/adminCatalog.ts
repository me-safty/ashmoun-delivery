import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/session";

export const zones = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("zones").withIndex("by_sort").collect();
  },
});

export const updateZone = mutation({
  args: { zoneId: v.id("zones"), deliveryFee: v.optional(v.number()), active: v.optional(v.boolean()) },
  handler: async (ctx, { zoneId, deliveryFee, active }) => {
    await requireAdmin(ctx);
    if (deliveryFee !== undefined && (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 200)) {
      throw new ConvexError("يجب أن تكون رسوم التوصيل بين 0 و200 ج.م");
    }
    // In a Convex patch an undefined value deletes the field, so send only what changed.
    await ctx.db.patch(zoneId, {
      ...(deliveryFee === undefined ? {} : { deliveryFee }),
      ...(active === undefined ? {} : { active }),
    });
  },
});

export const setShopPaused = mutation({
  args: { shopId: v.id("shops"), paused: v.boolean() },
  handler: async (ctx, { shopId, paused }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(shopId, { paused });
  },
});

// Removes a shop together with its menu: sections and products are deleted, while order
// history keeps its snapshots (orders copy shopName and item lines at order time), so past
// orders keep rendering after the shop is gone.
export const deleteShop = mutation({
  args: { shopId: v.id("shops") },
  handler: async (ctx, { shopId }) => {
    await requireAdmin(ctx);
    const shop = await ctx.db.get(shopId);
    if (shop === null) throw new ConvexError("المحل غير موجود");
    for (const section of await ctx.db
      .query("menuSections")
      .withIndex("by_shop", (q) => q.eq("shopId", shopId))
      .collect()) {
      for (const product of await ctx.db
        .query("products")
        .withIndex("by_section", (q) => q.eq("sectionId", section._id))
        .collect()) {
        await ctx.db.delete(product._id);
      }
      await ctx.db.delete(section._id);
    }
    for (const leftover of await ctx.db
      .query("products")
      .withIndex("by_shop", (q) => q.eq("shopId", shopId))
      .collect()) {
      await ctx.db.delete(leftover._id);
    }
    await ctx.db.delete(shopId);
  },
});

export const updateProduct = mutation({
  args: { productId: v.id("products"), price: v.optional(v.number()), available: v.optional(v.boolean()) },
  handler: async (ctx, { productId, price, available }) => {
    await requireAdmin(ctx);
    if (price !== undefined) {
      if (!Number.isFinite(price) || price <= 0 || price > 100_000) throw new ConvexError("سعر غير صحيح");
      const product = await ctx.db.get(productId);
      if (product === null) throw new ConvexError("المنتج غير موجود");
      const largestDiscount = product.optionGroups.reduce((sum, group) => {
        const discounts = group.options
          .map((o) => o.priceDelta)
          .filter((delta) => delta < 0)
          .sort((a, b) => a - b)
          .slice(0, group.max);
        return sum + discounts.reduce((a, b) => a + b, 0);
      }, 0);
      if (price + largestDiscount < 0) {
        throw new ConvexError(`يجب أن يكون السعر ${-largestDiscount} ج.م على الأقل بسبب خيارات الخصم`);
      }
    }
    await ctx.db.patch(productId, {
      ...(price === undefined ? {} : { price }),
      ...(available === undefined ? {} : { available }),
    });
  },
});
