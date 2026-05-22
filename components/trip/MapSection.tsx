"use client";

import { tripConfig } from "@/lib/config";
import { useLocale } from "@/contexts/LocaleContext";

export function MapSection() {
  const { t } = useLocale();
  const query = tripConfig.map.query.trim();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const hasKey = Boolean(tripConfig.map.googleMapsApiKey.trim());

  let embedSrc = "";
  if (hasKey) {
    const embedUrl = new URL("https://www.google.com/maps/embed/v1/place");
    embedUrl.searchParams.set("key", tripConfig.map.googleMapsApiKey);
    embedUrl.searchParams.set("q", query);
    embedUrl.searchParams.set("zoom", String(tripConfig.map.zoom));
    embedSrc = embedUrl.toString();
  }

  return (
    <section className="section map-section" id="map" aria-labelledby="map-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{t("map.kicker")}</p>
          <h2 id="map-title">{t("map.title")}</h2>
        </div>
        <p>{t("map.description")}</p>
      </div>
      <div className="map-shell">
        {hasKey ? (
          <iframe
            title={t("map.title")}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            src={embedSrc}
          />
        ) : (
          <div className="map-fallback">
            <span className="tag">{t("map.noApiKey")}</span>
            <h3>{query}</h3>
            <p dangerouslySetInnerHTML={{ __html: t("map.noApiKeyHelp") }} />
            <a className="button primary" href={mapsUrl} target="_blank" rel="noreferrer">
              {t("map.openMaps")}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
