import { escapeHtml, formatOrderType, getOrderTypeOptionsHtml, t } from "../../i18n.js";
import { dom } from "../dom.js";
import { state } from "../state.js";

export function renderOrders() {
  dom.orderList.innerHTML = state.orders.length
    ? state.orders
        .map(
          (order, index) => `
            <article class="order-card">
              <div class="order-top">
                <div>
                  <span class="tag">${escapeHtml(formatOrderType(order.type))}</span>
                  <h3>${escapeHtml(order.name)}</h3>
                </div>
                <div class="card-actions">
                  <button class="text-button" type="button" data-edit-order="${index}">${escapeHtml(t("orders.edit"))}</button>
                  <button class="text-button" type="button" data-delete-order="${index}">${escapeHtml(t("orders.delete"))}</button>
                </div>
              </div>
              <a class="button muted" href="${order.url}" target="_blank" rel="noreferrer">${escapeHtml(t("orders.openLink"))}</a>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">${escapeHtml(t("orders.empty"))}</div>`;
}

export function resetOrderForm() {
  state.ui.editingOrderIndex = null;
  dom.orderForm.reset();
  document.querySelector("#orderType").innerHTML = getOrderTypeOptionsHtml();
  dom.orderSubmit.textContent = t("orders.add");
  dom.orderCancel.classList.add("hidden");
}

export function editOrder(index) {
  const order = state.orders[index];
  state.ui.editingOrderIndex = index;
  document.querySelector("#orderType").innerHTML = getOrderTypeOptionsHtml(order.type);
  document.querySelector("#orderName").value = order.name;
  document.querySelector("#orderUrl").value = order.url;
  dom.orderSubmit.textContent = t("orders.save");
  dom.orderCancel.classList.remove("hidden");
  dom.orderForm.scrollIntoView({ behavior: "smooth", block: "center" });
}
