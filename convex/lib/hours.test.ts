import { describe, expect, test } from "vitest";
import { cairoTime, isOpenAt, isShopOpen } from "./hours";

// 2026-11-04 is a Wednesday (day 3). Egypt is UTC+2 in late October (DST ended).
const cairo = (iso: string) => new Date(`${iso}+02:00`).getTime();

describe("cairoTime", () => {
  test("reads weekday and minute in Africa/Cairo", () => {
    expect(cairoTime(cairo("2026-11-04T13:30:00"))).toEqual({ day: 3, minute: 810 });
  });
});

describe("isOpenAt", () => {
  const daytime = [{ day: 3, open: 9 * 60, close: 23 * 60 }];

  test("open inside a same-day range, closed at the close minute", () => {
    expect(isOpenAt(daytime, cairo("2026-11-04T09:00:00"))).toBe(true);
    expect(isOpenAt(daytime, cairo("2026-11-04T22:59:00"))).toBe(true);
    expect(isOpenAt(daytime, cairo("2026-11-04T23:00:00"))).toBe(false);
    expect(isOpenAt(daytime, cairo("2026-11-04T08:59:00"))).toBe(false);
  });

  test("closed on a day with no range", () => {
    expect(isOpenAt(daytime, cairo("2026-11-05T12:00:00"))).toBe(false);
  });

  test("overnight range stays open past midnight into the next day", () => {
    const overnight = [{ day: 3, open: 18 * 60, close: 2 * 60 }];
    expect(isOpenAt(overnight, cairo("2026-11-04T23:30:00"))).toBe(true);
    expect(isOpenAt(overnight, cairo("2026-11-05T01:59:00"))).toBe(true);
    expect(isOpenAt(overnight, cairo("2026-11-05T02:00:00"))).toBe(false);
    expect(isOpenAt(overnight, cairo("2026-11-04T17:00:00"))).toBe(false);
  });

  test("Saturday overnight wraps into Sunday", () => {
    const saturday = [{ day: 6, open: 20 * 60, close: 3 * 60 }];
    expect(isOpenAt(saturday, cairo("2026-11-08T01:00:00"))).toBe(true);
  });
});

test("paused shop is closed even inside its hours", () => {
  const hours = [{ day: 3, open: 0, close: 0 }];
  expect(isShopOpen({ hours, paused: false }, cairo("2026-11-04T12:00:00"))).toBe(true);
  expect(isShopOpen({ hours, paused: true }, cairo("2026-11-04T12:00:00"))).toBe(false);
});
