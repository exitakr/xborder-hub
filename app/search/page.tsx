import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "フロー検索",
};

type Props = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    country?: string; // alias accepted from /home trends, treated as `to`
    industry?: string;
    role?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  return (
    <SearchClient
      isLoggedIn={!!user}
      initial={{
        from: sp.from ?? "",
        // /home links use `country` for the destination filter; map it onto
        // `to` so visitors land on results for that country.
        to: sp.to ?? sp.country ?? "",
        industry: sp.industry ?? "",
        role: sp.role ?? "",
      }}
    />
  );
}
