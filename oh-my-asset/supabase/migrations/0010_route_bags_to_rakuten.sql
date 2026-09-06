-- Oh My Asset — actually route items to Rakuten.
--
-- WHY THIS EXISTS
-- 0006 added 'rakuten' to the source_type constraint and the app grew a working
-- Rakuten client, but no catalogue row was ever assigned to it. The source was
-- reachable in code and unreachable in practice: the cron selects by
-- source_type, and nothing matched, so RAKUTEN_APPLICATION_ID being configured
-- changed nothing at all.
--
-- Two groups move here.
--
-- 1. BAGS. eBay Browse answers them in USD from a US-centric supply; Rakuten is
--    JPY-native with a deep Japanese second-hand market for exactly these
--    brands. For a catalogue whose bag section is Hermès/Chanel/LV, that is the
--    closer market, not merely another one.
--
-- 2. THE `curated` ROWS THAT NEVER HAD A QUERY. Nine items — seven bags and two
--    Japanese-language Pokémon cards — carried search_query = null, which the
--    cron skips outright. They have shown "データ不足" since the catalogue was
--    seeded and would have done so forever; they were waiting on an admin who
--    was never going to type a price in by hand.
--
-- Queries are written in Japanese because Rakuten matches against Japanese
-- product titles. The English name that works for eBay finds far less here.

-- ---------------------------------------------------------------------------
-- Bags seeded in 0002.
-- ---------------------------------------------------------------------------
update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'エルメス バーキン30'
  where identifier = 'BIRKIN-30';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'エルメス ケリー28'
  where identifier = 'KELLY-28';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'エルメス コンスタンス24'
  where identifier = 'CONSTANCE-24';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'シャネル マトラッセ チェーンショルダー'
  where identifier = 'CHANEL-CF-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'シャネル 2.55 リイシュー'
  where identifier = 'CHANEL-255-226';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ルイヴィトン ネヴァーフル MM'
  where identifier = 'LV-NEVERFULL-MM';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ルイヴィトン スピーディ 25'
  where identifier = 'LV-SPEEDY-25';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'グッチ ジャッキー1961'
  where identifier = 'GUCCI-JACKIE-S';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ディオール レディディオール'
  where identifier = 'DIOR-LADY-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ゴヤール サンルイ PM'
  where identifier = 'GOYARD-STL-PM';

-- ---------------------------------------------------------------------------
-- Bags added in 0009.
-- ---------------------------------------------------------------------------
update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'エルメス バーキン25'
  where identifier = 'BIRKIN-25';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'エルメス エブリン PM'
  where identifier = 'EVELYNE-PM';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'エルメス ピコタンロック18'
  where identifier = 'PICOTIN-18';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ルイヴィトン アルマ BB'
  where identifier = 'LV-ALMA-BB';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ルイヴィトン カプシーヌ PM'
  where identifier = 'LV-CAPUCINES-PM';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ルイヴィトン ポシェットメティス'
  where identifier = 'LV-POCHETTE-METIS';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'シャネル ボーイシャネル'
  where identifier = 'CHANEL-BOY-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'シャネル 19 チェーンバッグ'
  where identifier = 'CHANEL-19-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'シャネル ウォレットオンチェーン'
  where identifier = 'CHANEL-WOC';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'グッチ GGマーモント'
  where identifier = 'GUCCI-MARMONT-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ディオール サドルバッグ'
  where identifier = 'DIOR-SADDLE-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'セリーヌ トリオンフ バッグ'
  where identifier = 'CELINE-TRIOMPHE-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ボッテガヴェネタ カセット'
  where identifier = 'BV-CASSETTE';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ロエベ パズルバッグ'
  where identifier = 'LOEWE-PUZZLE-S';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'フェンディ バゲット バッグ'
  where identifier = 'FENDI-BAGUETTE-M';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'プラダ リエディション2005'
  where identifier = 'PRADA-2005';

-- ---------------------------------------------------------------------------
-- The two Japanese-language Pokémon cards. pokemontcg.io indexes the English
-- printings, so a Japanese SAR or an old-back promo is not something it can
-- answer — the Japanese second-hand market is where these actually trade.
-- ---------------------------------------------------------------------------
update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ポケモンカード リザードンex SAR'
  where identifier = 'SV-JP-RIZA';

update public.market_items set
  source_type = 'rakuten', currency = 'JPY',
  search_query = 'ポケモンカード ミュウツー 旧裏面 プロモ'
  where identifier = 'JP-OLD-MEW';

-- ---------------------------------------------------------------------------
-- Guard: nothing priceable should be left without a query. `curated` is the
-- only source_type allowed to have one, and after this migration nothing uses
-- it — an item that reaches the cron with a null query is silently skipped
-- forever, which is the failure this migration exists to clear.
-- ---------------------------------------------------------------------------
do $$
declare
  stranded int;
begin
  select count(*) into stranded
    from public.market_items
   where source_type <> 'curated'
     and (search_query is null or btrim(search_query) = '');

  if stranded > 0 then
    raise exception '% item(s) have a fetchable source_type but no search_query', stranded;
  end if;
end $$;
