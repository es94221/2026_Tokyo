import { normalizeOrderType } from "../i18n.js";
import { config, dayColorPalette, defaultTripSettings, defaultWishes } from "./config.js";
import { storage } from "./storage.js";

const defaultOrders = config.defaultOrders.map((order) => ({
  ...order,
  type: normalizeOrderType(order.type),
}));

export const state = {
  tripSettings: storage.get("family-trip-settings", defaultTripSettings),
  days: storage.get("family-trip-days", config.days),
  orders: storage.get("family-trip-orders", defaultOrders).map((order) => ({
    ...order,
    type: normalizeOrderType(order.type),
  })),
  wishes: storage.get("family-trip-wishes", defaultWishes),
  photos: storage.get("family-trip-photos", []),
  cloud: {
    client: null,
    ready: false,
    failureMessage: "",
  },
  ui: {
    editingOrderIndex: null,
    openDayIndex: null,
    openDayEditIndex: null,
  },
};

export { dayColorPalette, defaultTripSettings };
