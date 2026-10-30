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
  { key: "burger", name: "مطاعم وبرجر", emoji: "🍔", tint: "#FDE7D9" },
  { key: "pizza", name: "بيتزا وفطير", emoji: "🍕", tint: "#FCE3E1" },
  { key: "grill", name: "مشويات", emoji: "🍢", tint: "#F6E6D6" },
  { key: "koshary", name: "كشري وفول", emoji: "🥙", tint: "#FFF1CC" },
  { key: "sweets", name: "حلويات", emoji: "🍰", tint: "#FBE4EE" },
  { key: "cafe", name: "عصائر وكافيه", emoji: "🥤", tint: "#DDF3EA" },
  { key: "market", name: "سوبر ماركت", emoji: "🛒", tint: "#E3EEFB" },
  { key: "pharmacy", name: "صيدليات", emoji: "💊", tint: "#E6F4F1" },
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
  menu: { section: string; products: SeedProduct[] }[];
}[] = [
  {
    category: "burger",
    name: "برجر الميدان",
    description: "برجر لحم بلدي مشوي على الفحم",
    emoji: "🍔",
    tint: "#FDE7D9",
    hours: everyDay(h(12), h(2)),
    minOrder: 50,
    prepMinutes: 25,
    rating: 4.7,
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
          {
            name: "تشيكن كرسبي",
            description: "صدور فراخ مقرمشة مع صوص رانش",
            price: 75,
            emoji: "🍗",
            optionGroups: [extras([["cheese", "جبنة شيدر", 10]])],
          },
          { name: "برجر مشروم", description: "صوص مشروم وجبنة سويسري", price: 105, emoji: "🍄", available: false },
        ],
      },
      {
        section: "جانبي",
        products: [
          { name: "بطاطس", description: "بطاطس مقلية بالتتبيلة", price: 25, emoji: "🍟", optionGroups: [size(10, 20)] },
          { name: "حلقات بصل", description: "8 قطع", price: 30, emoji: "🧅" },
        ],
      },
    ],
  },
  {
    category: "pizza",
    name: "بيتزا وفطير السلطان",
    description: "بيتزا إيطالي وفطير مشلتت على الفرن البلدي",
    emoji: "🍕",
    tint: "#FCE3E1",
    hours: everyDay(h(10), h(24)),
    minOrder: 60,
    prepMinutes: 30,
    rating: 4.5,
    menu: [
      {
        section: "بيتزا",
        products: [
          {
            name: "بيتزا مارجريتا",
            description: "صوص طماطم وموتزاريلا",
            price: 70,
            emoji: "🍕",
            optionGroups: [size(30, 60), extras([["olives", "زيتون", 5], ["extra_cheese", "جبنة زيادة", 15]])],
          },
          { name: "بيتزا سوبر سوبريم", description: "سجق، بسطرمة، فلفل، مشروم", price: 110, emoji: "🍕", optionGroups: [size(35, 70)] },
        ],
      },
      {
        section: "فطير",
        products: [
          { name: "فطير مشلتت", description: "بالسمنة البلدي مع عسل وجبنة قديمة", price: 90, emoji: "🥧" },
          { name: "فطير حلو", description: "قشطة وعسل وسكر بودرة", price: 65, emoji: "🥞" },
        ],
      },
    ],
  },
  {
    category: "grill",
    name: "مشويات أبو علي",
    description: "كفتة وطرب وفراخ مشوية",
    emoji: "🍢",
    tint: "#F6E6D6",
    hours: everyDay(h(13), h(23), [FRIDAY]),
    minOrder: 100,
    prepMinutes: 40,
    rating: 4.8,
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
    category: "koshary",
    name: "كشري التحرير أشمون",
    description: "كشري وطواجن ومكرونة",
    emoji: "🥙",
    tint: "#FFF1CC",
    hours: everyDay(h(9), h(1)),
    minOrder: 30,
    prepMinutes: 15,
    rating: 4.6,
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
      {
        section: "فول وطعمية",
        products: [
          { name: "ساندوتش فول", description: "", price: 8, emoji: "🥙" },
          { name: "ساندوتش طعمية", description: "", price: 8, emoji: "🧆" },
        ],
      },
    ],
  },
  {
    category: "sweets",
    name: "حلواني الشروق",
    description: "تورت وجاتوه وحلويات شرقي",
    emoji: "🍰",
    tint: "#FBE4EE",
    hours: everyDay(h(10), h(23)),
    paused: true,
    minOrder: 50,
    prepMinutes: 20,
    rating: 4.4,
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
    category: "cafe",
    name: "عصير ركن الفاكهة",
    description: "عصائر فريش وسموزي",
    emoji: "🥤",
    tint: "#DDF3EA",
    hours: everyDay(h(8), h(2)),
    minOrder: 25,
    prepMinutes: 10,
    rating: 4.3,
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
    category: "market",
    name: "ماركت البركة",
    description: "بقالة وخضار ومنظفات",
    emoji: "🛒",
    tint: "#E3EEFB",
    hours: everyDay(0, 0),
    minOrder: 40,
    prepMinutes: 20,
    rating: 4.2,
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
    category: "pharmacy",
    name: "صيدلية الشفاء",
    description: "أدوية ومستلزمات طبية",
    emoji: "💊",
    tint: "#E6F4F1",
    hours: everyDay(h(9), h(3)),
    minOrder: 0,
    prepMinutes: 15,
    rating: 4.9,
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
    if ((await ctx.db.query("zones").first()) !== null) return "already seeded";

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
      const shopId = await ctx.db.insert("shops", { ...shop, categoryId, paused });
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
