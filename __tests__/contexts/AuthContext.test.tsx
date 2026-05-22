import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";

const signInWithOAuth = vi.fn(async () => ({ error: null }));
const signOut = vi.fn(async () => ({ error: null }));
const getSession = vi.fn(async () => ({
  data: { session: { user: { email: "family@test.com" } } },
}));
const onAuthStateChange = vi.fn((cb: (event: string, session: unknown) => void) => {
  cb("INITIAL_SESSION", { user: { email: "family@test.com" } });
  return { data: { subscription: { unsubscribe: vi.fn() } } };
});

vi.mock("@/lib/config", () => ({
  tripConfig: { supabase: { enabled: true, projectUrl: "https://x.supabase.co" } },
}));

vi.mock("@/lib/auth", () => ({
  isAuthRequired: () => true,
  getAuthRedirectUrl: () => "http://localhost:3000/auth/callback",
  checkAllowlist: vi.fn(async () => true),
}));

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => ({
    auth: { getSession, onAuthStateChange, signInWithOAuth, signOut },
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads session and marks access allowed", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.authRequired).toBe(true);
    expect(result.current.access).toBe("allowed");
    expect(result.current.user?.email).toBe("family@test.com");
  });

  it("signInWithGoogle calls OAuth with redirect", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/auth/callback" },
    });
  });
});
