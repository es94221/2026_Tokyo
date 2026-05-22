"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/contexts/LocaleContext";

export function AuthScreenShell({ children }: { children: ReactNode }) {
  const { t, switchLocale } = useLocale();

  return (
    <div className="auth-layout">
      <header className="auth-top-bar">
        <div className="brand auth-brand" aria-label={t("nav.brandAria")}>
          <span className="brand-mark">旅</span>
          <span>{t("site.brandText")}</span>
        </div>
        <button
          type="button"
          className="lang-toggle auth-lang-toggle"
          onClick={switchLocale}
          aria-label={t("lang.switchAria")}
        >
          {t("lang.switchTo")}
        </button>
      </header>
      <main className="auth-screen">{children}</main>
    </div>
  );
}
