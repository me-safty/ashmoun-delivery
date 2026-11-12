import { expect, test } from "vitest";
import { priceLine } from "./pricing";

const burger = {
  price: 80,
  optionGroups: [
    {
      key: "size",
      name: "الحجم",
      min: 1,
      max: 1,
      options: [
        { key: "single", name: "سنجل", priceDelta: 0 },
        { key: "double", name: "دبل", priceDelta: 35 },
      ],
    },
    {
      key: "extras",
      name: "إضافات",
      min: 0,
      max: 2,
      options: [
        { key: "cheese", name: "جبنة", priceDelta: 10 },
        { key: "bacon", name: "بيف بيكون", priceDelta: 15 },
      ],
    },
  ],
};

test("adds option deltas and labels", () => {
  expect(
    priceLine(burger, [
      { groupKey: "size", optionKeys: ["double"] },
      { groupKey: "extras", optionKeys: ["cheese", "bacon"] },
    ]),
  ).toEqual({ kind: "ok", unitPrice: 140, optionsLabel: "دبل، جبنة، بيف بيكون" });
});

test("rejects a missing required choice", () => {
  expect(priceLine(burger, []).kind).toBe("invalid");
});

test("rejects too many, duplicate, or unknown options", () => {
  const size = { groupKey: "size", optionKeys: ["single"] };
  expect(priceLine(burger, [size, { groupKey: "size", optionKeys: ["double"] }]).kind).toBe("invalid");
  expect(priceLine(burger, [{ groupKey: "size", optionKeys: ["single", "double"] }]).kind).toBe("invalid");
  expect(priceLine(burger, [size, { groupKey: "extras", optionKeys: ["cheese", "cheese"] }]).kind).toBe("invalid");
  expect(priceLine(burger, [size, { groupKey: "extras", optionKeys: ["ketchup"] }]).kind).toBe("invalid");
  expect(priceLine(burger, [size, { groupKey: "sauce", optionKeys: [] }]).kind).toBe("invalid");
});

test("rejects options that push the price below zero", () => {
  const discounted = {
    price: 10,
    optionGroups: [{ key: "d", name: "خصم", min: 1, max: 1, options: [{ key: "big", name: "كبير", priceDelta: -50 }] }],
  };
  expect(priceLine(discounted, [{ groupKey: "d", optionKeys: ["big"] }]).kind).toBe("invalid");
});
