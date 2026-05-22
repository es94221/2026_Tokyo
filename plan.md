# Plan: Auth & security (HIGH PRIORITY)

**Status:** Phases 0–4 **done** locally · Phase 5 **partial** · **Phase 6 (GitHub Pages) is next**

Auth + RLS + allowlist work on **localhost**. Remaining work: production URL smoke test, static export, CI deploy, Maps referrer lockdown for prod.

---

## Progress summary

| Phase | Status | Notes |
|-------|--------|--------|
| **0 — Key hygiene** | ✅ Done | Publishable key (`sb_publishable_…`); legacy anon JWT removed from `legacy/trip-data.js`; `.env.local` uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| **1 — Google OAuth** | ✅ Done | Google Cloud OAuth client + Supabase Google provider; redirect URLs configured for local dev |
| **2 — RLS + allowlist** | ✅ Done | `supabase-schema.sql`: `allowed_emails`, revoke `anon`, authenticated + allowlist policies on `trip_state` |
| **3 — App integration** | ✅ Done | `AuthContext`, `AuthGate`, `AuthScreenShell`, `/auth/callback`, PKCE, `Header` sign-out, providers in `app/layout.tsx` |
| **4 — Tests & docs** | ✅ Done | 103 tests, coverage ≥ 80%; `docs/AUTH-SETUP.md`, `AGENTS.md`, README, `.env.local.example` updated |
| **5 — Smoke test** | 🟡 Partial | Local sign-in / allowlist / access denied verified; production GitHub Pages URL not tested yet |
| **6 — GitHub Pages** | ⬜ Not started | No `output: 'export'`, no GitHub Actions workflow, Maps prod referrer restrictions TBD |

---

## Why this came first

- The app is a **public website** with the Supabase **publishable** key in the client (expected for Supabase).
- **Security is not “hide the key.”** It is: **Supabase Auth (Google OAuth) + strict RLS** so only signed-in, allowlisted users can read/write.
- A legacy anon key was **committed** in `legacy/trip-data.js`; sanitized in repo. Rotate/revoke in Supabase if not already.

---

## Goals

1. Users must **sign in with Google** before viewing or editing trip data. ✅
2. Postgres **RLS** denies unauthenticated access to `trip_state`; only **`authenticated`** + allowlisted users pass policies. ✅
3. **Family allowlist** (`allowed_emails`) so random Google accounts cannot use the app. ✅
4. App handles **session lifecycle** (login, logout, loading, OAuth callback, generic access denied). ✅
5. **Unit tests** for auth helpers and gated UI; `npm test` and `npm run test:coverage` pass (≥ 80%). ✅
6. No live secrets in repo; setup documented in `docs/AUTH-SETUP.md` / `.env.local.example`. ✅
7. **Safe GitHub Pages deployment** — build and publish without committing secrets; **Google Maps API key** restricted by HTTP referrer. ⬜ Phase 6

---

## Out of scope (until deploy is done)

- S3 photo uploads, new trip sections, UI polish unrelated to deploy, performance work.
- Custom Node backend (not required for OAuth + RLS).

---

## Phase 0 — Supabase dashboard & key hygiene ✅

| Step | Status | Action |
|------|--------|--------|
| 0.1 | ✅ | Issue **publishable key**; disable legacy anon/service_role JWT keys in Supabase dashboard. |
| 0.2 | ✅ | **`.env.local`**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` + URL. |
| 0.3 | ✅ | **`legacy/trip-data.js`**: placeholders only. |
| 0.4 | ⬜ Optional | Purge old key from **git history** on GitHub (BFG / `git filter-repo`). |

---

## Phase 1 — Google OAuth (Supabase Auth) ✅

| Step | Status | Action |
|------|--------|--------|
| 1.1 | ✅ | Google Cloud **OAuth 2.0 Client** (Web). Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. |
| 1.2 | ✅ | Supabase → **Authentication → Providers → Google**. |
| 1.3 | ✅ | Supabase → **URL configuration**: `http://localhost:3000`, redirect URLs. |
| 1.4 | ✅ | Google OAuth consent screen (External + test users for family Gmail accounts). |

**Docs:** [`docs/AUTH-SETUP.md`](docs/AUTH-SETUP.md) · [Supabase Google auth](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## Phase 2 — Database security (RLS + allowlist) ✅

| Step | Status | Action |
|------|--------|--------|
| 2.1 | ✅ | Dropped permissive `anon` policies on `trip_state`. |
| 2.2 | ✅ | Policies for **`authenticated`**: `select`, `insert`, `update` on `trip_state` where `id = 'family-trip'`. |
| 2.3 | ✅ | **`allowed_emails`** table; family emails seeded. |
| 2.4 | ✅ | RLS: allow read/write only if `auth.jwt() ->> 'email'` is in `allowed_emails`. |
| 2.5 | ✅ | Applied via **`supabase-schema.sql`**. |
| 2.6 | ✅ | Verified locally: sign-in required; fake/invalid token → access denied; allowlisted user → full app. |

---

## Phase 3 — Next.js app integration ✅

| Step | Status | Action |
|------|--------|--------|
| 3.1 | ✅ | **`lib/supabase-client.ts`**: publishable key, PKCE, `persistSession`, `detectSessionInUrl: false` (callback handles exchange). |
| 3.2 | ✅ | **`contexts/AuthContext.tsx`**: session, `signInWithGoogle()`, `signOut()`, allowlist check. |
| 3.3 | ✅ | **`app/providers.tsx`** + **`app/layout.tsx`**: `LocaleProvider` → `AuthProvider`. |
| 3.4 | ✅ | **`components/trip/Header.tsx`**: Sign out when auth required. |
| 3.5 | ✅ | **`AuthGate`** + **`AuthScreenShell`**: login / loading / access denied screens. |
| 3.6 | ✅ | **`TripPlanner`** only renders behind `AuthGate` when auth required (sync effectively session-gated). |
| 3.7 | ✅ | **`app/auth/callback/page.tsx`** + **`lib/auth-callback.ts`** (fixed double PKCE exchange race). |
| 3.8 | ✅ | i18n: `auth.*` keys in `locales/zh.json` and `locales/en.json`. |

---

## Phase 4 — Testing & documentation ✅

| Step | Status | Action |
|------|--------|--------|
| 4.1 | ✅ | Tests: `AuthContext`, `AuthGate`, `lib/auth.ts`, `lib/auth-callback.ts`. |
| 4.2 | ✅ | Hook tests pass with mocked Supabase (auth gate prevents planner when logged out). |
| 4.3 | ✅ | **`npm test`** and **`npm run test:coverage`** green (103 tests). |
| 4.4 | ✅ | **`AGENTS.md`**: publishable key, auth, tests. |
| 4.5 | ✅ | **`.env.local.example`**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. |
| 4.6 | ✅ | **README** + **`docs/AUTH-SETUP.md`**. |

---

## Phase 5 — Auth smoke test (local + production URL) 🟡

| Step | Status | Action |
|------|--------|--------|
| 5.1 | ⬜ | Add production **Site URL** and **Redirect URLs** in Supabase (GitHub Pages URL from Phase 6). |
| 5.2 | ✅ Local | Logged out → login screen; allowlisted user → full app; denied → generic “Access denied” + sign out. |
| 5.2 | ⬜ Prod | Repeat 5.2 on `https://<user>.github.io/<repo>/` after Phase 6 deploy. |
| 5.3 | ✅ | Invalid session / allowlist failure → access denied (does not leak trip data). |

---

## Phase 6 — GitHub Pages (safe deploy + exposed client keys) ⬜ **NEXT**

GitHub Pages serves a **static export** of the Next.js app. Anything prefixed with `NEXT_PUBLIC_*` is **embedded in the JavaScript bundle** at build time — including **Supabase publishable** and **Google Maps** keys. That is normal for static hosting; safety comes from **restrictions and RLS**, not from hiding the key in git.

### What “safe” means here

| Secret | In repo? | In built JS? | Mitigation |
|--------|----------|--------------|------------|
| Supabase publishable | **Never** — GitHub Actions secrets only | Yes | **RLS + Google OAuth + allowlist** (Phases 1–2) ✅ |
| Google Maps API key | **Never** — GitHub Actions secrets only | Yes | **HTTP referrer restrictions** + Maps Embed API only |
| Supabase secret key | Never | Never | Never use in frontend |

**Do not commit** `.env.local` or put keys in workflow YAML in plain text. Use **GitHub repository secrets** and inject at build time only.

### 6.1 — Google Cloud (Maps key lockdown) ⬜

1. Google Cloud Console → **Credentials** → Maps key → **Edit**.
2. **Application restrictions** → **HTTP referrers**:
   - `https://<github-user>.github.io/<repo-name>/*`
   - `http://localhost:3000/*` (or separate dev key)
3. **API restrictions** → **Maps Embed API** only.

### 6.2 — Supabase (auth redirects for GitHub Pages) ⬜

Add to Supabase **Authentication → URL configuration**:

- **Site URL:** `https://<github-user>.github.io/<repo-name>/`
- **Redirect URLs:** same origin + `http://localhost:3000/**`
- Google OAuth **JavaScript origins:** `https://<github-user>.github.io` (no path)

Also set `NEXT_PUBLIC_BASE_PATH=/<repo-name>` in build env if using a project site (affects OAuth redirect in `lib/auth.ts`).

### 6.3 — Next.js static export config ⬜

| Setting | Purpose |
|---------|---------|
| `output: 'export'` in `next.config.ts` | Static HTML/JS to `out/` |
| `basePath: '/<repo-name>'` | Project site at `username.github.io/<repo-name>/` |
| `images: { unoptimized: true }` | If using `next/image` later |
| `trailingSlash: true` (optional) | Fewer path issues on Pages |

**Limitation:** No Next.js server at runtime — auth stays **client-side Supabase Auth** (supported).

### 6.4 — GitHub Actions workflow ⬜

Create **`.github/workflows/deploy-pages.yml`**:

1. Trigger on `push` to `main`.
2. `npm ci` → **`npm test`** → **`npm run test:coverage`**.
3. `npm run build` with secrets injected.
4. Deploy `out/` via `actions/deploy-pages`.
5. Repo **Settings → Pages** → Source: **GitHub Actions**.

**Repository secrets:**

| Secret | Used at build |
|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes |
| `NEXT_PUBLIC_SUPABASE_ENABLED` | `true` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes (referrer-restricted prod key) |
| `NEXT_PUBLIC_BASE_PATH` | `/<repo-name>` if project site |
| `NEXT_PUBLIC_MAP_QUERY` | Yes |
| `NEXT_PUBLIC_MAP_ZOOM` | Optional |

### 6.5 — Post-deploy checks ⬜

- [ ] Site loads at `https://<user>.github.io/<repo-name>/`.
- [ ] Google sign-in completes (redirect back to Pages URL).
- [ ] Map iframe loads; map fails from other domains.
- [ ] Not logged in / not allowlisted → no trip data access.

### 6.6 — What not to do

- Do not commit API keys or paste them in PRs.
- Do not use unrestricted Maps keys on a public site.
- Do not put secret keys in `NEXT_PUBLIC_*` or the Pages build job.

---

## Definition of done

- [x] Google OAuth works locally.
- [ ] Google OAuth works on **GitHub Pages** production URL.
- [x] No open `anon` access to `trip_state`; authenticated + allowlisted only.
- [x] Trip UI and sync require a valid session (via `AuthGate`).
- [x] No live secrets in repository files; publishable key in env only.
- [x] Tests and coverage thresholds pass.
- [ ] **GitHub Actions** deploys to Pages using secrets only.
- [ ] **Google Maps** prod key restricted to Embed API + GitHub Pages referrers.
- [x] `plan.md` updated with phase status.

---

## What comes next (recommended order)

1. **Phase 6.3** — Add static export to `next.config.ts` (`output: 'export'`, `basePath`, env for `NEXT_PUBLIC_BASE_PATH`).
2. **Phase 6.4** — GitHub Actions workflow + repo secrets (publishable key, Maps key, Supabase URL).
3. **Phase 6.2** — Supabase + Google OAuth redirect/origin URLs for the GitHub Pages URL.
4. **Phase 6.1** — Lock down Maps key referrers for prod domain.
5. **Phase 5.1 / 5.2** — Smoke test on production URL after first deploy.

Optional before deploy: **Phase 0.4** purge old keys from git history.

---

## After auth + Pages deploy (lower priority backlog)

Only start after **Definition of done**:

- Photo storage (S3 presigned URLs, URLs in `trip_state.photos`).
- Tighter UX, mobile, etc.
- Optional: custom domain (update Maps referrers + Supabase redirect URLs).
- Optional: migrate off Supabase later.

---

## Reference

| Topic | Location |
|-------|----------|
| Auth setup (human steps) | `docs/AUTH-SETUP.md` |
| Schema / RLS | `supabase-schema.sql` |
| Supabase client | `lib/supabase-client.ts` |
| OAuth callback | `lib/auth-callback.ts`, `app/auth/callback/page.tsx` |
| Auth UI | `contexts/AuthContext.tsx`, `components/trip/AuthGate.tsx`, `AuthScreenShell.tsx` |
| App state & sync | `hooks/useTripPlanner.ts` |
| Agent conventions & tests | `AGENTS.md` |
| Env var template | `.env.local.example` |
| Maps UI | `components/trip/MapSection.tsx` |
