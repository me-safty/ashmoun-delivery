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

const MAX_PUSH_TOKENS = 5;

export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await requireUser(ctx);
    if (!/^Expo(nent)?PushToken\[.+\]$/.test(token)) throw new ConvexError("رمز إشعارات غير صحيح");
    const tokens = [token, ...(user.pushTokens ?? []).filter((t) => t !== token)].slice(0, MAX_PUSH_TOKENS);
    await ctx.db.patch(user._id, { pushTokens: tokens });
  },
});
