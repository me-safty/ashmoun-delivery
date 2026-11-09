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
    category: "food",
    name: "برجر الميدان",
    description: "برجر لحم بلدي مشوي على الفحم",
    emoji: "🍔",
    tint: "#FDE7D9",
    kind: "برجر",
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
    kind: "بيتزا",
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
    kind: "مشويات",
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
    kind: "كشري",
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
    kind: "حلويات",
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
    kind: "عصائر",
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
    kind: "بقالة",
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
      const existing = await ctx.db.query("zones").filter((q) => q.eq("name", zone.name)).collect();
      if (existing.length > 0) {
        await ctx.db.patch(existing[0]._id, { ...zone, active: true, sortOrder });
      } else {
        await ctx.db.insert("zones", { ...zone, active: true, sortOrder });
      }
    }
    const categoryIds = new Map<CategoryKey, Id<"categories">>();
    for (const [sortOrder, { key, ...category }] of categories.entries()) {
      const existing = await ctx.db.query("categories").filter((q) => q.eq("name", category.name)).collect();
      let categoryId: Id<"categories">;
      if (existing.length > 0) {
        categoryId = existing[0]._id;
        await ctx.db.patch(categoryId, { ...category, sortOrder });
      } else {
        categoryId = await ctx.db.insert("categories", { ...category, sortOrder });
      }
      categoryIds.set(key, categoryId);
    }
    for (const { category, menu, paused = false, ...shop } of shops) {
      const categoryId = categoryIds.get(category);
      if (!categoryId) throw new Error(`unknown category ${category}`);
      const existingShop = await ctx.db.query("shops").filter((q) => q.eq("name", shop.name)).collect();
      let shopId: Id<"shops">;
      if (existingShop.length > 0) {
        shopId = existingShop[0]._id;
        await ctx.db.patch(shopId, { ...shop, categoryId, paused, sortOrder: shop.sortOrder });
      } else {
        shopId = await ctx.db.insert("shops", { ...shop, categoryId, paused, sortOrder: shop.sortOrder });
      }
      for (const [sortOrder, { section, products }] of menu.entries()) {
        const existingSection = await ctx.db.query("menuSections")
          .withIndex("by_shop", (q) => q.eq("shopId", shopId)).filter((q) => q.eq("name", section))
          .collect();
        let sectionId: Id<"menuSections">;
        if (existingSection.length > 0) {
          sectionId = existingSection[0]._id;
          await ctx.db.patch(sectionId, { name: section, sortOrder });
        } else {
          sectionId = await ctx.db.insert("menuSections", { shopId, name: section, sortOrder });
        }
        for (const { available = true, optionGroups = [], ...product } of products) {
          const existingProduct = await ctx.db.query("products")
          .withIndex("by_shop", (q) => q.eq("shopId", shopId)).filter((q) => q.eq("name", product.name))
          .collect();
          if (existingProduct.length > 0) {
            await ctx.db.patch(existingProduct[0]._id, {
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
      const existingDriver = await ctx.db.query("drivers").filter((q) => q.eq("name", driver.name)).collect();
      if (existingDriver.length > 0) {
        await ctx.db.patch(existingDriver[0]._id, { ...driver, active: true });
      } else {
        await ctx.db.insert("drivers", { ...driver, active: true });
      }
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
