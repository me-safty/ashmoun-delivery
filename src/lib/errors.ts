import { ConvexError } from "convex/values";

export function errorMessage(error: unknown, fallback = "حدثت مشكلة، يرجى المحاولة مرة أخرى") {
  if (error instanceof ConvexError && typeof error.data === "string") return error.data;
  return fallback;
}
