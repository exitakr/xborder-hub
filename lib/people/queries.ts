import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/app/search/data";
import type { CareerStepRow } from "@/lib/supabase/database.types";

/** Oldest→newest list of company names from a career jsonb array. */
function companiesFromCareer(career: unknown): string {
  if (!Array.isArray(career)) return "—";
  const steps = (career as CareerStepRow[])
    .filter((s) => s && (s.company ?? "").trim())
    .sort((a, b) => {
      const ak = Number(a.startYear || 0) * 100 + Number(a.startMonth || 0);
      const bk = Number(b.startYear || 0) * 100 + Number(b.startMonth || 0);
      return ak - bk;
    })
    .map((s) => s.company.trim());
  return steps.length > 0 ? steps.join(" → ") : "—";
}

const SCHEMA_MISSING = /relation .* does not exist/i;

const HEX_PALETTE: { bg: string; fg: string }[] = [
  { bg: "#0055A4", fg: "#FFF6E8" }, // blue
  { bg: "#4ECDC4", fg: "#0A1F3D" }, // jade
  { bg: "#FFC93C", fg: "#0A1F3D" }, // mustard
  { bg: "#6B4F8E", fg: "#FFF6E8" }, // plum
  { bg: "#0A1F3D", fg: "#FFF6E8" }, // ink
];

function chipFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return HEX_PALETTE[Math.abs(hash) % HEX_PALETTE.length]!;
}

function initialsFor(name: string): string {
  const cleaned = name.replace(/(さん|さま|様)\s*$/, "").trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[0]!)) {
    return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
  }
  return Array.from(cleaned).slice(0, 2).join("");
}

/**
 * Real members from the profiles table, mapped onto the Person card shape
 * used by /search. Members appear when they've set a display name. The
 * current user is excluded (they're injected client-side from the local
 * profile store).
 */
export async function fetchMemberPeople(
  excludeUserId?: string,
): Promise<(Person & { userId: string })[]> {
  try {
    const supabase = await createClient();
    // select("*") so this keeps working before migration 0006 adds the
    // career / tenure columns (naming a missing column would 400).
    let query = supabase
      .from("profiles")
      .select("*")
      .not("display_name", "is", null)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (excludeUserId) query = query.neq("id", excludeUserId);

    const { data, error } = await query;
    if (error) {
      if (!SCHEMA_MISSING.test(error.message)) {
        console.error("[people] fetchMemberPeople", error);
      }
      return [];
    }

    return (data ?? [])
      .filter((row) => (row.display_name ?? "").trim().length > 0)
      .map((row) => {
        const chip = chipFor(row.id);
        const name = row.display_name!.trim();
        const vis = (row.visibility_settings ?? {}) as {
          allow_coffee_chat?: boolean;
          show_companies?: boolean;
        };
        const ccOk = vis.allow_coffee_chat !== false;
        const companies =
          vis.show_companies === false
            ? "—"
            : companiesFromCareer(row.career);
        return {
          userId: row.id,
          initials: initialsFor(name),
          avatarBg: chip.bg,
          avatarText: chip.fg,
          name: `${name} さん`,
          age: row.age ?? 30,
          tenure: row.tenure?.trim()
            ? `在 ${row.to_city ?? row.to_country ?? ""} ${row.tenure}`.trim()
            : row.to_city
              ? `在 ${row.to_city}`
              : "",
          from: row.from_country ?? "Japan",
          fromCity: row.from_city ?? "—",
          to: row.to_country ?? "—",
          toCity: row.to_city ?? row.to_country ?? "—",
          industry: row.industry ?? "—",
          role: row.role ?? "—",
          companies,
          bio: row.bio?.trim() || "プロフィール準備中",
          badge: ccOk ? "⚡ 相談可" : "🔒 受付停止",
        };
      });
  } catch (err) {
    console.error("[people] fetchMemberPeople (catch)", err);
    return [];
  }
}
