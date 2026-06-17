/**
 * Hand-maintained TypeScript types matching supabase/migrations/0001_init.sql.
 * Run `supabase gen types typescript --project-id mbvdszpimjmhguvlqdvq` if
 * we want to switch to generated types later; for now the surface is small.
 */

import type { VisibilitySettings } from "@/lib/anonymity/rules";

export type Profile = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  from_country: string | null;
  from_city: string | null;
  to_country: string | null;
  to_city: string | null;
  industry: string | null;
  role: string | null;
  is_premium: boolean;
  is_admin: boolean;
  visibility_settings: VisibilitySettings;
  onboarded_at: string | null;
  /* Full profile columns added by migration 0006 */
  tenure: string | null;
  visa: string | null;
  salary: string | null;
  tech_skills: string[];
  business_skills: string[];
  goal_country: string | null;
  goal_industry: string | null;
  goal_role: string | null;
  goal_salary: string | null;
  cc_topics: string | null;
  career: CareerStepRow[];
  created_at: string;
  updated_at: string;
};

/** Shape of one career timeline entry stored in profiles.career (jsonb). */
export type CareerStepRow = {
  id: string;
  country: string;
  company: string;
  industry: string;
  role: string;
  salary: string;
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  achievements: string;
  current: boolean;
};

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
>;

export type CompensationData = {
  id: string;
  user_id: string;

  /* Snapshot of the job at reporting time (migration 0004) */
  country: string | null;
  city: string | null;
  industry: string | null;
  role: string | null;

  base_salary_range: string | null;
  bonus_range: string | null;
  has_equity: boolean | null;
  equity_range: string | null;
  total_comp_range: string | null;

  monthly_rent_range: string | null;
  rent_ratio_range: string | null;
  monthly_savings_range: string | null;
  savings_rate_range: string | null;
  effective_tax_rate_range: string | null;
  life_satisfaction: number | null;

  weekly_hours_range: string | null;
  remote_frequency: string | null;
  english_usage_rate: string | null;
  wlb_satisfaction: number | null;

  visa_type: string | null;
  visa_difficulty: number | null;
  has_pr: boolean | null;
  years_to_pr_range: string | null;
  has_sponsor: boolean | null;

  overseas_satisfaction: number | null;
  has_family: boolean | null;
  return_intention: string | null;

  reported_at: string;
  updated_at: string;
};

export type CareerProfile = {
  id: string;
  user_id: string;

  toeic_range: string | null;
  ielts_range: string | null;
  english_business_exp: boolean | null;
  english_meeting_freq: string | null;

  education_level: string | null;
  has_mba: boolean | null;
  has_overseas_study: boolean | null;

  tech_skills: string[];
  business_skills: string[];
  cross_border_skills: string[];

  overseas_years_range: string | null;
  num_countries: number | null;
  num_job_changes_overseas: number | null;

  updated_at: string;
};

/* ────────────────────────────────────────────────────────────────
 * Tables added by supabase/migrations/0002_communities_threads.sql
 * ──────────────────────────────────────────────────────────────── */

export type CommunityKind = "country" | "industry" | "role";

export type Community = {
  id: string;
  kind: CommunityKind;
  slug: string;
  label: string;
  description: string | null;
  members_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CommunityRequestStatus = "pending" | "approved" | "rejected";

export type CommunityRequest = {
  id: string;
  requester_id: string;
  kind: CommunityKind;
  name: string;
  description: string | null;
  status: CommunityRequestStatus;
  reviewer_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type ThreadCategory =
  | "career"
  | "life"
  | "visa"
  | "salary"
  | "family"
  | "other";

export type Thread = {
  id: string;
  author_id: string;
  community_id: string | null;
  country: string | null;
  industry: string | null;
  role: string | null;
  category: ThreadCategory;
  title: string;
  body: string;
  ups_count: number;
  downs_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  ups_count: number;
  downs_count: number;
  created_at: string;
  updated_at: string;
};

export type ReactionKind = "up" | "down";
export type ReactionTarget = "thread" | "comment";

export type Reaction = {
  id: string;
  user_id: string;
  target_type: ReactionTarget;
  target_id: string;
  kind: ReactionKind;
  created_at: string;
};

export type CoffeeChatStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export type CoffeeChatRequest = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  preferred_when: string | null;
  status: CoffeeChatStatus;
  responded_at: string | null;
  chat_room_id: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationKind =
  | "thread_post"
  | "thread_reply"
  | "reaction"
  | "system"
  | "dm"
  | "chat_request"
  | "chat_approved"
  | "new_job"
  | "new_salary";

/**
 * Row shape returned by the fetch_comp_entries RPC (migration 0004).
 * Deliberately excludes user_id — anonymity is enforced server-side.
 */
export type CompEntry = {
  entry_id: string;
  country: string | null;
  city: string | null;
  industry: string | null;
  role: string | null;
  base_salary_range: string | null;
  bonus_range: string | null;
  has_equity: boolean | null;
  total_comp_range: string | null;
  monthly_rent_range: string | null;
  savings_rate_range: string | null;
  life_satisfaction: number | null;
  weekly_hours_range: string | null;
  remote_frequency: string | null;
  english_usage_rate: string | null;
  wlb_satisfaction: number | null;
  visa_type: string | null;
  visa_difficulty: number | null;
  has_pr: boolean | null;
  overseas_satisfaction: number | null;
  reported_month: string;
};

/* ────────────────────────────────────────────────────────────────
 * Tables added by supabase/migrations/0003_chat_admin.sql
 * ──────────────────────────────────────────────────────────────── */

export type ChatRoom = {
  id: string;
  cc_request_id: string | null;
  user_a: string;
  user_b: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type AppNotificationRow = {
  id: string;
  user_id: string;
  kind: NotificationKind;
  group_label: string | null;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
};

/** Rows in `contact_submissions` (migration 0008). */
export type ContactSubmissionCategory =
  | "general"
  | "account"
  | "report"
  | "business"
  | "bug";

export type ContactSubmission = {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  category: ContactSubmissionCategory;
  subject: string;
  body: string;
  status: "new" | "in_progress" | "resolved";
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  responded_at: string | null;
};
