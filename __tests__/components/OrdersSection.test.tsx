import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrdersSection } from "@/components/trip/OrdersSection";
import type { Order } from "@/lib/types";
import { renderWithLocale } from "@/test/render";

const orders: Order[] = [
  { type: "hotel", name: "Lake house", url: "https://example.com/a" },
];

describe("OrdersSection", () => {
  it("adds a new order from the form", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    await renderWithLocale(
      <OrdersSection
        orders={[]}
        editingOrderIndex={null}
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onCancelEdit={vi.fn()}
        formatOrderType={(type) => type}
      />,
    );

    await user.type(screen.getByLabelText(/名稱|name/i), "New booking");
    await user.type(screen.getByLabelText(/連結|link|url/i), "https://example.com/new");
    await user.click(screen.getByRole("button", { name: /加入|add/i }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New booking",
        url: "https://example.com/new",
      }),
    );
  });

  it("lists orders and supports edit/delete", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    await renderWithLocale(
      <OrdersSection
        orders={orders}
        editingOrderIndex={null}
        onAdd={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
        onCancelEdit={vi.fn()}
        formatOrderType={() => "Hotel"}
      />,
    );

    expect(screen.getByText("Lake house")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /編輯|edit/i }));
    expect(onEdit).toHaveBeenCalledWith(0);
    await user.click(screen.getByRole("button", { name: /刪除|delete/i }));
    expect(onDelete).toHaveBeenCalledWith(0);
  });

  it("shows cancel when editing", async () => {
    const user = userEvent.setup();
    const onCancelEdit = vi.fn();

    await renderWithLocale(
      <OrdersSection
        orders={orders}
        editingOrderIndex={0}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onCancelEdit={onCancelEdit}
        formatOrderType={() => "Hotel"}
      />,
    );

    await user.click(screen.getByRole("button", { name: /取消|cancel/i }));
    expect(onCancelEdit).toHaveBeenCalled();
  });
});
