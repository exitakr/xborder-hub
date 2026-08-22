-- 0018 — An "other" category.
--
-- The six named categories were a bet on what people collect, and a bet like
-- that is always wrong at the edges: coins, art, whisky, instruments, militaria.
-- Until now someone holding one of those had to file it under a category it is
-- not, which corrupts the category breakdown for everyone, or give up.
--
-- "Other" costs nothing and rescues that user. It carries no price source by
-- design — there is no feed that could price "anything" — so these items are
-- valued by the holder's own figure, which is exactly the path migration 0007
-- built. What it buys is the difference between an app that cannot hold your
-- collection and one that can.

alter table public.market_items
  drop constraint if exists market_items_category_check;

alter table public.market_items
  add constraint market_items_category_check
  check (category in ('pokemon','tcg','watch','bag','sneaker','car','other'));

-- `create_market_item` validates the category against the same list. Left as it
-- is if it already reads the constraint; re-stated here so the two cannot drift.
comment on constraint market_items_category_check on public.market_items is
  'Keep in sync with CATEGORIES in packages/core/src/types.ts. "other" is '
  'deliberately unpriceable: no source can quote "anything", so those items '
  'rely on the holder''s own valuation (migration 0007).';

-- ---------------------------------------------------------------------------
-- create_market_item, re-stated with 'other' accepted.
-- ---------------------------------------------------------------------------
create or replace function public.create_market_item(
  p_category   text,
  p_name       text,
  p_detail     text default null,
  p_identifier text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_source_type text;
  v_search_query text;
  v_currency text;
  v_name text := btrim(coalesce(p_name, ''));
  v_detail text := nullif(btrim(coalesce(p_detail, '')), '');
  v_identifier text := nullif(btrim(coalesce(p_identifier, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_category not in ('pokemon','tcg','watch','bag','sneaker','car','other') then
    raise exception 'invalid category';
  end if;

  if length(v_name) = 0 or length(v_name) > 120 then
    raise exception 'invalid name';
  end if;

  case p_category
    when 'pokemon' then
      v_source_type := 'pokemontcg';
      v_search_query := 'name:"' || v_name || '"';
      v_currency := 'USD';
    when 'tcg' then
      -- Scryfall matches on exact name; a card it does not recognise (a
      -- Yu-Gi-Oh card, a name typo) resolves to "insufficient" on the next
      -- refresh rather than an error, and the item stays available for a
      -- self-reported valuation.
      v_source_type := 'scryfall';
      v_search_query := v_name;
      v_currency := 'USD';
    when 'watch', 'sneaker', 'car' then
      v_source_type := 'ebay';
      v_search_query := btrim(v_name || ' ' || coalesce(v_detail, ''));
      v_currency := 'USD';
    when 'bag' then
      v_source_type := 'ebay';
      v_search_query := btrim(v_name || ' ' || coalesce(v_detail, ''));
      v_currency := 'USD';
    when 'other' then
      -- No feed can price "anything", so this one is deliberately never
      -- queried. `curated` with a null query means the daily refresh skips it
      -- entirely rather than burning a request on a search that cannot match,
      -- and the item is valued by its holder (migration 0007).
      v_source_type := 'curated';
      v_search_query := null;
      v_currency := 'JPY';
  end case;

  insert into public.market_items
    (category, name, detail, identifier, search_query, source_type, currency, created_by)
  values
    (p_category, v_name, v_detail, v_identifier, v_search_query, v_source_type, v_currency, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;
