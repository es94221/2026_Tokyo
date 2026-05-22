"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";

const NAV = [
  { href: "#overall", key: "overall" },
  { href: "#orders", key: "orders" },
  { href: "#wishlist", key: "wishlist" },
  { href: "#map", key: "map" },
  { href: "#photos", key: "photos" },
] as const;

type HeaderProps = {
  syncMessage: string;
  syncStatus: string;
  onSyncClick: () => void;
};

export function Header({ syncMessage, syncStatus, onSyncClick }: HeaderProps) {
  const { authRequired, signOut } = useAuth();
  const { t, switchLocale } = useLocale();

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={t("nav.brandAria")}>
        <span className="brand-mark">旅</span>
        <span>{t("site.brandText")}</span>
      </a>
      <nav aria-label={t("nav.ariaLabel")}>
        {NAV.map((item) => (
          <a key={item.key} href={item.href}>
            {t(`nav.${item.key}`)}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        {authRequired && (
          <button className="button muted header-sign-out" type="button" onClick={() => void signOut()}>
            {t("auth.signOut")}
          </button>
        )}
        <button
          type="button"
          className="lang-toggle"
          onClick={switchLocale}
          aria-label={t("lang.switchAria")}
        >
          {t("lang.switchTo")}
        </button>
        <span
          className="sync-status"
          data-status={syncStatus}
          title={syncMessage}
          onClick={onSyncClick}
          onKeyDown={(e) => e.key === "Enter" && onSyncClick()}
          role="button"
          tabIndex={0}
        >
          {syncMessage}
        </span>
      </div>
    </header>
  );
}
