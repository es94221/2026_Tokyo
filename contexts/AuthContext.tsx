"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { checkAllowlist, getAuthRedirectUrl, isAuthRequired } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase-client";

export type AuthAccessState = "unknown" | "allowed" | "denied";

type AuthContextValue = {
  authRequired: boolean;
  ready: boolean;
  session: Session | null;
  user: User | null;
  access: AuthAccessState;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authRequired = isAuthRequired();
  const [ready, setReady] = useState(!authRequired);
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<AuthAccessState>(authRequired ? "unknown" : "allowed");

  const verifyAllowlist = useCallback(async (nextSession: Session | null) => {
    if (!authRequired) {
      setAccess("allowed");
      return;
    }

    const client = getSupabaseClient();
    const email = nextSession?.user.email;
    if (!client || !email) {
      setAccess("denied");
      return;
    }

    const allowed = await checkAllowlist(client, email);
    setAccess(allowed ? "allowed" : "denied");
  }, [authRequired]);

  useEffect(() => {
    if (!authRequired) return;

    const client = getSupabaseClient();
    if (!client) {
      setReady(true);
      setAccess("denied");
      return;
    }

    let mounted = true;

    const init = async () => {
      const { data } = await client.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      await verifyAllowlist(data.session);
      setReady(true);
    };

    void init();

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void verifyAllowlist(nextSession);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [authRequired, verifyAllowlist]);

  const signInWithGoogle = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() },
    });

    if (error) console.warn("Google sign-in failed:", error);
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client.auth.signOut();
    if (error) console.warn("Sign-out failed:", error);
    setSession(null);
    setAccess("denied");
  }, []);

  const value = useMemo(
    () => ({
      authRequired,
      ready,
      session,
      user: session?.user ?? null,
      access,
      signInWithGoogle,
      signOut,
    }),
    [authRequired, ready, session, access, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
