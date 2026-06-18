import type { CareerStep } from "@/lib/profile/store";

/**
 * Career level — gamification signal that rewards career diversity.
 *
 * Rule: Lv = max(distinct value count across the 4 axes
 * country / industry / company / role) over the member's career[].
 * Minimum 1.
 *
 * Examples:
 *  - 1 entry → all axes distinct count = 1 → Lv.1
 *  - Same company/country/industry, different role → roles distinct = 2 → Lv.2
 *  - Two countries, two industries, two roles, one company → max(2,2,1,2) = Lv.2
 *
 * Pure function so it can be reused on the server (RPC parity) and the
 * client (own profile, mypage, AppTopBar) from the same source of truth.
 */
export function careerLevel(career: CareerStep[] | null | undefined): number {
  if (!Array.isArray(career) || career.length === 0) return 1;
  const valid = career.filter(
    (s) =>
      (s.company ?? "").trim() !== "" ||
      (s.country ?? "") !== "" ||
      (s.role ?? "") !== "" ||
      (s.industry ?? "") !== "",
  );
  if (valid.length === 0) return 1;
  const uniq = (sel: (s: CareerStep) => string) =>
    new Set(
      valid
        .map(sel)
        .map((v) => (v ?? "").trim().toLowerCase())
        .filter((v) => v.length > 0),
    ).size;
  return Math.max(
    1,
    uniq((s) => s.country),
    uniq((s) => s.industry),
    uniq((s) => s.company),
    uniq((s) => s.role),
  );
}
