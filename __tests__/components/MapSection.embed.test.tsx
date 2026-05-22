import { describe, expect, it, vi } from "vitest";
import { renderWithLocale } from "@/test/render";

vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    tripConfig: {
      ...actual.tripConfig,
      map: {
        query: "Tokyo Tower",
        zoom: 14,
        googleMapsApiKey: "test-key",
      },
    },
  };
});

describe("MapSection embed", () => {
  it("renders iframe when API key is set", async () => {
    const { MapSection } = await import("@/components/trip/MapSection");
    await renderWithLocale(<MapSection />);
    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toContain("embed/v1/place");
    expect(iframe?.getAttribute("src")).toContain("test-key");
  });
});
