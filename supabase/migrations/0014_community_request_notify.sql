-- ============================================================
-- 0014_community_request_notify.sql — コミュニティ申請の結果を申請者に通知
--
-- 実行順: 0001 → … → 0013 → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
--
-- これまで管理者が申請を承認/却下しても申請者には何も届かなかった。
-- coffee_chat_requests と同じパターン(0003 tg_notify_cc_status)で、
-- status 変更時に notifications へ行を挿入するトリガーを追加する。
-- ============================================================

create or replace function public.tg_notify_community_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if new.status = 'approved' then
    insert into public.notifications (user_id, kind, group_label, title, body, href)
    values (
      new.requester_id,
      'system',
      'コミュニティ',
      'コミュニティ「' || new.name || '」が開設されました',
      'あなたの申請が承認されました。さっそくスレッドを立ててみましょう',
      '/threads'
    );
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, kind, group_label, title, body, href)
    values (
      new.requester_id,
      'system',
      'コミュニティ',
      'コミュニティ「' || new.name || '」の申請は見送られました',
      coalesce(new.reviewer_note, '基準を満たさなかったため見送りました。内容を変えて再申請できます'),
      '/threads'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists community_requests_notify_status on public.community_requests;
create trigger community_requests_notify_status
  after update on public.community_requests
  for each row execute function public.tg_notify_community_request_status();
