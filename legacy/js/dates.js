import { getStringList } from "../i18n.js";

export function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatTripDate(startDate, offset) {
  const date = parseDateInput(startDate);
  date.setDate(date.getDate() + offset);
  const weekdayList = getStringList("weekdays");
  const weekday = weekdayList[date.getDay()] ?? "";
  return `${date.getMonth() + 1}/${date.getDate()} ${weekday}`.trim();
}

export function parseWishDayNumber(dayValue) {
  return Number(String(dayValue).replace(/\D/g, ""));
}
