# توصيل أشمون — Ashmoun Delivery

Order-delivery app for Ashmoun (Menoufia) and its villages. Customers order from local shops and pay cash on delivery. Admins run orders, drivers, zones and menus from the same app.

Expo SDK 58 (Expo Router, TypeScript), Convex (database, functions, auth), and EAS (builds and updates). The app is Arabic-only and right-to-left.

## MVP rules
- **Payment:** cash on delivery only.
- **Delivery fee:** set per zone. Ashmoun city is 10 EGP and the villages are 15–20 EGP. Admins can edit fees.
- **One shop per order:** the cart holds items from a single shop, and the server rejects orders that mix shops.
- **Order statuses:** تم الإنشاء → مؤكد → مع المندوب → تم التسليم / مرتجع. An order can also be cancelled (ملغي) before it reaches the driver. Customers can cancel only while the order is still تم الإنشاء.
- **Shop hours:** shops open and close automatically from their weekly hours in Cairo time. Admins can also pause a shop.

## Run locally
```sh
pnpm install
pnpm exec convex dev        # first run: creates .env.local with EXPO_PUBLIC_CONVEX_URL
pnpm exec convex run seed:run   # dummy zones, categories, shops, menus, drivers (idempotent)
pnpm start                  # press w for web, or open a dev build
```

Convex Auth needs these deployment env vars: `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL`. See https://labs.convex.dev/auth/setup.

### Make an admin
Sign up in the app, then run:
```sh
pnpm exec convex run admin:promote '{"phone":"01xxxxxxxxx"}'
```
Admins get "🛠️ لوحة التحكم" under حسابي.

### Password reset codes
No SMS provider is connected yet. `convex/lib/sms.ts` writes each reset code to the Convex logs (Dashboard → Logs, search `sms:not-configured`). Swap in a real provider there.

## Checks
```sh
pnpm typecheck
pnpm lint
pnpm test        # vitest + convex-test
```

## EAS
- **Project:** `@mohamed_safty/ashmoun-delivery`.
- **Build profiles (`eas.json`):**
  - `development`: dev client;
  - `preview`: internal Android APK and iOS ad-hoc;
  - `production`: store builds.
- **`EXPO_PUBLIC_CONVEX_URL`:** an EAS environment variable. `development` and `preview` point at the Convex dev deployment. `production` is not set yet: create a production Convex deployment (`pnpm exec convex deploy`), set its auth env vars, seed it, then run `eas env:create --environment production`.

```sh
pnpm dlx eas-cli build -p android --profile preview   # installable APK
pnpm dlx eas-cli update --channel preview --environment preview   # over-the-air JS update
```

iOS builds and store submission need an Apple Developer account. Play Store submission needs a Google Play Console account.

## Push notifications
Every admin status change sends an Expo push to the customer's devices. Push needs a dev or preview build on a real device. Android also needs FCM credentials uploaded to EAS (`eas credentials`).
