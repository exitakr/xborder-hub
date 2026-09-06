-- Oh My Asset — transaction integrity at the database level.
--
-- WHY THIS EXISTS
-- The web app validates trades in a Server Action, but the native app writes to
-- PostgREST directly under RLS. RLS answers "may this user touch this row?", not
-- "does this row make sense?". Without the trigger below, a sell larger than the
-- position would be accepted from mobile and drive quantity negative — which
-- SPEC §6.4 forbids and which silently corrupts every downstream figure.
--
-- Enforcing it here means the rule holds for every client, present and future.

create or replace function public.enforce_position_not_negative()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  net int;
begin
  -- Net position for this holding, counting the row being written and ignoring
  -- the pre-edit version of the row on UPDATE.
  select coalesce(sum(case when t.type = 'buy' then t.quantity else -t.quantity end), 0)
    into net
  from public.transactions t
  where t.holding_id = new.holding_id
    and (TG_OP <> 'UPDATE' or t.id <> new.id);

  net := net + (case when new.type = 'buy' then new.quantity else -new.quantity end);

  if net < 0 then
    -- The message is matched by the clients to show a specific error.
    raise exception 'oversell: quantity would become negative';
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_position_guard on public.transactions;
create trigger transactions_position_guard
  before insert or update on public.transactions
  for each row execute function public.enforce_position_not_negative();

-- A deleted buy can also drive a position negative (delete the purchase, keep
-- the sale), so the same rule is applied on delete.
create or replace function public.enforce_position_not_negative_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  net int;
begin
  select coalesce(sum(case when t.type = 'buy' then t.quantity else -t.quantity end), 0)
    into net
  from public.transactions t
  where t.holding_id = old.holding_id
    and t.id <> old.id;

  if net < 0 then
    raise exception 'oversell: quantity would become negative';
  end if;

  return old;
end;
$$;

drop trigger if exists transactions_position_guard_delete on public.transactions;
create trigger transactions_position_guard_delete
  before delete on public.transactions
  for each row execute function public.enforce_position_not_negative_on_delete();

-- The 0001 future-date CHECK allowed "tomorrow" to absorb timezone skew between
-- the client and the database. A user in Tokyo (UTC+9) legitimately sees a date
-- ahead of UTC, so the tolerance stays, but it is documented rather than
-- accidental. Anything beyond that is rejected.
