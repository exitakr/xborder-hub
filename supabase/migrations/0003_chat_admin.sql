-- ============================================================
-- 0003_chat_admin.sql — トークルーム (chat) + 管理者ロール
--
-- 実行順: 0001_init.sql → 0002_communities_threads.sql → このファイル
-- Supabase Dashboard → SQL Editor に貼り付けて実行してください。
-- 冪等: 何度実行しても安全です。
-- ============================================================

------------------------------------------------------------
-- 1. profiles.is_admin — 管理者フラグ
--    自分を管理者にするには SQL Editor で:
--    update public.profiles set is_admin = true
--      where id = (select id from auth.users where email = 'you@example.com');
------------------------------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

------------------------------------------------------------
-- 2. chat_rooms / chat_messages
------------------------------------------------------------

create table if not exists public.chat_rooms (
  id              uuid primary key default gen_random_uuid(),
  cc_request_id   uuid references public.coffee_chat_requests on delete set null,
  user_a          uuid not null references auth.users on delete cascade,
  user_b          uuid not null references auth.users on delete cascade,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chat_rooms_distinct_users check (user_a <> user_b)
);

create index if not exists chat_rooms_user_a_idx on public.chat_rooms (user_a);
create index if not exists chat_rooms_user_b_idx on public.chat_rooms (user_b);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.chat_rooms on delete cascade,
  sender_id  uuid not null references auth.users on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_idx
  on public.chat_messages (room_id, created_at);

------------------------------------------------------------
-- 3. RLS — 参加者のみ読める / 書ける
------------------------------------------------------------

alter table public.chat_rooms    enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_rooms_select_member" on public.chat_rooms;
create policy "chat_rooms_select_member"
  on public.chat_rooms for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "chat_messages_select_member" on public.chat_messages;
create policy "chat_messages_select_member"
  on public.chat_messages for select
  to authenticated
  using (exists (
    select 1 from public.chat_rooms r
    where r.id = room_id
      and (auth.uid() = r.user_a or auth.uid() = r.user_b)
  ));

drop policy if exists "chat_messages_insert_member" on public.chat_messages;
create policy "chat_messages_insert_member"
  on public.chat_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chat_rooms r
      where r.id = room_id
        and (auth.uid() = r.user_a or auth.uid() = r.user_b)
    )
  );

------------------------------------------------------------
-- 4. CC 承認 → ルーム自動作成 (BEFORE UPDATE)
------------------------------------------------------------

create or replace function public.tg_cc_create_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  room_id uuid;
begin
  if new.status = 'approved'
     and old.status is distinct from 'approved'
     and new.chat_room_id is null then
    insert into public.chat_rooms (cc_request_id, user_a, user_b)
    values (new.id, new.from_user_id, new.to_user_id)
    returning id into room_id;
    new.chat_room_id := room_id;
  end if;
  return new;
end;
$$;

drop trigger if exists cc_requests_create_room on public.coffee_chat_requests;
create trigger cc_requests_create_room
  before update on public.coffee_chat_requests
  for each row execute function public.tg_cc_create_room();

-- 0002 の通知トリガを更新: href を実ルームに向ける
create or replace function public.tg_notify_cc_status()
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
      new.from_user_id,
      'chat_approved',
      'Coffee Chat',
      'Coffee Chat の申請が承認されました',
      'トークルームが開きました',
      case when new.chat_room_id is not null
           then '/chat?room=' || new.chat_room_id
           else '/chat' end
    );
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, kind, group_label, title, body, href)
    values (
      new.from_user_id,
      'system',
      'Coffee Chat',
      'Coffee Chat の申請は見送られました',
      'また別のメンバーに申請してみましょう',
      '/search'
    );
  end if;
  return new;
end;
$$;

------------------------------------------------------------
-- 5. 新着メッセージ → last_message_at 更新 + 相手に通知
------------------------------------------------------------

create or replace function public.tg_chat_message_fanout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient   uuid;
  sender_name text;
begin
  update public.chat_rooms
     set last_message_at = new.created_at
   where id = new.room_id;

  select case when user_a = new.sender_id then user_b else user_a end
    into recipient
    from public.chat_rooms where id = new.room_id;

  select display_name into sender_name
    from public.profiles where id = new.sender_id;

  if recipient is not null then
    insert into public.notifications (user_id, kind, group_label, title, body, href)
    values (
      recipient,
      'dm',
      'トークルーム',
      coalesce(sender_name, 'メンバー') || ' からメッセージ',
      left(new.body, 80),
      '/chat?room=' || new.room_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists chat_messages_fanout on public.chat_messages;
create trigger chat_messages_fanout
  after insert on public.chat_messages
  for each row execute function public.tg_chat_message_fanout();

------------------------------------------------------------
-- 6. updated_at trigger
------------------------------------------------------------

drop trigger if exists chat_rooms_updated_at on public.chat_rooms;
create trigger chat_rooms_updated_at
  before update on public.chat_rooms
  for each row execute function public.tg_set_updated_at();

------------------------------------------------------------
-- 7. 管理者 RLS — community_requests のレビューと communities 開設
------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists "community_requests_admin_select" on public.community_requests;
create policy "community_requests_admin_select"
  on public.community_requests for select
  to authenticated
  using (public.is_admin());

drop policy if exists "community_requests_admin_update" on public.community_requests;
create policy "community_requests_admin_update"
  on public.community_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "communities_admin_insert" on public.communities;
create policy "communities_admin_insert"
  on public.communities for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "communities_admin_update" on public.communities;
create policy "communities_admin_update"
  on public.communities for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

------------------------------------------------------------
-- 8. Realtime — chat_messages / notifications を配信対象に
------------------------------------------------------------

do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end;
$$;
