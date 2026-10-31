import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { normalizePhone } from "./lib/phone";
import { canTransition, orderStatus } from "./lib/orderStatus";
import { requireAdmin } from "./lib/session";

const ACTIVE = ["created", "confirmed", "with_driver"] as const;
const DONE = ["delivered", "returned", "cancelled"] as const;

export const orders = query({
  args: { view: v.union(v.literal("active"), v.literal("done")) },
  handler: async (ctx, { view }) => {
    await requireAdmin(ctx);
    if (view === "active") {
      const groups = await Promise.all(
        ACTIVE.map((status) =>
          ctx.db
            .query("orders")
            .withIndex("by_status", (q) => q.eq("status", status))
            .collect(),
        ),
      );
      return groups.flat().sort((a, b) => a._creationTime - b._creationTime);
    }
    const groups = await Promise.all(
      DONE.map((status) =>
        ctx.db
          .query("orders")
          .withIndex("by_status", (q) => q.eq("status", status))
          .order("desc")
          .take(100),
      ),
    );
    return groups
      .flat()
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 100);
  },
});

export const order = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orderId = ctx.db.normalizeId("orders", args.orderId);
    return orderId === null ? null : await ctx.db.get(orderId);
  },
});

export const setStatus = mutation({
  args: { orderId: v.id("orders"), status: orderStatus, driverId: v.optional(v.id("drivers")) },
  handler: async (ctx, { orderId, status, driverId }) => {
    const admin = await requireAdmin(ctx);
    const order = await ctx.db.get(orderId);
    if (order === null) throw new ConvexError("الطلب غير موجود");
    if (!canTransition(order.status, status)) throw new ConvexError("مينفعش تنقل الطلب للحالة دي");

    let driver = order.driver;
    if (status === "with_driver") {
      const chosen = driverId === undefined ? null : await ctx.db.get(driverId);
      if (chosen === null || !chosen.active) throw new ConvexError("اختار مندوب");
      driver = { name: chosen.name, phone: chosen.phone };
    }
    await ctx.db.patch(order._id, {
      status,
      driver,
      history: [...order.history, { status, at: Date.now(), by: admin._id }],
    });
    await ctx.scheduler.runAfter(0, internal.push.orderStatusChanged, { orderId: order._id, status });
  },
});

export const drivers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("drivers").collect();
  },
});

export const addDriver = mutation({
  args: { name: v.string(), phone: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    const phone = normalizePhone(args.phone);
    if (name.length < 2) throw new ConvexError("اكتب اسم المندوب");
    if (!phone) throw new ConvexError("رقم الموبايل غير صحيح");
    const drivers = await ctx.db.query("drivers").collect();
    if (drivers.some((d) => d.phone === phone)) throw new ConvexError("فيه مندوب بالرقم ده قبل كده");
    return await ctx.db.insert("drivers", { name, phone, active: true });
  },
});

export const setDriverActive = mutation({
  args: { driverId: v.id("drivers"), active: v.boolean() },
  handler: async (ctx, { driverId, active }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(driverId, { active });
  },
});

// Bootstrap: pnpm exec convex run admin:promote '{"phone":"01xxxxxxxxx"}'
export const promote = internalMutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const phone = normalizePhone(args.phone);
    const user =
      phone === null ? null : await ctx.db.query("users").withIndex("phone", (q) => q.eq("phone", phone)).unique();
    if (user === null) throw new ConvexError("مفيش مستخدم بالرقم ده");
    await ctx.db.patch(user._id, { role: "admin" });
    return user._id;
  },
});
