import { dom } from "../dom.js";
import { saveState } from "../persistence.js";
import { renderPhotos } from "../render/photos.js";
import { state } from "../state.js";

export function bindPhotoEvents() {
  dom.photoInput.addEventListener("change", async (event) => {
    const files = [...event.target.files].slice(0, 12);
    const reads = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        }),
    );
    state.photos = [...(await Promise.all(reads)), ...state.photos].slice(0, 30);
    void saveState();
    dom.photoInput.value = "";
    renderPhotos();
  });

  dom.photoGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-photo]");
    if (!button) return;
    state.photos.splice(Number(button.dataset.deletePhoto), 1);
    void saveState();
    renderPhotos();
  });
}
