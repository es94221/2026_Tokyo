import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { defaultTripSettings } from "@/lib/config";
import { storage } from "@/lib/storage";
import type { Order, TripDay, Wish } from "@/lib/types";

const getSupabaseClientMock = vi.fn();

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => getSupabaseClientMock(),
  resetSupabaseClientForTests: vi.fn(),
}));

vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    tripConfig: {
      ...actual.tripConfig,
      supabase: {
        ...actual.tripConfig.supabase,
        enabled: false,
      },
    },
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe("useTripPlanner", () => {
  beforeEach(() => {
    localStorage.clear();
    getSupabaseClientMock.mockReturnValue(null);
  });

  it("hydrates from localStorage", async () => {
    storage.set("family-trip-settings", { startDate: "2026-07-01", dayCount: 2 });
    storage.set("family-trip-days", [
      {
        title: "Beach",
        date: "7/1 Wed",
        color: "#d8c79d",
        summary: "Swim",
        city: "Tokyo",
        stay: "Hotel",
        timeline: [],
      },
    ] as TripDay[]);

    const { result } = renderHook(() => useTripPlanner(), { wrapper });

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });
    expect(result.current.tripSettings.startDate).toBe("2026-07-01");
    expect(result.current.days[0].summary).toBe("Swim");
  });

  it("updates trip settings and filters wishes beyond day count", async () => {
    const { result } = renderHook(() => useTripPlanner(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.addWish({
        person: "Mom",
        place: "Park",
        day: "Day 5",
        done: false,
      });
    });

    await act(async () => {
      await result.current.updateTripSettings("2026-06-22", 2);
    });

    expect(result.current.tripSettings.dayCount).toBe(2);
    expect(result.current.wishes.every((w) => !w.day.includes("5"))).toBe(true);
  });

  it("manages orders, wishes, and photos", async () => {
    storage.set("family-trip-orders", []);
    storage.set("family-trip-wishes", []);
    const { result } = renderHook(() => useTripPlanner(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.orders).toHaveLength(0);
    expect(result.current.wishes).toHaveLength(0);

    const order: Order = {
      type: "hotel",
      name: "Day 1 lakeside stay",
      url: "https://example.com/order",
    };

    await act(async () => {
      await result.current.addOrder(order);
    });
    expect(result.current.orders[0].name).toBe(order.name);

    act(() => {
      result.current.setEditingOrderIndex(0);
    });
    await act(async () => {
      await result.current.addOrder({ ...order, name: "Updated stay" });
    });
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0].name).toBe("Updated stay");

    await act(async () => {
      await result.current.deleteOrder(0);
    });
    await waitFor(() => {
      expect(result.current.orders).toHaveLength(0);
    });

    const wish: Wish = { person: "Dad", place: "Temple", day: "Day 1", done: false };
    await act(async () => {
      await result.current.addWish(wish);
    });
    await act(async () => {
      await result.current.toggleWish(0, true);
    });
    expect(result.current.wishes[0].done).toBe(true);
    await act(async () => {
      await result.current.deleteWish(0);
    });
    await waitFor(() => {
      expect(result.current.wishes).toHaveLength(0);
    });

    await act(async () => {
      await result.current.addPhotos(["data:image/png;base64,abc"]);
    });
    expect(result.current.photos).toHaveLength(1);
    await act(async () => {
      await result.current.deletePhoto(0);
    });
    expect(result.current.photos).toHaveLength(0);
  });

  it("opens panel, saves day edit, and clears itinerary", async () => {
    const { result } = renderHook(() => useTripPlanner(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      result.current.openDay(0);
    });
    expect(result.current.panelMode).toEqual({ type: "view", index: 0 });

    await act(async () => {
      result.current.openDayEdit(0);
    });
    expect(result.current.panelMode?.type).toBe("edit");

    await act(async () => {
      await result.current.saveDayEdit(0, {
        title: "Museum day",
        color: "#b9b98d",
        summary: "Art",
        city: "Tokyo",
        stay: "Ryokan",
        timeline: [["10:00", "Gallery"]],
      });
    });
    expect(result.current.panelMode).toEqual({ type: "view", index: 0 });
    expect(result.current.days[0].summary).toBe("Art");

    await act(async () => {
      result.current.closePanel();
    });
    expect(result.current.panelMode).toBeNull();

    await act(async () => {
      await result.current.clearItinerary();
    });
    expect(result.current.days[0].summary).toBe("");
  });

  it("matches orders to day numbers", async () => {
    const { result } = renderHook(() => useTripPlanner(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    await act(async () => {
      await result.current.addOrder({
        type: "activity",
        name: "Day 2 hiking tour",
        url: "https://example.com",
      });
    });

    expect(result.current.getOrdersForDay(2)).toHaveLength(1);
    expect(result.current.getOrdersForDay(9)).toHaveLength(0);
  });

  it("clears legacy sample itinerary after hydration", async () => {
    storage.set("family-trip-days", [
      {
        title: "抵達與慢慢集合",
        date: "6/22 週一",
        color: "#d8c79d",
        summary: "機場接送、入住、附近散步，晚上一起吃第一餐。",
        city: "",
        stay: "",
        timeline: [],
      },
    ] as TripDay[]);

    const { result } = renderHook(() => useTripPlanner(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => {
      expect(result.current.days[0].summary).toBe("");
    });
  });

  it("reports local-only status when supabase disabled", async () => {
    const { result } = renderHook(() => useTripPlanner(), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => {
      expect(result.current.syncMessage).toBeTruthy();
    });
    expect(result.current.syncStatus).toBe("local");
  });
});
