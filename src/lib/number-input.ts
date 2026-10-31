import { toLatinDigits } from "@/convex/lib/phone";

// Arabic keyboards type "١٢٫٥" (U+066B) and some locales use "12,5".
export function cleanNumber(text: string) {
  return toLatinDigits(text)
    .replace(/[٫,]/g, ".")
    .replace(/[^\d.]/g, "");
}
