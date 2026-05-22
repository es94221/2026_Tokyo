import { describe, expect, it } from "vitest";
import {
  clearItineraryContent,
  clearLegacySampleItinerary,
  dayLabel,
  getDayDisplayTitle,
  getDayTitleText,
  makeDefaultDay,
  syncDaysWithTripSettings,
} from "@/lib/days-logic";
import { localeMessages } from "@/lib/i18n-utils";
import type { TripDay } from "@/lib/types";

const messages = localeMessages.zh;
const t = (key: string, vars?: Record<string, string | number>) => {
  const parts = key.split(".");
  let node: unknown = messages;
  for (const part of parts) {
    node = (node as Record<string, unknown>)?.[part];
  }
  if (typeof node !== "string") return key;
  return node.replace(/\{(\w+)\}/g, (_, name) => String(vars?.[name] ?? `{${name}}`));
};

function makeDay(overrides: Partial<TripDay> = {}): TripDay {
  return {
    title: "",
    date: "6/22 週一",
    color: "#d8c79d",
    summary: "",
    city: "",
    stay: "",
    timeline: [],
    ...overrides,
  };
}

describe("getDayTitleText", () => {
  it("strips Day N prefix", () => {
    expect(getDayTitleText(makeDay({ title: "Day 2｜Coffee walk" }))).toBe("Coffee walk");
    expect(getDayTitleText(makeDay({ title: "Day 3 | Museum" }))).toBe("Museum");
  });
});

describe("syncDaysWithTripSettings", () => {
  it("grows day list when count increases", () => {
    const { days, tripSettings } = syncDaysWithTripSettings(
      [makeDay()],
      { startDate: "2026-06-22", dayCount: 3 },
      messages,
    );
    expect(days).toHaveLength(3);
    expect(tripSettings.dayCount).toBe(3);
  });

  it("trims days when count decreases", () => {
    const initial = Array.from({ length: 4 }, () => makeDay());
    const { days } = syncDaysWithTripSettings(
      initial,
      { startDate: "2026-06-22", dayCount: 2 },
      messages,
    );
    expect(days).toHaveLength(2);
  });

  it("clamps day count between 1 and 30", () => {
    const { tripSettings: low } = syncDaysWithTripSettings([], { startDate: "2026-06-22", dayCount: 0 }, messages);
    expect(low.dayCount).toBe(1);
    const { tripSettings: high } = syncDaysWithTripSettings(
      [],
      { startDate: "2026-06-22", dayCount: 99 },
      messages,
    );
    expect(high.dayCount).toBe(30);
  });
});

describe("makeDefaultDay", () => {
  it("assigns palette color by index", () => {
    const day = makeDefaultDay(1, { startDate: "2026-06-22", dayCount: 6 }, messages);
    expect(day.color).toBeTruthy();
    expect(day.timeline).toEqual([]);
  });
});

describe("clearLegacySampleItinerary", () => {
  it("clears days matching legacy sample content", () => {
    const days = [
      makeDay({ title: "抵達與慢慢集合", summary: "機場接送、入住、附近散步，晚上一起吃第一餐。" }),
      makeDay({ title: "Custom", summary: "Our plan" }),
    ];
    const { days: cleared, changed } = clearLegacySampleItinerary(
      days,
      { startDate: "2026-06-22", dayCount: 2 },
      messages,
    );
    expect(changed).toBe(true);
    expect(getDayTitleText(cleared[0])).toBe("");
    expect(cleared[1].summary).toBe("Our plan");
  });

  it("reports unchanged when no legacy content", () => {
    const { changed } = clearLegacySampleItinerary(
      [makeDay({ title: "Beach", summary: "Swim" })],
      { startDate: "2026-06-22", dayCount: 1 },
      messages,
    );
    expect(changed).toBe(false);
  });
});

describe("clearItineraryContent", () => {
  it("empties all day fields", () => {
    const cleared = clearItineraryContent(
      [makeDay({ title: "Trip", summary: "Fun", city: "Tokyo", stay: "Hotel", timeline: [["9:00", "Go"]] })],
      { startDate: "2026-06-22", dayCount: 1 },
      messages,
    );
    expect(cleared[0].summary).toBe("");
    expect(cleared[0].timeline).toEqual([]);
  });
});

describe("getDayDisplayTitle", () => {
  it("shows title when present", () => {
    expect(getDayDisplayTitle(makeDay({ title: "Museum" }), 0, t)).toContain("Museum");
  });

  it("shows day number only when title empty", () => {
    expect(getDayDisplayTitle(makeDay(), 2, t)).toMatch(/3/);
  });
});

describe("dayLabel", () => {
  it("formats day label", () => {
    expect(dayLabel(0, t)).toMatch(/1/);
  });
});
