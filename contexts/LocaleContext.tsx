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
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  localeMessages,
  normalizeOrderType,
  translate,
  type LocaleCode,
} from "@/lib/i18n-utils";
import type { LocaleMessages } from "@/lib/types";

type LocaleContextValue = {
  locale: LocaleCode;
  messages: LocaleMessages;
  t: (key: string, vars?: Record<string, string | number>) => string;
  switchLocale: () => void;
  ready: boolean;
  formatOrderType: (type: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getStoredLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(stored as LocaleCode) ? (stored as LocaleCode) : "zh";
  } catch {
    return "zh";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LocaleCode>("zh");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    setLocale(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const meta = localeMessages[locale].meta as { lang?: string } | undefined;
    document.documentElement.lang = meta?.lang ?? locale;
    document.title = translate(localeMessages[locale], "site.browserTitle");
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale, ready]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(localeMessages[locale], key, vars),
    [locale],
  );

  const formatOrderType = useCallback(
    (type: string) => {
      const key = normalizeOrderType(type);
      const label = t(`orderTypes.${key}`);
      return label === `orderTypes.${key}` ? type : label;
    },
    [t],
  );

  const switchLocale = useCallback(() => {
    setLocale((current) => (current === "zh" ? "en" : "zh"));
  }, []);

  const value = useMemo(
    () => ({
      locale,
      messages: localeMessages[locale],
      t,
      switchLocale,
      ready,
      formatOrderType,
    }),
    [locale, t, switchLocale, ready, formatOrderType],
  );

  if (!ready) return null;

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
