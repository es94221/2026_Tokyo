import { describe, expect, it } from "vitest";
import {
  formatTripDate,
  getWeekdays,
  parseDateInput,
  parseWishDayNumber,
} from "@/lib/dates";
import { localeMessages } from "@/lib/i18n-utils";

describe("parseDateInput", () => {
  it("parses ISO date at noon local time", () => {
    const date = parseDateInput("2026-06-22");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(22);
    expect(date.getHours()).toBe(12);
  });
});

describe("formatTripDate", () => {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  it("formats start date with weekday", () => {
    expect(formatTripDate("2026-06-22", 0, weekdays)).toMatch(/^6\/22/);
  });

  it("offsets by day index", () => {
    const day0 = formatTripDate("2026-06-22", 0, weekdays);
    const day1 = formatTripDate("2026-06-22", 1, weekdays);
    expect(day0).not.toBe(day1);
  });

  it("handles missing weekday gracefully", () => {
    expect(formatTripDate("2026-06-22", 0, [])).toMatch(/^6\/22/);
  });
});

describe("parseWishDayNumber", () => {
  it("extracts digits from day label", () => {
    expect(parseWishDayNumber("Day 3")).toBe(3);
    expect(parseWishDayNumber("第2天")).toBe(2);
  });

  it("returns 0 for empty strings", () => {
    expect(parseWishDayNumber("")).toBe(0);
  });
});

describe("getWeekdays", () => {
  it("returns weekdays from locale messages", () => {
    const weekdays = getWeekdays(localeMessages.zh);
    expect(weekdays.length).toBe(7);
  });

  it("returns empty array when missing", () => {
    expect(getWeekdays({})).toEqual([]);
  });
});
