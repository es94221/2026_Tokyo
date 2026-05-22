import { clearItineraryContent } from "../days.js";
import { saveState } from "../persistence.js";
import { renderAll } from "../render/index.js";

export async function clearItinerary() {
  clearItineraryContent();
  await saveState();
  renderAll();
}
