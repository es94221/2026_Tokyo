import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PhotosSection } from "@/components/trip/PhotosSection";
import { renderWithLocale } from "@/test/render";

vi.mock("@/lib/photo-storage", () => ({
  resolvePhotoUrls: (refs: string[]) => Promise.resolve(refs),
}));

describe("PhotosSection", () => {
  it("shows empty state without photos", async () => {
    await renderWithLocale(<PhotosSection photos={[]} onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(document.querySelector(".photo-grid .empty-state")).toBeInTheDocument();
  });

  it("passes selected files to onAdd", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const file = new File(["pixels"], "trip.png", { type: "image/png" });

    await renderWithLocale(<PhotosSection photos={[]} onAdd={onAdd} onDelete={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith([file]);
    });
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

    await waitFor(() => {
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /刪除|delete/i }));
    expect(onDelete).toHaveBeenCalledWith(0);
  });
});
