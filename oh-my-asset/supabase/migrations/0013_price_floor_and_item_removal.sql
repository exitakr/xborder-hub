-- Oh My Asset — a plausibility floor, item removal, and a wider catalogue.
--
-- THE BUG THIS EXISTS TO CLOSE
-- An Hermès Birkin was priced at roughly USD 202. Nothing was broken in the
-- arithmetic: the Rakuten client asked for the thirty CHEAPEST listings, and
-- the thirty cheapest results for 「エルメス バーキン30」 are protective
-- covers, bag charms, handle wraps and storage bags. The median of that is an
-- accessory price, and because accessories agree with each other about what an
-- accessory costs, the dispersion check waved it through.
--
-- Excluding accessory terms at the source (done in the client) removes most of
-- them. This adds the backstop for the rest: a floor below which a result
-- cannot be this item, whatever the statistics say. It is not a price and is
-- never displayed as one — it only decides whether a fetched figure is
-- publishable.

alter table public.market_items
  add column if not exists min_price numeric check (min_price is null or min_price > 0);

comment on column public.market_items.min_price is
  'Lowest figure that could plausibly be this item, in the row''s own currency. A fetched price below it means the search matched accessories rather than the item, and nothing is published. Not a price and never displayed.';

-- ---------------------------------------------------------------------------
-- Floors for the items where the accessory economy is deepest. Set well below
-- any real example — the job is to exclude a ¥3,000 bag charm, not to bracket
-- the market.
-- ---------------------------------------------------------------------------
update public.market_items set min_price = 800000 where identifier in ('BIRKIN-30','BIRKIN-25');
update public.market_items set min_price = 700000 where identifier in ('KELLY-28','CONSTANCE-24');
update public.market_items set min_price = 200000 where identifier in ('EVELYNE-PM','PICOTIN-18');
update public.market_items set min_price = 300000 where identifier in ('CHANEL-CF-M','CHANEL-255-226','CHANEL-BOY-M','CHANEL-19-M');
update public.market_items set min_price = 100000 where identifier in ('CHANEL-WOC','LV-ALMA-BB','LV-SPEEDY-25','LV-NEVERFULL-MM','LV-POCHETTE-METIS');
update public.market_items set min_price = 250000 where identifier = 'LV-CAPUCINES-PM';
update public.market_items set min_price =  80000 where identifier in ('GUCCI-JACKIE-S','GUCCI-MARMONT-M','DIOR-SADDLE-M','CELINE-TRIOMPHE-M','BV-CASSETTE','LOEWE-PUZZLE-S','FENDI-BAGUETTE-M','PRADA-2005','DIOR-LADY-M','GOYARD-STL-PM');

-- ---------------------------------------------------------------------------
-- delete_my_market_item — remove a catalogue row the caller created.
--
-- Guarded on two things: they must have created it, and nobody else may be
-- holding it. Once a second person tracks an item it has stopped being one
-- user's private entry and become shared reference data, and their portfolio
-- must not lose a row because its original author tidied up.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_market_item(p_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.market_items m
   where m.id = p_item_id
     and m.created_by = auth.uid()
     and not exists (select 1 from public.holdings h where h.market_item_id = m.id);

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function public.delete_my_market_item(uuid) from public;
grant execute on function public.delete_my_market_item(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Catalogue: jewellery, more watches, more bag sizes.
--
-- The gap this fills is specificity. A collector does not own "a Cartier
-- watch"; they own a Tank Must in large. Sizes and references are separate
-- rows because they are separate markets — a Birkin 25 and a Birkin 35 do not
-- trade at the same price, and one row for "Birkin" could only ever be wrong
-- for both.
--
-- Jewellery joins the `bag` category rather than gaining its own: the category
-- is a filter for browsing, and a new one would need a glyph, a label in two
-- languages and a place in every picker for four rows of content. It is worth
-- splitting out once there are enough of them to browse.
-- ---------------------------------------------------------------------------
insert into public.market_items
  (category, name, detail, identifier, search_query, source_type, currency, aliases, min_price)
values
  -- Hermès jewellery and small leather goods
  ('bag','Hermès Chaîne d''Ancre Bracelet','Silver, MM','HERMES-CDA-MM','エルメス シェーヌダンクル ブレスレット MM','rakuten','JPY','エルメス シェーヌダンクル Hermes Chaine d Ancre bracelet',150000),
  ('bag','Hermès Chaîne d''Ancre Bracelet','Silver, GM','HERMES-CDA-GM','エルメス シェーヌダンクル ブレスレット GM','rakuten','JPY','エルメス シェーヌダンクル Hermes Chaine d Ancre bracelet',250000),
  ('bag','Hermès Kelly Bracelet','Leather, PM','HERMES-KELLY-BR','エルメス ケリー ブレスレット','rakuten','JPY','エルメス ケリーブレス Hermes Kelly bracelet',80000),
  ('bag','Hermès Birkin 35','Togo leather','BIRKIN-35','エルメス バーキン35','rakuten','JPY','エルメス バーキン35 Hermes Birkin 35',900000),
  ('bag','Hermès Kelly 25','Epsom leather','KELLY-25','エルメス ケリー25','rakuten','JPY','エルメス ケリー25 Hermes Kelly 25',900000),
  ('bag','Hermès Garden Party 36','Negonda leather','HERMES-GP-36','エルメス ガーデンパーティ36','rakuten','JPY','エルメス ガーデンパーティ Hermes Garden Party',200000),
  ('bag','Hermès Bolide 31','Clemence leather','HERMES-BOLIDE-31','エルメス ボリード31','rakuten','JPY','エルメス ボリード Hermes Bolide',400000),

  -- Cartier jewellery
  ('bag','Cartier Love Bracelet','Yellow gold','CARTIER-LOVE-BR','カルティエ ラブブレス K18','rakuten','JPY','カルティエ ラブブレスレット Cartier Love bracelet',500000),
  ('bag','Cartier Juste un Clou Bracelet','Yellow gold','CARTIER-JUC-BR','カルティエ ジュストアンクル ブレスレット','rakuten','JPY','カルティエ ジュストアンクル Cartier Juste un Clou',400000),
  ('bag','Cartier Trinity Ring','Three-gold','CARTIER-TRINITY','カルティエ トリニティリング','rakuten','JPY','カルティエ トリニティ Cartier Trinity ring',80000),
  ('bag','Cartier Love Necklace','Yellow gold','CARTIER-LOVE-NL','カルティエ ラブ ネックレス K18','rakuten','JPY','カルティエ ラブネックレス Cartier Love necklace',200000),
  ('bag','Tiffany T Wire Bracelet','Yellow gold','TIFFANY-T-WIRE','ティファニー T ワイヤー ブレスレット K18','rakuten','JPY','ティファニー Tワイヤー Tiffany T wire',100000),
  ('bag','Van Cleef Alhambra Necklace','Vintage, 10 motifs','VCA-ALHAMBRA-10','ヴァンクリーフ アルハンブラ ネックレス 10モチーフ','rakuten','JPY','ヴァンクリーフ アルハンブラ Van Cleef Alhambra',900000),
  ('bag','Bulgari B.zero1 Ring','4-band','BVLGARI-BZERO1','ブルガリ ビーゼロワン リング','rakuten','JPY','ブルガリ ビーゼロワン Bulgari B.zero1',150000),

  -- Cartier and other watches
  ('watch','Cartier Tank Must Large','Steel, quartz','CARTIER-TANK-MUST-L','カルティエ タンク マスト LM','rakuten','JPY','カルティエ タンクマスト Cartier Tank Must',350000),
  ('watch','Cartier Santos Large','Steel, automatic','CARTIER-SANTOS-L','カルティエ サントス LM','rakuten','JPY','カルティエ サントス Cartier Santos',700000),
  ('watch','Cartier Ballon Bleu 36mm','Steel','CARTIER-BALLON-36','カルティエ バロンブルー 36','rakuten','JPY','カルティエ バロンブルー Cartier Ballon Bleu',400000),
  ('watch','Cartier Panthère Medium','Steel','CARTIER-PANTHERE-M','カルティエ パンテール MM','rakuten','JPY','カルティエ パンテール Cartier Panthere',500000),
  ('watch','Rolex Datejust 36','Steel/white gold','ROLEX-DJ-36','ロレックス デイトジャスト36','rakuten','JPY','ロレックス デイトジャスト Rolex Datejust 36',900000),
  ('watch','Rolex Oyster Perpetual 36','Steel','ROLEX-OP-36','ロレックス オイスターパーペチュアル36','rakuten','JPY','ロレックス オイスターパーペチュアル Rolex OP',900000),
  ('watch','Omega Speedmaster 38','Co-Axial','OMEGA-SPEED-38','オメガ スピードマスター 38','rakuten','JPY','オメガ スピードマスター Omega Speedmaster 38',400000),
  ('watch','Grand Seiko SBGX261','Quartz, 37mm','GS-SBGX261','グランドセイコー SBGX261','rakuten','JPY','グランドセイコー Grand Seiko SBGX261',200000),
  ('watch','IWC Portofino Automatic 40','Steel','IWC-PORTOFINO-40','IWC ポートフィノ オートマティック','rakuten','JPY','IWC ポートフィノ Portofino',400000),
  ('watch','Jaeger-LeCoultre Reverso Classic','Medium','JLC-REVERSO-CL','ジャガールクルト レベルソ クラシック','rakuten','JPY','ジャガールクルト レベルソ JLC Reverso',600000),

  -- More bag sizes, where size is the market
  ('bag','Chanel Classic Flap Small','Caviar, gold hardware','CHANEL-CF-S','シャネル マトラッセ 23 チェーンショルダー','rakuten','JPY','シャネル マトラッセ23 Chanel Classic Flap small',700000),
  ('bag','Chanel Classic Flap Large','Caviar','CHANEL-CF-L','シャネル マトラッセ 30 チェーンショルダー','rakuten','JPY','シャネル マトラッセ30 Chanel Classic Flap large',900000),
  ('bag','Louis Vuitton Neverfull PM','Monogram','LV-NEVERFULL-PM','ルイヴィトン ネヴァーフル PM','rakuten','JPY','ルイヴィトン ネヴァーフルPM LV Neverfull PM',100000),
  ('bag','Louis Vuitton Speedy 30','Monogram','LV-SPEEDY-30','ルイヴィトン スピーディ 30','rakuten','JPY','ルイヴィトン スピーディ30 LV Speedy 30',80000),
  ('bag','Loewe Puzzle Bag Medium','Calfskin','LOEWE-PUZZLE-M','ロエベ パズルバッグ ミディアム','rakuten','JPY','ロエベ パズル Loewe Puzzle medium',150000),
  ('bag','Bottega Veneta Jodie Mini','Intrecciato leather','BV-JODIE-MINI','ボッテガヴェネタ ジョディ ミニ','rakuten','JPY','ボッテガヴェネタ ジョディ Bottega Jodie mini',150000),
  ('bag','Bottega Veneta Andiamo Small','Intrecciato leather','BV-ANDIAMO-S','ボッテガヴェネタ アンディアーモ スモール','rakuten','JPY','ボッテガヴェネタ アンディアーモ Bottega Andiamo',300000),
  ('bag','Celine Belt Bag Micro','Grained calfskin','CELINE-BELT-MICRO','セリーヌ ベルトバッグ マイクロ','rakuten','JPY','セリーヌ ベルトバッグ Celine Belt bag',150000),
  ('bag','Saint Laurent Loulou Medium','Quilted leather','YSL-LOULOU-M','サンローラン ルル ミディアム','rakuten','JPY','サンローラン ルル YSL Loulou',150000),
  ('bag','Hermès Picotin Lock 22','Clemence leather','PICOTIN-22','エルメス ピコタンロック22','rakuten','JPY','エルメス ピコタン22 Hermes Picotin 22',250000)
on conflict (identifier) where identifier is not null do nothing;

-- ---------------------------------------------------------------------------
-- Guard: every fetchable row still needs a query (same invariant as 0010).
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
