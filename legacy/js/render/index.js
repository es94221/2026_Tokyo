import { renderDays } from "./days.js";
import { renderMap } from "./map.js";
import { renderOrders } from "./orders.js";
import { renderPhotos } from "./photos.js";
import { renderDayOptions, renderSiteCopy, renderTripSettings } from "./site.js";
import { renderWishes } from "./wishes.js";

export function renderAll() {
  renderTripSettings();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
  renderMap();
  renderOrders();
  renderWishes();
  renderPhotos();
}

export { renderDays } from "./days.js";
export { renderMap } from "./map.js";
export { editOrder, renderOrders, resetOrderForm } from "./orders.js";
export { renderPhotos } from "./photos.js";
export {
  addTimelineRow,
  closeDayPanel,
  openDay,
  renderDayEditForm,
} from "./panel.js";
export { renderDayOptions, renderSiteCopy, renderTripSettings } from "./site.js";
export { renderWishes } from "./wishes.js";
