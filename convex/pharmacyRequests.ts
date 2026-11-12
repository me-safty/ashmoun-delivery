import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";
import { requireUser } from "./lib/session";

const MAX_DESCRIPTION = 500;

export const create = mutation({
  args: {
    shopId: v.id("shops"),
    description: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const shop = await ctx.db.get(args.shopId);
    if (shop === null) throw new ConvexError("الصيدلية غير موجودة");

    const description = args.description.trim();
    if (description.length === 0 && args.imageStorageId === undefined) {
      throw new ConvexError("الرجاء كتابة ما تحتاجه أو رفع صورة");
    }
    if (description.length > MAX_DESCRIPTION) {
      throw new ConvexError(`يجب أن يكون الوصف أقل من ${MAX_DESCRIPTION} حرفًا`);
    }

    return await ctx.db.insert("pharmacyRequests", {
      shopId: shop._id,
      userId: user._id,
      shopName: shop.name,
      customerName: user.name ?? "",
      customerPhone: user.phone ?? "",
      description,
      imageStorageId: args.imageStorageId ?? undefined,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const uploadImage = action({
  args: {
    imageBase64: v.string(),
    imageMimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(
      `data:${args.imageMimeType};base64,${args.imageBase64}`,
    );
    const blob = await response.blob();
    return await ctx.storage.store(blob);
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("pharmacyRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

type PharmacyRequest = Doc<"pharmacyRequests">;

export const statusLabel = (status: PharmacyRequest["status"]): string => {
  const labels: Record<PharmacyRequest["status"], string> = {
    pending: "قيد الانتظار",
    accepted: "تم القبول",
    rejected: "تم الرفض",
    delivered: "تم التسليم",
    cancelled: "ملغى",
  };
  return labels[status];
};
