import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { orderStatus } from "./lib/orderStatus";

export const weeklyHours = v.array(
  v.object({
    day: v.number(),
    open: v.number(),
    close: v.number(),
  }),
);

export const optionGroup = v.object({
  key: v.string(),
  name: v.string(),
  min: v.number(),
  max: v.number(),
  options: v.array(
    v.object({ key: v.string(), name: v.string(), priceDelta: v.number() }),
  ),
});

export const cartSelection = v.object({
  groupKey: v.string(),
  optionKeys: v.array(v.string()),
});

export const geoPoint = v.object({ lat: v.number(), lng: v.number() });

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("customer"), v.literal("admin"))),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // One row per device; a token moves to whoever signed in last on that device.
  pushTokens: defineTable({
    token: v.string(),
    userId: v.id("users"),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  zones: defineTable({
    name: v.string(),
    kind: v.union(v.literal("city"), v.literal("village")),
    deliveryFee: v.number(),
    active: v.boolean(),
    sortOrder: v.number(),
  }).index("by_sort", ["sortOrder"]),

  addresses: defineTable({
    userId: v.id("users"),
    zoneId: v.id("zones"),
    label: v.string(),
    street: v.string(),
    landmark: v.string(),
    location: v.optional(geoPoint),
    isDefault: v.boolean(),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    name: v.string(),
    emoji: v.string(),
    tint: v.string(),
    sortOrder: v.number(),
  }).index("by_sort", ["sortOrder"]),

  shops: defineTable({
    name: v.string(),
    categoryId: v.id("categories"),
    description: v.string(),
    emoji: v.string(),
    tint: v.string(),
    imageUrl: v.optional(v.string()),
    hours: weeklyHours,
    paused: v.boolean(),
    minOrder: v.number(),
    prepMinutes: v.number(),
    rating: v.number(),
  }).index("by_category", ["categoryId"]),

  menuSections: defineTable({
    shopId: v.id("shops"),
    name: v.string(),
    sortOrder: v.number(),
  }).index("by_shop", ["shopId", "sortOrder"]),

  products: defineTable({
    shopId: v.id("shops"),
    sectionId: v.id("menuSections"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    emoji: v.string(),
    imageUrl: v.optional(v.string()),
    available: v.boolean(),
    optionGroups: v.array(optionGroup),
  })
    .index("by_shop", ["shopId"])
    .index("by_section", ["sectionId"]),

  drivers: defineTable({
    name: v.string(),
    phone: v.string(),
    active: v.boolean(),
  }),

  orders: defineTable({
    userId: v.id("users"),
    shopId: v.id("shops"),
    shopName: v.string(),
    address: v.object({
      zoneName: v.string(),
      label: v.string(),
      street: v.string(),
      landmark: v.string(),
      location: v.optional(geoPoint),
    }),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        optionsLabel: v.string(),
        unitPrice: v.number(),
        quantity: v.number(),
      }),
    ),
    note: v.string(),
    subtotal: v.number(),
    deliveryFee: v.number(),
    total: v.number(),
    payment: v.literal("cod"),
    status: orderStatus,
    history: v.array(
      v.object({ status: orderStatus, at: v.number(), by: v.id("users") }),
    ),
    driver: v.optional(v.object({ name: v.string(), phone: v.string() })),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
