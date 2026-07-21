-- ============================================================
-- 0016_comp_percentile.sql — 投稿完了シェアカード用のパーセンタイル
--
-- 実行順: 0001 → … → 0015 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- 年収データ投稿完了後の「あなたは {国}×{職種} の上位XX%」カード用。
-- total_comp_range はレンジ文字列(JPY_SALARY_OPTS の順序)なので、
-- バケットの序列で「自分以下のバケットの割合」を近似パーセンタイルとする。
-- 個票・user_id は一切返さない。母集団 n>=5 のときだけ percentile を返す
-- (n<5 は個人特定リスク + 統計的に無意味なため null)。
-- ============================================================

-- レンジ文字列 → 序列(高いほど高年収)。未知値は -1。
create or replace function public.comp_bucket_rank(p_range text)
returns int
language sql
immutable
as $$
  select case p_range
    when 'lt_400'    then 0
    when '400_600'   then 1
    when '600_800'   then 2
    when '800_1000'  then 3
    when '1000_1300' then 4
    when '1300_1600' then 5
    when '1600_2000' then 6
    when 'gte_2000'  then 7
    else -1
  end;
$$;

create or replace function public.comp_percentile(
  p_country text,
  p_role    text,
  p_range   text
)
returns table (
  sample_n   bigint,  -- 母集団(国×職種、無ければ国のみ)
  scope      text,    -- 'country_role' | 'country'
  percentile int      -- 自分以下のバケット割合(0-100)。n<5 は null
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_rank int := public.comp_bucket_rank(p_range);
  v_n    bigint;
  v_le   bigint;
  v_scope text := 'country_role';
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- まず 国×職種 の母集団
  select count(*) into v_n
  from public.compensation_data c
  where c.country = p_country and c.role = p_role
    and public.comp_bucket_rank(c.total_comp_range) >= 0;

  -- 職種が薄い(<5)なら国のみにフォールバック
  if v_n < 5 then
    v_scope := 'country';
    select count(*) into v_n
    from public.compensation_data c
    where c.country = p_country
      and public.comp_bucket_rank(c.total_comp_range) >= 0;
  end if;

  if v_n < 5 or v_rank < 0 then
    return query select v_n, v_scope, null::int;
    return;
  end if;

  if v_scope = 'country_role' then
    select count(*) into v_le
    from public.compensation_data c
    where c.country = p_country and c.role = p_role
      and public.comp_bucket_rank(c.total_comp_range) between 0 and v_rank;
  else
    select count(*) into v_le
    from public.compensation_data c
    where c.country = p_country
      and public.comp_bucket_rank(c.total_comp_range) between 0 and v_rank;
  end if;

  return query
    select v_n, v_scope, greatest(1, least(99, round(100.0 * v_le / v_n)::int));
end;
$$;

revoke all on function public.comp_percentile(text, text, text) from public, anon;
grant execute on function public.comp_percentile(text, text, text) to authenticated;
