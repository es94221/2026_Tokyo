import {
  applyStaticTranslations,
  getOtherLocale,
  loadLocale,
} from "../i18n.js";
import { bindEvents } from "./events/index.js";
import { clearLegacySampleItinerary, syncDaysWithTripSettings } from "./days.js";
import { dom } from "./dom.js";
import { connectSupabase, saveState } from "./persistence.js";
import {
  openDay,
  renderAll,
  renderDayEditForm,
  resetOrderForm,
} from "./render/index.js";
import { state } from "./state.js";

export async function switchLanguage() {
  const panelWasOpen = dom.dayPanel.classList.contains("open");
  const editIndex = state.ui.openDayEditIndex;
  const viewIndex = state.ui.openDayIndex;

  await loadLocale(getOtherLocale());
  applyStaticTranslations();
  renderAll();
  resetOrderForm();

  if (!panelWasOpen) return;
  if (editIndex !== null) renderDayEditForm(editIndex);
  else if (viewIndex !== null) openDay(viewIndex);
}

export async function initApp() {
  await loadLocale();
  applyStaticTranslations();
  bindEvents();

  dom.langToggle?.addEventListener("click", () => void switchLanguage());

  syncDaysWithTripSettings();
  renderAll();

  await connectSupabase();
  syncDaysWithTripSettings();

  const clearedLegacySamples = clearLegacySampleItinerary();
  if (clearedLegacySamples) await saveState();

  renderAll();
}
