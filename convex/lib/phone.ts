const arabicDigits = /[٠-٩]/g;
const persianDigits = /[۰-۹]/g;
const bidiMarks = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

export function toLatinDigits(input: string) {
  return input
    .replace(arabicDigits, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(persianDigits, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// Egyptian mobiles: 010/011/012/015 + 8 digits. Accepts +20/0020/20 prefixes (with or without
// the local 0), Arabic and Persian digits and the invisible direction marks iOS adds to copied numbers.
export function normalizePhone(input: string): string | null {
  const digits = toLatinDigits(input)
    .replace(bidiMarks, "")
    .replace(/[\s\-()]/g, "")
    .replace(/^(\+|00)?200?(?=1)/, "0");
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
