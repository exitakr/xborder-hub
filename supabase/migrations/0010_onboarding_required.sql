-- 0010_onboarding_required.sql
--
-- (1) Stop auto-filling display_name with the email local-part. New profile
--     rows get NULL so the user is forced through /welcome.
-- (2) Backfill: existing rows whose display_name still equals the email
--     local-part get display_name AND onboarded_at NULL'd so middleware
--     redirects them through /welcome on next login (the user explicitly
--     wants no email-looking names to remain).
-- Idempotent — safe to re-run.

------------------------------------------------------------
-- 1. New handle_new_user(): no email fallback for display_name
------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- 2. Backfill existing email-derived display names
------------------------------------------------------------

update public.profiles p
set display_name = null,
    onboarded_at = null
from auth.users u
where p.id = u.id
  and p.display_name is not null
  and p.display_name = split_part(u.email, '@', 1);
