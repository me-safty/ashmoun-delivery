import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { orderStatus, statusLabels } from "./lib/orderStatus";

export const orderRecipient = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (order === null) return null;
    const tokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", order.userId))
      .collect();
    return { tokens: tokens.map((t) => t.token), shopName: order.shopName };
  },
});

export const forgetTokens = internalMutation({
  args: { tokens: v.array(v.string()) },
  handler: async (ctx, { tokens }) => {
    for (const token of tokens) {
      const row = await ctx.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
      if (row !== null) await ctx.db.delete(row._id);
    }
  },
});

type PushTicket = { status: "ok" } | { status: "error"; message: string; details?: { error?: string } };

function hasTickets(body: unknown): body is { data: PushTicket[] } {
  return (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    Array.isArray(body.data) &&
    body.data.every((t: unknown) => typeof t === "object" && t !== null && "status" in t)
  );
}

export const orderStatusChanged = internalAction({
  args: { orderId: v.id("orders"), status: orderStatus },
  handler: async (ctx, { orderId, status }) => {
    const recipient = await ctx.runQuery(internal.push.orderRecipient, { orderId });
    if (recipient === null || recipient.tokens.length === 0) return;
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        recipient.tokens.map((to) => ({
          to,
          title: recipient.shopName,
          body: `حالة طلبك: ${statusLabels[status]}`,
          data: { orderId },
          sound: "default",
          channelId: "orders",
        })),
      ),
    });
    if (!response.ok) throw new Error(`Expo push failed: ${response.status} ${await response.text()}`);
    const body: unknown = await response.json();
    if (!hasTickets(body)) throw new Error(`Unexpected Expo push response: ${JSON.stringify(body)}`);
    const tickets = body.data;
    const unregistered = recipient.tokens.filter((_, i) => {
      const ticket = tickets[i];
      return ticket?.status === "error" && ticket.details?.error === "DeviceNotRegistered";
    });
    if (unregistered.length > 0) await ctx.runMutation(internal.push.forgetTokens, { tokens: unregistered });
    const failures = tickets.filter((t) => t.status === "error" && t.details?.error !== "DeviceNotRegistered");
    if (failures.length > 0) throw new Error(`Expo push tickets failed: ${JSON.stringify(failures)}`);
  },
});
