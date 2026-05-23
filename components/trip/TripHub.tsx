"use client";

import type { FormEvent } from "react";
import type { TripMeta, TripStatus } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type TripCardProps = {
  trip: TripMeta;
  onOpen: () => void;
  onSetActive?: () => void;
  onMarkPast?: () => void;
};

function statusLabel(t: (key: string) => string, status: TripStatus) {
  return t(`hub.status.${status}`);
}

export function TripCard({ trip, onOpen, onSetActive, onMarkPast }: TripCardProps) {
  const { t } = useLocale();

  return (
    <article className="trip-card">
      <div className="trip-card-head">
        <h3>{trip.name}</h3>
        <span className={`trip-status trip-status-${trip.status}`}>
          {statusLabel(t, trip.status)}
        </span>
      </div>
      <p className="trip-card-meta">
        {t("hub.tripDates", { start: trip.startDate, count: trip.dayCount })}
      </p>
      <div className="trip-card-actions">
        <button className="button primary" type="button" onClick={onOpen}>
          {t("hub.openTrip")}
        </button>
        {onSetActive && trip.status !== "active" && (
          <button className="button muted" type="button" onClick={onSetActive}>
            {t("hub.setActive")}
          </button>
        )}
        {onMarkPast && trip.status !== "past" && (
          <button className="button muted" type="button" onClick={onMarkPast}>
            {t("hub.markPast")}
          </button>
        )}
      </div>
    </article>
  );
}

type TripHubProps = {
  activeTrip: TripMeta | null;
  planningTrips: TripMeta[];
  pastTrips: TripMeta[];
  onOpenTrip: (tripId: string) => void;
  onCreateTrip: (name: string) => Promise<void>;
  onSetActive: (tripId: string) => void;
  onMarkPast: (tripId: string) => void;
};

export function TripHub({
  activeTrip,
  planningTrips,
  pastTrips,
  onOpenTrip,
  onCreateTrip,
  onSetActive,
  onMarkPast,
}: TripHubProps) {
  const { t } = useLocale();

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("tripName") as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    await onCreateTrip(name);
    input.value = "";
  };

  return (
    <div className="trip-hub">
      <header className="trip-hub-intro">
        <p className="section-kicker">{t("hub.kicker")}</p>
        <h1>{t("hub.title")}</h1>
        <p>{t("hub.description")}</p>
      </header>

      <section className="trip-hub-section" aria-labelledby="hub-current">
        <h2 id="hub-current">{t("hub.currentTitle")}</h2>
        {activeTrip ? (
          <TripCard
            trip={activeTrip}
            onOpen={() => onOpenTrip(activeTrip.id)}
            onMarkPast={() => onMarkPast(activeTrip.id)}
          />
        ) : (
          <p className="trip-hub-empty">{t("hub.noCurrent")}</p>
        )}
      </section>

      <section className="trip-hub-section" aria-labelledby="hub-plan">
        <h2 id="hub-plan">{t("hub.planTitle")}</h2>
        <form className="trip-create-form" onSubmit={(e) => void handleCreate(e)}>
          <input
            name="tripName"
            type="text"
            placeholder={t("hub.newTripPlaceholder")}
            aria-label={t("hub.newTripPlaceholder")}
          />
          <button className="button primary" type="submit">
            {t("hub.createTrip")}
          </button>
        </form>
        {planningTrips.length > 0 ? (
          <div className="trip-card-grid">
            {planningTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onOpen={() => onOpenTrip(trip.id)}
                onSetActive={() => onSetActive(trip.id)}
                onMarkPast={() => onMarkPast(trip.id)}
              />
            ))}
          </div>
        ) : (
          <p className="trip-hub-empty">{t("hub.noPlanning")}</p>
        )}
      </section>

      <section className="trip-hub-section" aria-labelledby="hub-past">
        <h2 id="hub-past">{t("hub.pastTitle")}</h2>
        {pastTrips.length > 0 ? (
          <div className="trip-card-grid">
            {pastTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onOpen={() => onOpenTrip(trip.id)}
                onSetActive={() => onSetActive(trip.id)}
              />
            ))}
          </div>
        ) : (
          <p className="trip-hub-empty">{t("hub.noPast")}</p>
        )}
      </section>
    </div>
  );
}
