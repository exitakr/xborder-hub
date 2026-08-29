-- 0025 — Collector levels.
--
-- WHY THE LADDER IS NOT IN THIS FILE
--
-- The obvious design is a `levels` table and a SQL function returning the
-- level. It is the wrong one here: the native app and the web app both have to
-- render this badge, the thresholds are pure arithmetic over two numbers, and a
-- ladder that lives in Postgres means a copy in TypeScript for the progress bar
-- and two places that can disagree about what level someone is.
--
-- So the split is by KIND of knowledge. The database owns the facts nobody else
-- can compute — how many distinct items this person has ever added, and what
-- their holdings are worth in one comparable currency — plus the high-water
-- mark, which is the only piece of durable state involved. The ladder itself
-- lives in packages/core/src/levels.ts, where both clients read it from the
-- same file.
--
-- The peak is why there is any state at all. Selling is a normal thing to do
-- with a collection, and recording sales is data this product actively wants;
-- a level that dropped on a sale would punish exactly the behaviour being
-- asked for. So the level never decreases, and something has to remember that.

alter table public.profiles
  add column if not exists level_peak int not null default 1
  check (level_peak between 1 and 50);

comment on column public.profiles.level_peak is
  'Highest collector level ever reached. The displayed level is the greater of '
  'this and the level the current collection earns, so selling never demotes '
  'anyone. Raised by set_level_peak; never lowered. The check bound is a sanity '
  'limit on a client-supplied number, not the length of the ladder.';

-- ---------------------------------------------------------------------------
-- the facts
-- ---------------------------------------------------------------------------
/**
 * The two numbers a level is computed from, plus the stored peak.
 *
 * `items_ever` counts DISTINCT market items this person has ever added, not
 * current holdings. Someone who has bought and sold forty cards has done the
 * collecting; the count should say so.
 *
 * `value_jpy` uses the same valuation as `admin_user_portfolios` in 0017: only
 * holdings with a current price count, and a currency with no fx rate is
 * skipped rather than counted at face value in the wrong unit. An unpriced item
 * contributing its cost, or a USD price counted as yen, would both inflate a
 * level someone did not earn.
 */
create or replace function public.my_level_metrics()
returns table (
  items_ever int,
  value_jpy  numeric,
  level_peak int
)
language sql
security definer
stable
set search_path = public
as $$
  with me as (
    select auth.uid() as uid
  ),
  qty as (
    select
      h.market_item_id,
      sum(case when t.type = 'buy' then t.quantity else -t.quantity end) as net
    from public.transactions t
    join public.holdings h on h.id = t.holding_id
    where t.user_id = (select uid from me)
    group by h.market_item_id
  ),
  valued as (
    select coalesce(sum(
      case
        when mi.current_price is null then 0
        else q.net * mi.current_price /
             coalesce((select rate from public.fx_rates f where f.currency = mi.currency), 1)
      end
    ), 0) as value_jpy
    from qty q
    join public.market_items mi on mi.id = q.market_item_id
    where q.net > 0
  )
  select
    (select count(distinct h.market_item_id)::int
       from public.holdings h where h.user_id = (select uid from me)),
    (select value_jpy from valued),
    coalesce((select p.level_peak from public.profiles p where p.id = (select uid from me)), 1)
  where (select uid from me) is not null;
$$;

grant execute on function public.my_level_metrics() to authenticated;

-- ---------------------------------------------------------------------------
-- the high-water mark
-- ---------------------------------------------------------------------------
/**
 * Raise the stored peak. Never lowers it, and never trusts the number.
 *
 * The level is computed on the client from the shared ladder, so the value
 * arriving here has passed through code a determined person can edit. Two
 * consequences are handled rather than hoped away:
 *
 *  - it can only go UP, so the worst a forged call achieves is the same thing
 *    the caller could achieve by adding items;
 *  - it is clamped, so nobody becomes level 9,999 and breaks a tier lookup.
 *
 * A stricter design would recompute the level in SQL and refuse to be told.
 * That would mean the ladder living in two places, which is a real correctness
 * risk against a cosmetic badge with no entitlement attached to it — nothing is
 * unlocked by a level, so the trade is worth making. If a level ever gates
 * something, this function must start computing rather than accepting.
 */
create or replace function public.set_level_peak(p_level int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_new := greatest(1, least(50, coalesce(p_level, 1)));

  update public.profiles
     set level_peak = greatest(level_peak, v_new)
   where id = auth.uid()
  returning level_peak into v_new;

  return coalesce(v_new, 1);
end;
$$;

grant execute on function public.set_level_peak(int) to authenticated;

-- ---------------------------------------------------------------------------
-- how many people are at each level
-- ---------------------------------------------------------------------------
-- Retention is the number this product has to prove, and levels are the
-- retention mechanism. Without this the operator cannot tell whether anyone
-- ever gets past level 1 -- which is the difference between "the ladder works"
-- and "the ladder is decoration".
create or replace function public.admin_level_distribution()
returns table (level int, members bigint)
language sql
security definer
stable
set search_path = public
as $$
  select p.level_peak, count(*)
  from public.profiles p
  where public.is_admin()
  group by p.level_peak
  order by p.level_peak;
$$;

grant execute on function public.admin_level_distribution() to authenticated;
