import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

// Turns a display name into a URL-safe slug. Arabic names stay in Arabic
// (they are valid in URLs after standard encoding); Latin names become
// lowercase kebab-case.
export function slugify(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
}

// Assigns a slug to every category and shop row that is missing one: the
// slugified name, kept unique within its table by appending -2, -3, … on
// collision. Idempotent — rows that already carry a slug are left untouched,
// and slugs already in use (in any row) are never handed out twice.
export async function ensureSlugs(ctx: MutationCtx): Promise<{ categories: number; shops: number }> {
  const categories = await ctx.db.query("categories").collect();
  const shops = await ctx.db.query("shops").collect();

  const taken = new Set<string>();
  let filledCategories = 0;
  for (const row of categories) {
    if (row.slug) {
      taken.add(row.slug);
    }
  }
  for (const row of categories) {
    if (row.slug) continue;
    const id: Id<"categories"> = row._id;
    const doc: Doc<"categories"> = row;
    filledCategories += 1;
    const assigned = uniqueSlug(doc.name, taken);
    taken.add(assigned);
    await ctx.db.patch("categories", id, { slug: assigned });
  }

  const takenShops = new Set<string>();
  let filledShops = 0;
  for (const row of shops) {
    if (row.slug) {
      takenShops.add(row.slug);
    }
  }
  for (const row of shops) {
    if (row.slug) continue;
    const id: Id<"shops"> = row._id;
    const doc: Doc<"shops"> = row;
    filledShops += 1;
    const assigned = uniqueSlug(doc.name, takenShops);
    takenShops.add(assigned);
    await ctx.db.patch("shops", id, { slug: assigned });
  }

  return { categories: filledCategories, shops: filledShops };
}

// Resolves to an unused variant of the base slug (base, base-2, base-3, …).
function uniqueSlug(name: string, taken: Set<string>): string {
  const base = slugify(name) || "item";
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
