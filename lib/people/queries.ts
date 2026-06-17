import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/app/search/data";

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
    // Goes through fetch_member_directory (0007): server-side function
    // that returns only the safe public columns and applies the owner's
    // visibility_settings before returning companies. The base `profiles`
    // table is owner-only at the RLS level since 0007.
    const { data, error } = await supabase.rpc("fetch_member_directory", {
      p_limit: 100,
      p_offset: 0,
    });
    if (error) {
      if (!SCHEMA_MISSING.test(error.message)) {
        console.error("[people] fetchMemberPeople", error);
      }
      return [];
    }

    type Row = {
      id: string;
      display_name: string;
      age: number | null;
      bio: string | null;
      from_country: string | null;
      from_city: string | null;
      to_country: string | null;
      to_city: string | null;
      industry: string | null;
      role: string | null;
      tenure: string | null;
      companies: string | null;
      allow_coffee_chat: boolean;
    };

    return ((data ?? []) as Row[])
      .filter((row) => row.id !== excludeUserId)
      .filter((row) => (row.display_name ?? "").trim().length > 0)
      .map((row) => {
        const chip = chipFor(row.id);
        const name = row.display_name.trim();
        const ccOk = row.allow_coffee_chat !== false;
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
          companies: row.companies ?? "—",
          bio: row.bio?.trim() || "プロフィール準備中",
          badge: ccOk ? "⚡ 相談可" : "🔒 受付停止",
        };
      });
  } catch (err) {
    console.error("[people] fetchMemberPeople (catch)", err);
    return [];
  }
}
