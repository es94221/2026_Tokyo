# Deploy to GitHub Pages

Site URL (project site): **https://es94221.github.io/2026_Tokyo/**

## One-time GitHub setup

1. **Push** this repo to `github.com/es94221/2026_Tokyo` on branch `main`.
2. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**.
3. **Settings → Secrets and variables → Actions** — add repository secrets:

| Secret | Example / notes |
|--------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `NEXT_PUBLIC_SUPABASE_ENABLED` | `true` |
| `NEXT_PUBLIC_SUPABASE_TABLE` | `trip_state` |
| `NEXT_PUBLIC_SUPABASE_ROW_ID` | `family-trip` |
| `NEXT_PUBLIC_MAP_QUERY` | `Tokyo, Japan` |
| `NEXT_PUBLIC_MAP_ZOOM` | `12` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Prod key (referrer-restricted) |

The workflow sets `NEXT_PUBLIC_BASE_PATH=/2026_Tokyo` at build time (not a secret).

## One-time Supabase (production URLs)

**Authentication → URL configuration:**

| Field | Value |
|-------|--------|
| Site URL | `https://es94221.github.io/2026_Tokyo/` |
| Redirect URLs | `https://es94221.github.io/2026_Tokyo/**` |

Keep `http://localhost:3000/**` for local dev.

## One-time Google Cloud

**OAuth client (Web):**

- **Authorized JavaScript origins:** `https://es94221.github.io`
- **Authorized redirect URIs:** unchanged — `https://<project-ref>.supabase.co/auth/v1/callback`

**Maps API key:**

- Referrers: `https://es94221.github.io/2026_Tokyo/*` and `http://localhost:3000/*`
- API restriction: **Maps Embed API** only

## Deploy

Every push to **`main`** runs `.github/workflows/deploy-pages.yml`:

1. `npm ci` → tests → coverage → `npm run build` → upload `out/` → GitHub Pages

Manual run: **Actions → Deploy to GitHub Pages → Run workflow**.

## Local build matching production

```bash
NEXT_PUBLIC_BASE_PATH=/2026_Tokyo npm run build
npx serve out
```

Open the URL `serve` prints (paths include `/2026_Tokyo/`).

## Verify after deploy

- [ ] https://es94221.github.io/2026_Tokyo/ loads the **trip app** (login screen), not README markdown
- [ ] Google sign-in completes and returns to the app
- [ ] Map embed works
- [ ] Logged-out / non-allowlisted users cannot sync trip data

## Troubleshooting

### Site shows README.md instead of the app

Two workflows exist in **Actions**:

| Workflow | What it does |
|----------|----------------|
| **Deploy to GitHub Pages** | Builds Next.js → uploads `out/` → correct deploy |
| **pages build and deployment** | GitHub’s default Jekyll deploy from the **branch** → renders README |

**Fix:**

1. **Settings → Pages → Build and deployment → Source** must be **GitHub Actions** (not “Deploy from a branch”).
2. **Actions → Deploy to GitHub Pages → Run workflow** (re-run after changing the setting).

If **Deploy to GitHub Pages** failed with `Failed to create deployment (status: 404)`, Pages was not set to GitHub Actions yet — fix step 1, then re-run.

The build step itself may have succeeded (artifact ~4 MB); only the deploy step failed.
