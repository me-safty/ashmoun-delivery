import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  const ids = await t.run(async (ctx) => {
    const adminId = await ctx.db.insert("users", { name: "مدير", phone: "01112345678", role: "admin" });
    const customerId = await ctx.db.insert("users", { name: "سارة", phone: "01012345678", role: "customer" });
    const zone = (await ctx.db.query("zones").first())!;
    const shop = (await ctx.db.query("shops").first())!;
    const product = (await ctx.db.query("products").first())!;
    return { adminId, customerId, zoneId: zone._id, shopId: shop._id, productId: product._id };
  });
  return {
    t,
    asAdmin: t.withIdentity({ subject: `${ids.adminId}|s` }),
    asCustomer: t.withIdentity({ subject: `${ids.customerId}|s` }),
    ...ids,
  };
}

test("admins edit zone fees, pause shops and change products; inactive zones disappear for customers", async () => {
  const { t, asAdmin, asCustomer, zoneId, shopId, productId } = await setup();
  await asAdmin.mutation(api.adminCatalog.updateZone, { zoneId, deliveryFee: 12, active: false });
  await asAdmin.mutation(api.adminCatalog.setShopPaused, { shopId, paused: true });
  await asAdmin.mutation(api.adminCatalog.updateProduct, { productId, price: 99, available: false });
  const [zone, shop, product] = await t.run(async (ctx) =>
    Promise.all([ctx.db.get(zoneId), ctx.db.get(shopId), ctx.db.get(productId)]),
  );
  expect([zone?.deliveryFee, zone?.active, shop?.paused, product?.price, product?.available]).toEqual([12, false, true, 99, false]);
  expect((await asCustomer.query(api.zones.list, {})).some((z) => z._id === zoneId)).toBe(false);
});

test("rejects bad values and non-admins", async () => {
  const { asAdmin, asCustomer, zoneId, productId } = await setup();
  await expect(asAdmin.mutation(api.adminCatalog.updateZone, { zoneId, deliveryFee: -5, active: true })).rejects.toThrow();
  await expect(asAdmin.mutation(api.adminCatalog.updateProduct, { productId, price: 0, available: true })).rejects.toThrow();
  await expect(asCustomer.mutation(api.adminCatalog.updateZone, { zoneId, deliveryFee: 10, active: true })).rejects.toThrow("غير مسموح");
});

test("a price can't drop below what discount options subtract", async () => {
  const { t, asAdmin } = await setup();
  const kofta = await t.run(async (ctx) => (await ctx.db.query("products").collect()).find((p) => p.name === "كفتة بالكيلو")!._id);
  await expect(asAdmin.mutation(api.adminCatalog.updateProduct, { productId: kofta, price: 280, available: true })).rejects.toThrow("285");
  await asAdmin.mutation(api.adminCatalog.updateProduct, { productId: kofta, price: 300, available: true });
});
