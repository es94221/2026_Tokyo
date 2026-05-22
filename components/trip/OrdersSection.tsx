"use client";

import { ORDER_TYPE_KEYS } from "@/lib/i18n-utils";
import type { Order } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type OrdersSectionProps = {
  orders: Order[];
  editingOrderIndex: number | null;
  onAdd: (order: Order) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onCancelEdit: () => void;
  formatOrderType: (type: string) => string;
};

export function OrdersSection({
  orders,
  editingOrderIndex,
  onAdd,
  onEdit,
  onDelete,
  onCancelEdit,
  formatOrderType,
}: OrdersSectionProps) {
  const { t } = useLocale();

  return (
    <section className="section split" id="orders" aria-labelledby="orders-title">
      <div className="section-heading stacked">
        <p className="section-kicker">{t("orders.kicker")}</p>
        <h2 id="orders-title">{t("orders.title")}</h2>
        <p>{t("orders.description")}</p>
      </div>
      <form
        className="order-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          onAdd({
            type: (form.elements.namedItem("orderType") as HTMLSelectElement).value,
            name: (form.elements.namedItem("orderName") as HTMLInputElement).value.trim(),
            url: (form.elements.namedItem("orderUrl") as HTMLInputElement).value.trim(),
          });
          form.reset();
        }}
      >
        <label>
          {t("orders.type")}
          <select
            name="orderType"
            key={editingOrderIndex ?? "new"}
            defaultValue={
              editingOrderIndex !== null ? orders[editingOrderIndex]?.type : "hotel"
            }
          >
            {ORDER_TYPE_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`orderTypes.${key}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("orders.name")}
          <input
            name="orderName"
            type="text"
            placeholder={t("orders.namePlaceholder")}
            defaultValue={editingOrderIndex !== null ? orders[editingOrderIndex]?.name : ""}
            required
          />
        </label>
        <label>
          {t("orders.url")}
          <input
            name="orderUrl"
            type="url"
            placeholder={t("orders.urlPlaceholder")}
            defaultValue={editingOrderIndex !== null ? orders[editingOrderIndex]?.url : ""}
            required
          />
        </label>
        <div className="form-actions">
          <button className="button primary" type="submit">
            {editingOrderIndex === null ? t("orders.add") : t("orders.save")}
          </button>
          {editingOrderIndex !== null && (
            <button className="button muted" type="button" onClick={onCancelEdit}>
              {t("orders.cancelEdit")}
            </button>
          )}
        </div>
      </form>
      <div className="order-list">
        {orders.length === 0 ? (
          <div className="empty-state">{t("orders.empty")}</div>
        ) : (
          orders.map((order, index) => (
            <article key={index} className="order-card">
              <div className="order-top">
                <div>
                  <span className="tag">{formatOrderType(order.type)}</span>
                  <h3>{order.name}</h3>
                </div>
                <div className="card-actions">
                  <button className="text-button" type="button" onClick={() => onEdit(index)}>
                    {t("orders.edit")}
                  </button>
                  <button className="text-button" type="button" onClick={() => onDelete(index)}>
                    {t("orders.delete")}
                  </button>
                </div>
              </div>
              <a className="button muted" href={order.url} target="_blank" rel="noreferrer">
                {t("orders.openLink")}
              </a>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
