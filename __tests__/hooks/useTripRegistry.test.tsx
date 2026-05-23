import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { useTripRegistry } from "@/hooks/useTripRegistry";
import { REGISTRY_STORAGE_KEY } from "@/lib/trip-registry";
import { storage } from "@/lib/storage";

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => null,
}));

vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    tripConfig: {
      ...actual.tripConfig,
      supabase: { ...actual.tripConfig.supabase, enabled: false },
    },
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe("useTripRegistry", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds legacy active trip on first load", async () => {
    const { result } = renderHook(() => useTripRegistry(), { wrapper });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.activeTrip?.id).toBe("family-trip");
    expect(result.current.activeTrip?.status).toBe("active");
  });

  it("creates a planning trip", async () => {
    const { result } = renderHook(() => useTripRegistry(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let createdId = "";
    await act(async () => {
      const meta = await result.current.createTrip("Hokkaido 2027");
      createdId = meta.id;
    });

    expect(result.current.planningTrips.some((trip) => trip.id === createdId)).toBe(true);
    const saved = storage.get(REGISTRY_STORAGE_KEY, { trips: [], activeTripId: null });
    expect(saved.trips.some((trip) => trip.name === "Hokkaido 2027")).toBe(true);
  });

  it("activates a trip and demotes the previous active trip", async () => {
    const { result } = renderHook(() => useTripRegistry(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let newId = "";
    await act(async () => {
      const meta = await result.current.createTrip("Kyoto");
      newId = meta.id;
    });

    await act(async () => {
      await result.current.activateTrip(newId);
    });

    expect(result.current.activeTrip?.id).toBe(newId);
    const legacy = result.current.registry.trips.find((trip) => trip.id === "family-trip");
    expect(legacy?.status).toBe("planning");
  });
});
