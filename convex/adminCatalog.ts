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
  args: { zoneId: v.id("zones"), deliveryFee: v.number(), active: v.boolean() },
  handler: async (ctx, { zoneId, deliveryFee, active }) => {
    await requireAdmin(ctx);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 200) {
      throw new ConvexError("رسوم التوصيل لازم تكون بين 0 و 200 ج.م");
    }
    await ctx.db.patch(zoneId, { deliveryFee, active });
  },
});

export const shops = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("shops").collect();
  },
});

export const setShopPaused = mutation({
  args: { shopId: v.id("shops"), paused: v.boolean() },
  handler: async (ctx, { shopId, paused }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(shopId, { paused });
  },
});

export const updateProduct = mutation({
  args: { productId: v.id("products"), price: v.number(), available: v.boolean() },
  handler: async (ctx, { productId, price, available }) => {
    await requireAdmin(ctx);
    if (!Number.isFinite(price) || price <= 0 || price > 100_000) throw new ConvexError("سعر غير صحيح");
    await ctx.db.patch(productId, { price, available });
  },
});
