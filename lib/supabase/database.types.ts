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
  visibility_settings: VisibilitySettings;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
>;

export type CompensationData = {
  id: string;
  user_id: string;

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
