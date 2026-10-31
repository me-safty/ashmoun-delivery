import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Id } from "@/convex/_generated/dataModel";

export type CartSelection = { groupKey: string; optionKeys: string[] };

export type CartLine = {
  key: string;
  productId: Id<"products">;
  name: string;
  emoji: string;
  optionsLabel: string;
  selections: CartSelection[];
  unitPrice: number;
  quantity: number;
};

type CartShop = { id: Id<"shops">; name: string };

type CartState = {
  shop: CartShop | null;
  lines: CartLine[];
  add: (shop: CartShop, line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

function lineKey(productId: string, selections: CartSelection[]) {
  const normalized = selections
    .map((s) => `${s.groupKey}:${[...s.optionKeys].sort().join(",")}`)
    .sort()
    .join("|");
  return `${productId}#${normalized}`;
}

// One shop per order: adding from another shop replaces the cart (the caller confirms first).
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      shop: null,
      lines: [],
      add: (shop, line) =>
        set((state) => {
          const lines = state.shop?.id === shop.id ? state.lines : [];
          const key = lineKey(line.productId, line.selections);
          const existing = lines.find((l) => l.key === key);
          return {
            shop,
            lines: existing
              ? lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l))
              : [...lines, { ...line, key }],
          };
        }),
      setQuantity: (key, quantity) =>
        set((state) => {
          const lines =
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l));
          return lines.length === 0 ? { shop: null, lines } : { lines };
        }),
      clear: () => set({ shop: null, lines: [] }),
    }),
    { name: "cart", storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
