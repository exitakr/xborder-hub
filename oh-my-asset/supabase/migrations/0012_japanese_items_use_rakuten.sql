-- Oh My Asset — route Japanese-named items to Rakuten, and anchor the search
-- to the category it belongs to.
--
-- TWO PROBLEMS WITH THE PREVIOUS `create_market_item`.
--
-- 1. IT SENT JAPANESE TEXT TO eBay. A user typing 「ボッテガヴェネタ バッグ」
--    got that string handed to eBay Browse, a US marketplace indexing English
--    titles. It matches almost nothing, so the item silently resolved to
--    "insufficient" forever. Rakuten indexes Japanese titles and is the right
--    destination for a Japanese-language entry — the same reason migration 0010
--    rewrote the seeded bags into Japanese before pointing them there.
--
-- 2. IT SEARCHED THE BRAND, NOT THE PRODUCT. `name || ' ' || detail` for a bag
--    entered as "Bottega Veneta" searches every Bottega Veneta listing there
--    is: keychains, wallets, shoes, and bags. A median over that describes no
--    product at all. Appending the category term constrains the result set to
--    the kind of thing the item actually is.
--
-- The dispersion guard added alongside this migration is the backstop for when
-- neither is enough: if the surviving listings still disagree too much to be
-- one product, no price is published rather than an indefensible one.

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
  v_terms text;
  -- Hiragana, katakana, or CJK anywhere in what the user typed. A Japanese
  -- entry is a statement about which market they are in, not only which
  -- language they typed in.
  v_is_japanese boolean := (v_name || ' ' || coalesce(v_detail, '')) ~ '[ぁ-んァ-ヶ一-龠]';
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

  v_terms := btrim(v_name || ' ' || coalesce(v_detail, ''));

  case p_category
    when 'pokemon' then
      if v_is_japanese then
        -- pokemontcg.io indexes the English printings; a Japanese card name is
        -- not something it can answer.
        v_source_type := 'rakuten';
        v_search_query := btrim('ポケモンカード ' || v_terms);
        v_currency := 'JPY';
      else
        v_source_type := 'pokemontcg';
        v_search_query := 'name:"' || v_name || '"';
        v_currency := 'USD';
      end if;

    when 'tcg' then
      if v_is_japanese then
        v_source_type := 'rakuten';
        v_search_query := btrim('トレーディングカード ' || v_terms);
        v_currency := 'JPY';
      else
        -- Scryfall matches on exact name; a card it does not recognise resolves
        -- to "insufficient" on the next refresh rather than an error, and the
        -- item stays available for a self-reported valuation.
        v_source_type := 'scryfall';
        v_search_query := v_name;
        v_currency := 'USD';
      end if;

    -- For everything below, the category term is what stops a brand-name-only
    -- entry from searching that brand's entire product line.
    when 'bag' then
      if v_is_japanese then
        v_source_type := 'rakuten'; v_currency := 'JPY';
        v_search_query := btrim(v_terms || ' バッグ');
      else
        v_source_type := 'ebay'; v_currency := 'USD';
        v_search_query := btrim(v_terms || ' handbag');
      end if;

    when 'watch' then
      if v_is_japanese then
        v_source_type := 'rakuten'; v_currency := 'JPY';
        v_search_query := btrim(v_terms || ' 腕時計');
      else
        v_source_type := 'ebay'; v_currency := 'USD';
        v_search_query := btrim(v_terms || ' watch');
      end if;

    when 'sneaker' then
      if v_is_japanese then
        v_source_type := 'rakuten'; v_currency := 'JPY';
        v_search_query := btrim(v_terms || ' スニーカー');
      else
        v_source_type := 'ebay'; v_currency := 'USD';
        v_search_query := btrim(v_terms || ' sneakers');
      end if;

    when 'car' then
      -- No category term: a model name is already specific, and "car" would
      -- pull in die-cast models and parts listings rather than exclude them.
      if v_is_japanese then
        v_source_type := 'rakuten'; v_currency := 'JPY';
        v_search_query := v_terms;
      else
        v_source_type := 'ebay'; v_currency := 'USD';
        v_search_query := v_terms;
      end if;
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

-- ---------------------------------------------------------------------------
-- Repair items already added under the old rules: Japanese text pointed at
-- eBay, which cannot answer it. Their next refresh will now reach a source
-- that can. Only user-added rows are touched — the seeded catalogue was
-- deliberately routed by 0005 and 0010 and must not be second-guessed here.
-- ---------------------------------------------------------------------------
update public.market_items
   set source_type = 'rakuten',
       currency    = 'JPY',
       -- Re-anchor to the category at the same time, since these rows were
       -- created without a category term.
       search_query = btrim(
         name || ' ' || coalesce(detail, '') || ' ' ||
         case category
           when 'bag'     then 'バッグ'
           when 'watch'   then '腕時計'
           when 'sneaker' then 'スニーカー'
           when 'pokemon' then 'ポケモンカード'
           when 'tcg'     then 'トレーディングカード'
           else ''
         end
       ),
       -- The stale price came from a search that could not have matched. Clear
       -- it rather than leave a figure the new query never produced.
       current_price    = null,
       data_confidence  = null,
       price_updated_at = null
 where created_by is not null
   and (name || ' ' || coalesce(detail, '')) ~ '[ぁ-んァ-ヶ一-龠]'
   and source_type in ('ebay', 'scryfall', 'pokemontcg');
