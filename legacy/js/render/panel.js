import { escapeHtml, formatOrderType, t } from "../../i18n.js";
import { parseWishDayNumber } from "../dates.js";
import {
  getDayDisplayTitle,
  getDayTitleText,
} from "../days.js";
import { dom } from "../dom.js";
import { getOrdersForDay } from "../orders.js";
import { state } from "../state.js";

function renderDayBookings(dayNumber) {
  const relatedOrders = getOrdersForDay(dayNumber);

  if (!state.orders.length) {
    return `<div class="empty-state">${escapeHtml(t("panel.bookingsNone"))}</div>`;
  }

  if (!relatedOrders.length) {
    return `
      <div class="empty-state">
        ${escapeHtml(t("panel.bookingsNoDay", { day: dayNumber }))}
        <a href="#orders" data-close-panel>${escapeHtml(t("panel.viewAllBookings"))}</a>
      </div>
    `;
  }

  return relatedOrders
    .map(
      (order) => `
        <article class="booking-link-card">
          <span class="tag">${escapeHtml(formatOrderType(order.type))}</span>
          <strong>${escapeHtml(order.name)}</strong>
          <a class="button muted" href="${order.url}" target="_blank" rel="noreferrer">${escapeHtml(t("orders.openLink"))}</a>
        </article>
      `,
    )
    .join("");
}

export function closeDayPanel() {
  dom.dayPanel.classList.remove("open");
  dom.dayPanel.setAttribute("aria-hidden", "true");
  state.ui.openDayIndex = null;
  state.ui.openDayEditIndex = null;
}

export function openDay(index) {
  state.ui.openDayIndex = index;
  state.ui.openDayEditIndex = null;
  const day = state.days[index];
  const dayNumber = index + 1;
  const relatedWishes = state.wishes.filter(
    (wish) => parseWishDayNumber(wish.day) === dayNumber,
  );
  const timeline = day.timeline ?? [];

  dom.panelContent.innerHTML = `
    <div class="panel-hero" style="--panel-color: ${day.color}">
      <p class="trip-dates">${escapeHtml(day.date)}</p>
      <h2 id="panelTitle">${escapeHtml(getDayDisplayTitle(day, index))}</h2>
      <p>${escapeHtml(day.summary || t("overall.summaryEmpty"))}</p>
      <div class="day-meta">
        <span>${escapeHtml(day.city || t("overall.cityEmpty"))}</span>
        <span>${escapeHtml(day.stay || t("overall.stayEmpty"))}</span>
      </div>
      <div class="panel-actions">
        <button class="button muted" type="button" data-edit-day="${index}">${escapeHtml(t("panel.editDay"))}</button>
      </div>
    </div>
    <div class="timeline">
      ${
        timeline.length
          ? timeline
              .map(
                ([time, item]) => `
                  <div class="timeline-item">
                    <time>${escapeHtml(time)}</time>
                    <span>${escapeHtml(item)}</span>
                  </div>
                `,
              )
              .join("")
          : `<div class="empty-state">${escapeHtml(t("panel.timelineEmpty"))}</div>`
      }
    </div>
    <section class="timeline">
      <h3>${escapeHtml(t("panel.bookingsTitle"))}</h3>
      <div class="booking-link-list">
        ${renderDayBookings(dayNumber)}
      </div>
    </section>
    <section class="timeline">
      <h3>${escapeHtml(t("panel.wishesTitle"))}</h3>
      ${
        relatedWishes.length
          ? relatedWishes
              .map(
                (wish) => `
                  <div class="wish-card ${wish.done ? "done" : ""}">
                    <span class="tag">${escapeHtml(wish.person)}</span>
                    <strong>${escapeHtml(wish.place)}</strong>
                    <span>${escapeHtml(wish.done ? t("panel.wishScheduled") : t("panel.wishPending"))}</span>
                  </div>
                `,
              )
              .join("")
          : `<div class="empty-state">${escapeHtml(t("panel.wishesEmpty"))}</div>`
      }
    </section>
  `;

  dom.dayPanel.classList.add("open");
  dom.dayPanel.setAttribute("aria-hidden", "false");
}

export function renderDayEditForm(index) {
  state.ui.openDayEditIndex = index;
  const day = state.days[index];
  const timeline = day.timeline ?? [];

  dom.panelContent.innerHTML = `
    <form class="day-edit-form" id="dayEditForm" data-day-index="${index}">
      <div class="panel-hero" style="--panel-color: ${day.color}">
        <p class="trip-dates">${escapeHtml(t("panel.editingDay", { number: index + 1 }))}</p>
        <h2>${escapeHtml(t("panel.editTitle"))}</h2>
        <p>${escapeHtml(t("panel.editHint"))}</p>
      </div>

      <div class="edit-grid">
        <label>
          ${escapeHtml(t("panel.titleAfterDay", { number: index + 1 }))}
          <input id="editDayTitle" type="text" value="${escapeHtml(getDayTitleText(day))}" placeholder="${escapeHtml(t("panel.titlePlaceholder"))}" />
        </label>
        <div class="readonly-field">
          <span>${escapeHtml(t("panel.date"))}</span>
          <strong>${escapeHtml(day.date)}</strong>
          <small>${escapeHtml(t("panel.dateAuto"))}</small>
        </div>
        <label>
          ${escapeHtml(t("panel.city"))}
          <input id="editDayCity" type="text" value="${escapeHtml(day.city)}" placeholder="${escapeHtml(t("panel.cityPlaceholder"))}" />
        </label>
        <label>
          ${escapeHtml(t("panel.stay"))}
          <input id="editDayStay" type="text" value="${escapeHtml(day.stay)}" placeholder="${escapeHtml(t("panel.stayPlaceholder"))}" />
        </label>
        <label>
          ${escapeHtml(t("panel.color"))}
          <input id="editDayColor" type="color" value="${escapeHtml(day.color)}" />
        </label>
      </div>

      <label>
        ${escapeHtml(t("panel.summary"))}
        <textarea id="editDaySummary" rows="3" placeholder="${escapeHtml(t("panel.summaryPlaceholder"))}">${escapeHtml(day.summary)}</textarea>
      </label>

      <div class="edit-section-title">
        <h3>${escapeHtml(t("panel.timeline"))}</h3>
        <button class="button muted" type="button" data-add-timeline>${escapeHtml(t("panel.addTime"))}</button>
      </div>

      <div class="timeline-editor" id="timelineEditor">
        ${timeline
          .map(
            ([time, item]) => `
              <div class="timeline-edit-row">
                <label>
                  ${escapeHtml(t("panel.time"))}
                  <input class="timeline-time" type="text" value="${escapeHtml(time)}" placeholder="09:30" required />
                </label>
                <label>
                  ${escapeHtml(t("panel.activity"))}
                  <input class="timeline-text" type="text" value="${escapeHtml(item)}" placeholder="${escapeHtml(t("panel.activityPlaceholder"))}" required />
                </label>
                <button class="text-button" type="button" data-delete-timeline>${escapeHtml(t("panel.delete"))}</button>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="form-actions">
        <button class="button primary" type="submit">${escapeHtml(t("panel.saveDay"))}</button>
        <button class="button muted" type="button" data-cancel-day-edit="${index}">${escapeHtml(t("panel.cancel"))}</button>
      </div>
    </form>
  `;
}

export function addTimelineRow() {
  document.querySelector("#timelineEditor").insertAdjacentHTML(
    "beforeend",
    `
      <div class="timeline-edit-row">
        <label>
          ${escapeHtml(t("panel.time"))}
          <input class="timeline-time" type="text" placeholder="09:30" required />
        </label>
        <label>
          ${escapeHtml(t("panel.activity"))}
          <input class="timeline-text" type="text" placeholder="${escapeHtml(t("panel.newActivity"))}" required />
        </label>
        <button class="text-button" type="button" data-delete-timeline>${escapeHtml(t("panel.delete"))}</button>
      </div>
    `,
  );
}
