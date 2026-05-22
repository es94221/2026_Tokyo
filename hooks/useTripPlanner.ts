"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  dayColorPalette,
  defaultDays,
  defaultOrders,
  defaultTripSettings,
  defaultWishes,
  tripConfig,
} from "@/lib/config";
import {
  clearItineraryContent,
  clearLegacySampleItinerary,
  dayLabel as getDayLabel,
  getDayDisplayTitle,
  getDayTitleText,
  syncDaysWithTripSettings,
} from "@/lib/days-logic";
import { parseWishDayNumber } from "@/lib/dates";
import { normalizeOrderType } from "@/lib/i18n-utils";
import { storage } from "@/lib/storage";
import { getSupabaseClient } from "@/lib/supabase-client";
import type {
  Order,
  SyncMessageKey,
  SyncStatusKind,
  TripDay,
  TripSettings,
  Wish,
} from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";

type PanelMode = { type: "view"; index: number } | { type: "edit"; index: number } | null;

export function useTripPlanner() {
  const { t, messages, formatOrderType } = useLocale();

  const [tripSettings, setTripSettings] = useState<TripSettings>(defaultTripSettings);
  const [days, setDays] = useState<TripDay[]>(defaultDays);
  const [orders, setOrders] = useState<Order[]>(() =>
    defaultOrders.map((o) => ({ ...o, type: normalizeOrderType(o.type) })),
  );
  const [wishes, setWishes] = useState<Wish[]>(defaultWishes);
  const [photos, setPhotos] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [syncMessageKey, setSyncMessageKey] = useState<SyncMessageKey>("local");
  const [syncStatus, setSyncStatus] = useState<SyncStatusKind>("local");
  const [syncErrorDetail, setSyncErrorDetail] = useState("");
  const [cloudReady, setCloudReady] = useState(false);

  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(null);

  const setStatus = useCallback(
    (messageKey: SyncMessageKey, status: SyncStatusKind, errorDetail = "") => {
      setSyncMessageKey(messageKey);
      setSyncStatus(status);
      setSyncErrorDetail(errorDetail);
    },
    [],
  );

  const syncMessage = useMemo(() => {
    const key = `sync.${syncMessageKey}`;
    if (
      syncErrorDetail &&
      (syncMessageKey === "cloudSyncFailed" || syncMessageKey === "cloudConnectFailed")
    ) {
      return t(key, { message: syncErrorDetail });
    }
    return t(key);
  }, [syncMessageKey, syncErrorDetail, t]);

  const saveLocal = useCallback(
    (next: {
      tripSettings?: TripSettings;
      days?: TripDay[];
      orders?: Order[];
      wishes?: Wish[];
      photos?: string[];
    }) => {
      const settings = next.tripSettings ?? tripSettings;
      const nextDays = next.days ?? days;
      const nextOrders = next.orders ?? orders;
      const nextWishes = next.wishes ?? wishes;
      const nextPhotos = next.photos ?? photos;
      storage.set("family-trip-settings", settings);
      storage.set("family-trip-days", nextDays);
      storage.set("family-trip-orders", nextOrders);
      storage.set("family-trip-wishes", nextWishes);
      storage.set("family-trip-photos", nextPhotos);
    },
    [tripSettings, days, orders, wishes, photos],
  );

  const getPayload = useCallback(
    (state: {
      tripSettings: TripSettings;
      days: TripDay[];
      orders: Order[];
      wishes: Wish[];
      photos: string[];
    }) => ({
      id: tripConfig.supabase.rowId,
      trip_settings: state.tripSettings,
      days: state.days,
      orders: state.orders,
      wishes: state.wishes,
      photos: state.photos,
      updated_at: new Date().toISOString(),
    }),
    [],
  );

  const saveState = useCallback(
    async (override?: Partial<{
      tripSettings: TripSettings;
      days: TripDay[];
      orders: Order[];
      wishes: Wish[];
      photos: string[];
    }>) => {
      const state = {
        tripSettings: override?.tripSettings ?? tripSettings,
        days: override?.days ?? days,
        orders: override?.orders ?? orders,
        wishes: override?.wishes ?? wishes,
        photos: override?.photos ?? photos,
      };
      saveLocal(state);

      const client = getSupabaseClient();
      if (!cloudReady || !client) {
        if (tripConfig.supabase.enabled && syncStatus === "error" && syncErrorDetail) {
          return;
        }
        setStatus(
          tripConfig.supabase.enabled ? "localPendingCloud" : "local",
          "local",
        );
        return;
      }

      setStatus("syncing", "syncing");
      const { error } = await client.from(tripConfig.supabase.tableName).upsert(getPayload(state));

      if (error) {
        console.warn("Supabase sync failed:", error);
        setStatus("cloudSyncFailed", "error", error.message);
        return;
      }

      setStatus("cloud", "cloud");
    },
    [
      tripSettings,
      days,
      orders,
      wishes,
      photos,
      cloudReady,
      syncStatus,
      syncErrorDetail,
      saveLocal,
      getPayload,
      setStatus,
    ],
  );

  const applySyncedDays = useCallback(
    (nextDays: TripDay[], settings: TripSettings) => {
      const synced = syncDaysWithTripSettings(nextDays, settings, messages);
      setTripSettings(synced.tripSettings);
      setDays(synced.days);
      return synced;
    },
    [messages],
  );

  const connectSupabase = useCallback(async () => {
    if (!tripConfig.supabase.enabled) {
      setStatus("local", "local");
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setStatus("supabaseNotLoaded", "error");
      return;
    }

    setStatus("connecting", "syncing");

    const { data, error } = await client
      .from(tripConfig.supabase.tableName)
      .select("trip_settings, days, orders, wishes, photos")
      .eq("id", tripConfig.supabase.rowId)
      .maybeSingle();

    if (error) {
      console.warn("Supabase load failed:", error);
      setStatus("cloudConnectFailed", "error", error.message);
      return;
    }

    setCloudReady(true);

    if (data) {
      const settings = (data.trip_settings as TripSettings) ?? tripSettings;
      const loadedDays = (data.days as TripDay[]) ?? days;
      const loadedOrders = ((data.orders as Order[]) ?? orders).map((order) => ({
        ...order,
        type: normalizeOrderType(order.type),
      }));
      const loadedWishes = (data.wishes as Wish[]) ?? wishes;
      const loadedPhotos = (data.photos as string[]) ?? photos;

      const synced = applySyncedDays(loadedDays, settings);
      setOrders(loadedOrders);
      setWishes(loadedWishes);
      setPhotos(loadedPhotos);
      saveLocal({
        tripSettings: synced.tripSettings,
        days: synced.days,
        orders: loadedOrders,
        wishes: loadedWishes,
        photos: loadedPhotos,
      });
      setStatus("cloud", "cloud");
      return;
    }

    await saveState();
  }, [tripSettings, days, orders, wishes, photos, applySyncedDays, saveLocal, saveState, setStatus]);

  useEffect(() => {
    const settings = storage.get("family-trip-settings", defaultTripSettings);
    const loadedDays = storage.get("family-trip-days", defaultDays);
    const loadedOrders = storage
      .get("family-trip-orders", defaultOrders)
      .map((o: Order) => ({ ...o, type: normalizeOrderType(o.type) }));
    const loadedWishes = storage.get("family-trip-wishes", defaultWishes);
    const loadedPhotos = storage.get("family-trip-photos", []);

    const synced = syncDaysWithTripSettings(loadedDays, settings, messages);
    setTripSettings(synced.tripSettings);
    setDays(synced.days);
    setOrders(loadedOrders);
    setWishes(loadedWishes);
    setPhotos(loadedPhotos);
    setHydrated(true);
  }, [messages]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      await connectSupabase();
      setDays((currentDays) => {
        const { days: clearedDays, changed } = clearLegacySampleItinerary(
          currentDays,
          tripSettings,
          messages,
        );
        if (changed) {
          void saveState({ days: clearedDays });
          return clearedDays;
        }
        return currentDays;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after hydration
  }, [hydrated]);

  const dayLabel = useCallback((index: number) => getDayLabel(index, t), [t]);

  const displayDayTitle = useCallback(
    (day: TripDay, index: number) => getDayDisplayTitle(day, index, t),
    [t],
  );

  const openDay = useCallback((index: number) => {
    setPanelMode({ type: "view", index });
  }, []);

  const openDayEdit = useCallback((index: number) => {
    setPanelMode({ type: "edit", index });
  }, []);

  const closePanel = useCallback(() => setPanelMode(null), []);

  const updateTripSettings = useCallback(
    async (startDate: string, dayCount: number) => {
      const settings = { startDate, dayCount };
      const synced = syncDaysWithTripSettings(days, settings, messages);
      const nextWishes = wishes.filter((wish) => {
        const dayNumber = parseWishDayNumber(wish.day);
        return !dayNumber || dayNumber <= synced.tripSettings.dayCount;
      });
      setTripSettings(synced.tripSettings);
      setDays(synced.days);
      setWishes(nextWishes);
      await saveState({
        tripSettings: synced.tripSettings,
        days: synced.days,
        wishes: nextWishes,
      });
    },
    [days, wishes, messages, saveState],
  );

  const clearItinerary = useCallback(async () => {
    const cleared = clearItineraryContent(days, tripSettings, messages);
    setDays(cleared);
    await saveState({ days: cleared });
  }, [days, tripSettings, messages, saveState]);

  const saveDayEdit = useCallback(
    async (index: number, data: Pick<TripDay, "title" | "color" | "summary" | "city" | "stay" | "timeline">) => {
      const nextDays = [...days];
      nextDays[index] = {
        ...data,
        title: getDayTitleText({ ...days[index], ...data }),
        date: days[index].date,
      };
      const synced = syncDaysWithTripSettings(nextDays, tripSettings, messages);
      setTripSettings(synced.tripSettings);
      setDays(synced.days);
      await saveState({ tripSettings: synced.tripSettings, days: synced.days });
      setPanelMode({ type: "view", index });
    },
    [days, tripSettings, messages, saveState],
  );

  const addOrder = useCallback(
    async (order: Order) => {
      const next =
        editingOrderIndex === null
          ? [order, ...orders]
          : orders.map((o, i) => (i === editingOrderIndex ? order : o));
      setOrders(next);
      setEditingOrderIndex(null);
      await saveState({ orders: next });
    },
    [orders, editingOrderIndex, saveState],
  );

  const deleteOrder = useCallback(
    async (index: number) => {
      const next = orders.filter((_, i) => i !== index);
      setOrders(next);
      if (editingOrderIndex === index) setEditingOrderIndex(null);
      await saveState({ orders: next });
    },
    [orders, editingOrderIndex, saveState],
  );

  const addWish = useCallback(
    async (wish: Wish) => {
      const next = [wish, ...wishes];
      setWishes(next);
      await saveState({ wishes: next });
    },
    [wishes, saveState],
  );

  const deleteWish = useCallback(
    async (index: number) => {
      const next = wishes.filter((_, i) => i !== index);
      setWishes(next);
      await saveState({ wishes: next });
    },
    [wishes, saveState],
  );

  const toggleWish = useCallback(
    async (index: number, done: boolean) => {
      const next = wishes.map((w, i) => (i === index ? { ...w, done } : w));
      setWishes(next);
      await saveState({ wishes: next });
    },
    [wishes, saveState],
  );

  const addPhotos = useCallback(
    async (newPhotos: string[]) => {
      const next = [...newPhotos, ...photos].slice(0, 30);
      setPhotos(next);
      await saveState({ photos: next });
    },
    [photos, saveState],
  );

  const deletePhoto = useCallback(
    async (index: number) => {
      const next = photos.filter((_, i) => i !== index);
      setPhotos(next);
      await saveState({ photos: next });
    },
    [photos, saveState],
  );

  const retrySync = useCallback(async () => {
    setCloudReady(false);
    setSyncErrorDetail("");
    await connectSupabase();
  }, [connectSupabase]);

  const getOrdersForDay = useCallback((dayNumber: number) => {
    const dayPattern = new RegExp(`\\bday\\s*${dayNumber}\\b`, "i");
    return orders.filter(
      (order) => dayPattern.test(order.name) || dayPattern.test(order.type),
    );
  }, [orders]);

  const panelDay = panelMode !== null ? days[panelMode.index] : null;
  const panelIndex = panelMode?.index ?? null;

  return {
    tripSettings,
    days,
    orders,
    wishes,
    photos,
    hydrated,
    syncMessage,
    syncStatus,
    panelMode,
    panelDay,
    panelIndex,
    editingOrderIndex,
    setEditingOrderIndex,
    dayColorPalette,
    t,
    formatOrderType,
    dayLabel,
    displayDayTitle,
    openDay,
    openDayEdit,
    closePanel,
    updateTripSettings,
    clearItinerary,
    saveDayEdit,
    addOrder,
    deleteOrder,
    addWish,
    deleteWish,
    toggleWish,
    addPhotos,
    deletePhoto,
    retrySync,
    getOrdersForDay,
    getDayTitleText,
  };
}
