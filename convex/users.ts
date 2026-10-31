import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

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
