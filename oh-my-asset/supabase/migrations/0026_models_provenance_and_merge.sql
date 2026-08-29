-- 0026 — Search by model, show the source, and let an admin merge duplicates.
--
-- Three requests, one underlying theme: a price is only as good as the thing it
-- was a price OF, and until now nothing in this system insisted on knowing
-- which product a row referred to.
--
-- ---------------------------------------------------------------------------
-- 1. SEARCH BY MODEL, NOT BY BRAND
-- ---------------------------------------------------------------------------
--
-- `create_market_item` builds its query as `name || detail || category term`.
-- Someone typing "シャネル" gets "シャネル バッグ" — every Chanel bag there is,
-- from a ¥40,000 pouch to a ¥3,000,000 flap. The median of that is a real
-- number describing no product, and no floor can rescue it: the sample is
-- genuinely bags, genuinely Chanel, and genuinely spread across two orders of
-- magnitude.
--
-- 0012 saw half of this and added the category term, which stops a brand search
-- returning shoes and keychains. It cannot stop it returning the brand's entire
-- bag line, because that IS the brand's bag line.
--
-- The missing piece is a MODEL. `brand_models` below is that: the canonical
-- name of a thing people actually collect, the words that find it on each
-- marketplace, and the band it plausibly trades in. With it, a user typing
-- "シャネル 19" resolves to a known model and inherits a query and a band that
-- were written once and checked; a user typing "シャネル" is told, at the moment
-- they type it, that a brand alone cannot be priced.
--
-- ---------------------------------------------------------------------------
-- 2. SHOW WHERE THE NUMBER CAME FROM
-- ---------------------------------------------------------------------------
--
-- 0023 records `price_debug`, including a URL that opens the same search on the
-- source's own site — but only the price-audit panel reads it. The admin
-- screens that list what users are actually holding show a number with no way
-- to check it. Both now carry the provenance.
--
-- ---------------------------------------------------------------------------
-- 3. MERGE DUPLICATES
-- ---------------------------------------------------------------------------
--
-- "Bottega Veneta Cassette", "bottega veneta cassette" and "BOTTEGA CASSETTE"
-- are three rows, three separate price fetches, three holder counts, and three
-- community price pools that each stay under the three-reporter threshold and
-- therefore publish nothing. Merging is what turns that into one item several
-- people hold with enough reports to show a realised price — which is the
-- feature the split was quietly disabling.

-- ===========================================================================
-- PART 1 — models
-- ===========================================================================

create table if not exists public.brand_models (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in ('pokemon','tcg','watch','bag','sneaker','car','other')),
  brand       text not null,
  /* Canonical display name, e.g. "Chanel 19". What the catalogue row becomes. */
  model       text not null,
  /*
   * Everything a person might type to mean this model, lowercased, space
   * separated — Japanese and English together. Matched by containment, so
   * "シャネル19" and "chanel 19 medium" both land here.
   */
  aliases     text not null,
  /* The query that finds it on a Japanese marketplace (Rakuten). */
  query_ja    text,
  /* The query that finds it on an English one (eBay). */
  query_en    text,
  min_jpy     numeric check (min_jpy is null or min_jpy > 0),
  max_jpy     numeric check (max_jpy is null or max_jpy > 0),
  created_at  timestamptz not null default now(),
  unique (category, brand, model)
);

alter table public.brand_models enable row level security;

-- Reference data with no personal content. Readable by anyone, including
-- signed-out visitors, because the "add an item" screen suggests from it.
drop policy if exists "brand models are public" on public.brand_models;
create policy "brand models are public" on public.brand_models for select using (true);

create index if not exists brand_models_category_idx on public.brand_models (category);

/*
 * The models this catalogue already knows, plus the ones most likely to be
 * typed next.
 *
 * Bands are the same calibration as 0024 — near half a genuine worn example on
 * the floor, roughly three times a typical one on the ceiling — because a model
 * a user adds should be priced exactly as well as one that was seeded.
 */
insert into public.brand_models (category, brand, model, aliases, query_ja, query_en, min_jpy, max_jpy) values
  -- bags --------------------------------------------------------------------
  ('bag','Hermès','Birkin 25','エルメス バーキン25 バーキン 25 hermes birkin 25','エルメス バーキン25','Hermes Birkin 25',1800000,15000000),
  ('bag','Hermès','Birkin 30','エルメス バーキン30 バーキン 30 hermes birkin 30','エルメス バーキン30','Hermes Birkin 30',1500000,12000000),
  ('bag','Hermès','Kelly 25','エルメス ケリー25 ケリー 25 hermes kelly 25','エルメス ケリー25','Hermes Kelly 25',1400000,12000000),
  ('bag','Hermès','Kelly 28','エルメス ケリー28 ケリー 28 hermes kelly 28','エルメス ケリー28','Hermes Kelly 28',1200000,10000000),
  ('bag','Hermès','Constance 24','エルメス コンスタンス24 コンスタンス hermes constance','エルメス コンスタンス24','Hermes Constance 24',1000000,8000000),
  ('bag','Hermès','Evelyne PM','エルメス エブリン エヴリン evelyne hermes evelyne','エルメス エブリン PM','Hermes Evelyne PM',200000,1500000),
  ('bag','Hermès','Picotin Lock 18','エルメス ピコタン ピコタンロック picotin hermes picotin','エルメス ピコタンロック18','Hermes Picotin Lock 18',180000,1500000),
  ('bag','Hermès','Kelly To Go','エルメス ケリートゥゴー ケリー トゥ ゴー kelly to go','エルメス ケリートゥゴー','Hermes Kelly To Go',900000,6000000),
  ('bag','Chanel','Classic Flap Medium','シャネル マトラッセ クラシックフラップ chanel classic flap','シャネル マトラッセ 25 チェーンバッグ','Chanel Classic Flap medium caviar',700000,5000000),
  ('bag','Chanel','2.55 Reissue 226','シャネル 2.55 リイシュー reissue chanel 255','シャネル 2.55 リイシュー 226','Chanel 2.55 Reissue 226',600000,4500000),
  ('bag','Chanel','Boy Medium','シャネル ボーイシャネル ボーイ chanel boy','シャネル ボーイシャネル','Chanel Boy bag medium',400000,3000000),
  ('bag','Chanel','Chanel 19 Medium','シャネル19 シャネル 19 chanel 19','シャネル 19 チェーンバッグ','Chanel 19 bag medium lambskin',400000,3000000),
  ('bag','Chanel','Wallet on Chain','シャネル ウォレットオンチェーン woc chanel woc','シャネル ウォレットオンチェーン','Chanel wallet on chain',250000,2000000),
  ('bag','Louis Vuitton','Neverfull MM','ルイヴィトン ネヴァーフル ネバーフル neverfull','ルイヴィトン ネヴァーフル MM','Louis Vuitton Neverfull MM',100000,800000),
  ('bag','Louis Vuitton','Speedy 25','ルイヴィトン スピーディ スピーディー speedy 25','ルイヴィトン スピーディ 25','Louis Vuitton Speedy 25',60000,500000),
  ('bag','Louis Vuitton','Alma BB','ルイヴィトン アルマ alma bb','ルイヴィトン アルマ BB','Louis Vuitton Alma BB',80000,700000),
  ('bag','Louis Vuitton','Capucines PM','ルイヴィトン カプシーヌ capucines','ルイヴィトン カプシーヌ PM','Louis Vuitton Capucines PM',250000,2000000),
  ('bag','Louis Vuitton','Pochette Métis','ルイヴィトン ポシェットメティス metis pochette','ルイヴィトン ポシェットメティス','Louis Vuitton Pochette Metis',120000,1000000),
  ('bag','Gucci','Jackie 1961 Small','グッチ ジャッキー jackie 1961','グッチ ジャッキー1961','Gucci Jackie 1961 small',120000,900000),
  ('bag','Gucci','GG Marmont Medium','グッチ マーモント marmont gg marmont','グッチ GGマーモント','Gucci GG Marmont medium',80000,700000),
  ('bag','Dior','Saddle Medium','ディオール サドル サドルバッグ dior saddle','ディオール サドルバッグ','Dior Saddle bag medium',160000,1300000),
  ('bag','Dior','Lady Dior Medium','ディオール レディディオール lady dior','ディオール レディディオール','Lady Dior medium',250000,2000000),
  ('bag','Celine','Triomphe Medium','セリーヌ トリオンフ triomphe','セリーヌ トリオンフ バッグ','Celine Triomphe bag medium',180000,1500000),
  ('bag','Bottega Veneta','Cassette','ボッテガヴェネタ カセット ボッテガ カセット cassette','ボッテガヴェネタ カセット','Bottega Veneta Cassette bag',130000,1000000),
  ('bag','Bottega Veneta','Jodie','ボッテガヴェネタ ジョディ ボッテガ ジョディ jodie','ボッテガヴェネタ ジョディ','Bottega Veneta Jodie bag',150000,1200000),
  ('bag','Loewe','Puzzle Small','ロエベ パズル パズルバッグ loewe puzzle','ロエベ パズルバッグ','Loewe Puzzle bag small',100000,800000),
  ('bag','Fendi','Baguette Medium','フェンディ バゲット バケット baguette','フェンディ バゲット バッグ','Fendi Baguette bag medium',140000,1200000),
  ('bag','Fendi','Peekaboo','フェンディ ピーカブー peekaboo','フェンディ ピーカブー','Fendi Peekaboo bag',180000,1500000),
  ('bag','Prada','Re-Edition 2005','プラダ リエディション re-edition 2005','プラダ リエディション2005','Prada Re-Edition 2005 nylon',50000,450000),
  ('bag','Goyard','Saint Louis PM','ゴヤール サンルイ saint louis','ゴヤール サンルイ PM','Goyard Saint Louis PM',150000,1200000),

  -- watches -----------------------------------------------------------------
  ('watch','Rolex','Submariner Date 126610LN','ロレックス サブマリーナ サブマリーナー 126610ln submariner date','ロレックス サブマリーナ 126610LN','Rolex Submariner 126610LN',900000,5000000),
  ('watch','Rolex','Submariner No-Date 124060','ロレックス サブマリーナ ノンデイト 124060','ロレックス サブマリーナ 124060','Rolex Submariner 124060',800000,4500000),
  ('watch','Rolex','GMT-Master II 126710BLRO','ロレックス gmtマスター ペプシ 126710blro','ロレックス GMTマスター 126710BLRO','Rolex GMT Master II 126710BLRO',1200000,8000000),
  ('watch','Rolex','Daytona 126500LN','ロレックス デイトナ 126500ln daytona','ロレックス デイトナ 126500LN','Rolex Daytona 126500LN',2000000,15000000),
  ('watch','Rolex','Datejust 41 126334','ロレックス デイトジャスト 126334 datejust','ロレックス デイトジャスト 126334','Rolex Datejust 126334',700000,4000000),
  ('watch','Rolex','Explorer I 124270','ロレックス エクスプローラー 124270 explorer','ロレックス エクスプローラー 124270','Rolex Explorer 124270',600000,3500000),
  ('watch','Omega','Speedmaster Professional','オメガ スピードマスター ムーンウォッチ speedmaster','オメガ スピードマスター プロフェッショナル','Omega Speedmaster Professional Moonwatch',350000,2500000),
  ('watch','Omega','Seamaster Diver 300M','オメガ シーマスター ダイバー300 seamaster','オメガ シーマスター ダイバー 300M','Omega Seamaster Diver 300M',300000,2000000),
  ('watch','Tudor','Black Bay 58','チューダー チュードル ブラックベイ black bay 58','チューダー ブラックベイ58','Tudor Black Bay 58 79030N',250000,1500000),
  ('watch','Grand Seiko','Snowflake SBGA211','グランドセイコー スノーフレーク sbga211 snowflake','グランドセイコー SBGA211','Grand Seiko SBGA211 Snowflake',300000,2000000),
  ('watch','Cartier','Santos Medium','カルティエ サントス santos','カルティエ サントス','Cartier Santos medium steel',400000,2500000),
  ('watch','Cartier','Tank Must','カルティエ タンク マスト tank must','カルティエ タンク マスト','Cartier Tank Must',250000,1500000),
  ('watch','Audemars Piguet','Royal Oak 15500ST','オーデマピゲ ロイヤルオーク 15500st royal oak','オーデマピゲ ロイヤルオーク 15500ST','Audemars Piguet Royal Oak 15500ST',2000000,15000000),
  ('watch','Patek Philippe','Nautilus 5711/1A','パテックフィリップ ノーチラス 5711 nautilus','パテックフィリップ ノーチラス 5711','Patek Philippe Nautilus 5711/1A',5000000,50000000),
  ('watch','Patek Philippe','Aquanaut 5167A','パテックフィリップ アクアノート 5167 aquanaut','パテックフィリップ アクアノート 5167','Patek Philippe Aquanaut 5167A',3000000,30000000),
  ('watch','IWC','Portugieser Chronograph','iwc ポルトギーゼ クロノグラフ portugieser','IWC ポルトギーゼ クロノグラフ','IWC Portugieser Chronograph',400000,3000000),

  -- sneakers ----------------------------------------------------------------
  ('sneaker','Nike','Air Jordan 1 High OG Chicago','ジョーダン1 シカゴ air jordan 1 chicago lost and found','ジョーダン1 シカゴ','Air Jordan 1 Chicago Lost and Found',18000,200000),
  ('sneaker','Nike','Air Jordan 1 High OG Bred Toe','ジョーダン1 ブレッドトゥ bred toe','ジョーダン1 ブレッドトゥ','Air Jordan 1 Bred Toe 555088-610',20000,250000),
  ('sneaker','Nike','Air Jordan 4 Black Cat','ジョーダン4 ブラックキャット black cat','ジョーダン4 ブラックキャット','Air Jordan 4 Black Cat CU1110-010',45000,500000),
  ('sneaker','Nike','Dunk Low Panda','ダンクロー パンダ dunk low panda','ナイキ ダンクロー パンダ','Nike Dunk Low Panda DD1391-100',7000,80000),
  ('sneaker','Nike','SB Dunk Low Travis Scott','sbダンク トラヴィススコット travis scott','ナイキ SBダンク トラヴィススコット','Nike SB Dunk Travis Scott CT5053-001',80000,900000),
  ('sneaker','Adidas','Yeezy Boost 350 V2 Zebra','イージー350 ゼブラ yeezy zebra','イージーブースト 350 ゼブラ','Yeezy Boost 350 V2 Zebra CP9654',15000,200000),
  ('sneaker','Adidas','Samba OG','サンバ アディダス サンバ samba og','アディダス サンバ OG','Adidas Samba OG B75806',6000,70000),
  ('sneaker','New Balance','990v6','ニューバランス 990 990v6','ニューバランス 990v6','New Balance M990GL6',12000,120000),
  ('sneaker','New Balance','550','ニューバランス 550 nb550','ニューバランス 550','New Balance BB550',5000,60000),

  -- cars --------------------------------------------------------------------
  ('car','Porsche','911 Carrera (992)','ポルシェ 911 カレラ 992 carrera','ポルシェ 911 カレラ 992','Porsche 911 992 Carrera',6000000,40000000),
  ('car','Ferrari','488 GTB','フェラーリ 488 gtb','フェラーリ 488 GTB','Ferrari 488 GTB',15000000,100000000),
  ('car','Lamborghini','Huracán','ランボルギーニ ウラカン huracan','ランボルギーニ ウラカン','Lamborghini Huracan',15000000,100000000),
  ('car','Mercedes-Benz','G63 AMG','メルセデス ゲレンデ g63 amg gクラス','メルセデス ベンツ G63 AMG','Mercedes-Benz G63 AMG',8000000,50000000),
  ('car','BMW','M3 Competition','bmw m3 コンペティション m3 competition','BMW M3 コンペティション','BMW M3 Competition',4000000,25000000),
  ('car','Toyota','Land Cruiser 300','ランドクルーザー ランクル300 land cruiser 300','トヨタ ランドクルーザー300','Toyota Land Cruiser 300',3000000,20000000)
on conflict (category, brand, model) do update
  set aliases  = excluded.aliases,
      query_ja = excluded.query_ja,
      query_en = excluded.query_en,
      min_jpy  = excluded.min_jpy,
      max_jpy  = excluded.max_jpy;

/**
 * Find the model somebody is describing.
 *
 * Matching is deliberately crude and deliberately one-directional: every alias
 * is checked for containment in the normalised text the user typed, and the
 * LONGEST matching alias wins. Length is a good proxy for specificity here —
 * "シャネル19" beats "シャネル", "submariner 126610ln" beats "submariner" — and
 * it needs no ranking table to maintain.
 *
 * Normalisation strips spaces and case so "Chanel 19", "chanel19" and
 * "ＣＨＡＮＥＬ 19" all reach the same row.
 */
create or replace function public.normalise_model_text(p_text text)
returns text
language sql
immutable
as $$
  -- The dash is last in the bracket expression and unescaped: Postgres uses
  -- advanced REs, where a backslash inside brackets is not reliably a literal.
  select regexp_replace(lower(coalesce(p_text, '')), '[[:space:]　・_/-]', '', 'g');
$$;

create or replace function public.match_brand_model(p_category text, p_text text)
returns public.brand_models
language sql
stable
security definer
set search_path = public
as $$
  select bm.*
  from public.brand_models bm
  cross join lateral unnest(string_to_array(bm.aliases, ' ')) as alias(term)
  where bm.category = p_category
    and length(btrim(alias.term)) >= 2
    and position(
          public.normalise_model_text(alias.term)
          in public.normalise_model_text(p_text)
        ) > 0
  order by length(public.normalise_model_text(alias.term)) desc
  limit 1;
$$;

grant execute on function public.normalise_model_text(text) to anon, authenticated;
grant execute on function public.match_brand_model(text, text) to anon, authenticated;

/**
 * Does this text name a brand and nothing else?
 *
 * The question `create_market_item` has to answer before it accepts an entry.
 * A brand with no model cannot be priced — not because the search fails, but
 * because it succeeds and returns the brand's whole product line, whose median
 * is a real number describing nothing.
 *
 * Checked by removing the brand and seeing what is left. Two characters of
 * residue is the threshold: "シャネル19" leaves "19" and is fine; "シャネル " and
 * "CHANEL" leave nothing and are not.
 */
create or replace function public.is_brand_only(p_category text, p_text text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_norm   text := public.normalise_model_text(p_text);
  v_rest   text;
  r        record;
  v_term   text;
  v_norm_term text;
  v_hit    boolean := false;
begin
  if v_norm = '' then return false; end if;

  -- A recognised model is by definition not brand-only, whatever else is in
  -- the string.
  if (select id from public.match_brand_model(p_category, p_text)) is not null then
    return false;
  end if;

  /*
   * Strip the brand, in every spelling we know it by.
   *
   * `pattern` is English ("bottega veneta") and the entry being checked is very
   * often Japanese, so matching on the pattern alone recognised almost no
   * Japanese brand-only entry — the check would pass and the item would be
   * created with a query returning that brand's entire product line, which is
   * exactly the case this function exists to catch. The aliases carry the
   * Japanese, so both are stripped.
   */
  v_rest := v_norm;
  for r in
    select pattern, aliases from public.brand_rules
    where category is null or category = p_category
  loop
    for v_term in
      select unnest(string_to_array(r.pattern || ' ' || coalesce(r.aliases, ''), ' '))
    loop
      v_norm_term := public.normalise_model_text(v_term);
      -- Two characters is the shortest brand fragment worth stripping; below
      -- that a stray token would eat parts of the model name instead.
      if length(v_norm_term) >= 2 and position(v_norm_term in v_rest) > 0 then
        v_hit := true;
        v_rest := replace(v_rest, v_norm_term, '');
      end if;
    end loop;
  end loop;

  -- Only a verdict when a brand was actually recognised. An unknown brand with
  -- an unknown model is somebody adding something genuinely obscure, and
  -- refusing that would be worse than pricing it badly.
  return v_hit and length(btrim(v_rest)) < 2;
end;
$$;

grant execute on function public.is_brand_only(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_market_item, now model-aware
-- ---------------------------------------------------------------------------
/**
 * Same contract as 0012 with two changes.
 *
 * A recognised model supplies the query and the band, so a user-added
 * "シャネル19" is priced exactly as well as the seeded Chanel 19 — one row of
 * reference data serving both.
 *
 * A brand with no model is refused, with `item_needs_model` so the UI can say
 * something useful. This is the only place in the product that rejects an
 * entry outright, and it earns that because the alternative is not a worse
 * price but a meaningless one: a number the owner will read as their bag's
 * value when it is the average of that brand's entire catalogue.
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

  -- The refusal. Cards are exempt: a card's name IS its model, and there is no
  -- brand to strip.
  if p_category in ('watch','bag','sneaker','car')
     and public.is_brand_only(p_category, v_terms) then
    raise exception 'item_needs_model';
  end if;

  v_model := public.match_brand_model(p_category, v_terms);

  if v_model.id is not null then
    -- A known model. Its query was written once and checked, which is better
    -- than anything assembled from free text at insert time.
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
    -- Unknown model, known-enough text. Same construction as 0012.
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
        if v_is_japanese then
          v_source_type := 'rakuten'; v_currency := 'JPY';
        else
          v_source_type := 'ebay'; v_currency := 'USD';
        end if;
        v_search_query := v_terms;
      else
        -- 'other' has no marketplace that could answer it. Created for a
        -- self-reported valuation rather than a feed.
        v_source_type := 'curated'; v_currency := 'JPY';
        v_search_query := null;
    end case;
  end if;

  insert into public.market_items
    (category, name, detail, identifier, search_query, source_type, currency,
     min_price, max_price, created_by)
  values
    (p_category, v_name, v_detail, v_identifier, v_search_query, v_source_type,
     v_currency, v_min, v_max, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_market_item(text, text, text, text) from public;
grant execute on function public.create_market_item(text, text, text, text) to authenticated;

-- ===========================================================================
-- PART 2 — provenance on the admin screens
-- ===========================================================================

/** Top items, now with the URL that shows where the price came from. */
create or replace function public.admin_top_items(p_limit int default 100)
returns table (
  item_id       uuid,
  name          text,
  category      text,
  holders       bigint,
  current_price numeric,
  currency      text,
  confidence    text,
  source_type   text,
  search_query  text,
  source_url    text,
  price_updated_at timestamptz,
  user_added    boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    mi.id, mi.name, mi.category,
    count(distinct h.user_id),
    mi.current_price, mi.currency, mi.data_confidence,
    mi.source_type, mi.search_query,
    -- The whole point: one click to the listings the median was taken over.
    mi.price_debug ->> 'webUrl',
    mi.price_updated_at,
    mi.created_by is not null
  from public.market_items mi
  join public.holdings h on h.market_item_id = mi.id
  where public.is_admin()
  group by mi.id, mi.name, mi.category, mi.current_price, mi.currency,
           mi.data_confidence, mi.source_type, mi.search_query, mi.price_debug,
           mi.price_updated_at, mi.created_by
  order by count(distinct h.user_id) desc, mi.name
  limit p_limit;
$$;

grant execute on function public.admin_top_items(int) to authenticated;

/** The review queue, same addition. */
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
  max_price     numeric,
  current_price numeric,
  currency      text,
  source_url    text,
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
    mi.source_type, mi.aliases, mi.min_price, mi.max_price, mi.current_price,
    mi.currency, mi.price_debug ->> 'webUrl',
    (select count(*) from public.holdings h where h.market_item_id = mi.id),
    mi.created_at, mi.created_by
  from public.market_items mi
  where public.is_admin()
    and mi.approved_at is null
  order by mi.created_at desc
  limit p_limit;
$$;

grant execute on function public.admin_pending_items(int) to authenticated;

-- ===========================================================================
-- PART 3 — merging duplicates
-- ===========================================================================

/**
 * Items that look like the same thing written two ways.
 *
 * Grouped on the normalised name — case folded, spaces and punctuation
 * removed — which is exactly the class of difference the report described.
 * Nothing is merged automatically: "Kelly 25" and "Kelly 28" normalise apart
 * correctly, but "Speedy 25" and "Speedy 30" would too, and the one case where
 * a machine cannot tell is precisely the case where a person can.
 */
create or replace function public.admin_duplicate_items()
returns table (
  norm       text,
  category   text,
  ids        uuid[],
  names      text[],
  holders    bigint[],
  prices     numeric[],
  approved   boolean[]
)
language sql
security definer
stable
set search_path = public
as $$
  select
    public.normalise_model_text(mi.name) as norm,
    mi.category,
    array_agg(mi.id order by mi.created_at),
    array_agg(mi.name order by mi.created_at),
    array_agg((select count(*) from public.holdings h where h.market_item_id = mi.id)
              order by mi.created_at),
    array_agg(mi.current_price order by mi.created_at),
    array_agg(mi.approved_at is not null order by mi.created_at)
  from public.market_items mi
  where public.is_admin()
  group by public.normalise_model_text(mi.name), mi.category
  having count(*) > 1
  order by count(*) desc
  limit 100;
$$;

grant execute on function public.admin_duplicate_items() to authenticated;

/**
 * Fold one catalogue row into another.
 *
 * Everything that pointed at `p_from` is repointed at `p_into` and the source
 * row is deleted. The order below is not arbitrary — each step exists because
 * of a constraint that would otherwise abort the merge halfway.
 *
 * The hard case is a user who holds BOTH rows. `holdings` is unique on
 * (user_id, market_item_id), so repointing blindly would violate it. Their two
 * holdings have to become one, with the transactions of both, which is what the
 * first block does. A photo and a note survive from whichever row had them, the
 * target winning a tie — it is the row that is being kept.
 */
create or replace function public.merge_market_items(p_from uuid, p_into uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dup record;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_from is null or p_into is null or p_from = p_into then
    raise exception 'invalid merge';
  end if;
  if not exists (select 1 from public.market_items where id = p_from)
     or not exists (select 1 from public.market_items where id = p_into) then
    raise exception 'unknown item';
  end if;

  -- Users holding both rows: move the transactions onto the surviving holding,
  -- carry over anything the survivor is missing, then drop the empty one.
  for v_dup in
    select f.id as from_holding, i.id as into_holding
    from public.holdings f
    join public.holdings i
      on i.user_id = f.user_id and i.market_item_id = p_into
    where f.market_item_id = p_from
  loop
    update public.transactions
       set holding_id = v_dup.into_holding
     where holding_id = v_dup.from_holding;

    update public.holdings i
       set photo_path = coalesce(i.photo_path, f.photo_path),
           note       = coalesce(i.note, f.note)
      from public.holdings f
     where i.id = v_dup.into_holding and f.id = v_dup.from_holding;

    delete from public.holdings where id = v_dup.from_holding;
  end loop;

  -- Everyone else simply moves across.
  update public.holdings set market_item_id = p_into where market_item_id = p_from;

  -- The reason this feature exists: three pools of two reports each publish
  -- nothing, while one pool of six clears the three-reporter threshold and
  -- finally shows a realised price.
  update public.price_reports    set market_item_id = p_into where market_item_id = p_from;
  update public.price_snapshots  set market_item_id = p_into where market_item_id = p_from;

  -- Unique on (user_id, market_item_id): a user who valued both rows keeps the
  -- one already on the survivor, since that is the row they will go on seeing.
  delete from public.self_reported_prices s
   where s.market_item_id = p_from
     and exists (
       select 1 from public.self_reported_prices t
       where t.user_id = s.user_id and t.market_item_id = p_into
     );
  update public.self_reported_prices set market_item_id = p_into where market_item_id = p_from;

  -- Aliases accumulate, so searching the discarded spelling still finds the
  -- survivor. This is what makes a merge invisible to the people who typed the
  -- other version.
  update public.market_items t
     set aliases = btrim(
           coalesce(t.aliases, '') || ' ' || f.name || ' ' || coalesce(f.aliases, '')
         )
    from public.market_items f
   where t.id = p_into and f.id = p_from;

  delete from public.market_items where id = p_from;
end;
$$;

grant execute on function public.merge_market_items(uuid, uuid) to authenticated;

/**
 * Rename a catalogue row, and re-derive everything that follows from the name.
 *
 * The other half of the same request: an admin who can merge also needs to be
 * able to settle on one spelling. Re-running the brand rules afterwards means a
 * corrected name picks up the aliases and band the misspelling never matched.
 */
create or replace function public.admin_rename_item(p_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if length(v_name) = 0 or length(v_name) > 120 then
    raise exception 'invalid name';
  end if;

  update public.market_items
     set name = v_name,
         -- The old spelling stays searchable. Somebody typed it once and will
         -- type it again.
         aliases = btrim(coalesce(aliases, '') || ' ' || name)
   where id = p_id
     and name is distinct from v_name;

  perform public.apply_brand_rules(p_id);
end;
$$;

grant execute on function public.admin_rename_item(uuid, text) to authenticated;
