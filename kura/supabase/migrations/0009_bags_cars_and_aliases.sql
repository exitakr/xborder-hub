-- KURA — more bags, a car category, and bilingual search aliases.
--
-- Two problems this addresses:
--
-- 1. Browse had too little in it. Ten bag rows and no cars meant most brand
--    searches came back thin or empty, which reads as a broken catalogue
--    rather than as "this app has 70 items so far."
-- 2. Every catalogue row is named in English (Hermès, not エルメス), so a
--    Japanese-language search for a Japanese-market app's flagship category
--    matched nothing. `aliases` (0008) exists for exactly this; this
--    migration is the first thing to actually populate it.

-- ---------------------------------------------------------------------------
-- Aliases for the bags already seeded in 0002. Existing rows, not touched
-- otherwise — source_type stays whatever it already was.
-- ---------------------------------------------------------------------------
update public.market_items set aliases = 'エルメス バーキン Hermes Birkin'      where identifier = 'BIRKIN-30';
update public.market_items set aliases = 'エルメス ケリー Hermes Kelly'         where identifier = 'KELLY-28';
update public.market_items set aliases = 'エルメス コンスタンス Hermes'         where identifier = 'CONSTANCE-24';
update public.market_items set aliases = 'シャネル クラシックフラップ Chanel'   where identifier = 'CHANEL-CF-M';
update public.market_items set aliases = 'シャネル 2.55 リイシュー Chanel'      where identifier = 'CHANEL-255-226';
update public.market_items set aliases = 'ルイヴィトン ネヴァーフル LV'         where identifier = 'LV-NEVERFULL-MM';
update public.market_items set aliases = 'ルイヴィトン スピーディ LV'          where identifier = 'LV-SPEEDY-25';
update public.market_items set aliases = 'グッチ ジャッキー Gucci'             where identifier = 'GUCCI-JACKIE-S';
update public.market_items set aliases = 'ディオール レディディオール Dior'    where identifier = 'DIOR-LADY-M';
update public.market_items set aliases = 'ゴヤール サンルイ Goyard'            where identifier = 'GOYARD-STL-PM';

-- ---------------------------------------------------------------------------
-- More bags. eBay Browse (asking prices, same caveat as watches/sneakers) —
-- the realised-price gap this leaves is what migrations 0006/0007 exist to
-- fill, via community reports and self-reported valuations respectively.
-- ---------------------------------------------------------------------------
insert into public.market_items
  (category, name, detail, identifier, search_query, source_type, currency, aliases)
values
  ('bag','Hermès Birkin 25','Togo leather','BIRKIN-25','Hermes Birkin 25 Togo','ebay','USD','エルメス バーキン25 Hermes Birkin 25'),
  ('bag','Hermès Evelyne PM','Clemence leather, crossbody','EVELYNE-PM','Hermes Evelyne PM','ebay','USD','エルメス エブリン Hermes Evelyne'),
  ('bag','Hermès Picotin Lock 18','Clemence leather','PICOTIN-18','Hermes Picotin Lock 18','ebay','USD','エルメス ピコタンロック Hermes Picotin'),
  ('bag','Louis Vuitton Alma BB','Monogram','LV-ALMA-BB','Louis Vuitton Alma BB Monogram','ebay','USD','ルイヴィトン アルマ LV Alma'),
  ('bag','Louis Vuitton Capucines PM','Taurillon leather','LV-CAPUCINES-PM','Louis Vuitton Capucines PM','ebay','USD','ルイヴィトン カプシーヌ LV Capucines'),
  ('bag','Louis Vuitton Pochette Métis','Monogram','LV-POCHETTE-METIS','Louis Vuitton Pochette Metis Monogram','ebay','USD','ルイヴィトン ポシェットメティス LV Pochette Metis'),
  ('bag','Chanel Boy Medium','Calfskin, gold hardware','CHANEL-BOY-M','Chanel Boy bag medium calfskin','ebay','USD','シャネル ボーイシャネル Chanel Boy'),
  ('bag','Chanel 19 Medium','Lambskin','CHANEL-19-M','Chanel 19 bag medium lambskin','ebay','USD','シャネル19 Chanel 19'),
  ('bag','Chanel Wallet on Chain','Lambskin, WOC','CHANEL-WOC','Chanel wallet on chain lambskin','ebay','USD','シャネル ウォレットオンチェーン Chanel WOC'),
  ('bag','Gucci GG Marmont Medium','Matelassé leather','GUCCI-MARMONT-M','Gucci GG Marmont medium matelasse','ebay','USD','グッチ マーモント Gucci Marmont'),
  ('bag','Dior Saddle Bag Medium','Grained calfskin','DIOR-SADDLE-M','Dior Saddle bag medium calfskin','ebay','USD','ディオール サドルバッグ Dior Saddle'),
  ('bag','Celine Triomphe Medium','Smooth calfskin','CELINE-TRIOMPHE-M','Celine Triomphe bag medium','ebay','USD','セリーヌ トリオンフ Celine Triomphe'),
  ('bag','Bottega Veneta Cassette','Intrecciato leather','BV-CASSETTE','Bottega Veneta Cassette bag','ebay','USD','ボッテガヴェネタ カセット Bottega Cassette'),
  ('bag','Loewe Puzzle Bag Small','Calfskin','LOEWE-PUZZLE-S','Loewe Puzzle bag small','ebay','USD','ロエベ パズルバッグ Loewe Puzzle'),
  ('bag','Fendi Baguette Medium','FF canvas','FENDI-BAGUETTE-M','Fendi Baguette bag medium','ebay','USD','フェンディ バゲット Fendi Baguette'),
  ('bag','Prada Re-Edition 2005','Nylon','PRADA-2005','Prada Re-Edition 2005 nylon bag','ebay','USD','プラダ リエディション Prada Re-Edition')
-- The `where` is not a filter on the rows being inserted: it is how Postgres is
-- told which index to infer. `market_items_identifier_key` (0008) is a PARTIAL
-- unique index, and a bare `on conflict (identifier)` cannot match one —
-- inference needs the index predicate repeated verbatim, or the statement fails
-- with 42P10 before inserting anything.
on conflict (identifier) where identifier is not null do nothing;

-- ---------------------------------------------------------------------------
-- Cars. Same eBay Browse mechanism as watches and sneakers, which is the one
-- free API this app has that reaches vehicles at all — see docs/RESEARCH.md
-- §9. eBay Motors listings run noisier than a watch search (parts, diecast
-- models, and salvage titles all use the same keywords), so confidence on
-- this category should read as more approximate than the rest of the
-- catalogue in practice, though the mechanism (trimmed median, 5-sample floor)
-- is identical.
-- ---------------------------------------------------------------------------
insert into public.market_items
  (category, name, detail, identifier, search_query, source_type, currency, aliases)
values
  ('car','Porsche 911 Carrera (992)','Coupe','PORSCHE-911-992','Porsche 911 992 Carrera coupe','ebay','USD','ポルシェ 911 カレラ Porsche 911'),
  ('car','Porsche 718 Cayman','Coupe','PORSCHE-718-CAYMAN','Porsche 718 Cayman coupe','ebay','USD','ポルシェ ケイマン Porsche Cayman'),
  ('car','Ferrari 488 GTB','Coupe','FERRARI-488-GTB','Ferrari 488 GTB','ebay','USD','フェラーリ488 Ferrari 488'),
  ('car','Lamborghini Huracán','Coupe','LAMBO-HURACAN','Lamborghini Huracan coupe','ebay','USD','ランボルギーニ ウラカン Lamborghini Huracan'),
  ('car','Mercedes-Benz G63 AMG','SUV','MB-G63-AMG','Mercedes-Benz G63 AMG G-Wagon','ebay','USD','メルセデスベンツ Gクラス ゲレンデ AMG G63'),
  ('car','Mercedes-Benz S580','Sedan','MB-S580','Mercedes-Benz S580 sedan','ebay','USD','メルセデスベンツ Sクラス S580'),
  ('car','BMW M3 Competition','Sedan','BMW-M3-COMP','BMW M3 Competition sedan','ebay','USD','BMW M3 コンペティション'),
  ('car','BMW M5 Competition','Sedan','BMW-M5-COMP','BMW M5 Competition sedan','ebay','USD','BMW M5 コンペティション'),
  ('car','Bentley Continental GT','Coupe','BENTLEY-CONT-GT','Bentley Continental GT coupe','ebay','USD','ベントレー コンチネンタルGT Bentley Continental'),
  ('car','Rolls-Royce Ghost','Sedan','RR-GHOST','Rolls-Royce Ghost sedan','ebay','USD','ロールスロイス ゴースト Rolls Royce Ghost'),
  ('car','Rolls-Royce Cullinan','SUV','RR-CULLINAN','Rolls-Royce Cullinan SUV','ebay','USD','ロールスロイス カリナン Rolls Royce Cullinan'),
  ('car','Range Rover Autobiography','SUV','RR-AUTOBIOGRAPHY','Range Rover Autobiography SUV','ebay','USD','レンジローバー オートバイオグラフィー'),
  ('car','Toyota Land Cruiser 300','SUV','TOYOTA-LC300','Toyota Land Cruiser 300 SUV','ebay','USD','トヨタ ランドクルーザー ランクル300'),
  ('car','Audi RS6 Avant','Wagon','AUDI-RS6-AVANT','Audi RS6 Avant wagon','ebay','USD','アウディ RS6 アバント')
-- The `where` is not a filter on the rows being inserted: it is how Postgres is
-- told which index to infer. `market_items_identifier_key` (0008) is a PARTIAL
-- unique index, and a bare `on conflict (identifier)` cannot match one —
-- inference needs the index predicate repeated verbatim, or the statement fails
-- with 42P10 before inserting anything.
on conflict (identifier) where identifier is not null do nothing;
