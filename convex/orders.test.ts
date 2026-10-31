import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "سارة", phone: "01012345678", role: "customer" });
    const otherId = await ctx.db.insert("users", { name: "علي", phone: "01112345678", role: "customer" });
    const zones = await ctx.db.query("zones").collect();
    const samadoun = zones.find((z) => z.name === "سمادون")!;
    const addressId = await ctx.db.insert("addresses", {
      userId, zoneId: samadoun._id, label: "البيت", street: "شارع المدرسة", landmark: "", isDefault: true,
    });
    const otherAddressId = await ctx.db.insert("addresses", {
      userId: otherId, zoneId: samadoun._id, label: "البيت", street: "شارع النيل", landmark: "", isDefault: true,
    });
    const shops = await ctx.db.query("shops").collect();
    const products = await ctx.db.query("products").collect();
    const shop = (name: string) => shops.find((s) => s.name === name)!;
    const product = (name: string) => products.find((p) => p.name === name)!._id;
    return {
      userId, addressId, otherAddressId,
      market: shop("ماركت البركة")._id,
      sweets: shop("حلواني الشروق")._id,
      milk: product("لبن كامل الدسم 1 لتر"),
      bread: product("عيش بلدي (5 أرغفة)"),
      basbousa: product("بسبوسة بالقشطة"),
      fries: product("بطاطس"),
    };
  });
  const asUser = t.withIdentity({ subject: `${ids.userId}|session` });
  return { t, asUser, ...ids };
}

const line = (productId: Id<"products">, quantity = 1) => ({ productId, quantity, selections: [] });

describe("orders.quote", () => {
  test("prices the cart from current product data", async () => {
    const { t, asUser, market, milk } = await setup();
    await t.run((ctx) => ctx.db.patch(milk, { price: 50 }));
    expect(await asUser.query(api.orders.quote, { shopId: market, items: [line(milk, 2)] })).toMatchObject({
      kind: "ok", unitPrices: [50], subtotal: 100, minOrder: 40, paused: false,
    });
  });

  test("explains a removed product instead of blaming the one-shop rule", async () => {
    const { t, asUser, market, milk } = await setup();
    await t.run((ctx) => ctx.db.delete(milk));
    expect(await asUser.query(api.orders.quote, { shopId: market, items: [line(milk)] })).toMatchObject({
      kind: "invalid", message: expect.stringContaining("اتشال"),
    });
  });
});

describe("orders.place", () => {
  test("prices items on the server and adds the zone delivery fee", async () => {
    const { asUser, market, addressId, milk, bread } = await setup();
    const orderId = await asUser.mutation(api.orders.place, {
      shopId: market, addressId, note: " بسرعة ", items: [line(milk, 2), line(bread)],
    });
    const order = await asUser.query(api.orders.get, { orderId });
    expect(order).toMatchObject({
      subtotal: 94, deliveryFee: 15, total: 109, payment: "cod", status: "created", note: "بسرعة",
      address: { zoneName: "سمادون" }, customerPhone: "01012345678",
    });
    expect(order?.history).toHaveLength(1);
  });

  test("rejects items from another shop", async () => {
    const { asUser, market, addressId, milk, fries } = await setup();
    await expect(
      asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(milk), line(fries)] }),
    ).rejects.toThrow("محل واحد");
  });

  test("rejects a closed (paused) shop", async () => {
    const { asUser, sweets, addressId, basbousa } = await setup();
    await expect(
      asUser.mutation(api.orders.place, { shopId: sweets, addressId, note: "", items: [line(basbousa)] }),
    ).rejects.toThrow("واقف");
  });

  test("rejects a shop outside its hours", async () => {
    const { t, asUser, market, addressId, milk } = await setup();
    await t.run((ctx) => ctx.db.patch(market, { hours: [] }));
    await expect(
      asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(milk)] }),
    ).rejects.toThrow("مقفول");
  });

  test("rejects a subtotal under the shop's minimum order", async () => {
    const { asUser, market, addressId, bread } = await setup();
    await expect(
      asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(bread)] }),
    ).rejects.toThrow("أقل طلب");
  });

  test("rejects someone else's address and bad quantities", async () => {
    const { asUser, market, addressId, otherAddressId, milk } = await setup();
    await expect(
      asUser.mutation(api.orders.place, { shopId: market, addressId: otherAddressId, note: "", items: [line(milk)] }),
    ).rejects.toThrow("العنوان");
    await expect(
      asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(milk, 0.5)] }),
    ).rejects.toThrow("كمية");
  });

  test("other users can't read the order", async () => {
    const { t, asUser, market, addressId, milk } = await setup();
    const orderId = await asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(milk)] });
    const otherId = await t.run(async (ctx) => (await ctx.db.query("users").collect())[1]._id);
    expect(await t.withIdentity({ subject: `${otherId}|s` }).query(api.orders.get, { orderId })).toBeNull();
  });
});

describe("orders.cancel", () => {
  test("customers can cancel while the order is created, not after it's confirmed", async () => {
    const { t, asUser, market, addressId, milk } = await setup();
    const first = await asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(milk)] });
    await asUser.mutation(api.orders.cancel, { orderId: first });
    expect((await asUser.query(api.orders.get, { orderId: first }))?.status).toBe("cancelled");
    await expect(asUser.mutation(api.orders.cancel, { orderId: first })).rejects.toThrow("اتلغى قبل كده");

    const second = await asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(milk)] });
    await t.run((ctx) => ctx.db.patch(second, { status: "confirmed" }));
    await expect(asUser.mutation(api.orders.cancel, { orderId: second })).rejects.toThrow("مينفعش");
  });

  test("other users can't cancel someone's order", async () => {
    const { t, asUser, market, addressId, milk } = await setup();
    const orderId = await asUser.mutation(api.orders.place, { shopId: market, addressId, note: "", items: [line(milk)] });
    const otherId = await t.run(async (ctx) => (await ctx.db.query("users").collect())[1]._id);
    await expect(
      t.withIdentity({ subject: `${otherId}|s` }).mutation(api.orders.cancel, { orderId }),
    ).rejects.toThrow("غير موجود");
  });
});
