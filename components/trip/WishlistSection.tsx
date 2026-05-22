"use client";

import type { TripDay, Wish } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type WishlistSectionProps = {
  days: TripDay[];
  wishes: Wish[];
  dayLabel: (index: number) => string;
  onAdd: (wish: Wish) => void;
  onDelete: (index: number) => void;
  onToggle: (index: number, done: boolean) => void;
};

export function WishlistSection({
  days,
  wishes,
  dayLabel,
  onAdd,
  onDelete,
  onToggle,
}: WishlistSectionProps) {
  const { t } = useLocale();

  return (
    <section className="section" id="wishlist" aria-labelledby="wishlist-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{t("wishlist.kicker")}</p>
          <h2 id="wishlist-title">{t("wishlist.title")}</h2>
        </div>
        <p>{t("wishlist.description")}</p>
      </div>
      <form
        className="wishlist-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          onAdd({
            person: (form.elements.namedItem("wishPerson") as HTMLInputElement).value.trim(),
            place: (form.elements.namedItem("wishPlace") as HTMLInputElement).value.trim(),
            day: (form.elements.namedItem("wishDay") as HTMLSelectElement).value,
            done: false,
          });
          form.reset();
        }}
      >
        <label>
          {t("wishlist.person")}
          <input
            name="wishPerson"
            type="text"
            placeholder={t("wishlist.personPlaceholder")}
            required
          />
        </label>
        <label>
          {t("wishlist.place")}
          <input
            name="wishPlace"
            type="text"
            placeholder={t("wishlist.placePlaceholder")}
            required
          />
        </label>
        <label>
          {t("wishlist.day")}
          <select name="wishDay" defaultValue={days.length ? dayLabel(0) : "Day 1"}>
            {days.map((_, index) => (
              <option key={index} value={dayLabel(index)}>
                {dayLabel(index)}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" type="submit">
          {t("wishlist.add")}
        </button>
      </form>
      <div className="wish-board">
        {wishes.length === 0 ? (
          <div className="empty-state">{t("wishlist.empty")}</div>
        ) : (
          wishes.map((wish, index) => (
            <article key={index} className={`wish-card ${wish.done ? "done" : ""}`}>
              <div className="wish-top">
                <div>
                  <span className="tag">
                    {wish.day} · {wish.person}
                  </span>
                  <h3>{wish.place}</h3>
                </div>
                <button className="text-button" type="button" onClick={() => onDelete(index)}>
                  {t("orders.delete")}
                </button>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={wish.done}
                  onChange={(e) => onToggle(index, e.target.checked)}
                />
                {t("wishlist.scheduled")}
              </label>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
