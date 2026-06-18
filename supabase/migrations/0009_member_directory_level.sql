-- ============================================================
-- 0009_member_directory_level.sql — 検索カードの "Lv.N" 表示用
--
-- 実行順: 0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → 0008 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- fetch_member_directory に `level int` 列を追加します。
-- レベル定義:
--   Lv = max(国・業界・企業・職種 それぞれの distinct 数), 最低 1
-- 1 件の経歴 → 全軸 1 → Lv.1
-- 同じ会社・国・業界で職種だけ違う行を追加 → 職種=2 → Lv.2
-- ============================================================

-- CREATE OR REPLACE FUNCTION で戻り値の列を変えるのは Postgres ではエラーに
-- なるため、一旦 DROP して作り直す(冪等)。
drop function if exists public.fetch_member_directory(int, int);

create or replace function public.fetch_member_directory(
  p_limit  int default 100,
  p_offset int default 0
)
returns table (
  id                   uuid,
  display_name         text,
  age                  int,
  bio                  text,
  from_country         text,
  from_city            text,
  to_country           text,
  to_city              text,
  industry             text,
  role                 text,
  tenure               text,
  companies            text,
  allow_coffee_chat    boolean,
  onboarded_at         timestamptz,
  level                int
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return query
  with rows as (
    select
      p.id, p.display_name, p.age, p.bio,
      p.from_country, p.from_city, p.to_country, p.to_city,
      p.industry, p.role, p.tenure,
      coalesce(p.visibility_settings, '{}'::jsonb) as vs,
      p.career, p.updated_at, p.onboarded_at
    from public.profiles p
    where p.display_name is not null
      and trim(p.display_name) <> ''
      and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    order by p.updated_at desc
    limit greatest(0, least(coalesce(p_limit, 100), 200))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    r.id, r.display_name, r.age, r.bio,
    r.from_country, r.from_city, r.to_country, r.to_city,
    r.industry, r.role, r.tenure,
    case
      when coalesce((r.vs->>'show_companies')::boolean, false) = false then '—'
      when r.career is null or jsonb_typeof(r.career) <> 'array' then '—'
      else coalesce((
        select string_agg(step->>'company', ' → ' order by
          coalesce(nullif(step->>'startYear',''),'0')::int * 100 +
          coalesce(nullif(step->>'startMonth',''),'0')::int)
        from jsonb_array_elements(r.career) as step
        where coalesce(trim(step->>'company'), '') <> ''
      ), '—')
    end,
    coalesce((r.vs->>'allow_coffee_chat')::boolean, true),
    r.onboarded_at,
    -- Career level: max distinct count across country / industry / company / role.
    -- Empty / non-array career → 1 (matches the client lib/profile/level.ts default).
    case
      when r.career is null or jsonb_typeof(r.career) <> 'array' then 1
      else greatest(
        1,
        coalesce((
          select count(distinct lower(trim(step->>'country')))
          from jsonb_array_elements(r.career) as step
          where coalesce(trim(step->>'country'), '') <> ''
        )::int, 0),
        coalesce((
          select count(distinct lower(trim(step->>'industry')))
          from jsonb_array_elements(r.career) as step
          where coalesce(trim(step->>'industry'), '') <> ''
        )::int, 0),
        coalesce((
          select count(distinct lower(trim(step->>'company')))
          from jsonb_array_elements(r.career) as step
          where coalesce(trim(step->>'company'), '') <> ''
        )::int, 0),
        coalesce((
          select count(distinct lower(trim(step->>'role')))
          from jsonb_array_elements(r.career) as step
          where coalesce(trim(step->>'role'), '') <> ''
        )::int, 0)
      )
    end
  from rows r;
end;
$$;

revoke all on function public.fetch_member_directory(int, int) from public, anon;
grant execute on function public.fetch_member_directory(int, int) to authenticated;
