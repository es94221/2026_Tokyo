import { describe, expect, it, vi, beforeEach } from "vitest";
import { completeOAuthCallback } from "@/lib/auth-callback";

describe("completeOAuthCallback", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "http://localhost:3000/auth/callback");
  });

  it("returns existing session without exchanging", async () => {
    const session = { user: { email: "a@test.com" } };
    const client = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session } })),
        exchangeCodeForSession: vi.fn(),
      },
    } as never;

    const result = await completeOAuthCallback(client);
    expect(result.session).toBe(session);
    expect(result.error).toBeNull();
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("exchanges code for session", async () => {
    window.history.replaceState({}, "", "http://localhost:3000/auth/callback?code=abc");
    const session = { user: { email: "a@test.com" } };
    const getSession = vi
      .fn()
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValue({ data: { session: null } });
    const exchangeCodeForSession = vi.fn(async () => ({
      data: { session },
      error: null,
    }));
    const client = { auth: { getSession, exchangeCodeForSession } } as never;

    const result = await completeOAuthCallback(client);
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(result.session).toBe(session);
  });

  it("falls back to session when exchange fails but session exists", async () => {
    window.history.replaceState({}, "", "http://localhost:3000/auth/callback?code=used");
    const session = { user: { email: "a@test.com" } };
    const getSession = vi
      .fn()
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValueOnce({ data: { session } });
    const client = {
      auth: {
        getSession,
        exchangeCodeForSession: vi.fn(async () => ({
          data: { session: null },
          error: { message: "code already used" },
        })),
      },
    } as never;

    const result = await completeOAuthCallback(client);
    expect(result.session).toBe(session);
    expect(result.error).toBeNull();
  });

  it("returns error when code missing and no session", async () => {
    const client = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session: null } })),
        exchangeCodeForSession: vi.fn(),
      },
    } as never;

    const result = await completeOAuthCallback(client);
    expect(result.session).toBeNull();
    expect(result.error?.message).toBe("missing_oauth_code");
  });
});
