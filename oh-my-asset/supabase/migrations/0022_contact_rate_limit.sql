-- 0022 — The contact form cannot be used as a firehose.
--
-- THE HOLE
--
-- Migration 0011 gave contact_messages this insert policy:
--
--   for insert with check (user_id is null or user_id = auth.uid())
--
-- which is correct about attribution and silent about volume. `user_id is
-- null` is the signed-out case, and it is satisfied by anyone at all — the
-- anon key is published in the browser bundle by design, so a stranger with
-- curl can insert rows for as long as they care to. Nothing in the app is
-- between them and the table: the server action is one client of PostgREST,
-- not a gate in front of it.
--
-- The cost is not a leak. It is the admin dashboard becoming unusable, the
-- table growing without bound, and every real support message being buried
-- under whatever was pointed at it.
--
-- WHERE THE FIX HAS TO LIVE
--
-- In the database, for the same reason: a check inside the server action
-- protects the server action. Rate limiting by IP address is not available
-- here — Postgres cannot see one — so the throttle is on the two things it CAN
-- see, the sender's own claimed address and the total rate of anonymous
-- messages. Neither is proof against a determined flood; both are enough to
-- make it expensive and noisy rather than free.

-- ---------------------------------------------------------------------------
-- direct insert is withdrawn
-- ---------------------------------------------------------------------------
-- Everything now goes through submit_contact(), which is the only way to add a
-- row that also counts them.
drop policy if exists "anyone can send" on public.contact_messages;

/**
 * File a support message.
 *
 * The limits, and why each number is what it is:
 *
 *  - 3 per address per hour. A person who genuinely needs to write twice can;
 *    a script cannot make progress by rotating subject lines.
 *  - 60 anonymous messages per hour across the whole table. This is the one
 *    that matters, because a flood rotates addresses. It is set well above any
 *    plausible real day and well below "the dashboard is now useless".
 *
 * A signed-in sender is exempt from the global cap and not from their own:
 * creating accounts to raise the ceiling costs an email address each time,
 * which is the point.
 *
 * Refusals raise rather than return quietly. The caller distinguishes them by
 * message and shows the sender something true — "you have sent several already,
 * try later" is a different sentence from "that did not save".
 */
create or replace function public.submit_contact(
  p_email   text,
  p_subject text,
  p_body    text,
  p_locale  text default 'ja'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_email text := btrim(p_email);
  v_recent int;
begin
  if v_email is null or length(v_email) < 3 or position('@' in v_email) = 0 then
    raise exception 'contact_invalid_email';
  end if;
  if btrim(coalesce(p_subject, '')) = '' or btrim(coalesce(p_body, '')) = '' then
    raise exception 'contact_invalid_body';
  end if;
  if p_locale not in ('ja', 'en') then
    raise exception 'contact_invalid_locale';
  end if;

  select count(*) into v_recent
    from public.contact_messages
   where lower(email) = lower(v_email)
     and created_at > now() - interval '1 hour';
  if v_recent >= 3 then
    raise exception 'contact_rate_limited';
  end if;

  if v_user is null then
    select count(*) into v_recent
      from public.contact_messages
     where user_id is null
       and created_at > now() - interval '1 hour';
    if v_recent >= 60 then
      raise exception 'contact_rate_limited';
    end if;
  end if;

  insert into public.contact_messages (user_id, email, subject, body, locale)
  values (
    v_user,
    v_email,
    -- Trimmed to the column's own limits rather than rejected: a long message
    -- from someone with a real problem should arrive truncated, not vanish.
    left(btrim(p_subject), 120),
    left(btrim(p_body), 4000),
    p_locale
  );
end;
$$;

-- Callable without a session: the form is on a public page, and someone who
-- cannot sign in is exactly the person most likely to need it.
grant execute on function public.submit_contact(text, text, text, text) to anon, authenticated;

comment on function public.submit_contact is
  'The only write path into contact_messages. Throttled per sender address and, '
  'for anonymous senders, in aggregate — see migration 0022.';
