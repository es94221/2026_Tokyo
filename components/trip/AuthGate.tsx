"use client";

import type { ReactNode } from "react";
import { AuthScreenShell } from "@/components/trip/AuthScreenShell";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";

export function AuthGate({ children }: { children: ReactNode }) {
  const { authRequired, ready, session, access, signInWithGoogle, signOut } = useAuth();
  const { t } = useLocale();

  if (!authRequired) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <AuthScreenShell>
        <p>{t("auth.loading")}</p>
      </AuthScreenShell>
    );
  }

  if (!session) {
    return (
      <AuthScreenShell>
        <div className="auth-card">
          <h1>{t("auth.title")}</h1>
          <p>{t("auth.description")}</p>
          <button className="button primary" type="button" onClick={() => void signInWithGoogle()}>
            {t("auth.signInGoogle")}
          </button>
        </div>
      </AuthScreenShell>
    );
  }

  if (access === "unknown") {
    return (
      <AuthScreenShell>
        <p>{t("auth.checkingAccess")}</p>
      </AuthScreenShell>
    );
  }

  if (access === "denied") {
    return (
      <AuthScreenShell>
        <div className="auth-card">
          <h1>{t("auth.notAllowedTitle")}</h1>
          <button className="button muted" type="button" onClick={() => void signOut()}>
            {t("auth.signOut")}
          </button>
        </div>
      </AuthScreenShell>
    );
  }

  return <>{children}</>;
}
