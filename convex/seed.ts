import type { Infer } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import type { optionGroup } from "./schema";
import type { WeeklyHours } from "./lib/hours";

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
    emoji: "🍕",
    tint: "#FBE4EE",
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
    category: "food",
    name: "برجر الميدان",
    description: "برجر لحم بلدي مشوي على الفحم",
    emoji: "🍔",
    tint: "#FDE7D9",
    hours: everyDay(h(12), h(2)),
    minOrder: 50,
    prepMinutes: 25,
    rating: 4.7,
    sortOrder: 10,
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
    name: "بيتزا وفطير السلطان",
    description: "بيتزا إيطالي وفطير مشلتت على الفرن البلدي",
    emoji: "🍕",
    tint: "#FCE3E1",
    hours: everyDay(h(10), h(24)),
    minOrder: 60,
    prepMinutes: 30,
    rating: 4.5,
    sortOrder: 11,
    menu: [
      {
        section: "بيتزا",
        products: [
          {
            name: "بيتزا مارجريتا",
            description: "صوص طماطم وموتزاريلا",
            price: 70,
    emoji: "🐟",
            optionGroups: [size(30, 60), extras([["olives", "زيتون", 5], ["extra_cheese", "جبنة زيادة", 15]])],
          },
          { name: "بيتزا سوبر سوبريم", description: "سجق، بسطرمة، فلفل، مشروم", price: 110, emoji: "🍕", optionGroups: [size(35, 70)] },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "مشويات أبو علي",
    description: "كفتة وطرب وفراخ مشوية",
    emoji: "🍢",
    tint: "#F6E6D6",
    hours: everyDay(h(13), h(23), [FRIDAY]),
    minOrder: 100,
    prepMinutes: 40,
    rating: 4.8,
    sortOrder: 12,
    menu: [
      {
        section: "المشويات",
        products: [
          {
            name: "كفتة بالكيلو",
            description: "مع عيش وطحينة وسلطة",
            price: 380,
            emoji: "🍢",
            optionGroups: [
              {
                key: "weight",
                name: "الكمية",
                min: 1,
                max: 1,
                options: [
                  { key: "quarter", name: "ربع كيلو", priceDelta: -285 },
                  { key: "half", name: "نص كيلو", priceDelta: -190 },
                  { key: "kilo", name: "كيلو", priceDelta: 0 },
                ],
              },
            ],
          },
          { name: "نص فرخة مشوية", description: "مع أرز وسلطات", price: 140, emoji: "🍗" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "كشري التحرير أشمون",
    description: "كشري وطواجن ومكرونة",
    emoji: "🥙",
    tint: "#FFF1CC",
    hours: everyDay(h(9), h(1)),
    minOrder: 30,
    prepMinutes: 15,
    rating: 4.6,
    sortOrder: 13,
    menu: [
      {
        section: "كشري",
        products: [
          {
            name: "علبة كشري",
            description: "أرز، مكرونة، عدس، صلصة، دقة، تقلية",
            price: 30,
            emoji: "🍝",
            optionGroups: [size(10, 20), extras([["liver", "كبدة", 15], ["extra_fried_onion", "تقلية زيادة", 5]])],
          },
          { name: "طاجن مكرونة باللحمة", description: "", price: 60, emoji: "🥘" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "حلواني الشروق",
    description: "تورت وجاتوه وحلويات شرقي",
    emoji: "🍰",
    tint: "#FBE4EE",
    hours: everyDay(h(10), h(23)),
    paused: true,
    minOrder: 50,
    prepMinutes: 20,
    rating: 4.4,
    sortOrder: 14,
    menu: [
      {
        section: "حلويات",
        products: [
          { name: "بسبوسة بالقشطة", description: "ربع كيلو", price: 55, emoji: "🍮" },
          { name: "جاتوه شوكولاتة", description: "قطعة", price: 35, emoji: "🍰" },
        ],
      },
    ],
  },
  {
    category: "food",
    name: "عصير ركن الفاكهة",
    description: "عصائر فريش وسموزي",
    emoji: "🥤",
    tint: "#DDF3EA",
    hours: everyDay(h(8), h(2)),
    minOrder: 25,
    prepMinutes: 10,
    rating: 4.3,
    sortOrder: 15,
    menu: [
      {
        section: "عصائر",
        products: [
          { name: "مانجا", description: "فريش", price: 30, emoji: "🥭", optionGroups: [size(10, 20)] },
          { name: "قصب", description: "", price: 15, emoji: "🥤", optionGroups: [size(5, 10)] },
          { name: "سموزي فراولة", description: "فراولة ولبن", price: 40, emoji: "🍓" },
        ],
      },
    ],
  },
  {
    category: "groceries",
    name: "ماركت البركة",
    description: "بقالة وخضار ومنظفات",
    emoji: "🛒",
    tint: "#E3EEFB",
    hours: everyDay(0, 0),
    minOrder: 40,
    prepMinutes: 20,
    rating: 4.2,
    sortOrder: 16,
    menu: [
      {
        section: "ألبان",
        products: [
          { name: "لبن كامل الدسم 1 لتر", description: "", price: 42, emoji: "🥛" },
          { name: "جبنة بيضاء نص كيلو", description: "", price: 60, emoji: "🧀" },
        ],
      },
      {
        section: "بقالة",
        products: [
          { name: "عيش بلدي (5 أرغفة)", description: "", price: 10, emoji: "🫓" },
          { name: "أرز 1 كيلو", description: "", price: 38, emoji: "🍚" },
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
];

const drivers = [
  { name: "محمود حسن", phone: "01001234567" },
  { name: "أحمد سعيد", phone: "01112345678" },
];

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear previously seeded data so re-running reflects updated seed
    for (const table of ["products", "menuSections", "shops", "categories", "zones", "drivers"] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    for (const [sortOrder, zone] of zones.entries()) {
      await ctx.db.insert("zones", { ...zone, active: true, sortOrder });
    }
    const categoryIds = new Map<CategoryKey, Id<"categories">>();
    for (const [sortOrder, { key, ...category }] of categories.entries()) {
      categoryIds.set(key, await ctx.db.insert("categories", { ...category, sortOrder }));
    }
    for (const { category, menu, paused = false, ...shop } of shops) {
      const categoryId = categoryIds.get(category);
      if (!categoryId) throw new Error(`unknown category ${category}`);
      const shopId = await ctx.db.insert("shops", { ...shop, categoryId, paused, sortOrder: shop.sortOrder });
      for (const [sortOrder, { section, products }] of menu.entries()) {
        const sectionId = await ctx.db.insert("menuSections", { shopId, name: section, sortOrder });
        for (const { available = true, optionGroups = [], ...product } of products) {
          await ctx.db.insert("products", { ...product, shopId, sectionId, available, optionGroups });
        }
      }
    }
    for (const driver of drivers) {
      await ctx.db.insert("drivers", { ...driver, active: true });
    }
    return "seeded";
  },
});

const CATEGORY_ALIASES: Record<string, string[]> = {
  الطعام: ["مطاعم"],
  الصيدليات: ["صيدليات", "صيدلية"],
  البقالة: ["بقالة"],
  الورود: ["زهور"],
};

async function upsertSeedCategories(ctx: { db: any }) {
  const existing = await ctx.db.query("categories").collect();
  const results: { name: string; action: "inserted" | "updated" }[] = [];
  for (const [sortOrder, { key: _key, ...category }] of categories.entries()) {
    const aliases = CATEGORY_ALIASES[category.name] ?? [];
    const row = existing.find(
      (c: { name: string }) => c.name === category.name || aliases.includes(c.name),
    );
    if (row) {
      await ctx.db.patch(row._id, { ...category, sortOrder });
      results.push({ name: category.name, action: "updated" });
    } else {
      await ctx.db.insert("categories", { ...category, sortOrder });
      results.push({ name: category.name, action: "inserted" });
    }
  }
  return results;
}

// Ensures the seed categories exist (matched by name). Inserts missing sections and updates
// emoji/tint/sortOrder for existing ones without deleting shops or other data.
export const upsertCategories = internalMutation({
  args: {},
  handler: async (ctx) => upsertSeedCategories(ctx),
});

// Backward-compatible alias.
export const syncCategories = internalMutation({
  args: {},
  handler: async (ctx) => upsertSeedCategories(ctx),
});
