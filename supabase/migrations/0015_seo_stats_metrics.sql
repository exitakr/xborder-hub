-- ============================================================
-- 0015_seo_stats_metrics.sql — SEO集計 / KPIデータルーム / DDエクスポート
--
-- 実行順: 0001 → … → 0014 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- 1. salary_page_stats — 公開SEOページ(/salaries/[country]/[role])用の
--    匿名集計。n>=5 のときだけ分布を返す(n<5 は件数のみ→「データ募集中」)。
--    未ログインのクローラ/訪問者にも見せるため anon にも grant。
--    個別行・user_id は一切返さない。
-- 2. admin_daily_metrics — /admin KPIタブ用の日次推移(is_admin ゲート)。
--    既存テーブルの created_at から集計するので新テーブル不要。
-- 3. admin_export_comp — 買い手DD用の匿名化CSVエクスポート(is_admin ゲート)。
-- ============================================================

------------------------------------------------------------
-- 1. 公開SEO集計(n>=5 ルール)
------------------------------------------------------------
create or replace function public.salary_page_stats(
  p_country text,
  p_role    text default null
)
returns table (kind text, key text, val numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_n bigint;
begin
  select count(*) into v_n
  from public.compensation_data c
  where c.country = p_country
    and (p_role is null or c.role = p_role);

  -- 件数は常に返す(「データ募集中(現在N件)」表示用)
  return query select 'n'::text, ''::text, v_n::numeric;

  if v_n < 5 then
    return; -- n<5: 分布は一切返さない(個人特定防止)
  end if;

  -- 給与レンジ分布(上位5)
  return query
  select 'salary'::text, c.base_salary_range, count(*)::numeric
  from public.compensation_data c
  where c.country = p_country
    and (p_role is null or c.role = p_role)
    and c.base_salary_range is not null
  group by c.base_salary_range
  order by count(*) desc limit 5;

  -- 家賃レンジ分布(上位5)
  return query
  select 'rent'::text, c.monthly_rent_range, count(*)::numeric
  from public.compensation_data c
  where c.country = p_country
    and (p_role is null or c.role = p_role)
    and c.monthly_rent_range is not null
  group by c.monthly_rent_range
  order by count(*) desc limit 5;

  -- ビザ種別分布(上位5)
  return query
  select 'visa'::text, c.visa_type, count(*)::numeric
  from public.compensation_data c
  where c.country = p_country
    and (p_role is null or c.role = p_role)
    and c.visa_type is not null
  group by c.visa_type
  order by count(*) desc limit 5;

  -- 平均値(WLB 1-5 / 海外満足度 1-10 / 生活満足度 1-10)
  return query
  select 'wlb_avg'::text, ''::text, round(avg(c.wlb_satisfaction)::numeric, 1)
  from public.compensation_data c
  where c.country = p_country
    and (p_role is null or c.role = p_role)
    and c.wlb_satisfaction is not null;

  return query
  select 'life_avg'::text, ''::text, round(avg(c.life_satisfaction)::numeric, 1)
  from public.compensation_data c
  where c.country = p_country
    and (p_role is null or c.role = p_role)
    and c.life_satisfaction is not null;
end;
$$;

grant execute on function public.salary_page_stats(text, text) to anon, authenticated;

------------------------------------------------------------
-- 2. /admin KPI 日次推移
------------------------------------------------------------
create or replace function public.admin_daily_metrics(p_days int default 30)
returns table (
  day         date,
  signups     bigint,
  threads     bigint,
  comments    bigint,
  comp_posts  bigint,
  cc_requests bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select
    d.day::date,
    (select count(*) from public.profiles p
      where p.created_at >= d.day and p.created_at < d.day + interval '1 day'),
    (select count(*) from public.threads t
      where t.created_at >= d.day and t.created_at < d.day + interval '1 day'),
    (select count(*) from public.comments c
      where c.created_at >= d.day and c.created_at < d.day + interval '1 day'),
    (select count(*) from public.compensation_data cd
      where cd.reported_at >= d.day and cd.reported_at < d.day + interval '1 day'),
    (select count(*) from public.coffee_chat_requests cc
      where cc.created_at >= d.day and cc.created_at < d.day + interval '1 day')
  from generate_series(
    (current_date - make_interval(days => least(greatest(p_days, 7), 90) - 1))::timestamptz,
    current_date::timestamptz,
    interval '1 day'
  ) as d(day)
  order by d.day;
end;
$$;

grant execute on function public.admin_daily_metrics(int) to authenticated;

------------------------------------------------------------
-- 3. 匿名化エクスポート(買い手DD用)
------------------------------------------------------------
create or replace function public.admin_export_comp()
returns table (
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
  reported_month        text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select
    c.country, c.city, c.industry, c.role,
    c.base_salary_range, c.bonus_range, c.has_equity, c.total_comp_range,
    c.monthly_rent_range, c.savings_rate_range, c.life_satisfaction,
    c.weekly_hours_range, c.remote_frequency, c.english_usage_rate,
    c.wlb_satisfaction, c.visa_type, c.visa_difficulty, c.has_pr,
    c.overseas_satisfaction,
    to_char(c.reported_at, 'YYYY-MM')
  from public.compensation_data c
  order by c.reported_at desc
  limit 10000;
end;
$$;

grant execute on function public.admin_export_comp() to authenticated;
