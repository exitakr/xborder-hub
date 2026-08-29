-- 0024 — A plausible band for every catalogue item, not a floor for some.
--
-- THE REPORT
--
-- "Bottega Veneta Cassette, Chanel 19 Medium, Celine Triomphe, every Chanel
--  and Fendi bag, Patek Philippe Nautilus — all showing a few thousand to a
--  few tens of thousands of yen."
--
-- FOUR CAUSES, STACKED
--
-- 1. Migration 0013 set floors and never withdrew the prices already published
--    under no floor. A floor only gates the NEXT fetch, so every wrong number
--    that predates it simply stayed on screen. 0020 and 0023 each end with a
--    withdraw for exactly this reason; 0013 did not.
--
-- 2. Fendi is not in brand_rules at all. Chanel is (¥200,000, bag), but any
--    Fendi item a user adds has no floor whatsoever — which is why "every
--    Fendi bag" behaves worse than the seeded one.
--
-- 3. The watches were never given floors by 0013 — it covered bags only — and
--    brand_rules did not exist until 0020. Patek Philippe Nautilus therefore
--    had NO floor, and an eBay search for "Patek Philippe 5711/1A" returns
--    straps, boxes, dials, service manuals and "Nautilus-style" homages. A
--    median over that is tens of thousands of yen, correctly computed, of
--    nothing anyone owns.
--
-- 4. Where floors did exist they were calibrated at "roughly a third of the
--    cheapest genuine example", which was the right instinct under the OLD
--    mechanism and is wrong under the new one. ¥80,000 for a Cassette, a
--    Triomphe and a Baguette lets everything in the ¥80,000–150,000 band
--    through, and that band is entirely wallets, pouches and card cases.
--
-- WHY THE CALIBRATION CHANGES, NOT JUST THE NUMBERS
--
-- This is the part that matters for every future floor.
--
-- Before 0023 a floor could only REJECT a finished answer, so raising it made
-- "データ不足" more likely — the item lost its price entirely. A cautious, low
-- floor was therefore correct: it caught the grossest errors without emptying
-- the catalogue.
--
-- Since 0023 the floor goes INTO the query. Raising it no longer discards the
-- answer; it removes the accessories from the sample the median is taken over.
-- A realistic floor now produces a BETTER price rather than no price, which
-- inverts the trade-off completely. So these floors are set near half of a
-- genuine worn example rather than a third of the cheapest, and the seeded
-- catalogue gets per-model figures instead of one number per brand.
--
-- And a ceiling, for the mirror of the same bug: "シャネル 19" matches Classic
-- Flap listings at three times the price, and a portfolio total inflated 3x is
-- as wrong as one deflated 10x. Ceilings are deliberately loose — roughly
-- three times a typical example — because a tight one hides the pristine
-- full-set piece that is genuinely worth it.

-- ---------------------------------------------------------------------------
-- the ceiling column
-- ---------------------------------------------------------------------------
alter table public.market_items
  add column if not exists max_price numeric
  check (max_price is null or max_price > 0);

comment on column public.market_items.max_price is
  'Highest plausible price for this item, in the item''s own currency. Paired '
  'with min_price to form a band: a result outside it matched something other '
  'than this item. Loose by design — see migration 0024.';

alter table public.brand_rules
  add column if not exists max_price numeric
  check (max_price is null or max_price > 0);

comment on column public.brand_rules.max_price is
  'Brand-level ceiling in JPY, converted to the item currency by '
  'apply_brand_rules. Covers user-added items, which have no per-model band.';

-- ---------------------------------------------------------------------------
-- per-model bands for the seeded catalogue
-- ---------------------------------------------------------------------------
-- Written in JPY and converted per item, because `min_price` carries no
-- currency of its own and half this catalogue is quoted in USD by eBay. Doing
-- the conversion here rather than by hand is not a convenience: sixty numbers
-- converted by hand at a guessed rate is sixty chances to write a floor in the
-- wrong unit, and a floor in the wrong unit silently suppresses every real
-- price an item will ever have.
--
-- An item whose currency has no fx rate is left alone rather than given a band
-- in the wrong unit. No band is recoverable on the next run; a wrong one is not.
with band(identifier, min_jpy, max_jpy) as (values
  -- watches ---------------------------------------------------------------
  ('126610LN',                900000::numeric,   5000000::numeric),
  ('124060',                  800000,            4500000),
  ('126710BLRO',             1200000,            8000000),
  ('126500LN',               2000000,           15000000),
  ('126334',                  700000,            4000000),
  ('124270',                  600000,            3500000),
  ('310.30.42.50.01.001',     350000,            2500000),
  ('210.30.42.20.01.001',     300000,            2000000),
  ('79030N',                  250000,            1500000),
  ('SBGA211',                 300000,            2000000),
  ('SRPE93',                   30000,             250000),
  ('WSSA0029',                400000,            2500000),
  ('15500ST',                2000000,           15000000),
  -- The item that prompted this. A 5711/1A has not traded below eight figures
  -- in years; the floor is set at a third of that and still excludes every
  -- strap, box and homage the search was returning.
  ('5711/1A',                5000000,           50000000),

  -- sneakers --------------------------------------------------------------
  ('DZ5485-612',               18000,             200000),
  ('555088-610',               20000,             250000),
  ('CU1110-010',               45000,             500000),
  ('DD1391-100',                7000,              80000),
  ('CT5053-001',               80000,             900000),
  ('CP9654',                   15000,             200000),
  ('GW1229',                   18000,             200000),
  ('B75806',                    6000,              70000),
  ('M990GL6',                  12000,             120000),
  ('BB550WT1',                  5000,              60000),
  ('CW2288-111',                5000,              60000),
  ('1201A161',                  6000,              70000),

  -- trading cards ---------------------------------------------------------
  -- Bands here are wide on purpose. A PSA 10 and a PSA 5 of the same card can
  -- differ by two orders of magnitude, so the band cannot bracket the market —
  -- it only has to exclude the played copy and the proxy.
  ('MTG-ULT-BL',              800000,           30000000),
  ('MTG-ULT-MS',              300000,           12000000),
  ('MTG-FUT-TG',                3000,              60000),
  ('MTG-MH2-RG',                2000,              40000),
  ('YGO-LOB-001',             100000,            8000000),
  ('YGO-LOB-005',              60000,            5000000),
  ('YGO-LOB-124',              50000,            4000000),
  ('YGO-LOB-070',              40000,            3000000),

  -- pokémon ---------------------------------------------------------------
  ('BS-004-PSA9',              60000,            4000000),
  ('BS-004-PSA10',            500000,           40000000),
  ('BS-002-PSA9',              20000,            1500000),
  ('BS-015-PSA9',              15000,            1200000),
  ('PROMO-ILL',              3000000,          500000000),
  ('EVS-215',                  40000,            2000000),
  ('EVS-218',                  15000,            1000000),
  ('LOR-186',                  10000,             600000),
  ('SV-JP-RIZA',                8000,             200000),
  ('JP-OLD-MEW',               10000,             500000),

  -- bags ------------------------------------------------------------------
  ('BIRKIN-30',              1500000,           12000000),
  ('BIRKIN-25',              1800000,           15000000),
  ('KELLY-28',               1200000,           10000000),
  ('CONSTANCE-24',           1000000,            8000000),
  ('EVELYNE-PM',              200000,            1500000),
  ('PICOTIN-18',              180000,            1500000),
  ('CHANEL-CF-M',             700000,            5000000),
  ('CHANEL-255-226',          600000,            4500000),
  ('CHANEL-BOY-M',            400000,            3000000),
  ('CHANEL-19-M',             400000,            3000000),
  ('CHANEL-WOC',              250000,            2000000),
  ('LV-NEVERFULL-MM',         100000,             800000),
  ('LV-SPEEDY-25',             60000,             500000),
  ('LV-ALMA-BB',               80000,             700000),
  ('LV-CAPUCINES-PM',         250000,            2000000),
  ('LV-POCHETTE-METIS',       120000,            1000000),
  ('GUCCI-JACKIE-S',          120000,             900000),
  ('GUCCI-MARMONT-M',          80000,             700000),
  ('DIOR-SADDLE-M',           160000,            1300000),
  ('DIOR-LADY-M',             250000,            2000000),
  ('CELINE-TRIOMPHE-M',       180000,            1500000),
  ('BV-CASSETTE',             130000,            1000000),
  ('LOEWE-PUZZLE-S',          100000,             800000),
  ('FENDI-BAGUETTE-M',        140000,            1200000),
  ('PRADA-2005',               50000,             450000),
  ('GOYARD-STL-PM',           150000,            1200000),

  -- cars ------------------------------------------------------------------
  ('PORSCHE-911-992',        6000000,           40000000),
  ('PORSCHE-718-CAYMAN',     3500000,           20000000),
  ('FERRARI-488-GTB',       15000000,          100000000),
  ('LAMBO-HURACAN',         15000000,          100000000),
  ('MB-G63-AMG',             8000000,           50000000),
  ('MB-S580',                6000000,           35000000),
  ('BMW-M3-COMP',            4000000,           25000000),
  ('BMW-M5-COMP',            4500000,           30000000),
  ('BENTLEY-CONT-GT',        8000000,           60000000),
  ('RR-GHOST',              15000000,          100000000),
  ('RR-CULLINAN',           20000000,          120000000),
  ('RR-AUTOBIOGRAPHY',       5000000,           40000000),
  ('TOYOTA-LC300',           3000000,           20000000),
  ('AUDI-RS6-AVANT',         4000000,           25000000)
)
update public.market_items mi
   set min_price = case
         when mi.currency = 'JPY' then b.min_jpy
         else round(b.min_jpy * fx.rate, 2)
       end,
       max_price = case
         when mi.currency = 'JPY' then b.max_jpy
         else round(b.max_jpy * fx.rate, 2)
       end
  from band b
  left join public.fx_rates fx on fx.currency = 'USD'
 where mi.identifier = b.identifier
   -- fx_rates holds "units of X per 1 JPY", so JPY -> USD multiplies.
   and (mi.currency = 'JPY' or (fx.rate is not null and fx.rate > 0));

-- ---------------------------------------------------------------------------
-- brands the rules never covered
-- ---------------------------------------------------------------------------
-- Fendi was absent entirely, which is why "every Fendi bag" was worse than the
-- one seeded model. The rest are brands a Japanese or Singaporean collector is
-- likely to add by hand.
insert into public.brand_rules (pattern, aliases, min_price, max_price, category) values
  ('fendi',        'フェンディ Fendi',                    100000,  2000000, 'bag'),
  ('baguette',     'フェンディ バゲット Fendi Baguette',  140000,  1200000, 'bag'),
  ('balenciaga',   'バレンシアガ Balenciaga',              50000,  1000000, 'bag'),
  ('saint laurent','サンローラン イヴサンローラン YSL',    80000,  1500000, 'bag'),
  ('miu miu',      'ミュウミュウ MiuMiu',                  50000,  1000000, 'bag'),
  ('valextra',     'ヴァレクストラ Valextra',              80000,  1200000, 'bag'),
  ('jil sander',   'ジルサンダー Jil Sander',              40000,   800000, 'bag'),
  ('the row',      'ザロウ The Row',                      100000,  1500000, 'bag'),
  ('mulberry',     'マルベリー Mulberry',                  40000,   700000, 'bag'),
  ('coach',        'コーチ Coach',                         15000,   300000, 'bag'),
  ('longchamp',    'ロンシャン Longchamp',                 10000,   200000, 'bag'),
  ('hublot',       'ウブロ Hublot',                       500000, 20000000, 'watch'),
  ('panerai',      'パネライ Panerai',                    300000, 10000000, 'watch'),
  ('zenith',       'ゼニス Zenith',                       200000,  8000000, 'watch'),
  ('longines',     'ロンジン Longines',                    60000,  2000000, 'watch'),
  ('seiko',        'セイコー Seiko',                       15000,  3000000, 'watch'),
  ('casio',        'カシオ Casio Gショック G-SHOCK',         5000,   500000, 'watch'),
  ('citizen',      'シチズン Citizen',                     15000,  1000000, 'watch'),
  ('breguet',      'ブレゲ Breguet',                      800000, 30000000, 'watch'),
  ('blancpain',    'ブランパン Blancpain',                500000, 20000000, 'watch'),
  ('richard mille','リシャールミル Richard Mille',      10000000,500000000, 'watch')
on conflict (pattern) do update
  set aliases   = excluded.aliases,
      min_price = excluded.min_price,
      max_price = excluded.max_price,
      category  = excluded.category;

-- Ceilings for the brands 0020 and 0023 already knew about. Floors are left
-- exactly as they are: those were argued for where they were written, and this
-- migration is adding the other half of the band, not second-guessing them.
update public.brand_rules set max_price = min_price * 12
 where max_price is null;

-- ---------------------------------------------------------------------------
-- apply_brand_rules learns the ceiling
-- ---------------------------------------------------------------------------
/**
 * Unchanged in shape from 0020: aliases accumulate, the floor takes the
 * highest matching rule because the most specific rule knows most, and
 * anything already set by hand is left alone.
 *
 * The ceiling takes the LOWEST match, which is the same principle pointing the
 * other way — between `fendi` at ¥2,000,000 and `baguette` at ¥1,200,000, the
 * rule that names the model is the one that knows what a Baguette costs.
 */
create or replace function public.apply_brand_rules(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item        record;
  v_haystack    text;
  v_aliases     text;
  v_min_jpy     numeric;
  v_max_jpy     numeric;
  v_min_price   numeric;
  v_max_price   numeric;
  v_rate        numeric;
begin
  select * into v_item from public.market_items where id = p_id;
  if not found then return; end if;

  v_haystack := lower(coalesce(v_item.name, '') || ' ' || coalesce(v_item.detail, ''));

  select
    string_agg(distinct r.aliases, ' '),
    max(r.min_price),
    min(r.max_price)
  into v_aliases, v_min_jpy, v_max_jpy
  from public.brand_rules r
  where position(lower(r.pattern) in v_haystack) > 0
    and (r.category is null or r.category = v_item.category);

  if v_aliases is null then return; end if;

  -- fx_rates holds "units of X per 1 JPY", so JPY -> item currency multiplies.
  -- A missing rate leaves the band unset rather than writing one in the wrong
  -- unit: no band is recoverable, while a wrong one silently suppresses every
  -- real price this item will ever have.
  if v_item.currency = 'JPY' then
    v_min_price := v_min_jpy;
    v_max_price := v_max_jpy;
  else
    select rate into v_rate from public.fx_rates where currency = v_item.currency;
    if v_rate is not null and v_rate > 0 then
      v_min_price := round(v_min_jpy * v_rate, 2);
      v_max_price := round(v_max_jpy * v_rate, 2);
    end if;
  end if;

  update public.market_items
     set aliases = case
                     when aliases is null or btrim(aliases) = '' then v_aliases
                     when position(v_aliases in aliases) > 0 then aliases
                     else aliases || ' ' || v_aliases
                   end,
         min_price = coalesce(min_price, v_min_price),
         max_price = coalesce(max_price, v_max_price)
   where id = p_id;
end;
$$;

grant execute on function public.apply_brand_rules(uuid) to authenticated;

-- Everything not covered by the per-model list above — user-added rows, and
-- any seeded row whose identifier changed.
do $$
declare r record;
begin
  for r in select id from public.market_items where min_price is null or max_price is null loop
    perform public.apply_brand_rules(r.id);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- withdraw every price now outside its band
-- ---------------------------------------------------------------------------
-- The step 0013 was missing, and the whole reason the reported numbers are
-- still on screen. Without this the corrected bands would only take effect on
-- whatever future run happened to return something different.
--
-- `curated` rows are exempt: an admin typed those prices deliberately, and a
-- band inferred from a brand table has no business overruling a person who
-- looked the item up.
update public.market_items
   set current_price = null,
       data_confidence = 'insufficient'
 where source_type is distinct from 'curated'
   and current_price is not null
   and (
     (min_price is not null and current_price < min_price)
     or (max_price is not null and current_price > max_price)
   );

-- Snapshots keep their history: a chart that silently loses its past is worse
-- than one with a visible discontinuity, and the snapshot table is the record
-- of what was believed at the time. The next run writes the corrected figure
-- and the chart carries on from there.

-- ---------------------------------------------------------------------------
-- the review queue reports the ceiling too
-- ---------------------------------------------------------------------------
-- Same function as 0023 with max_price added, and one more trigger for review:
-- a price sitting just under its ceiling deserves the same second look as one
-- sitting just above its floor.
create or replace function public.admin_price_audit(p_limit int default 100)
returns table (
  id            uuid,
  name          text,
  category      text,
  source_type   text,
  search_query  text,
  current_price numeric,
  currency      text,
  min_price     numeric,
  max_price     numeric,
  data_confidence text,
  price_updated_at timestamptz,
  price_debug   jsonb,
  holders       bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    mi.id, mi.name, mi.category, mi.source_type, mi.search_query,
    mi.current_price, mi.currency, mi.min_price, mi.max_price, mi.data_confidence,
    mi.price_updated_at, mi.price_debug,
    (select count(*) from public.holdings h where h.market_item_id = mi.id)
  from public.market_items mi
  where public.is_admin()
    and mi.source_type in ('ebay', 'rakuten')
    and (
      mi.current_price is null
      or mi.data_confidence = 'insufficient'
      or (mi.price_debug ->> 'outcome') in ('below_floor', 'above_ceiling', 'collapsed', 'no_result')
      or (mi.min_price is not null and mi.current_price < mi.min_price * 1.5)
      or (mi.max_price is not null and mi.current_price > mi.max_price * 0.8)
    )
  order by
    (select count(*) from public.holdings h where h.market_item_id = mi.id) desc,
    mi.price_updated_at desc nulls last
  limit p_limit;
$$;

grant execute on function public.admin_price_audit(int) to authenticated;
