-- Oh My Asset — community-reported sale prices, plus the Rakuten source type.
--
-- WHY THIS EXISTS
-- Watches, bags, sneakers and Yu-Gi-Oh have no free API that reports what they
-- actually sell for. eBay Browse and Rakuten Ichiba both report ASKING prices;
-- the venues that know realised prices (Mercari, Yahoo! Auctions, StockX,
-- Chrono24) publish no usable API. The only remaining source of realised prices
-- is the people who made the trades. See docs/RESEARCH.md §8.
--
-- WHY A SEPARATE TABLE, NOT `transactions`
-- Users enter transactions as private portfolio data, protected by RLS. Reusing
-- those rows as a public market signal would publish something they never
-- offered. Contribution is therefore an explicit, separate act with its own
-- consent, and it carries fields a portfolio entry has no reason to hold
-- (venue, condition).

-- ---------------------------------------------------------------------------
-- Rakuten Ichiba joins the source list. Free, documented, commercially usable,
-- and JPY-native, which suits a Japanese catalogue better than a USD feed.
-- Like eBay it reports asking prices, and is labelled as such in the UI.
-- ---------------------------------------------------------------------------
alter table public.market_items
  drop constraint if exists market_items_source_type_check;

alter table public.market_items
  add constraint market_items_source_type_check
  check (source_type in ('ebay', 'curated', 'scryfall', 'pokemontcg', 'rakuten'));

-- ---------------------------------------------------------------------------
-- price_reports — one realised trade, volunteered by the user who made it.
-- ---------------------------------------------------------------------------
create table if not exists public.price_reports (
  id             uuid primary key default gen_random_uuid(),
  market_item_id uuid not null references public.market_items(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  -- Sold and bought are kept apart rather than pooled: a purchase price carries
  -- retail markup, so mixing the two would bias the figure upward. Only 'sold'
  -- feeds the published aggregate; 'bought' is retained for later analysis.
  kind           text not null check (kind in ('sold','bought')),
  price          numeric not null check (price > 0),
  currency       text not null default 'JPY'
                   check (currency in ('JPY','SGD','USD')),
  traded_on      date not null,
  venue          text check (venue in ('mercari','yahoo_auction','store','other')),
  condition      text check (condition in ('new','used','graded')),
  created_at     timestamptz not null default now(),
  -- Same guard as transactions: the UI blocks future dates and so does the DB.
  constraint price_reports_not_future
    check (traded_on <= (now() at time zone 'utc')::date + 1)
);

create index if not exists price_reports_item_idx
  on public.price_reports (market_item_id, traded_on desc);
create index if not exists price_reports_user_idx
  on public.price_reports (user_id);

alter table public.price_reports enable row level security;

-- A contributor sees and manages only their own reports. Nobody reads anyone
-- else's row directly; the crowd is visible only through the aggregate
-- functions below, which is what keeps one person's trade from being singled
-- out of the total.
drop policy if exists "own price reports" on public.price_reports;
create policy "own price reports" on public.price_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Aggregation.
--
-- Three rules make the published figure resistant to being moved by one person:
--
--  1. ONE VOTE PER CONTRIBUTOR. Each user's reports collapse to their own median
--     before the crowd median is taken, so filing twenty entries carries no more
--     weight than filing one.
--  2. A FLOOR OF THREE CONTRIBUTORS. Below that it is an anecdote, not a market
--     price, and the function returns nothing rather than something misleading.
--  3. A 180-DAY WINDOW. Collectible prices move; a two-year-old sale is not
--     evidence about today.
--
-- Prices are normalised to JPY at read time using the current fx_rates, which
-- are stored as units of X per 1 JPY.
-- ---------------------------------------------------------------------------
create or replace function public.community_price(item uuid)
returns table (
  price_jpy    numeric,
  contributors int,
  reports      int,
  first_traded date,
  last_traded  date
)
language sql
security definer
stable
set search_path = public
as $$
  with recent as (
    select r.user_id,
           r.price / f.rate as price_jpy,
           r.traded_on
      from public.price_reports r
      join public.fx_rates f on f.currency = r.currency
     where r.market_item_id = item
       and r.kind = 'sold'
       and r.traded_on >= current_date - 180
  ),
  per_user as (
    select user_id,
           percentile_cont(0.5) within group (order by price_jpy) as price_jpy,
           min(traded_on) as first_traded,
           max(traded_on) as last_traded,
           count(*)       as n
      from recent
     group by user_id
  )
  select percentile_cont(0.5) within group (order by price_jpy)::numeric,
         count(*)::int,
         sum(n)::int,
         min(first_traded),
         max(last_traded)
    from per_user
   having count(*) >= 3;
$$;

-- Monthly points for the chart, under the same three-contributor floor. A month
-- with two contributors is omitted entirely rather than drawn thinner: a chart
-- that plots single trades lets a reader work backwards to an individual.
create or replace function public.community_price_series(item uuid)
returns table (
  month        date,
  price_jpy    numeric,
  contributors int
)
language sql
security definer
stable
set search_path = public
as $$
  with recent as (
    select r.user_id,
           date_trunc('month', r.traded_on)::date as month,
           r.price / f.rate as price_jpy
      from public.price_reports r
      join public.fx_rates f on f.currency = r.currency
     where r.market_item_id = item
       and r.kind = 'sold'
       and r.traded_on >= current_date - 540
  ),
  per_user as (
    select month, user_id,
           percentile_cont(0.5) within group (order by price_jpy) as price_jpy
      from recent
     group by month, user_id
  )
  select month,
         percentile_cont(0.5) within group (order by price_jpy)::numeric,
         count(*)::int
    from per_user
   group by month
  having count(*) >= 3
   order by month;
$$;

-- How much the signed-in user has contributed, and the reach of it. Shown on
-- My Page: the reason to file a report is that it visibly helps other people,
-- and that is only true if the app actually says so.
create or replace function public.my_contribution_stats()
returns table (
  reports        int,
  items_covered  int,
  items_unlocked int
)
language sql
security definer
stable
set search_path = public
as $$
  with mine as (
    select distinct market_item_id
      from public.price_reports
     where user_id = auth.uid()
  )
  select (select count(*)::int from public.price_reports where user_id = auth.uid()),
         (select count(*)::int from mine),
         -- Items whose published price exists at all, which the user's report is
         -- part of. This is the "your data is doing something" number.
         (select count(*)::int
            from mine m
           where (select contributors from public.community_price(m.market_item_id)) is not null);
$$;

revoke all on function public.community_price(uuid)        from public;
revoke all on function public.community_price_series(uuid) from public;
revoke all on function public.my_contribution_stats()      from public;

grant execute on function public.community_price(uuid)        to authenticated;
grant execute on function public.community_price_series(uuid) to authenticated;
grant execute on function public.my_contribution_stats()      to authenticated;

-- ---------------------------------------------------------------------------
-- Guard: the new table must not have escaped RLS.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'price_reports'
       and c.relrowsecurity
  ) then
    raise exception 'RLS is disabled on price_reports';
  end if;
end $$;
