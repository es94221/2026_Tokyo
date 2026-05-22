const LOCALE_STORAGE_KEY = "family-trip-locale";
const DEFAULT_LOCALE = "zh";
const SUPPORTED_LOCALES = ["zh", "en"];

let strings = {};
let currentLocale = DEFAULT_LOCALE;
const localeCache = {};

export function getLocale() {
  return currentLocale;
}

export function getOtherLocale() {
  return currentLocale === "zh" ? "en" : "zh";
}

function getStoredLocale() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

async function fetchLocale(locale) {
  if (localeCache[locale]) return localeCache[locale];

  const response = await fetch(`./locales/${locale}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load locale: ${locale}`);
  }

  localeCache[locale] = await response.json();
  return localeCache[locale];
}

async function preloadAllLocales() {
  await Promise.all(SUPPORTED_LOCALES.map((locale) => fetchLocale(locale)));
}

export async function loadLocale(locale = getStoredLocale()) {
  const nextLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  await preloadAllLocales();

  strings = localeCache[nextLocale];
  currentLocale = nextLocale;
  localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  document.documentElement.lang = strings.meta?.lang ?? nextLocale;
  return strings;
}

export function getLegacySampleTitles() {
  const titles = new Set();
  for (const locale of SUPPORTED_LOCALES) {
    for (const title of localeCache[locale]?.legacy?.sampleTitles ?? []) {
      titles.add(title);
    }
  }
  return titles;
}

export function getLegacySampleSummaries() {
  const summaries = new Set();
  for (const locale of SUPPORTED_LOCALES) {
    for (const summary of localeCache[locale]?.legacy?.sampleSummaries ?? []) {
      summaries.add(summary);
    }
  }
  return summaries;
}

function lookup(key) {
  return key.split(".").reduce((node, part) => node?.[part], strings);
}

export function t(key, vars = {}) {
  const value = lookup(key);
  if (typeof value !== "string") return key;

  return value.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}

export function getStringList(key) {
  const value = lookup(key);
  return Array.isArray(value) ? value : [];
}

export function tHtml(key, vars = {}) {
  return t(key, vars);
}

const ORDER_TYPE_KEYS = ["hotel", "car", "activity", "restaurant", "transport"];

export function normalizeOrderType(type) {
  const raw = String(type ?? "").trim();
  if (ORDER_TYPE_KEYS.includes(raw)) return raw;

  for (const locale of SUPPORTED_LOCALES) {
    const aliases = localeCache[locale]?.orderTypeAliases ?? {};
    if (aliases[raw]) return aliases[raw];
  }

  return raw;
}

export function formatOrderType(type) {
  const key = normalizeOrderType(type);
  const label = t(`orderTypes.${key}`);
  return label === `orderTypes.${key}` ? type : label;
}

export function getOrderTypeOptionsHtml(selectedType = "hotel") {
  const selectedKey = normalizeOrderType(selectedType);

  return ORDER_TYPE_KEYS.map(
    (key) =>
      `<option value="${key}"${key === selectedKey ? " selected" : ""}>${escapeHtml(t(`orderTypes.${key}`))}</option>`,
  ).join("");
}

export function dayLabel(index) {
  return t("day.label", { number: index + 1 });
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setText(el, value) {
  if (!el) return;
  el.textContent = value;
}

function setLabelText(label, key) {
  if (!label) return;
  const control = label.querySelector("input, select, textarea");
  label.textContent = "";
  label.append(document.createTextNode(t(key)));
  if (control) label.append(control);
}

export function applyStaticTranslations() {
  setText(document.querySelector("#brandText"), t("site.brandText"));
  document.querySelector(".brand")?.setAttribute("aria-label", t("nav.brandAria"));
  document.querySelector("nav")?.setAttribute("aria-label", t("nav.ariaLabel"));

  const navLinks = document.querySelectorAll("nav a");
  const navKeys = ["overall", "orders", "wishlist", "map", "photos"];
  navLinks.forEach((link, index) => {
    if (navKeys[index]) setText(link, t(`nav.${navKeys[index]}`));
  });

  setText(document.querySelector("#heroKicker"), t("site.heroKicker"));
  setText(document.querySelector("#hero-title"), t("site.heroTitle"));
  setText(document.querySelector("#heroDescription"), t("site.heroDescription"));
  setText(document.querySelector("#primaryButton"), t("site.primaryButton"));
  setText(document.querySelector("#secondaryButton"), t("site.secondaryButton"));
  setText(document.querySelector("#heroMapNote"), t("site.mapNote"));

  const overallHeading = document.querySelector("#overall .section-heading");
  if (overallHeading) {
    setText(overallHeading.querySelector(".section-kicker"), t("overall.kicker"));
    setText(overallHeading.querySelector("#overall-title"), t("overall.title"));
    setText(overallHeading.querySelector("p"), t("overall.description"));
  }

  const tripForm = document.querySelector("#tripSettingsForm");
  if (tripForm) {
    const labels = tripForm.querySelectorAll("label");
    setLabelText(labels[0], "overall.startDate");
    setLabelText(labels[1], "overall.dayCount");
    setText(tripForm.querySelector('button[type="submit"]'), t("overall.updateDates"));
    setText(document.querySelector("#clearItinerary"), t("overall.clearItinerary"));
  }

  const ordersSection = document.querySelector("#orders");
  if (ordersSection) {
    const heading = ordersSection.querySelector(".section-heading");
    setText(heading.querySelector(".section-kicker"), t("orders.kicker"));
    setText(heading.querySelector("#orders-title"), t("orders.title"));
    setText(heading.querySelector("p"), t("orders.description"));

    const orderLabels = ordersSection.querySelectorAll("#orderForm label");
    setLabelText(orderLabels[0], "orders.type");
    setLabelText(orderLabels[1], "orders.name");
    orderLabels[1].querySelector("input").placeholder = t("orders.namePlaceholder");
    setLabelText(orderLabels[2], "orders.url");
    orderLabels[2].querySelector("input").placeholder = t("orders.urlPlaceholder");

    const selectedType = document.querySelector("#orderType")?.value ?? "hotel";
    document.querySelector("#orderType").innerHTML = getOrderTypeOptionsHtml(selectedType);
    setText(document.querySelector("#orderSubmit"), t("orders.add"));
    setText(document.querySelector("#orderCancel"), t("orders.cancelEdit"));
  }

  const wishSection = document.querySelector("#wishlist");
  if (wishSection) {
    const heading = wishSection.querySelector(".section-heading > div");
    setText(heading.querySelector(".section-kicker"), t("wishlist.kicker"));
    setText(heading.querySelector("#wishlist-title"), t("wishlist.title"));
    setText(wishSection.querySelector(".section-heading > p"), t("wishlist.description"));

    const wishLabels = wishSection.querySelectorAll("#wishlistForm label");
    setLabelText(wishLabels[0], "wishlist.person");
    wishLabels[0].querySelector("input").placeholder = t("wishlist.personPlaceholder");
    setLabelText(wishLabels[1], "wishlist.place");
    wishLabels[1].querySelector("input").placeholder = t("wishlist.placePlaceholder");
    setLabelText(wishLabels[2], "wishlist.day");
    setText(wishSection.querySelector('#wishlistForm button[type="submit"]'), t("wishlist.add"));
  }

  const mapSection = document.querySelector("#map");
  if (mapSection) {
    const heading = mapSection.querySelector(".section-heading > div");
    setText(heading.querySelector(".section-kicker"), t("map.kicker"));
    setText(heading.querySelector("#map-title"), t("map.title"));
    setText(document.querySelector("#mapDescription"), t("map.description"));
  }

  const photosSection = document.querySelector("#photos");
  if (photosSection) {
    const heading = photosSection.querySelector(".section-heading > div");
    setText(heading.querySelector(".section-kicker"), t("photos.kicker"));
    setText(heading.querySelector("#photos-title"), t("photos.title"));
    setText(photosSection.querySelector(".upload-tile span"), t("photos.upload"));
  }

  document.querySelector("#closePanel")?.setAttribute("aria-label", t("panel.closeAria"));

  const langToggle = document.querySelector("#langToggle");
  if (langToggle) {
    langToggle.textContent = t("lang.switchTo");
    langToggle.setAttribute("aria-label", t("lang.switchAria"));
  }

  document.title = t("site.browserTitle");
}
