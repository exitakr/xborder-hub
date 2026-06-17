import type { Profile as DbProfile } from "@/lib/supabase/database.types";
import type { Profile as ClientProfile, CareerStep } from "@/lib/profile/store";
import { DEFAULT_PROFILE } from "@/lib/profile/store";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";

/**
 * Map a Supabase `profiles` row into the client `Profile` shape used by
 * the localStorage store / UI. Pure — safe to call on server or client.
 *
 * When `respectVisibility` is true (viewing someone ELSE's profile) the
 * owner's visibility_settings gate companies / salary / skills / visa so
 * we never leak fields the member chose to hide.
 */
export function dbProfileToClient(
  row: DbProfile,
  opts: { respectVisibility?: boolean } = {},
): ClientProfile {
  const vis: VisibilitySettings = {
    ...DEFAULT_VISIBILITY_SETTINGS,
    ...(row.visibility_settings ?? {}),
  };
  const gate = opts.respectVisibility === true;

  const career: CareerStep[] = Array.isArray(row.career)
    ? row.career.map((s, i) => ({
        id: s?.id || `c-${i}`,
        country: s?.country ?? "",
        // company / salary are sensitive — strip when hidden
        company: gate && !vis.show_companies ? "" : s?.company ?? "",
        industry: s?.industry ?? "",
        role: s?.role ?? "",
        salary: gate && !vis.show_salary ? "" : s?.salary ?? "",
        startYear: s?.startYear ?? "",
        startMonth: s?.startMonth ?? "",
        endYear: s?.endYear ?? "",
        endMonth: s?.endMonth ?? "",
        achievements: s?.achievements ?? "",
        current: !!s?.current,
      }))
    : [];

  return {
    ...DEFAULT_PROFILE,
    name: (row.display_name ?? "").trim(),
    age: row.age != null ? String(row.age) : "",
    fromCountry: row.from_country ?? "",
    fromCity: row.from_city ?? "",
    country: row.to_country ?? "",
    city: row.to_city ?? "",
    tenure: row.tenure ?? "",
    bio: row.bio ?? "",
    industry: row.industry ?? "",
    role: row.role ?? "",
    visa: gate && !vis.show_visa ? "" : row.visa ?? "",
    salary: gate && !vis.show_salary ? "" : row.salary ?? "",
    techSkills: gate && !vis.show_skills ? [] : row.tech_skills ?? [],
    businessSkills: gate && !vis.show_skills ? [] : row.business_skills ?? [],
    goalCountry: row.goal_country ?? "",
    goalIndustry: row.goal_industry ?? "",
    goalRole: row.goal_role ?? "",
    goalSalary: row.goal_salary ?? "",
    ccAvailable: vis.allow_coffee_chat !== false,
    ccTopics: row.cc_topics ?? "",
    career,
  };
}

/**
 * Columns to upsert into `profiles` from a client Profile. Coffee-chat
 * availability is folded into visibility_settings (the canonical home for
 * it) by the caller, since it needs the existing settings to merge.
 */
export function clientProfileToDbColumns(p: ClientProfile) {
  const ageNum = p.age ? Number.parseInt(p.age, 10) : null;
  return {
    display_name: p.name.replace(/(さん|くん|さま|様)\s*$/, "").trim(),
    age: Number.isFinite(ageNum as number) ? ageNum : null,
    bio: p.bio?.trim() || null,
    from_country: p.fromCountry || null,
    from_city: p.fromCity?.trim() || null,
    to_country: p.country || null,
    to_city: p.city?.trim() || null,
    industry: p.industry || null,
    role: p.role || null,
    tenure: p.tenure?.trim() || null,
    visa: p.visa || null,
    salary: p.salary || null,
    tech_skills: p.techSkills ?? [],
    business_skills: p.businessSkills ?? [],
    goal_country: p.goalCountry || null,
    goal_industry: p.goalIndustry || null,
    goal_role: p.goalRole || null,
    goal_salary: p.goalSalary || null,
    cc_topics: p.ccTopics?.trim() || null,
    career: p.career ?? [],
  };
}
