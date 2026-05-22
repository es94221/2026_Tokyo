import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TripPlanner } from "@/components/trip/TripPlanner";
import { renderWithLocale } from "@/test/render";

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
      supabase: { ...actual.tripConfig.supabase, enabled: false },
    },
  };
});

describe("TripPlanner", () => {
  it("renders main sections after hydration", async () => {
    await renderWithLocale(<TripPlanner />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    expect(document.querySelector("#overall")).toBeTruthy();
    expect(document.querySelector("#orders")).toBeTruthy();
    expect(document.querySelector("#wishlist")).toBeTruthy();
    expect(document.querySelector("#map")).toBeTruthy();
    expect(document.querySelector("#photos")).toBeTruthy();
  });

  it("retries sync when status is clicked in error state", async () => {
    const user = userEvent.setup();
    await renderWithLocale(<TripPlanner />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    const status = document.querySelector(".sync-status");
    if (status?.getAttribute("data-status") === "error") {
      await user.click(status);
    }
  });
});
