import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { geoPoint } from "./schema";
import { requireUser } from "./lib/session";

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return await Promise.all(
      addresses.map(async (address) => {
        const zone = await ctx.db.get(address.zoneId);
        return {
          ...address,
          zoneName: zone?.name ?? "",
          deliveryFee: zone?.deliveryFee ?? 0,
          zoneActive: zone?.active ?? false,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    zoneId: v.id("zones"),
    label: v.string(),
    street: v.string(),
    landmark: v.string(),
    location: v.optional(geoPoint),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const zone = await ctx.db.get(args.zoneId);
    if (zone === null || !zone.active) throw new ConvexError("المنطقة غير متاحة");
    const street = args.street.trim();
    if (street.length < 3) throw new ConvexError("اكتب العنوان بالتفصيل");
    const existing = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    return await ctx.db.insert("addresses", {
      userId: user._id,
      zoneId: zone._id,
      label: args.label.trim() || "البيت",
      street,
      landmark: args.landmark.trim(),
      location: args.location,
      isDefault: existing === null,
    });
  },
});

export const remove = mutation({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, { addressId }) => {
    const user = await requireUser(ctx);
    const address = await ctx.db.get(addressId);
    if (address === null || address.userId !== user._id) throw new ConvexError("العنوان غير موجود");
    const others = (
      await ctx.db
        .query("addresses")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect()
    ).filter((a) => a._id !== address._id);
    if (others.length === 0) throw new ConvexError("لازم يفضل عندك عنوان واحد على الأقل");
    await ctx.db.delete(address._id);
    if (address.isDefault) await ctx.db.patch(others[0]._id, { isDefault: true });
  },
});

export const setDefault = mutation({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, { addressId }) => {
    const user = await requireUser(ctx);
    const address = await ctx.db.get(addressId);
    if (address === null || address.userId !== user._id) throw new ConvexError("العنوان غير موجود");
    const mine = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const a of mine) {
      if (a.isDefault !== (a._id === address._id)) await ctx.db.patch(a._id, { isDefault: a._id === address._id });
    }
  },
});
