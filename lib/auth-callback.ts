import type { SupabaseClient } from "@supabase/supabase-js";

/** Finish OAuth PKCE on /auth/callback — single exchange, no detectSessionInUrl race. */
export async function completeOAuthCallback(client: SupabaseClient) {
  const { data: existing } = await client.auth.getSession();
  if (existing.session) {
    return { session: existing.session, error: null };
  }

  const code = new URL(window.location.href).searchParams.get("code");
  if (!code) {
    return { session: null, error: new Error("missing_oauth_code") };
  }

  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    const { data: retry } = await client.auth.getSession();
    if (retry.session) {
      return { session: retry.session, error: null };
    }
    return { session: null, error };
  }

  return { session: data.session, error: null };
}
