import type { Infer } from "convex/values";
import type { cartSelection, optionGroup } from "../schema";

type OptionGroup = Infer<typeof optionGroup>;
type Selection = Infer<typeof cartSelection>;

export type PricedLine =
  | { kind: "ok"; unitPrice: number; optionsLabel: string }
  | { kind: "invalid"; reason: string };

export function priceLine(
  product: { price: number; optionGroups: OptionGroup[] },
  selections: Selection[],
): PricedLine {
  const known = new Set(product.optionGroups.map((g) => g.key));
  const unknown = selections.find((s) => !known.has(s.groupKey));
  if (unknown) return { kind: "invalid", reason: `unknown group ${unknown.groupKey}` };
  if (new Set(selections.map((s) => s.groupKey)).size !== selections.length) {
    return { kind: "invalid", reason: "group selected twice" };
  }

  let unitPrice = product.price;
  const labels: string[] = [];
  for (const group of product.optionGroups) {
    const keys = selections.find((s) => s.groupKey === group.key)?.optionKeys ?? [];
    if (new Set(keys).size !== keys.length) {
      return { kind: "invalid", reason: `duplicate option in ${group.key}` };
    }
    if (keys.length < group.min || keys.length > group.max) {
      return { kind: "invalid", reason: `${group.name}: choose ${group.min}-${group.max}` };
    }
    for (const key of keys) {
      const option = group.options.find((o) => o.key === key);
      if (!option) return { kind: "invalid", reason: `unknown option ${key}` };
      unitPrice += option.priceDelta;
      labels.push(option.name);
    }
  }
  if (unitPrice < 0) return { kind: "invalid", reason: "negative price" };
  return { kind: "ok", unitPrice, optionsLabel: labels.join("، ") };
}
