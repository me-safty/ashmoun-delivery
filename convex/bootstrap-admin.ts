import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { normalizePhone } from "./lib/phone";
import { createAccount } from "@convex-dev/auth/server";

// Bootstrap admin: creates a user row + auth account with admin role.
export const createBootstrapAdmin = internalMutation({
  args: { name: v.string(), phone: v.string(), password: v.string() },
  handler: async (ctx, { name, phone, password }) => {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new Error("bad phone");
    if (password.length < 8) throw new Error("password too short");

    const existing = await ctx.db
      .query("users")
      .withIndex("phone", (q) => q.eq("phone", normalized))
      .unique();
    if (existing) throw new Error("user already exists");

    // Create the auth account (password hashed via the password provider's Scrypt)
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: normalized, secret: password },
      profile: { email: normalized, phone: normalized, name: name.trim() },
    });

    // Promote to admin
    await ctx.db.patch(user._id, { role: "admin" });
    return user._id;
  },
});