import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { defaultTripSettings } from "@/lib/config";
import type { TripDay } from "@/lib/types";

const upsertMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
      upsert: upsertMock,
    }),
  }),
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
        enabled: true,
        projectUrl: "https://test.supabase.co",
        publishableKey: "test-key",
      },
    },
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe("useTripPlanner cloud sync", () => {
  beforeEach(() => {
    localStorage.clear();
    upsertMock.mockReset();
    maybeSingleMock.mockReset();
  });

  it("loads remote state when row exists", async () => {
    const remoteDays: TripDay[] = [
      {
        title: "Remote",
        date: "7/1 Wed",
        color: "#d8c79d",
        summary: "From cloud",
        city: "Tokyo",
        stay: "Hotel",
        timeline: [],
      },
    ];

    maybeSingleMock.mockResolvedValue({
      data: {
        trip_settings: { startDate: "2026-07-01", dayCount: 1 },
        days: remoteDays,
        orders: [],
        wishes: [],
        photos: [],
      },
      error: null,
    });

    const { result } = renderHook(() => useTripPlanner("family-trip"), { wrapper });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => {
      expect(result.current.syncStatus).toBe("cloud");
    });
    expect(result.current.days[0].summary).toBe("From cloud");
  });

  it("upserts when saving after cloud connects", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        trip_settings: defaultTripSettings,
        days: [],
        orders: [],
        wishes: [],
        photos: [],
      },
      error: null,
    });
    upsertMock.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useTripPlanner("family-trip"), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => expect(result.current.syncStatus).toBe("cloud"));

    await act(async () => {
      await result.current.addOrder({
        type: "hotel",
        name: "Day 1 booking",
        url: "https://example.com",
      });
    });

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalled();
    });
    expect(result.current.syncStatus).toBe("cloud");
  });

  it("surfaces connect errors", async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "network down" },
    });

    const { result } = renderHook(() => useTripPlanner("family-trip"), { wrapper });
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => {
      expect(result.current.syncStatus).toBe("error");
    });
    expect(result.current.syncMessage).toContain("network down");
  });

  it("surfaces upsert errors after cloud is ready", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        trip_settings: defaultTripSettings,
        days: [],
        orders: [],
        wishes: [],
        photos: [],
      },
      error: null,
    });
    upsertMock.mockResolvedValue({ error: { message: "write failed" } });

    const { result } = renderHook(() => useTripPlanner("family-trip"), { wrapper });
    await waitFor(() => expect(result.current.syncStatus).toBe("cloud"));

    await act(async () => {
      await result.current.addWish({
        person: "A",
        place: "B",
        day: "Day 1",
        done: false,
      });
    });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe("error");
    });
    expect(result.current.syncMessage).toContain("write failed");
  });

  it("retries sync from error state", async () => {
    maybeSingleMock
      .mockResolvedValueOnce({ data: null, error: { message: "fail" } })
      .mockResolvedValueOnce({
        data: {
          trip_settings: defaultTripSettings,
          days: [],
          orders: [],
          wishes: [],
          photos: [],
        },
        error: null,
      });
    upsertMock.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useTripPlanner("family-trip"), { wrapper });
    await waitFor(() => expect(result.current.syncStatus).toBe("error"));

    await act(async () => {
      await result.current.retrySync();
    });

    await waitFor(() => {
      expect(result.current.syncStatus).toBe("cloud");
    });
  });
});
