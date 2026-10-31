import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { geoPoint } from "./schema";
import { requireUser } from "./lib/session";

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return await Promise.all(
      addresses.map(async (address) => {
        const zone = await ctx.db.get(address.zoneId);
        return { ...address, zoneName: zone?.name ?? "", deliveryFee: zone?.deliveryFee ?? 0 };
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
