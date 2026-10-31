import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v, type Infer } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { isShopOpen } from "./lib/hours";
import { canCustomerCancel } from "./lib/orderStatus";
import { MAX_QUANTITY, priceLine } from "./lib/pricing";
import { requireUser } from "./lib/session";
import { cartSelection } from "./schema";

const MAX_LINES = 30;
const MAX_NOTE = 300;

const cartItems = v.array(
  v.object({
    productId: v.id("products"),
    quantity: v.number(),
    selections: v.array(cartSelection),
  }),
);

// The one place cart lines are priced, shared by the live quote and by place().
async function priceCart(ctx: QueryCtx, shop: Doc<"shops">, lines: Infer<typeof cartItems>) {
  if (lines.length === 0) throw new ConvexError("السلة فاضية");
  if (lines.length > MAX_LINES) throw new ConvexError("الطلب كبير، قسمه على أكتر من طلب");
  const items = [];
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
      throw new ConvexError("كمية غير صحيحة");
    }
    const product = await ctx.db.get(line.productId);
    if (product === null) throw new ConvexError("فيه منتج في السلة اتشال من المنيو، شيله وكمل");
    if (product.shopId !== shop._id) throw new ConvexError("كل الطلب لازم يكون من محل واحد");
    if (!product.available) throw new ConvexError(`${product.name} مش متاح دلوقتي`);
    const priced = priceLine(product, line.selections);
    if (priced.kind === "invalid") throw new ConvexError(`اختيارات ${product.name} اتغيرت، شيله وضيفه تاني`);
    items.push({
      productId: product._id,
      name: product.name,
      optionsLabel: priced.optionsLabel,
      unitPrice: priced.unitPrice,
      quantity: line.quantity,
    });
  }
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { items, subtotal };
}

export const quote = query({
  args: { shopId: v.id("shops"), items: cartItems },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const shop = await ctx.db.get(args.shopId);
    if (shop === null) return { kind: "invalid" as const, message: "المحل ده مش متاح دلوقتي" };
    try {
      const { items, subtotal } = await priceCart(ctx, shop, args.items);
      return {
        kind: "ok" as const,
        unitPrices: items.map((i) => i.unitPrice),
        subtotal,
        minOrder: shop.minOrder,
        // The client decides open/closed from these so the answer follows the clock.
        hours: shop.hours,
        paused: shop.paused,
      };
    } catch (error) {
      if (error instanceof ConvexError && typeof error.data === "string") {
        return { kind: "invalid" as const, message: error.data };
      }
      throw error;
    }
  },
});

export const place = mutation({
  args: {
    shopId: v.id("shops"),
    addressId: v.id("addresses"),
    note: v.string(),
    items: cartItems,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const address = await ctx.db.get(args.addressId);
    if (address === null || address.userId !== user._id) throw new ConvexError("العنوان غير موجود");
    const zone = await ctx.db.get(address.zoneId);
    if (zone === null || !zone.active) throw new ConvexError("التوصيل متوقف في المنطقة دي حالياً");

    const shop = await ctx.db.get(args.shopId);
    if (shop === null) throw new ConvexError("المحل غير موجود");
    const now = Date.now();
    if (shop.paused) throw new ConvexError("المحل واقف استقبال طلبات مؤقتاً");
    if (!isShopOpen(shop, now)) throw new ConvexError("المحل مقفول دلوقتي");

    const note = args.note.trim();
    if (note.length > MAX_NOTE) throw new ConvexError(`الملاحظات لازم تكون أقل من ${MAX_NOTE} حرف`);

    const { items, subtotal } = await priceCart(ctx, shop, args.items);
    if (subtotal < shop.minOrder) throw new ConvexError(`أقل طلب من ${shop.name} هو ${shop.minOrder} ج.م`);

    return await ctx.db.insert("orders", {
      userId: user._id,
      shopId: shop._id,
      shopName: shop.name,
      address: {
        zoneName: zone.name,
        label: address.label,
        street: address.street,
        landmark: address.landmark,
        location: address.location,
      },
      customerName: user.name ?? "",
      customerPhone: user.phone ?? "",
      items,
      note,
      subtotal,
      deliveryFee: zone.deliveryFee,
      total: subtotal + zone.deliveryFee,
      payment: "cod",
      status: "created",
      history: [{ status: "created", at: now, by: user._id }],
    });
  },
});

export const get = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    const order = orderId === null ? null : await ctx.db.get(orderId);
    if (order === null || order.userId !== user._id) return null;
    return order;
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const cancel = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(orderId);
    if (order === null || order.userId !== user._id) throw new ConvexError("الطلب غير موجود");
    if (order.status === "cancelled") throw new ConvexError("الطلب ده اتلغى قبل كده");
    if (!canCustomerCancel(order.status)) {
      throw new ConvexError("مينفعش تلغي الطلب بعد ما المحل أكده، كلم خدمة العملاء");
    }
    await ctx.db.patch(order._id, {
      status: "cancelled",
      history: [...order.history, { status: "cancelled", at: Date.now(), by: user._id }],
    });
  },
});
