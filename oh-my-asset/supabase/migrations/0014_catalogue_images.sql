-- 0014 — Card artwork on catalogue rows.
--
-- WHY ONLY CARDS
--
-- Competing Japanese TCG portfolio apps all share one input flow: you type a
-- name, and a list comes back with the picture and the current price already
-- on it. That list is what makes the right row obvious — two printings with
-- the same name are told apart by the artwork far faster than by set codes.
--
-- The image is populated by the daily refresh, from the same response that
-- carries the price, so it costs no extra request:
--
--   * Scryfall     — `image_uris.normal` (Magic)
--   * pokemontcg.io — `images.small`     (Pokémon)
--
-- Both publish card images expressly so that collection software can display
-- them, and both are already credited on the item screen as their licences
-- require.
--
-- Watches, bags, sneakers and cars deliberately get NOTHING here. Their prices
-- come from eBay and Rakuten, whose images are sellers' own photographs of
-- their own goods: not ours to republish, not reliably the catalogue item, and
-- for luxury brands an obvious trademark problem. Those categories keep the
-- category glyph, which is why the glyph exists.

alter table public.market_items
  add column if not exists image_url text;

comment on column public.market_items.image_url is
  'Canonical card artwork from the pricing source (Scryfall / pokemontcg.io). '
  'Null for every non-card category by design — marketplace listing photos are '
  'not republishable. Written by the daily refresh, never by a client.';

-- A URL, and one we serve over TLS. The column is written by the service role
-- from a fixed set of hosts, but the constraint is what keeps that true if a
-- future writer is less careful.
alter table public.market_items
  drop constraint if exists market_items_image_url_https;

alter table public.market_items
  add constraint market_items_image_url_https
  check (image_url is null or image_url like 'https://%');
