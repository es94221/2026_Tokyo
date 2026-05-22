import { t } from "../i18n.js";
import { dom } from "./dom.js";

export function setSyncStatus(message, status = "local") {
  dom.syncStatus.textContent = message;
  dom.syncStatus.dataset.status = status;
  dom.syncStatus.title = message;
}

export function setSyncStatusKey(key, status, vars = {}) {
  setSyncStatus(t(key, vars), status);
}
