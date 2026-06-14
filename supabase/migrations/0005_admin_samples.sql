-- ============================================================
-- 0005_admin_samples.sql — 運営がサンプル(シード)を削除できるようにする
--
-- 実行順: 0001 → 0002 → 0003 → 0004 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- ホームの「トレンドキャリア」「注目のスレッド」やスレッド一覧のサンプルは
-- コードに埋め込まれた固定データです。本番でも表示しますが、管理者
-- (profiles.is_admin = true)だけが「× 削除」で個別に非表示にできます。
-- 非表示にした sample_key をこのテーブルに記録し、全ユーザーの表示から除外します。
-- ============================================================

create table if not exists public.dismissed_samples (
  sample_key text primary key,
  dismissed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.dismissed_samples enable row level security;

-- 誰でも「どのサンプルが非表示か」は読める(表示の出し分けに使う)
drop policy if exists "dismissed_samples_select" on public.dismissed_samples;
create policy "dismissed_samples_select" on public.dismissed_samples
  for select
  using (true);

-- 非表示にできるのは管理者のみ(0003 の public.is_admin() を利用)
drop policy if exists "dismissed_samples_admin_insert" on public.dismissed_samples;
create policy "dismissed_samples_admin_insert" on public.dismissed_samples
  for insert to authenticated
  with check (public.is_admin());

-- 復元(削除)できるのも管理者のみ
drop policy if exists "dismissed_samples_admin_delete" on public.dismissed_samples;
create policy "dismissed_samples_admin_delete" on public.dismissed_samples
  for delete to authenticated
  using (public.is_admin());
