"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tripConfig } from "@/lib/config";
import { storage } from "@/lib/storage";
import {
  REGISTRY_ROW_ID,
  REGISTRY_STORAGE_KEY,
  addTrip,
  createEmptyRegistry,
  createTripMeta,
  getActiveTrip,
  getTripsByStatus,
  migrateLegacyTripStorage,
  registryFromRow,
  registryToRow,
  seedLegacyTrip,
  setActiveTrip,
  setTripStatus,
} from "@/lib/trip-registry";
import type { TripMeta, TripRegistry, TripStatus } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase-client";
import { useLocale } from "@/contexts/LocaleContext";

export function useTripRegistry() {
  const { t } = useLocale();
  const [registry, setRegistry] = useState<TripRegistry>(createEmptyRegistry);
  const registryRef = useRef(registry);
  registryRef.current = registry;
  const [hydrated, setHydrated] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);

  const persistLocal = useCallback((next: TripRegistry) => {
    storage.set(REGISTRY_STORAGE_KEY, next);
  }, []);

  const saveRegistry = useCallback(
    async (update: TripRegistry | ((prev: TripRegistry) => TripRegistry)) => {
      const next =
        typeof update === "function" ? update(registryRef.current) : update;
      registryRef.current = next;
      setRegistry(next);
      persistLocal(next);

      const client = getSupabaseClient();
      if (!cloudReady || !client || !tripConfig.supabase.enabled) return;

      await client.from(tripConfig.supabase.tableName).upsert(registryToRow(next));
    },
    [cloudReady, persistLocal],
  );

  const connectCloud = useCallback(async () => {
    if (!tripConfig.supabase.enabled) return;

    const client = getSupabaseClient();
    if (!client) return;

    const { data, error } = await client
      .from(tripConfig.supabase.tableName)
      .select("trip_settings")
      .eq("id", REGISTRY_ROW_ID)
      .maybeSingle();

    if (error) {
      console.warn("Registry load failed:", error);
      return;
    }

    setCloudReady(true);

    if (data?.trip_settings) {
      const loaded = registryFromRow(data.trip_settings);
      const withLegacy = seedLegacyTrip(loaded, t("hub.defaultTripName"));
      setRegistry(withLegacy);
      persistLocal(withLegacy);
      return;
    }

    const local = storage.get(REGISTRY_STORAGE_KEY, createEmptyRegistry());
    const withLegacy = seedLegacyTrip(local, t("hub.defaultTripName"));
    setRegistry(withLegacy);
    persistLocal(withLegacy);
    await client.from(tripConfig.supabase.tableName).upsert(registryToRow(withLegacy));
  }, [persistLocal, t]);

  useEffect(() => {
    migrateLegacyTripStorage();
    let local = storage.get(REGISTRY_STORAGE_KEY, createEmptyRegistry());
    local = seedLegacyTrip(local, t("hub.defaultTripName"));
    setRegistry(local);
    persistLocal(local);
    setHydrated(true);
  }, [persistLocal, t]);

  useEffect(() => {
    if (!hydrated) return;
    void connectCloud();
  }, [hydrated, connectCloud]);

  const createTrip = useCallback(
    async (name: string) => {
      const meta = createTripMeta(name);
      await saveRegistry((prev) => addTrip(prev, meta));
      return meta;
    },
    [saveRegistry],
  );

  const activateTrip = useCallback(
    async (tripId: string) => {
      await saveRegistry((prev) => setActiveTrip(prev, tripId));
    },
    [saveRegistry],
  );

  const updateTripStatus = useCallback(
    async (tripId: string, status: TripStatus) => {
      await saveRegistry((prev) => setTripStatus(prev, tripId, status));
    },
    [saveRegistry],
  );

  const getTrip = useCallback(
    (tripId: string) => registry.trips.find((trip) => trip.id === tripId) ?? null,
    [registry.trips],
  );

  const activeTrip = useMemo(() => getActiveTrip(registry), [registry]);
  const planningTrips = useMemo(() => getTripsByStatus(registry, "planning"), [registry]);
  const pastTrips = useMemo(() => getTripsByStatus(registry, "past"), [registry]);

  return {
    hydrated,
    registry,
    activeTrip,
    planningTrips,
    pastTrips,
    createTrip,
    activateTrip,
    updateTripStatus,
    getTrip,
  };
}
