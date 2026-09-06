-- 0027 — A second marketplace to fall back to, and the query to ask it with.
--
-- THE REPORT
--
-- "I registered a Kelly 25 and there is no price."
--
-- THE CAUSE, WHICH IS NOT A BUG
--
-- Everything worked. 0026 matched the entry to a known model, gave it the
-- checked query 「エルメス ケリー25」, a floor of ¥1,400,000 and a ceiling of
-- ¥12,000,000, and sent it to Rakuten Ichiba. Rakuten then answered honestly:
-- it does not have three Hermès Kelly 25s listed above ¥1,400,000. Rakuten is a
-- shopping mall with a real but shallow luxury-resale presence, and the very
-- top of the Hermès market is not on it — those pieces sell through dealers'
-- own channels and through international marketplaces.
--
-- So the price is missing because the SOURCE is wrong for this item, not
-- because the filters are too strict. Loosening them would not find a Kelly on
-- Rakuten; it would find something else and call it a Kelly, which is the exact
-- failure mode this whole chain of migrations exists to prevent.
--
-- THE FIX: ASK SOMEWHERE ELSE, WITH THE SAME STANDARDS
--
-- eBay has deep Hermès inventory because it is a global market. It was already
-- integrated, already banded, already category-restricted. What was missing was
-- an ENGLISH query to ask it with: `search_query` holds one string, and for a
-- bag routed to Rakuten in 0010 that string is Japanese, which eBay cannot
-- answer. 0026 already stores `query_en` per model; this migration puts it on
-- the item so the cron can reach for it.
--
-- Nothing about the quality gates changes. The fallback carries the same band
-- (converted to the currency eBay quotes in), the same category restriction and
-- the same sample minimum. It is a second question, not an easier one.

alter table public.market_items
  add column if not exists search_query_en text;

comment on column public.market_items.search_query_en is
  'English query for the fallback source. `search_query` is asked of the '
  'item''s primary marketplace and is Japanese for anything routed to Rakuten; '
  'eBay cannot answer that string, so a second one is kept. Null means no '
  'fallback is attempted — see migration 0027.';

-- ---------------------------------------------------------------------------
-- backfill: the models
-- ---------------------------------------------------------------------------
-- Every row whose name matches a known model inherits that model's English
-- query, which was written once and checked.
update public.market_items mi
   set search_query_en = bm.query_en
  from public.brand_models bm
 where mi.search_query_en is null
   and bm.query_en is not null
   and mi.category = bm.category
   and (select id from public.match_brand_model(mi.category, mi.name || ' ' || coalesce(mi.detail, ''))) = bm.id;

-- ---------------------------------------------------------------------------
-- backfill: the seeded catalogue
-- ---------------------------------------------------------------------------
-- These rows were seeded in 0002 and 0009 with English queries and then
-- rewritten into Japanese by 0010 and 0012. The English original is still the
-- right thing to ask eBay, so it is restored here rather than re-derived.
update public.market_items mi
   set search_query_en = v.q
  from (values
    ('BIRKIN-30',          'Hermes Birkin 30 Togo'),
    ('BIRKIN-25',          'Hermes Birkin 25 Togo'),
    ('KELLY-28',           'Hermes Kelly 28 Epsom'),
    ('CONSTANCE-24',       'Hermes Constance 24'),
    ('EVELYNE-PM',         'Hermes Evelyne PM'),
    ('PICOTIN-18',         'Hermes Picotin Lock 18'),
    ('CHANEL-CF-M',        'Chanel Classic Flap medium caviar'),
    ('CHANEL-255-226',     'Chanel 2.55 Reissue 226'),
    ('CHANEL-BOY-M',       'Chanel Boy bag medium calfskin'),
    ('CHANEL-19-M',        'Chanel 19 bag medium lambskin'),
    ('CHANEL-WOC',         'Chanel wallet on chain lambskin'),
    ('LV-NEVERFULL-MM',    'Louis Vuitton Neverfull MM Monogram'),
    ('LV-SPEEDY-25',       'Louis Vuitton Speedy 25 Damier'),
    ('LV-ALMA-BB',         'Louis Vuitton Alma BB Monogram'),
    ('LV-CAPUCINES-PM',    'Louis Vuitton Capucines PM'),
    ('LV-POCHETTE-METIS',  'Louis Vuitton Pochette Metis Monogram'),
    ('GUCCI-JACKIE-S',     'Gucci Jackie 1961 small'),
    ('GUCCI-MARMONT-M',    'Gucci GG Marmont medium matelasse'),
    ('DIOR-SADDLE-M',      'Dior Saddle bag medium calfskin'),
    ('DIOR-LADY-M',        'Lady Dior medium cannage'),
    ('CELINE-TRIOMPHE-M',  'Celine Triomphe bag medium'),
    ('BV-CASSETTE',        'Bottega Veneta Cassette bag'),
    ('LOEWE-PUZZLE-S',     'Loewe Puzzle bag small'),
    ('FENDI-BAGUETTE-M',   'Fendi Baguette bag medium'),
    ('PRADA-2005',         'Prada Re-Edition 2005 nylon bag'),
    ('GOYARD-STL-PM',      'Goyard Saint Louis PM')
  ) as v(identifier, q)
 where mi.identifier = v.identifier
   and mi.search_query_en is null;

-- ---------------------------------------------------------------------------
-- new items carry both from the start
-- ---------------------------------------------------------------------------
/**
 * Identical to 0026 except that a matched model now supplies BOTH queries.
 *
 * The primary source is still chosen by the language the person typed in —
 * that is a statement about which market they are in, not only which keyboard
 * they used — but the other language is kept so the fallback has something to
 * ask with.
 */
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
  v_search_query_en text;
  v_currency text;
  v_name text := btrim(coalesce(p_name, ''));
  v_detail text := nullif(btrim(coalesce(p_detail, '')), '');
  v_identifier text := nullif(btrim(coalesce(p_identifier, '')), '');
  v_terms text;
  v_model public.brand_models;
  v_min numeric;
  v_max numeric;
  v_rate numeric;
  v_is_japanese boolean := (v_name || ' ' || coalesce(v_detail, '')) ~ '[ぁ-んァ-ヶ一-龠]';
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

  v_terms := btrim(v_name || ' ' || coalesce(v_detail, ''));

  if p_category in ('watch','bag','sneaker','car')
     and public.is_brand_only(p_category, v_terms) then
    raise exception 'item_needs_model';
  end if;

  v_model := public.match_brand_model(p_category, v_terms);

  if v_model.id is not null then
    v_search_query_en := v_model.query_en;

    if v_is_japanese and v_model.query_ja is not null then
      v_source_type := 'rakuten'; v_currency := 'JPY';
      v_search_query := v_model.query_ja;
    elsif v_model.query_en is not null then
      v_source_type := 'ebay'; v_currency := 'USD';
      v_search_query := v_model.query_en;
    else
      v_source_type := 'rakuten'; v_currency := 'JPY';
      v_search_query := v_model.query_ja;
    end if;

    if v_currency = 'JPY' then
      v_min := v_model.min_jpy;
      v_max := v_model.max_jpy;
    else
      select rate into v_rate from public.fx_rates where currency = v_currency;
      if v_rate is not null and v_rate > 0 then
        v_min := round(v_model.min_jpy * v_rate, 2);
        v_max := round(v_model.max_jpy * v_rate, 2);
      end if;
    end if;
  else
    case p_category
      when 'pokemon' then
        if v_is_japanese then
          v_source_type := 'rakuten'; v_currency := 'JPY';
          v_search_query := btrim('ポケモンカード ' || v_terms);
        else
          v_source_type := 'pokemontcg'; v_currency := 'USD';
          v_search_query := 'name:"' || v_name || '"';
        end if;
      when 'tcg' then
        if v_is_japanese then
          v_source_type := 'rakuten'; v_currency := 'JPY';
          v_search_query := btrim('トレーディングカード ' || v_terms);
        else
          v_source_type := 'scryfall'; v_currency := 'USD';
          v_search_query := v_name;
        end if;
      when 'bag' then
        if v_is_japanese then
          v_source_type := 'rakuten'; v_currency := 'JPY';
          v_search_query := btrim(v_terms || ' バッグ');
        else
          v_source_type := 'ebay'; v_currency := 'USD';
          v_search_query := btrim(v_terms || ' handbag');
          v_search_query_en := v_search_query;
        end if;
      when 'watch' then
        if v_is_japanese then
          v_source_type := 'rakuten'; v_currency := 'JPY';
          v_search_query := btrim(v_terms || ' 腕時計');
        else
          v_source_type := 'ebay'; v_currency := 'USD';
          v_search_query := btrim(v_terms || ' watch');
          v_search_query_en := v_search_query;
        end if;
      when 'sneaker' then
        if v_is_japanese then
          v_source_type := 'rakuten'; v_currency := 'JPY';
          v_search_query := btrim(v_terms || ' スニーカー');
        else
          v_source_type := 'ebay'; v_currency := 'USD';
          v_search_query := btrim(v_terms || ' sneakers');
          v_search_query_en := v_search_query;
        end if;
      when 'car' then
        if v_is_japanese then
          v_source_type := 'rakuten'; v_currency := 'JPY';
        else
          v_source_type := 'ebay'; v_currency := 'USD';
          v_search_query_en := v_terms;
        end if;
        v_search_query := v_terms;
      else
        v_source_type := 'curated'; v_currency := 'JPY';
        v_search_query := null;
    end case;
  end if;

  insert into public.market_items
    (category, name, detail, identifier, search_query, search_query_en,
     source_type, currency, min_price, max_price, created_by)
  values
    (p_category, v_name, v_detail, v_identifier, v_search_query, v_search_query_en,
     v_source_type, v_currency, v_min, v_max, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_market_item(text, text, text, text) from public;
grant execute on function public.create_market_item(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- the review queue can edit it
-- ---------------------------------------------------------------------------
-- An admin looking at an item with no price needs to be able to fix the
-- fallback query, not only the primary one — that is now half of why an item
-- might be unpriced.
drop function if exists public.admin_approve_item(uuid, text, text, text, text, text, text, numeric);

create or replace function public.admin_approve_item(
  p_id              uuid,
  p_name            text default null,
  p_detail          text default null,
  p_identifier      text default null,
  p_search_query    text default null,
  p_category        text default null,
  p_aliases         text default null,
  p_min_price       numeric default null,
  p_max_price       numeric default null,
  p_search_query_en text default null
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
     set name            = coalesce(nullif(btrim(p_name), ''), name),
         detail          = coalesce(nullif(btrim(p_detail), ''), detail),
         identifier      = coalesce(nullif(btrim(p_identifier), ''), identifier),
         search_query    = coalesce(nullif(btrim(p_search_query), ''), search_query),
         search_query_en = coalesce(nullif(btrim(p_search_query_en), ''), search_query_en),
         category        = coalesce(nullif(btrim(p_category), ''), category),
         aliases         = coalesce(nullif(btrim(p_aliases), ''), aliases),
         min_price       = coalesce(p_min_price, min_price),
         max_price       = coalesce(p_max_price, max_price),
         approved_at     = now(),
         approved_by     = auth.uid()
   where id = p_id;

  perform public.apply_brand_rules(p_id);
end;
$$;

grant execute on function public.admin_approve_item(uuid, text, text, text, text, text, text, numeric, numeric, text) to authenticated;

-- The queue has to return the field it can now edit.
drop function if exists public.admin_pending_items(int);

create or replace function public.admin_pending_items(p_limit int default 200)
returns table (
  id              uuid,
  category        text,
  name            text,
  detail          text,
  identifier      text,
  search_query    text,
  search_query_en text,
  source_type     text,
  aliases         text,
  min_price       numeric,
  max_price       numeric,
  current_price   numeric,
  currency        text,
  source_url      text,
  holders         bigint,
  created_at      timestamptz,
  created_by      uuid
)
language sql
security definer
stable
set search_path = public
as $$
  select
    mi.id, mi.category, mi.name, mi.detail, mi.identifier, mi.search_query,
    mi.search_query_en, mi.source_type, mi.aliases, mi.min_price, mi.max_price,
    mi.current_price, mi.currency, mi.price_debug ->> 'webUrl',
    (select count(*) from public.holdings h where h.market_item_id = mi.id),
    mi.created_at, mi.created_by
  from public.market_items mi
  where public.is_admin()
    and mi.approved_at is null
  order by mi.created_at desc
  limit p_limit;
$$;

grant execute on function public.admin_pending_items(int) to authenticated;
