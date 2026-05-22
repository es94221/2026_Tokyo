import { formatTripDate } from "../dates.js";
import { saveState } from "../persistence.js";
import { openDay } from "../render/panel.js";
import { renderDayOptions, renderSiteCopy } from "../render/site.js";
import { renderDays } from "../render/days.js";
import { state } from "../state.js";

export function saveDayEdit(form) {
  const index = Number(form.dataset.dayIndex);
  const timeline = [...form.querySelectorAll(".timeline-edit-row")]
    .map((row) => [
      row.querySelector(".timeline-time").value.trim(),
      row.querySelector(".timeline-text").value.trim(),
    ])
    .filter(([time, item]) => time && item);

  state.days[index] = {
    title: document.querySelector("#editDayTitle").value.trim(),
    date: formatTripDate(state.tripSettings.startDate, index),
    color: document.querySelector("#editDayColor").value,
    summary: document.querySelector("#editDaySummary").value.trim(),
    city: document.querySelector("#editDayCity").value.trim(),
    stay: document.querySelector("#editDayStay").value.trim(),
    timeline,
  };

  void saveState();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
  openDay(index);
}
