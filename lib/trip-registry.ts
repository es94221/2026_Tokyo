import { defaultTripSettings } from "@/lib/config";
import type { TripMeta, TripRegistry, TripStatus } from "@/lib/types";

export const LEGACY_TRIP_ID = "family-trip";
export const REGISTRY_ROW_ID = "__registry__";
export const REGISTRY_STORAGE_KEY = "trip-registry";

const LEGACY_STORAGE_KEYS = {
  settings: "family-trip-settings",
  days: "family-trip-days",
  orders: "family-trip-orders",
  wishes: "family-trip-wishes",
  photos: "family-trip-photos",
} as const;

export function tripStorageKeys(tripId: string) {
  return {
    settings: `trip:${tripId}:settings`,
    days: `trip:${tripId}:days`,
    orders: `trip:${tripId}:orders`,
    wishes: `trip:${tripId}:wishes`,
    photos: `trip:${tripId}:photos`,
  };
}

export function migrateLegacyTripStorage(tripId = LEGACY_TRIP_ID) {
  const keys = tripStorageKeys(tripId);
  const pairs = Object.entries(LEGACY_STORAGE_KEYS) as [keyof typeof keys, string][];
  for (const [field, legacyKey] of pairs) {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null && localStorage.getItem(keys[field]) === null) {
      localStorage.setItem(keys[field], legacy);
    }
  }
}

export function createEmptyRegistry(): TripRegistry {
  return { trips: [], activeTripId: null };
}

export function seedLegacyTrip(registry: TripRegistry, defaultName: string): TripRegistry {
  if (registry.trips.some((trip) => trip.id === LEGACY_TRIP_ID)) {
    return registry;
  }

  const legacy: TripMeta = {
    id: LEGACY_TRIP_ID,
    name: defaultName,
    status: "active",
    startDate: defaultTripSettings.startDate,
    dayCount: defaultTripSettings.dayCount,
    createdAt: new Date().toISOString(),
  };

  return {
    trips: [legacy],
    activeTripId: LEGACY_TRIP_ID,
  };
}

export function createTripMeta(name: string): TripMeta {
  const trimmed = name.trim();
  return {
    id: `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed || "Untitled trip",
    status: "planning",
    startDate: new Date().toISOString().slice(0, 10),
    dayCount: defaultTripSettings.dayCount,
    createdAt: new Date().toISOString(),
  };
}

export function getTripsByStatus(registry: TripRegistry, status: TripStatus) {
  return registry.trips.filter((trip) => trip.status === status);
}

export function getActiveTrip(registry: TripRegistry) {
  if (!registry.activeTripId) return null;
  return registry.trips.find((trip) => trip.id === registry.activeTripId) ?? null;
}

export function setActiveTrip(registry: TripRegistry, tripId: string): TripRegistry {
  const trips = registry.trips.map((trip) => {
    if (trip.id === tripId) return { ...trip, status: "active" as const };
    if (trip.status === "active") return { ...trip, status: "planning" as const };
    return trip;
  });

  return { trips, activeTripId: tripId };
}

export function setTripStatus(
  registry: TripRegistry,
  tripId: string,
  status: TripStatus,
): TripRegistry {
  let activeTripId = registry.activeTripId;

  const trips = registry.trips.map((trip) => {
    if (trip.id === tripId) {
      return { ...trip, status };
    }
    if (status === "active" && trip.status === "active") {
      return { ...trip, status: "planning" as const };
    }
    return trip;
  });

  if (status === "active") {
    activeTripId = tripId;
  } else if (activeTripId === tripId) {
    activeTripId = null;
  }

  return { trips, activeTripId };
}

export function addTrip(registry: TripRegistry, meta: TripMeta): TripRegistry {
  return {
    ...registry,
    trips: [meta, ...registry.trips],
  };
}

export function registryFromRow(tripSettings: unknown): TripRegistry {
  if (!tripSettings || typeof tripSettings !== "object") {
    return createEmptyRegistry();
  }
  const raw = tripSettings as TripRegistry;
  if (!Array.isArray(raw.trips)) return createEmptyRegistry();
  return {
    trips: raw.trips,
    activeTripId: raw.activeTripId ?? null,
  };
}

export function registryToRow(registry: TripRegistry) {
  return {
    id: REGISTRY_ROW_ID,
    trip_settings: registry,
    days: [],
    orders: [],
    wishes: [],
    photos: [],
    updated_at: new Date().toISOString(),
  };
}
