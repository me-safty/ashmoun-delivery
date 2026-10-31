import { Email } from "@convex-dev/auth/providers/Email";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { normalizePhone } from "./lib/phone";
import { sendSms } from "./lib/sms";

// The reset code is bound to the phone that requested it: the account ID is the phone.
const ResetCode = Email({
  id: "password-reset",
  maxAge: 15 * 60,
  async generateVerificationToken() {
    const [n] = crypto.getRandomValues(new Uint32Array(1));
    return String(n % 1_000_000).padStart(6, "0");
  },
  // Convex Auth rate-limits code attempts by `params.email ?? params.phone`; refusing
  // `email` keeps the limit keyed on the account's phone.
  async authorize(params, account) {
    if (params.email !== undefined || params.phone !== account.providerAccountId) {
      throw new Error("Reset code does not match this phone");
    }
  },
  async sendVerificationRequest({ identifier, token }) {
    await sendSms(identifier, `كود استعادة كلمة المرور: ${token}`);
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      id: "password",
      reset: ResetCode,
      profile(params) {
        const phone = normalizePhone(String(params.phone ?? ""));
        if (!phone) throw new ConvexError("رقم الموبايل غير صحيح");
        const name = String(params.name ?? "").trim();
        if (params.flow === "signUp" && name.length < 2) {
          throw new ConvexError("اكتب اسمك");
        }
        return { email: phone, phone, name };
      },
      validatePasswordRequirements(password) {
        if (password.length < 8) {
          throw new ConvexError("كلمة المرور لازم تكون 8 حروف أو أرقام على الأقل");
        }
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      if (existingUserId) return existingUserId;
      return await ctx.db.insert("users", {
        name: profile.name,
        phone: profile.phone,
        role: "customer",
      });
    },
  },
});
