import { saveDayEdit } from "../actions/panel.js";
import { dom } from "../dom.js";
import {
  addTimelineRow,
  closeDayPanel,
  openDay,
  renderDayEditForm,
} from "../render/panel.js";

export function bindPanelEvents() {
  dom.dayGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-day]");
    if (card) openDay(Number(card.dataset.day));
  });

  dom.closePanel.addEventListener("click", closeDayPanel);

  dom.dayPanel.addEventListener("click", (event) => {
    if (event.target === dom.dayPanel) closeDayPanel();
  });

  dom.panelContent.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-panel]")) {
      closeDayPanel();
      return;
    }

    const editButton = event.target.closest("[data-edit-day]");
    if (editButton) {
      renderDayEditForm(Number(editButton.dataset.editDay));
      return;
    }

    const cancelButton = event.target.closest("[data-cancel-day-edit]");
    if (cancelButton) {
      openDay(Number(cancelButton.dataset.cancelDayEdit));
      return;
    }

    if (event.target.closest("[data-add-timeline]")) {
      addTimelineRow();
      return;
    }

    const deleteTimelineButton = event.target.closest("[data-delete-timeline]");
    if (deleteTimelineButton) {
      deleteTimelineButton.closest(".timeline-edit-row").remove();
    }
  });

  dom.panelContent.addEventListener("submit", (event) => {
    const form = event.target.closest("#dayEditForm");
    if (!form) return;
    event.preventDefault();
    saveDayEdit(form);
  });
}
