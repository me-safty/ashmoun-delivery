/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses from "../addresses.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as catalog from "../catalog.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_hours from "../lib/hours.js";
import type * as lib_orderStatus from "../lib/orderStatus.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_pricing from "../lib/pricing.js";
import type * as lib_session from "../lib/session.js";
import type * as lib_sms from "../lib/sms.js";
import type * as orders from "../orders.js";
import type * as push from "../push.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as verificationCodes from "../verificationCodes.js";
import type * as zones from "../zones.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  admin: typeof admin;
  auth: typeof auth;
  catalog: typeof catalog;
  crons: typeof crons;
  http: typeof http;
  "lib/hours": typeof lib_hours;
  "lib/orderStatus": typeof lib_orderStatus;
  "lib/phone": typeof lib_phone;
  "lib/pricing": typeof lib_pricing;
  "lib/session": typeof lib_session;
  "lib/sms": typeof lib_sms;
  orders: typeof orders;
  push: typeof push;
  seed: typeof seed;
  users: typeof users;
  verificationCodes: typeof verificationCodes;
  zones: typeof zones;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
