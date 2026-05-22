import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DayPanel } from "@/components/trip/DayPanel";
import type { Order, TripDay, Wish } from "@/lib/types";
import { renderWithLocale } from "@/test/render";

const day: TripDay = {
  title: "Museum",
  date: "6/22 週一",
  color: "#d8c79d",
  summary: "Art day",
  city: "Tokyo",
  stay: "Hotel",
  timeline: [["10:00", "Gallery"]],
};

const baseProps = {
  day,
  index: 0,
  allOrders: [] as Order[],
  wishes: [] as Wish[],
  displayDayTitle: () => "Day 1｜Museum",
  getOrdersForDay: () => [] as Order[],
  formatOrderType: (type: string) => type,
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onCancelEdit: vi.fn(),
  onSaveEdit: vi.fn(),
};

describe("DayPanel", () => {
  it("is hidden when panel is closed", async () => {
    await renderWithLocale(<DayPanel {...baseProps} panelMode={null} />);
    expect(document.querySelector(".day-panel")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders view mode with timeline and bookings empty state", async () => {
    await renderWithLocale(
      <DayPanel
        {...baseProps}
        panelMode={{ type: "view", index: 0 }}
        allOrders={[{ type: "hotel", name: "Other", url: "https://example.com" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Day 1｜Museum");
    expect(screen.getByText("Gallery")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /booking/i })).toBeInTheDocument();
  });

  it("shows bookings empty state for the day when orders exist elsewhere", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    await renderWithLocale(
      <DayPanel
        {...baseProps}
        panelMode={{ type: "view", index: 0 }}
        allOrders={[{ type: "hotel", name: "Day 9 hotel", url: "https://example.com" }]}
        getOrdersForDay={() => []}
        onClose={onClose}
      />,
    );

    const link = screen.getByRole("link", { name: /全部|all/i });
    await user.click(link);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows related orders and wishes", async () => {
    await renderWithLocale(
      <DayPanel
        {...baseProps}
        panelMode={{ type: "view", index: 0 }}
        allOrders={[{ type: "hotel", name: "Day 1 stay", url: "https://example.com" }]}
        getOrdersForDay={() => [{ type: "hotel", name: "Day 1 stay", url: "https://example.com" }]}
        wishes={[{ person: "Mom", place: "Park", day: "Day 1", done: false }]}
      />,
    );
    expect(screen.getByText("Day 1 stay")).toBeInTheDocument();
    expect(screen.getByText("Park")).toBeInTheDocument();
  });

  it("enters edit mode and saves", async () => {
    const user = userEvent.setup();
    const onSaveEdit = vi.fn();

    await renderWithLocale(
      <DayPanel
        {...baseProps}
        panelMode={{ type: "edit", index: 0 }}
        onSaveEdit={onSaveEdit}
      />,
    );

    const summary = screen.getByPlaceholderText(/大方向|theme|summary/i);
    await user.clear(summary);
    await user.type(summary, "Updated summary");
    await user.click(screen.getByRole("button", { name: /儲存|save/i }));

    expect(onSaveEdit).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ summary: "Updated summary" }),
    );
  });

  it("adds and removes timeline rows in edit mode", async () => {
    const user = userEvent.setup();

    await renderWithLocale(
      <DayPanel
        {...baseProps}
        day={{ ...day, timeline: [] }}
        panelMode={{ type: "edit", index: 0 }}
        onSaveEdit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /新增|add/i }));
    expect(screen.getAllByPlaceholderText("09:30")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /刪除|delete/i }));
    expect(screen.queryByPlaceholderText("09:30")).toBeNull();
  });

  it("shows empty timeline and wish states in view mode", async () => {
    await renderWithLocale(
      <DayPanel
        {...baseProps}
        day={{ ...day, timeline: [] }}
        panelMode={{ type: "view", index: 0 }}
        allOrders={[]}
        getOrdersForDay={() => []}
      />,
    );
    expect(screen.getByText("這一天還沒有新增時間與行程。")).toBeInTheDocument();
    expect(screen.getByText("目前還沒有新增想去的點。")).toBeInTheDocument();
  });

  it("calls onEdit from view mode", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    await renderWithLocale(
      <DayPanel
        {...baseProps}
        panelMode={{ type: "view", index: 0 }}
        onEdit={onEdit}
        allOrders={[]}
        getOrdersForDay={() => []}
      />,
    );
    await user.click(screen.getByRole("button", { name: /編輯|edit/i }));
    expect(onEdit).toHaveBeenCalledWith(0);
  });

  it("cancels edit mode", async () => {
    const user = userEvent.setup();
    const onCancelEdit = vi.fn();
    await renderWithLocale(
      <DayPanel
        {...baseProps}
        panelMode={{ type: "edit", index: 0 }}
        onCancelEdit={onCancelEdit}
      />,
    );
    await user.click(screen.getByRole("button", { name: /取消|cancel/i }));
    expect(onCancelEdit).toHaveBeenCalledWith(0);
  });

  it("updates timeline fields in edit mode", async () => {
    const user = userEvent.setup();
    await renderWithLocale(
      <DayPanel
        {...baseProps}
        day={{ ...day, timeline: [["09:00", "Breakfast"]] }}
        panelMode={{ type: "edit", index: 0 }}
        onSaveEdit={vi.fn()}
      />,
    );
    const activity = screen.getByDisplayValue("Breakfast");
    await user.clear(activity);
    await user.type(activity, "Lunch");
    expect(screen.getByDisplayValue("Lunch")).toBeInTheDocument();
  });

  it("closes from the icon button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    await renderWithLocale(
      <DayPanel {...baseProps} panelMode={{ type: "view", index: 0 }} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: /關閉|close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
