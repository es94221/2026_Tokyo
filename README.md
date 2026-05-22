# 2026 Tokyo Family Trip

A small family trip planner: daily itinerary, booking links, wishlist, map, and a shared photo wall. Built with **Next.js 15**, React, and TypeScript. UI copy lives in `locales/zh.json` and `locales/en.json` (default: Chinese).

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm test`, `npm run test:coverage` (80% threshold).

## Environment

Copy `.env.local.example` to `.env.local` (gitignored). Main variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) |
| `NEXT_PUBLIC_SUPABASE_ENABLED` | Set to `false` to use local storage only |
| `NEXT_PUBLIC_MAP_QUERY` | Map search query |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional; enables embedded map |

Database schema: `supabase-schema.sql`.

**Google sign-in + allowlist:** when Supabase is enabled, only emails in `allowed_emails` can sync. Setup steps: [`docs/AUTH-SETUP.md`](docs/AUTH-SETUP.md).

## Deploy (GitHub Pages)

See [`docs/DEPLOY.md`](docs/DEPLOY.md). Push to `main` after:

1. **Settings → Pages → Source:** GitHub Actions  
2. Repository **secrets** for all `NEXT_PUBLIC_*` vars (see `.env.local.example`)  
3. Supabase + Google OAuth URLs for `https://es94221.github.io/2026_Tokyo/`

Live site: **https://es94221.github.io/2026_Tokyo/**

## Project layout

- `app/` — Next.js routes and global styles
- `components/trip/` — UI sections
- `hooks/useTripPlanner.ts` — state, persistence, sync
- `contexts/LocaleContext.tsx` — i18n
- `locales/` — UI strings
- `legacy/` — previous plain HTML/JS app (reference only)

Data is stored in the browser (`localStorage`) and synced to Supabase when configured.
