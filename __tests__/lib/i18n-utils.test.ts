import { describe, expect, it } from "vitest";
import {
  getLegacySampleSummaries,
  getLegacySampleTitles,
  getStringList,
  localeMessages,
  lookup,
  normalizeOrderType,
  translate,
} from "@/lib/i18n-utils";

describe("lookup", () => {
  it("resolves nested keys", () => {
    expect(lookup(localeMessages.zh, "site.heroTitle")).toBeTypeOf("string");
  });

  it("returns undefined for missing keys", () => {
    expect(lookup(localeMessages.zh, "missing.key")).toBeUndefined();
  });
});

describe("translate", () => {
  it("interpolates variables", () => {
    expect(translate(localeMessages.en, "day.label", { number: 2 })).toBe("Day 2");
  });

  it("returns key when value is not a string", () => {
    expect(translate(localeMessages.zh, "weekdays")).toBe("weekdays");
  });

  it("keeps unknown placeholders", () => {
    expect(translate(localeMessages.en, "day.label", {})).toContain("{number}");
  });
});

describe("getStringList", () => {
  it("returns array values", () => {
    const list = getStringList(localeMessages.zh, "weekdays");
    expect(list.length).toBe(7);
  });

  it("returns empty array for non-arrays", () => {
    expect(getStringList(localeMessages.zh, "site.heroTitle")).toEqual([]);
  });
});

describe("normalizeOrderType", () => {
  it("keeps canonical keys", () => {
    expect(normalizeOrderType("hotel")).toBe("hotel");
  });

  it("maps localized aliases", () => {
    expect(normalizeOrderType("飯店")).toBe("hotel");
    expect(normalizeOrderType("Hotel")).toBe("hotel");
  });

  it("returns unknown types unchanged", () => {
    expect(normalizeOrderType("custom-type")).toBe("custom-type");
  });
});

describe("legacy sample sets", () => {
  it("collects titles and summaries from all locales", () => {
    const titles = getLegacySampleTitles();
    const summaries = getLegacySampleSummaries();
    expect(titles.size).toBeGreaterThan(0);
    expect(summaries.size).toBeGreaterThan(0);
    expect(titles.has("抵達與慢慢集合")).toBe(true);
  });
});
