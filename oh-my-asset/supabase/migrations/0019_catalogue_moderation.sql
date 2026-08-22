-- 0019 — User-added items are private until an admin approves them.
--
-- THE PROBLEM
--
-- Anyone can add a catalogue entry, and every entry immediately became part of
-- the catalogue everyone else searches. That is how a shared reference table
-- fills up with "rolex", "ROLEX サブマリーナ", "Submariner 116610", "腕時計" —
-- four rows for one watch, none of them priceable, all of them in everybody's
-- search results. The catalogue is the product; letting it decay is the fastest
-- way to make the app look amateur.
--
-- THE RULE
--
-- An item a user creates is visible to that user immediately and to nobody
-- else. It becomes public when an admin approves it, which is also the moment
-- to fix the name. Seeded items are public by construction.
--
-- What this deliberately does NOT do is block anybody: the person who added it
-- sees it, holds it, values it and charts it from the second they create it.
-- Approval decides whether it joins the shared catalogue, not whether the user
-- can use their own app.

alter table public.market_items
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

-- Everything that predates this migration was already public; grandfather it in
-- rather than hiding the seeded catalogue behind an empty review queue.
update public.market_items
   set approved_at = coalesce(approved_at, created_at, now())
 where approved_at is null
   and created_by is null;

-- User-created rows stay pending. Explicit rather than implied, so re-running
-- this file cannot quietly approve a queue somebody is part-way through.
create index if not exists market_items_pending_idx
  on public.market_items (created_at desc)
  where approved_at is null;

comment on column public.market_items.approved_at is
  'When an admin published this row to the shared catalogue. Null = visible '
  'only to its creator. Seeded rows are approved by migration 0019.';

-- ---------------------------------------------------------------------------
-- visibility
-- ---------------------------------------------------------------------------
-- The read policy is the enforcement. Filtering in the app would leave the row
-- reachable from the native client and from any anon key holder with curl.
-- The 0001 policy is named "public read items" and grants `using (true)`.
-- Dropping it by its real name matters: RLS policies are OR-ed, so leaving it
-- behind would keep every pending row world-readable and the new policy would
-- have no effect whatsoever.
drop policy if exists "public read items" on public.market_items;
drop policy if exists "approved items are public" on public.market_items;

create policy "approved items are public" on public.market_items
  for select using (
    approved_at is not null
    or created_by = auth.uid()
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- the review queue
-- ---------------------------------------------------------------------------
/**
 * Items waiting on a decision, newest first, with the holder count so an
 * obviously popular addition can be approved without thinking about it.
 */
create or replace function public.admin_pending_items(p_limit int default 200)
returns table (
  id            uuid,
  category      text,
  name          text,
  detail        text,
  identifier    text,
  search_query  text,
  source_type   text,
  current_price numeric,
  currency      text,
  holders       bigint,
  created_at    timestamptz,
  created_by    uuid
)
language sql
security definer
stable
set search_path = public
as $$
  select
    mi.id, mi.category, mi.name, mi.detail, mi.identifier, mi.search_query,
    mi.source_type, mi.current_price, mi.currency,
    (select count(*) from public.holdings h where h.market_item_id = mi.id),
    mi.created_at, mi.created_by
  from public.market_items mi
  where public.is_admin()
    and mi.approved_at is null
  order by mi.created_at desc
  limit p_limit;
$$;

grant execute on function public.admin_pending_items(int) to authenticated;

/**
 * Approve an item, correcting it on the way through.
 *
 * Approval and editing are one call on purpose. The reason a row is in this
 * queue is usually that it is named badly, and a workflow that made you approve
 * first and tidy afterwards would mean the untidy version is what goes live.
 * Passing null for a field leaves it unchanged.
 *
 * Re-approving an already-approved row is allowed and simply re-edits it —
 * useful for fixing a name after the fact.
 */
create or replace function public.admin_approve_item(
  p_id           uuid,
  p_name         text default null,
  p_detail       text default null,
  p_identifier   text default null,
  p_search_query text default null,
  p_category     text default null
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

  update public.market_items
     set name         = coalesce(nullif(btrim(p_name), ''), name),
         detail       = coalesce(nullif(btrim(p_detail), ''), detail),
         identifier   = coalesce(nullif(btrim(p_identifier), ''), identifier),
         search_query = coalesce(nullif(btrim(p_search_query), ''), search_query),
         category     = coalesce(nullif(btrim(p_category), ''), category),
         approved_at  = now(),
         approved_by  = auth.uid()
   where id = p_id;
end;
$$;

grant execute on function public.admin_approve_item(uuid, text, text, text, text, text) to authenticated;

/**
 * Reject an item: it stays private to its creator forever.
 *
 * Deliberately not a delete. Somebody is holding this row, with trades and
 * possibly a photograph attached — removing it would destroy their records to
 * tidy our catalogue, which is the wrong trade every time. Rejection only
 * withholds it from everyone else.
 */
create or replace function public.admin_reject_item(p_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.market_items
     set approved_at = null,
         approved_by = auth.uid(),
         -- Recorded on the row so a second reviewer sees it was looked at.
         detail = coalesce(detail, p_note)
   where id = p_id;
end;
$$;

grant execute on function public.admin_reject_item(uuid, text) to authenticated;
