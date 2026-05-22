import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PhotosSection } from "@/components/trip/PhotosSection";
import { renderWithLocale } from "@/test/render";

describe("PhotosSection", () => {
  it("shows empty state without photos", async () => {
    await renderWithLocale(<PhotosSection photos={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(document.querySelector(".photo-grid .empty-state")).toBeInTheDocument();
  });

  it("uploads images as data URLs", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const readAsDataURL = vi.fn();
    const file = new File(["pixels"], "trip.png", { type: "image/png" });

    class MockFileReader {
      result = "data:image/png;base64,abc";
      onload: (() => void) | null = null;
      readAsDataURL() {
        readAsDataURL();
        this.onload?.();
      }
    }
    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);

    await renderWithLocale(<PhotosSection photos={[]} onAdd={onAdd} onDelete={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(["data:image/png;base64,abc"]);
    });
    expect(readAsDataURL).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("renders photos and deletes on click", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    await renderWithLocale(
      <PhotosSection
        photos={["data:image/png;base64,abc"]}
        onAdd={vi.fn()}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /刪除|delete/i }));
    expect(onDelete).toHaveBeenCalledWith(0);
  });
});
