"use client";

import type { TripDay, TripSettings } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type OverallSectionProps = {
  tripSettings: TripSettings;
  days: TripDay[];
  onUpdateSettings: (startDate: string, dayCount: number) => void;
  onClearItinerary: () => void;
  onOpenDay: (index: number) => void;
  displayDayTitle: (day: TripDay, index: number) => string;
};

export function OverallSection({
  tripSettings,
  days,
  onUpdateSettings,
  onClearItinerary,
  onOpenDay,
  displayDayTitle,
}: OverallSectionProps) {
  const { t } = useLocale();

  return (
    <section className="section" id="overall" aria-labelledby="overall-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{t("overall.kicker")}</p>
          <h2 id="overall-title">{t("overall.title")}</h2>
        </div>
        <p>{t("overall.description")}</p>
      </div>
      <form
        className="trip-settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const startDate = (form.elements.namedItem("startDate") as HTMLInputElement).value;
          const dayCount = Number((form.elements.namedItem("dayCount") as HTMLInputElement).value);
          onUpdateSettings(startDate, dayCount);
        }}
      >
        <label>
          {t("overall.startDate")}
          <input name="startDate" type="date" defaultValue={tripSettings.startDate} required />
        </label>
        <label>
          {t("overall.dayCount")}
          <input
            name="dayCount"
            type="number"
            min={1}
            max={30}
            defaultValue={tripSettings.dayCount}
            required
          />
        </label>
        <button className="button primary" type="submit">
          {t("overall.updateDates")}
        </button>
        <button className="button muted" type="button" onClick={onClearItinerary}>
          {t("overall.clearItinerary")}
        </button>
      </form>
      <div className="day-grid">
        {days.map((day, index) => (
          <button
            key={index}
            className="day-card"
            type="button"
            data-day={index}
            style={{ "--day-color": day.color } as React.CSSProperties}
            onClick={() => onOpenDay(index)}
          >
            <div className="day-number">
              <span>{day.date}</span>
              <span>{index + 1}</span>
            </div>
            <h3>{displayDayTitle(day, index)}</h3>
            <p>{day.summary || t("overall.summaryEmpty")}</p>
            <div className="day-meta">
              <span>{day.city || t("overall.cityEmpty")}</span>
              <span>{day.stay || t("overall.stayEmpty")}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
