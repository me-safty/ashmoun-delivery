import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { statusLabels } from "./lib/orderStatus";

export const orderRecipient = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    const user = order === null ? null : await ctx.db.get(order.userId);
    if (order === null || user === null) return null;
    return { tokens: user.pushTokens ?? [], status: order.status, shopName: order.shopName };
  },
});

export const orderStatusChanged = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const recipient = await ctx.runQuery(internal.push.orderRecipient, { orderId });
    if (recipient === null || recipient.tokens.length === 0) return;
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        recipient.tokens.map((to) => ({
          to,
          title: recipient.shopName,
          body: `حالة طلبك: ${statusLabels[recipient.status]}`,
          data: { orderId },
          sound: "default",
        })),
      ),
    });
    if (!response.ok) throw new Error(`Expo push failed: ${response.status} ${await response.text()}`);
  },
});
