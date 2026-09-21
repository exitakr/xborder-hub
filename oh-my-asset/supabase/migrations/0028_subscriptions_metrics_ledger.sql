-- 0028 — Recurring revenue, a metrics history, and a revenue ledger.
--
-- Three of the things a buyer diligences, none of which this product could
-- produce. They are one migration because they answer one question: what is
-- this business worth, and on what evidence.
--
-- ---------------------------------------------------------------------------
-- 1. WHY THE ONE-TIME PURCHASE HAD TO GO
-- ---------------------------------------------------------------------------
--
-- A ¥100 buy-once does not accumulate. Every customer pays exactly once and
-- then contributes nothing for the rest of their life, so revenue is a function
-- of how many people signed up THIS month and nothing else. A business valued
-- on that has no multiple to apply: there is no run rate, only a history of
-- one-off payments that may or may not repeat.
--
-- A subscription is the same product with a different shape of evidence. Twenty
-- subscribers at ¥500 is ¥120,000 of annual run rate that a buyer can discount
-- and capitalise. Twenty one-time purchases is ¥2,000 that already happened.
--
-- `entitlements.expires_at` already existed and `has_unlimited()` already
-- honoured it, so the enforcement side needs nothing new — a subscription is
-- an entitlement that expires unless renewed. What is added is the bookkeeping
-- around it: which Stripe customer an account is, whether the subscription is
-- set to lapse, and at what cadence it bills.
--
-- ---------------------------------------------------------------------------
-- 2. WHY METRICS HAVE TO BE CAPTURED DAILY
-- ---------------------------------------------------------------------------
--
-- `admin_kpis()` answers "how many users are active today". It cannot answer
-- "was that number rising in July", because it is computed live from the
-- current state of the tables. Retention and MAU are shapes over time, and a
-- shape cannot be reconstructed after the fact from a database that only knows
-- the present. The only way to have a twelve-month chart next year is to start
-- writing a row a day now.
--
-- ---------------------------------------------------------------------------
-- 3. WHY A REVENUE LEDGER, WHEN STRIPE HAS ONE
-- ---------------------------------------------------------------------------
--
-- Stripe's dashboard is the authority on what was charged. It is not evidence
-- an acquirer can reconcile against the product, because it knows customers and
-- not accounts — and the moment the Stripe account changes hands or is closed,
-- the history goes with it. A ledger in this database ties each payment to the
-- account it entitled, survives the payment provider, and exports to CSV for an
-- accountant.

-- ===========================================================================
-- PART 1 — subscriptions
-- ===========================================================================

alter table public.profiles
  add column if not exists stripe_customer_id text unique;

comment on column public.profiles.stripe_customer_id is
  'Links this account to its Stripe customer. Needed to open the billing '
  'portal, which is how a subscriber cancels — the Specified Commercial '
  'Transactions Act requires cancellation to be as easy as signing up.';

alter table public.entitlements
  add column if not exists subscription_id text unique,
  add column if not exists bill_interval text
    check (bill_interval is null or bill_interval in ('month','year')),
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists status text not null default 'active'
    check (status in ('active','past_due','canceled'));

comment on column public.entitlements.status is
  'Stripe''s view of the subscription. `past_due` keeps access until '
  'expires_at passes: a failed card is a payment problem, not a reason to '
  'lock someone out of their own records mid-retry.';

comment on column public.entitlements.cancel_at_period_end is
  'Set when a subscriber has cancelled but paid through the end of the period. '
  'They keep access until expires_at; the UI says so rather than pretending '
  'nothing happened.';

/**
 * Record a subscription state change.
 *
 * Called by the Stripe webhook after signature verification, running as the
 * service role. Idempotent on `subscription_id`, because Stripe redelivers.
 *
 * `expires_at` is the current period end, so an entitlement simply lapses if a
 * renewal never arrives — no cron is needed to expire anyone, and a webhook
 * this app never receives cannot leave someone entitled forever.
 */
create or replace function public.grant_subscription(
  p_user            uuid,
  p_subscription_id text,
  p_status          text,
  p_expires         timestamptz,
  p_interval        text default null,
  p_cancel_at_end   boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.may_grant_entitlements() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('active','past_due','canceled') then
    raise exception 'invalid status';
  end if;

  -- A cancelled subscription keeps its row until the paid period runs out.
  -- Deleting it here would revoke access somebody has already paid for.
  insert into public.entitlements
    (user_id, provider, subscription_id, status, expires_at, bill_interval,
     cancel_at_period_end)
  values
    (p_user, 'stripe', p_subscription_id, p_status, p_expires, p_interval,
     coalesce(p_cancel_at_end, false))
  on conflict (user_id) do update
    set provider             = 'stripe',
        subscription_id      = excluded.subscription_id,
        status               = excluded.status,
        expires_at           = excluded.expires_at,
        bill_interval        = coalesce(excluded.bill_interval, public.entitlements.bill_interval),
        cancel_at_period_end = excluded.cancel_at_period_end;
end;
$$;

grant execute on function public.grant_subscription(uuid, text, text, timestamptz, text, boolean) to authenticated;

/** Attach a Stripe customer to an account, so the billing portal can open. */
create or replace function public.set_stripe_customer(p_user uuid, p_customer text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.may_grant_entitlements() then
    raise exception 'forbidden';
  end if;
  update public.profiles set stripe_customer_id = p_customer where id = p_user;
end;
$$;

grant execute on function public.set_stripe_customer(uuid, text) to authenticated;

-- `my_plan` has to report the subscription's shape, not only whether it is on:
-- a subscriber who has cancelled needs to see the date their access ends.
drop function if exists public.my_plan();

create or replace function public.my_plan()
returns table (
  unlimited            boolean,
  holdings_used        int,
  holdings_max         int,
  expires_at           timestamptz,
  status               text,
  bill_interval        text,
  cancel_at_period_end boolean,
  has_customer         boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    public.has_unlimited(auth.uid()),
    (select count(*)::int from public.holdings where user_id = auth.uid()),
    public.free_holding_limit(),
    (select e.expires_at from public.entitlements e where e.user_id = auth.uid()),
    (select e.status from public.entitlements e where e.user_id = auth.uid()),
    (select e.bill_interval from public.entitlements e where e.user_id = auth.uid()),
    coalesce((select e.cancel_at_period_end from public.entitlements e where e.user_id = auth.uid()), false),
    (select p.stripe_customer_id is not null from public.profiles p where p.id = auth.uid());
$$;

grant execute on function public.my_plan() to authenticated;

-- ===========================================================================
-- PART 2 — the metrics history
-- ===========================================================================

create table if not exists public.daily_metrics (
  day                 date primary key,
  users_total         int not null default 0,
  users_new           int not null default 0,
  /* Distinct users who recorded anything in the trailing window. */
  active_1d           int not null default 0,
  active_7d           int not null default 0,
  active_30d          int not null default 0,
  users_with_holdings int not null default 0,
  holdings_total      int not null default 0,
  transactions_total  int not null default 0,
  items_total         int not null default 0,
  items_priced        int not null default 0,
  paying_total        int not null default 0,
  mrr_jpy             numeric not null default 0,
  tracked_value_jpy   numeric not null default 0,
  captured_at         timestamptz not null default now()
);

alter table public.daily_metrics enable row level security;
-- No policy at all: this is read through admin_metrics_history, which checks
-- is_admin() inside the function. A table with RLS on and no policy is
-- readable by nobody, which is the correct default for a business's own
-- numbers.

comment on table public.daily_metrics is
  'One row per day, written by the price cron. Retention and MAU are shapes '
  'over time and cannot be reconstructed from a database that only knows the '
  'present — this is the only reason a twelve-month chart will exist next '
  'year. See migration 0028.';

/**
 * Capture today's numbers. Idempotent: re-running overwrites the day.
 *
 * Deliberately called from the daily price cron rather than given its own
 * schedule. Vercel's Hobby plan allows one cron a day, and a metrics job that
 * competes for that slot with the job that keeps prices fresh would lose.
 */
create or replace function public.capture_daily_metrics()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.may_grant_entitlements() then
    raise exception 'forbidden';
  end if;

  insert into public.daily_metrics (
    day, users_total, users_new, active_1d, active_7d, active_30d,
    users_with_holdings, holdings_total, transactions_total,
    items_total, items_priced, paying_total, mrr_jpy, tracked_value_jpy
  )
  select
    current_date,
    (select count(*)::int from auth.users),
    (select count(*)::int from auth.users where created_at >= current_date),
    (select count(distinct user_id)::int from public.transactions where created_at > now() - interval '1 day'),
    (select count(distinct user_id)::int from public.transactions where created_at > now() - interval '7 days'),
    (select count(distinct user_id)::int from public.transactions where created_at > now() - interval '30 days'),
    (select count(distinct user_id)::int from public.holdings),
    (select count(*)::int from public.holdings),
    (select count(*)::int from public.transactions),
    (select count(*)::int from public.market_items),
    (select count(*)::int from public.market_items where current_price is not null),
    (select count(*)::int from public.entitlements
      where status = 'active' and (expires_at is null or expires_at > now())),
    /*
     * Monthly recurring revenue, with annual plans divided down.
     *
     * An annual subscriber is not twelve months of MRR in the month they pay;
     * counting them that way produces a sawtooth that overstates every month
     * they renew in and understates the eleven after. The prices are read from
     * the plan_prices table below so this figure moves when pricing does.
     */
    (select coalesce(sum(
        case e.bill_interval
          when 'month' then (select monthly_jpy from public.plan_prices limit 1)
          when 'year'  then (select yearly_jpy from public.plan_prices limit 1) / 12.0
          else 0
        end
      ), 0)
      from public.entitlements e
      where e.status = 'active' and (e.expires_at is null or e.expires_at > now())),
    (select coalesce(sum(
        case when mi.current_price is null then 0
        else h.qty * mi.current_price /
             coalesce((select rate from public.fx_rates f where f.currency = mi.currency), 1)
        end), 0)
      from (
        select hh.market_item_id,
               sum(case when t.type = 'buy' then t.quantity else -t.quantity end) as qty
        from public.transactions t
        join public.holdings hh on hh.id = t.holding_id
        group by hh.market_item_id
      ) h
      join public.market_items mi on mi.id = h.market_item_id
      where h.qty > 0)
  on conflict (day) do update set
    users_total         = excluded.users_total,
    users_new           = excluded.users_new,
    active_1d           = excluded.active_1d,
    active_7d           = excluded.active_7d,
    active_30d          = excluded.active_30d,
    users_with_holdings = excluded.users_with_holdings,
    holdings_total      = excluded.holdings_total,
    transactions_total  = excluded.transactions_total,
    items_total         = excluded.items_total,
    items_priced        = excluded.items_priced,
    paying_total        = excluded.paying_total,
    mrr_jpy             = excluded.mrr_jpy,
    tracked_value_jpy   = excluded.tracked_value_jpy,
    captured_at         = now();
end;
$$;

grant execute on function public.capture_daily_metrics() to authenticated;

/**
 * Published prices, in one row, so MRR and the pricing page cannot disagree.
 *
 * Stripe is the authority on what a card is actually charged; this is the
 * authority on what the product SAYS it costs and on how revenue is counted.
 * Keeping them in a table rather than a constant means a price change is a
 * row update rather than a deploy, and the historical MRR series stays
 * computable from whatever the price was.
 */
create table if not exists public.plan_prices (
  id          boolean primary key default true check (id),
  monthly_jpy numeric not null,
  yearly_jpy  numeric not null,
  updated_at  timestamptz not null default now()
);

alter table public.plan_prices enable row level security;
drop policy if exists "plan prices are public" on public.plan_prices;
create policy "plan prices are public" on public.plan_prices for select using (true);

insert into public.plan_prices (id, monthly_jpy, yearly_jpy)
values (true, 500, 5000)
on conflict (id) do nothing;

/** The metrics series, for the dashboard and for a buyer's data room. */
create or replace function public.admin_metrics_history(p_days int default 365)
returns setof public.daily_metrics
language sql
security definer
stable
set search_path = public
as $$
  select * from public.daily_metrics
  where public.is_admin()
    and day >= current_date - p_days
  order by day;
$$;

grant execute on function public.admin_metrics_history(int) to authenticated;

-- ===========================================================================
-- PART 3 — the revenue ledger
-- ===========================================================================

create table if not exists public.revenue_events (
  id             uuid primary key default gen_random_uuid(),
  /* Stripe's id for the charge or invoice. Unique so a redelivered webhook
     cannot book the same money twice. */
  external_id    text not null unique,
  user_id        uuid references auth.users(id) on delete set null,
  kind           text not null check (kind in ('charge','refund','chargeback')),
  /* Minor units as Stripe reports them — yen has none, so this is yen. Stored
     as the provider reported it rather than converted, because an accountant
     reconciles against the provider's own statement. */
  gross          numeric not null,
  fee            numeric not null default 0,
  net            numeric not null default 0,
  currency       text not null default 'JPY',
  occurred_at    timestamptz not null,
  description    text,
  created_at     timestamptz not null default now()
);

alter table public.revenue_events enable row level security;
-- Same reasoning as daily_metrics: no policy, read only through an admin
-- function that checks is_admin() in the body.

create index if not exists revenue_events_occurred_idx
  on public.revenue_events (occurred_at desc);

comment on table public.revenue_events is
  'Every payment, refund and chargeback, tied to the account it entitled. '
  'Stripe is the authority on what was charged; this is the record that '
  'survives the Stripe account changing hands, and the one that exports for '
  'an accountant. See migration 0028.';

/** Book a payment. Called by the webhook; idempotent on the provider's id. */
create or replace function public.record_revenue(
  p_external_id text,
  p_user        uuid,
  p_kind        text,
  p_gross       numeric,
  p_fee         numeric,
  p_net         numeric,
  p_currency    text,
  p_occurred_at timestamptz,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.may_grant_entitlements() then
    raise exception 'forbidden';
  end if;
  if p_kind not in ('charge','refund','chargeback') then
    raise exception 'invalid kind';
  end if;

  insert into public.revenue_events
    (external_id, user_id, kind, gross, fee, net, currency, occurred_at, description)
  values
    (p_external_id, p_user, p_kind, p_gross, coalesce(p_fee, 0), coalesce(p_net, 0),
     coalesce(p_currency, 'JPY'), p_occurred_at, p_description)
  on conflict (external_id) do nothing;
end;
$$;

grant execute on function public.record_revenue(text, uuid, text, numeric, numeric, numeric, text, timestamptz, text) to authenticated;

/** Monthly totals — the shape an accountant and an acquirer both ask for. */
create or replace function public.admin_revenue_summary(p_months int default 24)
returns table (
  month        date,
  charges      bigint,
  refunds      bigint,
  gross        numeric,
  fees         numeric,
  net          numeric,
  currency     text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    date_trunc('month', r.occurred_at)::date,
    count(*) filter (where r.kind = 'charge'),
    count(*) filter (where r.kind in ('refund','chargeback')),
    sum(case when r.kind = 'charge' then r.gross else -r.gross end),
    sum(r.fee),
    sum(case when r.kind = 'charge' then r.net else -r.net end),
    r.currency
  from public.revenue_events r
  where public.is_admin()
    and r.occurred_at >= date_trunc('month', current_date) - make_interval(months => p_months)
  group by 1, r.currency
  order by 1 desc;
$$;

grant execute on function public.admin_revenue_summary(int) to authenticated;

/** Line-by-line, for the CSV export and for reconciliation. */
create or replace function public.admin_revenue_events(p_limit int default 1000)
returns setof public.revenue_events
language sql
security definer
stable
set search_path = public
as $$
  select * from public.revenue_events
  where public.is_admin()
  order by occurred_at desc
  limit p_limit;
$$;

grant execute on function public.admin_revenue_events(int) to authenticated;

-- ===========================================================================
-- PART 4 — traction, publicly
-- ===========================================================================
/**
 * The two numbers the landing page is allowed to state about itself.
 *
 * "※数値はサンプルです" under a screenshot tells a buyer, in the product's own
 * voice, that nobody uses it. The honest replacement is not a better
 * disclaimer — it is a real figure. These two are real, safe to publish, and
 * grow on their own:
 *
 *   catalogue_items — how many things this app can price at all
 *   tracked_items   — how many are actually in somebody's portfolio
 *
 * Deliberately NOT the user count. A user count is the number a buyer will
 * diligence properly from the metrics history, and publishing a small one on
 * the front page argues against the product every day until it is large.
 *
 * No personal data is reachable through this: both are counts over rows whose
 * contents it never returns, which is why it can be granted to anon.
 */
create or replace function public.public_traction()
returns table (catalogue_items bigint, tracked_items bigint)
language sql
security definer
stable
set search_path = public
as $$
  select
    (select count(*) from public.market_items where approved_at is not null),
    (select count(*) from public.holdings);
$$;

grant execute on function public.public_traction() to anon, authenticated;
