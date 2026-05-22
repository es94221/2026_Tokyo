import { escapeHtml, t } from "../../i18n.js";
import { config } from "../config.js";
import { dom } from "../dom.js";

export function renderMap() {
  const query = config.map.query.trim();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (!config.map.googleMapsApiKey.trim()) {
    dom.mapShell.innerHTML = `
      <div class="map-fallback">
        <span class="tag">${escapeHtml(t("map.noApiKey"))}</span>
        <h3>${escapeHtml(query)}</h3>
        <p>${t("map.noApiKeyHelp")}</p>
        <a class="button primary" href="${mapsUrl}" target="_blank" rel="noreferrer">${escapeHtml(t("map.openMaps"))}</a>
      </div>
    `;
    return;
  }

  const embedUrl = new URL("https://www.google.com/maps/embed/v1/place");
  embedUrl.searchParams.set("key", config.map.googleMapsApiKey);
  embedUrl.searchParams.set("q", query);
  embedUrl.searchParams.set("zoom", config.map.zoom);

  dom.mapShell.innerHTML = `
    <iframe
      title="${escapeHtml(t("map.title"))}"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
      src="${embedUrl.toString()}"
    ></iframe>
  `;
}
