-- ============================================================
-- 0006_profile_full.sql — プロフィール全項目を Supabase に永続化
--
-- 実行順: 0001 → 0002 → 0003 → 0004 → 0005 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- これまで職歴(career)・スキル・志望・VISA・年収・滞在年数・相談トピックは
-- ブラウザの localStorage にしか保存されておらず、他の端末・他のユーザーから
-- 見えませんでした。本マイグレーションで profiles テーブルに列を追加し、
-- マイページの編集内容がすべての画面・全ユーザーに反映されるようにします。
-- ============================================================

alter table public.profiles
  add column if not exists tenure          text,
  add column if not exists visa            text,
  add column if not exists salary          text,
  add column if not exists tech_skills     text[] not null default '{}',
  add column if not exists business_skills text[] not null default '{}',
  add column if not exists goal_country    text,
  add column if not exists goal_industry   text,
  add column if not exists goal_role       text,
  add column if not exists goal_salary     text,
  add column if not exists cc_topics       text,
  -- 職歴は配列なので jsonb で保存(投稿時スナップショット)。
  -- 形は lib/profile/store.ts の CareerStep に対応。
  add column if not exists career          jsonb not null default '[]'::jsonb;

-- 検索(/search)で「出身 → 現在」を絞り込めるようにするフィルタ索引。
create index if not exists profiles_from_to_idx
  on public.profiles (from_country, to_country);
