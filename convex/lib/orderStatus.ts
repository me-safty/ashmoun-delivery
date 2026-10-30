import { v, type Infer } from "convex/values";

export const orderStatus = v.union(
  v.literal("created"),
  v.literal("confirmed"),
  v.literal("with_driver"),
  v.literal("delivered"),
  v.literal("returned"),
  v.literal("cancelled"),
);

export type OrderStatus = Infer<typeof orderStatus>;

export const nextStatuses: Record<OrderStatus, readonly OrderStatus[]> = {
  created: ["confirmed", "cancelled"],
  confirmed: ["with_driver", "cancelled"],
  with_driver: ["delivered", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return nextStatuses[from].includes(to);
}

export function canCustomerCancel(status: OrderStatus) {
  return status === "created";
}

export const statusLabels: Record<OrderStatus, string> = {
  created: "تم الإنشاء",
  confirmed: "مؤكد",
  with_driver: "مع المندوب",
  delivered: "تم التسليم",
  returned: "مرتجع",
  cancelled: "ملغي",
};
