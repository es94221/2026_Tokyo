"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthScreenShell } from "@/components/trip/AuthScreenShell";
import { useLocale } from "@/contexts/LocaleContext";
import { completeOAuthCallback } from "@/lib/auth-callback";
import { getSupabaseClient } from "@/lib/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setErrorMessage(t("auth.configMissing"));
      return;
    }

    void (async () => {
      const { session, error } = await completeOAuthCallback(client);
      if (session) {
        router.replace("/");
        return;
      }

      if (error) {
        console.warn("Auth callback failed:", error);
        setErrorMessage(t("auth.callbackFailed"));
      }
    })();
  }, [router, t]);

  return (
    <AuthScreenShell>
      <p>{errorMessage || t("auth.signingIn")}</p>
    </AuthScreenShell>
  );
}
