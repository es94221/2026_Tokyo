# Photo storage setup

Trip photos upload to **Supabase Storage** (private bucket). The web app does **not** use S3 access keys in the browser — uploads go through `@supabase/supabase-js` with the signed-in user's session, gated by the same email allowlist as trip data.

## 1. Create the bucket

In Supabase Dashboard → **Storage**, create a bucket (default name: `trip-photos`). Keep it **private**.

Set in `.env.local` and GitHub Actions secrets:

```env
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=trip-photos
NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED=true
```

If your bucket uses a different name, update `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` and the `bucket_id = 'trip-photos'` lines in `supabase-schema.sql` to match.

## 2. Apply storage RLS

Run the storage section at the bottom of `supabase-schema.sql` in the SQL editor. This allows **authenticated allowlisted users** to read, upload, update, and delete objects in the bucket.

## 3. S3 credentials (optional, not for the app)

Supabase exposes an S3-compatible endpoint for CLI tools (aws s3, rclone, etc.). Those keys must stay on your machine or in CI secrets — **never** in `NEXT_PUBLIC_*` vars or git.

The Next.js static export on GitHub Pages has no server; all photo uploads happen client-side via Supabase Storage + RLS.

## How it works in the app

- New uploads are stored at `{tripId}/{uuid}.{ext}` in the bucket.
- `trip_state.photos` stores references like `storage:family-trip/abc.jpg` (not base64).
- Legacy `data:image/...` entries still display for older data.
- Deletes remove the object from storage when the reference uses the `storage:` prefix.

## GitHub Pages

Add `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (and keep storage enabled) to repository **Actions secrets** used by `.github/workflows/deploy-pages.yml`.
