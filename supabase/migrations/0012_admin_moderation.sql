-- ============================================================
-- 0012_admin_moderation.sql — 管理人向けダッシュボード & モデレーション
--
-- 実行順: 0001 → … → 0011 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です(create or replace)。
--
-- 0007 で profiles は owner-only SELECT になったため、管理人でも通常クエリでは
-- 会員一覧・総数を取得できない。ここでは 0003/0005/0008 と同じ
-- 「public.is_admin() で守った SECURITY DEFINER 関数」パターンで、RLS を
-- バイパスせず安全に管理人専用の読み取り/削除を提供する。
-- service_role キーは使わない(auth.users はこの関数内でのみ読む)。
-- ============================================================

------------------------------------------------------------
-- 1. 集計(真の件数)
------------------------------------------------------------
create or replace function public.admin_stats()
returns table (
  members       bigint,
  threads       bigint,
  comments      bigint,
  coffee_chats  bigint,
  communities   bigint,
  contact_new   bigint,
  chat_rooms    bigint,
  salaries      bigint,
  signups_7d    bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.threads),
    (select count(*) from public.comments),
    (select count(*) from public.coffee_chat_requests),
    (select count(*) from public.communities),
    (select count(*) from public.contact_submissions where status = 'new'),
    (select count(*) from public.chat_rooms),
    (select count(*) from public.compensation_data),
    (select count(*) from public.profiles where created_at >= now() - interval '7 days');
end;
$$;

------------------------------------------------------------
-- 2. 会員一覧(メール・最終アクセス込み)
------------------------------------------------------------
create or replace function public.admin_list_members(
  p_search text default null,
  p_limit  int  default 200,
  p_offset int  default 0
)
returns table (
  id             uuid,
  email          text,
  display_name   text,
  from_country   text,
  to_country     text,
  industry       text,
  role           text,
  onboarded_at   timestamptz,
  is_admin       boolean,
  created_at     timestamptz,
  last_sign_in_at timestamptz,
  thread_count   bigint,
  comment_count  bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select
    p.id,
    u.email::text,
    p.display_name,
    p.from_country,
    p.to_country,
    p.industry,
    p.role,
    p.onboarded_at,
    p.is_admin,
    p.created_at,
    u.last_sign_in_at,
    (select count(*) from public.threads t  where t.author_id = p.id),
    (select count(*) from public.comments c where c.author_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where
    p_search is null
    or p_search = ''
    or u.email ilike '%' || p_search || '%'
    or coalesce(p.display_name, '') ilike '%' || p_search || '%'
  order by p.created_at desc
  limit greatest(1, least(p_limit, 500))
  offset greatest(0, p_offset);
end;
$$;

------------------------------------------------------------
-- 3. スレッド一覧(モデレーション用)
------------------------------------------------------------
create or replace function public.admin_list_threads(
  p_search text default null,
  p_limit  int  default 100,
  p_offset int  default 0
)
returns table (
  id            uuid,
  title         text,
  category      text,
  author_id     uuid,
  author_name   text,
  created_at    timestamptz,
  comment_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select
    t.id,
    t.title,
    t.category,
    t.author_id,
    coalesce(p.display_name, 'メンバー'),
    t.created_at,
    (select count(*) from public.comments c where c.thread_id = t.id)
  from public.threads t
  left join public.profiles p on p.id = t.author_id
  where
    p_search is null
    or p_search = ''
    or t.title ilike '%' || p_search || '%'
  order by t.created_at desc
  limit greatest(1, least(p_limit, 300))
  offset greatest(0, p_offset);
end;
$$;

------------------------------------------------------------
-- 4. コメント一覧(モデレーション用)
------------------------------------------------------------
create or replace function public.admin_list_comments(
  p_limit  int default 100,
  p_offset int default 0
)
returns table (
  id           uuid,
  thread_id    uuid,
  thread_title text,
  author_id    uuid,
  author_name  text,
  body         text,
  created_at   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select
    c.id,
    c.thread_id,
    t.title,
    c.author_id,
    coalesce(p.display_name, 'メンバー'),
    left(c.body, 120),
    c.created_at
  from public.comments c
  left join public.threads t on t.id = c.thread_id
  left join public.profiles p on p.id = c.author_id
  order by c.created_at desc
  limit greatest(1, least(p_limit, 300))
  offset greatest(0, p_offset);
end;
$$;

------------------------------------------------------------
-- 5. 削除(任意のスレッド / コメント)
------------------------------------------------------------
create or replace function public.admin_delete_thread(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  delete from public.threads where id = p_id;
  return found;
end;
$$;

create or replace function public.admin_delete_comment(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  delete from public.comments where id = p_id;
  return found;
end;
$$;

------------------------------------------------------------
-- 6. 実行権限(認証ユーザーに付与。中身は is_admin() で守る)
------------------------------------------------------------
grant execute on function public.admin_stats()                       to authenticated;
grant execute on function public.admin_list_members(text, int, int)  to authenticated;
grant execute on function public.admin_list_threads(text, int, int)  to authenticated;
grant execute on function public.admin_list_comments(int, int)       to authenticated;
grant execute on function public.admin_delete_thread(uuid)           to authenticated;
grant execute on function public.admin_delete_comment(uuid)          to authenticated;
