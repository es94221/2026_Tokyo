"use client";

import type { TripStatus } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type HeroProps = {
  dayCount: number;
  tripName?: string;
  tripStatus?: TripStatus;
};

export function Hero({ dayCount, tripName, tripStatus }: HeroProps) {
  const { t } = useLocale();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="trip-dates">{t("site.heroKicker")}</p>
        {tripStatus && (
          <span className={`trip-status trip-status-${tripStatus}`}>
            {t(`hub.status.${tripStatus}`)}
          </span>
        )}
        <h1 id="hero-title">{tripName ?? t("site.heroTitle")}</h1>
        <p>{t("site.heroDescription")}</p>
        <div className="hero-actions">
          <a className="button primary" href="#overall">
            {t("site.primaryButton")}
          </a>
          <a className="button muted" href="#wishlist">
            {t("site.secondaryButton")}
          </a>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="map-card">
          <div className="route-line" />
          <span className="pin p1" />
          <span className="pin p2" />
          <span className="pin p3" />
          <span className="pin p4" />
          <div className="map-note">
            <strong>{t("site.heroDayCount", { count: dayCount })}</strong>
            <span>{t("site.mapNote")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
