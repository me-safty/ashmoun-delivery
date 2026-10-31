import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

async function setup() {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  const userId = await t.run((ctx) => ctx.db.insert("users", { name: "سارة", phone: "01012345678", role: "customer" }));
  const zoneId = await t.run(async (ctx) => (await ctx.db.query("zones").first())!._id);
  const asUser = t.withIdentity({ subject: `${userId}|session` });
  const add = (street: string) => asUser.mutation(api.addresses.create, { zoneId, label: "البيت", street, landmark: "" });
  return { asUser, add };
}

test("one default at a time, and removing the default promotes another", async () => {
  const { asUser, add } = await setup();
  const home = await add("شارع المدرسة");
  const work = await add("شارع البنك");
  await asUser.mutation(api.addresses.setDefault, { addressId: work });
  let mine = await asUser.query(api.addresses.mine, {});
  expect(mine.filter((a) => a.isDefault).map((a) => a._id)).toEqual([work]);

  await asUser.mutation(api.addresses.remove, { addressId: work });
  mine = await asUser.query(api.addresses.mine, {});
  expect(mine.map((a) => [a._id, a.isDefault])).toEqual([[home, true]]);
});

test("the last address can't be removed", async () => {
  const { asUser, add } = await setup();
  const only = await add("شارع المدرسة");
  await expect(asUser.mutation(api.addresses.remove, { addressId: only })).rejects.toThrow("عنوان واحد");
});
