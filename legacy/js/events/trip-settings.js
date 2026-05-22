import { t } from "../../i18n.js";
import { clearItinerary } from "../actions/itinerary.js";
import { parseWishDayNumber } from "../dates.js";
import { syncDaysWithTripSettings } from "../days.js";
import { dom } from "../dom.js";
import { saveState } from "../persistence.js";
import { renderAll } from "../render/index.js";
import { state } from "../state.js";

export function bindTripSettingsEvents() {
  dom.tripSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.tripSettings = {
      startDate: dom.tripStartDate.value,
      dayCount: Number(dom.tripDayCount.value),
    };
    syncDaysWithTripSettings();
    state.wishes = state.wishes.filter((wish) => {
      const dayNumber = parseWishDayNumber(wish.day);
      return !dayNumber || dayNumber <= state.tripSettings.dayCount;
    });
    void saveState();
    renderAll();
  });

  dom.clearItinerary.addEventListener("click", () => {
    const shouldClear = window.confirm(t("overall.clearConfirm"));
    if (!shouldClear) return;
    void clearItinerary();
  });
}
