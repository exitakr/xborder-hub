-- KURA — additional free price sources.
--
-- eBay Browse reports ASKING prices. Scryfall (MTG) and pokemontcg.io (Pokémon)
-- both publish MARKET prices for free, under documented public APIs, so for
-- those two categories they are strictly better data. Watches, bags and
-- sneakers have no equivalent and stay on eBay Browse or manual curation.
--
-- See docs/RESEARCH.md §7 for the licence obligations that come with them —
-- in particular, Scryfall data may not be placed behind a paywall.

alter table public.market_items
  drop constraint if exists market_items_source_type_check;

alter table public.market_items
  add constraint market_items_source_type_check
  check (source_type in ('ebay', 'curated', 'scryfall', 'pokemontcg'));

-- Move Magic cards onto Scryfall. `search_query` becomes the exact card name,
-- which is what the /cards/named endpoint matches on.
update public.market_items
   set source_type  = 'scryfall',
       search_query = name
 where category = 'tcg'
   and source_type = 'ebay'
   and identifier like 'MTG-%';

-- Move Pokémon cards onto pokemontcg.io. The query must be narrow: a bare name
-- matches every reprint, and their prices differ by orders of magnitude.
update public.market_items
   set source_type  = 'pokemontcg',
       search_query = 'name:"' || name || '"'
 where category = 'pokemon'
   and source_type = 'ebay';

-- Base Set cards get pinned to that set so a modern reprint cannot answer.
update public.market_items
   set search_query = 'name:"' || name || '" set.id:base1'
 where category = 'pokemon'
   and source_type = 'pokemontcg'
   and detail like 'Base Set%';

comment on column public.market_items.search_query is
  'Query string for the item''s source: an eBay Browse keyword search, an exact '
  'Scryfall card name, or a pokemontcg.io q= expression. NULL for curated items.';
