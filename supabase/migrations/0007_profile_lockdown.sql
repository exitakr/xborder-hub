-- ============================================================
-- 0007_profile_lockdown.sql — プロフィールPIIをRLSで完全に保護
--
-- 実行順: 0001 → 0002 → 0003 → 0004 → 0005 → 0006 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- ❗ 公開前必須(セキュリティ修正):
-- これまで profiles テーブルは「全認証ユーザーが SELECT * 可能」
-- (using (true))だったため、攻撃者が会員登録すれば直接 anon-key で
-- 全会員の visa/salary/career(企業名・年収・実績)を抜き出せました。
-- visibility_settings によるフィルタはサーバー側のみで、anon-key で
-- 直叩きされると bypass できる状態でした。
--
-- 修正方針:
--   1. profiles と career_profile を「自分の行のみ SELECT 可」に変更
--   2. 他人のプロフィールは SECURITY DEFINER の RPC 経由でのみ取得
--      (3 つの RPC: 単独 / メンバー一覧 / 投稿者バイライン)
--   3. RPC は visibility_settings を必ず適用、user_id は返さない
-- ============================================================

------------------------------------------------------------
-- 1. ベーステーブルの SELECT ポリシーを「自分のみ」に変更
------------------------------------------------------------

drop policy if exists "profiles_select_auth"   on public.profiles;
drop policy if exists "profiles_select_own"    on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "career_select_auth"     on public.career_profile;
drop policy if exists "career_select_own"      on public.career_profile;
create policy "career_select_own"
  on public.career_profile for select
  to authenticated
  using (auth.uid() = user_id);

------------------------------------------------------------
-- 2. 他人のプロフィール取得用 RPC: 単独
--    visibility_settings.show_companies / show_salary / show_skills /
--    show_visa を適用して、非公開の列は NULL / 空配列 / 空文字に。
--    career(jsonb) 内の会社名・年収もステップごとに gate。
------------------------------------------------------------

create or replace function public.fetch_public_profile(p_id uuid)
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
  visa                 text,
  salary               text,
  tech_skills          text[],
  business_skills      text[],
  goal_country         text,
  goal_industry        text,
  goal_role            text,
  goal_salary          text,
  cc_topics            text,
  career               jsonb,
  visibility_settings  jsonb,
  onboarded_at         timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v        jsonb;
  show_co  boolean;
  show_sal boolean;
  show_sk  boolean;
  show_vs  boolean;
begin
  select coalesce(visibility_settings, '{}'::jsonb) into v
    from public.profiles where profiles.id = p_id;
  if v is null then
    return; -- not found
  end if;
  show_co  := coalesce((v->>'show_companies')::boolean, false);
  show_sal := coalesce((v->>'show_salary')::boolean,    false);
  show_sk  := coalesce((v->>'show_skills')::boolean,    true);
  show_vs  := coalesce((v->>'show_visa')::boolean,      false);

  return query
  select
    p.id,
    p.display_name,
    p.age,
    p.bio,
    p.from_country,
    p.from_city,
    p.to_country,
    p.to_city,
    p.industry,
    p.role,
    p.tenure,
    case when show_vs  then p.visa            else null end,
    case when show_sal then p.salary          else null end,
    case when show_sk  then coalesce(p.tech_skills,     '{}') else '{}'::text[] end,
    case when show_sk  then coalesce(p.business_skills, '{}') else '{}'::text[] end,
    p.goal_country,
    p.goal_industry,
    p.goal_role,
    case when show_sal then p.goal_salary     else null end,
    p.cc_topics,
    -- career(jsonb): ステップごとに company / salary を gate
    case
      when p.career is null or jsonb_typeof(p.career) <> 'array' then '[]'::jsonb
      else coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id',           step->>'id',
            'country',      step->>'country',
            'company',      case when show_co  then step->>'company' else '' end,
            'industry',     step->>'industry',
            'role',         step->>'role',
            'salary',       case when show_sal then step->>'salary'  else '' end,
            'startYear',    step->>'startYear',
            'startMonth',   step->>'startMonth',
            'endYear',      step->>'endYear',
            'endMonth',     step->>'endMonth',
            'achievements', step->>'achievements',
            'current',      coalesce((step->>'current')::boolean, false)
          )
        )
        from jsonb_array_elements(p.career) as step
      ), '[]'::jsonb)
    end,
    p.visibility_settings,
    p.onboarded_at
  from public.profiles p
  where p.id = p_id
    and p.display_name is not null
    and trim(p.display_name) <> '';
end;
$$;

revoke all on function public.fetch_public_profile(uuid) from public, anon;
grant execute on function public.fetch_public_profile(uuid) to authenticated;

------------------------------------------------------------
-- 3. /search のメンバー一覧 RPC
--    「安全」と判断できる列のみ返す: 表示名・年齢・自己紹介・
--    国/都市・業界/職種・滞在年数・公開状態の Coffee Chat / Companies。
--    会社名は show_companies 有効時のみ、career の最後の会社のみ。
--    visa/salary/skills/career 詳細は一覧では返さない。
------------------------------------------------------------

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
  onboarded_at         timestamptz
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
    r.onboarded_at
  from rows r;
end;
$$;

revoke all on function public.fetch_member_directory(int, int) from public, anon;
grant execute on function public.fetch_member_directory(int, int) to authenticated;

------------------------------------------------------------
-- 4. スレッド/コメントのバイライン用 RPC(最小列のみ)
--    複数の author_id をまとめて 1 クエリで解決するため id 配列で受ける。
--    visa/salary/career 等の機微情報は返さない。
------------------------------------------------------------

create or replace function public.fetch_author_bylines(p_ids uuid[])
returns table (
  id            uuid,
  display_name  text,
  industry      text,
  role          text,
  to_country    text,
  from_country  text,
  onboarded_at  timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id, p.display_name, p.industry, p.role,
    p.to_country, p.from_country, p.onboarded_at
  from public.profiles p
  where p.id = any(coalesce(p_ids, '{}'::uuid[]))
    and p.display_name is not null;
$$;

revoke all on function public.fetch_author_bylines(uuid[]) from public, anon;
grant execute on function public.fetch_author_bylines(uuid[]) to authenticated;
