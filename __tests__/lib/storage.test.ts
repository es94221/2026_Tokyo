import { describe, expect, it, vi } from "vitest";
import { storage } from "@/lib/storage";

describe("storage", () => {
  it("round-trips JSON values", () => {
    storage.set("test-key", { foo: "bar" });
    expect(storage.get("test-key", { foo: "" })).toEqual({ foo: "bar" });
  });

  it("returns fallback when key is missing", () => {
    expect(storage.get("missing", 42)).toBe(42);
  });

  it("returns fallback on invalid JSON", () => {
    localStorage.setItem("bad-json", "not-json{");
    expect(storage.get("bad-json", "fallback")).toBe("fallback");
  });

  it("returns fallback when getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(storage.get("any", "fallback")).toBe("fallback");
  });

  it("no-ops when window is unavailable", () => {
    vi.stubGlobal("window", undefined);
    expect(storage.get("key", "fallback")).toBe("fallback");
    expect(() => storage.set("key", 1)).not.toThrow();
    vi.unstubAllGlobals();
  });
});
