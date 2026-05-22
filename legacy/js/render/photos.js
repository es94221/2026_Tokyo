import { escapeHtml, t } from "../../i18n.js";
import { dom } from "../dom.js";
import { state } from "../state.js";

export function renderPhotos() {
  dom.photoGrid.innerHTML = state.photos.length
    ? state.photos
        .map(
          (photo, index) => `
            <figure class="photo">
              <img src="${photo}" alt="${escapeHtml(t("photos.alt", { index: index + 1 }))}" />
              <button type="button" data-delete-photo="${index}" aria-label="${escapeHtml(t("photos.deleteAria"))}">×</button>
            </figure>
          `,
        )
        .join("")
    : `<div class="empty-state">${escapeHtml(t("photos.empty"))}</div>`;
}
