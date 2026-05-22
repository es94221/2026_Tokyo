import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider, useLocale } from "@/contexts/LocaleContext";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n-utils";

function LocaleProbe() {
  const { locale, t, switchLocale, formatOrderType } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">{t("site.heroTitle")}</span>
      <span data-testid="order-type">{formatOrderType("hotel")}</span>
      <button type="button" onClick={switchLocale}>
        toggle
      </button>
    </div>
  );
}

describe("LocaleProvider", () => {
  it("loads stored locale and translates strings", async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("en");
    });
    expect(screen.getByTestId("title").textContent).toBeTruthy();
    expect(screen.getByTestId("order-type").textContent).not.toBe("hotel");
  });

  it("switches locale and persists choice", async () => {
    const user = userEvent.setup();
    localStorage.setItem(LOCALE_STORAGE_KEY, "zh");
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("zh");
    });

    await user.click(screen.getByRole("button", { name: "toggle" }));

    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("en");
    });
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("throws when useLocale is used outside provider", () => {
    function Bad() {
      useLocale();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/LocaleProvider/);
  });

  it("returns raw type when order label is missing", async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "zh");
    function TypeProbe() {
      const { formatOrderType } = useLocale();
      return <span data-testid="unknown-type">{formatOrderType("unknown-custom")}</span>;
    }
    render(
      <LocaleProvider>
        <TypeProbe />
      </LocaleProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("unknown-type")).toHaveTextContent("unknown-custom");
    });
  });

  it("falls back to zh when localStorage is unavailable", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("zh");
    });
    getItem.mockRestore();
  });

  it("falls back to zh for invalid stored locale", async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("locale")).toHaveTextContent("zh");
    });
  });
});
