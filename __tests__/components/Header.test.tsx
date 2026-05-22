import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/trip/Header";
import { renderWithLocale } from "@/test/render";

describe("Header", () => {
  it("renders navigation and sync status", async () => {
    const onSyncClick = vi.fn();
    await renderWithLocale(
      <Header syncMessage="Saved locally" syncStatus="local" onSyncClick={onSyncClick} />,
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("Saved locally")).toBeInTheDocument();
  });

  it("retries sync on Enter key", async () => {
    const onSyncClick = vi.fn();
    await renderWithLocale(
      <Header syncMessage="Error" syncStatus="error" onSyncClick={onSyncClick} />,
    );
    const status = screen.getByText("Error");
    status.focus();
    status.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(onSyncClick).toHaveBeenCalled();
  });

  it("retries sync on status click", async () => {
    const user = userEvent.setup();
    const onSyncClick = vi.fn();
    await renderWithLocale(
      <Header syncMessage="Error" syncStatus="error" onSyncClick={onSyncClick} />,
    );
    await user.click(screen.getByText("Error"));
    expect(onSyncClick).toHaveBeenCalled();
  });
});
