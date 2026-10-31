import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  const ids = await t.run(async (ctx) => {
    const customerId = await ctx.db.insert("users", { name: "سارة", phone: "01012345678", role: "customer" });
    const adminId = await ctx.db.insert("users", { name: "مدير", phone: "01112345678", role: "customer" });
    const zone = (await ctx.db.query("zones").first())!;
    const addressId = await ctx.db.insert("addresses", {
      userId: customerId, zoneId: zone._id, label: "البيت", street: "شارع المدرسة", landmark: "", isDefault: true,
    });
    const shops = await ctx.db.query("shops").collect();
    const products = await ctx.db.query("products").collect();
    const drivers = await ctx.db.query("drivers").collect();
    return {
      customerId, adminId, addressId,
      market: shops.find((s) => s.name === "ماركت البركة")!._id,
      milk: products.find((p) => p.name === "لبن كامل الدسم 1 لتر")!._id,
      driverId: drivers[0]._id,
    };
  });
  await t.mutation(internal.admin.promote, { phone: "+20 111 234 5678" });
  const asCustomer = t.withIdentity({ subject: `${ids.customerId}|s` });
  const asAdmin = t.withIdentity({ subject: `${ids.adminId}|s` });
  const orderId = await asCustomer.mutation(api.orders.place, {
    shopId: ids.market, addressId: ids.addressId, note: "", items: [{ productId: ids.milk, quantity: 1, selections: [] }],
  });
  return { t, asCustomer, asAdmin, orderId, ...ids };
}

describe("admin.setStatus", () => {
  test("moves an order through the flow and records each step", async () => {
    const { asAdmin, asCustomer, orderId, driverId } = await setup();
    await asAdmin.mutation(api.admin.setStatus, { orderId, status: "confirmed" });
    await expect(asAdmin.mutation(api.admin.setStatus, { orderId, status: "with_driver" })).rejects.toThrow("اختار مندوب");
    await asAdmin.mutation(api.admin.setStatus, { orderId, status: "with_driver", driverId });
    await asAdmin.mutation(api.admin.setStatus, { orderId, status: "delivered" });
    const order = await asCustomer.query(api.orders.get, { orderId });
    expect(order?.status).toBe("delivered");
    expect(order?.driver?.name).toBe("محمود حسن");
    expect(order?.history.map((h) => h.status)).toEqual(["created", "confirmed", "with_driver", "delivered"]);
  });

  test("rejects skipped steps and inactive drivers", async () => {
    const { t, asAdmin, orderId, driverId } = await setup();
    await expect(asAdmin.mutation(api.admin.setStatus, { orderId, status: "delivered" })).rejects.toThrow("مينفعش");
    await asAdmin.mutation(api.admin.setStatus, { orderId, status: "confirmed" });
    await t.run((ctx) => ctx.db.patch(driverId, { active: false }));
    await expect(
      asAdmin.mutation(api.admin.setStatus, { orderId, status: "with_driver", driverId }),
    ).rejects.toThrow("اختار مندوب");
  });

  test("customers can't use admin functions", async () => {
    const { asCustomer, orderId } = await setup();
    await expect(asCustomer.mutation(api.admin.setStatus, { orderId, status: "confirmed" })).rejects.toThrow("غير مسموح");
    await expect(asCustomer.query(api.admin.orders, { view: "active" })).rejects.toThrow("غير مسموح");
  });
});

test("admin.orders lists active orders oldest first and finished ones separately", async () => {
  const { asAdmin, orderId } = await setup();
  expect((await asAdmin.query(api.admin.orders, { view: "active" })).map((o) => o._id)).toEqual([orderId]);
  await asAdmin.mutation(api.admin.setStatus, { orderId, status: "cancelled" });
  expect(await asAdmin.query(api.admin.orders, { view: "active" })).toEqual([]);
  expect((await asAdmin.query(api.admin.orders, { view: "done" })).map((o) => o._id)).toEqual([orderId]);
});

test("a device's push token belongs to whoever signed in last, and is dropped on sign-out", async () => {
  const { t, asCustomer, asAdmin, customerId, adminId } = await setup();
  const owners = () => t.run(async (ctx) => (await ctx.db.query("pushTokens").collect()).map((r) => [r.token, r.userId]));
  await asCustomer.mutation(api.users.savePushToken, { token: "ExponentPushToken[device1]" });
  await asCustomer.mutation(api.users.savePushToken, { token: "ExponentPushToken[device1]" });
  expect(await owners()).toEqual([["ExponentPushToken[device1]", customerId]]);
  await asAdmin.mutation(api.users.savePushToken, { token: "ExponentPushToken[device1]" });
  expect(await owners()).toEqual([["ExponentPushToken[device1]", adminId]]);
  await asCustomer.mutation(api.users.removePushToken, { token: "ExponentPushToken[device1]" });
  expect(await owners()).toHaveLength(1);
  await asAdmin.mutation(api.users.removePushToken, { token: "ExponentPushToken[device1]" });
  expect(await owners()).toEqual([]);
  await expect(asCustomer.mutation(api.users.savePushToken, { token: "garbage" })).rejects.toThrow();
});

test("pushes announce the status that triggered them and forget unregistered devices", async () => {
  vi.useFakeTimers();
  const { t, asCustomer, asAdmin, orderId, driverId } = await setup();
  await asCustomer.mutation(api.users.savePushToken, { token: "ExponentPushToken[live]" });
  await asCustomer.mutation(api.users.savePushToken, { token: "ExponentPushToken[gone]" });
  const bodies: string[] = [];
  vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
    const messages: { to: string; body: string }[] = JSON.parse(init.body);
    bodies.push(...messages.filter((m) => m.to.endsWith("[live]")).map((m) => m.body));
    return new Response(
      JSON.stringify({
        data: messages.map((m) =>
          m.to.endsWith("[gone]") ? { status: "error", message: "gone", details: { error: "DeviceNotRegistered" } } : { status: "ok" },
        ),
      }),
    );
  });
  await asAdmin.mutation(api.admin.setStatus, { orderId, status: "confirmed" });
  await asAdmin.mutation(api.admin.setStatus, { orderId, status: "with_driver", driverId });
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  expect(bodies).toEqual(["حالة طلبك: مؤكد", "حالة طلبك: مع المندوب"]);
  expect(await t.run(async (ctx) => (await ctx.db.query("pushTokens").collect()).map((r) => r.token))).toEqual([
    "ExponentPushToken[live]",
  ]);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
