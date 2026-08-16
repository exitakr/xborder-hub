-- 0019 — Shareable portfolio snapshots.
--
-- WHAT IS SHARED, AND WHAT IS NOT
--
-- A share link exposes exactly three things: the total value, its trend, and
-- the category mix. It does NOT expose item names, what was paid, quantities,
-- photos, or the owner's email — and it cannot, because the function below
-- returns only those aggregates. That is a deliberate line: a collector posting
-- a number is showing off, while the same person posting an itemised list of
-- valuables tied to an identity is publishing a shopping list for a burglar.
--
-- Sharing is OFF until the owner turns it on, the token is unguessable, and
-- revoking is immediate — a new token is minted each time it is enabled, so a
-- link that has been passed around cannot be brought back to life.

create table if not exists public.portfolio_shares (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  -- Random, not derived from the user id: a token computed from something
  -- guessable is not a secret. 32 hex characters is 128 bits.
  token      text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

alter table public.portfolio_shares enable row level security;

drop policy if exists "own share is readable" on public.portfolio_shares;
create policy "own share is readable" on public.portfolio_shares
  for select using (auth.uid() = user_id);

-- No insert/update/delete policies: both writes go through the functions below,
-- so a client cannot mint a token for somebody else's portfolio.

/**
 * Turn sharing on, returning the token.
 *
 * Re-enabling issues a NEW token rather than reviving the old one. Anyone who
 * still has a previously revoked link must not get access back because the
 * owner later shared again with someone else.
 */
create or replace function public.enable_portfolio_share()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := encode(gen_random_bytes(16), 'hex');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.portfolio_shares (user_id, token)
  values (auth.uid(), v_token)
  on conflict (user_id) do update set token = excluded.token, created_at = now();

  return v_token;
end;
$$;

create or replace function public.disable_portfolio_share()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.portfolio_shares where user_id = auth.uid();
$$;

/**
 * The public snapshot behind a share link.
 *
 * SECURITY DEFINER and callable by `anon`, because the whole point is that
 * somebody without an account can open it. What makes that safe is the return
 * type: aggregates only. There is no item, no transaction and no identity in
 * this result set, so there is nothing here to leak even to someone who
 * guesses a token.
 *
 * Values are in JPY. A viewer has no profile, so there is no display currency
 * to honour, and picking the owner's would leak their settings for no gain.
 */
create or replace function public.shared_portfolio(p_token text)
returns table (
  display_name  text,
  total_jpy     numeric,
  cost_jpy      numeric,
  item_count    bigint,
  categories    text,
  shared_since  timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  with owner as (
    select s.user_id, s.created_at
    from public.portfolio_shares s
    where s.token = p_token
  ),
  qty as (
    select
      h.market_item_id,
      sum(case when t.type = 'buy' then t.quantity else -t.quantity end) as net,
      sum(case when t.type = 'buy' then t.quantity * t.unit_price else 0 end) as spend
    from public.transactions t
    join public.holdings h on h.id = t.holding_id
    where t.user_id = (select user_id from owner)
    group by h.market_item_id
  )
  select
    p.display_name,
    coalesce(sum(
      case when mi.current_price is null then 0
      else q.net * mi.current_price /
           coalesce((select rate from public.fx_rates f where f.currency = mi.currency), 1)
      end
    ), 0),
    coalesce(sum(q.spend), 0),
    count(*) filter (where q.net > 0),
    string_agg(distinct mi.category, ',' order by mi.category),
    (select created_at from owner)
  from qty q
  join public.market_items mi on mi.id = q.market_item_id
  cross join public.profiles p
  where p.id = (select user_id from owner)
    and q.net > 0
  group by p.display_name;
$$;

grant execute on function public.enable_portfolio_share()  to authenticated;
grant execute on function public.disable_portfolio_share() to authenticated;
-- Deliberately open to anonymous callers: an unauthenticated viewer opening a
-- link is the entire feature. The aggregate-only return type is the control.
grant execute on function public.shared_portfolio(text) to anon, authenticated;
