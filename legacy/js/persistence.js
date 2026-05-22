import { normalizeOrderType, t } from "../i18n.js";
import { config } from "./config.js";
import { syncDaysWithTripSettings } from "./days.js";
import { setSyncStatus } from "./sync-status.js";
import { state } from "./state.js";
import { storage } from "./storage.js";

function getSupabaseProjectUrl() {
  return config.supabase.projectUrl.replace(".supabase.cos", ".supabase.co");
}

function getSupabasePublishableKey() {
  const key = config.supabase.publishableKey.trim();
  return key.startsWith("b_publishable_") ? `s${key}` : key;
}

function getStatePayload() {
  return {
    id: config.supabase.rowId,
    trip_settings: state.tripSettings,
    days: state.days,
    orders: state.orders,
    wishes: state.wishes,
    photos: state.photos,
    updated_at: new Date().toISOString(),
  };
}

export function saveLocalState() {
  storage.set("family-trip-settings", state.tripSettings);
  storage.set("family-trip-days", state.days);
  storage.set("family-trip-orders", state.orders);
  storage.set("family-trip-wishes", state.wishes);
  storage.set("family-trip-photos", state.photos);
}

export async function saveState() {
  saveLocalState();

  if (!state.cloud.ready || !state.cloud.client) {
    if (config.supabase?.enabled && state.cloud.failureMessage) {
      setSyncStatus(state.cloud.failureMessage, "error");
      return;
    }

    setSyncStatus(
      config.supabase?.enabled ? t("sync.localPendingCloud") : t("sync.local"),
      "local",
    );
    return;
  }

  setSyncStatus(t("sync.syncing"), "syncing");
  const { error } = await state.cloud.client.from(config.supabase.tableName).upsert(getStatePayload());

  if (error) {
    console.warn("Supabase sync failed:", error);
    state.cloud.failureMessage = t("sync.cloudSyncFailed", { message: error.message });
    setSyncStatus(state.cloud.failureMessage, "error");
    return;
  }

  state.cloud.failureMessage = "";
  setSyncStatus(t("sync.cloud"), "cloud");
}

export async function connectSupabase() {
  if (!config.supabase?.enabled) {
    state.cloud.failureMessage = "";
    setSyncStatus(t("sync.local"), "local");
    return;
  }

  if (!window.supabase?.createClient) {
    state.cloud.failureMessage = t("sync.supabaseNotLoaded");
    setSyncStatus(state.cloud.failureMessage, "error");
    return;
  }

  setSyncStatus(t("sync.connecting"), "syncing");
  state.cloud.client = window.supabase.createClient(
    getSupabaseProjectUrl(),
    getSupabasePublishableKey(),
  );

  const { data, error } = await state.cloud.client
    .from(config.supabase.tableName)
    .select("trip_settings, days, orders, wishes, photos")
    .eq("id", config.supabase.rowId)
    .maybeSingle();

  if (error) {
    console.warn("Supabase load failed:", error);
    state.cloud.failureMessage = t("sync.cloudConnectFailed", { message: error.message });
    setSyncStatus(state.cloud.failureMessage, "error");
    return;
  }

  state.cloud.ready = true;
  state.cloud.failureMessage = "";

  if (data) {
    state.tripSettings = data.trip_settings ?? state.tripSettings;
    state.days = data.days ?? state.days;
    state.orders = (data.orders ?? state.orders).map((order) => ({
      ...order,
      type: normalizeOrderType(order.type),
    }));
    state.wishes = data.wishes ?? state.wishes;
    state.photos = data.photos ?? state.photos;
    syncDaysWithTripSettings();
    saveLocalState();
    setSyncStatus(t("sync.cloud"), "cloud");
    return;
  }

  await saveState();
}
