import { escapeHtml, t } from "../../i18n.js";
import { getDayDisplayTitle } from "../days.js";
import { dom } from "../dom.js";
import { state } from "../state.js";

export function renderDays() {
  dom.dayGrid.innerHTML = state.days
    .map(
      (day, index) => `
        <button class="day-card" type="button" data-day="${index}" style="--day-color: ${day.color}">
          <div class="day-number">
            <span>${escapeHtml(day.date)}</span>
            <span>${index + 1}</span>
          </div>
          <h3>${escapeHtml(getDayDisplayTitle(day, index))}</h3>
          <p>${escapeHtml(day.summary || t("overall.summaryEmpty"))}</p>
          <div class="day-meta">
            <span>${escapeHtml(day.city || t("overall.cityEmpty"))}</span>
            <span>${escapeHtml(day.stay || t("overall.stayEmpty"))}</span>
          </div>
        </button>
      `,
    )
    .join("");
}
