import { formatTripDate, getWeekdays } from "./dates";
import { dayColorPalette, defaultTripSettings } from "./config";
import { getLegacySampleSummaries, getLegacySampleTitles } from "./i18n-utils";
import type { LocaleMessages, TripDay, TripSettings } from "./types";

export function getDayTitleText(day: TripDay) {
  return String(day.title ?? "")
    .replace(/^Day\s*\d+\s*[｜|]\s*/i, "")
    .trim();
}

export function makeDefaultDay(
  index: number,
  tripSettings: TripSettings,
  messages: LocaleMessages,
): TripDay {
  return {
    title: "",
    date: formatTripDate(tripSettings.startDate, index, getWeekdays(messages)),
    color: dayColorPalette[index % dayColorPalette.length],
    summary: "",
    city: "",
    stay: "",
    timeline: [],
  };
}

export function syncDaysWithTripSettings(
  days: TripDay[],
  tripSettings: TripSettings,
  messages: LocaleMessages,
): { days: TripDay[]; tripSettings: TripSettings } {
  const settings = { ...defaultTripSettings, ...tripSettings };
  const nextCount = Math.max(1, Math.min(Number(settings.dayCount) || 1, 30));
  settings.dayCount = nextCount;

  let nextDays = [...days];

  if (nextDays.length < nextCount) {
    const needed = nextCount - nextDays.length;
    const start = nextDays.length;
    nextDays = [
      ...nextDays,
      ...Array.from({ length: needed }, (_, index) => makeDefaultDay(start + index, settings, messages)),
    ];
  }

  if (nextDays.length > nextCount) {
    nextDays = nextDays.slice(0, nextCount);
  }

  nextDays = nextDays.map((day, index) => ({
    ...day,
    title: getDayTitleText(day),
    date: formatTripDate(settings.startDate, index, getWeekdays(messages)),
    color: dayColorPalette[index % dayColorPalette.length],
  }));

  return { days: nextDays, tripSettings: settings };
}

export function clearLegacySampleItinerary(
  days: TripDay[],
  tripSettings: TripSettings,
  messages: LocaleMessages,
): { days: TripDay[]; changed: boolean } {
  const legacyTitles = getLegacySampleTitles();
  const legacySummaries = getLegacySampleSummaries();
  let changed = false;

  const nextDays = days.map((day, index) => {
    const titleText = getDayTitleText(day);
    const isLegacy =
      legacyTitles.has(titleText) || legacySummaries.has(day.summary);

    if (!isLegacy) return day;

    changed = true;
    return {
      ...day,
      title: "",
      date: formatTripDate(tripSettings.startDate, index, getWeekdays(messages)),
      summary: "",
      city: "",
      stay: "",
      timeline: [],
    };
  });

  return { days: nextDays, changed };
}

export function clearItineraryContent(
  days: TripDay[],
  tripSettings: TripSettings,
  messages: LocaleMessages,
): TripDay[] {
  return days.map((day, index) => ({
    ...day,
    title: "",
    date: formatTripDate(tripSettings.startDate, index, getWeekdays(messages)),
    summary: "",
    city: "",
    stay: "",
    timeline: [],
  }));
}

export function getDayDisplayTitle(
  day: TripDay,
  index: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  const titleText = getDayTitleText(day);
  const number = index + 1;
  return titleText
    ? t("day.displayWithTitle", { number, title: titleText })
    : t("day.displayTitleOnly", { number });
}

export function dayLabel(
  index: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  return t("day.label", { number: index + 1 });
}
