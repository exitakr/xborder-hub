-- Oh My Asset — a valuation the holder supplies themselves.
--
-- WHY THIS EXISTS
-- Items with no automatic feed — bags, anything the catalogue carries as
-- `curated`, anything a user asked to be added — have no price, and an item with
-- no price is excluded from the portfolio total entirely (calc.ts treats an
-- unknown value as unknown, never as zero). The holding therefore vanishes from
-- the one number the product exists to show. A figure the holder took from a
-- buyback quote or a dealer's list is not a market price, but it is evidence,
-- and it is theirs.
--
-- HOW IT DIFFERS FROM THE NEIGHBOURING TABLES
--   price_reports (0006) is a contribution TO OTHER PEOPLE: many users, one
--     aggregate, a three-contributor floor, nobody's individual row readable.
--   market_items.current_price is the automatic feed, identical for everyone.
--   this table is PRIVATE TO ITS AUTHOR and affects only their own portfolio.
--     It is never aggregated and never shown to anyone else.
--
-- The source is mandatory. A number with no stated origin cannot be judged
-- later — not by the user, and not by anyone reading the total over their
-- shoulder — and the whole product rests on prices carrying their provenance.

create table if not exists public.self_reported_prices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  market_item_id uuid not null references public.market_items(id) on delete cascade,
  price          numeric not null check (price > 0),
  currency       text not null default 'JPY'
                   check (currency in ('JPY','SGD','USD')),
  -- Where the figure came from, in the user's own words: "◯◯買取 査定額",
  -- "Chrono24 の相場", a shop name. Free text because the venues are endless.
  source         text not null check (length(btrim(source)) between 1 and 120),
  -- When the figure was true. Distinct from created_at: a quote from last month
  -- entered today describes last month, and the disclaimer says so.
  as_of          date not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- One standing valuation per item per user. Revising it replaces it; the
  -- history of what someone used to think it was worth is not what this is for.
  unique (user_id, market_item_id),

  constraint self_reported_prices_not_future
    check (as_of <= (now() at time zone 'utc')::date + 1)
);

create index if not exists self_reported_prices_user_idx
  on public.self_reported_prices (user_id);

alter table public.self_reported_prices enable row level security;

drop policy if exists "own self reported prices" on public.self_reported_prices;
create policy "own self reported prices" on public.self_reported_prices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Guard: the new table must not have escaped RLS. Without it, one user's
-- private valuations would be readable by every authenticated caller.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'self_reported_prices'
       and c.relrowsecurity
  ) then
    raise exception 'RLS is disabled on self_reported_prices';
  end if;
end $$;
