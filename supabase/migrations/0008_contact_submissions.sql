-- ============================================================
-- 0008_contact_submissions.sql — お問い合わせフォームの保存先
--
-- 実行順: 0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0007 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- /legal/contact のフォーム送信内容を蓄積するテーブル。
-- 運営は Supabase Dashboard → Table Editor → contact_submissions で
-- 一覧確認できます。
-- ============================================================

create table if not exists public.contact_submissions (
  id              uuid primary key default gen_random_uuid(),
  -- 送信時にログイン中の会員 id(匿名送信は null)。アカウント削除時に
  -- 履歴を残すため set null。
  user_id         uuid references auth.users (id) on delete set null,
  -- 返信先(ログイン中は session のメール、未ログインはフォーム入力)
  email           text not null,
  name            text,
  category        text not null
                    check (category in (
                      'general', 'account', 'report', 'business', 'bug'
                    )),
  subject         text not null check (char_length(subject) between 1 and 200),
  body            text not null check (char_length(body) between 10 and 4000),
  status          text not null default 'new'
                    check (status in ('new', 'in_progress', 'resolved')),
  -- 受信時の IP・UA は迷惑メール対策と監査ログのため。GDPR / 個人情報
  -- 保護法の文脈で 90 日経過後は別ジョブで匿名化推奨(運用課題)。
  ip              inet,
  user_agent      text,
  created_at      timestamptz not null default now(),
  responded_at    timestamptz
);

create index if not exists contact_submissions_created_idx
  on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status);

alter table public.contact_submissions enable row level security;

-- 送信は誰でも可(未ログインの問い合わせを受け付けるため)。
-- ただし anon と authenticated に分けて、authenticated には user_id を
-- 自分自身に強制する。
drop policy if exists "contact_insert_anon"  on public.contact_submissions;
drop policy if exists "contact_insert_auth"  on public.contact_submissions;
drop policy if exists "contact_select_admin" on public.contact_submissions;
drop policy if exists "contact_select_own"   on public.contact_submissions;

create policy "contact_insert_anon"
  on public.contact_submissions for insert
  to anon
  with check (user_id is null);

create policy "contact_insert_auth"
  on public.contact_submissions for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());

-- 自分の送信履歴は読める(マイページ用)
create policy "contact_select_own"
  on public.contact_submissions for select
  to authenticated
  using (user_id = auth.uid());

-- 管理者は全件読める(0003 の public.is_admin() を利用)
create policy "contact_select_admin"
  on public.contact_submissions for select
  to authenticated
  using (public.is_admin());

-- 管理者は status を更新できる
create policy "contact_update_admin"
  on public.contact_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
