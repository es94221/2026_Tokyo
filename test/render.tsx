import { render, type RenderOptions } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { LOCALE_STORAGE_KEY, type LocaleCode } from "@/lib/i18n-utils";

export async function renderWithLocale(
  ui: ReactElement,
  { locale = "zh" as LocaleCode }: { locale?: LocaleCode } = {},
  options?: Omit<RenderOptions, "wrapper">,
) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  const result = render(
    <LocaleProvider>
      <AuthProvider>{ui}</AuthProvider>
    </LocaleProvider>,
    options,
  );
  await waitFor(() => {
    expect(document.documentElement.lang).toBeTruthy();
  });
  return result;
}
