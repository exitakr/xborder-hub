-- 0021 — Free plan drops to 10 items; unlimited drops to ¥100.
--
-- The old numbers were 20 items and ¥500, chosen before anyone had used the
-- app. Both were wrong in the same direction: the limit was far enough away
-- that most people would never see it, and the price was high enough to need a
-- decision. Together they meant a paywall nobody reached and, if they did,
-- hesitated at.
--
-- 10 items is reached by anyone who is genuinely cataloguing rather than
-- trying the app, which is exactly the moment the product has proved itself.
-- ¥100 is below the threshold where people deliberate — roughly a canned
-- coffee — so the decision is "yes" or "not interested", never "let me think".
--
-- What this does NOT do is change what is gated. Every price, chart, source
-- and category stays identical on both plans (see 0015 for why that matters,
-- including the Scryfall licence term that forbids paywalling its data).
create or replace function public.free_holding_limit()
returns int
language sql
immutable
as $$ select 10 $$;

comment on function public.free_holding_limit is
  'Items a free account may hold. Changing this number changes the product; '
  'the /plan screen and the landing page read it from here (or mirror it) so '
  'the three can never disagree.';
