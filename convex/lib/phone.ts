const arabicDigits = /[٠-٩]/g;

// Egyptian mobiles: 010/011/012/015 + 8 digits. Accepts +20/0020 prefixes and Arabic-Indic digits.
export function normalizePhone(input: string): string | null {
  const digits = input
    .replace(arabicDigits, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\s\-()]/g, "")
    .replace(/^(\+|00)20/, "0");
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
