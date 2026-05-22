import { escapeHtml, t } from "../../i18n.js";
import { dom } from "../dom.js";
import { state } from "../state.js";

export function renderWishes() {
  dom.wishBoard.innerHTML = state.wishes.length
    ? state.wishes
        .map(
          (wish, index) => `
            <article class="wish-card ${wish.done ? "done" : ""}">
              <div class="wish-top">
                <div>
                  <span class="tag">${escapeHtml(wish.day)} · ${escapeHtml(wish.person)}</span>
                  <h3>${escapeHtml(wish.place)}</h3>
                </div>
                <button class="text-button" type="button" data-delete-wish="${index}">${escapeHtml(t("orders.delete"))}</button>
              </div>
              <label class="check-row">
                <input type="checkbox" data-toggle-wish="${index}" ${wish.done ? "checked" : ""} />
                ${escapeHtml(t("wishlist.scheduled"))}
              </label>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">${escapeHtml(t("wishlist.empty"))}</div>`;
}
