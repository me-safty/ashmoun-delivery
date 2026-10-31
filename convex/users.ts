import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/session";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = userId === null ? null : await ctx.db.get(userId);
    if (user === null) return null;
    const address = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    return {
      _id: user._id,
      name: user.name ?? "",
      phone: user.phone ?? "",
      isAdmin: user.role === "admin",
      hasAddress: address !== null,
    };
  },
});

const pushToken = /^Expo(nent)?PushToken\[.+\]$/;

export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx);
    if (!pushToken.test(token)) throw new ConvexError("رمز إشعارات غير صحيح");
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing === null) await ctx.db.insert("pushTokens", { token, userId: user._id });
    else if (existing.userId !== user._id) await ctx.db.patch(existing._id, { userId: user._id });
  },
});

export const removePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (existing?.userId === user._id) await ctx.db.delete(existing._id);
  },
});
