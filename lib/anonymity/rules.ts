/**
 * Anonymity tiers for profile data. The site renders different subsets of
 * a profile depending on (a) viewer signed-in state and (b) the owner's
 * own visibility_settings toggle.
 *
 * We removed the "premium_only" tier when the business model shifted to
 * B2B job-ad revenue — every signed-in member now sees every member-only
 * field, subject to the owner's visibility settings.
 *
 * Use `canShow(field, viewer)` from this file to decide whether to render
 * a piece of data, rather than scattering tier checks across the UI.
 */

export const ANONYMITY_RULES = {
  /** Visible to everyone, including signed-out visitors. */
  public: [
    "display_name",
    "from_country",
    "to_country",
    "industry",
    "role",
    "bio",
  ],

  /**
   * Visible to every signed-in member. The owner's visibility_settings
   * (show_companies, show_salary, show_skills, show_visa) gate these
   * further on a per-field basis at the database RPC level.
   */
  members_only: [
    "from_city",
    "to_city",
    "companies", // anonymised before display when show_companies is off
    "toeic_range",
    "overseas_years",
    "base_salary_range",
    "savings_rate_range",
    "visa_type",
    "wlb_satisfaction",
    "life_satisfaction",
    "tech_skills",
    "business_skills",
  ],

  /**
   * Stored on the server for aggregation only — never returned to a
   * client. Exact company names and exact salaries fall here. Aggregation
   * queries are exposed through SECURITY DEFINER RPCs.
   */
  aggregate_only: ["company_name_exact", "exact_salary"],
} as const;

export type Tier = keyof typeof ANONYMITY_RULES;

export type Viewer = {
  isSignedIn: boolean;
};

/** Tier lookup keyed by field name. Built once at module load. */
const TIER_BY_FIELD: Record<string, Tier> = (() => {
  const out: Record<string, Tier> = {};
  for (const tier of Object.keys(ANONYMITY_RULES) as Tier[]) {
    for (const field of ANONYMITY_RULES[tier]) {
      out[field] = tier;
    }
  }
  return out;
})();

/**
 * Returns true when the given viewer is allowed to see the given field
 * based purely on the membership tier. The owner's visibility_settings
 * are applied on top of this (a members-only field can still be hidden
 * if the owner toggled "show_salary" off).
 */
export function canShow(field: string, viewer: Viewer): boolean {
  const tier = TIER_BY_FIELD[field];
  if (!tier) {
    // Unknown field — default to "members only" so we never leak something
    // we didn't think about.
    return viewer.isSignedIn;
  }
  switch (tier) {
    case "public":
      return true;
    case "members_only":
      return viewer.isSignedIn;
    case "aggregate_only":
      return false;
  }
}

/** Default visibility_settings shape stored on profiles.visibility_settings. */
export type VisibilitySettings = {
  show_companies: boolean;
  show_salary: boolean;
  show_skills: boolean;
  show_visa: boolean;
  allow_coffee_chat: boolean;
};

export const DEFAULT_VISIBILITY_SETTINGS: VisibilitySettings = {
  show_companies: false,
  show_salary: false,
  show_skills: true,
  show_visa: false,
  allow_coffee_chat: true,
};
