-- X Border Hub — initial Phase 4 schema
--
-- Run this once in Supabase Dashboard → SQL Editor against the
-- mbvdszpimjmhguvlqdvq project. Creates the three core tables that
-- Phase 1 / Phase 4 work depends on (profiles, compensation_data,
-- career_profile) with row-level security and an auto-provision
-- trigger that creates a profiles row whenever a new auth user signs
-- up.
--
-- Idempotent: safe to re-run. Each create uses `if not exists`.

------------------------------------------------------------
-- 1. profiles
------------------------------------------------------------

create table if not exists public.profiles (
  id              uuid primary key references auth.users on delete cascade,

  -- public-ish identity
  display_name    text,
  age             int,
  bio             text,

  -- career path
  from_country    text,
  from_city       text,
  to_country      text,
  to_city         text,
  industry        text,
  role            text,

  -- monetisation
  is_premium      boolean not null default false,

  -- visibility — see lib/anonymity/rules.ts for canonical defaults
  visibility_settings jsonb not null default jsonb_build_object(
    'show_companies',     false,
    'show_salary',        false,
    'show_skills',        true,
    'show_visa',          false,
    'allow_coffee_chat',  true
  ),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

------------------------------------------------------------
-- 2. compensation_data  (Feature A)
------------------------------------------------------------

create table if not exists public.compensation_data (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users on delete cascade,

  base_salary_range        text,
  bonus_range              text,
  has_equity               boolean,
  equity_range             text,
  total_comp_range         text,

  monthly_rent_range       text,
  rent_ratio_range         text,
  monthly_savings_range    text,
  savings_rate_range       text,
  effective_tax_rate_range text,
  life_satisfaction        int  check (life_satisfaction between 1 and 10),

  weekly_hours_range       text,
  remote_frequency         text,
  english_usage_rate       text,
  wlb_satisfaction         int  check (wlb_satisfaction between 1 and 5),

  visa_type                text,
  visa_difficulty          int  check (visa_difficulty between 1 and 5),
  has_pr                   boolean,
  years_to_pr_range        text,
  has_sponsor              boolean,

  overseas_satisfaction    int  check (overseas_satisfaction between 1 and 10),
  has_family               boolean,
  return_intention         text,

  reported_at              timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists compensation_data_user_id_idx
  on public.compensation_data (user_id);

------------------------------------------------------------
-- 3. career_profile  (Feature B)
------------------------------------------------------------

create table if not exists public.career_profile (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references auth.users on delete cascade,

  -- language
  toeic_range              text,
  ielts_range              text,
  english_business_exp     boolean,
  english_meeting_freq     text,

  -- education
  education_level          text,
  has_mba                  boolean,
  has_overseas_study       boolean,

  -- skills (arrays so we can aggregate by skill keyword)
  tech_skills              text[] not null default '{}',
  business_skills          text[] not null default '{}',
  cross_border_skills      text[] not null default '{}',

  -- career attributes
  overseas_years_range     text,
  num_countries            int,
  num_job_changes_overseas int,

  updated_at               timestamptz not null default now()
);

------------------------------------------------------------
-- 4. RLS
------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.compensation_data   enable row level security;
alter table public.career_profile      enable row level security;

-- profiles: authenticated members can read every profile (browsing the
-- search results / community); only the owner can write.
drop policy if exists "profiles_select_auth"   on public.profiles;
drop policy if exists "profiles_update_own"    on public.profiles;
drop policy if exists "profiles_insert_own"    on public.profiles;

create policy "profiles_select_auth"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- compensation_data: each user can only see/modify their own row.
-- Aggregated stats are served via a SECURITY DEFINER function (added
-- in a later migration), so the table itself is fully private.
drop policy if exists "comp_select_own" on public.compensation_data;
drop policy if exists "comp_modify_own" on public.compensation_data;

create policy "comp_select_own"
  on public.compensation_data for select
  to authenticated
  using (auth.uid() = user_id);

create policy "comp_modify_own"
  on public.compensation_data for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- career_profile: owner-only writes, all authenticated users can read
-- (skills are displayed on profile pages when visibility_settings allow).
drop policy if exists "career_select_auth"  on public.career_profile;
drop policy if exists "career_modify_own"   on public.career_profile;

create policy "career_select_auth"
  on public.career_profile for select
  to authenticated
  using (true);

create policy "career_modify_own"
  on public.career_profile for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- 5. Auto-create profiles row on new auth user
------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- 6. Touch updated_at on every row change
------------------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists compensation_data_updated_at on public.compensation_data;
create trigger compensation_data_updated_at
  before update on public.compensation_data
  for each row execute function public.tg_set_updated_at();

drop trigger if exists career_profile_updated_at on public.career_profile;
create trigger career_profile_updated_at
  before update on public.career_profile
  for each row execute function public.tg_set_updated_at();
