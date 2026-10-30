import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const zones = await ctx.db.query("zones").withIndex("by_sort").collect();
    return zones.filter((zone) => zone.active);
  },
});
