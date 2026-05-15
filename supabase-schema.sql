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

grant usage on schema public to anon;
grant select, insert, update on public.trip_state to anon;

alter table public.trip_state enable row level security;

drop policy if exists "Anyone can read trip state" on public.trip_state;
drop policy if exists "Anyone can insert trip state" on public.trip_state;
drop policy if exists "Anyone can update trip state" on public.trip_state;

create policy "Anyone can read trip state"
on public.trip_state
for select
to anon
using (id = 'family-trip');

create policy "Anyone can insert trip state"
on public.trip_state
for insert
to anon
with check (id = 'family-trip');

create policy "Anyone can update trip state"
on public.trip_state
for update
to anon
using (id = 'family-trip')
with check (id = 'family-trip');
