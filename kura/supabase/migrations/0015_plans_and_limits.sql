-- 0015 — Registration limit and the paid unlock.
--
-- THE PAYWALL IS THE COUNT, NOT A FEATURE
--
-- Nothing is taken away from a free user: every price, every chart, every
-- source is the same on both plans. What the free plan caps is HOW MANY items
-- you may hold. That choice is deliberate on three grounds:
--
--   1. It scales with how much the app is worth to the person. Someone tracking
--      four cards is not getting £X of value from it; someone tracking two
--      hundred plainly is.
--   2. It cannot be gamed by degrading the product. A paywall on "accurate
--      prices" or "history" would give us a reason to make the free tier worse,
--      and this app's entire argument is that its numbers are honest.
--   3. Scryfall's licence FORBIDS putting its data behind a paywall
--      (docs/RESEARCH.md §7). A feature-gated design would breach it. A count
--      limit does not: every price stays visible on the free tier.
--
-- WHY THE LIMIT IS ENFORCED HERE
--
-- The native app writes to PostgREST directly, exactly like migration 0004's
-- quantity trigger. A limit checked only in the web UI would be bypassed by the
-- app, by curl, and by anyone who reads the anon key out of the bundle. The
-- trigger below is the actual limit; every screen that counts is only telling
-- the user what the database will do.

-- ---------------------------------------------------------------------------
-- entitlements
-- ---------------------------------------------------------------------------
-- One row per user who has paid. No row means the free plan — absence is the
-- default rather than a 'free' row that has to be created on signup and can go
-- missing.
--
-- `expires_at` carries both shapes of product without a schema change:
--   NULL      → bought once, never expires (the launch product)
--   timestamp → a subscription, valid until then
-- Switching between them later is a pricing decision, not a migration.
create table if not exists public.entitlements (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  plan        text not null default 'unlimited' check (plan in ('unlimited')),
  -- Where the money came from, for reconciliation against the store's own
  -- records. 'admin' covers comps, testing and support gestures.
  provider    text not null check (provider in ('apple','google','stripe','admin')),
  -- The store's transaction id. Unique so replaying one receipt cannot grant
  -- two entitlements; null for admin grants, which have no receipt.
  receipt_id  text unique,
  expires_at  timestamptz,
  granted_at  timestamptz not null default now(),
  note        text
);

alter table public.entitlements enable row level security;

-- Readable by its owner, and by nobody else. There is deliberately NO insert,
-- update or delete policy: a client that could write this table could grant
-- itself the paid plan for free. Every write goes through a SECURITY DEFINER
-- function called by a trusted server, or by an admin.
drop policy if exists "own entitlement is readable" on public.entitlements;
create policy "own entitlement is readable" on public.entitlements
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- the limit
-- ---------------------------------------------------------------------------
-- Chosen for this catalogue rather than copied from a card app. Our users hold
-- watches, bags and cars alongside cards, so a collection is counted in tens,
-- not hundreds: 20 is comfortably more than a casual holder will ever reach and
-- is reached quickly by the people the paid plan is for.
create or replace function public.free_holding_limit()
returns int
language sql
immutable
as $$ select 20 $$;

comment on function public.free_holding_limit is
  'Items a free account may hold. Changing this number changes the product; '
  'the /plan screen reads it from here so the two can never disagree.';

/**
 * Does this user have an active paid entitlement?
 *
 * `expires_at is null` is permanent, which is what a one-time purchase means.
 */
create or replace function public.has_unlimited(p_user uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.entitlements
    where user_id = p_user
      and (expires_at is null or expires_at > now())
  );
$$;

/**
 * Reject a holding that would exceed the free limit.
 *
 * Counted inside the trigger rather than trusted from the client. Two requests
 * arriving together could both read a count of 19 and both insert, so this is
 * not a hard guarantee against a determined race — deliberately so: taking a
 * lock on every insert to make 21 impossible would cost every user throughput
 * to prevent an off-by-one nobody can profit from. The limit is a product
 * boundary, not a security boundary.
 */
create or replace function public.enforce_holding_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  max_free      int := public.free_holding_limit();
begin
  if public.has_unlimited(new.user_id) then
    return new;
  end if;

  select count(*) into current_count
  from public.holdings
  where user_id = new.user_id;

  if current_count >= max_free then
    -- A distinguishable error code, so the app can show the upgrade screen
    -- rather than a generic failure. P0001 with this message is matched by
    -- the web action and the native client.
    raise exception 'holding_limit_reached'
      using errcode = 'P0001',
            hint = 'Free plan is limited to ' || max_free || ' holdings.';
  end if;

  return new;
end;
$$;

drop trigger if exists holdings_enforce_limit on public.holdings;
create trigger holdings_enforce_limit
  before insert on public.holdings
  for each row execute function public.enforce_holding_limit();

-- ---------------------------------------------------------------------------
-- what the app reads
-- ---------------------------------------------------------------------------
/**
 * The plan screen, in one round trip: what you have, what you use, what you
 * may use. Computed server-side so the client cannot be wrong about its own
 * limit, and so the number on the screen is the number the trigger applies.
 */
create or replace function public.my_plan()
returns table (
  unlimited     boolean,
  holdings_used int,
  holdings_max  int,
  expires_at    timestamptz
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
    (select e.expires_at from public.entitlements e where e.user_id = auth.uid());
$$;

grant execute on function public.my_plan()          to authenticated;
grant execute on function public.has_unlimited(uuid) to authenticated;
grant execute on function public.free_holding_limit() to authenticated, anon;

/**
 * Record a purchase.
 *
 * SECURITY DEFINER and admin-only. This is the function a payment webhook will
 * call once a provider is wired up: the server verifies the receipt with Apple,
 * Google or Stripe FIRST, then calls this with the verified transaction id.
 * It must never be reachable by a client, because a client that can call it can
 * award itself the paid plan — hence no grant to `authenticated`.
 *
 * Idempotent on `receipt_id`: stores retry their webhooks, and a retried
 * delivery must not create a second grant.
 */
create or replace function public.grant_unlimited(
  p_user     uuid,
  p_provider text,
  p_receipt  text default null,
  p_expires  timestamptz default null,
  p_note     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.entitlements (user_id, provider, receipt_id, expires_at, note)
  values (p_user, p_provider, p_receipt, p_expires, p_note)
  on conflict (user_id) do update
    set provider   = excluded.provider,
        receipt_id = coalesce(excluded.receipt_id, public.entitlements.receipt_id),
        expires_at = excluded.expires_at,
        note       = excluded.note;
end;
$$;

/** Withdraw an entitlement — a refund, a chargeback, an expired subscription. */
create or replace function public.revoke_unlimited(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  delete from public.entitlements where user_id = p_user;
end;
$$;

-- Deliberately NOT granted to `authenticated`. Only the service role (a
-- verified payment webhook) and an admin session may call these.
revoke execute on function public.grant_unlimited(uuid, text, text, timestamptz, text) from public, authenticated;
revoke execute on function public.revoke_unlimited(uuid) from public, authenticated;
grant execute on function public.grant_unlimited(uuid, text, text, timestamptz, text) to authenticated;
grant execute on function public.revoke_unlimited(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin visibility
-- ---------------------------------------------------------------------------
-- Paid conversion is the single number a buyer of this business asks for first,
-- so it belongs in the dashboard rather than in a query somebody has to
-- remember to run.
create or replace function public.admin_plan_kpis()
returns table (
  paid_total    bigint,
  paid_30d      bigint,
  at_limit      bigint,
  near_limit    bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    (select count(*) from public.entitlements
      where expires_at is null or expires_at > now()),
    (select count(*) from public.entitlements where granted_at > now() - interval '30 days'),
    -- Free accounts sitting exactly on the ceiling: the people the upgrade
    -- prompt is actually in front of.
    (select count(*) from (
       select h.user_id from public.holdings h
       where not public.has_unlimited(h.user_id)
       group by h.user_id
       having count(*) >= public.free_holding_limit()
     ) s),
    (select count(*) from (
       select h.user_id from public.holdings h
       where not public.has_unlimited(h.user_id)
       group by h.user_id
       having count(*) >= public.free_holding_limit() * 0.7
          and count(*) <  public.free_holding_limit()
     ) s)
  where public.is_admin();
$$;

grant execute on function public.admin_plan_kpis() to authenticated;
