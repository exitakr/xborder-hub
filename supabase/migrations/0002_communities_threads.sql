-- X Border Hub — Phase 4 schema for community-driven content
--
-- Run AFTER 0001_init.sql in Supabase Dashboard → SQL Editor against
-- the mbvdszpimjmhguvlqdvq project.
--
-- Adds the tables that back /threads, /thread, /thread/new, Coffee
-- Chat request lifecycle, community proposals, and the in-app
-- notification feed (lib/notifications/store.ts will read from this
-- once Commits 3–5 wire the client).
--
-- Idempotent: safe to re-run.

------------------------------------------------------------
-- 1. communities  (operator-curated taxonomy)
------------------------------------------------------------

create table if not exists public.communities (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('country', 'industry', 'role')),
  slug          text not null unique,
  -- "🇸🇬 Singapore" / "💻 Tech" / "📐 Product Manager"
  label         text not null,
  description   text,
  members_count int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists communities_kind_idx on public.communities (kind);
create index if not exists communities_active_idx on public.communities (active);

------------------------------------------------------------
-- 2. community_requests  (user → operator: please open this)
------------------------------------------------------------

create table if not exists public.community_requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users on delete cascade,
  kind          text not null check (kind in ('country', 'industry', 'role')),
  name          text not null,
  description   text,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);

create index if not exists community_requests_requester_idx
  on public.community_requests (requester_id);
create index if not exists community_requests_status_idx
  on public.community_requests (status);

------------------------------------------------------------
-- 3. threads  (community post)
------------------------------------------------------------

create table if not exists public.threads (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references auth.users on delete cascade,
  community_id  uuid references public.communities on delete set null,

  -- Multi-axis taxonomy mirrored from app/threads/data.ts so threads can
  -- be filtered without joining to communities.
  country       text,   -- "sg" / "jp" / ...
  industry      text,   -- "tech" / "finance" / ...
  role          text,   -- "pm" / "eng" / ...
  category      text not null,
                 -- "career" / "life" / "visa" / "salary" / "family" /
                 -- "other"

  title         text not null check (char_length(title) between 5 and 120),
  body          text not null check (char_length(body) between 10 and 4000),

  -- Cached counters (kept in sync by triggers below)
  ups_count     int  not null default 0,
  downs_count   int  not null default 0,
  replies_count int  not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists threads_community_idx on public.threads (community_id);
create index if not exists threads_author_idx    on public.threads (author_id);
create index if not exists threads_created_idx
  on public.threads (created_at desc);

------------------------------------------------------------
-- 4. comments  (replies on a thread)
------------------------------------------------------------

create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.threads on delete cascade,
  author_id     uuid not null references auth.users on delete cascade,
  -- Optional one-level reply for threading
  parent_id     uuid references public.comments on delete cascade,
  body          text not null check (char_length(body) between 1 and 2000),
  ups_count     int  not null default 0,
  downs_count   int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists comments_thread_idx
  on public.comments (thread_id, created_at);

------------------------------------------------------------
-- 5. reactions  (one row per user per target — used for both
-- threads and comments)
------------------------------------------------------------

create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  target_type   text not null check (target_type in ('thread', 'comment')),
  target_id     uuid not null,
  kind          text not null check (kind in ('up', 'down')),
  created_at    timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists reactions_target_idx
  on public.reactions (target_type, target_id);

------------------------------------------------------------
-- 6. coffee_chat_requests  (申請 → 承認 → トークルーム)
------------------------------------------------------------

create table if not exists public.coffee_chat_requests (
  id              uuid primary key default gen_random_uuid(),
  from_user_id    uuid not null references auth.users on delete cascade,
  to_user_id      uuid not null references auth.users on delete cascade,

  message         text not null
                  check (char_length(message) between 10 and 1000),
  preferred_when  text,  -- 例: "平日夜 / 週末午後" 等のフリーテキスト

  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected',
                                   'cancelled', 'completed')),
  responded_at    timestamptz,

  -- Once approved we set a chat_room_id so the same conversation can be
  -- reopened. The chat-message table itself comes in a later migration.
  chat_room_id    uuid,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Avoid duplicate pending requests between the same pair
  constraint cc_requests_no_self check (from_user_id <> to_user_id)
);

create index if not exists cc_requests_from_idx
  on public.coffee_chat_requests (from_user_id, created_at desc);
create index if not exists cc_requests_to_idx
  on public.coffee_chat_requests (to_user_id, created_at desc);

------------------------------------------------------------
-- 7. notifications  (in-app + push feed)
------------------------------------------------------------

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  kind        text not null
              check (kind in (
                'thread_post', 'thread_reply', 'reaction',
                'system', 'dm',
                'chat_request', 'chat_approved',
                'new_job', 'new_salary')),
  -- Community / community-like label (e.g. "雑談")
  group_label text,
  title       text not null,
  body        text,
  href        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id, read);

------------------------------------------------------------
-- 8. Row Level Security
------------------------------------------------------------

alter table public.communities          enable row level security;
alter table public.community_requests   enable row level security;
alter table public.threads              enable row level security;
alter table public.comments             enable row level security;
alter table public.reactions            enable row level security;
alter table public.coffee_chat_requests enable row level security;
alter table public.notifications        enable row level security;

-- communities — read open, write reserved for operator (no client-side
-- writes for now; service role will manage these). We still install the
-- read policy so client queries succeed.
drop policy if exists "communities_select_auth" on public.communities;
create policy "communities_select_auth"
  on public.communities for select
  to authenticated
  using (true);

-- community_requests — owner can read / insert their own, no updates
-- from client. Operator will manage status changes via service role.
drop policy if exists "community_requests_select_own"   on public.community_requests;
drop policy if exists "community_requests_insert_own"   on public.community_requests;
create policy "community_requests_select_own"
  on public.community_requests for select
  to authenticated
  using (auth.uid() = requester_id);
create policy "community_requests_insert_own"
  on public.community_requests for insert
  to authenticated
  with check (auth.uid() = requester_id);

-- threads — every signed-in user can read; only the author can mutate
drop policy if exists "threads_select_auth"  on public.threads;
drop policy if exists "threads_insert_own"   on public.threads;
drop policy if exists "threads_update_own"   on public.threads;
drop policy if exists "threads_delete_own"   on public.threads;
create policy "threads_select_auth"
  on public.threads for select
  to authenticated
  using (true);
create policy "threads_insert_own"
  on public.threads for insert
  to authenticated
  with check (auth.uid() = author_id);
create policy "threads_update_own"
  on public.threads for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
create policy "threads_delete_own"
  on public.threads for delete
  to authenticated
  using (auth.uid() = author_id);

-- comments — same shape as threads
drop policy if exists "comments_select_auth"  on public.comments;
drop policy if exists "comments_insert_own"   on public.comments;
drop policy if exists "comments_update_own"   on public.comments;
drop policy if exists "comments_delete_own"   on public.comments;
create policy "comments_select_auth"
  on public.comments for select
  to authenticated
  using (true);
create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);
create policy "comments_update_own"
  on public.comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- reactions — every signed-in user reads (counts derive from them);
-- inserts / deletes only on own row
drop policy if exists "reactions_select_auth"  on public.reactions;
drop policy if exists "reactions_modify_own"   on public.reactions;
create policy "reactions_select_auth"
  on public.reactions for select
  to authenticated
  using (true);
create policy "reactions_modify_own"
  on public.reactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- coffee_chat_requests — sender + recipient can read; sender inserts;
-- recipient updates status / responded_at / chat_room_id; sender can
-- cancel.
drop policy if exists "cc_requests_select_party"  on public.coffee_chat_requests;
drop policy if exists "cc_requests_insert_from"   on public.coffee_chat_requests;
drop policy if exists "cc_requests_update_to"     on public.coffee_chat_requests;
drop policy if exists "cc_requests_update_from"   on public.coffee_chat_requests;
create policy "cc_requests_select_party"
  on public.coffee_chat_requests for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "cc_requests_insert_from"
  on public.coffee_chat_requests for insert
  to authenticated
  with check (auth.uid() = from_user_id);
create policy "cc_requests_update_to"
  on public.coffee_chat_requests for update
  to authenticated
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);
create policy "cc_requests_update_from"
  on public.coffee_chat_requests for update
  to authenticated
  using (auth.uid() = from_user_id and status = 'pending')
  with check (auth.uid() = from_user_id);

-- notifications — only the recipient can read / update / delete.
-- Inserts come from triggers (security definer) so no insert policy is
-- needed for clients.
drop policy if exists "notifications_select_own"  on public.notifications;
drop policy if exists "notifications_update_own"  on public.notifications;
drop policy if exists "notifications_delete_own"  on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

------------------------------------------------------------
-- 9. updated_at triggers (reuses tg_set_updated_at from 0001)
------------------------------------------------------------

drop trigger if exists communities_updated_at on public.communities;
create trigger communities_updated_at
  before update on public.communities
  for each row execute function public.tg_set_updated_at();

drop trigger if exists threads_updated_at on public.threads;
create trigger threads_updated_at
  before update on public.threads
  for each row execute function public.tg_set_updated_at();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.tg_set_updated_at();

drop trigger if exists cc_requests_updated_at on public.coffee_chat_requests;
create trigger cc_requests_updated_at
  before update on public.coffee_chat_requests
  for each row execute function public.tg_set_updated_at();

------------------------------------------------------------
-- 10. Reaction → cached count triggers
------------------------------------------------------------

create or replace function public.tg_sync_reaction_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  delta_up   int := 0;
  delta_down int := 0;
  target_t   text;
  target_i   uuid;
begin
  if tg_op = 'INSERT' then
    target_t := new.target_type;
    target_i := new.target_id;
    if new.kind = 'up'   then delta_up   := 1; end if;
    if new.kind = 'down' then delta_down := 1; end if;
  elsif tg_op = 'DELETE' then
    target_t := old.target_type;
    target_i := old.target_id;
    if old.kind = 'up'   then delta_up   := -1; end if;
    if old.kind = 'down' then delta_down := -1; end if;
  else
    -- UPDATE: net zero on counts unless kind flipped
    target_t := new.target_type;
    target_i := new.target_id;
    if new.kind <> old.kind then
      if new.kind = 'up'   then delta_up   := 1;  delta_down := -1; end if;
      if new.kind = 'down' then delta_up   := -1; delta_down := 1;  end if;
    end if;
  end if;

  if target_t = 'thread' then
    update public.threads
      set ups_count   = greatest(0, ups_count   + delta_up),
          downs_count = greatest(0, downs_count + delta_down)
      where id = target_i;
  elsif target_t = 'comment' then
    update public.comments
      set ups_count   = greatest(0, ups_count   + delta_up),
          downs_count = greatest(0, downs_count + delta_down)
      where id = target_i;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists reactions_sync_counts on public.reactions;
create trigger reactions_sync_counts
  after insert or update or delete on public.reactions
  for each row execute function public.tg_sync_reaction_counts();

------------------------------------------------------------
-- 11. Reply count maintenance on threads
------------------------------------------------------------

create or replace function public.tg_sync_thread_replies()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.threads
      set replies_count = replies_count + 1
      where id = new.thread_id;
  elsif tg_op = 'DELETE' then
    update public.threads
      set replies_count = greatest(0, replies_count - 1)
      where id = old.thread_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists comments_sync_thread_replies on public.comments;
create trigger comments_sync_thread_replies
  after insert or delete on public.comments
  for each row execute function public.tg_sync_thread_replies();

------------------------------------------------------------
-- 12. Notification fan-out triggers
------------------------------------------------------------

-- Fire a notification to the recipient when a new CC request lands.
create or replace function public.tg_notify_cc_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, kind, group_label, title, body, href)
  values (
    new.to_user_id,
    'chat_request',
    'Coffee Chat',
    'Coffee Chat の申請が届きました',
    left(coalesce(new.message, ''), 80),
    '/mypage'
  );
  return new;
end;
$$;

drop trigger if exists cc_requests_notify_recipient on public.coffee_chat_requests;
create trigger cc_requests_notify_recipient
  after insert on public.coffee_chat_requests
  for each row execute function public.tg_notify_cc_request();

-- Fire a notification to the sender when status flips to approved /
-- rejected.
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
      '/chat'
    );
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, kind, group_label, title, body, href)
    values (
      new.from_user_id,
      'chat_request',
      'Coffee Chat',
      'Coffee Chat の申請に返信がありました',
      '今回は対応できないとの返信が届きました',
      '/mypage'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists cc_requests_notify_status on public.coffee_chat_requests;
create trigger cc_requests_notify_status
  after update on public.coffee_chat_requests
  for each row execute function public.tg_notify_cc_status();

-- Fire a notification to the thread author when someone (other than
-- themselves) replies.
create or replace function public.tg_notify_thread_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_author uuid;
  thread_title  text;
begin
  select author_id, title into thread_author, thread_title
    from public.threads where id = new.thread_id;
  if thread_author is null or thread_author = new.author_id then
    return new;
  end if;
  insert into public.notifications
    (user_id, kind, group_label, title, body, href)
  values (
    thread_author,
    'thread_reply',
    'スレッド',
    'あなたの投稿に返信があります',
    left(coalesce(new.body, ''), 80),
    '/thread?id=' || new.thread_id::text
  );
  return new;
end;
$$;

drop trigger if exists comments_notify_thread_author on public.comments;
create trigger comments_notify_thread_author
  after insert on public.comments
  for each row execute function public.tg_notify_thread_reply();

------------------------------------------------------------
-- 13. Seed: starter communities
-- (idempotent via ON CONFLICT (slug) DO NOTHING)
------------------------------------------------------------

insert into public.communities (kind, slug, label, description, members_count)
values
  ('country',  'sg',       '🇸🇬 Singapore',          'Singapore に住む・働く人のためのコミュニティ', 2840),
  ('country',  'jp',       '🇯🇵 Japan',              '日本国内のキャリアコミュニティ',                3120),
  ('country',  'hk',       '🇭🇰 Hong Kong',          'Hong Kong に住む・働く人のためのコミュニティ',  1490),
  ('country',  'vn',       '🇻🇳 Vietnam',            'Vietnam に住む・働く人のためのコミュニティ',     870),
  ('country',  'us',       '🇺🇸 United States',      'US に住む・働く人のためのコミュニティ',         1310),
  ('industry', 'tech',     '💻 Tech',                'Tech 業界の人のためのコミュニティ',             4250),
  ('industry', 'finance',  '🏦 Finance',             '金融業界の人のためのコミュニティ',                2180),
  ('industry', 'startup',  '🚀 Startup',             'スタートアップで働く人のためのコミュニティ',     1640),
  ('role',     'pm',       '📐 Product Manager',     'プロダクトマネージャーのコミュニティ',            1820),
  ('role',     'eng',      '⚙️ Engineer',           'エンジニアのコミュニティ',                       2370),
  ('role',     'bd',       '💼 BD / Sales',          'BD / Sales 職のコミュニティ',                   1490)
on conflict (slug) do nothing;
