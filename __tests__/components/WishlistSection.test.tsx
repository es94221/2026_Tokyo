import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WishlistSection } from "@/components/trip/WishlistSection";
import { defaultDays } from "@/lib/config";
import { renderWithLocale } from "@/test/render";

describe("WishlistSection", () => {
  it("adds a wish from the form", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    await renderWithLocale(
      <WishlistSection
        days={defaultDays}
        wishes={[]}
        dayLabel={(index) => `Day ${index + 1}`}
        onAdd={onAdd}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/誰|who/i), "Mom");
    await user.type(screen.getByLabelText(/地點|place/i), "Garden cafe");
    await user.click(screen.getByRole("button", { name: /新增|add/i }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ person: "Mom", place: "Garden cafe" }),
    );
  });

  it("renders wishes and handles toggle/delete", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onDelete = vi.fn();

    await renderWithLocale(
      <WishlistSection
        days={defaultDays}
        wishes={[{ person: "Dad", place: "Temple", day: "Day 1", done: false }]}
        dayLabel={(index) => `Day ${index + 1}`}
        onAdd={vi.fn()}
        onDelete={onDelete}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByText("Temple")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(0, true);
    await user.click(screen.getByRole("button", { name: /刪除|delete/i }));
    expect(onDelete).toHaveBeenCalledWith(0);
  });

  it("shows empty state", async () => {
    await renderWithLocale(
      <WishlistSection
        days={defaultDays}
        wishes={[]}
        dayLabel={(index) => `Day ${index + 1}`}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
      />,
    );
    expect(document.querySelector(".wish-board .empty-state")).toBeInTheDocument();
  });
});
