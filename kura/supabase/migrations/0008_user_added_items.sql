-- KURA — user-added catalogue items, a car category, and bilingual search.
--
-- WHY THIS EXISTS
-- The seed catalogue (0002) is ~70 fixed rows. A user whose bag, watch or car
-- is not one of them had no way to hold it at all — Browse could only ever
-- show what an admin had already typed in. This migration lets any signed-in
-- user extend the catalogue themselves.
--
-- WHY A FUNCTION, NOT AN INSERT POLICY
-- market_items has no authenticated-write policy on purpose (0001): the
-- catalogue is public reference data, and a bare INSERT policy would let a
-- caller set current_price or data_confidence directly, forging a market
-- figure. A SECURITY DEFINER function (same pattern as admin_set_price in
-- 0003) is the one privileged path, and it only ever sets the fields a new,
-- unpriced item legitimately has — never a price.

-- ---------------------------------------------------------------------------
-- car joins the category list. A9 §7 covers why: eBay Motors listings are the
-- one free, working source, and they answer this category exactly the way
-- Browse already answers watches and sneakers.
-- ---------------------------------------------------------------------------
alter table public.market_items
  drop constraint if exists market_items_category_check;

alter table public.market_items
  add constraint market_items_category_check
  check (category in ('pokemon','tcg','watch','bag','sneaker','car'));

-- ---------------------------------------------------------------------------
-- created_by — who added this row, when it was a user rather than the seed.
-- `on delete set null` rather than cascade: the item is shared catalogue data
-- the moment someone else holds it too, so deleting the creator's account must
-- not delete an item other people's portfolios point at.
-- ---------------------------------------------------------------------------
alter table public.market_items
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------------
-- aliases — alternate names a search should also match: a Japanese brand name
-- against an English catalogue entry ("エルメス" against "Hermès"), a
-- transliteration, an old model name. Free text, space-separated, searched
-- with the same ILIKE the name/detail columns already use.
-- ---------------------------------------------------------------------------
alter table public.market_items
  add column if not exists aliases text;

comment on column public.market_items.aliases is
  'Space-separated alternate names (other languages, transliterations) that a search should also match against.';

-- ---------------------------------------------------------------------------
-- identifier is unique in practice already (every seed row uses a distinct
-- model code), but nothing enforced it. Making that real is what lets a seed
-- migration use `on conflict (identifier) do nothing` and become genuinely
-- safe to paste twice — every migration file up to and including 0007 only
-- had the toothless conflict-target-free form, which silently duplicated
-- rows on a second run instead of skipping them.
-- ---------------------------------------------------------------------------
create unique index if not exists market_items_identifier_key
  on public.market_items (identifier)
  where identifier is not null;

-- ---------------------------------------------------------------------------
-- create_market_item — add a catalogue row as the signed-in user.
--
-- Each category is routed to whichever free source answers it, the same
-- mapping the seed catalogue already uses. A category with no reliable free
-- source (none currently) would fall back to 'curated' — priced only by the
-- self-reported valuation from migration 0007, which is exactly what a
-- generic-catalogue miss degrades to and not a dead end.
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

  if p_category not in ('pokemon','tcg','watch','bag','sneaker','car') then
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
  end case;

  insert into public.market_items
    (category, name, detail, identifier, search_query, source_type, currency, created_by)
  values
    (p_category, v_name, v_detail, v_identifier, v_search_query, v_source_type, v_currency, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_market_item(text, text, text, text) from public;
grant execute on function public.create_market_item(text, text, text, text) to authenticated;
