import { bindOrderEvents } from "./orders.js";
import { bindPanelEvents } from "./panel.js";
import { bindPhotoEvents } from "./photos.js";
import { bindSyncEvents } from "./sync.js";
import { bindTripSettingsEvents } from "./trip-settings.js";
import { bindWishEvents } from "./wishes.js";

export function bindEvents() {
  bindPanelEvents();
  bindOrderEvents();
  bindTripSettingsEvents();
  bindWishEvents();
  bindPhotoEvents();
  bindSyncEvents();
}
