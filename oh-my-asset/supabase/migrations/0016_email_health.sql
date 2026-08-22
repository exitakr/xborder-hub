-- 0016 — Is the confirmation email actually arriving?
--
-- Signup failure is the most expensive failure this product has, and it is
-- almost entirely invisible: the account row is created, the app says "check
-- your email", and if the message never lands nobody finds out. The user
-- assumes they signed up. We assume they did too.
--
-- The tell is right there in auth.users and nobody was looking at it. An
-- account that was created and never confirmed is, in almost every case, an
-- email that did not arrive or was never opened. A handful is normal — people
-- change their minds. A wall of them means delivery is broken, and the sooner
-- that is a number on a dashboard rather than a support message, the fewer
-- users are lost to it.

create or replace function public.admin_email_health()
returns table (
  unconfirmed_total   bigint,
  unconfirmed_7d      bigint,
  signups_7d          bigint,
  confirmed_7d        bigint,
  -- Age of the oldest account still waiting. Hours rather than a timestamp:
  -- the question is "how long has this been broken", not "when exactly".
  oldest_pending_hours numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    (select count(*) from auth.users where email_confirmed_at is null),
    (select count(*) from auth.users
      where email_confirmed_at is null
        and created_at >= now() - interval '7 days'),
    (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    (select count(*) from auth.users
      where created_at >= now() - interval '7 days'
        and email_confirmed_at is not null),
    (select round(extract(epoch from (now() - min(created_at))) / 3600, 1)
       from auth.users where email_confirmed_at is null)
  where public.is_admin();
$$;

comment on function public.admin_email_health is
  'Confirmation-email delivery health. A high unconfirmed count is the '
  'earliest visible symptom of broken SMTP — see LAUNCH.md A-2.5.';

grant execute on function public.admin_email_health() to authenticated;
