-- Trip state (single shared document)
create table if not exists public.trip_state (
  id text primary key,
  trip_settings jsonb not null default '{}'::jsonb,
  days jsonb not null default '[]'::jsonb,
  orders jsonb not null default '[]'::jsonb,
  wishes jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.trip_state
add column if not exists trip_settings jsonb not null default '{}'::jsonb;

-- Family allowlist (manage rows in Supabase Table Editor or SQL)
create table if not exists public.allowed_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

comment on table public.allowed_emails is
  'Google account emails allowed to use the trip app. Add one row per family member (lowercase recommended).';

-- Example: insert into public.allowed_emails (email) values ('you@gmail.com');

alter table public.trip_state enable row level security;
alter table public.allowed_emails enable row level security;

-- Remove direct table access for unauthenticated (publishable key, no session) requests
revoke all on table public.trip_state from anon;
revoke all on table public.allowed_emails from anon;

drop policy if exists "Anyone can read trip state" on public.trip_state;
drop policy if exists "Anyone can insert trip state" on public.trip_state;
drop policy if exists "Anyone can update trip state" on public.trip_state;

grant usage on schema public to authenticated;
grant select, insert, update on table public.trip_state to authenticated;
grant select on table public.allowed_emails to authenticated;

-- Authenticated users can check whether their own email is allowlisted
drop policy if exists "Users read own allowlist row" on public.allowed_emails;
create policy "Users read own allowlist row"
on public.allowed_emails
for select
to authenticated
using (lower(email) = lower((select auth.jwt() ->> 'email')));

-- Trip data: allowlisted emails only (any trip id, including __registry__)
drop policy if exists "Allowlisted read trip" on public.trip_state;
create policy "Allowlisted read trip"
on public.trip_state
for select
to authenticated
using (
  exists (
    select 1
    from public.allowed_emails ae
    where lower(ae.email) = lower((select auth.jwt() ->> 'email'))
  )
);

drop policy if exists "Allowlisted insert trip" on public.trip_state;
create policy "Allowlisted insert trip"
on public.trip_state
for insert
to authenticated
with check (
  exists (
    select 1
    from public.allowed_emails ae
    where lower(ae.email) = lower((select auth.jwt() ->> 'email'))
  )
);

drop policy if exists "Allowlisted update trip" on public.trip_state;
create policy "Allowlisted update trip"
on public.trip_state
for update
to authenticated
using (
  exists (
    select 1
    from public.allowed_emails ae
    where lower(ae.email) = lower((select auth.jwt() ->> 'email'))
  )
)
with check (
  exists (
    select 1
    from public.allowed_emails ae
    where lower(ae.email) = lower((select auth.jwt() ->> 'email'))
  )
);
