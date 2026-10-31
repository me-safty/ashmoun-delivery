import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isShopOpen } from "./lib/hours";
import { priceLine } from "./lib/pricing";
import { requireUser } from "./lib/session";
import { cartSelection } from "./schema";

const MAX_LINES = 30;
const MAX_QUANTITY = 20;

export const place = mutation({
  args: {
    shopId: v.id("shops"),
    addressId: v.id("addresses"),
    note: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        selections: v.array(cartSelection),
      }),
    ),
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
    if (!isShopOpen(shop, now)) throw new ConvexError("المحل مقفول دلوقتي");

    if (args.items.length === 0) throw new ConvexError("السلة فاضية");
    if (args.items.length > MAX_LINES) throw new ConvexError("الطلب كبير، قسمه على أكتر من طلب");

    const items = [];
    for (const line of args.items) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
        throw new ConvexError("كمية غير صحيحة");
      }
      const product = await ctx.db.get(line.productId);
      if (product === null || product.shopId !== shop._id) {
        throw new ConvexError("كل الطلب لازم يكون من محل واحد");
      }
      if (!product.available) throw new ConvexError(`${product.name} مش متاح دلوقتي`);
      const priced = priceLine(product, line.selections);
      if (priced.kind === "invalid") throw new ConvexError(`اختيارات ${product.name} ناقصة`);
      items.push({
        productId: product._id,
        name: product.name,
        optionsLabel: priced.optionsLabel,
        unitPrice: priced.unitPrice,
        quantity: line.quantity,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
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
      note: args.note.trim(),
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
