import { dom } from "../dom.js";
import { saveState } from "../persistence.js";
import { editOrder, renderOrders, resetOrderForm } from "../render/orders.js";
import { state } from "../state.js";

export function bindOrderEvents() {
  dom.orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const order = {
      type: document.querySelector("#orderType").value,
      name: document.querySelector("#orderName").value.trim(),
      url: document.querySelector("#orderUrl").value.trim(),
    };

    if (state.ui.editingOrderIndex === null) {
      state.orders = [order, ...state.orders];
    } else {
      state.orders[state.ui.editingOrderIndex] = order;
    }

    void saveState();
    resetOrderForm();
    renderOrders();
  });

  dom.orderCancel.addEventListener("click", resetOrderForm);

  dom.orderList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-order]");
    if (editButton) {
      editOrder(Number(editButton.dataset.editOrder));
      return;
    }

    const button = event.target.closest("[data-delete-order]");
    if (!button) return;

    const deletedIndex = Number(button.dataset.deleteOrder);
    state.orders.splice(deletedIndex, 1);
    if (state.ui.editingOrderIndex === deletedIndex) resetOrderForm();
    void saveState();
    renderOrders();
  });
}
