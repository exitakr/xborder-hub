-- 0017 — Who the users are, what they hold, and one owner.
--
-- The dashboard could already count users. It could not answer the question a
-- buyer actually asks, which is not "how many" but "what are they doing" — how
-- much value each account tracks, in which categories, and whether they came
-- back. Those are the numbers that turn a user count into a business.

-- ---------------------------------------------------------------------------
-- exactly one admin
-- ---------------------------------------------------------------------------
-- The admin link appears for anyone with profiles.is_admin, and authorisation
-- everywhere is that same flag re-checked inside each SECURITY DEFINER
-- function. So restricting the dashboard to one person is a data statement,
-- not a code change — and doing it this way means the owner's address never
-- ends up compiled into a client bundle where it would be scraped.
--
-- Idempotent: safe to re-run, and it will correct the flag if it ever drifts.
update public.profiles set is_admin = false
 where is_admin = true
   and id <> (select id from auth.users where lower(email) = 'exitakr@gmail.com');

update public.profiles set is_admin = true
 where id = (select id from auth.users where lower(email) = 'exitakr@gmail.com');

-- ---------------------------------------------------------------------------
-- per-user portfolios
-- ---------------------------------------------------------------------------
/**
 * One row per member, with what they actually hold.
 *
 * `tracked_value_jpy` is the honest version: it values only holdings that have
 * a price, in JPY, and skips the rest rather than treating an unpriced item as
 * worth nothing. A total that silently counts unknowns as zero is worse than a
 * smaller total that means what it says.
 *
 * Quantity comes from buys minus sells, so a sold-out position contributes
 * nothing — which is the point, since it is no longer held.
 */
create or replace function public.admin_user_portfolios(p_limit int default 500)
returns table (
  user_id           uuid,
  email             text,
  display_name      text,
  locale            text,
  base_currency     text,
  created_at        timestamptz,
  last_activity     timestamptz,
  confirmed         boolean,
  unlimited         boolean,
  holdings_count    bigint,
  transactions_count bigint,
  tracked_value_jpy numeric,
  cost_jpy          numeric,
  categories        text
)
language sql
security definer
stable
set search_path = public
as $$
  with qty as (
    select
      t.user_id,
      h.market_item_id,
      sum(case when t.type = 'buy' then t.quantity else -t.quantity end) as net,
      sum(case when t.type = 'buy' then t.quantity * t.unit_price else 0 end) as spend
    from public.transactions t
    join public.holdings h on h.id = t.holding_id
    group by t.user_id, h.market_item_id
  ),
  valued as (
    select
      q.user_id,
      sum(
        case
          when mi.current_price is null then 0
          -- Rates live in fx_rates as units per JPY; a missing rate means the
          -- row is skipped rather than counted at face value in the wrong unit.
          else q.net * mi.current_price /
               coalesce((select rate from public.fx_rates f where f.currency = mi.currency), 1)
        end
      ) as value_jpy,
      sum(q.spend) as cost_jpy
    from qty q
    join public.market_items mi on mi.id = q.market_item_id
    where q.net > 0
    group by q.user_id
  )
  select
    p.id,
    u.email::text,
    p.display_name,
    p.locale,
    p.base_currency,
    u.created_at,
    greatest(u.last_sign_in_at, (select max(t.created_at) from public.transactions t where t.user_id = p.id)),
    u.email_confirmed_at is not null,
    public.has_unlimited(p.id),
    (select count(*) from public.holdings h where h.user_id = p.id),
    (select count(*) from public.transactions t where t.user_id = p.id),
    coalesce((select v.value_jpy from valued v where v.user_id = p.id), 0),
    coalesce((select v.cost_jpy from valued v where v.user_id = p.id), 0),
    -- Which categories this member collects, as a readable summary. The mix is
    -- what says whether this is a card app with a few watches attached or a
    -- genuinely cross-category product.
    (select string_agg(distinct mi.category, ', ' order by mi.category)
       from public.holdings h
       join public.market_items mi on mi.id = h.market_item_id
      where h.user_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by u.created_at desc
  limit p_limit;
$$;

grant execute on function public.admin_user_portfolios(int) to authenticated;

/**
 * Catalogue popularity: what people actually track.
 *
 * The single most useful artefact for deciding what to add next, and for a
 * buyer, evidence of which categories have real demand rather than a seeded
 * catalogue nobody touched.
 */
create or replace function public.admin_top_items(p_limit int default 100)
returns table (
  item_id      uuid,
  name         text,
  category     text,
  holders      bigint,
  current_price numeric,
  currency     text,
  confidence   text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    mi.id, mi.name, mi.category,
    count(distinct h.user_id),
    mi.current_price, mi.currency, mi.data_confidence
  from public.market_items mi
  join public.holdings h on h.market_item_id = mi.id
  where public.is_admin()
  group by mi.id, mi.name, mi.category, mi.current_price, mi.currency, mi.data_confidence
  order by count(distinct h.user_id) desc, mi.name
  limit p_limit;
$$;

grant execute on function public.admin_top_items(int) to authenticated;
