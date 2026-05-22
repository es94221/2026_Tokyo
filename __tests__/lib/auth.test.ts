import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkAllowlist, getAuthRedirectUrl, isAuthRequired } from "@/lib/auth";

vi.mock("@/lib/config", () => ({
  tripConfig: {
    supabase: {
      enabled: true,
      projectUrl: "https://test.supabase.co",
    },
  },
}));

describe("auth", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
  });

  it("isAuthRequired when supabase enabled with url", () => {
    expect(isAuthRequired()).toBe(true);
  });

  it("getAuthRedirectUrl points to auth callback", () => {
    expect(getAuthRedirectUrl()).toBe("http://localhost:3000/auth/callback");
  });

  it("getAuthRedirectUrl respects base path", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/2026_Tokyo");
    expect(getAuthRedirectUrl()).toBe("http://localhost:3000/2026_Tokyo/auth/callback");
  });

  it("checkAllowlist returns true when row exists", async () => {
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { email: "a@test.com" }, error: null })),
          })),
        })),
      })),
    } as never;

    await expect(checkAllowlist(client, "A@Test.com")).resolves.toBe(true);
  });

  it("checkAllowlist returns false on error or missing row", async () => {
    const missing = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
    } as never;
    await expect(checkAllowlist(missing, "x@test.com")).resolves.toBe(false);

    const errored = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: { message: "fail" } })),
          })),
        })),
      })),
    } as never;
    await expect(checkAllowlist(errored, "x@test.com")).resolves.toBe(false);
  });
});
