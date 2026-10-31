import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  const user = userId === null ? null : await ctx.db.get(userId);
  if (user === null) throw new ConvexError("سجل الدخول الأول");
  return user;
}

