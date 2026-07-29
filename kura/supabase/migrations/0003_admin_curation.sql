-- KURA — admin price curation (SPEC §3.2, Layer 2)
--
-- market_items and price_snapshots are writable only by the service role. The
-- admin UI runs with the caller's anon key, so curation goes through a
-- SECURITY DEFINER function gated on is_admin() rather than shipping a
-- service-role key to a page. That keeps exactly one privileged path, and it is
-- auditable.

create or replace function public.admin_set_price(
  p_item_id    uuid,
  p_price      numeric,
  p_currency   text,
  p_source_url text
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

  if p_price is null or p_price <= 0 then
    raise exception 'price must be positive';
  end if;

  if p_currency not in ('JPY','SGD','USD') then
    raise exception 'unsupported currency';
  end if;

  -- Provenance is mandatory for curated prices: an unsourced number is exactly
  -- what this product promises not to display.
  if p_source_url is null or p_source_url !~ '^https?://' then
    raise exception 'source_url must be an http(s) URL';
  end if;

  -- Append to history first so the chart gains a point even if the item update
  -- is rolled back by a later error in this transaction.
  insert into public.price_snapshots (market_item_id, price, currency, sample_size, source)
  values (p_item_id, p_price, p_currency, null, 'curated');

  update public.market_items
     set current_price    = p_price,
         currency         = p_currency,
         source_url       = p_source_url,
         -- Curated prices come from a named dealer or auction result: one
         -- observation, but a reliable one. "medium" reflects that honestly.
         data_confidence  = 'medium',
         price_updated_at = now()
   where id = p_item_id;

  if not found then
    raise exception 'item not found';
  end if;
end;
$$;

revoke all on function public.admin_set_price(uuid, numeric, text, text) from public;
grant execute on function public.admin_set_price(uuid, numeric, text, text) to authenticated;

-- Promote yourself to admin after signing up:
--   update public.profiles set is_admin = true where id = '<your-auth-uid>';
