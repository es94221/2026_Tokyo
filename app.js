const defaultOrders = config.defaultOrders;
const defaultWishes = config.defaultWishes;
const defaultTripSettings = config.tripSettings;
const dayColorPalette = config.dayColors;
const legacySampleTitles = new Set(["抵達與慢慢集合", "老城、咖啡與散步", "自然景點與活動預約", "早午餐與回程"]);
const legacySampleSummaries = new Set([
  "機場接送、入住、附近散步，晚上一起吃第一餐。",
  "不趕路的一天：老城區、咖啡店、市集與適合拍照的小巷。",
  "安排半日活動，下午留白，適合家庭照與小朋友自由活動。",
  "保留最後採買與彈性時間，確認車班與航班資訊。",
]);

const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

let tripSettings = storage.get("family-trip-settings", defaultTripSettings);
let days = storage.get("family-trip-days", config.days);
let orders = storage.get("family-trip-orders", defaultOrders);
let wishes = storage.get("family-trip-wishes", defaultWishes);
let photos = storage.get("family-trip-photos", []);
let editingOrderIndex = null;
let supabaseClient = null;
let cloudReady = false;
let cloudFailureMessage = "";

const dayGrid = document.querySelector("#dayGrid");
const dayPanel = document.querySelector("#dayPanel");
const panelContent = document.querySelector("#panelContent");
const closePanel = document.querySelector("#closePanel");
const orderForm = document.querySelector("#orderForm");
const orderList = document.querySelector("#orderList");
const orderSubmit = document.querySelector("#orderSubmit");
const orderCancel = document.querySelector("#orderCancel");
const tripSettingsForm = document.querySelector("#tripSettingsForm");
const tripStartDate = document.querySelector("#tripStartDate");
const tripDayCount = document.querySelector("#tripDayCount");
const clearItinerary = document.querySelector("#clearItinerary");
const wishlistForm = document.querySelector("#wishlistForm");
const wishDay = document.querySelector("#wishDay");
const wishBoard = document.querySelector("#wishBoard");
const photoInput = document.querySelector("#photoInput");
const photoGrid = document.querySelector("#photoGrid");
const mapShell = document.querySelector("#mapShell");
const syncStatus = document.querySelector("#syncStatus");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setSyncStatus(message, status = "local") {
  syncStatus.textContent = message;
  syncStatus.dataset.status = status;
  syncStatus.title = message;
}

function getSupabaseProjectUrl() {
  return config.supabase.projectUrl.replace(".supabase.cos", ".supabase.co");
}

function getSupabasePublishableKey() {
  const key = config.supabase.publishableKey.trim();
  return key.startsWith("b_publishable_") ? `s${key}` : key;
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTripDate(startDate, offset) {
  const date = parseDateInput(startDate);
  date.setDate(date.getDate() + offset);
  const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return `${date.getMonth() + 1}/${date.getDate()} ${weekdays[date.getDay()]}`;
}

function getDayTitleText(day) {
  return String(day.title ?? "").replace(/^Day\s*\d+\s*[｜|]\s*/i, "").trim();
}

function getDayDisplayTitle(day, index) {
  const titleText = getDayTitleText(day);
  return titleText ? `Day ${index + 1}｜${titleText}` : `Day ${index + 1}`;
}

function makeDefaultDay(index) {
  return {
    title: "",
    date: formatTripDate(tripSettings.startDate, index),
    color: dayColorPalette[index % dayColorPalette.length],
    summary: "",
    city: "",
    stay: "",
    timeline: [],
  };
}

function syncDaysWithTripSettings() {
  tripSettings = {
    ...defaultTripSettings,
    ...tripSettings,
  };

  const nextCount = Math.max(1, Math.min(Number(tripSettings.dayCount) || 1, 30));
  tripSettings.dayCount = nextCount;

  if (days.length < nextCount) {
    const needed = nextCount - days.length;
    const start = days.length;
    days = [...days, ...Array.from({ length: needed }, (_, index) => makeDefaultDay(start + index))];
  }

  if (days.length > nextCount) {
    days = days.slice(0, nextCount);
  }

  days = days.map((day, index) => ({
    ...day,
    title: getDayTitleText(day),
    date: formatTripDate(tripSettings.startDate, index),
    color: dayColorPalette[index % dayColorPalette.length],
  }));
}

function clearLegacySampleItinerary() {
  let changed = false;

  days = days.map((day, index) => {
    const titleText = getDayTitleText(day);
    const isLegacySample = legacySampleTitles.has(titleText) || legacySampleSummaries.has(day.summary);

    if (!isLegacySample) return day;

    changed = true;
    return {
      ...day,
      title: "",
      date: formatTripDate(tripSettings.startDate, index),
      summary: "",
      city: "",
      stay: "",
      timeline: [],
    };
  });

  return changed;
}

function renderTripSettings() {
  tripStartDate.value = tripSettings.startDate;
  tripDayCount.value = tripSettings.dayCount;
}

function getStatePayload() {
  return {
    id: config.supabase.rowId,
    trip_settings: tripSettings,
    days,
    orders,
    wishes,
    photos,
    updated_at: new Date().toISOString(),
  };
}

function saveLocalState() {
  storage.set("family-trip-settings", tripSettings);
  storage.set("family-trip-days", days);
  storage.set("family-trip-orders", orders);
  storage.set("family-trip-wishes", wishes);
  storage.set("family-trip-photos", photos);
}

async function saveState() {
  saveLocalState();

  if (!cloudReady || !supabaseClient) {
    if (config.supabase?.enabled && cloudFailureMessage) {
      setSyncStatus(cloudFailureMessage, "error");
      return;
    }

    setSyncStatus(config.supabase?.enabled ? "尚未連上雲端，已本機儲存" : "本機儲存", "local");
    return;
  }

  setSyncStatus("同步中...", "syncing");
  const { error } = await supabaseClient.from(config.supabase.tableName).upsert(getStatePayload());

  if (error) {
    console.warn("Supabase sync failed:", error);
    cloudFailureMessage = `雲端同步失敗：${error.message}`;
    setSyncStatus(cloudFailureMessage, "error");
    return;
  }

  cloudFailureMessage = "";
  setSyncStatus("雲端已同步", "cloud");
}

async function connectSupabase() {
  if (!config.supabase?.enabled) {
    cloudFailureMessage = "";
    setSyncStatus("本機儲存", "local");
    return;
  }

  if (!window.supabase?.createClient) {
    cloudFailureMessage = "Supabase 套件未載入，請確認 index.html 的 CDN script 已部署";
    setSyncStatus(cloudFailureMessage, "error");
    return;
  }

  setSyncStatus("連接雲端中...", "syncing");
  supabaseClient = window.supabase.createClient(getSupabaseProjectUrl(), getSupabasePublishableKey());

  const { data, error } = await supabaseClient
    .from(config.supabase.tableName)
    .select("trip_settings, days, orders, wishes, photos")
    .eq("id", config.supabase.rowId)
    .maybeSingle();

  if (error) {
    console.warn("Supabase load failed:", error);
    cloudFailureMessage = `雲端連接失敗：${error.message}`;
    setSyncStatus(cloudFailureMessage, "error");
    return;
  }

  cloudReady = true;
  cloudFailureMessage = "";

  if (data) {
    tripSettings = data.trip_settings ?? tripSettings;
    days = data.days ?? days;
    orders = data.orders ?? orders;
    wishes = data.wishes ?? wishes;
    photos = data.photos ?? photos;
    syncDaysWithTripSettings();
    saveLocalState();
    setSyncStatus("雲端已同步", "cloud");
    return;
  }

  await saveState();
}

function renderSiteCopy() {
  document.title = config.site.browserTitle;
  document.querySelector("#brandText").textContent = config.site.brandText;
  document.querySelector("#heroKicker").textContent = config.site.heroKicker;
  document.querySelector("#hero-title").textContent = config.site.heroTitle;
  document.querySelector("#heroDescription").textContent = config.site.heroDescription;
  document.querySelector("#primaryButton").textContent = config.site.primaryButton;
  document.querySelector("#secondaryButton").textContent = config.site.secondaryButton;
  document.querySelector("#heroDayCount").textContent = `${days.length} Days`;
  document.querySelector("#heroMapNote").textContent = config.site.mapNote;
  document.querySelector("#map-title").textContent = config.map.title;
  document.querySelector("#mapDescription").textContent = config.map.description;
}

function renderDays() {
  dayGrid.innerHTML = days
    .map(
      (day, index) => `
        <button class="day-card" type="button" data-day="${index}" style="--day-color: ${day.color}">
          <div class="day-number">
            <span>${day.date}</span>
            <span>${index + 1}</span>
          </div>
          <h3>${getDayDisplayTitle(day, index)}</h3>
          <p>${day.summary || "尚未填寫這一天的摘要。"}</p>
          <div class="day-meta">
            <span>${day.city || "城市未填"}</span>
            <span>${day.stay || "住宿未填"}</span>
          </div>
        </button>
      `,
    )
    .join("");
}

function renderDayOptions() {
  wishDay.innerHTML = days.map((_, index) => `<option>Day ${index + 1}</option>`).join("");
}

function renderMap() {
  const query = config.map.query.trim();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (!config.map.googleMapsApiKey.trim()) {
    mapShell.innerHTML = `
      <div class="map-fallback">
        <span class="tag">尚未設定 API key</span>
        <h3>${query}</h3>
        <p>在 <strong>trip-data.js</strong> 的 <strong>googleMapsApiKey</strong> 貼上你的 Google Maps Embed API key 後，這裡會自動變成互動地圖。</p>
        <a class="button primary" href="${mapsUrl}" target="_blank" rel="noreferrer">先用 Google Maps 打開</a>
      </div>
    `;
    return;
  }

  const embedUrl = new URL("https://www.google.com/maps/embed/v1/place");
  embedUrl.searchParams.set("key", config.map.googleMapsApiKey);
  embedUrl.searchParams.set("q", query);
  embedUrl.searchParams.set("zoom", config.map.zoom);

  mapShell.innerHTML = `
    <iframe
      title="${config.map.title}"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
      src="${embedUrl.toString()}"
    ></iframe>
  `;
}

function getOrdersForDay(dayNumber) {
  const dayPattern = new RegExp(`\\bday\\s*${dayNumber}\\b`, "i");
  return orders.filter((order) => dayPattern.test(order.name) || dayPattern.test(order.type));
}

function renderDayBookings(dayNumber) {
  const relatedOrders = getOrdersForDay(dayNumber);

  if (!orders.length) {
    return '<div class="empty-state">目前還沒有 Booking 連結。可以先到 Bookings 區塊新增飯店、訂車或活動預約。</div>';
  }

  if (!relatedOrders.length) {
    return `
      <div class="empty-state">
        目前沒有標記為 Day ${dayNumber} 的 Booking。新增訂單時可以在名稱寫上「Day ${dayNumber}」，例如「Day ${dayNumber} 飯店確認信」。
        <a href="#orders" data-close-panel>查看全部 Bookings</a>
      </div>
    `;
  }

  return relatedOrders
    .map(
      (order) => `
        <article class="booking-link-card">
          <span class="tag">${order.type}</span>
          <strong>${order.name}</strong>
          <a class="button muted" href="${order.url}" target="_blank" rel="noreferrer">打開訂單連結</a>
        </article>
      `,
    )
    .join("");
}

function openDay(index) {
  const day = days[index];
  const dayNumber = index + 1;
  const relatedWishes = wishes.filter((wish) => wish.day === `Day ${index + 1}`);
  const timeline = day.timeline ?? [];
  panelContent.innerHTML = `
    <div class="panel-hero" style="--panel-color: ${day.color}">
      <p class="trip-dates">${day.date}</p>
      <h2 id="panelTitle">${getDayDisplayTitle(day, index)}</h2>
      <p>${day.summary || "尚未填寫這一天的摘要。"}</p>
      <div class="day-meta">
        <span>${day.city || "城市未填"}</span>
        <span>${day.stay || "住宿未填"}</span>
      </div>
      <div class="panel-actions">
        <button class="button muted" type="button" data-edit-day="${index}">編輯這一天</button>
      </div>
    </div>
    <div class="timeline">
      ${
        timeline.length
          ? timeline
              .map(
                ([time, item]) => `
                  <div class="timeline-item">
                    <time>${time}</time>
                    <span>${item}</span>
                  </div>
                `,
              )
              .join("")
          : '<div class="empty-state">這一天還沒有新增時間與行程。</div>'
      }
    </div>
    <section class="timeline">
      <h3>這一天的 Booking 連結</h3>
      <div class="booking-link-list">
        ${renderDayBookings(dayNumber)}
      </div>
    </section>
    <section class="timeline">
      <h3>這一天想加入的點</h3>
      ${
        relatedWishes.length
          ? relatedWishes
              .map(
                (wish) => `
                  <div class="wish-card ${wish.done ? "done" : ""}">
                    <span class="tag">${wish.person}</span>
                    <strong>${wish.place}</strong>
                    <span>${wish.done ? "已排入行程" : "待討論"}</span>
                  </div>
                `,
              )
              .join("")
          : '<div class="empty-state">目前還沒有新增想去的點。</div>'
      }
    </section>
  `;
  dayPanel.classList.add("open");
  dayPanel.setAttribute("aria-hidden", "false");
}

function renderDayEditForm(index) {
  const day = days[index];
  const timeline = day.timeline ?? [];
  panelContent.innerHTML = `
    <form class="day-edit-form" id="dayEditForm" data-day-index="${index}">
      <div class="panel-hero" style="--panel-color: ${day.color}">
        <p class="trip-dates">Editing Day ${index + 1}</p>
        <h2>編輯單日行程</h2>
        <p>修改後按「儲存這一天」，Overall Itinerary 和單日詳情會一起更新。</p>
      </div>

      <div class="edit-grid">
        <label>
          Day ${index + 1} 後面的標題文字
          <input id="editDayTitle" type="text" value="${escapeHtml(getDayTitleText(day))}" placeholder="例：抵達與慢慢集合" />
        </label>
        <div class="readonly-field">
          <span>日期</span>
          <strong>${escapeHtml(day.date)}</strong>
          <small>由 Overall 的開始日期與天數自動計算</small>
        </div>
        <label>
          城市/區域
          <input id="editDayCity" type="text" value="${escapeHtml(day.city)}" placeholder="例：Amsterdam" />
        </label>
        <label>
          住宿/狀態
          <input id="editDayStay" type="text" value="${escapeHtml(day.stay)}" placeholder="例：飯店名稱 / 回家 / 待確認" />
        </label>
        <label>
          色塊顏色
          <input id="editDayColor" type="color" value="${escapeHtml(day.color)}" />
        </label>
      </div>

      <label>
        摘要
        <textarea id="editDaySummary" rows="3" placeholder="寫下這一天的大方向或提醒">${escapeHtml(day.summary)}</textarea>
      </label>

      <div class="edit-section-title">
        <h3>時間與行程</h3>
        <button class="button muted" type="button" data-add-timeline>新增時間</button>
      </div>

      <div class="timeline-editor" id="timelineEditor">
        ${timeline
          .map(
            ([time, item]) => `
              <div class="timeline-edit-row">
                <label>
                  時間
                  <input class="timeline-time" type="text" value="${escapeHtml(time)}" placeholder="09:30" required />
                </label>
                <label>
                  行程
                  <input class="timeline-text" type="text" value="${escapeHtml(item)}" placeholder="早餐後出門" required />
                </label>
                <button class="text-button" type="button" data-delete-timeline>刪除</button>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="form-actions">
        <button class="button primary" type="submit">儲存這一天</button>
        <button class="button muted" type="button" data-cancel-day-edit="${index}">取消</button>
      </div>
    </form>
  `;
}

function addTimelineRow() {
  document.querySelector("#timelineEditor").insertAdjacentHTML(
    "beforeend",
    `
      <div class="timeline-edit-row">
        <label>
          時間
          <input class="timeline-time" type="text" placeholder="09:30" required />
        </label>
        <label>
          行程
          <input class="timeline-text" type="text" placeholder="新增行程" required />
        </label>
        <button class="text-button" type="button" data-delete-timeline>刪除</button>
      </div>
    `,
  );
}

function saveDayEdit(form) {
  const index = Number(form.dataset.dayIndex);
  const timeline = [...form.querySelectorAll(".timeline-edit-row")]
    .map((row) => [
      row.querySelector(".timeline-time").value.trim(),
      row.querySelector(".timeline-text").value.trim(),
    ])
    .filter(([time, item]) => time && item);

  days[index] = {
    title: document.querySelector("#editDayTitle").value.trim(),
    date: formatTripDate(tripSettings.startDate, index),
    color: document.querySelector("#editDayColor").value,
    summary: document.querySelector("#editDaySummary").value.trim(),
    city: document.querySelector("#editDayCity").value.trim(),
    stay: document.querySelector("#editDayStay").value.trim(),
    timeline,
  };

  void saveState();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
  openDay(index);
}

function clearItineraryContent() {
  days = days.map((day, index) => ({
    ...day,
    title: "",
    date: formatTripDate(tripSettings.startDate, index),
    summary: "",
    city: "",
    stay: "",
    timeline: [],
  }));
  void saveState();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
}

function closeDayPanel() {
  dayPanel.classList.remove("open");
  dayPanel.setAttribute("aria-hidden", "true");
}

function renderOrders() {
  orderList.innerHTML = orders.length
    ? orders
        .map(
          (order, index) => `
            <article class="order-card">
              <div class="order-top">
                <div>
                  <span class="tag">${order.type}</span>
                  <h3>${order.name}</h3>
                </div>
                <div class="card-actions">
                  <button class="text-button" type="button" data-edit-order="${index}">編輯</button>
                  <button class="text-button" type="button" data-delete-order="${index}">刪除</button>
                </div>
              </div>
              <a class="button muted" href="${order.url}" target="_blank" rel="noreferrer">打開訂單連結</a>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">還沒有訂單連結。可以先貼 Gmail 搜尋連結、飯店確認頁或雲端檔案。</div>';
}

function resetOrderForm() {
  editingOrderIndex = null;
  orderForm.reset();
  orderSubmit.textContent = "加入訂單";
  orderCancel.classList.add("hidden");
}

function editOrder(index) {
  const order = orders[index];
  editingOrderIndex = index;
  document.querySelector("#orderType").value = order.type;
  document.querySelector("#orderName").value = order.name;
  document.querySelector("#orderUrl").value = order.url;
  orderSubmit.textContent = "儲存修改";
  orderCancel.classList.remove("hidden");
  orderForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderWishes() {
  wishBoard.innerHTML = wishes.length
    ? wishes
        .map(
          (wish, index) => `
            <article class="wish-card ${wish.done ? "done" : ""}">
              <div class="wish-top">
                <div>
                  <span class="tag">${wish.day} · ${wish.person}</span>
                  <h3>${wish.place}</h3>
                </div>
                <button class="text-button" type="button" data-delete-wish="${index}">刪除</button>
              </div>
              <label class="check-row">
                <input type="checkbox" data-toggle-wish="${index}" ${wish.done ? "checked" : ""} />
                已排進行程
              </label>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">還沒有想去的點。每個人都可以新增自己的願望清單。</div>';
}

function renderPhotos() {
  photoGrid.innerHTML = photos.length
    ? photos
        .map(
          (photo, index) => `
            <figure class="photo">
              <img src="${photo}" alt="家族旅遊照片 ${index + 1}" />
              <button type="button" data-delete-photo="${index}" aria-label="刪除照片">×</button>
            </figure>
          `,
        )
        .join("")
    : '<div class="empty-state">旅途中可以把照片上傳到這裡，這台瀏覽器會先記住預覽。</div>';
}

dayGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-day]");
  if (card) openDay(Number(card.dataset.day));
});

closePanel.addEventListener("click", closeDayPanel);
dayPanel.addEventListener("click", (event) => {
  if (event.target === dayPanel) closeDayPanel();
});

panelContent.addEventListener("click", (event) => {
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

panelContent.addEventListener("submit", (event) => {
  const form = event.target.closest("#dayEditForm");
  if (!form) return;
  event.preventDefault();
  saveDayEdit(form);
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const order = {
    type: document.querySelector("#orderType").value,
    name: document.querySelector("#orderName").value.trim(),
    url: document.querySelector("#orderUrl").value.trim(),
  };

  if (editingOrderIndex === null) {
    orders = [order, ...orders];
  } else {
    orders[editingOrderIndex] = order;
  }

  void saveState();
  resetOrderForm();
  renderOrders();
});

orderCancel.addEventListener("click", resetOrderForm);

orderList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-order]");
  if (editButton) {
    editOrder(Number(editButton.dataset.editOrder));
    return;
  }

  const button = event.target.closest("[data-delete-order]");
  if (!button) return;
  const deletedIndex = Number(button.dataset.deleteOrder);
  orders.splice(deletedIndex, 1);
  if (editingOrderIndex === deletedIndex) resetOrderForm();
  void saveState();
  renderOrders();
});

tripSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  tripSettings = {
    startDate: tripStartDate.value,
    dayCount: Number(tripDayCount.value),
  };
  syncDaysWithTripSettings();
  wishes = wishes.filter((wish) => {
    const dayNumber = Number(String(wish.day).replace(/\D/g, ""));
    return !dayNumber || dayNumber <= tripSettings.dayCount;
  });
  void saveState();
  renderTripSettings();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
  renderWishes();
});

clearItinerary.addEventListener("click", () => {
  const shouldClear = window.confirm("確定要清空所有日程內容嗎？日期與天數會保留，標題、摘要、城市、住宿與時間表會清空。");
  if (!shouldClear) return;
  clearItineraryContent();
});

wishlistForm.addEventListener("submit", (event) => {
  event.preventDefault();
  wishes = [
    {
      person: document.querySelector("#wishPerson").value.trim(),
      place: document.querySelector("#wishPlace").value.trim(),
      day: wishDay.value,
      done: false,
    },
    ...wishes,
  ];
  void saveState();
  wishlistForm.reset();
  renderWishes();
});

wishBoard.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-wish]");
  if (deleteButton) {
    wishes.splice(Number(deleteButton.dataset.deleteWish), 1);
    void saveState();
    renderWishes();
    return;
  }

  const checkbox = event.target.closest("[data-toggle-wish]");
  if (checkbox) {
    wishes[Number(checkbox.dataset.toggleWish)].done = checkbox.checked;
    void saveState();
    renderWishes();
  }
});

photoInput.addEventListener("change", async (event) => {
  const files = [...event.target.files].slice(0, 12);
  const reads = files.map(
    (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      }),
  );
  photos = [...(await Promise.all(reads)), ...photos].slice(0, 30);
  void saveState();
  photoInput.value = "";
  renderPhotos();
});

photoGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-photo]");
  if (!button) return;
  photos.splice(Number(button.dataset.deletePhoto), 1);
  void saveState();
  renderPhotos();
});

syncStatus.addEventListener("click", async () => {
  cloudReady = false;
  cloudFailureMessage = "";
  await connectSupabase();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
  renderOrders();
  renderWishes();
  renderPhotos();
});

async function initApp() {
  syncDaysWithTripSettings();
  renderTripSettings();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
  renderMap();
  renderOrders();
  renderWishes();
  renderPhotos();

  await connectSupabase();
  syncDaysWithTripSettings();
  const clearedLegacySamples = clearLegacySampleItinerary();
  if (clearedLegacySamples) await saveState();

  renderTripSettings();
  renderDays();
  renderDayOptions();
  renderSiteCopy();
  renderMap();
  renderOrders();
  renderWishes();
  renderPhotos();
}

void initApp();
