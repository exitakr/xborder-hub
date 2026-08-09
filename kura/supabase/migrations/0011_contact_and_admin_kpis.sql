-- Oh My Asset — contact messages, and the operator's own dashboard.
--
-- WHY THIS EXISTS
--
-- 1. CONTACT. The legal pages published a mailto: address, which needs a
--    working mailbox on the domain and a person watching it. A form writing to
--    a table needs neither, and it means a message from a signed-in user
--    arrives already attached to an account instead of as an anonymous email
--    that support has to match up by hand.
--
-- 2. KPIs. The numbers an acquirer asks for — how many people, how fast that
--    is growing, how many come back, how much is actually tracked — are not
--    derivable from any screen the product has today. They are aggregates over
--    tables that RLS deliberately keeps each user inside, so they can only be
--    computed by something that crosses those boundaries deliberately.
--
-- Both admin functions are SECURITY DEFINER and both re-check is_admin()
-- themselves. That is not belt-and-braces: SECURITY DEFINER bypasses RLS
-- wholesale, so the check inside the function IS the access control. A page
-- that forgets to gate itself must not be able to leak the member list.

-- ---------------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  -- Null for a signed-out sender. `on delete set null` rather than cascade: a
  -- support thread should survive the account it was about being deleted,
  -- which is often exactly when it matters.
  user_id    uuid references auth.users(id) on delete set null,
  -- Captured at submit time. For a signed-in sender this is a copy of their
  -- account email, so a reply is still possible after the account is gone.
  email      text not null check (length(btrim(email)) between 3 and 320),
  subject    text not null check (length(btrim(subject)) between 1 and 120),
  body       text not null check (length(btrim(body)) between 1 and 4000),
  locale     text not null default 'ja' check (locale in ('ja','en')),
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_open_idx
  on public.contact_messages (created_at desc)
  where not handled;

alter table public.contact_messages enable row level security;

-- Anyone may write one; nobody may read one back. Reading is the admin
-- function's job — a policy granting select to the author would also be a
-- policy an admin has to be carved out of, and there is no reason for a sender
-- to re-read their own message inside the product.
drop policy if exists "anyone can send" on public.contact_messages;
create policy "anyone can send" on public.contact_messages
  for insert with check (
    user_id is null or user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- admin_kpis — one row, the operator's dashboard.
--
-- Activity is measured by the last transaction or price report a user filed,
-- not by a session: this product has no event tracking, and inventing a
-- last_seen column that only updates on write would measure the same thing
-- while looking like it measured more.
-- ---------------------------------------------------------------------------
create or replace function public.admin_kpis()
returns table (
  users_total            int,
  users_new_7d           int,
  users_new_30d          int,
  users_prev_30d         int,
  active_7d              int,
  active_30d             int,
  users_with_holdings    int,
  holdings_total         int,
  transactions_total     int,
  transactions_30d       int,
  tracked_value_jpy      numeric,
  items_total            int,
  items_priced           int,
  items_user_added       int,
  price_reports_total    int,
  self_reported_total    int,
  snapshots_total        int,
  last_price_refresh     timestamptz,
  contact_open           int
)
language sql
security definer
stable
set search_path = public
as $$
  with guard as (
    select case when public.is_admin() then true
                else (select null::boolean where false)
           end as ok
  ),
  activity as (
    select user_id, max(at) as last_at from (
      select user_id, created_at as at from public.transactions
      union all
      select user_id, created_at as at from public.price_reports
    ) x group by user_id
  ),
  -- Current quantity per holding, so value counts only what is still held.
  qty as (
    select h.user_id,
           h.market_item_id,
           coalesce(sum(case when t.type = 'buy' then t.quantity else -t.quantity end), 0) as q
      from public.holdings h
      left join public.transactions t on t.holding_id = h.id
     group by h.user_id, h.market_item_id
  )
  select
    (select count(*)::int from auth.users),
    (select count(*)::int from auth.users where created_at >= now() - interval '7 days'),
    (select count(*)::int from auth.users where created_at >= now() - interval '30 days'),
    (select count(*)::int from auth.users
      where created_at >= now() - interval '60 days'
        and created_at <  now() - interval '30 days'),
    (select count(*)::int from activity where last_at >= now() - interval '7 days'),
    (select count(*)::int from activity where last_at >= now() - interval '30 days'),
    (select count(distinct user_id)::int from public.holdings),
    (select count(*)::int from public.holdings),
    (select count(*)::int from public.transactions),
    (select count(*)::int from public.transactions where created_at >= now() - interval '30 days'),
    -- Everything normalised to JPY. Items with no price contribute nothing
    -- rather than zero — the same rule the portfolio screens apply.
    coalesce((
      select sum(q.q * m.current_price / f.rate)
        from qty q
        join public.market_items m on m.id = q.market_item_id
        join public.fx_rates f on f.currency = m.currency
       where q.q > 0 and m.current_price is not null
    ), 0)::numeric,
    (select count(*)::int from public.market_items),
    (select count(*)::int from public.market_items where current_price is not null),
    (select count(*)::int from public.market_items where created_by is not null),
    (select count(*)::int from public.price_reports),
    (select count(*)::int from public.self_reported_prices),
    (select count(*)::int from public.price_snapshots),
    (select max(price_updated_at) from public.market_items),
    (select count(*)::int from public.contact_messages where not handled)
  from guard;
$$;

-- ---------------------------------------------------------------------------
-- admin_members — the member list, one row per account.
-- ---------------------------------------------------------------------------
create or replace function public.admin_members(p_limit int default 200)
returns table (
  id                uuid,
  email             text,
  display_name      text,
  locale            text,
  base_currency     text,
  is_admin          boolean,
  created_at        timestamptz,
  holdings_count    int,
  transactions_count int,
  last_activity     timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select u.id,
         u.email::text,
         p.display_name,
         p.locale,
         p.base_currency,
         coalesce(p.is_admin, false),
         u.created_at,
         (select count(*)::int from public.holdings h where h.user_id = u.id),
         (select count(*)::int from public.transactions t where t.user_id = u.id),
         greatest(
           (select max(created_at) from public.transactions t where t.user_id = u.id),
           (select max(created_at) from public.price_reports r where r.user_id = u.id)
         )
    from auth.users u
    left join public.profiles p on p.id = u.id
   where public.is_admin()
   order by u.created_at desc
   limit least(greatest(coalesce(p_limit, 200), 1), 1000);
$$;

-- ---------------------------------------------------------------------------
-- admin_contact_messages / admin_mark_contact_handled
-- ---------------------------------------------------------------------------
create or replace function public.admin_contact_messages(p_limit int default 100)
returns table (
  id         uuid,
  user_id    uuid,
  email      text,
  subject    text,
  body       text,
  locale     text,
  handled    boolean,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select c.id, c.user_id, c.email, c.subject, c.body, c.locale, c.handled, c.created_at
    from public.contact_messages c
   where public.is_admin()
   order by c.handled asc, c.created_at desc
   limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

create or replace function public.admin_mark_contact_handled(p_id uuid, p_handled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.contact_messages set handled = coalesce(p_handled, true) where id = p_id;

  if not found then
    raise exception 'message not found';
  end if;
end;
$$;

revoke all on function public.admin_kpis()                              from public;
revoke all on function public.admin_members(int)                        from public;
revoke all on function public.admin_contact_messages(int)               from public;
revoke all on function public.admin_mark_contact_handled(uuid, boolean) from public;

grant execute on function public.admin_kpis()                              to authenticated;
grant execute on function public.admin_members(int)                        to authenticated;
grant execute on function public.admin_contact_messages(int)               to authenticated;
grant execute on function public.admin_mark_contact_handled(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Guard: the new table must not have escaped RLS.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'contact_messages'
       and c.relrowsecurity
  ) then
    raise exception 'RLS is disabled on contact_messages';
  end if;
end $$;
