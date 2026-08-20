-- 0023 — Show the working. And give cars a floor at all.
--
-- THE REPORT
--
-- "BMW shows around ¥10,000, and there is no way to tell what eBay was even
-- asked." Both halves are correct, and the second is the reason the first went
-- unnoticed: a price with no visible derivation cannot be judged, only
-- believed or disbelieved.
--
-- THE CAUSE OF THE FIRST HALF
--
-- Migration 0020 gave 39 brands a Japanese alias and a price floor. Its car
-- entries are Ferrari, Porsche and Lamborghini — three brands, chosen because
-- they are the ones people collect. Every other marque therefore arrives with
-- min_price null, which is to say with no floor at all, and eBay's inventory
-- for "BMW" is overwhelmingly die-cast models, wheel emblems, floor mats and
-- brochures. A median over that sample is a correct median of the wrong
-- population. ¥10,000 was never a car.
--
-- Two things follow, and only one of them is a table.
--
--  1. The application now confines an eBay search to eBay's own category for
--     the item — Cars & Trucks, not Toys — and pushes the floor into the query
--     instead of only checking the answer against it. See lib/ebay.ts. That is
--     the real fix: no list of banned words survives the next seller who writes
--     a title we did not think of, whereas a die-cast model is simply not
--     listed in Cars & Trucks.
--
--  2. The marques below, so the floor exists for the brands people actually
--     own. Still deliberately low — roughly a third of a cheap running example
--     — because a floor that is too high hides real prices, while one that is
--     merely low still catches the failure it exists for.
--
-- THE SECOND HALF
--
-- `price_debug` records how each price was reached, on every attempt including
-- the refusals, and the admin screen renders it with a link to the same search
-- on eBay's own site. "The price looks wrong" and "the price is wrong, and here
-- is the 1/18 model that caused it" are different conversations.

-- ---------------------------------------------------------------------------
-- provenance
-- ---------------------------------------------------------------------------
alter table public.market_items
  add column if not exists price_debug jsonb;

comment on column public.market_items.price_debug is
  'How the last price attempt was made and what it produced: the query sent, a '
  'human-openable search URL, sample size, the range the median was taken over, '
  'the floor applied, and the outcome (published / below_floor / collapsed / '
  'no_result). Written by the cron on every attempt. Contains no credentials — '
  'the Rakuten application id is stripped and the eBay token travels in a header.';

-- Not exposed by the public read policy in any special way: `price_debug` is a
-- column on a row that is already world-readable once approved, and it holds
-- nothing about any user. The admin screen is where it is USEFUL, not where it
-- is secret.

-- ---------------------------------------------------------------------------
-- cars, which had three brands and needed thirty
-- ---------------------------------------------------------------------------
-- Floors are JPY and are converted to the item's currency by apply_brand_rules.
insert into public.brand_rules (pattern, aliases, min_price, category) values
  ('bmw',            'BMW ビーエムダブリュー ビーエム',            300000, 'car'),
  ('mercedes',       'メルセデス ベンツ Mercedes-Benz Benz',       300000, 'car'),
  ('benz',           'メルセデス ベンツ Mercedes-Benz',            300000, 'car'),
  ('audi',           'アウディ Audi',                              250000, 'car'),
  ('volkswagen',     'フォルクスワーゲン VW Volkswagen',           150000, 'car'),
  ('volvo',          'ボルボ Volvo',                               200000, 'car'),
  ('jaguar',         'ジャガー Jaguar',                            250000, 'car'),
  ('land rover',     'ランドローバー Land Rover レンジローバー',   300000, 'car'),
  ('range rover',    'レンジローバー Range Rover',                 400000, 'car'),
  ('mini cooper',    'ミニクーパー MINI Cooper',                   150000, 'car'),
  ('maserati',       'マセラティ Maserati',                        800000, 'car'),
  ('bentley',        'ベントレー Bentley',                        3000000, 'car'),
  ('rolls royce',    'ロールスロイス Rolls-Royce',                5000000, 'car'),
  ('aston martin',   'アストンマーティン Aston Martin',           3000000, 'car'),
  ('mclaren',        'マクラーレン McLaren',                      8000000, 'car'),
  ('bugatti',        'ブガッティ Bugatti',                       30000000, 'car'),
  ('alfa romeo',     'アルファロメオ Alfa Romeo',                  200000, 'car'),
  ('lotus',          'ロータス Lotus',                             800000, 'car'),
  ('tesla',          'テスラ Tesla',                              1500000, 'car'),
  ('lexus',          'レクサス Lexus',                             400000, 'car'),
  ('toyota',         'トヨタ Toyota',                              150000, 'car'),
  ('nissan',         'ニッサン 日産 Nissan',                       150000, 'car'),
  ('honda',          'ホンダ Honda',                               150000, 'car'),
  ('mazda',          'マツダ Mazda',                               150000, 'car'),
  ('subaru',         'スバル Subaru',                              150000, 'car'),
  ('mitsubishi',     'ミツビシ 三菱 Mitsubishi',                   150000, 'car'),
  ('suzuki',         'スズキ Suzuki',                              100000, 'car'),
  ('chevrolet',      'シボレー Chevrolet',                         200000, 'car'),
  ('ford',           'フォード Ford',                              150000, 'car'),
  ('dodge',          'ダッジ Dodge',                               200000, 'car'),
  ('peugeot',        'プジョー Peugeot',                           150000, 'car'),
  ('renault',        'ルノー Renault',                             150000, 'car'),
  ('fiat',           'フィアット Fiat',                            120000, 'car'),
  ('citroen',        'シトロエン Citroen',                         150000, 'car')
on conflict (pattern) do update
  set aliases = excluded.aliases,
      min_price = excluded.min_price,
      category = excluded.category;

-- ---------------------------------------------------------------------------
-- apply them
-- ---------------------------------------------------------------------------
-- apply_brand_rules only fills a floor that is null, so this cannot overwrite
-- anything an admin typed by hand.
do $$
declare r record;
begin
  for r in select id from public.market_items where category = 'car' loop
    perform public.apply_brand_rules(r.id);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- withdraw the prices those floors would now have refused
-- ---------------------------------------------------------------------------
-- Same reasoning as the end of 0020: a floor added today does not retroactively
-- unpublish yesterday's number, and the whole point is that the wrong number is
-- gone now rather than at the next refresh that happens to differ.
update public.market_items
   set current_price = null,
       data_confidence = 'insufficient'
 where min_price is not null
   and current_price is not null
   and current_price < min_price;

-- ---------------------------------------------------------------------------
-- the admin queue can show the working
-- ---------------------------------------------------------------------------
/**
 * Items whose last price attempt is worth a second look, worst first.
 *
 * Deliberately not "everything": a list of 2,000 rows is not a review queue.
 * What surfaces here is what the automation could not resolve on its own —
 * a price it refused, a search that returned nothing, or a published price
 * sitting close enough to its floor to be suspicious.
 */
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
    mi.current_price, mi.currency, mi.min_price, mi.data_confidence,
    mi.price_updated_at, mi.price_debug,
    (select count(*) from public.holdings h where h.market_item_id = mi.id)
  from public.market_items mi
  where public.is_admin()
    and mi.source_type in ('ebay', 'rakuten')
    and (
      mi.current_price is null
      or mi.data_confidence = 'insufficient'
      or (mi.price_debug ->> 'outcome') in ('below_floor', 'collapsed', 'no_result')
      -- Published, but within 50% of the floor: not refused, and not obviously
      -- right either. This is where a wrong answer hides after the obvious ones
      -- have been caught.
      or (mi.min_price is not null and mi.current_price < mi.min_price * 1.5)
    )
  order by
    -- Items somebody actually holds first: a wrong price on a held item is on
    -- somebody's portfolio screen right now.
    (select count(*) from public.holdings h where h.market_item_id = mi.id) desc,
    mi.price_updated_at desc nulls last
  limit p_limit;
$$;

grant execute on function public.admin_price_audit(int) to authenticated;
