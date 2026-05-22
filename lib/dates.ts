import type { LocaleMessages } from "./types";

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatTripDate(startDate: string, offset: number, weekdays: string[]) {
  const date = parseDateInput(startDate);
  date.setDate(date.getDate() + offset);
  const weekday = weekdays[date.getDay()] ?? "";
  return `${date.getMonth() + 1}/${date.getDate()} ${weekday}`.trim();
}

export function parseWishDayNumber(dayValue: string) {
  return Number(String(dayValue).replace(/\D/g, ""));
}

export function getWeekdays(messages: LocaleMessages): string[] {
  const weekdays = messages.weekdays;
  return Array.isArray(weekdays) ? (weekdays as string[]) : [];
}
