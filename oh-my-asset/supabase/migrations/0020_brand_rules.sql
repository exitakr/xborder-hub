-- 0020 — Brand rules: Japanese aliases and price floors, applied automatically.
--
-- TWO SYMPTOMS, ONE CAUSE
--
-- 1. "Hermes Kelly To Go" was added by a user, approved, and then could not be
--    found by searching エルメス.
-- 2. "Hermes Birkin 25" showed a price around SGD 250.
--
-- Both happen because `create_market_item` sets neither `aliases` nor
-- `min_price`. The seeded catalogue has both — they were typed in by hand, item
-- by item, in migrations 0009 and 0013. Nothing carried that knowledge over to
-- rows created by users, so every user-added item arrives invisible to
-- Japanese search and with no floor under its price.
--
-- Fixing the two rows would leave the next user-added Hermès bag with exactly
-- the same two problems. What is missing is a place to put the fact that
-- "Hermes" is also written エルメス and that its bags do not sell for SGD 250.

create table if not exists public.brand_rules (
  id          uuid primary key default gen_random_uuid(),
  -- Matched case-insensitively against the item's name and detail.
  pattern     text not null unique,
  -- Appended to the item's aliases so Japanese search finds an English name.
  aliases     text not null,
  /*
   * Lowest plausible price for this brand in this category, in JPY.
   *
   * Stored in one currency so the table stays readable and comparable, and
   * converted into the ITEM's currency when applied — `market_items.min_price`
   * carries no currency of its own and is compared against a fetched price in
   * whatever the source quotes (USD from eBay, JPY from Rakuten). A ¥800,000
   * floor written straight onto a USD item would reject every genuine price.
   *
   * Not a valuation — a floor. Its only job is to catch the case where the
   * search matched an accessory (a dust bag, a charm, a phone case) rather than
   * the item, which is what produces a Birkin priced like a keyring. Set it
   * well BELOW the cheapest genuine example: a floor that is too high hides
   * real prices, while one that is merely low still catches the failure it
   * exists for.
   */
  min_price   numeric check (min_price is null or min_price > 0),
  category    text,
  created_at  timestamptz not null default now()
);

alter table public.brand_rules enable row level security;

-- Readable by anyone (it is reference data with no personal content), writable
-- only through the admin path.
drop policy if exists "brand rules are public" on public.brand_rules;
create policy "brand rules are public" on public.brand_rules for select using (true);

-- Floors are in JPY and deliberately conservative — roughly a third of the
-- cheapest genuine example, so a worn or damaged piece still prices, while an
-- accessory never will.
insert into public.brand_rules (pattern, aliases, min_price, category) values
  ('birkin',          'エルメス バーキン Hermes Birkin',          800000, 'bag'),
  ('kelly',           'エルメス ケリー Hermes Kelly',             500000, 'bag'),
  ('constance',       'エルメス コンスタンス Hermes Constance',   600000, 'bag'),
  ('evelyne',         'エルメス エヴリン Hermes Evelyne',         180000, 'bag'),
  ('picotin',         'エルメス ピコタン Hermes Picotin',         180000, 'bag'),
  ('garden party',    'エルメス ガーデンパーティ Hermes',         120000, 'bag'),
  ('hermes',          'エルメス Hermes エルメス',                 100000, null),
  ('chanel',          'シャネル Chanel',                          200000, 'bag'),
  ('louis vuitton',   'ルイヴィトン ルイ・ヴィトン Louis Vuitton', 60000, 'bag'),
  ('gucci',           'グッチ Gucci',                              40000, 'bag'),
  ('prada',           'プラダ Prada',                              40000, 'bag'),
  ('bottega veneta',  'ボッテガヴェネタ ボッテガ Bottega Veneta',  80000, 'bag'),
  ('dior',            'ディオール Dior',                           80000, 'bag'),
  ('celine',          'セリーヌ Celine',                           80000, 'bag'),
  ('loewe',           'ロエベ Loewe',                              70000, 'bag'),
  ('goyard',          'ゴヤール Goyard',                          100000, 'bag'),
  ('rolex',           'ロレックス Rolex',                         400000, 'watch'),
  ('patek philippe',  'パテックフィリップ Patek Philippe',       2000000, 'watch'),
  ('audemars piguet', 'オーデマピゲ Audemars Piguet',            1500000, 'watch'),
  ('omega',           'オメガ Omega',                             150000, 'watch'),
  ('cartier',         'カルティエ Cartier',                       150000, null),
  ('tudor',           'チューダー チュードル Tudor',              150000, 'watch'),
  ('grand seiko',     'グランドセイコー Grand Seiko',             200000, 'watch'),
  ('iwc',             'IWC インターナショナルウォッチ',            250000, 'watch'),
  ('jaeger',          'ジャガールクルト Jaeger-LeCoultre',        400000, 'watch'),
  ('vacheron',        'ヴァシュロンコンスタンタン Vacheron',     1500000, 'watch'),
  ('breitling',       'ブライトリング Breitling',                 200000, 'watch'),
  ('tag heuer',       'タグホイヤー TAG Heuer',                    80000, 'watch'),
  ('van cleef',       'ヴァンクリーフ&アーペル Van Cleef',        300000, null),
  ('tiffany',         'ティファニー Tiffany',                       30000, null),
  ('bulgari',         'ブルガリ Bvlgari Bulgari',                  80000, null),
  ('chaine d',        'エルメス シェーヌダンクル Chaine d''Ancre', 150000, null),
  ('nike',            'ナイキ Nike',                                8000, 'sneaker'),
  ('jordan',          'ナイキ ジョーダン Nike Air Jordan',         12000, 'sneaker'),
  ('adidas',          'アディダス Adidas',                          8000, 'sneaker'),
  ('new balance',     'ニューバランス New Balance',                 8000, 'sneaker'),
  ('ferrari',         'フェラーリ Ferrari',                      8000000, 'car'),
  ('porsche',         'ポルシェ Porsche',                        3000000, 'car'),
  ('lamborghini',     'ランボルギーニ Lamborghini',             10000000, 'car')
on conflict (pattern) do update
  set aliases = excluded.aliases,
      min_price = excluded.min_price,
      category = excluded.category;

/**
 * Apply every matching brand rule to one item.
 *
 * Aliases accumulate: a "Hermes Birkin 25" matches both the `birkin` rule and
 * the `hermes` rule, and wants the Japanese for both. The floor takes the
 * HIGHEST match, because the most specific rule is the one that knows most —
 * `birkin` at ¥800,000 should win over the generic `hermes` at ¥100,000.
 *
 * Anything already set by hand is left alone. An admin who typed a floor knows
 * something this table does not.
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
  v_min_price   numeric;
  v_rate        numeric;
begin
  select * into v_item from public.market_items where id = p_id;
  if not found then return; end if;

  v_haystack := lower(coalesce(v_item.name, '') || ' ' || coalesce(v_item.detail, ''));

  select
    string_agg(distinct r.aliases, ' '),
    max(r.min_price)
  into v_aliases, v_min_jpy
  from public.brand_rules r
  where position(lower(r.pattern) in v_haystack) > 0
    and (r.category is null or r.category = v_item.category);

  if v_aliases is null then return; end if;

  -- fx_rates holds "units of X per 1 JPY", so JPY -> item currency multiplies.
  -- A missing rate leaves the floor unset rather than writing one in the wrong
  -- unit: no floor is recoverable, while a wrong floor silently suppresses
  -- every real price this item will ever have.
  if v_min_jpy is not null then
    if v_item.currency = 'JPY' then
      v_min_price := v_min_jpy;
    else
      select rate into v_rate from public.fx_rates where currency = v_item.currency;
      if v_rate is not null and v_rate > 0 then
        v_min_price := round(v_min_jpy * v_rate, 2);
      end if;
    end if;
  end if;

  update public.market_items
     set aliases = case
                     when aliases is null or btrim(aliases) = '' then v_aliases
                     -- Already has aliases: append only what is genuinely new,
                     -- so re-running never doubles the string.
                     when position(v_aliases in aliases) > 0 then aliases
                     else aliases || ' ' || v_aliases
                   end,
         min_price = coalesce(min_price, v_min_price)
   where id = p_id;
end;
$$;

grant execute on function public.apply_brand_rules(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- backfill
-- ---------------------------------------------------------------------------
-- Everything already in the catalogue, including the rows that prompted this.
do $$
declare r record;
begin
  for r in select id from public.market_items loop
    perform public.apply_brand_rules(r.id);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- apply on creation
-- ---------------------------------------------------------------------------
-- A trigger rather than a call inside `create_market_item`: the native app can
-- reach other write paths, and a rule that only fires from one function is a
-- rule that will eventually be bypassed.
create or replace function public.market_items_apply_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.apply_brand_rules(new.id);
  return null;
end;
$$;

drop trigger if exists market_items_brand_rules on public.market_items;
create trigger market_items_brand_rules
  after insert on public.market_items
  for each row execute function public.market_items_apply_rules();

-- ---------------------------------------------------------------------------
-- admin edits
-- ---------------------------------------------------------------------------
-- The review queue needs to set these two directly: the rules cover the brands
-- we know about, and the queue exists for the ones we do not.
create or replace function public.admin_approve_item(
  p_id           uuid,
  p_name         text default null,
  p_detail       text default null,
  p_identifier   text default null,
  p_search_query text default null,
  p_category     text default null,
  p_aliases      text default null,
  p_min_price    numeric default null
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
         aliases      = coalesce(nullif(btrim(p_aliases), ''), aliases),
         min_price    = coalesce(p_min_price, min_price),
         approved_at  = now(),
         approved_by  = auth.uid()
   where id = p_id;

  -- After the edit, so a corrected name picks up the rules the original missed.
  perform public.apply_brand_rules(p_id);
end;
$$;

-- 0019's six-argument version is a DISTINCT overload from the eight-argument
-- one above — Postgres tells functions apart by name AND argument list, so
-- `create or replace` with two more parameters does not replace it, it adds a
-- second admin_approve_item sitting alongside the first. Left in place, any
-- future call made with the old six-argument shape would silently run the
-- version with no aliases or floor rather than fail — the wrong kind of
-- backward compatibility for a function gated on is_admin(). Dropped, not
-- replaced, because the six-argument signature has no reason to exist once
-- this one is defined.
drop function if exists public.admin_approve_item(uuid, text, text, text, text, text);

grant execute on function public.admin_approve_item(uuid, text, text, text, text, text, text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- the queue needs the two new fields it can now edit
-- ---------------------------------------------------------------------------
-- `create or replace` cannot widen a table-returning function's column list —
-- Postgres raises 42P13 ("cannot change return type of existing function")
-- because the row type is defined by the OUT parameters and a new column is a
-- different row type. The function has to be dropped first whenever its
-- output columns change; 0019's version returned fewer columns than this one.
drop function if exists public.admin_pending_items(int);

create or replace function public.admin_pending_items(p_limit int default 200)
returns table (
  id            uuid,
  category      text,
  name          text,
  detail        text,
  identifier    text,
  search_query  text,
  source_type   text,
  aliases       text,
  min_price     numeric,
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
    mi.source_type, mi.aliases, mi.min_price, mi.current_price, mi.currency,
    (select count(*) from public.holdings h where h.market_item_id = mi.id),
    mi.created_at, mi.created_by
  from public.market_items mi
  where public.is_admin()
    and mi.approved_at is null
  order by mi.created_at desc
  limit p_limit;
$$;

grant execute on function public.admin_pending_items(int) to authenticated;

-- ---------------------------------------------------------------------------
-- clear prices the floors would now have refused
-- ---------------------------------------------------------------------------
-- The floors only gate NEW fetches. A price already published under an absent
-- floor — the SGD 250 Birkin — would sit there until the next refresh happened
-- to return something different. Withdrawing them now means the bad number is
-- gone today, and the next run republishes whatever legitimately passes.
update public.market_items
   set current_price = null,
       data_confidence = 'insufficient'
 where min_price is not null
   and current_price is not null
   and current_price < min_price;
