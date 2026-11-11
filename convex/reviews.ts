import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireUser } from "./lib/session";

const MAX_COMMENT = 300;
const LIST_LIMIT = 20;

// Recompute a shop's rating and review count from its reviews and store them
// on the shop document, so catalog queries don't have to scan the reviews
// table. Existing reviews always win over any manually seeded rating; shops
// without reviews keep their seeded rating.
async function refreshShopStats(ctx: MutationCtx, shopId: Id<"shops">) {
  let sum = 0;
  let count = 0;
  for await (const review of ctx.db
    .query("reviews")
    .withIndex("by_shop", (q) => q.eq("shopId", shopId))) {
    sum += review.rating;
    count += 1;
  }
  if (count === 0) {
    await ctx.db.patch(shopId, { rating: undefined, reviewsCount: 0 });
    return;
  }
  await ctx.db.patch("shops", shopId, { rating: sum / count, reviewsCount: count });
}

// One-time migration: clear seeded ratings for shops with no reviews
export const clearSeededRatingsForEmptyReviews = mutation({
  args: {},
  handler: async (ctx) => {
    let cleared = 0;
    for await (const shop of ctx.db.query("shops")) {
      const count = await ctx.db
        .query("reviews")
        .withIndex("by_shop", (q) => q.eq("shopId", shop._id))
        .collect()
        .then((r) => r.length);
      if (count === 0 && shop.rating != null) {
        await ctx.db.patch(shop._id, { rating: undefined, reviewsCount: 0 });
        cleared++;
      }
    }
    return { cleared };
  },
});

export const list = query({
  args: { shopId: v.string() },
  handler: async (ctx, args) => {
    const shopId = ctx.db.normalizeId("shops", args.shopId);
    if (shopId === null) return null;
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_shop", (q) => q.eq("shopId", shopId))
      .order("desc")
      .take(LIST_LIMIT);
    return await Promise.all(
      rows.map(async (row) => {
        const author = await ctx.db.get(row.userId);
        return {
          _id: row._id,
          rating: row.rating,
          comment: row.comment,
          createdAt: row._creationTime,
          authorName: author?.name ?? "",
        };
      }),
    );
  },
});

export const mine = query({
  args: { shopId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const shopId = ctx.db.normalizeId("shops", args.shopId);
    if (shopId === null) return null;
    // Insert and update both go through `add`, so there is never a duplicate.
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_user_shop", (q) => q.eq("userId", userId).eq("shopId", shopId))
      .unique();
    return review === null
      ? null
      : { _id: review._id, rating: review.rating, comment: review.comment };
  },
});

export const add = mutation({
  args: { shopId: v.string(), rating: v.number(), comment: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const shopId = ctx.db.normalizeId("shops", args.shopId);
    if (shopId === null) throw new ConvexError("المحل غير موجود");
    const rating = Math.round(args.rating);
    if (rating < 1 || rating > 5) throw new ConvexError("يرجى اختيار تقييم من ١ إلى ٥");
    const comment = args.comment.trim().slice(0, MAX_COMMENT);

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_user_shop", (q) => q.eq("userId", user._id).eq("shopId", shopId))
      .unique();
    if (existing === null) {
      await ctx.db.insert("reviews", { shopId, userId: user._id, rating, comment });
    } else {
      await ctx.db.patch(existing._id, { rating, comment });
    }
    await refreshShopStats(ctx, shopId);
  },
});
