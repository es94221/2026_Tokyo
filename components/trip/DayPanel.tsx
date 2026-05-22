"use client";

import { useEffect, useState } from "react";
import { parseWishDayNumber } from "@/lib/dates";
import { getDayTitleText } from "@/lib/days-logic";
import type { Order, TripDay, Wish } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type PanelMode =
  | { type: "view"; index: number }
  | { type: "edit"; index: number }
  | null;

type DayPanelProps = {
  panelMode: PanelMode;
  day: TripDay | null;
  index: number | null;
  allOrders: Order[];
  wishes: Wish[];
  displayDayTitle: (day: TripDay, index: number) => string;
  getOrdersForDay: (dayNumber: number) => Order[];
  formatOrderType: (type: string) => string;
  onClose: () => void;
  onEdit: (index: number) => void;
  onCancelEdit: (index: number) => void;
  onSaveEdit: (
    index: number,
    data: Pick<TripDay, "title" | "color" | "summary" | "city" | "stay" | "timeline">,
  ) => void | Promise<void>;
};

function DayPanelView({
  day,
  index,
  wishes,
  allOrders,
  relatedOrders,
  displayDayTitle,
  formatOrderType,
  onClose,
  onEdit,
}: {
  day: TripDay;
  index: number;
  wishes: Wish[];
  allOrders: Order[];
  relatedOrders: Order[];
  displayDayTitle: (day: TripDay, index: number) => string;
  formatOrderType: (type: string) => string;
  onClose: () => void;
  onEdit: (index: number) => void;
}) {
  const { t } = useLocale();
  const dayNumber = index + 1;
  const timeline = day.timeline ?? [];
  const relatedWishes = wishes.filter((wish) => parseWishDayNumber(wish.day) === dayNumber);

  let bookingsContent: React.ReactNode;
  if (!allOrders.length) {
    bookingsContent = <div className="empty-state">{t("panel.bookingsNone")}</div>;
  } else if (!relatedOrders.length) {
    bookingsContent = (
      <div className="empty-state">
        {t("panel.bookingsNoDay", { day: dayNumber })}
        <a href="#orders" onClick={onClose}>
          {t("panel.viewAllBookings")}
        </a>
      </div>
    );
  } else {
    bookingsContent = relatedOrders.map((order, i) => (
      <article key={i} className="booking-link-card">
        <span className="tag">{formatOrderType(order.type)}</span>
        <strong>{order.name}</strong>
        <a className="button muted" href={order.url} target="_blank" rel="noreferrer">
          {t("orders.openLink")}
        </a>
      </article>
    ));
  }

  return (
    <>
      <div className="panel-hero" style={{ "--panel-color": day.color } as React.CSSProperties}>
        <p className="trip-dates">{day.date}</p>
        <h2 id="panelTitle">{displayDayTitle(day, index)}</h2>
        <p>{day.summary || t("overall.summaryEmpty")}</p>
        <div className="day-meta">
          <span>{day.city || t("overall.cityEmpty")}</span>
          <span>{day.stay || t("overall.stayEmpty")}</span>
        </div>
        <div className="panel-actions">
          <button className="button muted" type="button" onClick={() => onEdit(index)}>
            {t("panel.editDay")}
          </button>
        </div>
      </div>
      <div className="timeline">
        {timeline.length ? (
          timeline.map(([time, item], i) => (
            <div key={i} className="timeline-item">
              <time>{time}</time>
              <span>{item}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">{t("panel.timelineEmpty")}</div>
        )}
      </div>
      <section className="timeline">
        <h3>{t("panel.bookingsTitle")}</h3>
        <div className="booking-link-list">{bookingsContent}</div>
      </section>
      <section className="timeline">
        <h3>{t("panel.wishesTitle")}</h3>
        {relatedWishes.length ? (
          relatedWishes.map((wish, i) => (
            <div key={i} className={`wish-card ${wish.done ? "done" : ""}`}>
              <span className="tag">{wish.person}</span>
              <strong>{wish.place}</strong>
              <span>{wish.done ? t("panel.wishScheduled") : t("panel.wishPending")}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">{t("panel.wishesEmpty")}</div>
        )}
      </section>
    </>
  );
}

function DayPanelEdit({
  day,
  index,
  onCancel,
  onSave,
}: {
  day: TripDay;
  index: number;
  onCancel: () => void;
  onSave: (
    data: Pick<TripDay, "title" | "color" | "summary" | "city" | "stay" | "timeline">,
  ) => void | Promise<void>;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState(() => getDayTitleText(day));
  const [city, setCity] = useState(day.city);
  const [stay, setStay] = useState(day.stay);
  const [color, setColor] = useState(day.color);
  const [summary, setSummary] = useState(day.summary);
  const [timelineRows, setTimelineRows] = useState<[string, string][]>(() => [...(day.timeline ?? [])]);

  useEffect(() => {
    setTitle(getDayTitleText(day));
    setCity(day.city);
    setStay(day.stay);
    setColor(day.color);
    setSummary(day.summary);
    setTimelineRows([...(day.timeline ?? [])]);
  }, [day, index]);

  const addTimelineRow = () => {
    setTimelineRows((rows) => [...rows, ["", ""]]);
  };

  const updateTimelineRow = (rowIndex: number, field: 0 | 1, value: string) => {
    setTimelineRows((rows) =>
      rows.map((row, i) => (i === rowIndex ? (field === 0 ? [value, row[1]] : [row[0], value]) : row)),
    );
  };

  const deleteTimelineRow = (rowIndex: number) => {
    setTimelineRows((rows) => rows.filter((_, i) => i !== rowIndex));
  };

  return (
    <form
      className="day-edit-form"
      onSubmit={(e) => {
        e.preventDefault();
        const timeline = timelineRows.filter(([time, item]) => time.trim() && item.trim());
        void onSave({ title, color, summary, city, stay, timeline });
      }}
    >
      <div className="panel-hero" style={{ "--panel-color": color } as React.CSSProperties}>
        <p className="trip-dates">{t("panel.editingDay", { number: index + 1 })}</p>
        <h2>{t("panel.editTitle")}</h2>
        <p>{t("panel.editHint")}</p>
      </div>

      <div className="edit-grid">
        <label>
          {t("panel.titleAfterDay", { number: index + 1 })}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("panel.titlePlaceholder")}
          />
        </label>
        <div className="readonly-field">
          <span>{t("panel.date")}</span>
          <strong>{day.date}</strong>
          <small>{t("panel.dateAuto")}</small>
        </div>
        <label>
          {t("panel.city")}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("panel.cityPlaceholder")}
          />
        </label>
        <label>
          {t("panel.stay")}
          <input
            type="text"
            value={stay}
            onChange={(e) => setStay(e.target.value)}
            placeholder={t("panel.stayPlaceholder")}
          />
        </label>
        <label>
          {t("panel.color")}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
      </div>

      <label>
        {t("panel.summary")}
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t("panel.summaryPlaceholder")}
        />
      </label>

      <div className="edit-section-title">
        <h3>{t("panel.timeline")}</h3>
        <button className="button muted" type="button" onClick={addTimelineRow}>
          {t("panel.addTime")}
        </button>
      </div>

      <div className="timeline-editor">
        {timelineRows.map(([time, item], rowIndex) => (
          <div key={rowIndex} className="timeline-edit-row">
            <label>
              {t("panel.time")}
              <input
                className="timeline-time"
                type="text"
                value={time}
                placeholder="09:30"
                required
                onChange={(e) => updateTimelineRow(rowIndex, 0, e.target.value)}
              />
            </label>
            <label>
              {t("panel.activity")}
              <input
                className="timeline-text"
                type="text"
                value={item}
                placeholder={t("panel.activityPlaceholder")}
                required
                onChange={(e) => updateTimelineRow(rowIndex, 1, e.target.value)}
              />
            </label>
            <button className="text-button" type="button" onClick={() => deleteTimelineRow(rowIndex)}>
              {t("panel.delete")}
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button className="button primary" type="submit">
          {t("panel.saveDay")}
        </button>
        <button className="button muted" type="button" onClick={onCancel}>
          {t("panel.cancel")}
        </button>
      </div>
    </form>
  );
}

export function DayPanel({
  panelMode,
  day,
  index,
  allOrders,
  wishes,
  displayDayTitle,
  getOrdersForDay,
  formatOrderType,
  onClose,
  onEdit,
  onCancelEdit,
  onSaveEdit,
}: DayPanelProps) {
  const { t } = useLocale();
  const isOpen = panelMode !== null && day !== null && index !== null;
  const dayNumber = index !== null ? index + 1 : 0;
  const relatedOrders = dayNumber ? getOrdersForDay(dayNumber) : [];

  return (
    <aside
      className={`day-panel${isOpen ? " open" : ""}`}
      aria-hidden={!isOpen}
      aria-labelledby="panelTitle"
    >
      <div className="panel-card">
        <button className="icon-button" type="button" onClick={onClose} aria-label={t("panel.closeAria")}>
          ×
        </button>
        {isOpen && panelMode && (
          <div>
            {panelMode.type === "view" ? (
              <DayPanelView
                day={day}
                index={index}
                wishes={wishes}
                allOrders={allOrders}
                relatedOrders={relatedOrders}
                displayDayTitle={displayDayTitle}
                formatOrderType={formatOrderType}
                onClose={onClose}
                onEdit={onEdit}
              />
            ) : (
              <DayPanelEdit
                day={day}
                index={index}
                onCancel={() => onCancelEdit(index)}
                onSave={(data) => onSaveEdit(index, data)}
              />
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
