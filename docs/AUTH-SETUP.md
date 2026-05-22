# Google OAuth + allowlist setup

The app uses **Supabase Auth (Google)** and **Row Level Security (RLS)** so only emails in `allowed_emails` can read or write `trip_state`. The browser uses a **publishable API key** (`sb_publishable_...`); unauthenticated requests still hit the Postgres `anon` role but have **no table grants** after you run the schema SQL.

## 1. Publishable API key (replaces legacy anon JWT)

1. Supabase → **Project Settings** → **API Keys**.
2. Copy the **Publishable key** (`sb_publishable_...`). You can disable legacy **anon** / **service_role** JWT keys once this is in use.
3. Put it in `.env.local` as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

If a publishable key was ever committed, revoke it in the dashboard and create a new one.

## 2. Run database SQL

1. Supabase → **SQL Editor**.
2. Paste and run the full contents of [`supabase-schema.sql`](../supabase-schema.sql) (safe to re-run; it drops old open policies and revokes `anon`).

## 3. Add family emails to the allowlist

In SQL Editor (use **lowercase** emails to match Google sign-in):

```sql
insert into public.allowed_emails (email) values
  ('you@gmail.com'),
  ('partner@gmail.com');
```

You can also add rows in **Table Editor** → `allowed_emails`.

## 4. Google Cloud OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials**.
2. **Create credentials** → **OAuth client ID** → type **Web application**.
3. **Authorized redirect URIs** (required):

   ```text
   https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
   ```

   Find `<YOUR-PROJECT-REF>` in Supabase → **Project Settings** → **General** (project URL host).

4. Copy **Client ID** and **Client secret**.

Optional: configure **OAuth consent screen** (External + test users, or Internal if using Google Workspace).

## 5. Enable Google in Supabase

1. Supabase → **Authentication** → **Providers** → **Google** → Enable.
2. Paste Google **Client ID** and **Client secret** → Save.

## 6. URL configuration in Supabase

**Authentication** → **URL configuration**:

| Field | Local dev | Production (example) |
|-------|-----------|----------------------|
| **Site URL** | `http://localhost:3000` | `https://your-user.github.io` or your custom domain |
| **Redirect URLs** | `http://localhost:3000/**` | `https://your-user.github.io/**` |

Also allow the explicit callback path:

```text
http://localhost:3000/auth/callback
```

For GitHub Pages project sites (`/repo-name/`), set `NEXT_PUBLIC_BASE_PATH=/repo-name` in env; redirect URL becomes `http://localhost:3000/repo-name/auth/callback` when testing with base path.

## 7. Next.js environment

Copy `.env.local.example` → `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_ENABLED=true
```

When Supabase is enabled, the home page requires sign-in. With `NEXT_PUBLIC_SUPABASE_ENABLED=false`, the app runs local-only with no auth gate.

## 8. Run and verify

```bash
npm run dev
```

1. Open `http://localhost:3000` → **Sign in with Google**.
2. After redirect, allowlisted users see the trip planner; others see **Access denied**.
3. In Supabase **Table Editor**, confirm `trip_state` updates only when signed in as an allowlisted user.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Redirect loop or `callback` error | Redirect URLs in Supabase include `/auth/callback`; Google redirect URI is exactly `…/auth/v1/callback`. |
| Access denied after login | Email row exists in `allowed_emails` (lowercase). JWT email matches Google account. |
| Cloud sync fails / empty data | RLS: user must be **authenticated** and allowlisted. Re-run `supabase-schema.sql`. |
| Auth gate never appears | `NEXT_PUBLIC_SUPABASE_ENABLED=true`, URL, and publishable key set. |
| Invalid API key / 401 | Legacy anon JWT disabled — use `sb_publishable_...` from **API Keys**, not the old JWT tab. |

## Security notes

- Do not commit `.env.local`.
- `legacy/trip-data.js` no longer ships real keys; use env vars only.
- Manage allowlist via Supabase dashboard or SQL (no in-app admin UI yet).
