# AGENTS.md — 2026 Tokyo Family Trip

Guide for AI agents and contributors working in this repository.

## Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Backend / data** | [Supabase](https://supabase.com) (Postgres + Row Level Security). There is **no custom API server**. The browser talks to Supabase with the **publishable** key via `@supabase/supabase-js`. |
| **Local cache** | `localStorage` (always). Cloud sync is optional when Supabase env vars are set. |
| **i18n** | JSON locale files (`locales/zh.json`, `locales/en.json`). Default locale: **Chinese (`zh`)**. |
| **Tests** | Vitest, Testing Library, jsdom |

Do **not** edit `legacy/` unless explicitly asked. That folder is the old static HTML/JS app kept for reference only.

---

## Architecture (high level)

```text
app/page.tsx
  └── LocaleProvider (contexts/LocaleContext.tsx)
        └── TripPlanner (components/trip/TripPlanner.tsx)
              ├── useTripPlanner (hooks/useTripPlanner.ts)  ← state, save, Supabase sync
              └── Section components (Hero, Overall, Orders, …)
```

**Data flow**

1. On load, `useTripPlanner` hydrates from `localStorage`, then connects to Supabase (`trip_state` row, id `family-trip`).
2. Every mutation updates React state, writes `localStorage`, and upserts to Supabase when cloud is ready.
3. UI strings come from `t("some.key")` — never hardcode user-visible copy in components.

**Supabase schema** — see `supabase-schema.sql`. Single table `public.trip_state` with JSON columns: `trip_settings`, `days`, `orders`, `wishes`, `photos`.

---

## Directory map

```text
app/
  layout.tsx          # Root layout, Google fonts, metadata
  page.tsx            # Client entry: LocaleProvider + TripPlanner
  globals.css         # All app styles (ported from legacy styles.css)

components/trip/      # Feature UI (mostly presentational + forms)
  TripPlanner.tsx     # Wires hook + all sections + DayPanel
  Header.tsx          # Nav, language toggle, sync status
  Hero.tsx
  OverallSection.tsx  # Trip dates, day grid
  OrdersSection.tsx
  WishlistSection.tsx
  MapSection.tsx      # Google Maps embed or fallback link
  PhotosSection.tsx   # File upload → base64 in state (for now)
  DayPanel.tsx        # Side panel: view / edit single day

contexts/
  LocaleContext.tsx   # locale, t(), formatOrderType, switchLocale

hooks/
  useTripPlanner.ts   # Main app state machine — prefer extending here vs scattering logic

lib/
  config.ts           # Defaults + env-based tripConfig (map, supabase)
  types.ts            # TripDay, Order, Wish, SyncStatusKind, etc.
  storage.ts          # localStorage get/set (SSR-safe)
  dates.ts            # Date formatting, wish day parsing
  days-logic.ts       # Sync day count, titles, legacy sample clearing
  i18n-utils.ts       # translate(), locale JSON imports, order type aliases
  supabase-client.ts  # Singleton Supabase client

locales/
  zh.json             # All UI strings (source of truth for copy)
  en.json

__tests__/            # Mirror lib/, hooks/, contexts/, components/
test/
  render.tsx          # renderWithLocale() helper for component tests

legacy/               # DO NOT MODIFY for normal tasks
supabase-schema.sql   # Run in Supabase SQL editor to create/patch DB
.env.local.example    # Documented env vars (copy to .env.local)
vitest.config.ts      # Coverage thresholds: 80% lines/functions/branches/statements
```

Path alias: `@/*` → project root (`tsconfig.json`).

---

## How to add things

### New UI copy

1. Add keys to **both** `locales/zh.json` and `locales/en.json`.
2. Use `const { t } = useLocale()` in components, or pass `t` from the hook where needed.
3. For sync/status messages, store a **message key** (see `SyncMessageKey` in `lib/types.ts`) and derive text with `t()` — do not store translated strings in React state (locale switch must update labels).

### New trip section (UI block)

1. Create `components/trip/YourSection.tsx` (`"use client"`).
2. Accept data + callbacks as props (follow `OrdersSection.tsx` / `WishlistSection.tsx`).
3. Register it in `components/trip/TripPlanner.tsx`.
4. Add nav link in `Header.tsx` (`NAV` array) and matching `nav.*` keys in locales.
5. Add tests under `__tests__/components/YourSection.test.tsx` using `renderWithLocale` from `test/render.tsx`.

### New business logic (dates, itinerary rules, etc.)

1. Put pure functions in `lib/` (e.g. `lib/days-logic.ts`).
2. Unit test in `__tests__/lib/your-module.test.ts`.
3. Call from `useTripPlanner.ts` — keep components thin.

### New persisted field

1. Extend types in `lib/types.ts`.
2. Update `useTripPlanner` state, `saveLocal` keys, `getPayload` for Supabase upsert.
3. Update `supabase-schema.sql` if the column structure changes (today everything lives in existing JSON columns — prefer extending JSON before new columns unless necessary).
4. Add/adjust tests in `__tests__/hooks/useTripPlanner*.test.tsx`.

### Supabase / RLS changes

1. Edit `supabase-schema.sql` and document migration steps in the PR description.
2. Adjust `lib/config.ts` / `lib/supabase-client.ts` only if connection config changes.
3. Mock `@/lib/supabase-client` in hook tests (see `useTripPlanner.cloud.test.tsx`).

### Environment variables

All client-exposed vars use `NEXT_PUBLIC_*`. See `.env.local.example`. Never commit `.env.local`.

---

## Testing requirements (mandatory)

**Any functional change must include unit tests** (or extend existing tests). This project enforces **≥ 80% coverage** on:

- `lib/**`
- `hooks/**`
- `contexts/**`
- `components/**`

### Commands (run before considering work done)

```bash
npm install          # if dependencies changed
npm test             # all unit tests must pass
npm run test:coverage  # must pass thresholds (80%)
```

Optional during development: `npm run test:watch`.

### Where to put tests

| Code | Test location |
|------|----------------|
| `lib/foo.ts` | `__tests__/lib/foo.test.ts` |
| `hooks/useTripPlanner.ts` | `__tests__/hooks/useTripPlanner.test.tsx` (+ `.cloud.test.tsx` for Supabase mocks) |
| `contexts/LocaleContext.tsx` | `__tests__/contexts/LocaleContext.test.tsx` |
| `components/trip/X.tsx` | `__tests__/components/X.test.tsx` |

### Testing patterns

- **Pure logic** — test directly with Vitest (`describe` / `it` / `expect`).
- **React components** — `@testing-library/react`, `renderWithLocale()` from `test/render.tsx` (waits for `LocaleProvider` to be ready).
- **Hooks** — `renderHook` from Testing Library, wrap with `LocaleProvider`, mock Supabase via `vi.mock("@/lib/supabase-client")`.
- **localStorage** — cleared in `vitest.setup.ts` before each test; seed with `storage.set(...)` when needed.
- Prefer specific queries (`getByRole`, `getByLabelText`, `.empty-state`) over broad regex that match multiple elements.

### Agent checklist before finishing

- [ ] Code change is scoped to the request (no drive-by refactors).
- [ ] UI strings added to `locales/zh.json` and `locales/en.json`.
- [ ] New/updated tests cover the change.
- [ ] `npm test` exits 0.
- [ ] `npm run test:coverage` exits 0 (meets 80% thresholds).
- [ ] No edits under `legacy/` unless requested.
- [ ] No secrets committed (`.env.local` stays gitignored).

---

## Key files (quick reference)

| Concern | File |
|---------|------|
| App entry | `app/page.tsx` |
| Global styles | `app/globals.css` |
| All trip state + sync | `hooks/useTripPlanner.ts` |
| i18n | `contexts/LocaleContext.tsx`, `lib/i18n-utils.ts`, `locales/*.json` |
| Supabase client | `lib/supabase-client.ts` |
| Defaults (days, orders, wishes) | `lib/config.ts` |
| DB schema | `supabase-schema.sql` |

---

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill Supabase + optional Google Maps key
npm run dev                         # http://localhost:3000
```

Human-oriented setup notes also live in `README.md`.
