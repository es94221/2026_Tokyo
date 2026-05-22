import { dayLabel, escapeHtml, t } from "../../i18n.js";
import { dom } from "../dom.js";
import { state } from "../state.js";

export function renderTripSettings() {
  dom.tripStartDate.value = state.tripSettings.startDate;
  dom.tripDayCount.value = state.tripSettings.dayCount;
}

export function renderSiteCopy() {
  document.querySelector("#heroDayCount").textContent = t("site.heroDayCount", {
    count: state.days.length,
  });
}

export function renderDayOptions() {
  dom.wishDay.innerHTML = state.days
    .map((_, index) => `<option>${escapeHtml(dayLabel(index))}</option>`)
    .join("");
}
