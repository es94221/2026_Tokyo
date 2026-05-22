import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OverallSection } from "@/components/trip/OverallSection";
import { defaultDays, defaultTripSettings } from "@/lib/config";
import { renderWithLocale } from "@/test/render";

describe("OverallSection", () => {
  it("submits trip settings and opens a day", async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn();
    const onOpenDay = vi.fn();
    const onClearItinerary = vi.fn();

    await renderWithLocale(
      <OverallSection
        tripSettings={defaultTripSettings}
        days={defaultDays}
        onUpdateSettings={onUpdateSettings}
        onClearItinerary={onClearItinerary}
        onOpenDay={onOpenDay}
        displayDayTitle={(_, index) => `Day ${index + 1}`}
      />,
    );

    const startInput = screen.getByLabelText(/開始|start/i);
    await user.clear(startInput);
    await user.type(startInput, "2026-08-01");

    const dayCountInput = screen.getByLabelText(/天數|day count/i);
    await user.clear(dayCountInput);
    await user.type(dayCountInput, "4");

    await user.click(screen.getByRole("button", { name: /更新|update/i }));
    expect(onUpdateSettings).toHaveBeenCalledWith("2026-08-01", 4);

    await user.click(screen.getByRole("button", { name: /Day 1/i }));
    expect(onOpenDay).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole("button", { name: /清空|clear/i }));
    expect(onClearItinerary).toHaveBeenCalled();
  });
});
