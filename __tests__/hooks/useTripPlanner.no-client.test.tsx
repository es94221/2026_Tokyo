import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { useTripPlanner } from "@/hooks/useTripPlanner";

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => null,
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
        publishableKey: "key",
      },
    },
  };
});

describe("useTripPlanner without supabase client", () => {
  it("reports supabase not loaded", async () => {
    const { result } = renderHook(() => useTripPlanner("family-trip"), {
      wrapper: ({ children }) => <LocaleProvider>{children}</LocaleProvider>,
    });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => {
      expect(result.current.syncStatus).toBe("error");
    });
  });
});
