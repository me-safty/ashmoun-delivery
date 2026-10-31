const arabicDigits = /[٠-٩]/g;
const bidiMarks = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

export function toLatinDigits(input: string) {
  return input.replace(arabicDigits, (d) => String(d.charCodeAt(0) - 0x0660));
}

// Egyptian mobiles: 010/011/012/015 + 8 digits. Accepts +20/0020/20 prefixes, Arabic-Indic
// digits and the invisible direction marks iOS adds to copied numbers.
export function normalizePhone(input: string): string | null {
  const digits = toLatinDigits(input)
    .replace(bidiMarks, "")
    .replace(/[\s\-()]/g, "")
    .replace(/^(\+|00)?20(?=1)/, "0");
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
