import { getLegacySampleSummaries, getLegacySampleTitles, t } from "../i18n.js";
import { dayColorPalette, defaultTripSettings } from "./config.js";
import { formatTripDate } from "./dates.js";
import { state } from "./state.js";

export function getDayTitleText(day) {
  return String(day.title ?? "")
    .replace(/^Day\s*\d+\s*[｜|]\s*/i, "")
    .trim();
}

export function getDayDisplayTitle(day, index) {
  const titleText = getDayTitleText(day);
  const number = index + 1;
  return titleText
    ? t("day.displayWithTitle", { number, title: titleText })
    : t("day.displayTitleOnly", { number });
}

export function makeDefaultDay(index) {
  return {
    title: "",
    date: formatTripDate(state.tripSettings.startDate, index),
    color: dayColorPalette[index % dayColorPalette.length],
    summary: "",
    city: "",
    stay: "",
    timeline: [],
  };
}

export function syncDaysWithTripSettings() {
  state.tripSettings = {
    ...defaultTripSettings,
    ...state.tripSettings,
  };

  const nextCount = Math.max(1, Math.min(Number(state.tripSettings.dayCount) || 1, 30));
  state.tripSettings.dayCount = nextCount;

  if (state.days.length < nextCount) {
    const needed = nextCount - state.days.length;
    const start = state.days.length;
    state.days = [
      ...state.days,
      ...Array.from({ length: needed }, (_, index) => makeDefaultDay(start + index)),
    ];
  }

  if (state.days.length > nextCount) {
    state.days = state.days.slice(0, nextCount);
  }

  state.days = state.days.map((day, index) => ({
    ...day,
    title: getDayTitleText(day),
    date: formatTripDate(state.tripSettings.startDate, index),
    color: dayColorPalette[index % dayColorPalette.length],
  }));
}

export function clearLegacySampleItinerary() {
  let changed = false;

  state.days = state.days.map((day, index) => {
    const titleText = getDayTitleText(day);
    const isLegacySample =
      getLegacySampleTitles().has(titleText) || getLegacySampleSummaries().has(day.summary);

    if (!isLegacySample) return day;

    changed = true;
    return {
      ...day,
      title: "",
      date: formatTripDate(state.tripSettings.startDate, index),
      summary: "",
      city: "",
      stay: "",
      timeline: [],
    };
  });

  return changed;
}

export function clearItineraryContent() {
  state.days = state.days.map((day, index) => ({
    ...day,
    title: "",
    date: formatTripDate(state.tripSettings.startDate, index),
    summary: "",
    city: "",
    stay: "",
    timeline: [],
  }));
}
