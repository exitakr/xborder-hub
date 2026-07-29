-- KURA — starter catalogue.
--
-- Text only. SPEC §1.2: no official product imagery is stored or referenced;
-- names and reference numbers are descriptive/nominative use, which is what
-- makes a catalogue like this lawful. The app renders a category glyph as the
-- fallback visual, and the only photos it ever shows are ones users took.
--
-- `search_query` is the string handed to eBay Browse. Keep it tight — a loose
-- query pulls in accessories and empty boxes and poisons the median.
-- Items with source_type='curated' have no automatic feed and are priced by an
-- admin in /admin/prices.

insert into public.market_items
  (category, name, detail, identifier, search_query, source_type, currency)
values
  -- ------------------------------------------------------------------ watches
  ('watch','Rolex Submariner Date','41mm, black dial','126610LN','Rolex Submariner 126610LN','ebay','USD'),
  ('watch','Rolex Submariner No-Date','41mm','124060','Rolex Submariner 124060','ebay','USD'),
  ('watch','Rolex GMT-Master II','"Pepsi", Jubilee','126710BLRO','Rolex GMT Master II 126710BLRO','ebay','USD'),
  ('watch','Rolex Daytona','Steel, white dial','126500LN','Rolex Daytona 126500LN','ebay','USD'),
  ('watch','Rolex Datejust 41','Steel/white gold, fluted','126334','Rolex Datejust 126334','ebay','USD'),
  ('watch','Rolex Explorer I','36mm','124270','Rolex Explorer 124270','ebay','USD'),
  ('watch','Omega Speedmaster Professional','Moonwatch, hesalite','310.30.42.50.01.001','Omega Speedmaster 310.30.42.50.01.001','ebay','USD'),
  ('watch','Omega Seamaster Diver 300M','42mm, black','210.30.42.20.01.001','Omega Seamaster 210.30.42.20.01.001','ebay','USD'),
  ('watch','Tudor Black Bay 58','39mm, black','79030N','Tudor Black Bay 58 79030N','ebay','USD'),
  ('watch','Grand Seiko Snowflake','Spring Drive','SBGA211','Grand Seiko SBGA211','ebay','USD'),
  ('watch','Seiko Prospex Diver','"Turtle"','SRPE93','Seiko SRPE93','ebay','USD'),
  ('watch','Cartier Santos Medium','Steel','WSSA0029','Cartier Santos WSSA0029','ebay','USD'),
  ('watch','Audemars Piguet Royal Oak','41mm, steel','15500ST','Audemars Piguet 15500ST','ebay','USD'),
  ('watch','Patek Philippe Nautilus','40mm, steel','5711/1A','Patek Philippe 5711/1A','ebay','USD'),

  -- ----------------------------------------------------------------- sneakers
  ('sneaker','Nike Air Jordan 1 High OG','Chicago Lost & Found','DZ5485-612','Air Jordan 1 Chicago Lost and Found DZ5485-612','ebay','USD'),
  ('sneaker','Nike Air Jordan 1 High OG','Bred Toe','555088-610','Air Jordan 1 Bred Toe 555088-610','ebay','USD'),
  ('sneaker','Nike Air Jordan 4 Retro','Black Cat (2020)','CU1110-010','Air Jordan 4 Black Cat CU1110-010','ebay','USD'),
  ('sneaker','Nike Dunk Low','Panda / White Black','DD1391-100','Nike Dunk Low Panda DD1391-100','ebay','USD'),
  ('sneaker','Nike SB Dunk Low','Travis Scott','CT5053-001','Nike SB Dunk Travis Scott CT5053-001','ebay','USD'),
  ('sneaker','Adidas Yeezy Boost 350 V2','Zebra','CP9654','Yeezy Boost 350 V2 Zebra CP9654','ebay','USD'),
  ('sneaker','Adidas Yeezy Boost 350 V2','Beluga Reflective','GW1229','Yeezy Boost 350 V2 Beluga GW1229','ebay','USD'),
  ('sneaker','Adidas Samba OG','White/Black','B75806','Adidas Samba OG B75806','ebay','USD'),
  ('sneaker','New Balance 990v6','Grey','M990GL6','New Balance M990GL6','ebay','USD'),
  ('sneaker','New Balance 550','White/Green','BB550WT1','New Balance BB550WT1','ebay','USD'),
  ('sneaker','Nike Air Force 1 Low','Triple White','CW2288-111','Nike Air Force 1 CW2288-111','ebay','USD'),
  ('sneaker','Asics Gel-Kayano 14','Cream/Black','1201A161','Asics Gel Kayano 14 1201A161','ebay','USD'),

  -- ----------------------------------------------------- trading cards (TCG)
  ('tcg','Black Lotus','Unlimited, MTG','MTG-ULT-BL','Black Lotus Unlimited PSA','ebay','USD'),
  ('tcg','Mox Sapphire','Unlimited, MTG','MTG-ULT-MS','Mox Sapphire Unlimited PSA','ebay','USD'),
  ('tcg','Tarmogoyf','Future Sight, MTG','MTG-FUT-TG','Tarmogoyf Future Sight','ebay','USD'),
  ('tcg','Ragavan, Nimble Pilferer','Modern Horizons 2','MTG-MH2-RG','Ragavan Nimble Pilferer MH2','ebay','USD'),
  ('tcg','Blue-Eyes White Dragon','LOB, 1st Edition','YGO-LOB-001','Blue-Eyes White Dragon LOB-001 1st Edition PSA','ebay','USD'),
  ('tcg','Dark Magician','LOB, 1st Edition','YGO-LOB-005','Dark Magician LOB-005 1st Edition PSA','ebay','USD'),
  ('tcg','Exodia the Forbidden One','LOB, 1st Edition','YGO-LOB-124','Exodia the Forbidden One LOB-124 PSA','ebay','USD'),
  ('tcg','Red-Eyes Black Dragon','LOB, 1st Edition','YGO-LOB-070','Red-Eyes Black Dragon LOB-070 PSA','ebay','USD'),

  -- ------------------------------------------------------------ Pokémon cards
  ('pokemon','Charizard','Base Set, Holo, PSA 9','BS-004-PSA9','Charizard Base Set Holo PSA 9','ebay','USD'),
  ('pokemon','Charizard','Base Set, Holo, PSA 10','BS-004-PSA10','Charizard Base Set Holo PSA 10','ebay','USD'),
  ('pokemon','Blastoise','Base Set, Holo, PSA 9','BS-002-PSA9','Blastoise Base Set Holo PSA 9','ebay','USD'),
  ('pokemon','Venusaur','Base Set, Holo, PSA 9','BS-015-PSA9','Venusaur Base Set Holo PSA 9','ebay','USD'),
  ('pokemon','Pikachu Illustrator','Promo','PROMO-ILL','Pikachu Illustrator PSA','ebay','USD'),
  ('pokemon','Umbreon VMAX','Evolving Skies, Alt Art','EVS-215','Umbreon VMAX Alt Art 215 PSA 10','ebay','USD'),
  ('pokemon','Rayquaza VMAX','Evolving Skies, Alt Art','EVS-218','Rayquaza VMAX Alt Art 218 PSA 10','ebay','USD'),
  ('pokemon','Giratina V','Lost Origin, Alt Art','LOR-186','Giratina V Alt Art 186 PSA 10','ebay','USD'),
  -- Japanese-market cards: thin liquidity on eBay, so these are curated.
  ('pokemon','リザードン ex','SAR、日本語版','SV-JP-RIZA',null,'curated','JPY'),
  ('pokemon','ミュウツー','旧裏面、プロモ','JP-OLD-MEW',null,'curated','JPY'),

  -- --------------------------------------------------------------------- bags
  -- Hermès and similar have no reliable public feed; priced by curation only.
  ('bag','Hermès Birkin 30','Togo leather','BIRKIN-30',null,'curated','JPY'),
  ('bag','Hermès Kelly 28','Epsom leather','KELLY-28',null,'curated','JPY'),
  ('bag','Hermès Constance 24','Box leather','CONSTANCE-24',null,'curated','JPY'),
  ('bag','Chanel Classic Flap Medium','Caviar, gold hardware','CHANEL-CF-M',null,'curated','JPY'),
  ('bag','Chanel 2.55 Reissue 226','Aged calfskin','CHANEL-255-226',null,'curated','JPY'),
  ('bag','Louis Vuitton Neverfull MM','Monogram','LV-NEVERFULL-MM','Louis Vuitton Neverfull MM Monogram','ebay','USD'),
  ('bag','Louis Vuitton Speedy 25','Damier Ebene','LV-SPEEDY-25','Louis Vuitton Speedy 25 Damier','ebay','USD'),
  ('bag','Gucci Jackie 1961 Small','Leather','GUCCI-JACKIE-S','Gucci Jackie 1961 small','ebay','USD'),
  ('bag','Dior Lady Dior Medium','Cannage lambskin','DIOR-LADY-M',null,'curated','JPY'),
  ('bag','Goyard Saint Louis PM','Goyardine','GOYARD-STL-PM',null,'curated','JPY')
on conflict do nothing;
