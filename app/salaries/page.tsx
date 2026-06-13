import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { getCurrentProfile } from "@/lib/profiles/getProfile";
import {
  fetchCompEntries,
  fetchCompEntryCount,
  fetchOwnCompRow,
} from "@/lib/compensation/queries";
import { SalariesClient } from "./SalariesClient";

export const metadata: Metadata = {
  title: "年収データ — 越境キャリアのリアルな数字",
  description:
    "国・業界・職種ごとの実年収、家賃、貯蓄率、ビザ、満足度。自分のデータを匿名で投稿すると、先に行った人の全データが見られます。",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    country?: string;
    industry?: string;
    role?: string;
  }>;
};

export default async function SalariesPage({ searchParams }: Props) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  const own = user ? await fetchOwnCompRow() : null;
  const unlocked = !!own;

  const filters = {
    country: sp.country ?? "",
    industry: sp.industry ?? "",
    role: sp.role ?? "",
  };

  const [entries, total, profile] = await Promise.all([
    unlocked ? fetchCompEntries(filters) : Promise.resolve([]),
    fetchCompEntryCount(),
    user ? getCurrentProfile() : Promise.resolve(null),
  ]);

  return (
    <SalariesClient
      isLoggedIn={!!user}
      unlocked={unlocked}
      own={own}
      entries={entries}
      total={total}
      filters={filters}
      profileDefaults={{
        country: profile?.to_country ?? "",
        city: profile?.to_city ?? "",
        industry: profile?.industry ?? "",
        role: profile?.role ?? "",
      }}
    />
  );
}
