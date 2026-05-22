import { dom } from "../dom.js";
import { saveState } from "../persistence.js";
import { renderWishes } from "../render/wishes.js";
import { state } from "../state.js";

export function bindWishEvents() {
  dom.wishlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.wishes = [
      {
        person: document.querySelector("#wishPerson").value.trim(),
        place: document.querySelector("#wishPlace").value.trim(),
        day: dom.wishDay.value,
        done: false,
      },
      ...state.wishes,
    ];
    void saveState();
    dom.wishlistForm.reset();
    renderWishes();
  });

  dom.wishBoard.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-wish]");
    if (deleteButton) {
      state.wishes.splice(Number(deleteButton.dataset.deleteWish), 1);
      void saveState();
      renderWishes();
      return;
    }

    const checkbox = event.target.closest("[data-toggle-wish]");
    if (checkbox) {
      state.wishes[Number(checkbox.dataset.toggleWish)].done = checkbox.checked;
      void saveState();
      renderWishes();
    }
  });
}
