import { beforeEach, describe, expect, it, vi } from "vitest";
import { tripConfig } from "@/lib/config";
import {
  STORAGE_PHOTO_PREFIX,
  buildTripPhotoPath,
  deleteStoredPhoto,
  isLegacyDataUrl,
  isStoragePhotoRef,
  readFileAsDataUrl,
  resolvePhotoUrl,
  storagePathFromRef,
  toStoragePhotoRef,
  uploadTripPhoto,
  uploadTripPhotos,
} from "@/lib/photo-storage";

const upload = vi.fn();
const remove = vi.fn();
const createSignedUrl = vi.fn();

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => ({
    storage: {
      from: () => ({ upload, remove, createSignedUrl }),
    },
  }),
}));

vi.mock("@/lib/config", () => ({
  tripConfig: {
    supabase: { enabled: true, projectUrl: "https://example.supabase.co" },
    storage: { enabled: true, bucket: "trip-photos" },
  },
}));

describe("photo-storage", () => {
  beforeEach(() => {
    upload.mockReset();
    remove.mockReset();
    createSignedUrl.mockReset();
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed.example/photo.jpg" }, error: null });
  });

  it("detects storage refs and legacy data urls", () => {
    expect(isStoragePhotoRef(`${STORAGE_PHOTO_PREFIX}family-trip/a.jpg`)).toBe(true);
    expect(isLegacyDataUrl("data:image/png;base64,abc")).toBe(true);
    expect(storagePathFromRef(toStoragePhotoRef("trip/x.png"))).toBe("trip/x.png");
  });

  it("builds per-trip object paths", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "fixed-id" });
    const file = new File(["x"], "vacation.PNG", { type: "image/png" });
    expect(buildTripPhotoPath("family-trip", file)).toBe("family-trip/fixed-id.png");
    vi.unstubAllGlobals();
  });

  it("uploads to storage and returns a storage ref", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "abc" });
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    const ref = await uploadTripPhoto("family-trip", file);
    expect(ref).toBe("storage:family-trip/abc.jpg");
    expect(upload).toHaveBeenCalledWith("family-trip/abc.jpg", file, {
      contentType: "image/jpeg",
      upsert: false,
    });
    vi.unstubAllGlobals();
  });

  it("deletes storage objects for storage refs", async () => {
    await deleteStoredPhoto("storage:family-trip/abc.jpg");
    expect(remove).toHaveBeenCalledWith(["family-trip/abc.jpg"]);
    await deleteStoredPhoto("data:image/png;base64,abc");
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("resolves signed urls for storage refs", async () => {
    await expect(resolvePhotoUrl("storage:family-trip/abc.jpg")).resolves.toBe(
      "https://signed.example/photo.jpg",
    );
    await expect(resolvePhotoUrl("data:image/png;base64,abc")).resolves.toBe(
      "data:image/png;base64,abc",
    );
  });

  it("reads files as data urls when storage is disabled", async () => {
    class MockFileReader {
      result = "data:image/png;base64,abc";
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.onload?.();
      }
    }
    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);
    tripConfig.storage.enabled = false;

    const refs = await uploadTripPhotos("family-trip", [
      new File(["x"], "a.png", { type: "image/png" }),
    ]);
    expect(refs).toEqual(["data:image/png;base64,abc"]);
    expect(upload).not.toHaveBeenCalled();

    tripConfig.storage.enabled = true;
    vi.unstubAllGlobals();
  });

  it("reads a single file as data url", async () => {
    class MockFileReader {
      result = "data:image/jpeg;base64,xyz";
      onload: (() => void) | null = null;
      readAsDataURL() {
        this.onload?.();
      }
    }
    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);
    const file = new File(["x"], "b.jpg", { type: "image/jpeg" });
    await expect(readFileAsDataUrl(file)).resolves.toBe("data:image/jpeg;base64,xyz");
    vi.unstubAllGlobals();
  });
});
