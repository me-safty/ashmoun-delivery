import type { Infer } from "convex/values";
import type { weeklyHours } from "../schema";

export type WeeklyHours = Infer<typeof weeklyHours>;

const MINUTES_PER_DAY = 24 * 60;
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const cairoClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function cairoTime(at: number) {
  const parts = cairoClock.formatToParts(new Date(at));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: weekdays.indexOf(part("weekday")),
    minute: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

// A range whose close is at or before its open runs past midnight into the next day.
export function isOpenAt(hours: WeeklyHours, at: number) {
  const { day, minute } = cairoTime(at);
  const yesterday = (day + 6) % 7;
  return hours.some((range) => {
    const overnight = range.close <= range.open;
    if (range.day === day) {
      return minute >= range.open && (overnight || minute < range.close);
    }
    return overnight && range.day === yesterday && minute < range.close;
  });
}

// Today's ranges, plus the after-midnight part of yesterday's overnight range.
export function todayRanges(hours: WeeklyHours, at: number) {
  const { day } = cairoTime(at);
  const yesterday = (day + 6) % 7;
  const spill = hours
    .filter((range) => range.day === yesterday && range.close < range.open && range.close > 0)
    .map((range) => ({ day, open: 0, close: range.close }));
  return [...spill, ...hours.filter((range) => range.day === day)];
}

export function isShopOpen(
  shop: { hours: WeeklyHours; paused: boolean },
  at: number,
) {
  return !shop.paused && isOpenAt(shop.hours, at);
}

export function formatMinute(minute: number) {
  const m = minute % MINUTES_PER_DAY;
  const h24 = Math.floor(m / 60);
  const suffix = h24 < 12 ? "ص" : "م";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${suffix}`;
}
