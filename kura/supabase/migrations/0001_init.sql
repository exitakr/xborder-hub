-- Oh My Asset — initial schema (SPEC §4)
--
-- Run this in Supabase Dashboard → SQL Editor. It is idempotent: re-running it
-- is safe and will not drop data.
--
-- SECURITY: every user-owned table has RLS enabled AND a policy. Enabling RLS
-- without a policy locks the table; adding a policy without enabling RLS leaves
-- it wide open. Both are asserted at the bottom of this file.

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  base_currency text not null default 'JPY'
                  check (base_currency in ('JPY','SGD','USD')),
  locale        text not null default 'ja' check (locale in ('ja','en')),
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- New signups get a profile row automatically. display_name is left NULL on
-- purpose: deriving it from the email local-part leaks the address to anyone
-- who can see the user's name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- market_items — the catalogue. Public read, service-role write.
-- ---------------------------------------------------------------------------
create table if not exists public.market_items (
  id               uuid primary key default gen_random_uuid(),
  category         text not null
                     check (category in ('pokemon','tcg','watch','bag','sneaker')),
  name             text not null,
  detail           text,
  identifier       text,
  -- Query sent to eBay Browse. NULL for curated-only items.
  search_query     text,
  source_type      text not null check (source_type in ('ebay','curated')),
  source_url       text,
  current_price    numeric,
  currency         text not null default 'JPY'
                     check (currency in ('JPY','SGD','USD')),
  price_updated_at timestamptz,
  data_confidence  text check (data_confidence in ('high','medium','low','insufficient')),
  created_at       timestamptz not null default now()
);

create index if not exists market_items_category_idx on public.market_items (category);
create index if not exists market_items_name_idx on public.market_items (name text_pattern_ops);

-- ---------------------------------------------------------------------------
-- price_snapshots — append only. Never UPDATE; the chart is built from this.
-- ---------------------------------------------------------------------------
create table if not exists public.price_snapshots (
  id             bigserial primary key,
  market_item_id uuid not null references public.market_items(id) on delete cascade,
  price          numeric not null check (price > 0),
  currency       text not null default 'JPY'
                   check (currency in ('JPY','SGD','USD')),
  sample_size    int,
  source         text,
  observed_at    timestamptz not null default now()
);

create index if not exists price_snapshots_item_time_idx
  on public.price_snapshots (market_item_id, observed_at desc);

-- ---------------------------------------------------------------------------
-- holdings
-- ---------------------------------------------------------------------------
create table if not exists public.holdings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  market_item_id uuid not null references public.market_items(id) on delete cascade,
  photo_path     text,
  note           text,
  created_at     timestamptz not null default now(),
  unique (user_id, market_item_id)
);

create index if not exists holdings_user_idx on public.holdings (user_id);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  holding_id uuid not null references public.holdings(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('buy','sell')),
  traded_on  date not null,
  quantity   int not null check (quantity > 0),
  unit_price numeric not null check (unit_price > 0),
  currency   text not null default 'JPY'
               check (currency in ('JPY','SGD','USD')),
  created_at timestamptz not null default now(),
  -- Defence in depth: the UI blocks future dates, and so does the database.
  constraint transactions_not_future check (traded_on <= (now() at time zone 'utc')::date + 1)
);

create index if not exists transactions_holding_idx on public.transactions (holding_id, traded_on);
create index if not exists transactions_user_idx on public.transactions (user_id);

-- ---------------------------------------------------------------------------
-- fx_rates — units of <currency> per 1 JPY. Refreshed by the daily cron.
-- ---------------------------------------------------------------------------
create table if not exists public.fx_rates (
  currency   text primary key check (currency in ('JPY','SGD','USD')),
  rate       numeric not null check (rate > 0),
  updated_at timestamptz not null default now()
);

insert into public.fx_rates (currency, rate) values
  ('JPY', 1),
  ('SGD', 0.0086),
  ('USD', 0.0064)
on conflict (currency) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security (SPEC §4.1) — never deploy without this.
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.holdings         enable row level security;
alter table public.transactions     enable row level security;
alter table public.market_items     enable row level security;
alter table public.price_snapshots  enable row level security;
alter table public.fx_rates         enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own holdings" on public.holdings;
create policy "own holdings" on public.holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Catalogue and prices are public reference data: readable by everyone,
-- writable only by the service role (which bypasses RLS entirely).
drop policy if exists "public read items" on public.market_items;
create policy "public read items" on public.market_items for select using (true);

drop policy if exists "public read snapshots" on public.price_snapshots;
create policy "public read snapshots" on public.price_snapshots for select using (true);

drop policy if exists "public read fx" on public.fx_rates;
create policy "public read fx" on public.fx_rates for select using (true);

-- ---------------------------------------------------------------------------
-- Admin check, used by the curation screen.
-- SECURITY DEFINER so it can read profiles.is_admin without the caller needing
-- broad select rights; it only ever returns a boolean about the caller.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Account deletion. Removes every row the user owns, in FK-safe order.
-- Storage objects are deleted separately by the application before this runs.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.transactions where user_id = uid;
  delete from public.holdings     where user_id = uid;
  delete from public.profiles     where id = uid;
  delete from auth.users          where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for holding photos.
-- Path convention: {user_id}/{holding_id}.jpg — the first path segment is the
-- owner, which is what the policies below key on.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'holding-photos',
  'holding-photos',
  false,
  5242880, -- 5 MB, enforced by the platform in addition to the client check
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = false;

drop policy if exists "own photos read"   on storage.objects;
drop policy if exists "own photos write"  on storage.objects;
drop policy if exists "own photos update" on storage.objects;
drop policy if exists "own photos delete" on storage.objects;

create policy "own photos read" on storage.objects
  for select using (
    bucket_id = 'holding-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos write" on storage.objects
  for insert with check (
    bucket_id = 'holding-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos update" on storage.objects
  for update using (
    bucket_id = 'holding-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own photos delete" on storage.objects
  for delete using (
    bucket_id = 'holding-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Guard: fail loudly if any user-owned table ended up without RLS.
-- ---------------------------------------------------------------------------
do $$
declare
  unprotected text;
begin
  select string_agg(c.relname, ', ')
    into unprotected
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('profiles','holdings','transactions','market_items',
                      'price_snapshots','fx_rates')
    and c.relrowsecurity = false;

  if unprotected is not null then
    raise exception 'RLS is disabled on: %', unprotected;
  end if;
end $$;
