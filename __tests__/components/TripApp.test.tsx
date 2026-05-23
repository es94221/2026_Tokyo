import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TripApp } from "@/components/trip/TripApp";
import { renderWithLocale } from "@/test/render";

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

describe("TripApp", () => {
  it("shows trip hub after auth gate path", async () => {
    await renderWithLocale(<TripApp />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /選擇或規劃行程|Pick or plan a trip/i })).toBeInTheDocument();
    });
  });
});
