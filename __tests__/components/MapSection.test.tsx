import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MapSection } from "@/components/trip/MapSection";
import { renderWithLocale } from "@/test/render";

vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    tripConfig: {
      ...actual.tripConfig,
      map: {
        query: "Tokyo, Japan",
        zoom: 12,
        googleMapsApiKey: "",
      },
    },
  };
});

describe("MapSection", () => {
  it("renders fallback when API key is missing", async () => {
    await renderWithLocale(<MapSection />);
    expect(screen.getByRole("heading", { level: 2, name: /地圖|map/i })).toBeInTheDocument();
    expect(screen.getByText("Tokyo, Japan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /maps|地圖/i })).toHaveAttribute(
      "href",
      expect.stringContaining("google.com/maps"),
    );
  });
});
