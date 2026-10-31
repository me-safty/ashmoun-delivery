import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isOpenAt } from "@/convex/lib/hours";
import { MAX_QUANTITY } from "@/convex/lib/pricing";

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
              ? lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + line.quantity) } : l))
              : [...lines, { ...line, key }],
          };
        }),
      setQuantity: (key, quantity) =>
        set((state) => {
          const lines =
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l));
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

// Saved unit prices can go stale; the cart and checkout show the server's current prices.
export function useCartQuote() {
  const shop = useCart((s) => s.shop);
  const lines = useCart((s) => s.lines);
  return useQuery(
    api.orders.quote,
    shop && lines.length > 0
      ? {
          shopId: shop.id,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, selections: l.selections })),
        }
      : "skip",
  );
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

// Why the cart can't be ordered right now, or null when it can.
export function cartProblem(quote: ReturnType<typeof useCartQuote>, now: number) {
  if (quote === undefined) return null;
  if (quote.kind === "invalid") return quote.message;
  if (quote.paused) return "المحل واقف استقبال طلبات مؤقتاً، جرب كمان شوية";
  if (!isOpenAt(quote.hours, now)) return "المحل مقفول دلوقتي، تقدر تطلب لما يفتح";
  return null;
}
