import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TripHub } from "@/components/trip/TripHub";
import { renderWithLocale } from "@/test/render";
import type { TripMeta } from "@/lib/types";

const activeTrip: TripMeta = {
  id: "family-trip",
  name: "2026 Tokyo",
  status: "active",
  startDate: "2026-06-22",
  dayCount: 6,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("TripHub", () => {
  it("shows current trip and creates a new one", async () => {
    const user = userEvent.setup();
    const onCreateTrip = vi.fn(async () => {});
    const onOpenTrip = vi.fn();

    await renderWithLocale(
      <TripHub
        activeTrip={activeTrip}
        planningTrips={[]}
        pastTrips={[]}
        onOpenTrip={onOpenTrip}
        onCreateTrip={onCreateTrip}
        onSetActive={vi.fn()}
        onMarkPast={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /2026 Tokyo/i })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/京都|Kyoto/i), "2027 Hokkaido");
    await user.click(screen.getByRole("button", { name: /開始規劃|Start planning/i }));

    expect(onCreateTrip).toHaveBeenCalledWith("2027 Hokkaido");
  });
});
