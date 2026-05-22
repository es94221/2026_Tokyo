import type { LocaleCode, LocaleMessages, OrderTypeKey } from "./types";

export type { LocaleCode };
import zh from "@/locales/zh.json";
import en from "@/locales/en.json";

export const LOCALE_STORAGE_KEY = "family-trip-locale";
export const SUPPORTED_LOCALES: LocaleCode[] = ["zh", "en"];
export const ORDER_TYPE_KEYS: OrderTypeKey[] = [
  "hotel",
  "car",
  "activity",
  "restaurant",
  "transport",
];

export const localeMessages: Record<LocaleCode, LocaleMessages> = {
  zh: zh as LocaleMessages,
  en: en as LocaleMessages,
};

export function lookup(messages: LocaleMessages, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);
}

export function translate(
  messages: LocaleMessages,
  key: string,
  vars: Record<string, string | number> = {},
) {
  const value = lookup(messages, key);
  if (typeof value !== "string") return key;
  return value.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}

export function getStringList(messages: LocaleMessages, key: string): string[] {
  const value = lookup(messages, key);
  return Array.isArray(value) ? (value as string[]) : [];
}

export function normalizeOrderType(type: string): string {
  const raw = String(type ?? "").trim();
  if (ORDER_TYPE_KEYS.includes(raw as OrderTypeKey)) return raw;

  for (const locale of SUPPORTED_LOCALES) {
    const aliases = localeMessages[locale].orderTypeAliases as Record<string, string> | undefined;
    if (aliases?.[raw]) return aliases[raw];
  }

  return raw;
}

export function getLegacySampleTitles(): Set<string> {
  const titles = new Set<string>();
  for (const locale of SUPPORTED_LOCALES) {
    const list = localeMessages[locale].legacy as { sampleTitles?: string[] } | undefined;
    for (const title of list?.sampleTitles ?? []) titles.add(title);
  }
  return titles;
}

export function getLegacySampleSummaries(): Set<string> {
  const summaries = new Set<string>();
  for (const locale of SUPPORTED_LOCALES) {
    const list = localeMessages[locale].legacy as { sampleSummaries?: string[] } | undefined;
    for (const summary of list?.sampleSummaries ?? []) summaries.add(summary);
  }
  return summaries;
}
