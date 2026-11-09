import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

test("catalog queries render empty for signed-out visitors instead of throwing", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  expect(await t.query(api.catalog.shops, {})).toEqual([]);
  expect(await t.query(api.catalog.categories, {})).toEqual([]);
  expect(await t.query(api.catalog.shop, { shopId: "not-an-id" })).toBeNull();
});

test("missing or malformed ids return null instead of throwing", async () => {
  const t = convexTest(schema, modules);
  const userId = await t.run((ctx) => ctx.db.insert("users", { name: "سارة", phone: "01012345678", role: "customer" }));
  const asUser = t.withIdentity({ subject: `${userId}|session` });
  expect(await asUser.query(api.catalog.shop, { shopId: "not-an-id" })).toBeNull();
  expect(await asUser.query(api.catalog.product, { productId: "not-an-id" })).toBeNull();
  expect(await asUser.query(api.catalog.shops, { categoryId: "not-an-id" })).toEqual([]);
});
