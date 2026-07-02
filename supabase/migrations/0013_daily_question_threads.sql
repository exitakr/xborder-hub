-- ============================================================
-- 0013_daily_question_threads.sql — 今日の質問 → 共有スレッド化
--
-- 実行順: 0001 → … → 0012 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- ホームの「今日の質問」の遷移先を、個人の新規投稿画面ではなく
-- 「その日の共有スレッド」に変える。最初に「答える」を押したユーザーの
-- リクエストでスレッドが1本だけ作られ(日付でユニーク)、以降の全員は
-- 同じスレッドへコメントとして回答する。作成された時点で threads
-- テーブルの実データになるため、/threads 一覧にも自動で載る。
-- スレッドの author は運営(is_admin の最初のアカウント)に帰属させる。
-- ============================================================

create table if not exists public.daily_question_threads (
  qdate      date primary key,
  thread_id  uuid not null references public.threads on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.daily_question_threads enable row level security;

drop policy if exists "dqt_select_auth" on public.daily_question_threads;
create policy "dqt_select_auth"
  on public.daily_question_threads for select
  to authenticated
  using (true);
-- 書き込みは下の SECURITY DEFINER 関数経由のみ(直接 INSERT のポリシーは作らない)

create or replace function public.get_or_create_daily_question_thread(
  p_qdate    date,
  p_title    text,
  p_body     text,
  p_category text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread   uuid;
  v_author   uuid;
  v_category text := p_category;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select thread_id into v_thread
    from public.daily_question_threads where qdate = p_qdate;
  if v_thread is not null then
    return v_thread;
  end if;

  -- 運営(最初の管理者)名義で作成。管理者不在なら押した本人にフォールバック。
  select id into v_author
    from public.profiles where is_admin = true
    order by created_at limit 1;
  if v_author is null then
    v_author := auth.uid();
  end if;

  if v_category not in ('career','life','visa','salary','family','other') then
    v_category := 'other';
  end if;

  insert into public.threads (author_id, category, title, body)
  values (v_author, v_category, left(p_title, 120), left(p_body, 4000))
  returning id into v_thread;

  begin
    insert into public.daily_question_threads (qdate, thread_id)
    values (p_qdate, v_thread);
  exception when unique_violation then
    -- 同時押しレース: 負けた側は自分の行を消し、勝者のスレッドを返す
    delete from public.threads where id = v_thread;
    select thread_id into v_thread
      from public.daily_question_threads where qdate = p_qdate;
  end;

  return v_thread;
end;
$$;

grant execute on function
  public.get_or_create_daily_question_thread(date, text, text, text)
  to authenticated;
