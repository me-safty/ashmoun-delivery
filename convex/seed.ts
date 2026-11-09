import type { Infer } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import type { WeeklyHours } from "./lib/hours";
import type { optionGroup } from "./schema";

const h = (hour: number) => hour * 60;
const everyDay = (open: number, close: number, closedDays: number[] = []): WeeklyHours =>
  [0, 1, 2, 3, 4, 5, 6]
    .filter((day) => !closedDays.includes(day))
    .map((day) => ({ day, open, close }));

const FRIDAY = 5;

const zones = [
  { name: "أشمون (المدينة)", kind: "city", deliveryFee: 10 },
  { name: "سمادون", kind: "village", deliveryFee: 15 },
  { name: "ساقية أبو شعرة", kind: "village", deliveryFee: 15 },
  { name: "جريس", kind: "village", deliveryFee: 15 },
  { name: "الفرعونية", kind: "village", deliveryFee: 17 },
  { name: "شما", kind: "village", deliveryFee: 17 },
  { name: "طهواي", kind: "village", deliveryFee: 20 },
  { name: "دروة", kind: "village", deliveryFee: 20 },
] as const;

const categories = [
  { key: "food", name: "الطعام", emoji: "🍔", tint: "#FDE7D9" },
  { key: "pharmacies", name: "الصيدليات", emoji: "💊", tint: "#E6F4F1" },
  { key: "groceries", name: "البقالة", emoji: "🛍️", tint: "#E3EEFB" },
  { key: "flowers", name: "الورود", emoji: "💐", tint: "#FCE7F1" },
] as const;

type CategoryKey = (typeof categories)[number]["key"];
type OptionGroup = Infer<typeof optionGroup>;
type SeedProduct = {
  name: string;
  description: string;
  price: number;
  emoji: string;
  available?: boolean;
  optionGroups?: OptionGroup[];
};

const size = (medium: number, large: number): OptionGroup => ({
  key: "size",
  name: "الحجم",
  min: 1,
  max: 1,
  options: [
    { key: "small", name: "صغير", priceDelta: 0 },
    { key: "medium", name: "وسط", priceDelta: medium },
    { key: "large", name: "كبير", priceDelta: large },
  ],
});

const extras = (options: [key: string, name: string, priceDelta: number][]): OptionGroup => ({
  key: "extras",
  name: "إضافات",
  min: 0,
  max: options.length,
  options: options.map(([key, name, priceDelta]) => ({ key, name, priceDelta })),
});

const shops: {
  category: CategoryKey;
  name: string;
  description: string;
  emoji: string;
  tint: string;
  kind?: string;
  imageUrl?: string;
  hours: WeeklyHours;
  paused?: boolean;
  minOrder: number;
  prepMinutes: number;
  rating: number;
  sortOrder: number;
  menu: { section: string; products: SeedProduct[] }[];
}[] = [
  {
    category: "food",
    name: "جوهر",
    description: "مطعم جوهر المميز",
    emoji: "🍔",
    tint: "#FDE7D9",
    kind: "وجبات سريعة",
    imageUrl: "https://res.cloudinary.com/dofy7vd1y/image/upload/v1774471754/WhatsApp_Image_2026-03-16_at_11.51.55_vvlr31.jpg",
    hours: everyDay(h(12), h(2)),
    minOrder: 50,
    prepMinutes: 25,
    rating: 4.7,
    sortOrder: 1,
    menu: [
      {
        section: "البرجر",
        products: [
          {
            name: "كلاسيك برجر",
            description: "لحم 150 جم، خس، طماطم، صوص الميدان",
            price: 85,
            emoji: "🍔",
            optionGroups: [
              {
                key: "patty",
                name: "عدد القطع",
                min: 1,
                max: 1,
                options: [
                  { key: "single", name: "سنجل", priceDelta: 0 },
                  { key: "double", name: "دبل", priceDelta: 45 },
                ],
              },
              extras([
                ["cheese", "جبنة شيدر", 10],
                ["bacon", "بيف بيكون", 20],
                ["jalapeno", "هالبينو", 5],
              ]),
            ],
          },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "فولكانو",
    description: "فولكانو - برجر حار ومميز",
    emoji: "🌋",
    tint: "#FCE3E1",
    kind: "برجر",
    imageUrl: "https://res.cloudinary.com/dofy7vd1y/image/upload/v1774471271/download_1_zh5neh.jpg",
    hours: everyDay(h(10), h(24)),
    minOrder: 60,
    prepMinutes: 30,
    rating: 4.5,
    sortOrder: 2,
    menu: [
      {
        section: "البرجر",
        products: [
          { name: "فولكانو برجر", description: "برجر حار مع جبنة", price: 95, emoji: "🍔" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "كاتشب",
    description: "كاتشب - وجبات سريعة ولذيذة",
    emoji: "🍟",
    tint: "#FFF1CC",
    kind: "وجبات سريعة",
    imageUrl: "https://res.cloudinary.com/dofy7vd1y/image/upload/v1774471622/download_2_nhxjwq.jpg",
    hours: everyDay(h(9), h(1)),
    minOrder: 30,
    prepMinutes: 15,
    rating: 4.6,
    sortOrder: 3,
    menu: [
      {
        section: "وجبات",
        products: [
          { name: "ميل كاتشب", description: "برجر + بطاطس + مشروب", price: 75, emoji: "🍔" },
          { name: "بطاطس", description: "بطاطس مقلية مقرمشة", price: 25, emoji: "🍟" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "مكسيكانو",
    description: "مكسيكانو - نكهات مكسيكية",
    emoji: "🌮",
    tint: "#F6E6D6",
    kind: "مكسيكي",
    imageUrl: "https://scontent.faly1-2.fna.fbcdn.net/v/t39.30808-6/657856989_1342281547921183_8981128263191348942_n.jpg?stp=dst-jpg_tt6&cstp=mx960x960&ctp=s960x960&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFG-v9VRNLi1uV7G5bJOLNcgddT9LSd4MGB11P0tJ3gwa4YksMhijCKPSNICgZeoOkR_w0SqgfaN_d3qgybYSvh&_nc_ohc=8YQxiKbGvqAQ7kNvwHniIBH&_nc_oc=AdpXPbPH4MDo34mzAzaSTihhyYtjoDhQokJy-kXJ52swvmjv-cMir4QftHNGcQR-OC0&_nc_zt=23&_nc_ht=scontent.faly1-2.fna&_nc_gid=AhmuxkEcuUNALkOlbxe2yg&_nc_ss=7b2a8&oh=00_AQRboprTe_fshP-ydOP8vHFuP8hW24uIonDXnKWXP1o51Q&oe=6AF7B970",
    hours: everyDay(h(13), h(23), [FRIDAY]),
    minOrder: 100,
    prepMinutes: 40,
    rating: 4.8,
    sortOrder: 4,
    menu: [
      {
        section: "مكسيكي",
        products: [
          { name: "تاكو", description: "تاكو لحم مع صوص", price: 45, emoji: "🌮" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "الأصلى",
    description: "الأصلى - أكل بيتي أصيل",
    emoji: "🍲",
    tint: "#E3EEFB",
    kind: "أكل بيتي",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdolUeSraRvA_n5Bn3XdfSun6c4D7nNu6ePE4Hj4ud2g&s=10",
    hours: everyDay(h(10), h(23)),
    paused: true,
    minOrder: 50,
    prepMinutes: 20,
    rating: 4.4,
    sortOrder: 5,
    menu: [
      {
        section: "رئيسية",
        products: [
          { name: "مقلوبة", description: "أرز ولحمة وخضار", price: 85, emoji: "🍚" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "ابو يارا",
    description: "ابو يارا - مشويات ومشروبات",
    emoji: "🍢",
    tint: "#DDF3EA",
    kind: "مشويات",
    imageUrl: "https://api.mat3am.net/assets/2021/12/19/png/ac7ed4db-91cb-4f4a-af8d-1c3037507e72.png",
    hours: everyDay(h(8), h(2)),
    minOrder: 25,
    prepMinutes: 10,
    rating: 4.3,
    sortOrder: 6,
    menu: [
      {
        section: "مشويات",
        products: [
          { name: "شيش طاووق", description: "صدور دجاج مشوية", price: 80, emoji: "🍢" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "البرنس",
    description: "البرنس - بيتزا وفطائر",
    emoji: "🐟",
    tint: "#FBE4EE",
    kind: "أسماك",
    hours: everyDay(h(10), h(23)),
    minOrder: 50,
    prepMinutes: 25,
    rating: 4.5,
    sortOrder: 7,
    menu: [
      {
        section: "بيتزا",
        products: [
          { name: "بيتزا مارجريتا", description: "جبنة وصلصة طماطم", price: 70, emoji: "🍕" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "قرمشة",
    description: "قرمشة - وجبات مقرمشة",
    emoji: "🥪",
    tint: "#FDE7D9",
    kind: "سندوتشات",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMw8ZNLOh10ITTWdXf7Q5byJ14KAxmLj1Xtob8pDckpg&s=10",
    hours: everyDay(h(12), h(2)),
    minOrder: 50,
    prepMinutes: 25,
    rating: 4.7,
    sortOrder: 8,
    menu: [
      {
        section: "سندوتشات",
        products: [
          { name: "سندوتش برجر", description: "لحم مع خس وطماطم", price: 55, emoji: "🍔" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "سعيد السورى",
    description: "سعيد السورى - شاورما ومشاوي",
    emoji: "🥙",
    tint: "#E6F4F1",
    kind: "شاورما",
    hours: everyDay(h(9), h(3)),
    minOrder: 0,
    prepMinutes: 15,
    rating: 4.9,
    sortOrder: 9,
    menu: [
      {
        section: "شاورما",
        products: [
          { name: "شاورما فراخ", description: "مع ثومية ومخلل", price: 40, emoji: "🥙" },
        ],
      },
    ],
  },
  {
    category: "pharmacies",
    name: "صيدلية الشفاء",
    description: "أدوية ومستلزمات طبية",
    emoji: "💊",
    tint: "#E6F4F1",
    kind: "صيدلية",
    hours: everyDay(h(9), h(3)),
    minOrder: 0,
    prepMinutes: 15,
    rating: 4.9,
    sortOrder: 17,
    menu: [
      {
        section: "مستلزمات",
        products: [
          { name: "باراسيتامول 500 مجم", description: "شريط 20 قرص", price: 25, emoji: "💊" },
          { name: "كمامات طبية", description: "علبة 50 قطعة", price: 45, emoji: "😷" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "شاورما الشام",
    description: "شاورما الشام - شاورما وفلافل",
    emoji: "🥙",
    tint: "#FCE3E1",
    kind: "شاورما",
    imageUrl: "https://scontent.faly1-2.fna.fbcdn.net/v/t39.30808-1/742381621_984814701235422_5385788468906646427_n.jpg?stp=dst-jpg_tt6&cstp=mx1080x1073&ctp=s200x200&_nc_cat=107&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=2d3e12&_nc_eui2=AeEEeRxAt9veLsjoJI7KQ0-0px8Ep0CjJaOnHwSnQKMlo6pXiHO4w7ZumRrYxNqVRdxVmiX8GHBj1zHIb_dyfK5h&_nc_ohc=aGxVr87WUEQQ7kNvwFStTVN&_nc_oc=Ado-W8MePHWHWGCKOGbr36P21kPXhgjjI0Vk8QRyoxF27H-Ow4PtIkTGVHePFMj39zQ&_nc_zt=24&_nc_ht=scontent.faly1-2.fna&_nc_gid=g7k9GPXUWBiE7eNBdlT-jw&_nc_ss=7b2a8&oh=00_AQSU6c15kSUVOu2zs-h7K9pGCEcxJ689rDnfDZDGkf6hGw&oe=6AF7CBE8",
    hours: everyDay(h(9), h(3)),
    minOrder: 30,
    prepMinutes: 15,
    rating: 4.8,
    sortOrder: 18,
    menu: [
      {
        section: "شاورما",
        products: [
          { name: "شاورما دجاج", description: "مع ثومية ومخلل", price: 35, emoji: "🥙" },
          { name: "فلافل", description: "فلافل طازج", price: 15, emoji: "🧆" },
        ],
      },
    ],
  },
];

const drivers = [
  { name: "محمود حسن", phone: "01001234567" },
  { name: "أحمد سعيد", phone: "01112345678" },
];

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Upsert zones without clearing existing data
    for (const [sortOrder, zone] of zones.entries()) {
      const existing = await ctx.db.query("zones").filter((q) => q.eq(q.field("name"), zone.name)).collect();
      const keeperZone = existing.sort((a, b) => a._creationTime - b._creationTime)[0];
      if (keeperZone !== undefined) {
        await ctx.db.patch(keeperZone._id, { ...zone, active: true, sortOrder });
      } else {
        await ctx.db.insert("zones", { ...zone, active: true, sortOrder });
      }
    }
    await dedupeZonesByName(ctx);
    const categoryIds: Map<CategoryKey, Id<"categories">> = await canonicalCategories(ctx);
    for (const { category, menu, paused = false, ...shop } of shops) {
      const categoryId = categoryIds.get(category);
      if (!categoryId) throw new Error(`unknown category ${category}`);
      const existingShop = await ctx.db.query("shops").filter((q) => q.eq(q.field("name"), shop.name)).collect();
      // Patch the row the dedupe keeps (the oldest, since plain scans return rows in
      // ascending creation order) so the fields aren't lost when duplicates collapse.
      const keeperShop = existingShop.sort((a, b) => a._creationTime - b._creationTime)[0];
      let shopId: Id<"shops">;
      if (keeperShop !== undefined) {
        shopId = keeperShop._id;
        await ctx.db.patch(shopId, { ...shop, categoryId, paused, sortOrder: shop.sortOrder });
      } else {
        shopId = await ctx.db.insert("shops", { ...shop, categoryId, paused, sortOrder: shop.sortOrder });
      }
      for (const [sortOrder, { section, products }] of menu.entries()) {
        const existingSection = await ctx.db.query("menuSections")
          .withIndex("by_shop", (q) => q.eq("shopId", shopId)).filter((q) => q.eq(q.field("name"), section))
          .collect();
        const keeperSection = existingSection.sort((a, b) => a._creationTime - b._creationTime)[0];
        let sectionId: Id<"menuSections">;
        if (keeperSection !== undefined) {
          sectionId = keeperSection._id;
          await ctx.db.patch(sectionId, { name: section, sortOrder });
        } else {
          sectionId = await ctx.db.insert("menuSections", { shopId, name: section, sortOrder });
        }
        for (const { available = true, optionGroups = [], ...product } of products) {
          const existingProduct = await ctx.db.query("products")
          .withIndex("by_shop", (q) => q.eq("shopId", shopId)).filter((q) => q.eq(q.field("name"), product.name))
          .collect();
          const keeperProduct = existingProduct.sort((a, b) => a._creationTime - b._creationTime)[0];
          if (keeperProduct !== undefined) {
            await ctx.db.patch(keeperProduct._id, {
              ...product,
              shopId,
              sectionId,
              available,
              optionGroups,
            });
          } else {
            await ctx.db.insert("products", { ...product, shopId, sectionId, available, optionGroups });
          }
        }
      }
    }
    for (const driver of drivers) {
      const existingDriver = await ctx.db.query("drivers").filter((q) => q.eq(q.field("name"), driver.name)).collect();
      const keeperDriver = existingDriver.sort((a, b) => a._creationTime - b._creationTime)[0];
      if (keeperDriver !== undefined) {
        await ctx.db.patch(keeperDriver._id, { ...driver, active: true });
      } else {
        await ctx.db.insert("drivers", { ...driver, active: true });
      }
    }
    // Collapse anything that slipped through as a duplicate (e.g. a previous seed run
    // inserted the same name under a re-created deployment).
    await dedupeShopsByName(ctx);
    await dedupeDriversByName(ctx);
    await dedupeMenu(ctx);
    return "seeded";
  },
});

// Old spellings that earlier seed generations stored under different names; every one of
// them must be merged onto the canonical row so re-seeding cannot stack duplicates.
const CATEGORY_ALIASES: Record<string, string[]> = {
  الطعام: ["مطاعم", "طعام"],
  الصيدليات: ["صيدليات", "صيدلية", "صيديليات"],
  البقالة: ["بقالة", "بقاليات"],
  الورود: ["زهور", "زهورات"],
};

// One row per canonical category, with its fields synced and every alias (or exact-name
// duplicate) merged into it. Shops pointing at a merged row are re-pointed at the keeper
// before the row is deleted, keeping every `categoryId` valid.
async function canonicalCategories(ctx: MutationCtx): Promise<Map<CategoryKey, Id<"categories">>> {
  const categoryIds = new Map<CategoryKey, Id<"categories">>();
  for (const [sortOrder, { key, ...category }] of categories.entries()) {
    const aliases = CATEGORY_ALIASES[category.name] ?? [];
    const matches = (await ctx.db.query("categories").collect()).filter(
      (row) => row.name === category.name || aliases.includes(row.name),
    );
    if (matches.length === 0) {
      categoryIds.set(key, await ctx.db.insert("categories", { ...category, sortOrder }));
      continue;
    }
    // Prefer a row that already carries the canonical name, oldest wins on ties.
    const keeper = matches.find((row) => row.name === category.name) ?? matches[0];
    await ctx.db.patch(keeper._id, { ...category, sortOrder });
    for (const row of matches) {
      if (row._id === keeper._id) continue;
      for (const shop of await ctx.db
        .query("shops")
        .withIndex("by_category", (q) => q.eq("categoryId", row._id))
        .collect()) {
        await ctx.db.patch(shop._id, { categoryId: keeper._id });
      }
      await ctx.db.delete(row._id);
    }
    categoryIds.set(key, keeper._id);
  }
  return categoryIds;
}

// Collapses shops that share a name onto their oldest row: menu sections and products are
// migrated onto the keeper (duplicate section names map onto the keeper's section), orders
// are re-pointed, and the duplicate shop row is deleted.
async function dedupeShopsByName(ctx: MutationCtx): Promise<number> {
  const shops = await ctx.db.query("shops").collect();
  const keepers = new Map<string, Doc<"shops">>();
  let removed = 0;
  for (const shop of shops) {
    // The plain scan returns rows in ascending creation order, so the first row per name wins.
    const keeper = keepers.get(shop.name);
    if (keeper === undefined) {
      keepers.set(shop.name, shop);
      continue;
    }
    const keeperSections = await ctx.db
      .query("menuSections")
      .withIndex("by_shop", (q) => q.eq("shopId", keeper._id))
      .collect();
    for (const section of await ctx.db
      .query("menuSections")
      .withIndex("by_shop", (q) => q.eq("shopId", shop._id))
      .collect()) {
      const replacement = keeperSections.find((s) => s.name === section.name);
      if (replacement !== undefined) {
        for (const product of await ctx.db
          .query("products")
          .withIndex("by_section", (q) => q.eq("sectionId", section._id))
          .collect()) {
          await ctx.db.patch(product._id, { shopId: keeper._id, sectionId: replacement._id });
        }
        await ctx.db.delete(section._id);
      } else {
        await ctx.db.patch(section._id, { shopId: keeper._id });
        for (const product of await ctx.db
          .query("products")
          .withIndex("by_section", (q) => q.eq("sectionId", section._id))
          .collect()) {
          await ctx.db.patch(product._id, { shopId: keeper._id });
        }
      }
    }
    for (const product of await ctx.db
      .query("products")
      .withIndex("by_shop", (q) => q.eq("shopId", shop._id))
      .collect()) {
      await ctx.db.patch(product._id, { shopId: keeper._id });
    }
    for (const order of (await ctx.db.query("orders").collect()).filter((o) => o.shopId === shop._id)) {
      await ctx.db.patch(order._id, { shopId: keeper._id });
    }
    await ctx.db.delete(shop._id);
    removed += 1;
  }
  return removed;
}

// Same treatment for zones: addresses pointing at a merged zone are re-pointed first.
async function dedupeZonesByName(ctx: MutationCtx): Promise<number> {
  const zones = await ctx.db.query("zones").collect();
  const keepers = new Map<string, Doc<"zones">>();
  let removed = 0;
  for (const zone of zones) {
    const keeper = keepers.get(zone.name);
    if (keeper === undefined) {
      keepers.set(zone.name, zone);
      continue;
    }
    for (const address of (await ctx.db.query("addresses").collect()).filter((a) => a.zoneId === zone._id)) {
      await ctx.db.patch(address._id, { zoneId: keeper._id });
    }
    await ctx.db.delete(zone._id);
    removed += 1;
  }
  return removed;
}

async function dedupeDriversByName(ctx: MutationCtx): Promise<number> {
  const drivers = await ctx.db.query("drivers").collect();
  const seen = new Set<string>();
  let removed = 0;
  for (const driver of drivers) {
    if (seen.has(driver.name)) {
      await ctx.db.delete(driver._id);
      removed += 1;
    } else {
      seen.add(driver.name);
    }
  }
  return removed;
}

// Merges duplicate menu sections and products left inside one shop by repeated seed runs:
// each (shop, name) pair keeps its oldest row, products under a merged section are re-pointed
// first, and only truly duplicate product rows are deleted.
async function dedupeMenu(ctx: MutationCtx): Promise<{ sections: number; products: number }> {
  let removedSections = 0;
  let removedProducts = 0;
  const sections = await ctx.db.query("menuSections").collect();
  const keeperSections = new Map<string, Doc<"menuSections">>();
  for (const section of sections) {
    const key = `${section.shopId}|${section.name}`;
    const keeper = keeperSections.get(key);
    if (keeper === undefined) {
      keeperSections.set(key, section);
      continue;
    }
    for (const product of await ctx.db
      .query("products")
      .withIndex("by_section", (q) => q.eq("sectionId", section._id))
      .collect()) {
      await ctx.db.patch(product._id, { sectionId: keeper._id });
    }
    await ctx.db.delete(section._id);
    removedSections += 1;
  }
  const products = await ctx.db.query("products").collect();
  const keeperProducts = new Set<string>();
  for (const product of products) {
    const key = `${product.shopId}|${product.name}`;
    if (keeperProducts.has(key)) {
      await ctx.db.delete(product._id);
      removedProducts += 1;
    } else {
      keeperProducts.add(key);
    }
  }
  return { sections: removedSections, products: removedProducts };
}

// Fixes seed data that was inserted more than once: merges duplicate/aliased categories,
// zones, shops and drivers back onto their canonical rows without dropping any reference.
export const cleanupDuplicates = internalMutation({
  args: {},
  handler: async (ctx) => {
    await canonicalCategories(ctx);
    const removedZones = await dedupeZonesByName(ctx);
    const removedShops = await dedupeShopsByName(ctx);
    const removedDrivers = await dedupeDriversByName(ctx);
    const menu = await dedupeMenu(ctx);
    return { removedZones, removedShops, removedDrivers, menu };
  },
});

// Ensures the seed categories exist (matched by canonical name or an old alias). Inserts missing
// ones, updates emoji/tint/sortOrder for existing ones, and merges duplicates — without
// deleting shops or other data.
export const upsertCategories = internalMutation({
  args: {},
  handler: async (ctx) => await canonicalCategories(ctx),
});

// Backward-compatible alias.
export const syncCategories = internalMutation({
  args: {},
  handler: async (ctx) => await canonicalCategories(ctx),
});
