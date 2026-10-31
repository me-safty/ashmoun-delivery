import { ConvexError } from "convex/values";

export function errorMessage(error: unknown, fallback = "حصلت مشكلة، حاول تاني") {
  if (error instanceof ConvexError && typeof error.data === "string") return error.data;
  return fallback;
}
