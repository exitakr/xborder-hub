-- ============================================================
-- 0004_onboarding_comp.sql — オンボーディング + 年収 Give-to-Get
--
-- 実行順: 0001 → 0002 → 0003 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
-- ============================================================

------------------------------------------------------------
-- 1. profiles.onboarded_at — オンボーディング完了フラグ
--    NOTE: 0001 の handle_new_user() が display_name を email から
--    自動設定するため「display_name is null」では新規ユーザを判定
--    できない。onboarded_at が唯一の信号。
------------------------------------------------------------

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

-- 既存ユーザは全員オンボーディング済み扱い(ウィザード強制を回避)
update public.profiles set onboarded_at = now() where onboarded_at is null;

------------------------------------------------------------
-- 2. compensation_data — 国/業界/職種を非正規化(投稿時スナップショット)
--    profiles と JOIN しない = 読者が会員と紐付けられない
------------------------------------------------------------

alter table public.compensation_data
  add column if not exists country  text,
  add column if not exists city     text,
  add column if not exists industry text,
  add column if not exists role     text;

-- 1ユーザー1行(upsert onConflict: user_id を可能にする)
create unique index if not exists compensation_data_user_unique
  on public.compensation_data (user_id);

create index if not exists compensation_data_filter_idx
  on public.compensation_data (country, industry, role);

------------------------------------------------------------
-- 3. Give-to-Get 読み取り経路
--    ベーステーブルの RLS は 0001 の owner-only のまま変更しない。
--    他人のデータは SECURITY DEFINER 関数経由のみ。user_id は返さない。
------------------------------------------------------------

create or replace function public.fetch_comp_entries(
  p_country  text default null,
  p_industry text default null,
  p_role     text default null,
  p_limit    int  default 50,
  p_offset   int  default 0
)
returns table (
  entry_id              uuid,
  country               text,
  city                  text,
  industry              text,
  role                  text,
  base_salary_range     text,
  bonus_range           text,
  has_equity            boolean,
  total_comp_range      text,
  monthly_rent_range    text,
  savings_rate_range    text,
  life_satisfaction     int,
  weekly_hours_range    text,
  remote_frequency      text,
  english_usage_rate    text,
  wlb_satisfaction      int,
  visa_type             text,
  visa_difficulty       int,
  has_pr                boolean,
  overseas_satisfaction int,
  reported_month        text  -- 月単位に丸めて匿名性を上げる
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id, c.country, c.city, c.industry, c.role,
    c.base_salary_range, c.bonus_range, c.has_equity, c.total_comp_range,
    c.monthly_rent_range, c.savings_rate_range, c.life_satisfaction,
    c.weekly_hours_range, c.remote_frequency, c.english_usage_rate,
    c.wlb_satisfaction, c.visa_type, c.visa_difficulty, c.has_pr,
    c.overseas_satisfaction,
    to_char(c.reported_at, 'YYYY-MM')
  from public.compensation_data c
  where
    -- Give-to-Get: 自分のデータを投稿済みの場合のみ全件見える
    exists (
      select 1 from public.compensation_data own
      where own.user_id = auth.uid()
    )
    and (p_country  is null or c.country  = p_country)
    and (p_industry is null or c.industry = p_industry)
    and (p_role     is null or c.role     = p_role)
  order by c.reported_at desc
  limit least(coalesce(p_limit, 50), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- ロック画面のティーザー用件数(投稿前でも件数だけは見せる)
create or replace function public.count_comp_entries()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from public.compensation_data;
$$;

revoke all on function public.fetch_comp_entries(text, text, text, int, int) from public, anon;
revoke all on function public.count_comp_entries() from public, anon;
grant execute on function public.fetch_comp_entries(text, text, text, int, int) to authenticated;
grant execute on function public.count_comp_entries() to authenticated;
