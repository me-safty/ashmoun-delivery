import { internalMutation } from "./_generated/server";

// Convex Auth looks reset codes up by hash across all accounts with `.unique()`,
// so expired codes left behind would make a new 6-digit code collide.
export const deleteExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const codes = await ctx.db.query("authVerificationCodes").collect();
    for (const code of codes) {
      if (code.expirationTime < now) await ctx.db.delete(code._id);
    }
  },
});
