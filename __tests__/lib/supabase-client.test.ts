import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn(() => ({ from: vi.fn() }));

const authOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe("normalizePublishableKey", () => {
  it("fixes b_publishable_ prefix from dashboard copy-paste", async () => {
    const { normalizePublishableKey } = await import("@/lib/supabase-client");
    expect(normalizePublishableKey("sb_publishable_abc")).toBe("sb_publishable_abc");
    expect(normalizePublishableKey("b_publishable_abc")).toBe("sb_publishable_abc");
  });
});

describe("getSupabaseClient", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
    vi.unstubAllEnvs();
  });

  afterEach(async () => {
    const mod = await import("@/lib/supabase-client");
    mod.resetSupabaseClientForTests();
  });

  it("returns null when supabase is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ENABLED", "false");
    const { getSupabaseClient } = await import("@/lib/supabase-client");
    expect(getSupabaseClient()).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns null when project URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { getSupabaseClient } = await import("@/lib/supabase-client");
    expect(getSupabaseClient()).toBeNull();
  });

  it("creates a singleton client with normalized URL and key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.cos");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    const { getSupabaseClient, resetSupabaseClientForTests } = await import("@/lib/supabase-client");

    const first = getSupabaseClient();
    const second = getSupabaseClient();
    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-publishable-key",
      authOptions,
    );

    resetSupabaseClientForTests();
    getSupabaseClient();
    expect(createClientMock).toHaveBeenCalledTimes(2);
  });

  it("prefixes publishable keys that start with b_publishable_", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "b_publishable_abc");
    const { getSupabaseClient, resetSupabaseClientForTests } = await import("@/lib/supabase-client");
    resetSupabaseClientForTests();
    getSupabaseClient();
    expect(createClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "sb_publishable_abc",
      authOptions,
    );
  });
});
