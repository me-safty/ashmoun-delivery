import { expect, test } from "vitest";
import { normalizePhone } from "./phone";

test("normalizes Egyptian mobile formats to 01XXXXXXXXX", () => {
  expect(normalizePhone("01012345678")).toBe("01012345678");
  expect(normalizePhone("+20 101 234 5678")).toBe("01012345678");
  expect(normalizePhone("00201112345678")).toBe("01112345678");
  expect(normalizePhone("٠١٢٣٤٥٦٧٨٩٠")).toBe("01234567890");
  expect(normalizePhone("201012345678")).toBe("01012345678");
  expect(normalizePhone("\u202A+20 101 234 5678\u202C")).toBe("01012345678");
  expect(normalizePhone("\u200E01012345678")).toBe("01012345678");
});

test("rejects non-mobile or malformed numbers", () => {
  expect(normalizePhone("0131234567")).toBeNull();
  expect(normalizePhone("01312345678")).toBeNull();
  expect(normalizePhone("0101234567")).toBeNull();
  expect(normalizePhone("")).toBeNull();
});
