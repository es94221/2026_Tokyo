import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/trip/Hero";
import { renderWithLocale } from "@/test/render";

describe("Hero", () => {
  it("renders hero copy and day count", async () => {
    await renderWithLocale(<Hero dayCount={6} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("6 天")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /overall|總覽|itinerary/i })).toHaveAttribute("href", "#overall");
  });
});
